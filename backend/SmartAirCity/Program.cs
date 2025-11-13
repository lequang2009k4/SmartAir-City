//  SPDX-License-Identifier: MIT
//  © 2025 SmartAir City Team
 
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
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

// ĐỌC AllowedOrigins TỪ appsettings.json
var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();

// CORS - SỬA LẠI ĐÚNG
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


// THỨ TỰ MIDDLEWARE ĐÚNG
app.UseCors();  

app.UseRouting();
app.UseAuthorization();

// MAP ENDPOINTS
app.MapControllers();
app.MapHub<AirQualityHub>("/airqualityhub");

Console.WriteLine("SignalR Hub mapped at: /airqualityhub");
Console.WriteLine($"Application started. Listening on: {builder.Configuration["urls"] ?? "http://localhost:5000"}");

app.Run();