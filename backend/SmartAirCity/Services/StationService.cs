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
using SmartAirCity.Data;
using SmartAirCity.Models;
using MongoDB.Driver;

namespace SmartAirCity.Services;

/// <summary>
/// Service để quản lý Stations từ MongoDB
/// </summary>
public class StationService
{
    private readonly IConfiguration _config;
    private readonly MongoDbContext _db;
    private readonly ILogger<StationService> _logger;

    public StationService(IConfiguration config, MongoDbContext db, ILogger<StationService> logger)
    {
        _config = config;
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Lấy tất cả stations từ database
    /// </summary>
    public async Task<List<Station>> GetAllStationsAsync(CancellationToken ct = default)
    {
        var stations = await _db.Stations.Find(_ => true).ToListAsync(ct);
        _logger.LogInformation("Retrieved {Count} stations from database", stations.Count);
        return stations;
    }

    /// <summary>
    /// Lấy stations theo type
    /// </summary>
    public async Task<List<Station>> GetStationsByTypeAsync(string type, CancellationToken ct = default)
    {
        var filter = Builders<Station>.Filter.Eq(s => s.Type, type.ToLower());
        var stations = await _db.Stations.Find(filter).ToListAsync(ct);
        return stations;
    }

    /// <summary>
    /// Lấy station theo StationId
    /// </summary>
    public async Task<Station?> GetStationByIdAsync(string stationId, CancellationToken ct = default)
    {
        var filter = Builders<Station>.Filter.Eq(s => s.StationId, stationId);
        return await _db.Stations.Find(filter).FirstOrDefaultAsync(ct);
    }

    /// <summary>
    /// Get station by mapping key (e.g., "hanoi-oceanpark"), or create if not exists
    /// Priority: 1. Database, 2. Config, 3. Auto-create
    /// </summary>
    public async Task<Station> GetOrCreateStationAsync(string mappingKey, CancellationToken ct = default)
    {
        // Extract parts from mapping key
        var parts = mappingKey.Split('-');
        var city = parts.Length > 0 ? parts[0] : "unknown";
        var location = parts.Length > 1 ? string.Join("-", parts.Skip(1)) : mappingKey;
        var stationId = $"station-{location}";
        
        // 1. Check database first
        var existing = await GetStationByIdAsync(stationId, ct);
        if (existing != null)
        {
            _logger.LogDebug("Found existing station in DB: {StationId}", stationId);
            return existing;
        }
        
        // 2. Check config (fallback)
        var configStation = TryGetStationFromConfig(mappingKey);
        if (configStation != null)
        {
            // Create from config and save to DB
            try
            {
                await CreateStationAsync(configStation, ct);
                _logger.LogInformation("Created station from config: {StationId} (mappingKey: {MappingKey})", 
                    stationId, mappingKey);
                return configStation;
            }
            catch (InvalidOperationException)
            {
                // Already exists (race condition), return existing
                return (await GetStationByIdAsync(stationId, ct))!;
            }
        }
        
        // 3. Auto-create with minimal info
        var autoStation = new Station
        {
            StationId = stationId,
            Name = $"{CapitalizeFirst(city)} - {CapitalizeFirst(location)}",
            Latitude = 0,  // Can be updated later via API
            Longitude = 0,
            Type = "iot",
            IsActive = true,
            Metadata = new Dictionary<string, object?>
            {
                ["autoCreated"] = true,
                ["mappingKey"] = mappingKey,
                ["createdFrom"] = "mqtt-topic"
            }
        };
        
        try
        {
            await CreateStationAsync(autoStation, ct);
            _logger.LogWarning("Auto-created station from MQTT topic: {StationId} (mappingKey: {MappingKey}). Please update coordinates via API!", 
                stationId, mappingKey);
        }
        catch (InvalidOperationException)
        {
            // Already exists (race condition), return existing
            return (await GetStationByIdAsync(stationId, ct))!;
        }
        
        return autoStation;
    }

    /// <summary>
    /// Try to get station configuration from appsettings.json
    /// </summary>
    private Station? TryGetStationFromConfig(string mappingKey)
    {
        try
        {
            var stationConfig = _config.GetSection($"StationMapping:{mappingKey}");
            if (!stationConfig.Exists()) return null;
            
            var name = stationConfig["Name"];
            if (string.IsNullOrEmpty(name)) return null;
            
            // Extract location from mappingKey (e.g., "hanoi-oceanpark" -> "oceanpark")
            var parts = mappingKey.Split('-');
            _logger.LogDebug("TryGetStationFromConfig: mappingKey={MappingKey}, parts={Parts}", 
                mappingKey, string.Join(", ", parts));
            
            var location = parts.Length > 1 ? string.Join("-", parts.Skip(1)) : mappingKey;
            var extractedStationId = $"station-{location}";
            
            _logger.LogDebug("TryGetStationFromConfig: extracted location={Location}, extractedStationId={ExtractedStationId}", 
                location, extractedStationId);
            
            // Use StationId from config if provided, otherwise use extracted
            var configStationId = stationConfig["StationId"];
            var stationId = configStationId ?? extractedStationId;
            
            _logger.LogInformation("TryGetStationFromConfig: mappingKey={MappingKey}, configStationId={ConfigStationId}, extractedStationId={ExtractedStationId}, FINAL stationId={StationId}", 
                mappingKey, configStationId ?? "NULL", extractedStationId, stationId);
            
            return new Station
            {
                StationId = stationId,
                Name = name,
                Latitude = stationConfig.GetValue<double>("Latitude"),
                Longitude = stationConfig.GetValue<double>("Longitude"),
                Type = "official",
                OpenAQLocationId = stationConfig.GetValue<int?>("OpenAQLocationId"),
                SensorUrn = stationConfig["SensorUrn"],
                FeatureOfInterest = stationConfig["FeatureOfInterest"],
                IsActive = true,
                Metadata = new Dictionary<string, object?>
                {
                    ["configKey"] = mappingKey,
                    ["createdFrom"] = "config"
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Error reading station config for: {MappingKey}", mappingKey);
            return null;
        }
    }

    /// <summary>
    /// Capitalize first letter of a string
    /// </summary>
    private string CapitalizeFirst(string text)
    {
        if (string.IsNullOrEmpty(text)) return text;
        return char.ToUpper(text[0]) + text.Substring(1);
    }

    /// <summary>
    /// Tạo station mới
    /// </summary>
    public async Task<Station> CreateStationAsync(Station station, CancellationToken ct = default)
    {
        // Check if stationId already exists
        var existing = await GetStationByIdAsync(station.StationId, ct);
        if (existing != null)
        {
            throw new InvalidOperationException($"Station with ID '{station.StationId}' already exists");
        }

        station.CreatedAt = DateTime.UtcNow;
        await _db.Stations.InsertOneAsync(station, cancellationToken: ct);
        _logger.LogInformation("Created new station: {StationId}", station.StationId);
        return station;
    }

    /// <summary>
    /// Cập nhật station
    /// </summary>
    public async Task<bool> UpdateStationAsync(string stationId, Station station, CancellationToken ct = default)
    {
        var filter = Builders<Station>.Filter.Eq(s => s.StationId, stationId);
        station.UpdatedAt = DateTime.UtcNow;
        
        var result = await _db.Stations.ReplaceOneAsync(filter, station, cancellationToken: ct);
        
        if (result.ModifiedCount > 0)
        {
            _logger.LogInformation("Updated station: {StationId}", stationId);
            return true;
        }
        
        return false;
    }

    /// <summary>
    /// Xóa station
    /// </summary>
    public async Task<bool> DeleteStationAsync(string stationId, CancellationToken ct = default)
    {
        var filter = Builders<Station>.Filter.Eq(s => s.StationId, stationId);
        var result = await _db.Stations.DeleteOneAsync(filter, ct);
        
        if (result.DeletedCount > 0)
        {
            _logger.LogInformation("Deleted station: {StationId}", stationId);
            return true;
        }
        
        return false;
    }

    /// <summary>
    /// Migrate stations từ appsettings.json sang MongoDB
    /// Chỉ chạy 1 lần khi database rỗng
    /// </summary>
    public async Task MigrateStationsFromConfigAsync(CancellationToken ct = default)
    {
        try
        {
            // Check if Stations collection is empty
            var count = await _db.Stations.CountDocumentsAsync(FilterDefinition<Station>.Empty, cancellationToken: ct);
            if (count > 0)
            {
                _logger.LogInformation("Stations collection already has {Count} records, skipping migration", count);
                return;
            }

            _logger.LogInformation("Starting migration of stations from config to database...");

            var stationMapping = _config.GetSection("StationMapping");
            var migratedCount = 0;

            foreach (var stationConfig in stationMapping.GetChildren())
            {
                var stationKey = stationConfig.Key; // e.g., "hanoi-oceanpark"
                var name = stationConfig["Name"];
                var lat = stationConfig.GetValue<double>("Latitude");
                var lon = stationConfig.GetValue<double>("Longitude");
                var stationId = stationConfig["StationId"] ?? $"station-{stationKey}";

                if (string.IsNullOrEmpty(name) || lat == 0 || lon == 0)
                {
                    _logger.LogWarning("Skipping invalid station config: {Key}", stationKey);
                    continue;
                }

                var station = new Station
                {
                    StationId = stationId,
                    Name = name,
                    Latitude = lat,
                    Longitude = lon,
                    Type = "official",
                    IsActive = true,
                    OpenAQLocationId = stationConfig.GetValue<int?>("OpenAQLocationId"),
                    SensorUrn = stationConfig["SensorUrn"],
                    FeatureOfInterest = stationConfig["FeatureOfInterest"],
                    Metadata = new Dictionary<string, object?>
                    {
                        ["configKey"] = stationKey,
                        ["migratedFrom"] = "appsettings.json"
                    },
                    CreatedAt = DateTime.UtcNow
                };

                await _db.Stations.InsertOneAsync(station, cancellationToken: ct);
                migratedCount++;
                _logger.LogDebug("Migrated station: {StationId} from config key: {ConfigKey}", stationId, stationKey);
            }

            _logger.LogInformation("Migration completed! Migrated {Count} stations from config to database", migratedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during station migration from config");
            throw;
        }
    }
}

/// <summary>
/// DTO cho thông tin Station (dùng chung cho tất cả loại)
/// Giữ lại để backward compatibility với code cũ
/// </summary>
public class StationInfo
{
    public string StationId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    
    /// <summary>
    /// Loại station: "official", "external-http", "external-mqtt"
    /// </summary>
    public string Type { get; set; } = string.Empty;
    
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// Metadata bổ sung tùy theo loại station
    /// </summary>
    public Dictionary<string, object?>? Metadata { get; set; }
}
