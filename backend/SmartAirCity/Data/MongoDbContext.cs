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

using Microsoft.Extensions.Configuration;
using MongoDB.Bson.Serialization.Conventions;
using MongoDB.Driver;
using SmartAirCity.Models;

namespace SmartAirCity.Data;

public class MongoDbContext
{
    public IMongoDatabase Database { get; }
    public IMongoCollection<AirQuality> AirQuality { get; }
    public IMongoCollection<ContributedAirQuality> ContributedData { get; }
    public IMongoCollection<ExternalSource> ExternalSources { get; }
    public IMongoCollection<ExternalAirQuality> ExternalAirQuality { get; }
    public IMongoCollection<ExternalMqttSource> ExternalMqttSources { get; }
    public IMongoCollection<Station> Stations { get; }


    static MongoDbContext()
    {
        var conventionPack = new ConventionPack { new IgnoreExtraElementsConvention(true) };
        ConventionRegistry.Register("IgnoreExtraElements", conventionPack, _ => true);
    }

    public MongoDbContext(IConfiguration config, ILogger<MongoDbContext> logger)
    {
        var conn = config.GetConnectionString("MongoDb");
        if (string.IsNullOrEmpty(conn))
        {
            var errorMsg = "Cau hinh ConnectionStrings:MongoDb khong duoc tim thay trong appsettings.json. Vui long cau hinh trong appsettings.json";
            logger.LogError(errorMsg);
            throw new InvalidOperationException(errorMsg);
        }
        
        var client = new MongoClient(conn);

        var dbName = config["Mongo:Database"];
        if (string.IsNullOrEmpty(dbName))
        {
            var errorMsg = "Cau hinh Mongo:Database khong duoc tim thay trong appsettings.json. Vui long cau hinh trong appsettings.json";
            logger.LogError(errorMsg);
            throw new InvalidOperationException(errorMsg);
        }
        
        Database = client.GetDatabase(dbName);

        AirQuality = Database.GetCollection<AirQuality>("AirQuality");
        ContributedData = Database.GetCollection<ContributedAirQuality>("ContributedData");
        ExternalSources = Database.GetCollection<ExternalSource>("ExternalSources");
        ExternalAirQuality = Database.GetCollection<ExternalAirQuality>("ExternalAirQuality");
        ExternalMqttSources = Database.GetCollection<ExternalMqttSource>("ExternalMqttSources");
        Stations = Database.GetCollection<Station>("Stations");

        
        logger.LogInformation("MongoDB da ket noi toi database: {DatabaseName}", dbName);
    }
}
