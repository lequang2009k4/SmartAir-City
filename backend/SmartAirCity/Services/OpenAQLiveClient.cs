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


using System.Text.Json;

namespace SmartAirCity.Services;

public class OpenAQLiveClient
{
    private readonly IHttpClientFactory _http;
    private readonly IConfiguration _config;
    private readonly ILogger<OpenAQLiveClient> _logger;
    
    // Cache sensor mappings de tranh goi API nhieu lan
    private static readonly Dictionary<int, Dictionary<int, string>> _sensorMappingCache = new();
    private static readonly SemaphoreSlim _cacheLock = new(1, 1);

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

    /// <summary>
    /// Get ALL sensor readings from OpenAQ (dynamic, not limited to specific pollutants)
    /// </summary>
    /// <returns>Dictionary with parameter names as keys (pm25, pm10, o3, no2, so2, co, etc.) and values</returns>
    public async Task<Dictionary<string, double>?>
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
        
        // Final fallback - return empty mapping if nothing found
        // Auto-fetch se lay TAT CA sensors, neu khong co thi de empty
        if (sensorMapping == null)
        {
            _logger.LogWarning("No sensor mapping found for location {LocationId}. Auto-fetch may have failed.", locationId.Value);
            sensorMapping = new Dictionary<int, string>();
        }

        // BUOC 2: Parse sensor values - LAY TAT CA sensors, khong filter
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
                    // Normalize ten parameter (pm2.5 -> pm25, PM2.5 -> pm25)
                    var normalizedName = paramName.ToLower().Replace(".", "").Replace("₃", "3").Replace("₂", "2");
                    results[normalizedName] = val;
                    _logger.LogInformation("Sensor {SensorId} -> {ParamName} = {Value} (unitCode: {UnitCode})", 
                        sid, normalizedName.ToUpper(), val, GetUnitCode(normalizedName));
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

        // Log ket qua cuoi cung
        if (results.Count > 0)
        {
            var paramList = results.Select(kvp => $"{kvp.Key.ToUpper()}={kvp.Value:F2}").ToList();
            _logger.LogInformation(
                "OpenAQ Final Results for location {LocationId}: {Count} parameters\n" +
                "    {Parameters}",
                locationId.Value,
                results.Count,
                string.Join(" | ", paramList));
        }
        else
        {
            _logger.LogWarning("No sensor data available for location {LocationId}", locationId.Value);
        }

        return results.Count > 0 ? results : null;
    }

    /// <summary>
    /// Auto-fetch sensor mapping tu OpenAQ API
    /// Lay parameter name truc tiep tu /v3/locations/{locationId} response
    /// (KHONG can goi them /v3/sensors/{sensorId} cho tung sensor)
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

            // Goi API /v3/locations/{locationId} de lay sensor IDs VA parameter names
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

            // Duyet qua tung sensor VA LAY parameter name TRUC TIEP tu response
            foreach (var sensor in sensorsArr.EnumerateArray())
            {
                try
                {
                    if (!sensor.TryGetProperty("id", out var sensorIdProp))
                        continue;

                    var sensorId = sensorIdProp.GetInt32();

                    // LAY parameter name TRUC TIEP tu sensor object (KHONG goi API them)
                    if (sensor.TryGetProperty("parameter", out var parameterProp) &&
                        parameterProp.TryGetProperty("name", out var paramNameProp))
                    {
                        var paramName = paramNameProp.GetString();
                        if (!string.IsNullOrEmpty(paramName))
                        {
                            // Normalize parameter name (PM2.5 -> pm25, O₃ -> o3, pm1 -> pm1)
                            var normalized = paramName.ToLower().Replace(".", "").Replace("₃", "3").Replace("₂", "2");
                            
                            // LAY TAT CA sensors, khong filter theo danh sach ho tro
                            mapping[sensorId] = normalized;
                            _logger.LogInformation("Sensor {SensorId} measures {Parameter} (normalized: {Normalized})", 
                                sensorId, paramName, normalized);
                        }
                    }
                    else
                    {
                        _logger.LogDebug("Sensor {SensorId} has no parameter info in location response", sensorId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error parsing sensor info");
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

    /// <summary>
    /// Map parameter names to UN/CEFACT unit codes (NGSI-LD standard)
    /// Reference: https://unece.org/trade/cefact/UNLOCODE-Download
    /// </summary>
    public static string GetUnitCode(string parameterName)
    {
        return parameterName.ToLower() switch
        {
            // Pollutants - GQ = microgram per cubic metre (µg/m³)
            "pm25" or "pm2.5" or "pm10" or "pm1" => "GQ",
            "o3" or "ozone" => "GQ",
            "no2" or "nitrogen dioxide" => "GQ",
            "so2" or "sulfur dioxide" => "GQ",
            "co" or "carbon monoxide" => "GQ",
            "nox" or "nitrogen oxides" => "GQ",
            "voc" or "tvoc" or "volatile organic compounds" => "GQ",
            "benzene" or "toluene" or "formaldehyde" => "GQ",
            "bc" or "black carbon" => "GQ",
            
            // Temperature - CEL = degree Celsius (°C)
            "temperature" or "temp" => "CEL",
            
            // Humidity - P1 = percent (%)
            "humidity" or "relativehumidity" => "P1",
            
            // Pressure - A97 = hectopascal (hPa)
            "pressure" or "atmosphericpressure" => "A97",
            
            // Air Quality Index - E30 = dimensionless (no unit)
            "aqi" or "airqualityindex" => "E30",
            
            // Default fallback
            _ => "E30" // dimensionless for unknown parameters
        };
    }
}
