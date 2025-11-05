//  SPDX-License-Identifier: MIT
//  © 2025 SmartAir City Team
 
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
using Microsoft.Extensions.Hosting;
using System.Text.Json;
using SmartAirCity.Data;
using SmartAirCity.Models;

namespace SmartAirCity.Services;

public class OpenAQService : BackgroundService
{
    private readonly IHttpClientFactory _http;
    private readonly IServiceScopeFactory _scope;
    private readonly IConfiguration _config;
    private readonly ILogger<OpenAQService> _logger;

    public OpenAQService(
        IHttpClientFactory http,
        IServiceScopeFactory scope,
        IConfiguration config,
        ILogger<OpenAQService> logger)
    {
        _http = http;
        _scope = scope;
        _config = config;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await FetchOpenAQAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Lỗi khi lấy dữ liệu từ OpenAQ");
            }

            await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
        }
    }

    private async Task FetchOpenAQAsync(CancellationToken ct)
    {
        using var scope = _scope.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MongoDbContext>();

        var client = _http.CreateClient();
        client.BaseAddress = new Uri("https://api.openaq.org/v3/");
        var apiKey = _config["OpenAQ:ApiKey"];
        if (!string.IsNullOrEmpty(apiKey))
            client.DefaultRequestHeaders.Add("X-API-Key", apiKey);

        var url = "locations/7441/latest";
        _logger.LogInformation("🌍 Fetching OpenAQ data from: {Url}", url);

        var response = await client.GetAsync(url, ct);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("⚠️ OpenAQ trả về lỗi: {StatusCode}", response.StatusCode);
            return;
        }

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        if (!doc.RootElement.TryGetProperty("results", out var arr) || arr.GetArrayLength() == 0)
        {
            _logger.LogInformation("ℹ️ Không có dữ liệu mới từ location 7441");
            return;
        }

        int saved = 0;
        foreach (var item in arr.EnumerateArray())
        {
            // v3 trả: datetime, value, coordinates{lat,lon}, sensorsId, locationsId
            var dt = DateTime.UtcNow;
            if (item.TryGetProperty("datetime", out var dtEl) && dtEl.TryGetProperty("utc", out var utcEl))
                dt = utcEl.GetDateTime();

            double lon = 0, lat = 0;
            if (item.TryGetProperty("coordinates", out var cEl))
            {
                if (cEl.TryGetProperty("longitude", out var lo)) lon = lo.GetDouble();
                if (cEl.TryGetProperty("latitude", out var la)) lat = la.GetDouble();
            }

            var value = item.TryGetProperty("value", out var vEl) ? vEl.GetDouble() : (double?)null;

            var entity = new AirQuality
            {
                Id = $"urn:ngsi-ld:AirQualityObserved:OpenAQ-7441-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}",
                Location = new LocationProperty
                {
                    Value = new GeoValue { Coordinates = new[] { lon, lat } }
                },
               DateObserved = new DateTimeProperty { Value = dt },

                Pm25 = value.HasValue ? new NumericProperty { Value = value, UnitCode = "µg/m³", ObservedAt = dt } : null
            };

            await db.AirQuality.InsertOneAsync(entity, cancellationToken: ct);
            saved++;
        }

        _logger.LogInformation("✅ Đã lưu {Count} bản ghi OpenAQ (location 7441).", saved);
    }
}
