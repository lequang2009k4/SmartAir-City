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

namespace MyMongoApi.Models
{
    public class Device
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("deviceId")]
        public string DeviceId { get; set; } = null!;

        [BsonElement("deviceName")]
        public string DeviceName { get; set; } = null!;

        [BsonElement("type")]
        public string Type { get; set; } = null!;  // Đây là trường "type" trong MongoDB

        [BsonElement("observedProperty")]
        public string ObservedProperty { get; set; } = null!;

        [BsonElement("featureOfInterest")]
        public string FeatureOfInterest { get; set; } = null!;

        [BsonElement("location")]
        public Location Location { get; set; } = new Location();

        [BsonElement("status")]
        public string Status { get; set; } = "active"; // default value is "active"

        [BsonElement("description")]
        public string Description { get; set; } = null!;
    }

    // Đảm bảo có cấu trúc Location hợp lý
    public class Location
    {
        [BsonElement("type")]
        public string Type { get; set; } = "Point";

        [BsonElement("coordinates")]
        public double[] Coordinates { get; set; } = new double[2];
    }
}
