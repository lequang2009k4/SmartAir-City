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

    public DataNormalizationService(ILogger<DataNormalizationService> logger)
    {
        _logger = logger;
    }

    public AirQuality? NormalizeFromIotJson(string jsonLd)
    {
        try
        {
            using var doc = JsonDocument.Parse(jsonLd);
            var root = doc.RootElement;
            var entity = new AirQuality();

            // id
            if (root.TryGetProperty("id", out var idEl))
                entity.Id = idEl.GetString();

            // GeoProperty
            if (root.TryGetProperty("location", out var loc) &&
                loc.TryGetProperty("value", out var locValue) &&
                locValue.TryGetProperty("coordinates", out var coords) &&
                coords.GetArrayLength() >= 2)
            {
                entity.Location.Value.Coordinates[0] = coords[0].GetDouble();
                entity.Location.Value.Coordinates[1] = coords[1].GetDouble();
            }

            // dateObserved (không có observedAt)
            if (root.TryGetProperty("dateObserved", out var date) &&
                date.TryGetProperty("value", out var dateValue))
            {
                entity.DateObserved.Value = dateValue.GetDateTime();
            }

            // AQI
            if (root.TryGetProperty("airQualityIndex", out var aqi) &&
                aqi.TryGetProperty("value", out var aqiValue))
            {
                entity.AirQualityIndex = new NumericProperty
                {
                    Value = aqiValue.GetDouble(),
                    UnitCode = aqi.TryGetProperty("unitCode", out var u) ? u.GetString() : "P1",
                    ObservedAt = DateTime.UtcNow
                };
            }

            // sosa: fields
            if (root.TryGetProperty("sosa:madeBySensor", out var mbs))
                entity.MadeBySensor = mbs.GetString();
            if (root.TryGetProperty("sosa:observedProperty", out var op))
                entity.ObservedProperty = op.GetString();
            if (root.TryGetProperty("sosa:hasFeatureOfInterest", out var foi))
                entity.HasFeatureOfInterest = foi.GetString();

            _logger.LogInformation("✅ Normalize IoT JSON-LD OK");
            return entity;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error normalizing IoT JSON-LD");
            return null;
        }
    }
}
