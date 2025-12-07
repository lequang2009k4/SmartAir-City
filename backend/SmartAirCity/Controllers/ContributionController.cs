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
    private readonly UserDirectoryClient _userDirectory;
    private readonly IConfiguration _config;
    private readonly ILogger<ContributionController> _logger;
    private readonly JsonSerializerOptions _serializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    // Constants for file upload
    private const long DEFAULT_MAX_FILE_SIZE_BYTES = 10485760; // 10MB (khop voi appsettings.json)
    private const double BYTES_TO_MEGABYTES = 1048576.0; // 1024 * 1024

    public ContributionController(
        ContributedDataService contributedDataService,
        ContributionValidationService validationService,
        UserDirectoryClient userDirectory,
        IConfiguration config,
        ILogger<ContributionController> logger)
    {
        _contributedDataService = contributedDataService;
        _validationService = validationService;
        _userDirectory = userDirectory;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Receive JSON file, validate and save to ContributedData collection
    /// </summary>
    /// <remarks>
    /// Upload air quality data contributed by community members or external sources. 
    /// The uploaded JSON file will be validated against NGSI-LD schema and stored in the ContributedData collection.
    /// Each contribution is assigned a unique contributionId for tracking and retrieval.
    /// </remarks>
    /// <response code="200">File uploaded and validated successfully</response>
    /// <response code="400">Invalid file format or validation failed</response>
    [HttpPost("upload")]
[Consumes("multipart/form-data")]
public async Task<IActionResult> UploadContribution(CancellationToken ct = default)
{
    try
    {
        _logger.LogInformation("Processing file upload request");

        if (!Request.HasFormContentType)
        {
            _logger.LogWarning("Request is not multipart/form-data");
            return BadRequest(new { message = "Request must be multipart/form-data" });
        }

        var form = await Request.ReadFormAsync(ct);
        
        // Extract email va file voi key khong phan biet khoang trang
        var email = FindFormValue(form, "email");
        var file = form.Files["file"];

            if (file == null || file.Length == 0)
            {
            _logger.LogWarning("File validation failed");
                return BadRequest(new { message = "File khong duoc de trong" });
            }

        if (string.IsNullOrWhiteSpace(email))
        {
            _logger.LogWarning("Email validation failed");
            return BadRequest(new { message = "Email khong duoc de trong" });   
        }

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _userDirectory.GetByEmailAsync(normalizedEmail, ct);
        if (user == null)
        {
            _logger.LogWarning("User not found for email: {Email}", normalizedEmail);
            return NotFound(new { message = $"Khong tim thay nguoi dung voi email {normalizedEmail}" });
        }

        if (!file.FileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "File phai co dinh dang JSON (.json)" });

        // Doc gioi han kich thuoc file tu config (khong hardcode)
        var maxFileSize = _config.GetValue<long>("FileUpload:MaxFileSizeBytes", DEFAULT_MAX_FILE_SIZE_BYTES);
        
        if (file.Length > maxFileSize)
        {
            var maxSizeMB = maxFileSize / BYTES_TO_MEGABYTES;
            return BadRequest(new { message = $"File khong duoc vuot qua {maxSizeMB:F1}MB" });
        }

            string jsonContent;
            using (var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8))
            {
                jsonContent = await reader.ReadToEndAsync(ct);
            }

        _logger.LogInformation("Processing file: {FileName}, Size: {Size} bytes", file.FileName, file.Length);

            var validationResult = _validationService.ValidateJson(jsonContent);

            if (!validationResult.IsValid)
            {
            _logger.LogInformation("File validation failed: {Errors}", string.Join(", ", validationResult.Errors));
                return BadRequest(new
                {
                    message = "Du lieu khong hop le theo chuan NGSI-LD",
                    errors = validationResult.Errors
                });
            }

        return await ProcessValidationResult(validationResult, user.Id, ct);
        }
        catch (Exception ex)
        {
        _logger.LogError(ex, "Error processing file upload");
        return StatusCode(500, new { message = "Loi server khi xu ly file upload", error = ex.Message });
        }
    }

    /// <summary>
    /// Display ALL users who contributed and their total contribution count
    /// (Not NGSI-LD compliant - Simple JSON format)
    /// </summary>
    /// <remarks>
    /// Retrieve a list of all contributors and their contribution statistics. 
    /// Returns simplified JSON format (not NGSI-LD) for easy display in leaderboards or public dashboards.
    /// Includes contributor email/name and total number of contributions.
    /// </remarks>
    /// <response code="200">Returns list of contributors successfully</response>
    [HttpGet("public")]
    public async Task<IActionResult> GetPublicContributions(CancellationToken ct = default)
    {
        try
        {
            // Lay TAT CA du lieu dong gop
            var allData = await _contributedDataService.GetAllAsync(ct);

            if (allData.Count == 0)
            {
                return Ok(new { 
                    totalContributions = 0,
                    totalContributors = 0,
                    contributors = new List<object>() 
                });
            }

            // Lay danh sach userId duy nhat de fetch thong tin user
            var uniqueUserIds = allData
                .Where(x => !string.IsNullOrEmpty(x.UserId))
                .Select(x => x.UserId!)
                .Distinct()
                .ToList();

            _logger.LogInformation("Fetching user info for {Count} unique users", uniqueUserIds.Count);

            // Fetch thong tin user tu SmartCity-Core (batch)
            var userInfoCache = new Dictionary<string, UserDirectoryUser>();
            foreach (var userId in uniqueUserIds)
            {
                try
                {
                    var userInfo = await _userDirectory.GetByIdAsync(userId, ct);
                    if (userInfo != null)
                    {
                        userInfoCache[userId] = userInfo;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to fetch user info for userId: {UserId}", userId);
                }
            }

            // Nhom theo userId de tinh tong so dong gop cua tung user
            var groupedByUser = allData
                .Where(x => !string.IsNullOrEmpty(x.UserId))
                .GroupBy(x => x.UserId!)
                .ToList();

            var contributors = new List<object>();

            foreach (var userGroup in groupedByUser)
            {
                var userId = userGroup.Key;
                var contributionCount = userGroup.Count();

                // Lay thong tin user tu cache
                if (userInfoCache.TryGetValue(userId, out var userInfo))
                {
                    contributors.Add(new
                    {
                        userName = userInfo.Name,
                        email = userInfo.Email,
                        contributionCount = contributionCount
                    });
                }
                else
                {
                    // Fallback neu khong lay duoc thong tin user
                    contributors.Add(new
                    {
                        userName = "Unknown User",
                        email = "unknown@example.com",
                        contributionCount = contributionCount
                    });
                }
            }

            // Sap xep theo so luong dong gop (nhieu nhat len dau)
            contributors = contributors
                .OrderByDescending(c => ((dynamic)c).contributionCount)
                .ToList();

            _logger.LogInformation("Retrieved {TotalContributors} contributors with {TotalContributions} total contributions", 
                contributors.Count, allData.Count);

            // Simple JSON response
            var response = new
            {
                totalContributions = allData.Count,
                totalContributors = contributors.Count,
                contributors = contributors
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving public contributions");
            return StatusCode(500, new { message = "Lỗi server khi lấy dữ liệu public", error = ex.Message });
        }
    }

    /// <summary>
    /// Get list of all contributionIds with metadata (record count, upload date)
    /// Optional: filter by email (userId not exposed)
    /// </summary>
    /// <remarks>
    /// Retrieve metadata for all contributions, optionally filtered by contributor email. 
    /// Returns contribution IDs, record counts, and upload timestamps.
    /// Useful for browsing available contributed datasets before downloading full data.
    /// </remarks>
    /// <param name="email">Optional email filter to show only specific contributor's data</param>
    /// <response code="200">Returns list of contributions with metadata</response>
    [HttpGet("list")]
    public async Task<IActionResult> GetContributionIds(
        [FromQuery] string? email = null,
        CancellationToken ct = default)
    {
        try
        {
            string? userId = null;

            // neu co email thi lay userId tu UserDirectory (internal, khong lo ra ngoai)
            if (!string.IsNullOrWhiteSpace(email))
            {
                var normalizedEmail = email.Trim().ToLowerInvariant();
                var user = await _userDirectory.GetByEmailAsync(normalizedEmail, ct);
                
                if (user == null)
                {
                    return NotFound(new { message = $"Khong tim thay user voi email: {email}" });
                }

                userId = user.Id; // chi dung internal de filter
                _logger.LogInformation("Filtering contributions by email: {Email} (userId: {UserId} - internal only)", normalizedEmail, userId);
            }

            var contributions = await _contributedDataService.GetAllContributionIdsAsync(userId, ct);

            return Ok(new
            {
                total = contributions.Count,
                contributions = contributions
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving contribution IDs for email: {Email}", email);
            return StatusCode(500, new { message = "Loi server khi lay danh sach contributionId", error = ex.Message });
        }
    }

    /// <summary>
    /// Get N latest data records in that contribution (default 5 records)
    /// </summary>
    /// <remarks>
    /// Retrieve contributed air quality observations. 
    /// Returns NGSI-LD normalized format as per ETSI specification. 
    /// Data includes various air quality parameters depending on contributor's sensors and data source.
    /// </remarks>
    /// <param name="contributionId">Unique contribution identifier</param>
    /// <param name="limit">Maximum number of records to return (default: 5)</param>
    /// <response code="200">Returns latest contributed data successfully</response>
    /// <response code="404">Contribution not found</response>
    [HttpGet("{contributionId}/latest")]
    public async Task<IActionResult> GetLatestByContributionId(
        [FromRoute] string contributionId,
        [FromQuery] int limit = 5,
        CancellationToken ct = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(contributionId))
            {
                return BadRequest(new { message = "contributionId khong duoc de trong" });
            }

            if (limit <= 0 || limit > 100)
            {
                limit = 5; // mac dinh 5 neu invalid
            }

            var data = await _contributedDataService.GetLatestNByContributionIdAsync(contributionId, limit, ct);

            if (data == null || data.Count == 0)
            {
                return NotFound(new { message = $"Khong tim thay du lieu cho contributionId: {contributionId}" });
            }

            // Strip userId tu moi contribution truoc khi tra ve
            var cleanedData = data.Select(item =>
            {
                var cleaned = new AirQuality
                {
                    Id = item.Id,
                    Type = item.Type,
                    Context = item.Context,
                    MadeBySensor = item.MadeBySensor,
                    ObservedProperty = item.ObservedProperty,
                    HasFeatureOfInterest = item.HasFeatureOfInterest,
                    Location = item.Location,
                    DateObserved = item.DateObserved,
                    // Copy ALL dynamic properties (completely generic)
                    Properties = item.Properties != null 
                        ? new Dictionary<string, object>(item.Properties) 
                        : null
                };
                return cleaned;
            }).ToList();

            return Ok(new
            {
                contributionId = contributionId,
                count = cleanedData.Count,
                limit = limit,
                data = cleanedData
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving latest contributions for contributionId: {ContributionId}", contributionId);
            return StatusCode(500, new { message = "Loi server khi lay du lieu", error = ex.Message });
        }
    }

    /// <summary>
    /// Download all data from that contribution as JSON file
    /// </summary>
    /// <remarks>
    /// Download complete contributed dataset as a JSON file. 
    /// Returns NGSI-LD normalized format as per ETSI specification. 
    /// Useful for offline analysis or data archiving.
    /// </remarks>
    /// <param name="contributionId">Unique contribution identifier</param>
    /// <response code="200">Returns downloadable JSON file</response>
    /// <response code="404">Contribution not found</response>
    [HttpGet("{contributionId}/download")]
    public async Task<IActionResult> DownloadByContributionId(
        [FromRoute] string contributionId,
        CancellationToken ct = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(contributionId))
            {
                return BadRequest(new { message = "contributionId không được để trống" });
            }

            var data = await _contributedDataService.GetByContributionIdAsync(contributionId, ct);

            if (data == null || data.Count == 0)
            {
                return NotFound(new { message = $"Khong tim thay du lieu cho contributionId: {contributionId}" });
            }

            // Strip userId tu moi contribution truoc khi tra ve
            var cleanedData = data.Select(item =>
            {
                var cleaned = new AirQuality
                {
                    Id = item.Id,
                    Type = item.Type,
                    Context = item.Context,
                    MadeBySensor = item.MadeBySensor,
                    ObservedProperty = item.ObservedProperty,
                    HasFeatureOfInterest = item.HasFeatureOfInterest,
                    Location = item.Location,
                    DateObserved = item.DateObserved,
                    // Copy ALL dynamic properties (completely generic)
                    Properties = item.Properties != null 
                        ? new Dictionary<string, object>(item.Properties) 
                        : null
                };
                return cleaned;
            }).ToList();

            // Serialize to JSON
            var json = System.Text.Json.JsonSerializer.Serialize(cleanedData,
                new System.Text.Json.JsonSerializerOptions
                {
                    WriteIndented = true
                });

            var bytes = System.Text.Encoding.UTF8.GetBytes(json);
            var fileName = $"contribution_{contributionId}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.json";

            _logger.LogInformation("Downloaded {Count} records for contributionId: {ContributionId}", cleanedData.Count, contributionId);

            return File(bytes, "application/json", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading contributions for contributionId: {ContributionId}", contributionId);
            return StatusCode(500, new { message = "Loi server khi download du lieu", error = ex.Message });
        }
    }

    #region Private Methods

    private async Task<IActionResult> ProcessValidationResult(ValidationResult validationResult, string userId, CancellationToken ct)
    {
        // Tao contributionId moi cho lut upload nay (tat ca ban ghi trong cung 1 lan upload se co cung contributionId)
        var contributionId = Guid.NewGuid().ToString();
        _logger.LogInformation("Generated contributionId: {ContributionId} for user: {UserId}", contributionId, userId);

        if (validationResult.DataList != null && validationResult.DataList.Count > 0)
        {
            var contributedList = validationResult.DataList
                .Select(item => ConvertToContributed(item, userId, contributionId))
                .ToList();

            var ids = await _contributedDataService.InsertManyAsync(contributedList, ct);
            _logger.LogInformation("Contributed {Count} data records saved with contributionId: {ContributionId}", ids.Count, contributionId);

            return Ok(new
            {
                message = $"Luu thanh cong {ids.Count} ban ghi!",
                count = ids.Count,
                contributionId = contributionId,
                ids
            });
        }
        else if (validationResult.Data != null)
        {
            var contributed = ConvertToContributed(validationResult.Data, userId, contributionId);
            var dataId = await _contributedDataService.InsertAsync(contributed, ct);
            _logger.LogInformation("Contributed data saved with ID: {Id}, contributionId: {ContributionId}", dataId, contributionId);

            return Ok(new
            {
                message = "Luu du lieu thanh cong!",
                id = dataId,
                contributionId = contributionId
            });
        }
        else
        {
            return BadRequest(new { message = "Khong co du lieu hop le de luu" });
        }
    }

    private ContributedAirQuality ConvertToContributed(AirQuality source, string userId, string contributionId)
    {
        var json = JsonSerializer.Serialize(source, _serializerOptions);
        var cloned = JsonSerializer.Deserialize<ContributedAirQuality>(json, _serializerOptions)
            ?? new ContributedAirQuality();
        cloned.UserId = userId;
        cloned.ContributionId = contributionId;
        cloned.Context = NormalizeContext(cloned.Context);
        return cloned;
    }

    private object[] NormalizeContext(object[]? original)
    {
        var contextUrl = _config["NGSILD:ContextUrl"] ?? "https://smartdatamodels.org/context.jsonld";
        var sosaNamespace = _config["NGSILD:SosaNamespace"] ?? "http://www.w3.org/ns/sosa/";
        
        if (original == null || original.Length == 0)
        {
            return new object[]
            {
                contextUrl,
                new Dictionary<string, string> { { "sosa", sosaNamespace } }
            };
        }

        var normalized = new List<object>();

        foreach (var item in original)
        {
            switch (item)
            {
                case JsonElement jsonElement:
                    if (jsonElement.ValueKind == JsonValueKind.String)
                    {
                        var value = jsonElement.GetString();
                        if (!string.IsNullOrEmpty(value))
                            normalized.Add(value);
                    }
                    else if (jsonElement.ValueKind == JsonValueKind.Object)
                    {
                        var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(
                            jsonElement.GetRawText(), _serializerOptions);
                        if (dict != null && dict.Count > 0)
                            normalized.Add(dict);
                    }
                    break;
                default:
                    normalized.Add(item);
                    break;
            }
        }

        if (normalized.Count == 0)
        {
            normalized.Add(contextUrl);
            normalized.Add(new Dictionary<string, string> { { "sosa", sosaNamespace } });
        }

        return normalized.ToArray();
    }

    private string? FindFormValue(IFormCollection form, string keyName)
    {
        foreach (var key in form.Keys)
        {
            if (key?.ToString().Trim().Equals(keyName, StringComparison.OrdinalIgnoreCase) == true)
            {
                return form[key].ToString();
            }
        }
        return null;
    }

    #endregion
}