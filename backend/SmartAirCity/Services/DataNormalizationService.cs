//  SPDX-License-Identifier: MIT
//  © 2025 SmartAir City Team
 
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.

using System.Text.Json;
using SmartAirCity.Models;

namespace SmartAirCity.Services;

public class DataNormalizationService
{
    private readonly ILogger<DataNormalizationService> _logger;
    private readonly OpenAQLiveClient _openAqClient;

    public DataNormalizationService(
        ILogger<DataNormalizationService> logger,
        OpenAQLiveClient openAqClient)
    {
        _logger = logger;
        _openAqClient = openAqClient;
    }


    /// <summary>
    /// Normalize IoT data từ MQTT + Merge với OpenAQ API data
    /// </summary>
    /// <param name="rawIotJson">JSON từ MQTT broker (MQ135 sensor)</param>
    /// <returns>AirQuality entity đã merge IoT + OpenAQ</returns>
    public async Task<AirQuality> NormalizeAndMergeAsync(JsonElement rawIotJson)
    {
        // 1. Parse IoT data (chỉ có AQI từ MQ135)
        var entity = ParseIotData(rawIotJson);
        
        _logger.LogInformation("Parsed IoT: AQI={Aqi}, Location=[{Lon},{Lat}]", 
            entity.AirQualityIndex?.Value,
            entity.Location?.Value?.Coordinates?[0],
            entity.Location?.Value?.Coordinates?[1]);

        // 2. Fetch OpenAQ data để bổ sung PM2.5, PM10, O3, NO2, SO2, CO
        try
        {
            // Sử dụng tọa độ trạm 556 Nguyễn Văn Cừ, Hanoi (locationId: 4946811)
            var openaqData = await _openAqClient.GetNearestAsync(21.028511, 105.804817);
            
            if (openaqData.HasValue)
            {
                // Merge OpenAQ data vào entity
                entity.Pm25 = CreateNumericProperty(openaqData.Value.pm25, "µg/m³");
                entity.Pm10 = CreateNumericProperty(openaqData.Value.pm10, "µg/m³");
                entity.O3 = CreateNumericProperty(openaqData.Value.o3, "µg/m³");
                entity.No2 = CreateNumericProperty(openaqData.Value.no2, "µg/m³");
                entity.So2 = CreateNumericProperty(openaqData.Value.so2, "µg/m³");
                entity.Co = CreateNumericProperty(openaqData.Value.co, "µg/m³");
                
                _logger.LogInformation("✅ Merged IoT + OpenAQ: PM2.5={Pm25}, PM10={Pm10}", 
                    openaqData.Value.pm25, openaqData.Value.pm10);
            }
            else
            {
                _logger.LogWarning("⚠️ OpenAQ returned null, using IoT data only");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "⚠️ Failed to fetch OpenAQ data, using IoT data only");
        }
        
        return entity;
    }

    /// <summary>
    /// Parse IoT JSON từ MQTT message
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

            // AQI (Air Quality Index) - từ MQ135 sensor
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

            // SOSA fields (optional)
            if (root.TryGetProperty("sosa:madeBySensor", out var mbs))
                entity.MadeBySensor = mbs.GetString();
            if (root.TryGetProperty("sosa:observedProperty", out var op))
                entity.ObservedProperty = op.GetString();
            if (root.TryGetProperty("sosa:hasFeatureOfInterest", out var foi))
                entity.HasFeatureOfInterest = foi.GetString();

            _logger.LogDebug("✅ Parsed IoT data successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error parsing IoT data");
        }

        return entity;
    }

    /// <summary>
    /// Helper: Tạo NumericProperty từ value và unit
    /// </summary>
    private NumericProperty? CreateNumericProperty(double? value, string unitCode)
    {
        if (!value.HasValue || value.Value <= 0)
            return null;
        
        return new NumericProperty
        {
            Type = "Property",
            Value = value.Value,
            UnitCode = unitCode,
            ObservedAt = DateTime.UtcNow
        };
    }
}