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


using MongoDB.Driver;
using SmartAirCity.Data;
using SmartAirCity.Models;

namespace SmartAirCity.Services;

public class AirQualityService
{
    private readonly MongoDbContext _db;
   // private readonly OpenAQLiveClient _openAq;
    private readonly ILogger<AirQualityService> _logger;

    public AirQualityService(MongoDbContext db, ILogger<AirQualityService> logger)
    {
        _db = db;
        _logger = logger;
    }

    // === Insert du lieu tu IoT + OpenAQ ===
    public async Task InsertAsync(AirQuality data, CancellationToken ct = default)
    {
        // Sinh ID NGSI-LD neu chua co
        data.Id ??= $"urn:ngsi-ld:AirQualityObserved:station-hn01:{DateTime.UtcNow:yyyy-MM-ddTHH:mm:ssZ}";

        // Thiet lap thuoc tinh chuan NGSI-LD
        data.Type = "AirQualityObserved";
        data.Context = new object[]
        {
            "https://smartdatamodels.org/context.jsonld",
            new { sosa = "http://www.w3.org/ns/sosa/" }
        };
        data.ObservedProperty = "AirQuality";
        data.MadeBySensor ??= "urn:ngsi-ld:Device:mq135-hn01";
        data.HasFeatureOfInterest ??= "urn:ngsi-ld:Air:urban-hanoi";
        data.DateObserved = new DateTimeProperty { Type = "Property", Value = DateTime.UtcNow };

        await _db.AirQuality.InsertOneAsync(data, cancellationToken: ct);
    }

    // cac ham truy van
    public async Task<List<AirQuality>> GetAllAsync(CancellationToken ct = default) =>
        await _db.AirQuality
            .Find(FilterDefinition<AirQuality>.Empty)
            .Sort(Builders<AirQuality>.Sort.Descending(x => x.DateObserved.Value).Descending("_id"))
            .ToListAsync(ct);

    public async Task<AirQuality?> GetLatestAsync(CancellationToken ct = default) =>
        await _db.AirQuality
            .Find(FilterDefinition<AirQuality>.Empty)
            .Sort(Builders<AirQuality>.Sort.Descending(x => x.DateObserved.Value).Descending("_id"))
            .FirstOrDefaultAsync(ct);

    public async Task<List<AirQuality>> GetLatestNAsync(int limit = 50, CancellationToken ct = default) =>
        await _db.AirQuality
            .Find(FilterDefinition<AirQuality>.Empty)
            .Sort(Builders<AirQuality>.Sort.Descending(x => x.DateObserved.Value).Descending("_id"))
            .Limit(limit)
            .ToListAsync(ct);

    public async Task<List<AirQuality>> GetByTimeRangeAsync(DateTime from, DateTime to, CancellationToken ct = default)
    {
        var filter = Builders<AirQuality>.Filter.And(
            Builders<AirQuality>.Filter.Gte(x => x.DateObserved.Value, from),
            Builders<AirQuality>.Filter.Lte(x => x.DateObserved.Value, to)
        );

        return await _db.AirQuality
            .Find(filter)
            .Sort(Builders<AirQuality>.Sort.Ascending(x => x.DateObserved.Value).Ascending("_id"))
            .ToListAsync(ct);
    }
}
