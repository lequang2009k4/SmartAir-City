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
        
        // Check if source returns NGSI-LD format
        if (source.IsNGSILD)
        {
            await ProcessNGSILDData(source, jsonContent, stoppingToken);
            return;
        }
        
        // Use JObject/JToken from Newtonsoft.Json for powerful JSONPath querying
        JToken root;
        try 
        {
            if (jsonContent.TrimStart().StartsWith("["))
            {
                root = JArray.Parse(jsonContent);
            }
            else
            {
                root = JObject.Parse(jsonContent);
            }
        }
        catch (Exception ex)
        {
             _logger.LogError(ex, "Failed to parse JSON from {SourceName}", source.Name);
             return;
        }

        // Use user-defined StationId from source
        var stationIdValue = source.StationId;
        if (string.IsNullOrEmpty(stationIdValue))
        {
            _logger.LogWarning("Source {SourceName} has no StationId defined", source.Name);
            return;
        }

        // Validate mapping exists for non-NGSI-LD sources
        if (source.Mapping == null || source.Mapping.FieldMappings == null || source.Mapping.FieldMappings.Count == 0)
        {
            _logger.LogWarning("Source {SourceName} has no mapping fields defined", source.Name);
            return;
        }

        // Extract Timestamp (optional - use current time if not provided)
        string? timestampValue = null;
        if (!string.IsNullOrEmpty(source.Mapping.TimestampPath))
        {
            timestampValue = GetJsonValue(root, source.Mapping.TimestampPath);
        }
        
        // If no timestamp in mapping or extraction failed, use current UTC time
        if (string.IsNullOrEmpty(timestampValue))
        {
            timestampValue = DateTime.UtcNow.ToString("o"); // ISO 8601 format
            _logger.LogDebug("No timestamp found in source {SourceName}, using current time: {Timestamp}", 
                source.Name, timestampValue);
        }

        // Create payload for Normalization Service
        var measurements = new Dictionary<string, object>();
        
        // Extract all dynamic fields from mapping
        foreach (var field in source.Mapping.FieldMappings)
        {
            var fieldName = field.Key.ToLower(); // Normalize to lowercase
            var jsonPath = field.Value;
            var value = GetJsonValue(root, jsonPath);
            
            AddMeasurement(measurements, fieldName, value);
        }


        // Parse timestamp
        DateTime observedTime;
        if (!DateTime.TryParse(timestampValue, out observedTime))
        {
            observedTime = DateTime.UtcNow;
        }

        // Create NGSI-LD ID
        var ngsiId = $"urn:ngsi-ld:AirQualityObserved:{stationIdValue}:{observedTime:yyyyMMddHHmmss}";

        // Convert measurements to NGSI-LD properties (will be stored at root level via BsonExtraElements)
        var properties = new Dictionary<string, object>();
        foreach (var measurement in measurements)
        {
            var numericProp = new NumericProperty
            {
                Value = Convert.ToDouble(measurement.Value),
                UnitCode = GetUnitCode(measurement.Key), // Dynamic UnitCode based on field name
                ObservedAt = observedTime
            };
            
            // Convert to BsonDocument to avoid serialization exception
            properties[measurement.Key] = numericProp.ToBsonDocument();
        }

        _logger.LogDebug("Extracted {Count} measurements from {SourceName}: {Keys}", 
            measurements.Count, source.Name, string.Join(", ", measurements.Keys));

        // Create NGSI-LD compliant ExternalAirQuality object
        var externalData = new ExternalAirQuality
        {
            Id = ngsiId,
            Type = "AirQualityObserved",
            MadeBySensor = new Relationship
            {
                Object = $"urn:ngsi-ld:ExternalSource:{source.Id}"
            },
            ObservedProperty = new Relationship
            {
                Object = "AirQuality"
            },
            HasFeatureOfInterest = new Relationship
            {
                Object = $"urn:ngsi-ld:Air:external-{stationIdValue}"
            },
            Location = source.Latitude.HasValue && source.Longitude.HasValue 
                ? new LocationProperty
                {
                    Value = new GeoValue
                    {
                        Coordinates = new[] { source.Longitude.Value, source.Latitude.Value }
                    }
                }
                : null,
            DateObserved = new DateTimeProperty
            {
                Value = observedTime
            },
            Properties = properties, // Measurements will be serialized at root level
            ExternalMetadata = new ExternalMetadata
            {
                SourceName = source.Name,
                SourceUrl = source.Url,
                FetchedAt = DateTime.UtcNow
            }
        };

        using (var scope = _serviceProvider.CreateScope())
        {
            var externalAirQualityService = scope.ServiceProvider.GetRequiredService<ExternalAirQualityService>();
            var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<SmartAirCity.Hubs.AirQualityHub>>();

            // Use Upsert to prevent duplicates (same timestamp = same data)
            await externalAirQualityService.UpsertAsync(externalData);
            await hubContext.Clients.All.SendAsync("NewExternalAirQualityData", externalData);
            
            _logger.LogInformation("Successfully saved external data from {SourceName}. Station: {StationId}, Measurements: {Count}", 
                source.Name, stationIdValue, measurements.Count);
        }
    }

    /// <summary>
    /// Get appropriate UnitCode based on measurement field name
    /// </summary>
    private string GetUnitCode(string fieldName)
    {
        var lowerName = fieldName.ToLower();
        
        // Temperature
        if (lowerName.Contains("temp")) return "CEL"; // Celsius
        
        // Humidity
        if (lowerName.Contains("humid") || lowerName == "rh") return "P1"; // Percentage
        
        // Pressure
        if (lowerName.Contains("press") || lowerName == "hpa") return "A97"; // hPa
        
        // Wind speed
        if (lowerName.Contains("wind") && lowerName.Contains("speed")) return "MTS"; // m/s
        
        // AQI (no unit)
        if (lowerName == "aqi") return "C62"; // Dimensionless
        
        // Default: µg/m³ for air quality measurements (PM2.5, PM10, CO, NO2, SO2, O3, etc.)
        return "GQ"; // µg/m³
    }

    private void AddMeasurement(Dictionary<string, object> dict, string key, string? value)
    {
        if (!string.IsNullOrEmpty(value) && double.TryParse(value, out var doubleVal))
        {
            dict[key] = doubleVal;
        }
    }

    private string? GetJsonValue(JToken root, string path)
    {
        if (string.IsNullOrEmpty(path)) return null;

        try
        {
            // SelectToken supports full JSONPath syntax
            var token = root.SelectToken(path);
            return token?.ToString();
        }
        catch (Exception ex)
        {
            _logger.LogWarning("JSONPath error for path '{Path}': {Message}", path, ex.Message);
            return null;
        }
    }

    /// <summary>
    /// Process NGSI-LD format data (no mapping needed)
    /// Handles both single object and array of objects
    /// Saves to ExternalAirQuality collection (same as non-NGSI-LD external data and External MQTT)
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

                    if (ngsiData.Type != "AirQualityObserved")
                    {
                        _logger.LogWarning("Skipping NGSI-LD item from {SourceName}: expected 'AirQualityObserved', got '{Type}'", 
                            source.Name, ngsiData.Type);
                        continue;
                    }

                    // Fix Context field - convert JsonElement to actual objects for MongoDB serialization
                    ngsiData.Context = ConvertContextToMongoSafe(ngsiData.Context);

                    // Fix Properties field - convert JsonElement to actual objects for MongoDB serialization
                    ngsiData.Properties = ConvertPropertiesToMongoSafe(ngsiData.Properties);

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
}
