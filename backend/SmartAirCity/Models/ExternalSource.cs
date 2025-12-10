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

namespace SmartAirCity.Models;

/// <summary>
/// External Data Source configuration for HTTP/HTTPS APIs
/// Only NGSI-LD format is supported - API must return compliant NGSI-LD JSON
/// </summary>
public class ExternalSource
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// API endpoint URL - must return NGSI-LD compliant JSON
    /// </summary>
    public string Url { get; set; } = string.Empty;
    
    public string StationId { get; set; } = string.Empty;
    
    /// <summary>
    /// Polling interval in minutes (default: 60 minutes)
    /// </summary>
    public int IntervalMinutes { get; set; } = 60;
    
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    
    /// <summary>
    /// HTTP headers for API authentication (e.g., X-API-Key)
    /// </summary>
    public Dictionary<string, string> Headers { get; set; } = new();
    
    /// <summary>
    /// Last time data was fetched from this source (system-managed)
    /// </summary>
    public DateTime? LastFetchedAt { get; set; }
    
    /// <summary>
    /// Number of consecutive failures (system-managed)
    /// </summary>
    public int FailureCount { get; set; } = 0;
    
    /// <summary>
    /// Whether this source is active (system-managed)
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// Last error message if fetch failed (system-managed)
    /// </summary>
    public string? LastError { get; set; }
}
