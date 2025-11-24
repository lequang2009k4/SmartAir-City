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


using Microsoft.Extensions.Configuration;
using MongoDB.Driver;
using SmartAirCity.Models;

namespace SmartAirCity.Data;

public class MongoDbContext
{
    public IMongoDatabase Database { get; }
    public IMongoCollection<AirQuality> AirQuality { get; }
    public IMongoCollection<AirQuality> ContributedData { get; }

    public MongoDbContext(IConfiguration config)
    {
        var conn = config.GetConnectionString("MongoDb") 
           ?? "mongodb://localhost:27017";
        var client = new MongoClient(conn);

        var dbName = config["Mongo:Database"] ?? "smartaircityDB";
        Database = client.GetDatabase(dbName);

        AirQuality = Database.GetCollection<AirQuality>("AirQuality");
        ContributedData = Database.GetCollection<AirQuality>("ContributedData");
    }
}