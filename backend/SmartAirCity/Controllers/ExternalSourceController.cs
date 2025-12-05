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
    private readonly IHttpClientFactory _httpClientFactory;

    public ExternalSourceController(ExternalSourceService service, IHttpClientFactory httpClientFactory)
    {
        _service = service;
        _httpClientFactory = httpClientFactory;
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

        if (string.IsNullOrWhiteSpace(source.StationId))
        {
            return BadRequest(new { message = "StationId is required" });
        }

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

        // Validate mapping for non-NGSI-LD sources
        if (!source.IsNGSILD)
        {
            if (source.Mapping == null || source.Mapping.FieldMappings == null || source.Mapping.FieldMappings.Count == 0)
            {
                return BadRequest(new { message = "Mapping.FieldMappings is required for non-NGSI-LD sources. Set IsNGSILD=true if API returns NGSI-LD format." });
            }
        }
        else
        {
            // For NGSI-LD sources, mapping is not needed
            source.Mapping = null;
        }

        var created = await _service.CreateAsync(source);
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
