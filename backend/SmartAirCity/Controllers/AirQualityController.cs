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


    //PRIVATE HELPER METHOD
    // Shared logic de lay du lieu AirQuality (dung chung cho view va download)
    private async Task<List<AirQuality>> GetAirQualityDataAsync(
        string? stationId, 
        int? limit, 
        CancellationToken ct)
    {
        // neu co stationId thi lay theo station
        if (!string.IsNullOrWhiteSpace(stationId))
        {
            return await _service.GetByStationAsync(stationId, limit, ct);
        }
        // neu co limit thi lay N ban ghi moi nhat
        else if (limit.HasValue)
        {
            return await _service.GetLatestNAsync(limit.Value, ct);
        }
        // neu khong co stationId va limit thi lay tat ca
        else
        {
            return await _service.GetAllAsync(ct);
        }
    }

    // VIEW APIs (JSON Response)
    
    // GET /api/airquality?stationId={stationId}&limit=100
    // API de XEM du lieu (tra ve JSON response)
    [HttpGet("airquality")]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? stationId, 
        [FromQuery] int? limit, 
        CancellationToken ct)
    {
        var data = await GetAirQualityDataAsync(stationId, limit, ct);
        return Ok(data);
    }

    //DOWNLOAD APIs (File Download)
    
    // GET /api/airquality/download?stationId={stationId}&limit=100&format=json
    // API de DOWNLOAD file du lieu
    [HttpGet("airquality/download")]
    public async Task<IActionResult> DownloadAll(
        [FromQuery] string? stationId, 
        [FromQuery] int? limit,
        CancellationToken ct,
        [FromQuery] string format = "json")
    {
        var data = await GetAirQualityDataAsync(stationId, limit, ct);
        
        // hien tai chi ho tro JSON, sau nay co the them CSV, Excel
        switch (format.ToLower())
        {
            case "json":
                var json = System.Text.Json.JsonSerializer.Serialize(data, 
                    new System.Text.Json.JsonSerializerOptions 
                    { 
                        WriteIndented = true 
                    });
                var bytes = System.Text.Encoding.UTF8.GetBytes(json);
                var fileName = $"airquality_{DateTime.UtcNow:yyyyMMdd_HHmmss}.json";
                return File(bytes, "application/json", fileName);
                
            default:
                return BadRequest(new { message = $"Format '{format}' khong duoc ho tro. Hien tai chi ho tro: json" });
        }
    }

    // GET /api/airquality/latest?stationId={stationId}
    [HttpGet("airquality/latest")]
    public async Task<IActionResult> GetLatest([FromQuery] string? stationId, CancellationToken ct)
    {
        // neu co stationId thi lay ban ghi moi nhat cua tram do
        if (!string.IsNullOrWhiteSpace(stationId))
        {
            var stationData = await _service.GetByStationAsync(stationId, 1, ct);
            if (stationData == null || stationData.Count == 0)
                return NotFound(new { message = $"Khong co du lieu cho tram {stationId}" });
            return Ok(stationData[0]); // tra ve 1 object, khong phai mang
        }

        // neu khong co stationId thi lay ban ghi moi nhat cua tat ca tram (backward compatible)
        var data = await _service.GetLatestAsync(ct);
        if (data == null)
            return NotFound(new { message = "Khong co du lieu" });
        return Ok(data);
    }

    // Private helper method de lay du lieu history
    private async Task<List<AirQuality>> GetHistoryDataAsync(
        string? stationId,
        DateTime from,
        DateTime to,
        CancellationToken ct)
    {
        // Validate thoi gian
        if (from.TimeOfDay == TimeSpan.Zero)
            from = from.Date; // 00:00:00

        if (to.TimeOfDay == TimeSpan.Zero)
            to = to.Date.AddDays(1).AddSeconds(-1); // 23:59:59

        var data = await _service.GetByTimeRangeAsync(from, to, ct);
        
        // neu co stationId thi filter theo tram
        if (!string.IsNullOrWhiteSpace(stationId))
        {
            data = data
                .Where(x => ExtractStationIdFromData(x)?.Equals(stationId, StringComparison.OrdinalIgnoreCase) == true)
                .ToList();
        }

        return data;
    }

    // GET /api/airquality/history?stationId={stationId}&from=...&to=...
    // API de XEM lich su du lieu (tra ve JSON response)
    [HttpGet("airquality/history")]
    public async Task<IActionResult> GetHistory(
        [FromQuery] string? stationId, 
        [FromQuery] DateTime from, 
        [FromQuery] DateTime to,
        CancellationToken ct)
    {
        if (from >= to)
            return BadRequest(new { message = "Thoi gian 'from' phai nho hon 'to'." });

        var data = await GetHistoryDataAsync(stationId, from, to, ct);
        return Ok(data);
    }

    // GET /api/airquality/history/download?stationId={stationId}&from=...&to=...&format=json
    // API de DOWNLOAD lich su du lieu
    [HttpGet("airquality/history/download")]
    public async Task<IActionResult> DownloadHistory(
        [FromQuery] string? stationId, 
        [FromQuery] DateTime from, 
        [FromQuery] DateTime to,
        CancellationToken ct,
        [FromQuery] string format = "json")
    {
        if (from >= to)
            return BadRequest(new { message = "Thoi gian 'from' phai nho hon 'to'." });

        var data = await GetHistoryDataAsync(stationId, from, to, ct);
        
        switch (format.ToLower())
        {
            case "json":
                var json = System.Text.Json.JsonSerializer.Serialize(data, 
                    new System.Text.Json.JsonSerializerOptions 
                    { 
                        WriteIndented = true 
                    });
                var bytes = System.Text.Encoding.UTF8.GetBytes(json);
                var fileName = $"airquality_history_{from:yyyyMMdd}_to_{to:yyyyMMdd}.json";
                return File(bytes, "application/json", fileName);
                
            default:
                return BadRequest(new { message = $"Format '{format}' khong duoc ho tro. Hien tai chi ho tro: json" });
        }
    }


    // Helper method: Extract station ID tu AirQuality object
    private string? ExtractStationIdFromData(AirQuality data)
    {
        // thu extract tu Id (vd: urn:ngsi-ld:AirQualityObserved:station-hanoi-oceanpark:2025-11-28...)
        if (!string.IsNullOrEmpty(data.Id))
        {
            var parts = data.Id.Split(':');
            if (parts.Length >= 4)
            {
                return parts[3];
            }
        }

        // thu extract tu MadeBySensor (vd: urn:ngsi-ld:Device:mq135-hanoi-oceanpark)
        if (data.MadeBySensor != null && !string.IsNullOrEmpty(data.MadeBySensor.Object))
        {
            var parts = data.MadeBySensor.Object.Split(':');
            if (parts.Length >= 3)
            {
                var sensorName = parts[^1];
                if (sensorName.StartsWith("mq135-"))
                {
                    return "station-" + sensorName.Substring(6);
                }
                return sensorName;
            }
        }

        return "station-unknown";
    }

}
