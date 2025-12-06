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
    private readonly ExternalAirQualityService _externalService;
    private readonly ILogger<AirQualityController> _logger;

    public AirQualityController(
        AirQualityService service,
        ExternalAirQualityService externalService,
        ILogger<AirQualityController> logger)
    {
        _service = service;
        _externalService = externalService;
        _logger = logger;
    }


    //PRIVATE HELPER METHOD
    // Shared logic de lay du lieu AirQuality (dung chung cho view va download)
    // source: "official" (default), "external", "all"
    private async Task<List<object>> GetAirQualityDataAsync(
        string? stationId, 
        int? limit,
        string source,
        CancellationToken ct)
    {
        var result = new List<object>();
        var actualLimit = limit ?? 100; // Default limit

        // Get official data (AirQuality collection)
        if (source == "official" || source == "all")
        {
            List<AirQuality> officialData;
            if (!string.IsNullOrWhiteSpace(stationId))
            {
                officialData = await _service.GetByStationAsync(stationId, limit, ct);
            }
            else if (limit.HasValue)
            {
                officialData = await _service.GetLatestNAsync(limit.Value, ct);
            }
            else
            {
                officialData = await _service.GetAllAsync(ct);
            }
            
            // Add _source field for identification
            foreach (var item in officialData)
            {
                result.Add(new { 
                    _source = "official",
                    data = item 
                });
            }
        }

        // Get external data (ExternalAirQuality collection)
        if (source == "external" || source == "all")
        {
            List<ExternalAirQuality> externalData;
            if (!string.IsNullOrWhiteSpace(stationId))
            {
                externalData = await _externalService.GetByStationAsync(stationId, limit);
            }
            else if (limit.HasValue)
            {
                externalData = await _externalService.GetLatestNAsync(limit.Value);
            }
            else
            {
                externalData = await _externalService.GetAllAsync();
            }
            
            // Add _source field for identification
            foreach (var item in externalData)
            {
                result.Add(new { 
                    _source = "external",
                    data = item 
                });
            }
        }

        // Sort by dateObserved descending and apply limit if getting all
        if (source == "all" && limit.HasValue)
        {
            result = result.Take(limit.Value).ToList();
        }

        return result;
    }

    // VIEW APIs (JSON Response)
    
    // GET /api/airquality?stationId={stationId}&limit=100
    // Lấy dữ liệu từ tất cả nguồn (official + external)
    [HttpGet("airquality")]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? stationId, 
        [FromQuery] int? limit,
        CancellationToken ct = default)
    {
        const string source = "all"; // Luôn lấy từ tất cả nguồn

        var data = await GetAirQualityDataAsync(stationId, limit, source, ct);
        
        // Trả về mảng data trực tiếp
        return Ok(data.Select(x => ((dynamic)x).data));
    }

    //DOWNLOAD APIs (File Download)
    
    // GET /api/airquality/download?stationId={stationId}&limit=100&format=json
    // API de DOWNLOAD file du lieu
    [HttpGet("airquality/download")]
    public async Task<IActionResult> DownloadAll(
        [FromQuery] string? stationId, 
        [FromQuery] int? limit,
        CancellationToken ct = default,
        [FromQuery] string format = "json")
    {
        const string source = "all";

        var data = await GetAirQualityDataAsync(stationId, limit, source, ct);
        var flatData = data.Select(x => ((dynamic)x).data).ToList();
        
        // hien tai chi ho tro JSON, sau nay co the them CSV, Excel
        switch (format.ToLower())
        {
            case "json":
                var json = System.Text.Json.JsonSerializer.Serialize(flatData, 
                    new System.Text.Json.JsonSerializerOptions 
                    { 
                        WriteIndented = true 
                    });
                var bytes = System.Text.Encoding.UTF8.GetBytes(json);
                var fileName = $"airquality_{source}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.json";
                return File(bytes, "application/json", fileName);
                
            default:
                return BadRequest(new { message = $"Format '{format}' khong duoc ho tro. Hien tai chi ho tro: json" });
        }
    }

    // GET /api/airquality/latest?stationId={stationId}
    // Lấy bản ghi mới nhất từ tất cả nguồn
    [HttpGet("airquality/latest")]
    public async Task<IActionResult> GetLatest(
        [FromQuery] string? stationId,
        CancellationToken ct = default)
    {
        var results = new List<object>();

        // Get official latest
        if (!string.IsNullOrWhiteSpace(stationId))
        {
            var stationData = await _service.GetByStationAsync(stationId, 1, ct);
            if (stationData?.Count > 0)
                results.Add(new { _source = "official", data = stationData[0] });
        }
        else
        {
            var data = await _service.GetLatestAsync(ct);
            if (data != null)
                results.Add(new { _source = "official", data = data });
        }

        // Get external latest
        if (!string.IsNullOrWhiteSpace(stationId))
        {
            var extData = await _externalService.GetLatestByStationIdAsync(stationId);
            if (extData != null)
                results.Add(new { _source = "external", data = extData });
        }
        else
        {
            var extData = await _externalService.GetLatestAsync();
            if (extData != null)
                results.Add(new { _source = "external", data = extData });
        }

        if (results.Count == 0)
            return NotFound(new { message = "Khong co du lieu" });

        // Trả về 1 bản ghi mới nhất (object, không phải mảng)
        var latestRecord = results.First();
        return Ok(((dynamic)latestRecord).data);
    }

    // Private helper method de lay du lieu history
    private async Task<List<object>> GetHistoryDataAsync(
        string? stationId,
        DateTime from,
        DateTime to,
        string source,
        CancellationToken ct)
    {
        var result = new List<object>();

        // Validate thoi gian
        if (from.TimeOfDay == TimeSpan.Zero)
            from = from.Date; // 00:00:00

        if (to.TimeOfDay == TimeSpan.Zero)
            to = to.Date.AddDays(1).AddSeconds(-1); // 23:59:59

        // Get official history
        if (source == "official" || source == "all")
        {
            var data = await _service.GetByTimeRangeAsync(from, to, ct);
            
            // neu co stationId thi filter theo tram
            if (!string.IsNullOrWhiteSpace(stationId))
            {
                data = data
                    .Where(x => ExtractStationIdFromData(x)?.Equals(stationId, StringComparison.OrdinalIgnoreCase) == true)
                    .ToList();
            }

            foreach (var item in data)
            {
                result.Add(new { _source = "official", data = item });
            }
        }

        // Get external history
        if (source == "external" || source == "all")
        {
            var extData = await _externalService.GetByTimeRangeAsync(from, to);
            
            // Filter by stationId if provided
            if (!string.IsNullOrWhiteSpace(stationId))
            {
                var pattern = $"urn:ngsi-ld:AirQualityObserved:{stationId}:";
                extData = extData.Where(x => x.Id.StartsWith(pattern)).ToList();
            }

            foreach (var item in extData)
            {
                result.Add(new { _source = "external", data = item });
            }
        }

        return result;
    }

    // GET /api/airquality/history?stationId={stationId}&from=...&to=...
    // API de XEM lich su du lieu (tra ve JSON response)
    [HttpGet("airquality/history")]
    public async Task<IActionResult> GetHistory(
        [FromQuery] string? stationId, 
        [FromQuery] DateTime from, 
        [FromQuery] DateTime to,
        CancellationToken ct = default)
    {
        if (from >= to)
            return BadRequest(new { message = "Thoi gian 'from' phai nho hon 'to'." });

        const string source = "all";
        var data = await GetHistoryDataAsync(stationId, from, to, source, ct);
        
        // Trả về mảng data trực tiếp
        return Ok(data.Select(x => ((dynamic)x).data));
    }

    // GET /api/airquality/history/download?stationId={stationId}&from=...&to=...&format=json
    // API de DOWNLOAD lich su du lieu
    [HttpGet("airquality/history/download")]
    public async Task<IActionResult> DownloadHistory(
        [FromQuery] string? stationId, 
        [FromQuery] DateTime from, 
        [FromQuery] DateTime to,
        CancellationToken ct = default,
        [FromQuery] string format = "json")
    {
        if (from >= to)
            return BadRequest(new { message = "Thoi gian 'from' phai nho hon 'to'." });

        const string source = "all";
        var data = await GetHistoryDataAsync(stationId, from, to, source, ct);
        var flatData = data.Select(x => ((dynamic)x).data).ToList();
        
        switch (format.ToLower())
        {
            case "json":
                var json = System.Text.Json.JsonSerializer.Serialize(flatData, 
                    new System.Text.Json.JsonSerializerOptions 
                    { 
                        WriteIndented = true 
                    });
                var bytes = System.Text.Encoding.UTF8.GetBytes(json);
                var fileName = $"airquality_history_{source}_{from:yyyyMMdd}_to_{to:yyyyMMdd}.json";
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
