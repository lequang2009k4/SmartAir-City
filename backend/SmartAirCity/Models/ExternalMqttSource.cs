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
using System.Text.Json.Serialization;

namespace SmartAirCity.Models;

/// <summary>
/// Model cho External MQTT Broker đăng ký từ user
/// Tương tự OpenSenseMap - cho phép user connect sensor của họ vào hệ thống
/// </summary>
public class ExternalMqttSource
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    /// <summary>
    /// Tên trạm/sensor (do user đặt)
    /// </summary>
    [BsonElement("name")]
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Station ID (auto-generated từ name)
    /// </summary>
    [BsonElement("stationId")]
    [JsonPropertyName("stationId")]
    public string StationId { get; set; } = string.Empty;

    /// <summary>
    /// MQTT Broker host (ví dụ: broker.hivemq.com, mqtt.eclipseprojects.io)
    /// </summary>
    [BsonElement("brokerHost")]
    [JsonPropertyName("brokerHost")]
    public string BrokerHost { get; set; } = string.Empty;

    /// <summary>
    /// MQTT Broker port (mặc định: 1883, TLS: 8883)
    /// </summary>
    [BsonElement("brokerPort")]
    [JsonPropertyName("brokerPort")]
    public int BrokerPort { get; set; } = 1883;

    /// <summary>
    /// MQTT Topic để subscribe (ví dụ: home/hanoi/sensor1)
    /// </summary>
    [BsonElement("topic")]
    [JsonPropertyName("topic")]
    public string Topic { get; set; } = string.Empty;

    /// <summary>
    /// Username (optional - nếu broker yêu cầu authentication)
    /// </summary>
    [BsonElement("username")]
    [JsonPropertyName("username")]
    public string? Username { get; set; }

    /// <summary>
    /// Password (optional - nếu broker yêu cầu authentication)
    /// </summary>
    [BsonElement("password")]
    [JsonPropertyName("password")]
    public string? Password { get; set; }

    /// <summary>
    /// Sử dụng TLS/SSL (mặc định: false)
    /// </summary>
    [BsonElement("useTls")]
    [JsonPropertyName("useTls")]
    public bool UseTls { get; set; } = false;

    /// <summary>
    /// Vĩ độ (Latitude)
    /// </summary>
    [BsonElement("latitude")]
    [JsonPropertyName("latitude")]
    public double Latitude { get; set; }

    /// <summary>
    /// Kinh độ (Longitude)
    /// </summary>
    [BsonElement("longitude")]
    [JsonPropertyName("longitude")]
    public double Longitude { get; set; }

    /// <summary>
    /// OpenAQ Location ID (optional - để lấy chi tiết PM2.5, PM10, CO, NO2... từ OpenAQ)
    /// Nếu không có, sẽ tự động tìm trạm gần nhất theo tọa độ
    /// </summary>
    [BsonElement("openAQLocationId")]
    [JsonPropertyName("openAQLocationId")]
    [BsonIgnoreIfNull]
    public int? OpenAQLocationId { get; set; }

    /// <summary>
    /// Trạng thái hoạt động
    /// </summary>
    [BsonElement("isActive")]
    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Ngày tạo
    /// </summary>
    [BsonElement("createdAt")]
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Lần kết nối thành công cuối cùng
    /// </summary>
    [BsonElement("lastConnectedAt")]
    [JsonPropertyName("lastConnectedAt")]
    [BsonIgnoreIfNull]
    public DateTime? LastConnectedAt { get; set; }

    /// <summary>
    /// Lần nhận message cuối cùng
    /// </summary>
    [BsonElement("lastMessageAt")]
    [JsonPropertyName("lastMessageAt")]
    [BsonIgnoreIfNull]
    public DateTime? LastMessageAt { get; set; }

    /// <summary>
    /// Lỗi kết nối (nếu có)
    /// </summary>
    [BsonElement("lastError")]
    [JsonPropertyName("lastError")]
    [BsonIgnoreIfNull]
    public string? LastError { get; set; }

    /// <summary>
    /// Số message đã nhận
    /// </summary>
    [BsonElement("messageCount")]
    [JsonPropertyName("messageCount")]
    public long MessageCount { get; set; } = 0;
}
