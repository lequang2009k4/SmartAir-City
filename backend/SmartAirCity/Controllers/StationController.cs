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


using Microsoft.AspNetCore.Mvc;
using SmartAirCity.Services;

namespace SmartAirCity.Controllers;

[ApiController]
[Route("api/stations")]
public class StationController : ControllerBase
{
    private readonly StationService _stationService;
    private readonly AirQualityService _airQualityService;
    private readonly ILogger<StationController> _logger;

    public StationController(
        StationService stationService,
        AirQualityService airQualityService,
        ILogger<StationController> logger)
    {
        _stationService = stationService;
        _airQualityService = airQualityService;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/stations
    /// Lấy danh sách tất cả stations từ 3 nguồn:
    /// - Official (appsettings.json)
    /// - External HTTP (ExternalSources)
    /// - External MQTT (ExternalMqttSources)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetStations([FromQuery] string? type = null, CancellationToken ct = default)
    {
        try
        {
            List<StationInfo> stations;
            
            if (!string.IsNullOrEmpty(type))
            {
                stations = await _stationService.GetStationsByTypeAsync(type, ct);
            }
            else
            {
                stations = await _stationService.GetAllStationsAsync(ct);
            }
            
            // Group by type for summary
            var summary = stations.GroupBy(s => s.Type)
                .ToDictionary(g => g.Key, g => g.Count());
            
            var response = new
            {
                totalStations = stations.Count,
                summary = summary,
                stations = stations
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving stations");
            return StatusCode(500, new { message = "Lỗi server khi lấy danh sách stations", error = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/stations/map
    /// Lấy dữ liệu tối giản cho hiển thị Map (chỉ id, name, lat, long, type)
    /// </summary>
    [HttpGet("map")]
    public async Task<IActionResult> GetStationsForMap(CancellationToken ct)
    {
        try
        {
            var stations = await _stationService.GetAllStationsAsync(ct);
            
            var mapData = stations
                .Where(s => s.Latitude != 0 && s.Longitude != 0) // Chỉ lấy có tọa độ
                .Select(s => new
                {
                    stationId = s.StationId,
                    name = s.Name,
                    latitude = s.Latitude,
                    longitude = s.Longitude,
                    type = s.Type,
                    isActive = s.IsActive
                })
                .ToList();
            
            return Ok(mapData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving stations for map");
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/stations/{stationId}/data
    /// Lấy dữ liệu AirQuality của một station cụ thể
    /// (Giữ lại chức năng query data theo station)
    /// </summary>
    [HttpGet("{stationId}/data")]
    public async Task<IActionResult> GetStationData(string stationId, [FromQuery] int limit = 50, CancellationToken ct = default)
    {
        try
        {
            var data = await _airQualityService.GetByStationAsync(stationId, limit, ct);
            
            return Ok(new
            {
                stationId = stationId,
                totalRecords = data.Count,
                data = data
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving data for station {StationId}", stationId);
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }
}

