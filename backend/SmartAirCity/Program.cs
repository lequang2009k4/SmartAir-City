//  SPDX-License-Identifier: MIT
//  © 2025 SmartAir City Team
 
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.

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

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(); 
}

app.UseRouting();
app.MapControllers();
app.Run();
