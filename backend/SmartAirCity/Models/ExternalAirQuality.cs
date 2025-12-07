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
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SmartAirCity.Models;

/// <summary>
/// NGSI-LD compliant model for air quality data from external sources
/// Follows the same structure as AirQuality for consistency
/// </summary>
[BsonIgnoreExtraElements]
public class ExternalAirQuality
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonIgnore]
    public string? MongoId { get; set; }

    [BsonElement("id")]
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

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
    public Relationship MadeBySensor { get; set; } = new();

    [BsonElement("sosa:observedProperty")]
    [JsonPropertyName("sosa:observedProperty")]
    public Relationship ObservedProperty { get; set; } = new()
    {
        Object = "AirQuality"
    };

    [BsonElement("sosa:hasFeatureOfInterest")]
    [JsonPropertyName("sosa:hasFeatureOfInterest")]
    public Relationship HasFeatureOfInterest { get; set; } = new();

    [BsonElement("location")]
    [JsonPropertyName("location")]
    public LocationProperty? Location { get; set; }

    [BsonElement("dateObserved")]
    [JsonPropertyName("dateObserved")]
    public DateTimeProperty DateObserved { get; set; } = new();

    /// <summary>
    /// Dynamic properties for ALL measurements (PM2.5, CO, NO2, etc.)
    /// Stored at root level, not nested in "properties"
    /// </summary>
    [BsonExtraElements]
    [JsonExtensionData]
    public Dictionary<string, object>? Properties { get; set; }

    // StationId for linking with Stations collection
    // This is set from ExternalSource.StationId when data is pulled
    [BsonElement("stationId")]
    [JsonPropertyName("stationId")]
    [System.Text.Json.Serialization.JsonIgnore(Condition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull)]
    public string? StationId { get; set; }

    // Metadata for external source tracking (optional, not part of NGSI-LD standard)
    // Lưu trong DB nhưng không trả về trong API response
    [BsonElement("externalMetadata")]
    [BsonIgnoreIfNull]
    [JsonIgnore]
    public ExternalMetadata? ExternalMetadata { get; set; }
}

public class ExternalMetadata
{
    [BsonElement("sourceName")]
    [JsonPropertyName("sourceName")]
    public string SourceName { get; set; } = string.Empty;

    [BsonElement("sourceUrl")]
    [JsonPropertyName("sourceUrl")]
    public string SourceUrl { get; set; } = string.Empty;

    [BsonElement("fetchedAt")]
    [JsonPropertyName("fetchedAt")]
    public DateTime FetchedAt { get; set; }
}
