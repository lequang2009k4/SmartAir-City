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

using Microsoft.AspNetCore.SignalR;

namespace SmartAirCity.Hubs;

/// <summary>
/// SignalR Hub de push realtime air quality data toi frontend
/// </summary>
public class AirQualityHub : Hub
{
    private readonly ILogger<AirQualityHub> _logger;

    public AirQualityHub(ILogger<AirQualityHub> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Duoc goi khi client ket noi
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var connectionId = Context.ConnectionId;
        var userAgent = Context.GetHttpContext()?.Request.Headers["User-Agent"].ToString();
        
        _logger.LogInformation("SignalR client connected: {ConnectionId} | UserAgent: {UserAgent}", 
            connectionId, userAgent);
        
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Duoc goi khi client ngat ket noi
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var connectionId = Context.ConnectionId;
        
        if (exception != null)
        {
            _logger.LogWarning(exception, "SignalR client disconnected with error: {ConnectionId}", connectionId);
        }
        else
        {
            _logger.LogInformation("SignalR client disconnected: {ConnectionId}", connectionId);
        }
        
        await base.OnDisconnectedAsync(exception);
    }
}