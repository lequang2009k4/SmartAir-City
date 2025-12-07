/**
 *  SmartAir City - IoT Platform for Urban Air Quality Monitoring
 *  based on NGSI-LD and FiWARE Standards
 *
 *  SPDX-License-Identifier: MIT
 *  @version   0.1.x
 *  @author    SmartAir City Team <smartaircity@gmail.com>
 *  @copyright 2025 SmartAir City Team. 
 *  @license   MIT License
 *  See LICENSE file in root directory for full license text.
 *  @see       https://github.com/lequang2009k4/SmartAir-City   SmartAir City Open Source Project
 *
 *  This software is an open-source component of the SmartAir City initiative.
 *  It provides real-time environmental monitoring, NGSI-LD-compliant data
 *  models, MQTT-based data ingestion, and FiWARE Smart Data Models for
 *  open-data services and smart-city applications.
 */
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartAirCity.Models;

public class ExternalSource
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string StationId { get; set; } = string.Empty;
    public int IntervalMinutes { get; set; } = 60;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public Dictionary<string, string> Headers { get; set; } = new();
    
    public bool IsNGSILD { get; set; } = false;
    
    public ExternalSourceMapping? Mapping { get; set; } = new();
    
    public DateTime? LastFetchedAt { get; set; }
    
    public int FailureCount { get; set; } = 0;
    
    public bool IsActive { get; set; } = true;
    
    public string? LastError { get; set; }
}

[BsonIgnoreExtraElements]
public class ExternalSourceMapping
{
    public string? DataPath { get; set; }
    
    public Dictionary<string, string> FieldMappings { get; set; } = new();
    
    public string? TimestampPath { get; set; }
}
