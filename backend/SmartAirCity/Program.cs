
using SmartAirCity.Data;
using SmartAirCity.Services;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient();

// MongoDB Context
builder.Services.AddSingleton<MongoDbContext>();

// Services
builder.Services.AddSingleton<DataNormalizationService>();
builder.Services.AddSingleton<OpenAQLiveClient>();
builder.Services.AddHostedService<OpenAQService>();
builder.Services.AddScoped<AirQualityService>();

var app = builder.Build();


app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "SmartAirCity API v1");
    c.RoutePrefix = string.Empty; 
});

app.UseRouting();
app.MapControllers();
app.Run();
