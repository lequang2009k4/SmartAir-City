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
    private readonly AirQualityService _service;
    private readonly ILogger<StationController> _logger;

    public StationController(
        AirQualityService service,
        ILogger<StationController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/stations
    /// Lay thong tin chi tiet tat ca cac tram IoT (ten, vi tri, chi so do, so luong records)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetStations(CancellationToken ct)
    {
        try
        {
            var stationsInfo = await _service.GetStationsInfoAsync(ct);
            
            var response = new
            {
                totalStations = stationsInfo.Count,
                stations = stationsInfo
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving stations info");
            return StatusCode(500, new { message = "Loi server khi lay thong tin tram", error = ex.Message });
        }
    }
}

