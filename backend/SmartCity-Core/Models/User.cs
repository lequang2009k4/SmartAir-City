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
    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("email")]  // Ánh xạ trường "mail" trong MongoDB vào thuộc tính "Email"
        public string Email { get; set; } = null!;

        [BsonElement("pw")]  // Ánh xạ trường "pw" trong MongoDB vào thuộc tính "Password"
        public string Password { get; set; } = null!;

        [BsonElement("name")]  // Ánh xạ trường "name" trong MongoDB vào thuộc tính "Name"
        public string Name { get; set; } = null!;

        [BsonElement("role")]  // Ánh xạ trường "role" trong MongoDB vào thuộc tính "Role"
        public string Role { get; set; } = "citizen";  // Default: citizens
    }
}
