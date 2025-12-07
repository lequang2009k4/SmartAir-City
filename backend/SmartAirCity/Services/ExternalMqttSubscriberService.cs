/**
 *  SmartAir City – IoT Platform for Urban Air Quality Monitoring
 *  based on NGSI-LD and FiWARE Standards
 *
 *  SPDX-License-Identifier: MIT
 *  @version   0.1.x
 *  @author    SmartAir City Team <smartaircity@gmail.com>
 *  @copyright © 2025 SmartAir City Team. 
 *  @license   MIT License
 *  See LICENSE file in root directory for full license text.
 *  @see       https://github.com/lequang2009k4/SmartAir-City   SmartAir City Open Source Project
 *
 *  This software is an open-source component of the SmartAir City initiative.
 *  It provides real-time environmental monitoring, NGSI-LD–compliant data
 *  models, MQTT-based data ingestion, and FiWARE Smart Data Models for
 *  open-data services and smart-city applications.
 */

using MQTTnet;
using MQTTnet.Client;
using MQTTnet.Extensions.ManagedClient;
using Microsoft.AspNetCore.SignalR;
using System.Text;
using System.Text.Json;
using SmartAirCity.Hubs;
using SmartAirCity.Models;
using MongoDB.Bson;

namespace SmartAirCity.Services;

/// <summary>
/// Background Service để subscribe MQTT từ nhiều broker bên ngoài
/// Tương tự OpenSenseMap - cho phép user đăng ký broker của họ
/// </summary>
public class ExternalMqttSubscriberService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ExternalMqttSubscriberService> _logger;
    private readonly Dictionary<string, IManagedMqttClient> _mqttClients = new();
    private readonly SemaphoreSlim _clientsLock = new(1, 1);

    public ExternalMqttSubscriberService(
        IServiceProvider serviceProvider,
        ILogger<ExternalMqttSubscriberService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("External MQTT Subscriber Service is starting.");

        // Wait a bit for other services to initialize
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

        // Cleanup any corrupted documents from previous runs
        try
        {
            using var cleanupScope = _serviceProvider.CreateScope();
            var airQualityService = cleanupScope.ServiceProvider.GetRequiredService<ExternalAirQualityService>();
            var deletedCount = await airQualityService.CleanupNullIdsAsync();
            if (deletedCount > 0)
            {
                _logger.LogWarning("Cleaned up {Count} corrupted documents with null _id", deletedCount);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during cleanup of corrupted documents");
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SyncMqttClientsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while syncing MQTT clients.");
            }

            // Check for new sources every 30 seconds
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }

    private async Task SyncMqttClientsAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var sourceService = scope.ServiceProvider.GetRequiredService<ExternalMqttSourceService>();

        var sources = await sourceService.GetActiveAsync();

        await _clientsLock.WaitAsync(stoppingToken);
        try
        {
            var hasChanges = false;
            var previousCount = _mqttClients.Count;

            // Remove clients for deleted sources
            var sourcesToRemove = _mqttClients.Keys.Except(sources.Select(s => s.Id!)).ToList();
            foreach (var sourceId in sourcesToRemove)
            {
                await DisconnectClientAsync(sourceId);
                hasChanges = true;
            }

            // Add/Update clients for active sources
            foreach (var source in sources)
            {
                if (source.Id == null) continue;

                if (!_mqttClients.ContainsKey(source.Id))
                {
                    await ConnectClientAsync(source, stoppingToken);
                    hasChanges = true;
                }
            }

            // Only log when there are changes
            if (hasChanges)
            {
                _logger.LogInformation("MQTT clients synced. Active: {Count} (was {Previous})", _mqttClients.Count, previousCount);
            }
        }
        finally
        {
            _clientsLock.Release();
        }
    }

    private async Task ConnectClientAsync(ExternalMqttSource source, CancellationToken stoppingToken)
    {
        try
        {
            _logger.LogInformation("Connecting to external MQTT broker: {Name} ({Host}:{Port})", 
                source.Name, source.BrokerHost, source.BrokerPort);

            var factory = new MqttFactory();
            var client = factory.CreateManagedMqttClient();

            // Configure MQTT client options
            var clientOptionsBuilder = new MqttClientOptionsBuilder()
                .WithTcpServer(source.BrokerHost, source.BrokerPort)
                .WithClientId($"smartaircity-{source.Id}")
                .WithCleanSession()
                .WithKeepAlivePeriod(TimeSpan.FromSeconds(60));

            // Add credentials if provided
            if (!string.IsNullOrEmpty(source.Username) && !string.IsNullOrEmpty(source.Password))
            {
                clientOptionsBuilder.WithCredentials(source.Username, source.Password);
            }

            // Add TLS if enabled
            if (source.UseTls)
            {
                clientOptionsBuilder.WithTlsOptions(o => o.UseTls());
            }

            var clientOptions = clientOptionsBuilder.Build();

            var managedOptions = new ManagedMqttClientOptionsBuilder()
                .WithClientOptions(clientOptions)
                .WithAutoReconnectDelay(TimeSpan.FromSeconds(5))
                .Build();

            // Event handlers
            client.ConnectedAsync += async args =>
            {
                _logger.LogInformation("Connected to {Name} - subscribing to topic: {Topic}", 
                    source.Name, source.Topic);

                await client.SubscribeAsync(source.Topic);

                // Update connection status
                using var scope = _serviceProvider.CreateScope();
                var sourceService = scope.ServiceProvider.GetRequiredService<ExternalMqttSourceService>();
                await sourceService.UpdateConnectionStatusAsync(source.Id!, true);
            };

            client.DisconnectedAsync += async args =>
            {
                _logger.LogWarning("Disconnected from {Name}: {Reason}", 
                    source.Name, args.Reason);

                // Update connection status
                using var scope = _serviceProvider.CreateScope();
                var sourceService = scope.ServiceProvider.GetRequiredService<ExternalMqttSourceService>();
                await sourceService.UpdateConnectionStatusAsync(source.Id!, false, args.Reason.ToString());
            };

            client.ApplicationMessageReceivedAsync += async args =>
            {
                await HandleMessageAsync(args, source);
            };

            // Start client
            await client.StartAsync(managedOptions);

            // Store client
            _mqttClients[source.Id!] = client;

            _logger.LogInformation("Successfully created MQTT client for: {Name}", source.Name);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to {Name} ({Host}:{Port})", 
                source.Name, source.BrokerHost, source.BrokerPort);

            // Update error status
            using var scope = _serviceProvider.CreateScope();
            var sourceService = scope.ServiceProvider.GetRequiredService<ExternalMqttSourceService>();
            await sourceService.UpdateConnectionStatusAsync(source.Id!, false, ex.Message);
        }
    }

    private async Task DisconnectClientAsync(string sourceId)
    {
        if (_mqttClients.TryGetValue(sourceId, out var client))
        {
            _logger.LogInformation("Disconnecting MQTT client: {SourceId}", sourceId);

            await client.StopAsync();
            client.Dispose();
            _mqttClients.Remove(sourceId);
        }
    }

    private async Task HandleMessageAsync(MqttApplicationMessageReceivedEventArgs e, ExternalMqttSource source)
    {
        try
        {
            var payload = Encoding.UTF8.GetString(e.ApplicationMessage.PayloadSegment);
            _logger.LogDebug("Received message from {Name}: {Payload}", source.Name, payload);

            // Parse JSON message
            var jsonDoc = JsonDocument.Parse(payload);
            var root = jsonDoc.RootElement;

            // Extract measurements from NGSI-LD format
            // Format: {"airQualityIndex": {"type":"Property","value":113.0,"unitCode":"P1"}, ...}
            var properties = new Dictionary<string, object>();

            foreach (var prop in root.EnumerateObject())
            {
                // Skip non-measurement properties
                if (prop.Name.StartsWith("@") || prop.Name == "id" || prop.Name == "type" || 
                    prop.Name.StartsWith("sosa:") || prop.Name == "dateObserved" || prop.Name == "location")
                    continue;

                // Case 1: Direct number value (simple format)
                if (prop.Value.ValueKind == JsonValueKind.Number)
                {
                    var value = prop.Value.GetDouble();
                    var unitCode = GetUnitCode(prop.Name);

                    var numericProp = new NumericProperty
                    {
                        Type = "Property",
                        Value = value,
                        UnitCode = unitCode,
                        ObservedAt = DateTime.UtcNow
                    };

                    properties[prop.Name] = numericProp.ToBsonDocument();
                }
                // Case 2: NGSI-LD Property format {"type":"Property","value":123.0}
                else if (prop.Value.ValueKind == JsonValueKind.Object &&
                         prop.Value.TryGetProperty("value", out var valueElem) &&
                         valueElem.ValueKind == JsonValueKind.Number)
                {
                    var value = valueElem.GetDouble();
                    var unitCode = prop.Value.TryGetProperty("unitCode", out var unitElem) 
                        ? unitElem.GetString() ?? GetUnitCode(prop.Name)
                        : GetUnitCode(prop.Name);

                    var numericProp = new NumericProperty
                    {
                        Type = "Property",
                        Value = value,
                        UnitCode = unitCode,
                        ObservedAt = DateTime.UtcNow
                    };

                    properties[prop.Name] = numericProp.ToBsonDocument();
                }
            }

            // External MQTT sources: Chi luu du lieu tu MQTT, khong goi OpenAQ
            // Vi day la tram ben ngoai do user dang ky, du lieu da co san tu sensor cua ho

            if (properties.Count == 0)
            {
                _logger.LogWarning("No measurements found in message from {Name}", source.Name);
                return;
            }

            // Create NGSI-LD entity
            var ngsiId = $"urn:ngsi-ld:AirQualityObserved:{source.StationId}:{DateTime.UtcNow:yyyyMMddHHmmss}";

            var airQuality = new ExternalAirQuality
            {
                Id = ngsiId,
                Type = "AirQualityObserved",
                MadeBySensor = new Relationship
                {
                    Object = $"urn:ngsi-ld:ExternalMqttSource:{source.Id}"
                },
                ObservedProperty = new Relationship
                {
                    Object = "AirQuality"
                },
                HasFeatureOfInterest = new Relationship
                {
                    Object = $"urn:ngsi-ld:Air:external-mqtt-{source.StationId}"
                },
                Location = new LocationProperty
                {
                    Value = new GeoValue
                    {
                        Coordinates = new[] { source.Longitude, source.Latitude }
                    }
                },
                DateObserved = new DateTimeProperty
                {
                    Value = DateTime.UtcNow
                },
                Properties = properties,
                ExternalMetadata = new ExternalMetadata
                {
                    SourceName = source.Name,
                    SourceUrl = $"mqtt://{source.BrokerHost}:{source.BrokerPort}",
                    FetchedAt = DateTime.UtcNow
                }
            };

            // Save to MongoDB
            using var scope = _serviceProvider.CreateScope();
            var airQualityService = scope.ServiceProvider.GetRequiredService<ExternalAirQualityService>();
            var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<AirQualityHub>>();
            var sourceService = scope.ServiceProvider.GetRequiredService<ExternalMqttSourceService>();

            // Use Upsert to prevent duplicates (same timestamp = same data)
            await airQualityService.UpsertAsync(airQuality);

            // Push to SignalR - Convert BsonDocument to JSON-safe format
            var signalRData = ConvertToSignalRSafe(airQuality);
            await hubContext.Clients.All.SendAsync("NewExternalMqttData", signalRData);

            // Update message count
            await sourceService.UpdateLastMessageAsync(source.Id!);

            _logger.LogInformation("Saved data from {Name}: {Count} measurements", 
                source.Name, properties.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling message from {Name}", source.Name);
        }
    }

    private string GetUnitCode(string parameterName)
    {
        return parameterName.ToLower() switch
        {
            "pm25" or "pm2.5" or "pm10" or "pm1" => "GQ", // µg/m³
            "o3" or "ozone" => "GQ",
            "no2" or "so2" or "co" => "GQ",
            "temperature" or "temp" => "CEL", // °C
            "humidity" => "P1", // %
            "pressure" => "A97", // hPa
            _ => "E30" // dimensionless
        };
    }

    /// <summary>
    /// Convert ExternalAirQuality to JSON-safe format for SignalR
    /// BsonDocument cannot be directly serialized by System.Text.Json
    /// </summary>
    private object ConvertToSignalRSafe(ExternalAirQuality data)
    {
        var result = new Dictionary<string, object?>
        {
            ["id"] = data.Id,
            ["type"] = data.Type,
            ["@context"] = data.Context,
            ["sosa:madeBySensor"] = data.MadeBySensor,
            ["sosa:observedProperty"] = data.ObservedProperty,
            ["sosa:hasFeatureOfInterest"] = data.HasFeatureOfInterest,
            ["location"] = data.Location,
            ["dateObserved"] = data.DateObserved,
            ["externalMetadata"] = data.ExternalMetadata
        };

        // Convert BsonDocument properties to simple objects
        if (data.Properties != null)
        {
            foreach (var kvp in data.Properties)
            {
                if (kvp.Value is BsonDocument bsonDoc)
                {
                    // Convert BsonDocument to Dictionary
                    result[kvp.Key] = BsonDocumentToDict(bsonDoc);
                }
                else
                {
                    result[kvp.Key] = kvp.Value;
                }
            }
        }

        return result;
    }

    private Dictionary<string, object?> BsonDocumentToDict(BsonDocument doc)
    {
        var dict = new Dictionary<string, object?>();
        foreach (var elem in doc)
        {
            dict[elem.Name] = BsonValueToObject(elem.Value);
        }
        return dict;
    }

    private object? BsonValueToObject(BsonValue value)
    {
        return value.BsonType switch
        {
            BsonType.String => value.AsString,
            BsonType.Int32 => value.AsInt32,
            BsonType.Int64 => value.AsInt64,
            BsonType.Double => value.AsDouble,
            BsonType.Boolean => value.AsBoolean,
            BsonType.DateTime => value.ToUniversalTime(),
            BsonType.Null => null,
            BsonType.Document => BsonDocumentToDict(value.AsBsonDocument),
            BsonType.Array => value.AsBsonArray.Select(BsonValueToObject).ToList(),
            _ => value.ToString()
        };
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Stopping External MQTT Subscriber Service...");

        await _clientsLock.WaitAsync(cancellationToken);
        try
        {
            foreach (var kvp in _mqttClients)
            {
                await kvp.Value.StopAsync();
                kvp.Value.Dispose();
            }
            _mqttClients.Clear();
        }
        finally
        {
            _clientsLock.Release();
        }

        await base.StopAsync(cancellationToken);
    }
}
