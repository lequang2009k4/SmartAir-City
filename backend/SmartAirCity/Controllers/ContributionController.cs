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
using SmartAirCity.Services;
using SmartAirCity.Models;
using Microsoft.AspNetCore.Http;
using System.Text;
using System.Text.Json;

namespace SmartAirCity.Controllers;

[ApiController]
[Route("api/contributions")]
public class ContributionController : ControllerBase
{
    private readonly ContributedDataService _contributedDataService;
    private readonly ContributionValidationService _validationService;
    private readonly ILogger<ContributionController> _logger;

    public ContributionController(
        ContributedDataService contributedDataService,
        ContributionValidationService validationService,
        ILogger<ContributionController> logger)
    {
        _contributedDataService = contributedDataService;
        _validationService = validationService;
        _logger = logger;
    }

    /// <summary>
    /// POST /api/contributions/upload
    /// Nhận file JSON, validate và lưu vào collection ContributedData
    /// </summary>
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadContribution(
        [FromForm] FileUploadModel model,
        CancellationToken ct = default)
    {
        try
        {
            if (model.File == null || model.File.Length == 0)
                return BadRequest(new { message = "File không được để trống" });

            var file = model.File;

            if (!file.FileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "File phải có định dạng JSON (.json)" });

            if (file.Length > 1048576)
                return BadRequest(new { message = "File không được vượt quá 1MB" });

            string jsonContent;
            using (var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8))
            {
                jsonContent = await reader.ReadToEndAsync(ct);
            }

            _logger.LogInformation("Received file upload: {FileName}, Size: {Size} bytes", 
                file.FileName, file.Length);

            var validationResult = _validationService.ValidateJson(jsonContent);

            if (!validationResult.IsValid)
            {
                _logger.LogInformation("File validation failed: {Errors}", string.Join(", ", validationResult.Errors));
                return BadRequest(new
                {
                    message = "Dữ liệu không hợp lệ theo chuẩn NGSI-LD",
                    errors = validationResult.Errors
                });
            }

            // Xử lý single object hoặc array
            if (validationResult.DataList != null && validationResult.DataList.Count > 0)
            {
                // Xử lý nhiều bản ghi
                var ids = await _contributedDataService.InsertManyAsync(validationResult.DataList, ct);
                _logger.LogInformation("Contributed {Count} data records saved", ids.Count);

                return Ok(new
                {
                    message = $"Lưu thành công {ids.Count} bản ghi!",
                    count = ids.Count,
                    ids = ids
                });
            }
            else if (validationResult.Data != null)
            {
                // Xử lý single object
                var dataId = await _contributedDataService.InsertAsync(validationResult.Data, ct);
                _logger.LogInformation("Contributed data saved with ID: {Id}", dataId);

                return Ok(new
                {
                    message = "Lưu dữ liệu thành công!",
                    id = dataId
                });
            }
            else
            {
                return BadRequest(new { message = "Không có dữ liệu hợp lệ để lưu" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing file upload");
            return StatusCode(500, new { message = "Lỗi server khi xử lý file upload", error = ex.Message });
        }
    }

    /// <summary>
    /// POST /api/contributions
    /// Nhận JSON trực tiếp qua request body
    /// </summary>
    [HttpPost]
    [Consumes("application/json")]
    public async Task<IActionResult> SubmitContribution([FromBody] JsonElement jsonData, CancellationToken ct = default)
    {
        try
        {
            var jsonContent = jsonData.GetRawText();
            var validationResult = _validationService.ValidateJson(jsonContent);

            if (!validationResult.IsValid)
            {
                _logger.LogInformation("JSON validation failed: {Errors}", string.Join(", ", validationResult.Errors));
                return BadRequest(new
                {
                    message = "Dữ liệu không hợp lệ theo chuẩn NGSI-LD",
                    errors = validationResult.Errors
                });
            }

            // Xử lý single object hoặc array
            if (validationResult.DataList != null && validationResult.DataList.Count > 0)
            {
                // Xử lý nhiều bản ghi
                var ids = await _contributedDataService.InsertManyAsync(validationResult.DataList, ct);
                _logger.LogInformation("Contributed {Count} data records saved", ids.Count);

                return Ok(new
                {
                    message = $"Lưu thành công {ids.Count} bản ghi!",
                    count = ids.Count,
                    ids = ids
                });
            }
            else if (validationResult.Data != null)
            {
                // Xử lý single object
                var dataId = await _contributedDataService.InsertAsync(validationResult.Data, ct);
                _logger.LogInformation("Contributed data saved with ID: {Id}", dataId);

                return Ok(new
                {
                    message = "Lưu dữ liệu thành công!",
                    id = dataId
                });
            }
            else
            {
                return BadRequest(new { message = "Không có dữ liệu hợp lệ để lưu" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing JSON contribution");
            return StatusCode(500, new { message = "Lỗi server khi xử lý dữ liệu JSON", error = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/contributions
    /// Lấy danh sách dữ liệu đóng góp (trả về array trực tiếp, mới nhất lên đầu)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? limit, CancellationToken ct = default)
    {
        try
        {
            if (limit.HasValue)
            {
                var data = await _contributedDataService.GetLatestNAsync(limit.Value, ct);
                return Ok(data); // Trả về array trực tiếp
            }

            var all = await _contributedDataService.GetAllAsync(ct);
            return Ok(all); // Trả về array trực tiếp
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving contributed data");
            return StatusCode(500, new { message = "Lỗi server khi lấy dữ liệu", error = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/contributions/stations
    /// Lấy danh sách các trạm có trong dữ liệu đóng góp
    /// </summary>
    [HttpGet("stations")]
    public async Task<IActionResult> GetStations(CancellationToken ct = default)
    {
        try
        {
            var stations = await _contributedDataService.GetDistinctStationsAsync(ct);
            return Ok(new
            {
                stations = stations,
                total = stations.Count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving stations list");
            return StatusCode(500, new { message = "Lỗi server khi lấy danh sách trạm", error = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/contributions/station/{stationId}
    /// Lấy dữ liệu đóng góp theo trạm
    /// </summary>
    [HttpGet("station/{stationId}")]
    public async Task<IActionResult> GetByStation(string stationId, CancellationToken ct = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(stationId))
            {
                return BadRequest(new { message = "StationId không được để trống" });
            }

            var data = await _contributedDataService.GetByStationAsync(stationId, ct);
            return Ok(new
            {
                stationId = stationId,
                total = data.Count,
                data = data
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving data for station: {StationId}", stationId);
            return StatusCode(500, new { message = "Lỗi server khi lấy dữ liệu", error = ex.Message });
        }
    }

}