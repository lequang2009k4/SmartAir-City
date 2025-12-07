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

        // Check if data items have StationId property and set to null to hide from API response
        foreach (var item in result)
        {
            var dataObj = ((dynamic)item).data;
            // Check if property exists using reflection or dynamic bind
            try {
                if (dataObj != null) dataObj.StationId = null; 
            } catch {}
        }

        return result;
    }

    // VIEW APIs (JSON Response)
    
    // GET /api/airquality?stationId={stationId}&limit=100
    // Lấy dữ liệu từ tất cả nguồn (official + external)
    // stationId là BẮT BUỘC
    /// <summary>
    /// Get air quality observations
    /// </summary>
    /// <remarks>
    /// Retrieve air quality observations for a specific monitoring station. 
    /// Returns NGSI-LD normalized format as per ETSI specification. 
    /// Data includes various air quality parameters (PM2.5, PM10, CO, NO2, O3, SO2, temperature, humidity, etc.) 
    /// depending on station capabilities and sensor availability.
    /// </remarks>
    /// <param name="stationId">Station ID (required)</param>
    /// <param name="limit">Maximum number of records to return (optional)</param>
    /// <response code="200">Returns air quality data successfully</response>
    /// <response code="400">stationId is required</response>
    [HttpGet("airquality")]
    public async Task<IActionResult> GetAll(
        [FromQuery] string stationId,  // Required parameter
        [FromQuery] int? limit,
        CancellationToken ct = default)
    {
        // Validate stationId
        if (string.IsNullOrWhiteSpace(stationId))
        {
            return BadRequest(new { message = "stationId is required" });
        }

        const string source = "all"; // Luôn lấy từ tất cả nguồn

        var data = await GetAirQualityDataAsync(stationId, limit, source, ct);
        
        // Trả về mảng data trực tiếp
        return Ok(data.Select(x => ((dynamic)x).data));
    }

    //DOWNLOAD APIs (File Download)
    
    // GET /api/airquality/download?stationId={stationId}&limit=100&format=json
    // API de DOWNLOAD file du lieu
    // stationId là BẮT BUỘC
    /// <summary>
    /// Download air quality data as file
    /// </summary>
    /// <remarks>
    /// Download air quality observations for a specific monitoring station as JSON file. 
    /// Returns NGSI-LD normalized format as per ETSI specification. 
    /// Data includes various air quality parameters (PM2.5, PM10, CO, NO2, O3, SO2, temperature, humidity, etc.) 
    /// depending on station capabilities and sensor availability.
    /// </remarks>
    /// <param name="stationId">Station ID (required)</param>
    /// <param name="limit">Maximum number of records to return (optional)</param>
    /// <param name="format">File format (json only, default: json)</param>
    /// <response code="200">Returns downloadable JSON file</response>
    /// <response code="400">stationId is required or format not supported</response>
    [HttpGet("airquality/download")]
    public async Task<IActionResult> DownloadAll(
        [FromQuery] string stationId,  // Required parameter
        [FromQuery] int? limit,
        CancellationToken ct = default,
        [FromQuery] string format = "json")
    {
        // Validate stationId
        if (string.IsNullOrWhiteSpace(stationId))
        {
            return BadRequest(new { message = "stationId is required" });
        }

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
    // stationId là BẮT BUỘC
    /// <summary>
    /// Get latest air quality observations
    /// </summary>
    /// <remarks>
    /// Retrieve the most recent air quality observation for a specific monitoring station. 
    /// Returns NGSI-LD normalized format as per ETSI specification. 
    /// Data includes various air quality parameters (PM2.5, PM10, CO, NO2, O3, SO2, temperature, humidity, etc.) 
    /// depending on station capabilities and sensor availability.
    /// </remarks>
    /// <param name="stationId">Station ID (required)</param>
    /// <response code="200">Returns latest air quality data successfully</response>
    /// <response code="400">stationId is required</response>
    /// <response code="404">No data found for the station</response>
    [HttpGet("airquality/latest")]
    public async Task<IActionResult> GetLatest(
        [FromQuery] string stationId,  // Required parameter
        CancellationToken ct = default)
    {
        // Validate stationId
        if (string.IsNullOrWhiteSpace(stationId))
        {
            return BadRequest(new { message = "stationId is required" });
        }

        var results = new List<object>();

        // Get official latest for specific station
        var stationData = await _service.GetByStationAsync(stationId, 1, ct);
        if (stationData?.Count > 0)
        {
            stationData[0].StationId = null; // Hide from API response
            results.Add(new { _source = "official", data = stationData[0] });
        }

        // Get external latest for specific station
        var extData = await _externalService.GetLatestByStationIdAsync(stationId);
        if (extData != null)
        {
            extData.StationId = null; // Hide from API response
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
            List<AirQuality> data;
            
            // neu co stationId thi filter theo tram ngay tai database
            if (!string.IsNullOrWhiteSpace(stationId))
            {
                data = await _service.GetByTimeRangeAndStationAsync(from, to, stationId, ct);
            }
            else
            {
                data = await _service.GetByTimeRangeAsync(from, to, ct);
            }

            foreach (var item in data)
            {
                item.StationId = null; // Hide from API response
                result.Add(new { _source = "official", data = item });
            }
        }

        // Get external history
        if (source == "external" || source == "all")
        {
            List<ExternalAirQuality> extData;
            
            // Filter by stationId if provided
            if (!string.IsNullOrWhiteSpace(stationId))
            {
                extData = await _externalService.GetByTimeRangeAndStationAsync(from, to, stationId);
            }
            else
            {
                extData = await _externalService.GetByTimeRangeAsync(from, to);
            }

            foreach (var item in extData)
            {
                item.StationId = null; // Hide from API response
                result.Add(new { _source = "external", data = item });
            }
        }

        return result;
    }

    // GET /api/airquality/history?stationId={stationId}&from=...&to=...
    // API de XEM lich su du lieu (tra ve JSON response)
    // stationId là BẮT BUỘC
    /// <summary>
    /// Get historical air quality data
    /// </summary>
    /// <remarks>
    /// Retrieve historical air quality observations for a specific monitoring station within a date range. 
    /// Returns NGSI-LD normalized format as per ETSI specification. 
    /// Data includes various air quality parameters (PM2.5, PM10, CO, NO2, O3, SO2, temperature, humidity, etc.) 
    /// depending on station capabilities and sensor availability.
    /// </remarks>
    /// <param name="stationId">Station ID (required)</param>
    /// <param name="from">Start date (ISO 8601 format, required)</param>
    /// <param name="to">End date (ISO 8601 format, required)</param>
    /// <response code="200">Returns historical air quality data successfully</response>
    /// <response code="400">Invalid parameters (stationId, from, or to missing/invalid)</response>
    [HttpGet("airquality/history")]
    public async Task<IActionResult> GetHistory(
        [FromQuery] string stationId,  // Required parameter
        [FromQuery] DateTime from, 
        [FromQuery] DateTime to,
        CancellationToken ct = default)
    {
        // Validate stationId
        if (string.IsNullOrWhiteSpace(stationId))
        {
            return BadRequest(new { message = "stationId is required" });
        }

        if (from >= to)
            return BadRequest(new { message = "Thoi gian 'from' phai nho hon 'to'." });

        const string source = "all";
        var data = await GetHistoryDataAsync(stationId, from, to, source, ct);
        
        // Trả về mảng data trực tiếp
        return Ok(data.Select(x => ((dynamic)x).data));
    }

    // GET /api/airquality/history/download?stationId={stationId}&from=...&to=...&format=json
    // API de DOWNLOAD lich su du lieu
    // stationId là BẮT BUỘC
    /// <summary>
    /// Download historical air quality data as file
    /// </summary>
    /// <remarks>
    /// Download historical air quality observations for a specific monitoring station within a date range as JSON file. 
    /// Returns NGSI-LD normalized format as per ETSI specification. 
    /// Data includes various air quality parameters (PM2.5, PM10, CO, NO2, O3, SO2, temperature, humidity, etc.) 
    /// depending on station capabilities and sensor availability.
    /// </remarks>
    /// <param name="stationId">Station ID (required)</param>
    /// <param name="from">Start date (ISO 8601 format, required)</param>
    /// <param name="to">End date (ISO 8601 format, required)</param>
    /// <param name="format">File format (json only, default: json)</param>
    /// <response code="200">Returns downloadable JSON file with historical data</response>
    /// <response code="400">Invalid parameters or format not supported</response>
    [HttpGet("airquality/history/download")]
    public async Task<IActionResult> DownloadHistory(
        [FromQuery] string stationId,  // Required parameter
        [FromQuery] DateTime from, 
        [FromQuery] DateTime to,
        CancellationToken ct = default,
        [FromQuery] string format = "json")
    {
        // Validate stationId
        if (string.IsNullOrWhiteSpace(stationId))
        {
            return BadRequest(new { message = "stationId is required" });
        }

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
