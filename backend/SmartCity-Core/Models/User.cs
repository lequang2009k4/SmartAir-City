//  SPDX-License-Identifier: MIT
//  © 2025 SmartAir City Team

//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
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
