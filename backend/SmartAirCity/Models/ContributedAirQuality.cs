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


using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace SmartAirCity.Models;

/// <summary>
/// AirQuality document extended with metadata for contributed data.
/// Stored in ContributedData collection.
/// </summary>
[BsonIgnoreExtraElements]
public class ContributedAirQuality : AirQuality
{
    [BsonElement("userId")]
    [JsonPropertyName("userId")]
    public string? UserId { get; set; }

    [BsonElement("contributionId")]
    [JsonPropertyName("contributionId")]
    public string? ContributionId { get; set; }
}

