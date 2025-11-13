//  SPDX-License-Identifier: MIT
//  © 2025 SmartAir City Team

//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
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
