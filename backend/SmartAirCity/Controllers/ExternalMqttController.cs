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
using MQTTnet;
using MQTTnet.Client;

namespace SmartAirCity.Controllers;

[ApiController]
[Route("api/mqtt")]
public class ExternalMqttController : ControllerBase
{
    private readonly ExternalMqttSourceService _service;
    private readonly ILogger<ExternalMqttController> _logger;

    public ExternalMqttController(
        ExternalMqttSourceService service,
        ILogger<ExternalMqttController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/mqtt/sources - Lấy danh sách tất cả external MQTT sources
    /// </summary>
    [HttpGet("sources")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var sources = await _service.GetAllAsync();
            return Ok(sources);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving external MQTT sources");
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/mqtt/sources/{id} - Lấy thông tin 1 source
    /// </summary>
    [HttpGet("sources/{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        try
        {
            var source = await _service.GetByIdAsync(id);
            if (source == null)
            {
                return NotFound(new { message = $"Source {id} not found" });
            }
            return Ok(source);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving source {Id}", id);
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    /// <summary>
    /// POST /api/mqtt/sources - Đăng ký MQTT broker mới
    /// </summary>
    [HttpPost("sources")]
    public async Task<IActionResult> Create([FromBody] ExternalMqttSource source)
    {
        try
        {
            // Validation
            if (string.IsNullOrWhiteSpace(source.Name))
            {
                return BadRequest(new { message = "Name is required" });
            }

            if (string.IsNullOrWhiteSpace(source.BrokerHost))
            {
                return BadRequest(new { message = "BrokerHost is required" });
            }

            if (string.IsNullOrWhiteSpace(source.Topic))
            {
                return BadRequest(new { message = "Topic is required" });
            }

            if (source.BrokerPort <= 0 || source.BrokerPort > 65535)
            {
                return BadRequest(new { message = "BrokerPort must be between 1 and 65535" });
            }

            if (source.Latitude < -90 || source.Latitude > 90)
            {
                return BadRequest(new { message = "Latitude must be between -90 and 90" });
            }

            if (source.Longitude < -180 || source.Longitude > 180)
            {
                return BadRequest(new { message = "Longitude must be between -180 and 180" });
            }

            // Auto-generate StationId from Name if not provided
            if (string.IsNullOrWhiteSpace(source.StationId))
            {
                // Convert name to lowercase, replace spaces with hyphens, remove special chars
                var baseName = System.Text.RegularExpressions.Regex.Replace(
                    source.Name.ToLowerInvariant().Trim(), 
                    @"[^a-z0-9-]", 
                    "-"
                ).Replace("--", "-").Trim('-');
                
                // Add timestamp to ensure uniqueness
                source.StationId = $"{baseName}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
            }

            var created = await _service.CreateAsync(source);
            
            _logger.LogInformation("Created external MQTT source: {Name} ({Id})", created.Name, created.Id);
            
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating external MQTT source");
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    /// <summary>
    /// PUT /api/mqtt/sources/{id} - Cập nhật source
    /// </summary>
    [HttpPut("sources/{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] ExternalMqttSource source)
    {
        try
        {
            var existing = await _service.GetByIdAsync(id);
            if (existing == null)
            {
                return NotFound(new { message = $"Source {id} not found" });
            }

            source.Id = id;
            source.CreatedAt = existing.CreatedAt;

            var updated = await _service.UpdateAsync(id, source);
            if (!updated)
            {
                return StatusCode(500, new { message = "Failed to update source" });
            }

            return Ok(source);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating source {Id}", id);
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    /// <summary>
    /// PATCH /api/mqtt/sources/{id}/openaq - Cập nhật OpenAQ LocationId cho source
    /// </summary>
    [HttpPatch("sources/{id}/openaq")]
    public async Task<IActionResult> UpdateOpenAQLocationId(string id, [FromBody] UpdateOpenAQRequest request)
    {
        try
        {
            var existing = await _service.GetByIdAsync(id);
            if (existing == null)
            {
                return NotFound(new { message = $"Source {id} not found" });
            }

            existing.OpenAQLocationId = request.OpenAQLocationId;
            var updated = await _service.UpdateAsync(id, existing);
            
            if (!updated)
            {
                return StatusCode(500, new { message = "Failed to update OpenAQ LocationId" });
            }

            _logger.LogInformation("Updated OpenAQLocationId for {Name} to {LocationId}", 
                existing.Name, request.OpenAQLocationId);

            return Ok(new { 
                message = "OpenAQ LocationId updated successfully",
                sourceId = id,
                sourceName = existing.Name,
                openAQLocationId = request.OpenAQLocationId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating OpenAQ LocationId for source {Id}", id);
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    /// <summary>
    /// DELETE /api/mqtt/sources/{id} - Xóa source
    /// </summary>
    [HttpDelete("sources/{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        try
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted)
            {
                return NotFound(new { message = $"Source {id} not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting source {Id}", id);
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    /// <summary>
    /// POST /api/mqtt/sources/test - Test connection đến MQTT broker
    /// </summary>
    [HttpPost("sources/test")]
    public async Task<IActionResult> TestConnection([FromBody] TestMqttConnectionRequest request)
    {
        try
        {
            var factory = new MqttFactory();
            var client = factory.CreateMqttClient();

            var optionsBuilder = new MqttClientOptionsBuilder()
                .WithTcpServer(request.BrokerHost, request.BrokerPort)
                .WithClientId($"smartaircity-test-{Guid.NewGuid()}")
                .WithTimeout(TimeSpan.FromSeconds(10));

            if (!string.IsNullOrEmpty(request.Username) && !string.IsNullOrEmpty(request.Password))
            {
                optionsBuilder.WithCredentials(request.Username, request.Password);
            }

            if (request.UseTls)
            {
                optionsBuilder.WithTlsOptions(o => o.UseTls());
            }

            var options = optionsBuilder.Build();

            var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
            
            try
            {
                var result = await client.ConnectAsync(options, cts.Token);

                if (result.ResultCode == MqttClientConnectResultCode.Success)
                {
                    await client.DisconnectAsync();
                    client.Dispose();

                    return Ok(new 
                    { 
                        success = true, 
                        message = "Connection successful",
                        broker = $"{request.BrokerHost}:{request.BrokerPort}"
                    });
                }
                else
                {
                    return BadRequest(new 
                    { 
                        success = false, 
                        message = $"Connection failed: {result.ResultCode}",
                        resultCode = result.ResultCode.ToString()
                    });
                }
            }
            catch (OperationCanceledException)
            {
                return BadRequest(new 
                { 
                    success = false, 
                    message = "Connection timeout (15 seconds)"
                });
            }
            finally
            {
                client?.Dispose();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing MQTT connection to {Host}:{Port}", 
                request.BrokerHost, request.BrokerPort);
            
            return BadRequest(new 
            { 
                success = false, 
                message = $"Connection test failed: {ex.Message}"
            });
        }
    }

    /// <summary>
    /// POST /api/mqtt/sources/{id}/activate - Kích hoạt source
    /// </summary>
    [HttpPost("sources/{id}/activate")]
    public async Task<IActionResult> Activate(string id)
    {
        try
        {
            var updated = await _service.SetActiveAsync(id, true);
            if (!updated)
            {
                return NotFound(new { message = $"Source {id} not found" });
            }

            return Ok(new { message = "Source activated" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating source {Id}", id);
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }

    /// <summary>
    /// POST /api/mqtt/sources/{id}/deactivate - Tắt source
    /// </summary>
    [HttpPost("sources/{id}/deactivate")]
    public async Task<IActionResult> Deactivate(string id)
    {
        try
        {
            var updated = await _service.SetActiveAsync(id, false);
            if (!updated)
            {
                return NotFound(new { message = $"Source {id} not found" });
            }

            return Ok(new { message = "Source deactivated" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating source {Id}", id);
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }
}

public class TestMqttConnectionRequest
{
    public string BrokerHost { get; set; } = string.Empty;
    public int BrokerPort { get; set; } = 1883;
    public string? Username { get; set; }
    public string? Password { get; set; }
    public bool UseTls { get; set; } = false;
}

public class UpdateOpenAQRequest
{
    public int? OpenAQLocationId { get; set; }
}
