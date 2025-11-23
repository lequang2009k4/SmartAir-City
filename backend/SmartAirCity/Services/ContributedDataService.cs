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
    /// Lưu dữ liệu đóng góp vào collection ContributedData
    /// </summary>
    public async Task<string> InsertAsync(AirQuality data, CancellationToken ct = default)
    {
        // Đảm bảo có ID
        if (string.IsNullOrEmpty(data.Id))
        {
            data.Id = $"urn:ngsi-ld:AirQualityObserved:contributed:{DateTime.UtcNow:yyyy-MM-ddTHH-mm-ss-fff}";
        }

        await _db.ContributedData.InsertOneAsync(data, cancellationToken: ct);
        _logger.LogInformation("Contributed data inserted with ID: {Id}", data.Id);
        
        return data.Id;
    }

    /// <summary>
    /// Lấy tất cả dữ liệu đóng góp
    /// </summary>
    public async Task<List<AirQuality>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.ContributedData
            .Find(FilterDefinition<AirQuality>.Empty)
            .Sort(Builders<AirQuality>.Sort.Descending(x => x.DateObserved.Value))
            .ToListAsync(ct);
    }

    /// <summary>
    /// Lấy N bản ghi mới nhất
    /// </summary>
    public async Task<List<AirQuality>> GetLatestNAsync(int limit = 50, CancellationToken ct = default)
    {
        return await _db.ContributedData
            .Find(FilterDefinition<AirQuality>.Empty)
            .Sort(Builders<AirQuality>.Sort.Descending(x => x.DateObserved.Value))
            .Limit(limit)
            .ToListAsync(ct);
    }

    /// <summary>
    /// Lưu nhiều dữ liệu đóng góp vào collection ContributedData
    /// </summary>
    public async Task<List<string>> InsertManyAsync(List<AirQuality> dataList, CancellationToken ct = default)
    {
        // Đảm bảo mỗi item có ID
        var ids = new List<string>();
        foreach (var data in dataList)
        {
            if (string.IsNullOrEmpty(data.Id))
            {
                data.Id = $"urn:ngsi-ld:AirQualityObserved:contributed:{DateTime.UtcNow:yyyy-MM-ddTHH-mm-ss-fff}";
            }
            ids.Add(data.Id);
        }

        await _db.ContributedData.InsertManyAsync(dataList, cancellationToken: ct);
        _logger.LogInformation("Inserted {Count} contributed data records", dataList.Count);
        
        return ids;
    }

    /// <summary>
    /// Extract station identifier từ ID (chỉ lấy trạm, không lấy thiết bị)
    /// Format: urn:ngsi-ld:AirQualityObserved:station-hn01:...
    /// </summary>
    private string? ExtractStationIdentifier(AirQuality item)
    {
        // Chỉ lấy từ ID: urn:ngsi-ld:AirQualityObserved:station-hn01:...
        if (!string.IsNullOrEmpty(item.Id))
        {
            var parts = item.Id.Split(':');
            if (parts.Length >= 4)
            {
                var stationId = parts[3]; // station-hn01
                // Bỏ qua "contributed" hoặc "contribution" (không phải tên trạm)
                if (stationId != "contributed" && stationId != "contribution")
                {
                    return stationId;
                }
            }
        }

        return null;
    }

    /// <summary>
    /// Lấy danh sách các trạm unique từ dữ liệu đóng góp
    /// </summary>
    public async Task<List<string>> GetDistinctStationsAsync(CancellationToken ct = default)
    {
        // Lấy tất cả documents
        var allData = await _db.ContributedData
            .Find(FilterDefinition<AirQuality>.Empty)
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
        _logger.LogInformation("Found {Count} distinct stations", sortedStations.Count);
        
        return sortedStations;
    }

    /// <summary>
    /// Lấy dữ liệu đóng góp theo trạm
    /// </summary>
    public async Task<List<AirQuality>> GetByStationAsync(string stationId, CancellationToken ct = default)
    {
        // Lấy tất cả documents và filter theo station
        var allData = await _db.ContributedData
            .Find(FilterDefinition<AirQuality>.Empty)
            .ToListAsync(ct);

        var filteredData = allData
            .Where(item => 
            {
                var extractedStation = ExtractStationIdentifier(item);
                return extractedStation != null && extractedStation.Equals(stationId, StringComparison.OrdinalIgnoreCase);
            })
            .OrderByDescending(x => x.DateObserved?.Value ?? DateTime.MinValue)
            .ToList();

        _logger.LogInformation("Found {Count} records for station: {StationId}", filteredData.Count, stationId);
        
        return filteredData;
    }
}