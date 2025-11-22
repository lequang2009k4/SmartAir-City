/**
 *  SmartAir City – IoT Platform for Urban Air Quality Monitoring
 *  based on NGSI-LD and FiWARE Standards
 *
 *  SPDX-License-Identifier: MIT
 *  @version   0.1.x
 *  @author    SmartAir City Team <smartaircity@gmail.com>
 *  @copyright © 2025 SmartAir City Team. 
 *  @license   MIT License
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
    public string? MadeBySensor { get; set; }

    [BsonElement("sosa:observedProperty")]
    [JsonPropertyName("sosa:observedProperty")]
    public string? ObservedProperty { get; set; }

    [BsonElement("sosa:hasFeatureOfInterest")]
    [JsonPropertyName("sosa:hasFeatureOfInterest")]
    public string? HasFeatureOfInterest { get; set; }

    [BsonElement("location")]
    [JsonPropertyName("location")]
    public LocationProperty Location { get; set; } = new();

    [BsonElement("dateObserved")]
    [JsonPropertyName("dateObserved")]
    public DateTimeProperty DateObserved { get; set; } = new()
    {
        Value = DateTime.UtcNow
    };

    [BsonElement("pm25")]
    [JsonPropertyName("pm25")]
    public NumericProperty? Pm25 { get; set; }

    [BsonElement("pm10")]
    [JsonPropertyName("pm10")]
    public NumericProperty? Pm10 { get; set; }

    [BsonElement("o3")]
    [JsonPropertyName("o3")]
    public NumericProperty? O3 { get; set; }

    [BsonElement("no2")]
    [JsonPropertyName("no2")]
    public NumericProperty? No2 { get; set; }

    [BsonElement("so2")]
    [JsonPropertyName("so2")]
    public NumericProperty? So2 { get; set; }

    [BsonElement("co")]
    [JsonPropertyName("co")]
    public NumericProperty? Co { get; set; }

    [BsonElement("airQualityIndex")]
    [JsonPropertyName("airQualityIndex")]
    public NumericProperty? AirQualityIndex { get; set; }
}
