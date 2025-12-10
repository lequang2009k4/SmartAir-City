/*
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


using SmartAirCity.Data;
using SmartAirCity.Services;
using SmartAirCity.Hubs;
using SmartAirCity.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSmartAirSwagger();

// MongoDB
builder.Services.AddSingleton<MongoDbContext>();
builder.Services.AddScoped<AirQualityService>();

// Station Service (lấy danh sách stations từ config + DB)
builder.Services.AddScoped<StationService>();

// Services for Contributions
builder.Services.AddScoped<ContributedDataService>();
builder.Services.AddScoped<ContributionValidationService>();
builder.Services.AddHttpClient<UserDirectoryClient>();

// OpenAQ
builder.Services.AddHttpClient();
builder.Services.AddScoped<OpenAQLiveClient>();

// Data Normalization
builder.Services.AddScoped<DataNormalizationService>();

// External Data Sources (HTTP)
builder.Services.AddScoped<ExternalSourceService>();
builder.Services.AddScoped<ExternalAirQualityService>();
builder.Services.AddHostedService<ExternalDataPullService>();

// External Data Sources (MQTT)
builder.Services.AddScoped<ExternalMqttSourceService>();
builder.Services.AddHostedService<ExternalMqttSubscriberService>();

// MQTT Subscriber (Main broker) - Trạm của bạn (merge OpenAQ)
builder.Services.AddHostedService<MqttSubscriberService>();

// SignalR
builder.Services.AddSignalR();

// CORS
var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();

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

// Static Files (wwwroot) - Removed for API-only backend
// app.UseStaticFiles();

// Endpoints
app.MapControllers();
app.MapHub<AirQualityHub>("/airqualityhub");

// Auto-migrate stations from config to database (chỉ chạy 1 lần khi DB rỗng)
using (var scope = app.Services.CreateScope())
{
    var stationService = scope.ServiceProvider.GetRequiredService<StationService>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    try
    {
        await stationService.MigrateStationsFromConfigAsync();
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error during station migration");
    }
}

Console.WriteLine("SmartAir City API Started");

app.Run();