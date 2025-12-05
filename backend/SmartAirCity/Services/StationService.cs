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
using SmartAirCity.Data;
using SmartAirCity.Models;
using MongoDB.Driver;

namespace SmartAirCity.Services;

/// <summary>
/// Service để lấy danh sách Station từ 3 nguồn:
/// 1. Official: StationMapping trong appsettings.json
/// 2. External HTTP: ExternalSources collection
/// 3. External MQTT: ExternalMqttSources collection
/// 
/// KHÔNG query từ AirQuality data → Nhanh, hiệu quả!
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
    /// Lấy tất cả stations từ 3 nguồn
    /// </summary>
    public async Task<List<StationInfo>> GetAllStationsAsync(CancellationToken ct = default)
    {
        var stations = new List<StationInfo>();

        // 1. Official stations từ appsettings.json
        var officialStations = GetOfficialStations();
        stations.AddRange(officialStations);

        // 2. External HTTP sources từ MongoDB
        var httpStations = await GetExternalHttpStationsAsync(ct);
        stations.AddRange(httpStations);

        // 3. External MQTT sources từ MongoDB
        var mqttStations = await GetExternalMqttStationsAsync(ct);
        stations.AddRange(mqttStations);

        _logger.LogInformation("Retrieved {Total} stations: {Official} official, {Http} external-http, {Mqtt} external-mqtt",
            stations.Count, officialStations.Count, httpStations.Count, mqttStations.Count);

        return stations;
    }

    /// <summary>
    /// Lấy stations theo type
    /// </summary>
    public async Task<List<StationInfo>> GetStationsByTypeAsync(string type, CancellationToken ct = default)
    {
        return type.ToLower() switch
        {
            "official" => GetOfficialStations(),
            "external-http" => await GetExternalHttpStationsAsync(ct),
            "external-mqtt" => await GetExternalMqttStationsAsync(ct),
            _ => await GetAllStationsAsync(ct)
        };
    }

    /// <summary>
    /// Lấy official stations từ StationMapping trong appsettings.json
    /// </summary>
    private List<StationInfo> GetOfficialStations()
    {
        var stations = new List<StationInfo>();

        try
        {
            var stationMapping = _config.GetSection("StationMapping");
            foreach (var station in stationMapping.GetChildren())
            {
                var stationKey = station.Key; // e.g., "hanoi-oceanpark"
                var name = station["Name"];
                var lat = station.GetValue<double>("Latitude");
                var lon = station.GetValue<double>("Longitude");
                var stationId = station["StationId"] ?? $"station-{stationKey}";
                var openAqLocationId = station.GetValue<int?>("OpenAQLocationId");

                if (!string.IsNullOrEmpty(name) && lat != 0 && lon != 0)
                {
                    stations.Add(new StationInfo
                    {
                        StationId = stationId,
                        Name = name,
                        Latitude = lat,
                        Longitude = lon,
                        Type = "official",
                        IsActive = true,
                        Metadata = new Dictionary<string, object?>
                        {
                            ["openAqLocationId"] = openAqLocationId,
                            ["configKey"] = stationKey
                        }
                    });
                }
            }

            _logger.LogDebug("Loaded {Count} official stations from config", stations.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading official stations from config");
        }

        return stations;
    }

    /// <summary>
    /// Lấy external HTTP stations từ ExternalSources collection
    /// </summary>
    private async Task<List<StationInfo>> GetExternalHttpStationsAsync(CancellationToken ct)
    {
        var stations = new List<StationInfo>();

        try
        {
            var sources = await _db.ExternalSources.Find(_ => true).ToListAsync(ct);

            foreach (var source in sources)
            {
                stations.Add(new StationInfo
                {
                    StationId = source.StationId,
                    Name = source.Name,
                    Latitude = source.Latitude ?? 0,
                    Longitude = source.Longitude ?? 0,
                    Type = "external-http",
                    IsActive = source.IsActive,
                    Metadata = new Dictionary<string, object?>
                    {
                        ["sourceId"] = source.Id,
                        ["url"] = source.Url,
                        ["intervalMinutes"] = source.IntervalMinutes,
                        ["lastFetchedAt"] = source.LastFetchedAt,
                        ["failureCount"] = source.FailureCount,
                        ["isNgsiLd"] = source.IsNGSILD
                    }
                });
            }

            _logger.LogDebug("Loaded {Count} external HTTP stations from DB", stations.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading external HTTP stations");
        }

        return stations;
    }

    /// <summary>
    /// Lấy external MQTT stations từ ExternalMqttSources collection
    /// </summary>
    private async Task<List<StationInfo>> GetExternalMqttStationsAsync(CancellationToken ct)
    {
        var stations = new List<StationInfo>();

        try
        {
            var sources = await _db.ExternalMqttSources.Find(_ => true).ToListAsync(ct);

            foreach (var source in sources)
            {
                stations.Add(new StationInfo
                {
                    StationId = source.StationId,
                    Name = source.Name,
                    Latitude = source.Latitude,
                    Longitude = source.Longitude,
                    Type = "external-mqtt",
                    IsActive = source.IsActive,
                    Metadata = new Dictionary<string, object?>
                    {
                        ["sourceId"] = source.Id,
                        ["brokerHost"] = source.BrokerHost,
                        ["brokerPort"] = source.BrokerPort,
                        ["topic"] = source.Topic,
                        ["lastConnectedAt"] = source.LastConnectedAt,
                        ["lastMessageAt"] = source.LastMessageAt,
                        ["messageCount"] = source.MessageCount
                    }
                });
            }

            _logger.LogDebug("Loaded {Count} external MQTT stations from DB", stations.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading external MQTT stations");
        }

        return stations;
    }
}

/// <summary>
/// DTO cho thông tin Station (dùng chung cho tất cả loại)
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
