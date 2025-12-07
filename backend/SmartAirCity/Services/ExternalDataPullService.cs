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
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SmartAirCity.Models;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using System.Linq;
using Microsoft.AspNetCore.SignalR;
using Newtonsoft.Json.Linq;
using MongoDB.Bson;

namespace SmartAirCity.Services;

public class ExternalDataPullService : BackgroundService
{
    private readonly ILogger<ExternalDataPullService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IServiceProvider _serviceProvider;
    private readonly IHttpClientFactory _httpClientFactory;

    public ExternalDataPullService(
        ILogger<ExternalDataPullService> logger,
        IConfiguration configuration,
        IServiceProvider serviceProvider,
        IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _configuration = configuration;
        _serviceProvider = serviceProvider;
        _httpClientFactory = httpClientFactory;
    }

    private const int MAX_FAILURE_COUNT = 5; // Deactivate after 5 consecutive failures

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("External Data Pull Service (JSONPath) is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessExternalSources(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing external sources.");
            }

            // Check every minute, but sources have their own intervals
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }

    private async Task ProcessExternalSources(CancellationToken stoppingToken)
    {
        using (var scope = _serviceProvider.CreateScope())
        {
            var sourceService = scope.ServiceProvider.GetRequiredService<ExternalSourceService>();
            var sources = await sourceService.GetActiveSourcesAsync(); // Only get active sources

            if (sources == null || !sources.Any())
            {
                return;
            }

            var now = DateTime.UtcNow;

            foreach (var source in sources)
            {
                // Check if it's time to fetch based on IntervalMinutes
                if (source.LastFetchedAt.HasValue)
                {
                    var elapsed = (now - source.LastFetchedAt.Value).TotalMinutes;
                    if (elapsed < source.IntervalMinutes)
                    {
                        _logger.LogDebug("Skipping {SourceName}: next fetch in {Minutes:F1} minutes", 
                            source.Name, source.IntervalMinutes - elapsed);
                        continue;
                    }
                }

                try
                {
                    _logger.LogInformation("Pulling data from source: {SourceName}", source.Name);
                    await PullAndProcessData(source, stoppingToken);
                    
                    // Update last fetched time on success
                    await sourceService.UpdateLastFetchedAsync(source.Id!, DateTime.UtcNow);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to pull data from {SourceName}", source.Name);
                    
                    // Record failure
                    await sourceService.RecordFailureAsync(source.Id!, ex.Message);
                    
                    // Deactivate if too many failures
                    if (source.FailureCount + 1 >= MAX_FAILURE_COUNT)
                    {
                        _logger.LogWarning("Deactivating source {SourceName} after {Count} consecutive failures", 
                            source.Name, MAX_FAILURE_COUNT);
                        await sourceService.DeactivateAsync(source.Id!);
                    }
                }
            }
        }
    }

    private async Task PullAndProcessData(ExternalSource source, CancellationToken stoppingToken)
    {
        using var client = _httpClientFactory.CreateClient();
        
        // Add headers if present
        if (source.Headers != null)
        {
            foreach (var header in source.Headers)
            {
                client.DefaultRequestHeaders.TryAddWithoutValidation(header.Key, header.Value);
            }
        }

        var response = await client.GetAsync(source.Url, stoppingToken);
        
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Source {SourceName} returned status code {StatusCode}", source.Name, response.StatusCode);
            return;
        }

        var jsonContent = await response.Content.ReadAsStringAsync(stoppingToken);
        
        // All external sources must return NGSI-LD format
        await ProcessNGSILDData(source, jsonContent, stoppingToken);
    }

    /// <summary>
    /// Process NGSI-LD format data (no mapping needed)
    /// Handles both single object and array of objects
    /// Saves to ExternalAirQuality collection
    /// </summary>
    private async Task ProcessNGSILDData(ExternalSource source, string jsonContent, CancellationToken stoppingToken)
    {
        try
        {
            var trimmed = jsonContent.TrimStart();
            List<ExternalAirQuality> dataList;

            // Check if it's an array or single object
            if (trimmed.StartsWith("["))
            {
                // Array of NGSI-LD objects
                dataList = System.Text.Json.JsonSerializer.Deserialize<List<ExternalAirQuality>>(jsonContent) 
                    ?? new List<ExternalAirQuality>();
                _logger.LogDebug("Parsed {Count} NGSI-LD objects from array", dataList.Count);
            }
            else
            {
                // Single NGSI-LD object
                var single = System.Text.Json.JsonSerializer.Deserialize<ExternalAirQuality>(jsonContent);
                dataList = single != null ? new List<ExternalAirQuality> { single } : new List<ExternalAirQuality>();
            }

            if (dataList.Count == 0)
            {
                _logger.LogWarning("No valid NGSI-LD data from {SourceName}", source.Name);
                return;
            }

            var savedCount = 0;
            using (var scope = _serviceProvider.CreateScope())
            {
                var externalAirQualityService = scope.ServiceProvider.GetRequiredService<ExternalAirQualityService>();
                var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<SmartAirCity.Hubs.AirQualityHub>>();

                foreach (var ngsiData in dataList)
                {
                    // Validate NGSI-LD format
                    if (string.IsNullOrEmpty(ngsiData.Id) || string.IsNullOrEmpty(ngsiData.Type))
                    {
                        _logger.LogWarning("Skipping invalid NGSI-LD item from {SourceName}: missing Id or Type", source.Name);
                        continue;
                    }

                    // Relax validation: allow both PascalCase and camelCase
                    if (!string.Equals(ngsiData.Type, "AirQualityObserved", StringComparison.OrdinalIgnoreCase))
                    {
                        _logger.LogWarning("Skipping NGSI-LD item from {SourceName}: expected 'AirQualityObserved', got '{Type}'", 
                            source.Name, ngsiData.Type);
                        continue;
                    }
                    
                    // Normalize to PascalCase for consistency
                    ngsiData.Type = "AirQualityObserved";

                    // Fix Context field - convert JsonElement to actual objects for MongoDB serialization
                    ngsiData.Context = ConvertContextToMongoSafe(ngsiData.Context);

                    // Fix Properties field - convert JsonElement to actual objects for MongoDB serialization
                    ngsiData.Properties = ConvertPropertiesToMongoSafe(ngsiData.Properties);

                    // SET STATIONID from ExternalSource for consistency with Stations collection
                    ngsiData.StationId = source.StationId;

                    // Set external metadata
                    ngsiData.ExternalMetadata = new ExternalMetadata
                    {
                        SourceName = source.Name,
                        SourceUrl = source.Url,
                        FetchedAt = DateTime.UtcNow
                    };

                    // Use Upsert to prevent duplicates - saves to ExternalAirQuality collection
                    await externalAirQualityService.UpsertAsync(ngsiData);
                    await hubContext.Clients.All.SendAsync("NewExternalData", ngsiData);
                    savedCount++;
                    
                    // Auto-create station in Stations collection (only on first record)
                    if (savedCount == 1)
                    {
                        await EnsureStationExistsAsync(source, ngsiData);
                    }
                }

                _logger.LogInformation("Successfully saved {Count} NGSI-LD records to ExternalAirQuality from {SourceName}. Station: {StationId}", 
                    savedCount, source.Name, source.StationId);
            }
        }
        catch (System.Text.Json.JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse NGSI-LD JSON from {SourceName}", source.Name);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process NGSI-LD data from {SourceName}", source.Name);
        }
    }

    /// <summary>
    /// Convert Context array from JsonElement to MongoDB-safe objects
    /// JsonElement cannot be serialized by MongoDB driver
    /// </summary>
    private object[] ConvertContextToMongoSafe(object[] context)
    {
        if (context == null || context.Length == 0)
        {
            return new object[]
            {
                "https://smartdatamodels.org/context.jsonld",
                new Dictionary<string, string> { ["sosa"] = "http://www.w3.org/ns/sosa/" }
            };
        }

        var result = new List<object>();
        foreach (var item in context)
        {
            if (item is System.Text.Json.JsonElement jsonElement)
            {
                result.Add(ConvertJsonElement(jsonElement));
            }
            else
            {
                result.Add(item);
            }
        }
        return result.ToArray();
    }

    /// <summary>
    /// Convert Properties dictionary from JsonElement to MongoDB-safe objects
    /// </summary>
    private Dictionary<string, object>? ConvertPropertiesToMongoSafe(Dictionary<string, object>? properties)
    {
        if (properties == null || properties.Count == 0)
            return properties;

        var result = new Dictionary<string, object>();
        foreach (var kvp in properties)
        {
            if (kvp.Value is System.Text.Json.JsonElement jsonElement)
            {
                var converted = ConvertJsonElement(jsonElement);
                if (converted != null)
                    result[kvp.Key] = converted;
            }
            else
            {
                result[kvp.Key] = kvp.Value;
            }
        }
        return result;
    }

    /// <summary>
    /// Convert JsonElement to native .NET types
    /// </summary>
    private object? ConvertJsonElement(System.Text.Json.JsonElement element)
    {
        switch (element.ValueKind)
        {
            case System.Text.Json.JsonValueKind.String:
                return element.GetString();
            case System.Text.Json.JsonValueKind.Number:
                if (element.TryGetInt64(out var longVal))
                    return longVal;
                return element.GetDouble();
            case System.Text.Json.JsonValueKind.True:
                return true;
            case System.Text.Json.JsonValueKind.False:
                return false;
            case System.Text.Json.JsonValueKind.Null:
                return null;
            case System.Text.Json.JsonValueKind.Object:
                var dict = new Dictionary<string, object?>();
                foreach (var prop in element.EnumerateObject())
                {
                    dict[prop.Name] = ConvertJsonElement(prop.Value);
                }
                return dict;
            case System.Text.Json.JsonValueKind.Array:
                var list = new List<object?>();
                foreach (var item in element.EnumerateArray())
                {
                    list.Add(ConvertJsonElement(item));
                }
                return list;
            default:
                return element.ToString();
        }
    }

    /// <summary>
    /// Auto-create station in Stations collection if not exists
    /// </summary>
    private async Task EnsureStationExistsAsync(ExternalSource source, ExternalAirQuality sampleData)
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var stationService = scope.ServiceProvider.GetRequiredService<StationService>();
            
            // Check if station already exists
            var existing = await stationService.GetStationByIdAsync(source.StationId);
            if (existing != null)
            {
                return; // Already exists
            }

            // Create new station from ExternalSource info
            var newStation = new Station
            {
                StationId = source.StationId,
                Name = source.Name,
                Latitude = source.Latitude ?? sampleData.Location?.Value?.Coordinates?[1] ?? 0,
                Longitude = source.Longitude ?? sampleData.Location?.Value?.Coordinates?[0] ?? 0,
                Type = "external-http",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                Metadata = new Dictionary<string, object?>
                {
                    ["sourceUrl"] = source.Url
                }
            };

            await stationService.CreateStationAsync(newStation);
            _logger.LogInformation("Auto-created station from external source: {StationId} - {Name}", 
                source.StationId, source.Name);
        }
        catch (Exception ex)
        {
            // Don't throw - just log warning
            _logger.LogWarning(ex, "Failed to auto-create station for external source: {StationId}", source.StationId);
        }
    }
}
