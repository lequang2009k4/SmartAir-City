//  SPDX-License-Identifier: MIT
//  © 2025 SmartAir City Team
 
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.

using System.Text.Json;

namespace SmartAirCity.Services;

public class OpenAQLiveClient
{
    private readonly IHttpClientFactory _http;
    private readonly IConfiguration _config;
    private readonly ILogger<OpenAQLiveClient> _logger;

    public OpenAQLiveClient(
        IHttpClientFactory http,
        IConfiguration config,
        ILogger<OpenAQLiveClient> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
    }

    public async Task<(double? pm25, double? pm10, double? o3, double? no2, double? so2, double? co)?>
        GetNearestAsync(double lat, double lon, CancellationToken ct = default)
    {


        var client = _http.CreateClient();
        client.BaseAddress = new Uri("https://api.openaq.org/v3/");
        var apiKey = _config["OpenAQ:ApiKey"];
        if (!string.IsNullOrEmpty(apiKey))
            client.DefaultRequestHeaders.Add("X-API-Key", apiKey);

        // Dung co dinh tram co du lieu day du 
        int locationId = 4946811; // 556 Nguyen Van Cu – Hanoi
        var latestUrl = $"locations/{locationId}/latest";
        _logger.LogInformation("Fetching OpenAQ data for fixed locationId={LocationId}", locationId);


    
        var latestRes = await client.GetAsync(latestUrl, ct);
        
        if (!latestRes.IsSuccessStatusCode)
        {
            _logger.LogWarning("OpenAQ latest failed: {Status}", latestRes.StatusCode);
            return null;
        }

        var latestJson = await latestRes.Content.ReadAsStringAsync(ct);
        using var latestDoc = JsonDocument.Parse(latestJson);

        if (!latestDoc.RootElement.TryGetProperty("results", out var latestArr) ||
            latestArr.GetArrayLength() == 0)
        {
            _logger.LogWarning("No latest data from location {LocId}", locationId);
            return null;
        }

        // anh xa sensorsId -> parameter name (co dinh cho VN AQ tram 556 Nguyen Van Cu)
        var map = new Dictionary<int, string>
        {
            { 13502150, "pm25" },
            { 13502158, "co" },
            { 13502159, "no2" },
            { 13502160, "o3" },
            { 13502161, "so2" },
            { 13502165, "pm10" }
        };

        double? pm25 = null, pm10 = null, o3 = null, no2 = null, so2 = null, co = null;

        foreach (var it in latestArr.EnumerateArray())
        {
            try
            {
                var sid = it.GetProperty("sensorsId").GetInt32();
                var val = it.GetProperty("value").GetDouble();

                if (map.TryGetValue(sid, out var name))
                {
                    switch (name)
                    {
                        case "pm25": pm25 = val; break;
                        case "pm10": pm10 = val; break;
                        case "o3":   o3   = val; break;
                        case "no2":  no2  = val; break;
                        case "so2":  so2  = val; break;
                        case "co":   co   = val; break;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Loi khi doc 1 cam bien: {Msg}", ex.Message);
            }
        }

        _logger.LogInformation(
            "OpenAQ values -> PM2.5:{Pm25}, PM10:{Pm10}, O3:{O3}, NO2:{No2}, SO2:{So2}, CO:{Co}",
            pm25, pm10, o3, no2, so2, co);

        return (pm25, pm10, o3, no2, so2, co);
    }
}
