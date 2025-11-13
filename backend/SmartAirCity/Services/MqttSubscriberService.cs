//  SPDX-License-Identifier: MIT
//  © 2025 SmartAir City Team
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.

using MQTTnet;
using MQTTnet.Client;
using MQTTnet.Extensions.ManagedClient;
using Microsoft.AspNetCore.SignalR;
using SmartAirCity.Hubs;
using System.Text;
using System.Text.Json;

namespace SmartAirCity.Services;

/// <summary>
/// Background service subscribe MQTT broker để nhận IoT data từ MQ135 sensor
/// </summary>
public class MqttSubscriberService : BackgroundService
{
    private readonly IManagedMqttClient _mqttClient;
    private readonly DataNormalizationService _normalizationService;
    private readonly AirQualityService _airQualityService;
    private readonly IHubContext<AirQualityHub> _signalRHub;
    private readonly IConfiguration _configuration;
    private readonly ILogger<MqttSubscriberService> _logger;

    public MqttSubscriberService(
        DataNormalizationService normalizationService,
        AirQualityService airQualityService,
        IHubContext<AirQualityHub> signalRHub,
        IConfiguration configuration,
        ILogger<MqttSubscriberService> logger)
    {
        _normalizationService = normalizationService;
        _airQualityService = airQualityService;
        _signalRHub = signalRHub;
        _configuration = configuration;
        _logger = logger;
        
        var factory = new MqttFactory();
        _mqttClient = factory.CreateManagedMqttClient();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Đọc config từ appsettings.json - KHÔNG CÓ DEFAULT VALUES
        var brokerHost = _configuration["MQTT:BrokerHost"];
        var brokerPortStr = _configuration["MQTT:BrokerPort"];
        var username = _configuration["MQTT:Username"];
        var password = _configuration["MQTT:Password"];
        var topic = _configuration["MQTT:Topic"];

        // Validate required configurations
        if (string.IsNullOrEmpty(brokerHost) || 
            string.IsNullOrEmpty(username) || 
            string.IsNullOrEmpty(password))
        {
            _logger.LogError("   MQTT configuration is missing!");
            _logger.LogError("   Required: MQTT:BrokerHost, MQTT:Username, MQTT:Password");
            _logger.LogError("   Configure via appsettings.json or environment variables");
            throw new InvalidOperationException("MQTT configuration is incomplete. Check appsettings.json or environment variables.");
        }

        if (!int.TryParse(brokerPortStr, out var brokerPort))
        {
            brokerPort = 1883; // Default MQTT port nếu không config
        }

        if (string.IsNullOrEmpty(topic))
        {
            topic = "air/quality/hanoi/mq135"; // Default topic
        }

        _logger.LogInformation("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        _logger.LogInformation("MQTT Configuration:");
        _logger.LogInformation("    Broker: {Host}:{Port}", brokerHost, brokerPort);
        _logger.LogInformation("    Username: {User}", username);
        _logger.LogInformation("    Password: {Pass}", new string('*', password.Length));
        _logger.LogInformation("    Topic: {Topic}", topic);
        _logger.LogInformation("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        // MQTT client options
        var clientOptions = new MqttClientOptionsBuilder()
            .WithTcpServer(brokerHost, brokerPort)
            .WithCredentials(username, password)
            .WithClientId($"SmartAirCity-Backend-{Guid.NewGuid()}")
            .WithCleanSession()
            .WithKeepAlivePeriod(TimeSpan.FromSeconds(60))
            .Build();

        var managedOptions = new ManagedMqttClientOptionsBuilder()
            .WithClientOptions(clientOptions)
            .WithAutoReconnectDelay(TimeSpan.FromSeconds(5))
            .Build();

        // Subscribe to message received event
        _mqttClient.ApplicationMessageReceivedAsync += async e => await OnMqttMessageReceived(e);

       
        _mqttClient.ConnectedAsync += async e =>
        {
            _logger.LogInformation("MQTT CLIENT AUTHENTICATED SUCCESSFULLY!");
            _logger.LogInformation("Now listening for messages on topic: {Topic}", topic);
            await Task.CompletedTask;
        };

        _mqttClient.DisconnectedAsync += async e =>
        {
            _logger.LogWarning("MQTT DISCONNECTED!");
            _logger.LogWarning("   Reason: {Reason}", e.Reason);
            _logger.LogWarning("   Will retry in 5 seconds...");
            await Task.CompletedTask;
        };

        _mqttClient.ConnectingFailedAsync += async e =>
        {
            _logger.LogError("MQTT CONNECTION FAILED!");
            _logger.LogError("   Error: {Message}", e.Exception?.Message);
            _logger.LogError("   Check username/password and broker status!");
            await Task.CompletedTask;
        };

        try
        {
            // Start MQTT client
            _logger.LogInformation("Starting MQTT connection...");
            await _mqttClient.StartAsync(managedOptions);
            _logger.LogInformation("MQTT client started, attempting to connect...");

            // Subscribe to topic
            await _mqttClient.SubscribeAsync(new[]
            {
                new MqttTopicFilterBuilder()
                    .WithTopic(topic)
                    .WithAtLeastOnceQoS()
                    .Build()
            });
            
            _logger.LogInformation("Subscribed to MQTT topic: {Topic}", topic);
            _logger.LogInformation("Waiting for authentication and IoT messages...");

    
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to MQTT broker");
            throw;
        }
    }

    private async Task OnMqttMessageReceived(MqttApplicationMessageReceivedEventArgs e)
    {
        try
        {
            // Parse message payload
            var payload = Encoding.UTF8.GetString(e.ApplicationMessage.PayloadSegment);
            
            _logger.LogInformation("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            _logger.LogInformation("[STEP 1/8] MQTT MESSAGE RECEIVED!");
            _logger.LogInformation("       Topic: {Topic}", e.ApplicationMessage.Topic);
            _logger.LogInformation("       Size: {Size} bytes", payload.Length);
            _logger.LogInformation("       Payload:\n{Payload}", payload);

            // Parse JSON từ IoT device
            _logger.LogInformation("[STEP 2/8] Parsing JSON...");
            var jsonDoc = JsonDocument.Parse(payload);
            _logger.LogInformation("[STEP 2/8] JSON parsed successfully");

            // Normalize IoT data + Merge với OpenAQ
            _logger.LogInformation("[STEP 3/8] Fetching OpenAQ data and merging...");
            var mergedData = await _normalizationService.NormalizeAndMergeAsync(jsonDoc.RootElement);
            _logger.LogInformation("[STEP 4/8] Data merged successfully");

            // Lưu vào MongoDB
            _logger.LogInformation("[STEP 5/8] Saving to MongoDB...");
            await _airQualityService.InsertAsync(mergedData);
            _logger.LogInformation("[STEP 6/8] Saved to MongoDB with ID: {Id}", mergedData.Id);

            // PUSH qua SignalR tới tất cả clients
            _logger.LogInformation("[STEP 7/8] Pushing to SignalR clients...");
            await _signalRHub.Clients.All.SendAsync("NewAirQualityData", mergedData);
            _logger.LogInformation("[STEP 8/8] SUCCESS! Data pushed to all SignalR clients");
            _logger.LogInformation("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "JSON Parse Error! Invalid JSON format");
            _logger.LogError("   Topic: {Topic}", e.ApplicationMessage.Topic);
            _logger.LogError("   Payload: {Payload}", Encoding.UTF8.GetString(e.ApplicationMessage.PayloadSegment));
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "OpenAQ API Error! Failed to fetch external data");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing MQTT message from topic: {Topic}", e.ApplicationMessage.Topic);
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("⏹️ Stopping MQTT Subscriber...");
        await _mqttClient.StopAsync();
        _mqttClient.Dispose();
        await base.StopAsync(cancellationToken);
    }
}