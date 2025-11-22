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
 *
 *  This software is an open-source component of the SmartAir City initiative.
 *  It provides real-time environmental monitoring, NGSI-LD–compliant data
 *  models, MQTT-based data ingestion, and FiWARE Smart Data Models for
 *  open-data services and smart-city applications.
 */


using Microsoft.AspNetCore.Mvc;
using SmartAirCity.Models;
using SmartAirCity.Services;

namespace SmartAirCity.Controllers;

[ApiController]
[Route("api")]
public class AirQualityController : ControllerBase
{
    private readonly AirQualityService _service;
    private readonly ILogger<AirQualityController> _logger;

    public AirQualityController(
        AirQualityService service,
        ILogger<AirQualityController> logger)
    {
        _service = service;
        _logger = logger;
    }


    // GET /api/airquality 
    [HttpGet("airquality")]
    public async Task<IActionResult> GetAll([FromQuery] int? limit, CancellationToken ct)
    {
        if (limit.HasValue)
        {
            var data = await _service.GetLatestNAsync(limit.Value, ct);
            return Ok(data);
        }

        var all = await _service.GetAllAsync(ct);
        return Ok(all);
    }

    // GET /api/airquality/latest 
    [HttpGet("airquality/latest")]
    public async Task<IActionResult> GetLatest(CancellationToken ct)
    {
        var data = await _service.GetLatestAsync(ct);
        if (data == null)
            return NotFound(new { message = "Khong co du lieu" });
        return Ok(data);
    }

    // GET /api/airquality/history?from=...&to=... 
  [HttpGet("airquality/history")]
    public async Task<IActionResult> GetHistory([FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct)
    {
        // neu chi nhap ngay, tu dong set dau và cuoi ngay
        if (from.TimeOfDay == TimeSpan.Zero)
            from = from.Date; // 00:00:00

        if (to.TimeOfDay == TimeSpan.Zero)
            to = to.Date.AddDays(1).AddSeconds(-1); // 23:59:59

        if (from >= to)
            return BadRequest(new { message = "Thoi gian 'from' phai nho hon 'to'." });

        var data = await _service.GetByTimeRangeAsync(from, to, ct);
        return Ok(data);
    }

}
