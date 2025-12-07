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


using Microsoft.AspNetCore.Mvc;
using SmartAirCity.Services;
using SmartAirCity.Models;

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
    /// Retrieve all stations from MongoDB
    /// </summary>
    /// <remarks>
    /// Get a list of all monitoring stations in the system.
    /// Returns station metadata including location, name, and configuration.
    /// </remarks>
    /// <response code="200">Returns list of stations successfully</response>
    /// <response code="500">Server error</response>
    [HttpGet]
    public async Task<IActionResult> GetStations(CancellationToken ct = default)
    {
        try
        {
            var stations = await _stationService.GetAllStationsAsync(ct);
            
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
    /// Get specific station information
    /// </summary>
    /// <remarks>
    /// Retrieve detailed information for a specific monitoring station by its ID.
    /// Includes station metadata, location, type, and configuration.
    /// </remarks>
    /// <param name="stationId">Station identifier</param>
    /// <response code="200">Returns station details successfully</response>
    /// <response code="404">Station not found</response>
    [HttpGet("{stationId}")]
    public async Task<IActionResult> GetStation(string stationId, CancellationToken ct = default)
    {
        try
        {
            var station = await _stationService.GetStationByIdAsync(stationId, ct);
            
            if (station == null)
            {
                return NotFound(new { message = $"Station '{stationId}' not found" });
            }
            
            return Ok(station);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving station {StationId}", stationId);
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    /// <summary>
    /// Create new station
    /// </summary>
    /// <remarks>
    /// Register a new monitoring station in the system. 
    /// Provide station metadata including name, location (latitude/longitude), and type.
    /// </remarks>
    /// <response code="201">Station created successfully</response>
    /// <response code="400">Invalid station data</response>
    [HttpPost]
    public async Task<IActionResult> CreateStation([FromBody] Station station, CancellationToken ct = default)
    {
        try
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(station.StationId))
            {
                return BadRequest(new { message = "stationId is required" });
            }
            
            if (string.IsNullOrWhiteSpace(station.Name))
            {
                return BadRequest(new { message = "name is required" });
            }

            var created = await _stationService.CreateStationAsync(station, ct);
            
            return CreatedAtAction(
                nameof(GetStation), 
                new { stationId = created.StationId }, 
                created);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating station");
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    /// <summary>
    /// Update station
    /// </summary>
    /// <remarks>
    /// Update configuration and metadata for an existing monitoring station.
    /// Can modify station name, location, type, or other properties.
    /// </remarks>
    /// <param name="stationId">Station identifier</param>
    /// <response code="200">Station updated successfully</response>
    /// <response code="404">Station not found</response>
    [HttpPut("{stationId}")]
    public async Task<IActionResult> UpdateStation(string stationId, [FromBody] Station station, CancellationToken ct = default)
    {
        try
        {
            // Ensure stationId matches
            station.StationId = stationId;
            
            var updated = await _stationService.UpdateStationAsync(stationId, station, ct);
            
            if (!updated)
            {
                return NotFound(new { message = $"Station '{stationId}' not found" });
            }
            
            return Ok(new { message = "Station updated successfully", stationId = stationId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating station {StationId}", stationId);
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete station
    /// </summary>
    /// <remarks>
    /// Remove a monitoring station from the system. 
    /// Historical data from this station will be preserved.
    /// </remarks>
    /// <param name="stationId">Station identifier</param>
    /// <response code="200">Station deleted successfully</response>
    /// <response code="404">Station not found</response>
    [HttpDelete("{stationId}")]
    public async Task<IActionResult> DeleteStation(string stationId, CancellationToken ct = default)
    {
        try
        {
            var deleted = await _stationService.DeleteStationAsync(stationId, ct);
            
            if (!deleted)
            {
                return NotFound(new { message = $"Station '{stationId}' not found" });
            }
            
            return Ok(new { message = "Station deleted successfully", stationId = stationId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting station {StationId}", stationId);
            return StatusCode(500, new { message = "Lỗi server", error = ex.Message });
        }
    }

    /// <summary>
    /// Get minimal data for Map display (only id, name, lat, long, type)
    /// </summary>
    /// <remarks>
    /// Retrieve lightweight station data optimized for map visualization. 
    /// Returns only essential fields: station ID, name, coordinates, and type.
    /// Useful for rendering station markers on interactive maps.
    /// </remarks>
    /// <response code="200">Returns minimal station data for map display</response>
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
}
