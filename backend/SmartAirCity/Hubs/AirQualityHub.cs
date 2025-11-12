//  SPDX-License-Identifier: MIT
//  © 2025 SmartAir City Team
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
using Microsoft.AspNetCore.SignalR;

namespace SmartAirCity.Hubs;

/// <summary>
/// SignalR Hub để push realtime air quality data tới frontend
/// </summary>
public class AirQualityHub : Hub
{
    private readonly ILogger<AirQualityHub> _logger;

    public AirQualityHub(ILogger<AirQualityHub> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Được gọi khi client kết nối
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var connectionId = Context.ConnectionId;
        var userAgent = Context.GetHttpContext()?.Request.Headers["User-Agent"].ToString();
        
        _logger.LogInformation("✅ SignalR client connected: {ConnectionId} | UserAgent: {UserAgent}", 
            connectionId, userAgent);
        
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Được gọi khi client ngắt kết nối
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var connectionId = Context.ConnectionId;
        
        if (exception != null)
        {
            _logger.LogWarning(exception, "⚠️ SignalR client disconnected with error: {ConnectionId}", connectionId);
        }
        else
        {
            _logger.LogInformation("❌ SignalR client disconnected: {ConnectionId}", connectionId);
        }
        
        await base.OnDisconnectedAsync(exception);
    }
}