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

namespace SmartAirCity.Services;

public class MqttSubscriberService : BackgroundService
{
    private readonly IManagedMqttClient _mqttClient;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<AirQualityHub> _signalRHub;
    private readonly IConfiguration _configuration;
    private readonly ILogger<MqttSubscriberService> _logger;

    public MqttSubscriberService(
        IServiceScopeFactory scopeFactory,
        IHubContext<AirQualityHub> signalRHub,
        IConfiguration configuration,
        ILogger<MqttSubscriberService> logger)
    {
        _scopeFactory = scopeFactory;
        _signalRHub = signalRHub;
        _configuration = configuration;
        _logger = logger;

        var factory = new MqttFactory();
        _mqttClient = factory.CreateManagedMqttClient();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Doc cau hinh tu appsettings.json - khong hardcode
        var host = _configuration["MQTT:BrokerHost"];
        if (string.IsNullOrEmpty(host))
        {
            var errorMsg = "Cau hinh MQTT:BrokerHost khong duoc tim thay trong appsettings.json. Vui long cau hinh trong appsettings.json";
            _logger.LogError(errorMsg);
            throw new InvalidOperationException(errorMsg);
        }
        
        // Doc port tu config - khong hardcode
        var portStr = _configuration["MQTT:BrokerPort"];
        if (string.IsNullOrEmpty(portStr) || !int.TryParse(portStr, out var port) || port <= 0)
        {
            var errorMsg = "Cau hinh MQTT:BrokerPort khong hop le hoac khong duoc tim thay trong appsettings.json. Vui long cau hinh trong appsettings.json";
            _logger.LogError(errorMsg);
            throw new InvalidOperationException(errorMsg);
        }
        
        var username = _configuration["MQTT:Username"];
        if (string.IsNullOrEmpty(username))
        {
            var errorMsg = "Cau hinh MQTT:Username khong duoc tim thay trong appsettings.json. Vui long cau hinh trong appsettings.json";
            _logger.LogError(errorMsg);
            throw new InvalidOperationException(errorMsg);
        }
        
        var password = _configuration["MQTT:Password"];
        if (string.IsNullOrEmpty(password))
        {
            var errorMsg = "Cau hinh MQTT:Password khong duoc tim thay trong appsettings.json. Vui long cau hinh trong appsettings.json";
            _logger.LogError(errorMsg);
            throw new InvalidOperationException(errorMsg);
        }
        
        // Doc danh sach topics tu config - khong hardcode
        var topics = _configuration.GetSection("MQTT:Topics").Get<string[]>();
        if (topics == null || topics.Length == 0)
        {
            // Fallback: thu doc Topic cu (backward compatible)
            var singleTopic = _configuration["MQTT:Topic"];
            if (!string.IsNullOrEmpty(singleTopic))
            {
                topics = new[] { singleTopic };
                _logger.LogInformation("Su dung MQTT:Topic (backward compatible): {Topic}", singleTopic);
            }
            else
            {
                var errorMsg = "Cau hinh MQTT:Topics hoac MQTT:Topic khong duoc tim thay trong appsettings.json. Vui long cau hinh trong appsettings.json";
                _logger.LogError(errorMsg);
                throw new InvalidOperationException(errorMsg);
            }
        }

        // Su kien khi ket noi thanh cong
        _mqttClient.ConnectedAsync += async e =>
        {
            _logger.LogInformation("Da ket noi MQTT thanh cong toi {Host}:{Port}", host, port);
            
            // Subscribe SAU KHI da ket noi thanh cong
            foreach (var topic in topics)
            {
                await _mqttClient.SubscribeAsync(topic);
                _logger.LogInformation("Subscribed to MQTT topic: {Topic}", topic);
            }
            
            _logger.LogInformation("Total subscribed to {Count} MQTT topics", topics.Length);
        };

        // Su kien khi mat ket noi
        _mqttClient.DisconnectedAsync += async e =>
        {
            _logger.LogError("Mat ket noi MQTT! Ly do: {Reason}", e.Reason);
            await Task.CompletedTask;
        };

        // Su kien khi nhan message
        _mqttClient.ApplicationMessageReceivedAsync += async args =>
        {
            var payload = Encoding.UTF8.GetString(args.ApplicationMessage.PayloadSegment);
            _logger.LogInformation("Nhan MQTT MESSAGE tu topic {Topic}: {Payload}", 
                args.ApplicationMessage.Topic, payload);
            
            // goi ham xu ly message
            await HandleMqttMessageAsync(args);
        };

        var clientOpts = new MqttClientOptionsBuilder()
            .WithTcpServer(host, port)
            .WithCredentials(username, password)
            .WithCleanSession()
            .WithKeepAlivePeriod(TimeSpan.FromSeconds(60))
            .Build();

        var managedOpts = new ManagedMqttClientOptionsBuilder()
            .WithClientOptions(clientOpts)
            .WithAutoReconnectDelay(TimeSpan.FromSeconds(5))
            .Build();

        _logger.LogInformation("Dang khoi dong MQTT client ket noi toi {Host}:{Port}...", host, port);
        await _mqttClient.StartAsync(managedOpts);

        await Task.Delay(Timeout.Infinite, stoppingToken);
    }

    private async Task HandleMqttMessageAsync(MqttApplicationMessageReceivedEventArgs e)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var normalization = scope.ServiceProvider.GetRequiredService<DataNormalizationService>();
            var airQualitySvc = scope.ServiceProvider.GetRequiredService<AirQualityService>();

            // Xac dinh tram tu topic
            var topic = e.ApplicationMessage.Topic;
            var stationId = ExtractStationIdFromTopic(topic);
            var (lat, lon, locationId, stationName) = GetStationInfo(stationId);
            
            _logger.LogInformation("Processing message from station: {StationName} (ID: {StationId}), Topic: {Topic}", 
                stationName, stationId, topic);

            // doc json tu iot
            var payload = Encoding.UTF8.GetString(e.ApplicationMessage.PayloadSegment);
            _logger.LogInformation("MQTT Payload: {Payload}", payload);

            var jsonDoc = JsonDocument.Parse(payload);

            // chuan hoa va hop nhat - truyen thong tin tram vao
            var merged = await normalization.NormalizeAndMergeAsync(
                jsonDoc.RootElement,
                lat,
                lon,
                locationId,
                stationId  // Truyen stationId de lay sensor mapping rieng
            );

            // luu vao db
            await airQualitySvc.InsertAsync(merged);

            // Push len SignalR
            await _signalRHub.Clients.All.SendAsync("NewAirQualityData", merged);

            _logger.LogInformation("Message processed OK for station: {StationName}", stationName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling MQTT message from topic: {Topic}", e.ApplicationMessage.Topic);
        }
    }

    /// <summary>
    /// Trich xuat station ID tu MQTT topic
    /// Vd: "air/quality/hcm/cmt8" -> "hcm-cmt8"
    ///        "air/quality/hanoi/mq135" -> "hanoi-mq135"
    /// </summary>
    private string ExtractStationIdFromTopic(string topic)
    {
        try
        {
            // Topic format: "air/quality/{city}/{location}" (vd: "air/quality/hcm/cmt8")
            var parts = topic.Split('/');
            if (parts.Length >= 4)
            {
                var city = parts[2];     // "hcm", "hanoi"
                var location = parts[3];  // "cmt8", "carecentre", "mq135"
                return $"{city}-{location}";
            }
            
            // Fallback
            _logger.LogWarning("Cannot extract station ID from topic: {Topic}", topic);
            return "unknown";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting station ID from topic: {Topic}", topic);
            return "unknown";
        }
    }

    /// <summary>
    /// Lay thong tin tram tu config dua vao station ID
    /// </summary>
    private (double Latitude, double Longitude, int LocationId, string StationName) GetStationInfo(string stationId)
    {
        try
        {
            var name = _configuration[$"StationMapping:{stationId}:Name"];
            var lat = _configuration.GetValue<double>($"StationMapping:{stationId}:Latitude");
            var lon = _configuration.GetValue<double>($"StationMapping:{stationId}:Longitude");
            var locationId = _configuration.GetValue<int>($"StationMapping:{stationId}:OpenAQLocationId");
            
            if (!string.IsNullOrEmpty(name) && lat != 0 && lon != 0 && locationId != 0)
            {
                _logger.LogDebug("Found station config: {StationId} -> {Name}, Lat={Lat}, Lon={Lon}, LocationId={LocationId}", 
                    stationId, name, lat, lon, locationId);
                return (lat, lon, locationId, name);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error reading station config for: {StationId}", stationId);
        }
        
        // KHONG FALLBACK: Neu khong tim thay config, tra ve 0 de khong goi OpenAQ
        // Tranh tinh trang nhieu tram dung chung OpenAQLocationId default
        _logger.LogWarning("Tram {StationId} khong tim thay trong StationMapping, KHONG goi OpenAQ API (locationId = 0)", stationId);
        
        return (0, 0, 0, $"Unknown Station ({stationId})");
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Stopping MQTT...");
        await _mqttClient.StopAsync();
        _mqttClient.Dispose();
        await base.StopAsync(cancellationToken);
    }
}
