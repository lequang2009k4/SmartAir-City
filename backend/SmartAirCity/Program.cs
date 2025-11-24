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
using SmartAirCity.Filters;
using Microsoft.OpenApi.Models;
using System.Text.Json; // THÊM DÒNG NÀY

var builder = WebApplication.CreateBuilder(args);

// --- Configuration ---
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
builder.Configuration.AddEnvironmentVariables();

// --- Controllers ---
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase; // ĐÃ FIX
        options.JsonSerializerOptions.WriteIndented = true;
    });

// --- Swagger/OpenAPI ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "SmartAir City API",
        Version = "v1",
        Description = "IoT Platform for Urban Air Quality Monitoring based on NGSI-LD and FiWARE Standards",
        Contact = new OpenApiContact
        {
            Name = "SmartAir City Team",
            Email = "smartaircity@gmail.com",
            Url = new Uri("https://github.com/lequang2009k4/SmartAir-City")
        },
        License = new OpenApiLicense
        {
            Name = "MIT License",
            Url = new Uri("https://opensource.org/licenses/MIT")
        }
    });

    // OperationFilter cho upload file
    c.OperationFilter<FileUploadOperationFilter>();

    // Explicit mapping cho IFormFile
    c.MapType<IFormFile>(() => new OpenApiSchema
    {
        Type = "string",
        Format = "binary"
    });

    // Tránh trùng tên type trong Swagger
    c.CustomSchemaIds(type => type.FullName?.Replace("+", ".") ?? type.Name);

    // Thêm XML comments (nếu có)
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

// --- MongoDB ---
builder.Services.AddSingleton<MongoDbContext>();
builder.Services.AddScoped<AirQualityService>();

// --- HTTP Clients ---
builder.Services.AddHttpClient();
builder.Services.AddScoped<OpenAQLiveClient>();

// --- Data Services ---
builder.Services.AddScoped<DataNormalizationService>();
builder.Services.AddScoped<ContributionValidationService>();
builder.Services.AddScoped<ContributedDataService>();

// --- MQTT Subscriber ---
builder.Services.AddHostedService<MqttSubscriberService>();

// --- SignalR ---
builder.Services.AddSignalR();

// --- CORS ---
var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? new[] { "http://localhost:3000", "https://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });

    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// --- Configuration cho form file handling ---
// ĐÃ SỬA: Comment hoặc xóa dòng này nếu không cần thiết
// builder.Services.Configure<ApiBehaviorOptions>(options =>
// {
//     options.SuppressConsumesConstraintForFormFileParameters = true;
// });

// --- Logging ---
builder.Services.AddLogging(logging =>
{
    logging.ClearProviders();
    logging.AddConsole();
    logging.AddDebug();
    logging.AddConfiguration(builder.Configuration.GetSection("Logging"));
});

var app = builder.Build();

// --- Middleware Pipeline ---

// Swagger trong môi trường Development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "SmartAir City API v1");
        c.RoutePrefix = "swagger";
        c.DocumentTitle = "SmartAir City API Documentation";
    });
}

// CORS - đặt trước Routing
app.UseCors();

// Routing
app.UseRouting();

// Authorization & Authentication
app.UseAuthorization();

// Static Files (nếu cần) - Comment nếu không dùng static files
// app.UseStaticFiles();

// --- Endpoint Mapping ---

// Controllers
app.MapControllers();

// SignalR Hub
app.MapHub<AirQualityHub>("/airqualityhub");

// --- Startup Information ---
Console.WriteLine("🚀 SmartAir City API Started Successfully!");
Console.WriteLine($"📍 Environment: {app.Environment.EnvironmentName}");
Console.WriteLine($"🌐 Listening on: {builder.Configuration["urls"] ?? "http://localhost:5000"}");
Console.WriteLine($"📊 SignalR Hub mapped at: /airqualityhub");
Console.WriteLine($"📚 Swagger UI available at: /swagger");

if (app.Environment.IsDevelopment())
{
    Console.WriteLine("🔧 Development Mode - Hot Reload Enabled");
}

app.Run();