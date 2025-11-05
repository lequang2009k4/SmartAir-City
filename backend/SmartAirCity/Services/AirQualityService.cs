//  SPDX-License-Identifier: MIT
//  © 2025 SmartAir City Team
 
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.


using MongoDB.Driver;
using SmartAirCity.Data;
using SmartAirCity.Models;

namespace SmartAirCity.Services;

public class AirQualityService
{
    private readonly MongoDbContext _db;
    private readonly OpenAQLiveClient _openAq;
    private readonly ILogger<AirQualityService> _logger;

    public AirQualityService(MongoDbContext db, OpenAQLiveClient openAq, ILogger<AirQualityService> logger)
    {
        _db = db;
        _openAq = openAq;
        _logger = logger;
    }

    // === Insert dữ liệu từ IoT + OpenAQ ===
    public async Task InsertAsync(AirQuality data, CancellationToken ct = default)
    {
        // Sinh ID NGSI-LD nếu thiếu
        data.Id ??= $"urn:ngsi-ld:AirQualityObserved:station-hn01:{DateTime.UtcNow:yyyy-MM-ddTHH:mm:ssZ}";

        // Thiết lập thuộc tính chuẩn NGSI-LD
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

        // --- Kết hợp dữ liệu OpenAQ ---
        var lon = data.Location.Value.Coordinates[0];
        var lat = data.Location.Value.Coordinates[1];
        var tuple = await _openAq.GetNearestAsync(lat, lon, ct);

        if (tuple is null)
        {
            _logger.LogWarning("⚠️ Không tìm thấy dữ liệu OpenAQ gần vị trí ({Lat},{Lon})", lat, lon);
        }
        else
        {
            var (pm25, pm10, o3, no2, so2, co) = tuple.Value;
            var obsAt = DateTime.UtcNow;

            if (pm25.HasValue)
                data.Pm25 = new NumericProperty { Value = pm25, UnitCode = "µg/m³", ObservedAt = obsAt };
            if (pm10.HasValue)
                data.Pm10 = new NumericProperty { Value = pm10, UnitCode = "µg/m³", ObservedAt = obsAt };
            if (o3.HasValue)
                data.O3 = new NumericProperty { Value = o3, UnitCode = "µg/m³", ObservedAt = obsAt };
            if (no2.HasValue)
                data.No2 = new NumericProperty { Value = no2, UnitCode = "µg/m³", ObservedAt = obsAt };
            if (so2.HasValue)
                data.So2 = new NumericProperty { Value = so2, UnitCode = "µg/m³", ObservedAt = obsAt };
            if (co.HasValue)
                data.Co = new NumericProperty { Value = co, UnitCode = "µg/m³", ObservedAt = obsAt };
        }

        await _db.AirQuality.InsertOneAsync(data, cancellationToken: ct);
    }

    // === Các hàm truy vấn ===
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
