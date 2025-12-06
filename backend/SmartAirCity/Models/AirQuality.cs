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



using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace SmartAirCity.Models;

public class NumericProperty
{
    [BsonElement("type")]
    [JsonPropertyName("type")]
    public string Type { get; set; } = "Property";

    [BsonElement("value")]
    [JsonPropertyName("value")]
    public double? Value { get; set; }

    [BsonElement("unitCode")]
    [JsonPropertyName("unitCode")]
    public string? UnitCode { get; set; }

    [BsonElement("observedAt")]
    [JsonPropertyName("observedAt")]
    public DateTime? ObservedAt { get; set; }
}

public class GeoValue
{
    [BsonElement("type")]
    [JsonPropertyName("type")]
    public string Type { get; set; } = "Point";

    [BsonElement("coordinates")]
    [JsonPropertyName("coordinates")]
    public double[] Coordinates { get; set; } = new double[2];
}

public class LocationProperty
{
    [BsonElement("type")]
    [JsonPropertyName("type")]
    public string Type { get; set; } = "GeoProperty";

    [BsonElement("value")]
    [JsonPropertyName("value")]
    public GeoValue Value { get; set; } = new();
}

[BsonIgnoreExtraElements]
public class DateTimeProperty
{
    [BsonElement("type")]
    [JsonPropertyName("type")]
    public string Type { get; set; } = "Property";

    [BsonElement("value")]
    [JsonPropertyName("value")]
    public DateTime Value { get; set; }
}

public class Relationship
{
    [BsonElement("type")]
    [JsonPropertyName("type")]
    public string Type { get; set; } = "Relationship";

    [BsonElement("object")]
    [JsonPropertyName("object")]
    public string Object { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class AirQuality
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonIgnore] // Khong hien thi MongoId ra JSON NGSI-LD
    public string? MongoId { get; set; }

    [BsonElement("id")]
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [BsonElement("type")]
    [JsonPropertyName("type")]
    public string Type { get; set; } = "AirQualityObserved";

    [BsonElement("@context")]
    [JsonPropertyName("@context")]
    public object[] Context { get; set; } =
    {
        "https://smartdatamodels.org/context.jsonld",
        new { sosa = "http://www.w3.org/ns/sosa/" }
    };

    [BsonElement("sosa:madeBySensor")]
    [JsonPropertyName("sosa:madeBySensor")]
    public Relationship? MadeBySensor { get; set; }

    [BsonElement("sosa:observedProperty")]
    [JsonPropertyName("sosa:observedProperty")]
    public Relationship? ObservedProperty { get; set; }

    [BsonElement("sosa:hasFeatureOfInterest")]
    [JsonPropertyName("sosa:hasFeatureOfInterest")]
    public Relationship? HasFeatureOfInterest { get; set; }

    [BsonElement("location")]
    [JsonPropertyName("location")]
    public LocationProperty Location { get; set; } = new();

    [BsonElement("dateObserved")]
    [JsonPropertyName("dateObserved")]
    public DateTimeProperty DateObserved { get; set; } = new()
    {
        Value = DateTime.UtcNow
    };

    /// <summary>
    /// Dynamic properties for ALL measurements (PM2.5, PM10, O3, NO2, SO2, CO, Temperature, Humidity, VOC, etc.)
    /// NGSI-LD Full compliance: Any measurement can be added without code changes
    /// </summary>
    [BsonExtraElements]
    [JsonExtensionData]
    public Dictionary<string, object>? Properties { get; set; }

    // Helper methods for common properties (backward compatibility)
    [BsonIgnore]
    [JsonIgnore]
    public NumericProperty? PM25
    {
        get => GetProperty("PM25");
        set => SetProperty("PM25", value);
    }

    [BsonIgnore]
    [JsonIgnore]
    public NumericProperty? PM10
    {
        get => GetProperty("PM10");
        set => SetProperty("PM10", value);
    }

    [BsonIgnore]
    [JsonIgnore]
    public NumericProperty? O3
    {
        get => GetProperty("O3");
        set => SetProperty("O3", value);
    }

    [BsonIgnore]
    [JsonIgnore]
    public NumericProperty? NO2
    {
        get => GetProperty("NO2");
        set => SetProperty("NO2", value);
    }

    [BsonIgnore]
    [JsonIgnore]
    public NumericProperty? SO2
    {
        get => GetProperty("SO2");
        set => SetProperty("SO2", value);
    }

    [BsonIgnore]
    [JsonIgnore]
    public NumericProperty? CO
    {
        get => GetProperty("CO");
        set => SetProperty("CO", value);
    }

    [BsonIgnore]
    [JsonIgnore]
    public NumericProperty? AirQualityIndex
    {
        get => GetProperty("airQualityIndex");
        set => SetProperty("airQualityIndex", value);
    }

    private NumericProperty? GetProperty(string key)
    {
        if (Properties == null || !Properties.TryGetValue(key, out var value) || value == null)
            return null;

        // Case 1: Already a NumericProperty (shouldn't happen after fix, but keep for safety)
        if (value is NumericProperty np)
            return np;

        // Case 2: From JSON deserialization (JsonExtensionData) -> JsonElement
        if (value is System.Text.Json.JsonElement jsonEl)
        {
            try
            {
                return System.Text.Json.JsonSerializer.Deserialize<NumericProperty>(jsonEl.GetRawText());
            }
            catch { return null; }
        }

        // Case 3: From MongoDB (BsonExtraElements) -> Dictionary or BsonDocument-like structure
        if (value is System.Collections.IDictionary dict)
        {
            try
            {
                var prop = new NumericProperty();
                if (dict.Contains("type") && dict["type"] is string typeVal)
                    prop.Type = typeVal;
                if (dict.Contains("value"))
                {
                    var val = dict["value"];
                    if (val is double dbl)
                        prop.Value = dbl;
                    else if (val != null && double.TryParse(val.ToString(), out var parsed))
                        prop.Value = parsed;
                }
                if (dict.Contains("unitCode") && dict["unitCode"] is string unitVal)
                    prop.UnitCode = unitVal;
                if (dict.Contains("observedAt"))
                {
                    var obs = dict["observedAt"];
                    if (obs is DateTime dt)
                        prop.ObservedAt = dt;
                    else if (obs != null && DateTime.TryParse(obs.ToString(), out var parsedDt))
                        prop.ObservedAt = parsedDt;
                }
                return prop;
            }
            catch { return null; }
        }

        return null;
    }

    private void SetProperty(string key, NumericProperty? value)
    {
        Properties ??= new Dictionary<string, object>();
        
        if (value != null)
        {
            // Store as dictionary to avoid MongoDB serialization issues
            // MongoDB can serialize Dictionary<string, object?> as BsonDocument
            Properties[key] = new Dictionary<string, object?>
            {
                ["type"] = value.Type,
                ["value"] = value.Value,
                ["unitCode"] = value.UnitCode,
                ["observedAt"] = value.ObservedAt
            };
        }
        else
        {
            Properties.Remove(key);
        }
    }
}
