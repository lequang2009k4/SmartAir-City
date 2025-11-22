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

using SmartAirCity.Data;
using SmartAirCity.Services;
using SmartAirCity.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// MongoDB
builder.Services.AddSingleton<MongoDbContext>();
builder.Services.AddScoped<AirQualityService>();

// OpenAQ
builder.Services.AddHttpClient();
builder.Services.AddScoped<OpenAQLiveClient>();

// Data Normalization
builder.Services.AddScoped<DataNormalizationService>();

// MQTT Subscriber
builder.Services.AddHostedService<MqttSubscriberService>();

// SignalR
builder.Services.AddSignalR();

// Doc AllowedOrigins tu appsettings.json
var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)  
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();           
    });
});

var app = builder.Build();

// Swagger

    app.UseSwagger();
    app.UseSwaggerUI();



app.UseCors();  

app.UseRouting();
app.UseAuthorization();

// MAP ENDPOINTS
app.MapControllers();

// Anh xa SignalR Hub vao duong dan /airqualityhub
app.MapHub<AirQualityHub>("/airqualityhub");

Console.WriteLine("SignalR Hub mapped at: /airqualityhub");
Console.WriteLine($"Application started. Listening on: {builder.Configuration["urls"] ?? "http://localhost:5000"}");

app.Run();