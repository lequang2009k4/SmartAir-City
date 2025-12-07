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
using System.Threading.Tasks;
using System.Net.Http;
using System;
using System.Collections.Generic;

namespace SmartAirCity.Controllers;

[ApiController]
[Route("api/sources")]
public class ExternalSourceController : ControllerBase
{
    private readonly ExternalSourceService _service;
    private readonly StationService _stationService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ExternalSourceController> _logger;

    public ExternalSourceController(
        ExternalSourceService service, 
        StationService stationService,
        IHttpClientFactory httpClientFactory,
        ILogger<ExternalSourceController> logger)
    {
        _service = service;
        _stationService = stationService;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var sources = await _service.GetAllAsync();
        return Ok(sources);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ExternalSource source)
    {
        // Validation
        if (string.IsNullOrWhiteSpace(source.Name))
        {
            return BadRequest(new { message = "Name is required" });
        }

        if (string.IsNullOrWhiteSpace(source.Url))
        {
            return BadRequest(new { message = "Url is required" });
        }

        // Auto-generate StationId from Name (user doesn't need to provide it)
        var slug = System.Text.RegularExpressions.Regex.Replace(
            source.Name.ToLowerInvariant().Trim(),
            @"[^a-z0-9-]",
            "-"
        ).Replace("--", "-").Trim('-');
        
        source.StationId = $"station-{slug}";

        // Check duplicate URL
        var existingByUrl = await _service.GetByUrlAsync(source.Url);
        if (existingByUrl != null)
        {
            return Conflict(new { 
                message = "URL đã tồn tại trong hệ thống", 
                existingSource = new {
                    id = existingByUrl.Id,
                    name = existingByUrl.Name,
                    stationId = existingByUrl.StationId,
                    isActive = existingByUrl.IsActive
                }
            });
        }
        
        // Check duplicate StationId
        if (await _service.ExistsByStationIdAsync(source.StationId))
        {
            return Conflict(new { message = $"StationId '{source.StationId}' đã tồn tại. Vui lòng chọn StationId khác." });
        }

        // All external sources must return NGSI-LD format (no mapping needed)
        var created = await _service.CreateAsync(source);

        // Auto-create Station immediately for visibility
        try 
        {
            // Reset checking if station exists, just try to get it first
            var existingStation = await _stationService.GetStationByIdAsync(source.StationId);
            if (existingStation == null)
            {
                var newStation = new Station
                {
                    StationId = source.StationId,
                    Name = source.Name,
                    Latitude = source.Latitude ?? 0,
                    Longitude = source.Longitude ?? 0,
                    Type = "external-http",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    Metadata = new Dictionary<string, object?>
                    {
                        ["sourceUrl"] = source.Url
                    }
                };
                await _stationService.CreateStationAsync(newStation);
                _logger.LogInformation("Auto-created station from external API source: {StationId}", source.StationId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to auto-create station for source {Id}", created.Id);
            // Non-blocking error, continue
        }

        return CreatedAtAction(nameof(GetAll), new { id = created.Id }, created);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }

    /// <summary>
    /// Reactivate a source that was auto-deactivated after failures
    /// </summary>
    [HttpPost("{id}/reactivate")]
    public async Task<IActionResult> Reactivate(string id)
    {
        await _service.ReactivateAsync(id);
        return Ok(new { message = "Source reactivated successfully", id });
    }

    [HttpPost("test")]
    public async Task<IActionResult> TestUrl([FromBody] TestUrlRequest request)
    {
        if (string.IsNullOrEmpty(request.Url))
        {
            return BadRequest("URL is required");
        }

        try
        {
            using var client = _httpClientFactory.CreateClient();
            
            // Add headers if present
            if (request.Headers != null)
            {
                foreach (var header in request.Headers)
                {
                    client.DefaultRequestHeaders.TryAddWithoutValidation(header.Key, header.Value);
                }
            }

            var response = await client.GetAsync(request.Url);
            
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, $"External API error: {response.StatusCode}");
            }
            
            var content = await response.Content.ReadAsStringAsync();
            
            // Parse JSON to validate and return as proper JSON response
            try
            {
                var jsonData = System.Text.Json.JsonSerializer.Deserialize<object>(content);
                return Ok(jsonData);
            }
            catch
            {
                // If not valid JSON, return as raw string wrapped in object
                return Ok(new { raw = content });
            }
        }
        catch (Exception ex)
        {
            return BadRequest($"Error fetching URL: {ex.Message}");
        }
    }
}

public class TestUrlRequest
{
    public required string Url { get; set; }
    public Dictionary<string, string>? Headers { get; set; }
}
