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

public class ContributedDataService
{
    private readonly MongoDbContext _db;
    private readonly ILogger<ContributedDataService> _logger;

    public ContributedDataService(MongoDbContext db, ILogger<ContributedDataService> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Luu du lieu dong gop vao collection ContributedData
    /// </summary>
    public async Task<string> InsertAsync(ContributedAirQuality data, CancellationToken ct = default)
    {
        // Dam bao co ID - su dung Guid de tranh trung lap
        if (string.IsNullOrEmpty(data.Id))
        {
            var uniqueId = Guid.NewGuid().ToString("N")[..8]; // Lay 8 ky tu dau
            data.Id = $"urn:ngsi-ld:AirQualityObserved:contributed:{DateTime.UtcNow:yyyy-MM-ddTHH-mm-ss}-{uniqueId}";
        }

        await _db.ContributedData.InsertOneAsync(data, cancellationToken: ct);
        _logger.LogInformation("Da luu du lieu dong gop voi ID: {Id}", data.Id);
        
        return data.Id;
    }

    /// <summary>
    /// Lay tat ca du lieu dong gop
    /// </summary>
    public async Task<List<ContributedAirQuality>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.ContributedData
            .Find(FilterDefinition<ContributedAirQuality>.Empty)
            .Sort(Builders<ContributedAirQuality>.Sort.Descending(x => x.DateObserved.Value))
            .ToListAsync(ct);
    }

    /// <summary>
    /// Lay N ban ghi moi nhat cua contributed data
    /// </summary>
    public async Task<List<ContributedAirQuality>> GetLatestNAsync(int limit = 50, CancellationToken ct = default)
    {
        return await _db.ContributedData
            .Find(FilterDefinition<ContributedAirQuality>.Empty)
            .Sort(Builders<ContributedAirQuality>.Sort.Descending(x => x.DateObserved.Value))
            .Limit(limit)
            .ToListAsync(ct);
    }

    /// <summary>
    /// Luu nhieu du lieu dong gop vao collection ContributedData
    /// </summary>
    public async Task<List<string>> InsertManyAsync(List<ContributedAirQuality> dataList, CancellationToken ct = default)
    {
        // Dam bao moi item co ID - su dung Guid de tranh trung lap
        var ids = new List<string>();
        var baseTime = DateTime.UtcNow;
        var counter = 0;
        
        foreach (var data in dataList)
        {
            if (string.IsNullOrEmpty(data.Id))
            {
                // Su dung Guid de dam bao unique, tranh race condition
                var uniqueId = Guid.NewGuid().ToString("N")[..8]; // Lay 8 ky tu dau
                data.Id = $"urn:ngsi-ld:AirQualityObserved:contributed:{baseTime:yyyy-MM-ddTHH-mm-ss}-{uniqueId}-{counter}";
                counter++;
            }
            ids.Add(data.Id);
        }

        await _db.ContributedData.InsertManyAsync(dataList, cancellationToken: ct);
        _logger.LogInformation("Da luu {Count} ban ghi du lieu dong gop", dataList.Count);
        
        return ids;
    }

    /// <summary>
    /// Extract station identifier tu ID (chi lay tram, khong lay thiet bi)
    /// Format: urn:ngsi-ld:AirQualityObserved:station-hn01:...
    /// </summary>
    private string? ExtractStationIdentifier(AirQuality item)
    {
        // chi lay tu ID: urn:ngsi-ld:AirQualityObserved:station-hn01:...
        if (!string.IsNullOrEmpty(item.Id))
        {
            var parts = item.Id.Split(':');
            if (parts.Length >= 4)
            {
                var stationId = parts[3]; // station-hn01
                // Bo qua "contributed" hoac "contribution" (khong phai ten tram)
                if (stationId != "contributed" && stationId != "contribution")
                {
                    return stationId;
                }
            }
        }

        return null;
    }

    /// <summary>
    /// Lay danh sach cac tram unique tu du lieu dong gop
    /// </summary>
    public async Task<List<string>> GetDistinctStationsAsync(CancellationToken ct = default)
    {
        // Lay tat ca documents
        var allData = await _db.ContributedData
            .Find(FilterDefinition<ContributedAirQuality>.Empty)
            .ToListAsync(ct);

        var stations = new HashSet<string>();

        foreach (var item in allData)
        {
            var stationId = ExtractStationIdentifier(item);
            if (!string.IsNullOrEmpty(stationId))
            {
                stations.Add(stationId);
            }
        }

        var sortedStations = stations.OrderBy(s => s).ToList();
        _logger.LogInformation("Tim thay {Count} tram khac nhau", sortedStations.Count);
        
        return sortedStations;
    }

    /// <summary>
    /// Lay du lieu dong gop theo station
    /// </summary>
    public async Task<List<ContributedAirQuality>> GetByStationAsync(string stationId, CancellationToken ct = default)
    {
        // Lay tat ca documents va filter theo station
        var allData = await _db.ContributedData
            .Find(FilterDefinition<ContributedAirQuality>.Empty)
            .ToListAsync(ct);

        var filteredData = allData
            .Where(item => 
            {
                var extractedStation = ExtractStationIdentifier(item);
                return extractedStation != null && extractedStation.Equals(stationId, StringComparison.OrdinalIgnoreCase);
            })
            .OrderByDescending(x => x.DateObserved?.Value ?? DateTime.MinValue)
            .ToList();

        _logger.LogInformation("Tim thay {Count} ban ghi cho tram: {StationId}", filteredData.Count, stationId);
        
        return filteredData;
    }

    /// <summary>
    /// Lay du lieu dong gop theo userId (cho API #1: My Contributions)
    /// </summary>
    public async Task<List<ContributedAirQuality>> GetByUserIdAsync(string userId, CancellationToken ct = default)
    {
        var filter = Builders<ContributedAirQuality>.Filter.Eq(x => x.UserId, userId);
        
        var data = await _db.ContributedData
            .Find(filter)
            .Sort(Builders<ContributedAirQuality>.Sort.Descending(x => x.DateObserved.Value))
            .ToListAsync(ct);

        _logger.LogInformation("Tim thay {Count} ban ghi cho userId: {UserId}", data.Count, userId);
        
        return data;
    }

    /// <summary>
    /// Lay tat ca du lieu dong gop trong 7 ngay gan nhat (cho API #2: Public Contributions)
    /// </summary>
    public async Task<List<ContributedAirQuality>> GetLast7DaysAsync(CancellationToken ct = default)
    {
        var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
        
        var filter = Builders<ContributedAirQuality>.Filter.Gte(
            x => x.DateObserved.Value, 
            sevenDaysAgo
        );

        var data = await _db.ContributedData
            .Find(filter)
            .Sort(Builders<ContributedAirQuality>.Sort.Descending(x => x.DateObserved.Value))
            .ToListAsync(ct);

        _logger.LogInformation("Tim thay {Count} ban ghi trong 7 ngay gan nhat", data.Count);
        
        return data;
    }

    /// <summary>
    /// Lay thong tin chi tiet cua tat ca cac tram (ten, vi tri, cac chi so do, so luong contributions)
    /// </summary>
    public async Task<List<object>> GetStationsInfoAsync(CancellationToken ct = default)
    {
        // Lay tat ca du lieu
        var allData = await _db.ContributedData
            .Find(FilterDefinition<ContributedAirQuality>.Empty)
            .ToListAsync(ct);

        // Nhom theo station
        var stationGroups = allData
            .Where(item => !string.IsNullOrEmpty(ExtractStationIdentifier(item)))
            .GroupBy(item => ExtractStationIdentifier(item))
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
                totalContributions = stationData.Count,
                latestContribution = latestRecord.DateObserved?.Value,
                featureOfInterest = latestRecord.HasFeatureOfInterest
            };

            stationsInfo.Add(stationInfo);
        }

        // Sap xep theo so luong contributions giam dan
        stationsInfo = stationsInfo
            .OrderByDescending(s => ((dynamic)s).totalContributions)
            .ToList();

        _logger.LogInformation("Da lay thong tin cho {Count} tram", stationsInfo.Count);
        
        return stationsInfo;
    }

    /// <summary>
    /// Extract ten tram tu stationId
    /// Vd: "station-hn01" -> "HN01", "station-hanoi-oceanpark" -> "Hanoi Ocean Park"
    /// </summary>
    private string ExtractStationName(string stationId)
    {
        if (string.IsNullOrEmpty(stationId)) return "Unknown";
        
        // Bo prefix "station-"
        var name = stationId.StartsWith("station-") 
            ? stationId.Substring(8) 
            : stationId;
        
        // Convert kebab-case to Title Case - kiem tra null/empty de tranh exception
        var words = name.Split('-', StringSplitOptions.RemoveEmptyEntries);
        if (words.Length == 0) return "Unknown";
        
        name = string.Join(" ", words
            .Where(word => !string.IsNullOrEmpty(word))
            .Select(word => 
            {
                if (word.Length == 0) return word;
                return char.ToUpper(word[0]) + (word.Length > 1 ? word.Substring(1) : "");
            }));
        
        return string.IsNullOrEmpty(name) ? "Unknown" : name;
    }

    /// <summary>
    /// Lay du lieu dong gop theo contributionId
    /// </summary>
    public async Task<List<ContributedAirQuality>> GetByContributionIdAsync(string contributionId, CancellationToken ct = default)
    {
        var filter = Builders<ContributedAirQuality>.Filter.Eq(x => x.ContributionId, contributionId);
        
        var data = await _db.ContributedData
            .Find(filter)
            .Sort(Builders<ContributedAirQuality>.Sort.Descending(x => x.DateObserved.Value))
            .ToListAsync(ct);

        _logger.LogInformation("Tim thay {Count} ban ghi cho contributionId: {ContributionId}", data.Count, contributionId);
        
        return data;
    }

    /// <summary>
    /// Lay N ban ghi moi nhat theo contributionId
    /// </summary>
    public async Task<List<ContributedAirQuality>> GetLatestNByContributionIdAsync(string contributionId, int limit = 5, CancellationToken ct = default)
    {
        var filter = Builders<ContributedAirQuality>.Filter.Eq(x => x.ContributionId, contributionId);
        
        var data = await _db.ContributedData
            .Find(filter)
            .Sort(Builders<ContributedAirQuality>.Sort.Descending(x => x.DateObserved.Value))
            .Limit(limit)
            .ToListAsync(ct);

        _logger.LogInformation("Tim thay {Count} ban ghi moi nhat cho contributionId: {ContributionId}", data.Count, contributionId);
        
        return data;
    }

    /// <summary>
    /// Lay danh sach tat ca contributionId voi metadata (so luong ban ghi, ngay upload)
    /// Note: userId chi dung de filter noi bo, khong tra ve trong response
    /// </summary>
    public async Task<List<object>> GetAllContributionIdsAsync(string? userId = null, CancellationToken ct = default)
    {
        // Lay tat ca documents
        var filter = userId != null 
            ? Builders<ContributedAirQuality>.Filter.Eq(x => x.UserId, userId)
            : FilterDefinition<ContributedAirQuality>.Empty;

        var allData = await _db.ContributedData
            .Find(filter)
            .ToListAsync(ct);

        // Nhom theo contributionId
        var contributionGroups = allData
            .Where(item => !string.IsNullOrEmpty(item.ContributionId))
            .GroupBy(item => item.ContributionId)
            .ToList();

        var contributions = new List<object>();

        foreach (var group in contributionGroups)
        {
            var contributionId = group.Key;
            var records = group.ToList();
            
            // Tinh toan metadata
            var firstRecord = records.OrderBy(x => x.DateObserved?.Value ?? DateTime.MinValue).FirstOrDefault();
            var lastRecord = records.OrderByDescending(x => x.DateObserved?.Value ?? DateTime.MinValue).FirstOrDefault();

            var contributionInfo = new
            {
                contributionId = contributionId,
                // KHONG TRA VE userId DE BAO MAT
                recordCount = records.Count,
                firstUploadDate = firstRecord?.DateObserved?.Value,
                lastUploadDate = lastRecord?.DateObserved?.Value,
                createdAt = firstRecord?.DateObserved?.Value ?? DateTime.UtcNow // Approximate upload time
            };

            contributions.Add(contributionInfo);
        }

        // Sap xep theo createdAt giam dan (moi nhat truoc)
        contributions = contributions
            .OrderByDescending(c => ((dynamic)c).createdAt)
            .ToList();

        _logger.LogInformation("Tim thay {Count} contributionId duy nhat", contributions.Count);
        
        return contributions;
    }
}