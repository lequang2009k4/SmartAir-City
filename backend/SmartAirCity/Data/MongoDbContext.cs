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

using Microsoft.Extensions.Configuration;
using MongoDB.Driver;
using SmartAirCity.Models;

namespace SmartAirCity.Data;

public class MongoDbContext
{
    public IMongoDatabase Database { get; }
    public IMongoCollection<AirQuality> AirQuality { get; }
    public IMongoCollection<ContributedAirQuality> ContributedData { get; }

    public MongoDbContext(IConfiguration config, ILogger<MongoDbContext> logger)
    {
        // Doc connection string tu appsettings.json 
        var conn = config.GetConnectionString("MongoDb");
        if (string.IsNullOrEmpty(conn))
        {
            var errorMsg = "Cau hinh ConnectionStrings:MongoDb khong duoc tim thay trong appsettings.json. Vui long cau hinh trong appsettings.json";
            logger.LogError(errorMsg);
            throw new InvalidOperationException(errorMsg);
        }
        
        var client = new MongoClient(conn);

        // Doc database name tu appsettings.json 
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
        
        logger.LogInformation("MongoDB da ket noi toi database: {DatabaseName}", dbName);
    }
}