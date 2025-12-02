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
using SmartAirCity.Models;

namespace SmartAirCity.Services;

public class DataNormalizationService
{
    private readonly ILogger<DataNormalizationService> _logger;
    private readonly OpenAQLiveClient _openAqClient;
    private readonly IConfiguration _config;

    public DataNormalizationService(
        ILogger<DataNormalizationService> logger,
        OpenAQLiveClient openAqClient,
        IConfiguration config)
    {
        _logger = logger;
        _openAqClient = openAqClient;
        _config = config;
    }


    /// <summary>
    /// Normalize IoT data tu MQTT + Merge voi OpenAQ API data
    /// </summary>
    /// <param name="rawIotJson">JSON tu MQTT broker (MQ135 sensor)</param>
    /// <param name="latitude">Toa do latitude cua tram (optional, neu null se dung default tu config)</param>
    /// <param name="longitude">Toa do longitude cua tram (optional, neu null se dung default tu config)</param>
    /// <param name="openAQLocationId">LocationId cua OpenAQ API (optional, neu null se dung default tu config)</param>
    /// <param name="stationId">Station ID de lay sensor mapping rieng (vd: "hanoi-oceanpark")</param>
    /// <returns>AirQuality entity da merge IoT + OpenAQ</returns>
    public async Task<AirQuality> NormalizeAndMergeAsync(
        JsonElement rawIotJson, 
        double? latitude = null, 
        double? longitude = null, 
        int? openAQLocationId = null,
        string? stationId = null)
    {
        // 1. Parse IoT data (chi co AQI tu MQ135 sensor)
        var entity = ParseIotData(rawIotJson);
        
        _logger.LogInformation("Da parse IoT: AQI={Aqi}, Location=[{Lon},{Lat}]", 
            entity.AirQualityIndex?.Value,
            entity.Location?.Value?.Coordinates?[0],
            entity.Location?.Value?.Coordinates?[1]);

        // 2. Fetch OpenAQ data de bo sung PM2.5, PM10, O3, NO2, SO2, CO
        try
        {
            // Su dung toa do va locationId duoc truyen vao, neu null thi doc tu config - khong hardcode
            double lat;
            if (latitude.HasValue)
            {
                lat = latitude.Value;
            }
            else
            {
                var defaultLatStr = _config["OpenAQ:DefaultLatitude"];
                if (string.IsNullOrEmpty(defaultLatStr) || !double.TryParse(defaultLatStr, out lat))
                {
                    _logger.LogWarning("Khong the doc OpenAQ:DefaultLatitude tu config, su dung toa do tu IoT data neu co");
                    lat = entity.Location?.Value?.Coordinates?[1] ?? 0;
                }
            }
            
            double lon;
            if (longitude.HasValue)
            {
                lon = longitude.Value;
            }
            else
            {
                var defaultLonStr = _config["OpenAQ:DefaultLongitude"];
                if (string.IsNullOrEmpty(defaultLonStr) || !double.TryParse(defaultLonStr, out lon))
                {
                    _logger.LogWarning("Khong the doc OpenAQ:DefaultLongitude tu config, su dung toa do tu IoT data neu co");
                    lon = entity.Location?.Value?.Coordinates?[0] ?? 0;
                }
            }
            
            var locationId = openAQLocationId; // Co the null, OpenAQLiveClient se doc tu config
            
            _logger.LogInformation("Dang lay du lieu OpenAQ cho toa do: Lat={Lat}, Lon={Lon}, LocationId={LocationId}, StationId={StationId}", 
                lat, lon, locationId, stationId);
            var openaqData = await _openAqClient.GetNearestAsync(lat, lon, locationId, stationId);
            
            if (openaqData.HasValue)
            {
                // Merge OpenAQ data vao entity
                entity.Pm25 = CreateNumericProperty(openaqData.Value.pm25, "GQ");
                entity.Pm10 = CreateNumericProperty(openaqData.Value.pm10, "GQ");
                entity.O3 = CreateNumericProperty(openaqData.Value.o3, "GQ");
                entity.No2 = CreateNumericProperty(openaqData.Value.no2, "GQ");
                entity.So2 = CreateNumericProperty(openaqData.Value.so2, "GQ");
                entity.Co = CreateNumericProperty(openaqData.Value.co, "GQ");
                
                _logger.LogInformation("Da merge IoT + OpenAQ: PM2.5={Pm25}, PM10={Pm10}", 
                    openaqData.Value.pm25, openaqData.Value.pm10);
            }
            else
            {
                _logger.LogWarning("OpenAQ tra ve null, chi su dung du lieu IoT");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Khong the lay du lieu OpenAQ, chi su dung du lieu IoT");
        }
        
        return entity;
    }

    /// <summary>
    /// Parse IoT JSON tu MQTT message
    /// </summary>
    private AirQuality ParseIotData(JsonElement root)
    {
        var entity = new AirQuality();

        try
        {
            // id
            if (root.TryGetProperty("id", out var idEl))
                entity.Id = idEl.GetString();

            // GeoProperty - location
            if (root.TryGetProperty("location", out var loc))
            {
                if (loc.TryGetProperty("value", out var locValue) &&
                    locValue.TryGetProperty("coordinates", out var coords) &&
                    coords.GetArrayLength() >= 2)
                {
                    entity.Location = new LocationProperty
                    {
                        Type = "GeoProperty",
                        Value = new GeoValue
                        {
                            Type = "Point",
                            Coordinates = new[] { coords[0].GetDouble(), coords[1].GetDouble() }
                        }
                    };
                }
            }

            // dateObserved
            if (root.TryGetProperty("dateObserved", out var date))
            {
                if (date.TryGetProperty("value", out var dateValue))
                {
                    entity.DateObserved = new DateTimeProperty
                    {
                        Type = "Property",
                        Value = dateValue.GetDateTime()
                    };
                }
            }
            else
            {
                // Fallback: use current time
                entity.DateObserved = new DateTimeProperty
                {
                    Type = "Property",
                    Value = DateTime.UtcNow
                };
            }

            // AQI (Air Quality Index) - tu MQ135 sensor
            if (root.TryGetProperty("airQualityIndex", out var aqi))
            {
                if (aqi.TryGetProperty("value", out var aqiValue))
                {
                    entity.AirQualityIndex = new NumericProperty
                    {
                        Type = "Property",
                        Value = aqiValue.GetDouble(),
                        UnitCode = aqi.TryGetProperty("unitCode", out var u) ? u.GetString() : "P1",
                        ObservedAt = DateTime.UtcNow
                    };
                }
            }

            // SOSA fields (optional) - Parse to Relationship objects
            if (root.TryGetProperty("sosa:madeBySensor", out var mbs))
            {
                if (mbs.ValueKind == System.Text.Json.JsonValueKind.String)
                {
                    entity.MadeBySensor = new Relationship 
                    { 
                        Object = mbs.GetString() ?? "" 
                    };
                }
                else if (mbs.ValueKind == System.Text.Json.JsonValueKind.Object && 
                         mbs.TryGetProperty("object", out var mbsObj))
                {
                    entity.MadeBySensor = new Relationship 
                    { 
                        Object = mbsObj.GetString() ?? "" 
                    };
                }
            }
            
            if (root.TryGetProperty("sosa:observedProperty", out var op))
            {
                if (op.ValueKind == System.Text.Json.JsonValueKind.String)
                {
                    entity.ObservedProperty = new Relationship 
                    { 
                        Object = op.GetString() ?? "" 
                    };
                }
                else if (op.ValueKind == System.Text.Json.JsonValueKind.Object && 
                         op.TryGetProperty("value", out var opVal))
                {
                    entity.ObservedProperty = new Relationship 
                    { 
                        Object = opVal.GetString() ?? "" 
                    };
                }
                else if (op.ValueKind == System.Text.Json.JsonValueKind.Object && 
                         op.TryGetProperty("object", out var opObj))
                {
                    entity.ObservedProperty = new Relationship 
                    { 
                        Object = opObj.GetString() ?? "" 
                    };
                }
            }
            
            if (root.TryGetProperty("sosa:hasFeatureOfInterest", out var foi))
            {
                if (foi.ValueKind == System.Text.Json.JsonValueKind.String)
                {
                    entity.HasFeatureOfInterest = new Relationship 
                    { 
                        Object = foi.GetString() ?? "" 
                    };
                }
                else if (foi.ValueKind == System.Text.Json.JsonValueKind.Object && 
                         foi.TryGetProperty("object", out var foiObj))
                {
                    entity.HasFeatureOfInterest = new Relationship 
                    { 
                        Object = foiObj.GetString() ?? "" 
                    };
                }
            }

            _logger.LogDebug("Da parse du lieu IoT thanh cong");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Loi khi parse du lieu IoT: {Message}", ex.Message);
            // Tra ve entity voi du lieu da parse duoc, khong throw exception
            // de tranh lam gian doan luong xu ly chinh
        }

        return entity;
    }

    /// <summary>
    /// Helper: Tao NumericProperty tu value va unit
    /// Luu y: Khong loai bo gia tri 0 vi 0 la gia tri hop le cho mot so chi so
    /// </summary>
    private NumericProperty? CreateNumericProperty(double? value, string unitCode)
    {
        // Chi kiem tra null, khong loai bo gia tri 0
        if (!value.HasValue)
            return null;
        
        // Kiem tra gia tri am (khong hop le cho chi so chat luong khong khi)
        if (value.Value < 0)
        {
            _logger.LogWarning("Gia tri am khong hop le: {Value}, bo qua", value.Value);
            return null;
        }
        
        return new NumericProperty
        {
            Type = "Property",
            Value = value.Value,
            UnitCode = unitCode,
            ObservedAt = DateTime.UtcNow
        };
    }
}