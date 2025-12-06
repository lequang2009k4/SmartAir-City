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


using System.Net;
using System.Text.Json;

namespace SmartAirCity.Services;

public class UserDirectoryClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<UserDirectoryClient> _logger;
    private readonly JsonSerializerOptions _serializerOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public UserDirectoryClient(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<UserDirectoryClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        // Doc cau hinh tu appsettings.json - khong hardcode
        var baseUrl = configuration["SmartCityCore:BaseUrl"];
        if (string.IsNullOrEmpty(baseUrl))
        {
            var errorMsg = "Cau hinh SmartCityCore:BaseUrl khong duoc tim thay trong appsettings.json. Vui long cau hinh trong appsettings.json";
            _logger.LogError(errorMsg);
            throw new InvalidOperationException(errorMsg);
        }
        
        if (!Uri.TryCreate(baseUrl, UriKind.Absolute, out var baseUri))
        {
            var errorMsg = $"Gia tri SmartCityCore:BaseUrl khong hop le: '{baseUrl}'. Phai la mot URL hop le";
            _logger.LogError(errorMsg);
            throw new InvalidOperationException(errorMsg);
        }

        _httpClient.BaseAddress = baseUri;
        _logger.LogInformation("UserDirectoryClient da cau hinh voi BaseAddress: {BaseUrl}", baseUrl);
    }

    public async Task<UserDirectoryUser?> GetByEmailAsync(string email, CancellationToken ct = default)
    {
        var encodedEmail = Uri.EscapeDataString(email);
        var requestUri = $"/api/users/by-email?email={encodedEmail}";

        try
        {
            var response = await _httpClient.GetAsync(requestUri, ct);

            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                _logger.LogWarning("User not found with email: {Email}", email);
                return null;
            }

            response.EnsureSuccessStatusCode();

            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            var user = await JsonSerializer.DeserializeAsync<UserDirectoryUser>(stream, _serializerOptions, ct);

            if (user == null)
            {
                _logger.LogWarning("Failed to deserialize user info for email: {Email}", email);
            }

            return user;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user by email: {Email}", email);
            throw;
        }
    }

    public async Task<UserDirectoryUser?> GetByIdAsync(string userId, CancellationToken ct = default)
    {
        var requestUri = $"/api/users/{userId}";

        try
        {
            var response = await _httpClient.GetAsync(requestUri, ct);

            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                _logger.LogWarning("User not found with userId: {UserId}", userId);
                return null;
            }

            response.EnsureSuccessStatusCode();

            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            var user = await JsonSerializer.DeserializeAsync<UserDirectoryUser>(stream, _serializerOptions, ct);

            if (user == null)
            {
                _logger.LogWarning("Failed to deserialize user info for userId: {UserId}", userId);
            }

            return user;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user by userId: {UserId}", userId);
            throw;
        }
    }
}

public class UserDirectoryUser
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Role { get; set; }
}

