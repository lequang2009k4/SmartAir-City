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
        // Doc cau hinh NGSI-LD tu appsettings
        var contextUrl = _config["NGSILD:ContextUrl"] ?? "https://smartdatamodels.org/context.jsonld";
        var sosaNamespace = _config["NGSILD:SosaNamespace"] ?? "http://www.w3.org/ns/sosa/";

        // Extract stationId tu data.Id (vd: urn:ngsi-ld:AirQualityObserved:station-oceanpark:20251208)
        string stationId = "station-unknown";
        if (!string.IsNullOrEmpty(data.Id))
        {
            stationId = ExtractStationIdFromEntityId(data.Id);
        }
        else
        {
            // Neu khong co Id, tao Id moi
            data.Id = $"urn:ngsi-ld:AirQualityObserved:{stationId}:{DateTime.UtcNow:yyyyMMddHHmmss}";
        }

        // SET STATIONID - Quan trong de query de dang!
        data.StationId = stationId;

        // Thiet lap thuoc tinh chuan NGSI-LD (chi set neu chua co)
        data.Type = "AirQualityObserved";
        data.Context ??= new object[]
        {
            contextUrl,
            new { sosa = sosaNamespace }
        };
        data.ObservedProperty ??= new Relationship { Object = "AirQuality" };
        data.DateObserved ??= new DateTimeProperty { Type = "Property", Value = DateTime.UtcNow };

        _logger.LogDebug("Inserting AirQuality data for station: {StationId}", stationId);
        await _db.AirQuality.InsertOneAsync(data, cancellationToken: ct);
        
        // Tu dong them station moi vao Stations collection neu chua co
        await EnsureStationExistsAsync(stationId, data, ct);
    }

    /// <summary>
    /// Extract stationId tu entity ID (vd: urn:ngsi-ld:AirQualityObserved:station-oceanpark:20251208...)
    /// </summary>
    private string ExtractStationIdFromEntityId(string entityId)
    {
        try
        {
            // Format: urn:ngsi-ld:AirQualityObserved:station-xxx:timestamp
            var parts = entityId.Split(':');
            if (parts.Length >= 4)
            {
                return parts[3]; // station-oceanpark, station-nguyenvancu, etc.
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to extract stationId from entityId: {EntityId}", entityId);
        }
        return "station-unknown";
    }

    /// <summary>
    /// Tu dong them station moi vao Stations collection neu chua co
    /// </summary>
    private async Task EnsureStationExistsAsync(string stationId, AirQuality sampleData, CancellationToken ct)
    {
        try
        {
            // Check xem station da ton tai chua
            var existingStation = await _db.Stations
                .Find(s => s.StationId == stationId)
                .FirstOrDefaultAsync(ct);

            if (existingStation != null)
            {
                return; // Da co, khong can them moi
            }

            // Tao station moi tu thong tin trong AirQuality data
            var newStation = new Station
            {
                StationId = stationId,
                Name = ExtractStationName(stationId),
                Latitude = sampleData.Location?.Value?.Coordinates?[1] ?? 0,
                Longitude = sampleData.Location?.Value?.Coordinates?[0] ?? 0,
                SensorUrn = sampleData.MadeBySensor?.Object,
                FeatureOfInterest = sampleData.HasFeatureOfInterest?.Object,
                Type = "mqtt",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _db.Stations.InsertOneAsync(newStation, cancellationToken: ct);
            _logger.LogInformation("Auto-created new station: {StationId} - {Name} at ({Lat}, {Lon})",
                stationId, newStation.Name, newStation.Latitude, newStation.Longitude);
        }
        catch (Exception ex)
        {
            // Khong throw exception de khong anh huong den viec luu AirQuality data
            _logger.LogWarning(ex, "Failed to auto-create station: {StationId}", stationId);
        }
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

    public async Task<List<AirQuality>> GetByTimeRangeAndStationAsync(DateTime from, DateTime to, string stationId, CancellationToken ct = default)
    {
        var filter = Builders<AirQuality>.Filter.And(
            Builders<AirQuality>.Filter.Eq(x => x.StationId, stationId),
            Builders<AirQuality>.Filter.Gte(x => x.DateObserved.Value, from),
            Builders<AirQuality>.Filter.Lte(x => x.DateObserved.Value, to)
        );

        return await _db.AirQuality
            .Find(filter)
            .Sort(Builders<AirQuality>.Sort.Ascending(x => x.DateObserved.Value).Ascending("_id"))
            .ToListAsync(ct);
    }

    /// <summary>
    /// Lay danh sach tat ca cac tram co du lieu (distinct stationId)
    /// </summary>
    public async Task<List<string>> GetDistinctStationsAsync(CancellationToken ct = default)
    {
        // Query distinct tren field StationId
        // Chi lay cac gia tri khong null va khong empty
        var filter = Builders<AirQuality>.Filter.Ne(x => x.StationId, null) & 
                     Builders<AirQuality>.Filter.Ne(x => x.StationId, "");
                     
        var stations = await _db.AirQuality
            .Distinct(x => x.StationId, filter)
            .ToListAsync(ct);
            
        return stations.OrderBy(s => s).ToList();
    }

    /// <summary>
    /// Lay du lieu theo station ID cu the
    /// </summary>
    public async Task<List<AirQuality>> GetByStationAsync(string stationId, int? limit = null, CancellationToken ct = default)
    {
        // Query truc tiep tren field StationId
        var query = _db.AirQuality
            .Find(x => x.StationId == stationId)
            .Sort(Builders<AirQuality>.Sort.Descending(x => x.DateObserved.Value).Descending("_id"));

        if (limit.HasValue && limit.Value > 0)
        {
            return await query.Limit(limit.Value).ToListAsync(ct);
        }

        return await query.ToListAsync(ct);
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

            // Xac dinh cac chi so do (parameters) ma tram nay co - DYNAMIC from Properties dictionary
            var parameters = new List<string>();
            if (latestRecord.Properties != null)
            {
                foreach (var prop in latestRecord.Properties)
                {
                    // Chi lay cac NumericProperty (skip metadata fields)
                    if (prop.Value is NumericProperty)
                    {
                        parameters.Add(prop.Key);
                    }
                }
            }
            
            // Sort parameters alphabetically
            parameters = parameters.OrderBy(p => p).ToList();

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
