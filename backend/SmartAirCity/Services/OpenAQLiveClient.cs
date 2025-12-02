/**
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


using System.Text.Json;

namespace SmartAirCity.Services;

public class OpenAQLiveClient
{
    private readonly IHttpClientFactory _http;
    private readonly IConfiguration _config;
    private readonly ILogger<OpenAQLiveClient> _logger;
    
    // Cache sensor mappings để tránh gọi API nhiều lần
    private static readonly Dictionary<int, Dictionary<int, string>> _sensorMappingCache = new();
    private static readonly SemaphoreSlim _cacheLock = new(1, 1);
    
    // Cac chỉ số bon toi ho tro
    private static readonly HashSet<string> _supportedParameters = new(StringComparer.OrdinalIgnoreCase)
    {
        "pm25", "pm2.5",
        "pm10",
        "o3",
        "no2",
        "so2",
        "co"
    };

    public OpenAQLiveClient(
        IHttpClientFactory http,
        IConfiguration config,
        ILogger<OpenAQLiveClient> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Clear sensor mapping cache - su dung khi muon force refresh
    /// </summary>
    public static async Task ClearCacheAsync()
    {
        await _cacheLock.WaitAsync();
        try
        {
            _sensorMappingCache.Clear();
        }
        finally
        {
            _cacheLock.Release();
        }
    }

    public async Task<(double? pm25, double? pm10, double? o3, double? no2, double? so2, double? co)?>
        GetNearestAsync(double lat, double lon, int? locationId = null, string? stationId = null, CancellationToken ct = default)
    {
        // Doc cau hinh tu appsettings - khong hardcode
        var baseUrl = _config["OpenAQ:BaseUrl"];
        if (string.IsNullOrEmpty(baseUrl))
        {
            var errorMsg = "Cau hinh OpenAQ:BaseUrl khong duoc tim thay trong appsettings.json. Vui long cau hinh trong appsettings.json";
            _logger.LogError(errorMsg);
            throw new InvalidOperationException(errorMsg);
        }
        
        // KHONG FALLBACK: Chi su dung locationId duoc truyen vao
        // Neu locationId = null hoac 0 thi KHONG goi API
        if (!locationId.HasValue || locationId.Value == 0)
        {
            _logger.LogWarning("Khong co locationId hop le (StationId={StationId}), BO QUA OpenAQ API", stationId ?? "unknown");
            return null;
        }
        
        _logger.LogDebug("Su dung locationId: {LocationId} cho station: {StationId}", locationId.Value, stationId ?? "unknown");

        var client = _http.CreateClient();
        client.BaseAddress = new Uri(baseUrl);
        var apiKey = _config["OpenAQ:ApiKey"];
        if (!string.IsNullOrEmpty(apiKey))
            client.DefaultRequestHeaders.Add("X-API-Key", apiKey);

        var latestUrl = $"locations/{locationId.Value}/latest";
        _logger.LogInformation("Dang lay du lieu OpenAQ tu {BaseUrl} cho locationId={LocationId}", baseUrl, locationId.Value);

        var latestRes = await client.GetAsync(latestUrl, ct);
        
        if (!latestRes.IsSuccessStatusCode)
        {
            _logger.LogWarning("OpenAQ latest failed: {Status}", latestRes.StatusCode);
            return null;
        }

        var latestJson = await latestRes.Content.ReadAsStringAsync(ct);
        using var latestDoc = JsonDocument.Parse(latestJson);

        if (!latestDoc.RootElement.TryGetProperty("results", out var latestArr) ||
            latestArr.GetArrayLength() == 0)
        {
            _logger.LogWarning("No latest data from location {LocId}", locationId.Value);
            return null;
        }

        // BUOC 1: Lay sensor mapping
        Dictionary<int, string>? sensorMapping = null;
        
        // Thu 1: Doc tu config StationMapping (neu co stationId)
        if (!string.IsNullOrEmpty(stationId))
        {
            var stationMappingSection = _config.GetSection($"StationMapping:{stationId}:SensorMapping");
            var tempMap = new Dictionary<int, string>();
            
            foreach (var item in stationMappingSection.GetChildren())
            {
                if (int.TryParse(item.Key, out var sensorId))
                {
                    tempMap[sensorId] = item.Value ?? "";
                }
            }
            
            if (tempMap.Count > 0)
            {
                sensorMapping = tempMap;
                _logger.LogInformation("Loaded sensor mapping from config for station {StationId}: {Count} sensors", 
                    stationId, tempMap.Count);
            }
        }
        
        // Thu 2: Auto-fetch tu OpenAQ API
        if (sensorMapping == null)
        {
            _logger.LogInformation("No sensor mapping in config, auto-fetching from OpenAQ API for locationId={LocationId}...", 
                locationId.Value);
            
            sensorMapping = await FetchSensorMappingAsync(client, locationId.Value, ct);
            
            if (sensorMapping != null && sensorMapping.Count > 0)
            {
                _logger.LogInformation("Auto-fetched sensor mapping for location {LocationId}: {Count} sensors", 
                    locationId.Value, sensorMapping.Count);
                
                // Log chi tiet cac sensors duoc detect
                foreach (var sensor in sensorMapping)
                {
                    _logger.LogInformation("   └─ Sensor {SensorId} measures: {Parameter}", sensor.Key, sensor.Value);
                }
            }
            else
            {
                _logger.LogWarning("Auto-fetch returned no sensors for location {LocationId}", locationId.Value);
            }
        }
        
        // Thu 3: Fallback to global OpenAQ:SensorMapping - CHỈ KHI KHÔNG CÓ locationId cụ thể
        // KHONG dung global mapping cho cac tram co locationId rieng de tranh hien thi sai du lieu
        if (sensorMapping == null && !locationId.HasValue)
        {
            var globalMappingSection = _config.GetSection("OpenAQ:SensorMapping");
            var tempMap = new Dictionary<int, string>();
            
            foreach (var item in globalMappingSection.GetChildren())
            {
                if (int.TryParse(item.Key, out var sensorId))
                {
                    tempMap[sensorId] = item.Value ?? "";
                }
            }
            
            if (tempMap.Count > 0)
            {
                sensorMapping = tempMap;
                _logger.LogInformation("Using global OpenAQ:SensorMapping with {Count} sensors", tempMap.Count);
            }
        }
        
        // Thu 4: Final fallback - return empty mapping if nothing found
        // This will cause all sensors to be null if no mapping is available
        if (sensorMapping == null)
        {
            _logger.LogWarning("No sensor mapping found for location {LocationId}. Only PM2.5 may be available.", locationId.Value);
            sensorMapping = new Dictionary<int, string>();
        }

        // BUOC 2: Parse sensor values
        var results = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);
        var unmappedSensors = new List<int>(); // Track sensors khong co trong mapping

        foreach (var it in latestArr.EnumerateArray())
        {
            try
            {
                var sid = it.GetProperty("sensorsId").GetInt32();
                var val = it.GetProperty("value").GetDouble();

                if (sensorMapping.TryGetValue(sid, out var paramName))
                {
                    // Chi lay cac parameter duoc ho tro (pm25, pm10, o3, no2, so2, co)
                    if (_supportedParameters.Contains(paramName))
                    {
                        // Normalize ten parameter (pm2.5 -> pm25)
                        var normalizedName = paramName.ToLower().Replace(".", "");
                        results[normalizedName] = val;
                        _logger.LogInformation("Sensor {SensorId} -> {ParamName} = {Value} GQ", sid, normalizedName.ToUpper(), val);
                    }
                    else
                    {
                        _logger.LogDebug("Skipped unsupported parameter: {ParamName} (sensorId={SensorId})", paramName, sid);
                    }
                }
                else
                {
                    unmappedSensors.Add(sid);
                    _logger.LogDebug("Sensor {SensorId} (value={Value}) not in mapping, skipping", sid, val);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Error reading sensor: {Msg}", ex.Message);
            }
        }

        // Log tong ket
        if (unmappedSensors.Count > 0)
        {
            _logger.LogWarning("Found {Count} unmapped sensors: [{Sensors}]. These sensors are available but not mapped to any parameter.", 
                unmappedSensors.Count, string.Join(", ", unmappedSensors));
        }

        // BUOC 3: Extract values (null neu khong co)
        double? pm25 = results.ContainsKey("pm25") ? results["pm25"] : null;
        double? pm10 = results.ContainsKey("pm10") ? results["pm10"] : null;
        double? o3 = results.ContainsKey("o3") ? results["o3"] : null;
        double? no2 = results.ContainsKey("no2") ? results["no2"] : null;
        double? so2 = results.ContainsKey("so2") ? results["so2"] : null;
        double? co = results.ContainsKey("co") ? results["co"] : null;

        // Log ket qua cuoi cung
        var availableParams = new List<string>();
        var missingParams = new List<string>();
        
        if (pm25.HasValue) availableParams.Add($"PM2.5={pm25.Value:F2}"); else missingParams.Add("PM2.5");
        if (pm10.HasValue) availableParams.Add($"PM10={pm10.Value:F2}"); else missingParams.Add("PM10");
        if (o3.HasValue) availableParams.Add($"O3={o3.Value:F2}"); else missingParams.Add("O3");
        if (no2.HasValue) availableParams.Add($"NO2={no2.Value:F2}"); else missingParams.Add("NO2");
        if (so2.HasValue) availableParams.Add($"SO2={so2.Value:F2}"); else missingParams.Add("SO2");
        if (co.HasValue) availableParams.Add($"CO={co.Value:F2}"); else missingParams.Add("CO");

        _logger.LogInformation(
            "OpenAQ Final Results for location {LocationId}:\n" +
            "    Available: {Available}\n" +
            "    Missing (null): {Missing}",
            locationId.Value,
            availableParams.Count > 0 ? string.Join(", ", availableParams) : "None",
            missingParams.Count > 0 ? string.Join(", ", missingParams) : "None");

        return (pm25, pm10, o3, no2, so2, co);
    }

    /// <summary>
    /// Auto-fetch sensor mapping tu OpenAQ API
    /// Goi /v3/locations/{locationId} de lay danh sach sensors,
    /// sau đó goi /v3/sensors/{sensorId} cho tung sensor de biet no do cai gi
    /// </summary>
    private async Task<Dictionary<int, string>?> FetchSensorMappingAsync(HttpClient client, int locationId, CancellationToken ct)
    {
        try
        {
            // Check cache truoc
            await _cacheLock.WaitAsync(ct);
            try
            {
                if (_sensorMappingCache.TryGetValue(locationId, out var cached))
                {
                    _logger.LogDebug("Using cached sensor mapping for location {LocationId}", locationId);
                    return cached;
                }
            }
            finally
            {
                _cacheLock.Release();
            }

            // Goi API /v3/locations/{locationId} de lay sensor IDs
            _logger.LogInformation("Fetching sensor list from /v3/locations/{LocationId}", locationId);
            var locationUrl = $"locations/{locationId}";
            var locationRes = await client.GetAsync(locationUrl, ct);

            if (!locationRes.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to fetch location metadata: {Status}", locationRes.StatusCode);
                return null;
            }

            var locationJson = await locationRes.Content.ReadAsStringAsync(ct);
            using var locationDoc = JsonDocument.Parse(locationJson);

            if (!locationDoc.RootElement.TryGetProperty("results", out var resultsArr) || 
                resultsArr.GetArrayLength() == 0)
            {
                _logger.LogWarning("No results in location metadata");
                return null;
            }

            var locationData = resultsArr[0];
            if (!locationData.TryGetProperty("sensors", out var sensorsArr))
            {
                _logger.LogWarning("No sensors found in location metadata");
                return null;
            }

            var mapping = new Dictionary<int, string>();

            // Duyet qua tung sensor
            foreach (var sensor in sensorsArr.EnumerateArray())
            {
                if (!sensor.TryGetProperty("id", out var sensorIdProp))
                    continue;

                var sensorId = sensorIdProp.GetInt32();

                // Goi API /v3/sensors/{sensorId} de lay parameter name
                _logger.LogDebug("Fetching metadata for sensor {SensorId}", sensorId);
                var sensorUrl = $"sensors/{sensorId}";
                var sensorRes = await client.GetAsync(sensorUrl, ct);

                if (!sensorRes.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to fetch sensor {SensorId}: {Status}", sensorId, sensorRes.StatusCode);
                    continue;
                }

                var sensorJson = await sensorRes.Content.ReadAsStringAsync(ct);
                using var sensorDoc = JsonDocument.Parse(sensorJson);

                if (!sensorDoc.RootElement.TryGetProperty("results", out var sensorResultsArr) || 
                    sensorResultsArr.GetArrayLength() == 0)
                {
                    _logger.LogWarning("No results for sensor {SensorId}", sensorId);
                    continue;
                }

                var sensorData = sensorResultsArr[0];
                if (!sensorData.TryGetProperty("parameter", out var parameterProp) ||
                    !parameterProp.TryGetProperty("name", out var paramNameProp))
                {
                    _logger.LogWarning("No parameter name for sensor {SensorId}", sensorId);
                    continue;
                }

                var paramName = paramNameProp.GetString();
                if (!string.IsNullOrEmpty(paramName))
                {
                    // Normalize parameter name (PM2.5 -> pm25, O₃ -> o3, pm1 -> pm1)
                    var normalized = paramName.ToLower().Replace(".", "").Replace("₃", "3").Replace("₂", "2");
                    
                    // CHI LAY cac sensors do chi so trong danh sach ho tro
                    if (_supportedParameters.Contains(normalized))
                    {
                        mapping[sensorId] = normalized;
                        _logger.LogInformation("Sensor {SensorId} measures {Parameter} (normalized: {Normalized}) - SUPPORTED", 
                            sensorId, paramName, normalized);
                    }
                    else
                    {
                        _logger.LogInformation("Sensor {SensorId} measures {Parameter} (normalized: {Normalized}) - SKIPPED (not in supported list)", 
                            sensorId, paramName, normalized);
                    }
                }
            }

            // Cache ket qua
            if (mapping.Count > 0)
            {
                await _cacheLock.WaitAsync(ct);
                try
                {
                    _sensorMappingCache[locationId] = mapping;
                    _logger.LogInformation("Cached sensor mapping for location {LocationId}: {Count} sensors", 
                        locationId, mapping.Count);
                }
                finally
                {
                    _cacheLock.Release();
                }

                return mapping;
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while auto-fetching sensor mapping for location {LocationId}", locationId);
            return null;
        }
    }
}
