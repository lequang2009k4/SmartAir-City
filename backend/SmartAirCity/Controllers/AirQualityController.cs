//  SPDX-License-Identifier: MIT
//  © 2025 SmartAir City Team
 
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
 

using Microsoft.AspNetCore.Mvc;
using SmartAirCity.Models;
using SmartAirCity.Services;
using System.Text.Json;

namespace SmartAirCity.Controllers;

[ApiController]
[Route("api")]
public class AirQualityController : ControllerBase
{
    private readonly AirQualityService _service;
    private readonly DataNormalizationService _normalizer;
    private readonly ILogger<AirQualityController> _logger;

    public AirQualityController(
        AirQualityService service,
        DataNormalizationService normalizer,
        ILogger<AirQualityController> logger)
    {
        _service = service;
        _normalizer = normalizer;
        _logger = logger;
    }

    // === POST /api/iot-data ===
    [HttpPost("iot-data")]
    public async Task<IActionResult> PostIot([FromBody] JsonElement data, CancellationToken ct)
    {
        var entity = _normalizer.NormalizeFromIotJson(data.GetRawText());
        if (entity is null)
            return BadRequest(new { message = "Payload IoT không hợp lệ (JSON-LD NGSI-LD)." });

        await _service.InsertAsync(entity, ct);
        return Ok(new { message = "✅ Đã nhận & lưu IoT JSON-LD", id = entity.Id });
    }

    // === GET /api/airquality ===
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

    // === GET /api/airquality/latest ===
    [HttpGet("airquality/latest")]
    public async Task<IActionResult> GetLatest(CancellationToken ct)
    {
        var data = await _service.GetLatestAsync(ct);
        if (data == null)
            return NotFound(new { message = "Không có dữ liệu." });
        return Ok(data);
    }

    // === GET /api/airquality/history?from=...&to=... ===
  [HttpGet("airquality/history")]
    public async Task<IActionResult> GetHistory([FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct)
    {
        // neu chi nhap ngay, tu dong set đau và cuoi ngay
        if (from.TimeOfDay == TimeSpan.Zero)
            from = from.Date; // 00:00:00

        if (to.TimeOfDay == TimeSpan.Zero)
            to = to.Date.AddDays(1).AddSeconds(-1); // 23:59:59

        if (from >= to)
            return BadRequest(new { message = "Thời gian 'from' phải nhỏ hơn 'to'." });

        var data = await _service.GetByTimeRangeAsync(from, to, ct);
        return Ok(data);
    }

}
