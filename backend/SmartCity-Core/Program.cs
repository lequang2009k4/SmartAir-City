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
using MyMongoApi.Services;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://127.0.0.1:8080");

builder.Services.Configure<MongoDbSettings>(
builder.Configuration.GetSection("MongoDbSettings"));
// Đăng ký dịch vụ MQTT client
builder.Services.AddSingleton<IMqttClient>(provider =>
{
    var factory = new MqttFactory();
    var client = factory.CreateMqttClient();

    var host = builder.Configuration["MQTT:BrokerHost"];
    var port = int.Parse(builder.Configuration["MQTT:BrokerPort"] ?? "1883");
    var user = builder.Configuration["MQTT:Username"];
    var password = builder.Configuration["MQTT:Password"];


    var options = new MqttClientOptionsBuilder()
        .WithTcpServer(host, port) // Broker địa chỉ
        .WithCredentials(user, password) // User và Password
        .Build();

    client.ConnectAsync(options).Wait(); // Kết nối ngay khi ứng dụng khởi động

    return client;  // Trả về client dưới dạng singleton
});

builder.Services.AddSingleton<UserService>();
builder.Services.AddSingleton<DeviceService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReactApp");

app.MapControllers();
app.Run();
