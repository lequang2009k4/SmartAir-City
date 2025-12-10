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
/// Station model - Lưu thông tin các trạm quan trắc trong MongoDB
/// </summary>
public class Station
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    
    /// <summary>
    /// Station ID dùng trong hệ thống (e.g., "station-oceanpark")
    /// Unique identifier
    /// </summary>
    [BsonElement("stationId")]
    public string StationId { get; set; } = string.Empty;
    
    /// <summary>
    /// Tên hiển thị (e.g., "Hanoi - Ocean Park")
    /// </summary>
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Tọa độ latitude
    /// </summary>
    [BsonElement("latitude")]
    public double Latitude { get; set; }
    
    /// <summary>
    /// Tọa độ longitude
    /// </summary>
    [BsonElement("longitude")]
    public double Longitude { get; set; }
    
    /// <summary>
    /// Loại station: "official", "external-http", "external-mqtt", "iot"
    /// </summary>
    [BsonElement("type")]
    public string Type { get; set; } = "official";
    
    /// <summary>
    /// Trạng thái hoạt động
    /// </summary>
    [BsonElement("isActive")]
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// OpenAQ Location ID (nếu có)
    /// </summary>
    [BsonElement("openAQLocationId")]
    [BsonIgnoreIfNull]
    public int? OpenAQLocationId { get; set; }
    
    /// <summary>
    /// Sensor URN (e.g., "urn:ngsi-ld:Device:mq135-oceanpark")
    /// </summary>
    [BsonElement("sensorUrn")]
    [BsonIgnoreIfNull]
    public string? SensorUrn { get; set; }
    
    /// <summary>
    /// Feature of Interest (e.g., "urn:ngsi-ld:Air:urban-hanoi")
    /// </summary>
    [BsonElement("featureOfInterest")]
    [BsonIgnoreIfNull]
    public string? FeatureOfInterest { get; set; }
    
    /// <summary>
    /// Metadata bổ sung (flexible)
    /// </summary>
    [BsonElement("metadata")]
    [BsonIgnoreIfNull]
    public Dictionary<string, object?>? Metadata { get; set; }
    
    /// <summary>
    /// Thời gian tạo
    /// </summary>
    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Thời gian cập nhật
    /// </summary>
    [BsonElement("updatedAt")]
    [BsonIgnoreIfNull]
    public DateTime? UpdatedAt { get; set; }
}
