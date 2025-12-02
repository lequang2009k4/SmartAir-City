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

using MongoDB.Driver;
using SmartAirCity.Data;
using SmartAirCity.Models;

namespace SmartAirCity.Services;

public class AirQualityService
{
    private readonly MongoDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<AirQualityService> _logger;

    public AirQualityService(MongoDbContext db, IConfiguration config, ILogger<AirQualityService> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    // Insert du lieu tu IoT + OpenAQ API
    public async Task InsertAsync(AirQuality data, CancellationToken ct = default)
    {
        // Doc cau hinh station tu appsettings
        var stationId = _config["DefaultStation:StationId"] ?? "station-hn01";
        var sensorUrn = _config["DefaultStation:SensorUrn"] ?? "urn:ngsi-ld:Device:mq135-hn01";
        var featureOfInterest = _config["DefaultStation:FeatureOfInterest"] ?? "urn:ngsi-ld:Air:urban-hanoi";
        var observedProperty = _config["DefaultStation:ObservedProperty"] ?? "AirQuality";

        // Doc cau hinh NGSI-LD tu appsettings
        var contextUrl = _config["NGSILD:ContextUrl"] ?? "https://smartdatamodels.org/context.jsonld";
        var sosaNamespace = _config["NGSILD:SosaNamespace"] ?? "http://www.w3.org/ns/sosa/";

        // Sinh ID NGSI-LD neu chua co
        data.Id ??= $"urn:ngsi-ld:AirQualityObserved:{stationId}:{DateTime.UtcNow:yyyy-MM-ddTHH:mm:ssZ}";

        // Thiet lap thuoc tinh chuan NGSI-LD
        data.Type = "AirQualityObserved";
        data.Context = new object[]
        {
            contextUrl,
            new { sosa = sosaNamespace }
        };
        data.ObservedProperty ??= new Relationship { Object = observedProperty };
        data.MadeBySensor ??= new Relationship { Object = sensorUrn };
        data.HasFeatureOfInterest ??= new Relationship { Object = featureOfInterest };
        data.DateObserved = new DateTimeProperty { Type = "Property", Value = DateTime.UtcNow };

        _logger.LogDebug("Inserting AirQuality data for station: {StationId}", stationId);
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

    /// <summary>
    /// Lay danh sach tat ca cac tram co du lieu (distinct stationId tu field Id hoac MadeBySensor)
    /// </summary>
    public async Task<List<string>> GetDistinctStationsAsync(CancellationToken ct = default)
    {
        // Lay tat ca du lieu va extract station ID tu cac field khac nhau
        var allData = await _db.AirQuality
            .Find(FilterDefinition<AirQuality>.Empty)
            .ToListAsync(ct);

        var stations = allData
            .Select(x => ExtractStationId(x))
            .Where(s => !string.IsNullOrEmpty(s))
            .Distinct()
            .OrderBy(s => s)
            .ToList();

        return stations!;
    }

    /// <summary>
    /// Lay du lieu theo station ID cu the
    /// </summary>
    public async Task<List<AirQuality>> GetByStationAsync(string stationId, int? limit = null, CancellationToken ct = default)
    {
        // Lay tat ca du lieu va filter theo stationId
        var allData = await _db.AirQuality
            .Find(FilterDefinition<AirQuality>.Empty)
            .Sort(Builders<AirQuality>.Sort.Descending(x => x.DateObserved.Value).Descending("_id"))
            .ToListAsync(ct);

        var filteredData = allData
            .Where(x => ExtractStationId(x)?.Equals(stationId, StringComparison.OrdinalIgnoreCase) == true)
            .ToList();

        if (limit.HasValue && limit.Value > 0)
        {
            filteredData = filteredData.Take(limit.Value).ToList();
        }

        return filteredData;
    }

    /// <summary>
    /// Extract station ID tu cac field khac nhau (Id, MadeBySensor, hoac location)
    /// </summary>
    private string? ExtractStationId(AirQuality data)
    {
        // thu extract tu Id (vd: urn:ngsi-ld:AirQualityObserved:station-hanoi-oceanpark:2025-11-28...)
        if (!string.IsNullOrEmpty(data.Id))
        {
            var parts = data.Id.Split(':');
            if (parts.Length >= 4)
            {
                // Lay phan station ID (phan thu 3, index 3)
                return parts[3];
            }
        }

        // thu extract tu MadeBySensor (vd: urn:ngsi-ld:Device:mq135-hanoi-oceanpark)
        if (data.MadeBySensor != null && !string.IsNullOrEmpty(data.MadeBySensor.Object))
        {
            var parts = data.MadeBySensor.Object.Split(':');
            if (parts.Length >= 3)
            {
                // Convert tu sensor name sang station name
                var sensorName = parts[^1]; // lay phan cuoi cung
                if (sensorName.StartsWith("mq135-"))
                {
                    return "station-" + sensorName.Substring(6); // "mq135-hanoi-oceanpark" -> "station-hanoi-oceanpark"
                }
                return sensorName;
            }
        }

        // Fallback: dung default
        return "station-unknown";
    }

    /// <summary>
    /// Lay thong tin chi tiet cua tat ca cac tram IoT (ten, vi tri, cac chi so do, so luong records)
    /// </summary>
    public async Task<List<object>> GetStationsInfoAsync(CancellationToken ct = default)
    {
        // Lay tat ca du lieu
        var allData = await _db.AirQuality
            .Find(FilterDefinition<AirQuality>.Empty)
            .ToListAsync(ct);

        // Nhom theo station
        var stationGroups = allData
            .Where(item => !string.IsNullOrEmpty(ExtractStationId(item)))
            .GroupBy(item => ExtractStationId(item))
            .ToList();

        var stationsInfo = new List<object>();

        foreach (var group in stationGroups)
        {
            var stationId = group.Key;
            var stationData = group.ToList();
            
            // Lay ban ghi moi nhat lam mau de extract thong tin tram
            var latestRecord = stationData
                .OrderByDescending(x => x.DateObserved?.Value ?? DateTime.MinValue)
                .FirstOrDefault();

            if (latestRecord == null) continue;

            // Xac dinh cac chi so do (parameters) ma tram nay co
            var parameters = new List<string>();
            if (latestRecord.Pm25 != null) parameters.Add("PM2.5");
            if (latestRecord.Pm10 != null) parameters.Add("PM10");
            if (latestRecord.O3 != null) parameters.Add("O3");
            if (latestRecord.No2 != null) parameters.Add("NO2");
            if (latestRecord.So2 != null) parameters.Add("SO2");
            if (latestRecord.Co != null) parameters.Add("CO");
            if (latestRecord.AirQualityIndex != null) parameters.Add("AQI");

            // Tao object thong tin tram
            var stationInfo = new
            {
                stationId = stationId,
                stationName = ExtractStationName(stationId ?? ""),
                sensor = latestRecord.MadeBySensor,
                location = new
                {
                    type = latestRecord.Location?.Type,
                    coordinates = latestRecord.Location?.Value?.Coordinates
                },
                measuredParameters = parameters,
                totalRecords = stationData.Count,
                latestRecord = latestRecord.DateObserved?.Value,
                featureOfInterest = latestRecord.HasFeatureOfInterest
            };

            stationsInfo.Add(stationInfo);
        }

        // Sap xep theo so luong records giam dan
        stationsInfo = stationsInfo
            .OrderByDescending(s => ((dynamic)s).totalRecords)
            .ToList();

        _logger.LogInformation("Retrieved info for {Count} IoT stations", stationsInfo.Count);
        
        return stationsInfo;
    }

    /// <summary>
    /// Extract ten tram tu stationId
    /// Vd: "station-hn01" -> "HN01", "station-hanoi-oceanpark" -> "Hanoi Oceanpark"
    /// </summary>
    private string ExtractStationName(string stationId)
    {
        if (string.IsNullOrEmpty(stationId)) return "Unknown";
        
        // Bo prefix "station-"
        var name = stationId.StartsWith("station-") 
            ? stationId.Substring(8) 
            : stationId;
        
        // Convert kebab-case to Title Case (vd: "hanoi-oceanpark" -> "Hanoi Oceanpark")
        name = string.Join(" ", name.Split('-')
            .Select(word => char.ToUpper(word[0]) + word.Substring(1)));
        
        return name;
    }
}
