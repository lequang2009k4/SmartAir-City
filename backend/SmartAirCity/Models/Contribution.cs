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
 */

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace SmartAirCity.Models;

public enum ContributionStatus
{
    Pending,    // Chờ xem xét
    Approved,   // Đã duyệt
    Rejected    // Từ chối
}

[BsonIgnoreExtraElements]
public class Contribution
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonIgnore]
    public string? MongoId { get; set; }

    // Dữ liệu AirQuality từ người đóng góp
    [BsonElement("data")]
    [JsonPropertyName("data")]
    public AirQuality Data { get; set; } = new();

    // Metadata về người đóng góp
    [BsonElement("contributorEmail")]
    [JsonPropertyName("contributorEmail")]
    public string? ContributorEmail { get; set; }

    [BsonElement("contributorName")]
    [JsonPropertyName("contributorName")]
    public string? ContributorName { get; set; }

    [BsonElement("submittedAt")]
    [JsonPropertyName("submittedAt")]
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("status")]
    [JsonPropertyName("status")]
    [BsonRepresentation(BsonType.String)]
    public ContributionStatus Status { get; set; } = ContributionStatus.Pending;

    [BsonElement("reviewedAt")]
    [JsonPropertyName("reviewedAt")]
    public DateTime? ReviewedAt { get; set; }

    [BsonElement("reviewerNote")]
    [JsonPropertyName("reviewerNote")]
    public string? ReviewerNote { get; set; }

    [BsonElement("ipAddress")]
    [JsonPropertyName("ipAddress")]
    public string? IpAddress { get; set; }
}