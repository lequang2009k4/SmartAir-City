//  SPDX-License-Identifier: MIT
//  © 2025 SmartAir City Team
 
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.


using Microsoft.Extensions.Configuration;
using MongoDB.Driver;
using SmartAirCity.Models;

namespace SmartAirCity.Data;

public class MongoDbContext
{
    public IMongoDatabase Database { get; }
    public IMongoCollection<AirQuality> AirQuality { get; }

    public MongoDbContext(IConfiguration config)
    {
        var conn = config.GetConnectionString("MongoDb") 
           ?? "mongodb://localhost:27017";
        var client = new MongoClient(conn);

        var dbName = config["Mongo:Database"] ?? "smartaircityDB";
        Database = client.GetDatabase(dbName);

        AirQuality = Database.GetCollection<AirQuality>("AirQuality");
    }
}
