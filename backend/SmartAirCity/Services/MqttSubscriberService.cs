/**
 *  SmartAir City – IoT Platform for Urban Air Quality Monitoring
 *  based on NGSI-LD and FiWARE Standards
 *
 *  SPDX-License-Identifier: MIT
 *  @version   0.1.x
 *  @author    SmartAir City Team <smartaircity@gmail.com>
 *  @copyright © 2025 SmartAir City Team. 
 *  @license   MIT License
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
        var host = _configuration["MQTT:BrokerHost"];
        var port = int.TryParse(_configuration["MQTT:BrokerPort"], out var p) ? p : 1883;
        var username = _configuration["MQTT:Username"];
        var password = _configuration["MQTT:Password"];
        var topic = _configuration["MQTT:Topic"] ?? "air/quality/hanoi/mq135";

        if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
        {
            _logger.LogError("MQTT config missing!");
            return;
        }

        // dang ki su kien message , khi co message den se goi ham xu ly
        _mqttClient.ApplicationMessageReceivedAsync += async args =>
        {
            // goi ham xu ly message
            await HandleMqttMessageAsync(args);  
            return;
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

        await _mqttClient.StartAsync(managedOpts);
        await _mqttClient.SubscribeAsync(topic);

        _logger.LogInformation("Subscribed to MQTT topic: {Topic}", topic);

        await Task.Delay(Timeout.Infinite, stoppingToken);
    }

    private async Task HandleMqttMessageAsync(MqttApplicationMessageReceivedEventArgs e)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var normalization = scope.ServiceProvider.GetRequiredService<DataNormalizationService>();
            var airQualitySvc = scope.ServiceProvider.GetRequiredService<AirQualityService>();

            // doc json tu iot
            var payload = Encoding.UTF8.GetString(e.ApplicationMessage.PayloadSegment);
            _logger.LogInformation("MQTT Payload: {Payload}", payload);

            var jsonDoc = JsonDocument.Parse(payload);

            // chuan hoa va hop nhat
            var merged = await normalization.NormalizeAndMergeAsync(jsonDoc.RootElement);

            // luu vao db
            await airQualitySvc.InsertAsync(merged);

            // Push len SignalR
            await _signalRHub.Clients.All.SendAsync("NewAirQualityData", merged);

            _logger.LogInformation("Message processed OK");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling MQTT message");
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Stopping MQTT...");
        await _mqttClient.StopAsync();
        _mqttClient.Dispose();
        await base.StopAsync(cancellationToken);
    }
}
