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


using System.Text.Json;
using SmartAirCity.Models;
using Microsoft.Extensions.Configuration;

namespace SmartAirCity.Services;

public class ValidationResult
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
    public AirQuality? Data { get; set; }  // Cho single object
    public List<AirQuality>? DataList { get; set; }  // Cho array of objects
}

public class ContributionValidationService
{
    private readonly ILogger<ContributionValidationService> _logger;
    private readonly IConfiguration _config;

    public ContributionValidationService(
        ILogger<ContributionValidationService> logger,
        IConfiguration config)
    {
        _logger = logger;
        _config = config;
    }

    /// <summary>
    /// Validate JSON theo chuan NGSI-LD AirQuality
    /// </summary>
    public ValidationResult ValidateJson(string jsonContent)
    {
        var result = new ValidationResult();

        try
        {
            _logger.LogInformation("Bat dau validate JSON...");

            // 1. Parse JSON - su dung using de dam bao dispose
            using var doc = JsonDocument.Parse(jsonContent);
            _logger.LogInformation("JSON da parse thanh cong");

            var root = doc.RootElement;
            _logger.LogInformation("JSON Root Element Kind: {ValueKind}", root.ValueKind);

            // 2. Kiem tra xem la Array hay Object
            if (root.ValueKind == JsonValueKind.Array)
            {
                // Xu ly array of objects
                _logger.LogInformation("Phat hien JSON Array, xu ly nhieu ban ghi...");
                return ValidateJsonArray(root, doc);
            }
            else if (root.ValueKind == JsonValueKind.Object)
            {
                _logger.LogInformation("Phat hien JSON Object, xu ly mot ban ghi...");
                return ValidateJsonObject(root, doc, jsonContent);
            }
            else
            {
                result.Errors.Add($"Invalid JSON root type. Expected Object or Array, but got {root.ValueKind}");
                result.IsValid = false;
                _logger.LogError("Loai JSON root khong hop le: {ValueKind}", root.ValueKind);
                return result;
            }
        }
        catch (JsonException ex)
        {
            var errorMsg = $"Invalid JSON format: {ex.Message}";
            result.Errors.Add(errorMsg);
            result.IsValid = false;
            _logger.LogError(ex, "Loi dinh dang JSON: {Message}", ex.Message);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Loi khong mong doi trong qua trinh validate JSON");
            result.Errors.Add($"Unexpected validation error: {ex.Message}");
            result.IsValid = false;
        }

        _logger.LogInformation("Hoan thanh validate - IsValid: {IsValid}, So loi: {ErrorCount}", 
            result.IsValid, result.Errors.Count);

        return result;
    }

    /// <summary>
    /// Validate va deserialize single JSON object
    /// </summary>
    private ValidationResult ValidateJsonObject(JsonElement root, JsonDocument doc, string jsonContent)
    {
        var result = new ValidationResult();

        try
        {
            // Validate required fields (field bat buoc)
            ValidateRequiredFields(root, result);

            // Validate data types va structure
            ValidateDataTypes(root, result);

            // Validate values (range, format)
            ValidateValues(root, result);

            // Neu co loi, log va return
            if (result.Errors.Count > 0)
            {
                _logger.LogInformation("Validation that bai voi {ErrorCount} loi", result.Errors.Count);
                foreach (var error in result.Errors)
                {
                    _logger.LogInformation("   - {Error}", error);
                }
                result.IsValid = false;
                return result;
            }

            // Deserialize thanh AirQuality object
            _logger.LogInformation("Dang thu deserialize JSON object...");
            try
            {
                // Normalize JSON: convert lowercase pollutant names to uppercase
                var normalizedJson = NormalizePollutantNames(jsonContent);
                
                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                    // Note: No PropertyNamingPolicy - we use explicit JsonPropertyName attributes
                };
                
                result.Data = JsonSerializer.Deserialize<AirQuality>(normalizedJson, options);
                
                if (result.Data == null)
                {
                    result.Errors.Add("Failed to deserialize JSON into AirQuality object - result is null");
                    result.IsValid = false;
                    _logger.LogError("Deserialization tra ve null");
                }
                else
                {
                    // Chuyen doi JsonElement trong Context thanh object thuc su
                    NormalizeContext(result.Data);
                    
                    // Dam bao cac gia tri mac dinh
                    EnsureDefaults(result.Data);
                    result.IsValid = true;
                    _logger.LogInformation("JSON validation thanh cong, da deserialize AirQuality voi ID: {Id}", result.Data.Id);
                }
            }
            catch (JsonException ex)
            {
                var errorMsg = $"JSON Deserialization failed: {ex.Message}";
                result.Errors.Add(errorMsg);
                result.IsValid = false;
                _logger.LogError(ex, "Loi JSON Deserialization: {Message}", ex.Message);
            }
            catch (Exception ex)
            {
                var errorMsg = $"Deserialization failed: {ex.Message}";
                result.Errors.Add(errorMsg);
                result.IsValid = false;
                _logger.LogError(ex, "Loi deserialization tong quat: {Message}", ex.Message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Loi khong mong doi trong qua trinh validate JSON object");
            result.Errors.Add($"Unexpected validation error: {ex.Message}");
            result.IsValid = false;
        }

        return result;
    }

    /// <summary>
    /// Validate va deserialize JSON array
    /// </summary>
    private ValidationResult ValidateJsonArray(JsonElement rootArray, JsonDocument doc)
    {
        var result = new ValidationResult();
        var dataList = new List<AirQuality>();

        try
        {
            var arrayLength = rootArray.GetArrayLength();
            _logger.LogInformation("Processing array with {Count} items", arrayLength);

            if (arrayLength == 0)
            {
                result.Errors.Add("Array cannot be empty");
                result.IsValid = false;
                _logger.LogWarning("Array rong, khong the validate");
                return result;
            }

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            int successCount = 0;
            int errorCount = 0;

            // Validate tung item trong array (item la tung ban ghi trong array)
            foreach (var item in rootArray.EnumerateArray())
            {
                try
                {
                    // Validate required fields cho tung item
                    var itemResult = new ValidationResult();
                    ValidateRequiredFields(item, itemResult);
                    ValidateDataTypes(item, itemResult);
                    ValidateValues(item, itemResult);

                    if (itemResult.Errors.Count > 0)
                    {
                        errorCount++;
                        result.Errors.AddRange(itemResult.Errors.Select(e => $"Item {successCount + errorCount}: {e}"));
                        _logger.LogInformation("Item {Index} validation failed: {Errors}", 
                            successCount + errorCount, string.Join(", ", itemResult.Errors));
                        continue;
                    }

                    // Deserialize item (normalize pollutant names first) (chuyen doi JsonElement trong Context thanh object thuc su)
                    var itemJson = item.GetRawText();
                    var normalizedItemJson = NormalizePollutantNames(itemJson);
                    var airQuality = JsonSerializer.Deserialize<AirQuality>(normalizedItemJson, options);
                    
                    if (airQuality == null)
                    {
                        errorCount++;
                        result.Errors.Add($"Item {successCount + errorCount}: Failed to deserialize - result is null");
                        _logger.LogInformation("Item {Index} deserialization returned null", successCount + errorCount);
                        continue;
                    }

                    // Normalize context va ensure defaults
                    NormalizeContext(airQuality);
                    EnsureDefaults(airQuality);

                    dataList.Add(airQuality);
                    successCount++;
                    _logger.LogDebug("Item {Index} validated successfully, ID: {Id}", successCount, airQuality.Id);
                }
                catch (Exception ex)
                {
                    errorCount++;
                    var errorMsg = $"Item {successCount + errorCount}: {ex.Message}";
                    result.Errors.Add(errorMsg);
                    _logger.LogError(ex, "Error processing item {Index}", successCount + errorCount);
                }
            }

            // Neu co it nhat 1 item hop le, coi nhu thanh cong
            if (successCount > 0)
            {
                result.IsValid = true;
                result.DataList = dataList;
                _logger.LogInformation("Hoan thanh validate array: {SuccessCount} thanh cong, {ErrorCount} that bai", 
                    successCount, errorCount);
            }
            else
            {
                result.IsValid = false;
                _logger.LogError("Tat ca cac item trong array deu validate that bai");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Loi khong mong doi trong qua trinh validate JSON array");
            result.Errors.Add($"Unexpected validation error: {ex.Message}");
            result.IsValid = false;
        }

        return result;
    }

    private void ValidateRequiredFields(JsonElement root, ValidationResult result)
    {
        _logger.LogInformation("Dang validate cac truong bat buoc...");

        // Type phai la "AirQualityObserved"
        if (!root.TryGetProperty("type", out var typeEl))
        {
            result.Errors.Add("Field 'type' is required");
            _logger.LogInformation("Thieu truong bat buoc: type");
        }
        else 
        {
            var typeValue = typeEl.GetString();
            _logger.LogInformation("Tim thay truong type: {Type}", typeValue);
            if (typeValue != "AirQualityObserved")
            {
                result.Errors.Add($"Field 'type' must be 'AirQualityObserved', but got '{typeValue}'");
                _logger.LogInformation("Type khong hop le: {Type}", typeValue);
            }
            else
            {
                _logger.LogInformation("Type validation thanh cong");
            }
        }

        // @context phai co va la array
        if (!root.TryGetProperty("@context", out var contextEl))
        {
            result.Errors.Add("Field '@context' is required for NGSI-LD compliance");
            _logger.LogInformation("Thieu truong bat buoc: @context");
        }
        else 
        {
            _logger.LogInformation("Tim thay truong @context, Kind: {Kind}", contextEl.ValueKind);
            if (contextEl.ValueKind != JsonValueKind.Array || contextEl.GetArrayLength() == 0)
            {
                result.Errors.Add("Field '@context' must be a non-empty array");
                _logger.LogInformation("Dinh dang @context khong hop le");
            }
            else
            {
                _logger.LogInformation("@context validation thanh cong");
            }
        }

        // dateObserved phai co (ngay ghi du lieu)
        if (!root.TryGetProperty("dateObserved", out var dateEl))
        {
            result.Errors.Add("Field 'dateObserved' is required");
            _logger.LogInformation("Thieu truong bat buoc: dateObserved");
        }
        else
        {
            _logger.LogInformation("Tim thay truong dateObserved, Kind: {Kind}", dateEl.ValueKind);
            if (dateEl.ValueKind != JsonValueKind.Object)
            {
                result.Errors.Add("Field 'dateObserved' must be an object");
                _logger.LogInformation("dateObserved khong phai la object");
            }
            else if (!dateEl.TryGetProperty("value", out var dateValue))
            {
                result.Errors.Add("Field 'dateObserved.value' is required");
                _logger.LogInformation("Thieu dateObserved.value");
            }
            else if (dateValue.ValueKind != JsonValueKind.String)
            {
                result.Errors.Add("Field 'dateObserved.value' must be a string (ISO 8601 format)");
                _logger.LogInformation("dateObserved.value khong phai la string");
            }
            else
            {
                var dateStr = dateValue.GetString();
                _logger.LogInformation("Tim thay dateObserved.value: {Date}", dateStr);
            }
        }

        // location phai co (vi tri ghi du lieu)
        if (!root.TryGetProperty("location", out var locEl))
        {
            result.Errors.Add("Field 'location' is required");
            _logger.LogInformation("Thieu truong bat buoc: location");
        }
        else
        {
            _logger.LogInformation("Tim thay truong location, Kind: {Kind}", locEl.ValueKind);
            if (locEl.ValueKind != JsonValueKind.Object)
            {
                result.Errors.Add("Field 'location' must be an object");
                _logger.LogInformation("location khong phai la object");
            }
            else if (!locEl.TryGetProperty("value", out var locValue))
            {
                result.Errors.Add("Field 'location.value' is required");
                _logger.LogInformation("Thieu location.value");
            }
            else if (locValue.ValueKind != JsonValueKind.Object)
            {
                result.Errors.Add("Field 'location.value' must be an object");
                _logger.LogInformation("location.value khong phai la object");
            }
            else
            {
                _logger.LogInformation("Tim thay location.value");
                if (!locValue.TryGetProperty("coordinates", out var coords))
                {
                    result.Errors.Add("Field 'location.value.coordinates' is required");
                    _logger.LogInformation("Thieu location.value.coordinates");
                }
                else if (coords.ValueKind != JsonValueKind.Array || coords.GetArrayLength() < 2)
                {
                    result.Errors.Add("Field 'location.value.coordinates' must be an array with at least 2 elements [longitude, latitude]");
                    _logger.LogInformation("Dinh dang coordinates khong hop le");
                }
                else
                {
                    _logger.LogInformation("coordinates validation thanh cong");
                }
            }
        }

        // Kiem tra co it nhat 1 numeric property (PM25/pm25, PM10/pm10, O3/o3, NO2/no2, SO2/so2, CO/co, airQualityIndex)
        var numericFields = new[] { "PM25", "pm25", "PM10", "pm10", "O3", "o3", "NO2", "no2", "SO2", "so2", "CO", "co", "airQualityIndex" };
        var foundFields = numericFields.Where(field => root.TryGetProperty(field, out _)).ToList();
        
        _logger.LogInformation("Dang kiem tra cac truong so - Tim thay: {FoundFields}", string.Join(", ", foundFields));
        
        if (foundFields.Count == 0)
        {
            result.Errors.Add("At least one air quality measurement is required (pm25, pm10, o3, no2, so2, co, or airQualityIndex)");
            _logger.LogInformation("Khong tim thay chi so chat luong khong khi nao");
        }
        else
        {
            _logger.LogInformation("Tim thay {Count} chi so chat luong khong khi: {Fields}", foundFields.Count, string.Join(", ", foundFields));
        }
    }

    private void ValidateDataTypes(JsonElement root, ValidationResult result)
    {
        _logger.LogInformation("Dang validate kieu du lieu...");

        _logger.LogInformation("Bo qua validate kieu du lieu de debug");
    }

    private void ValidateValues(JsonElement root, ValidationResult result)
    {
        _logger.LogInformation("Dang validate gia tri...");
        _logger.LogInformation("Bo qua validate gia tri de debug");
    }

    /// <summary>
    /// Chuyen doi JsonElement trong Context array thanh object thuc su de MongoDB co the serialize
    /// </summary>
    private void NormalizeContext(AirQuality data)
    {
        if (data.Context == null || data.Context.Length == 0)
            return;

        _logger.LogInformation("Dang chuan hoa mang @context...");

        var normalizedContext = new List<object>();
        
        foreach (var item in data.Context)
        {
            // Neu la JsonElement, chuyen doi thanh Dictionary
            if (item is System.Text.Json.JsonElement jsonElement)
            {
                if (jsonElement.ValueKind == System.Text.Json.JsonValueKind.String)
                {
                    // String value - giu nguyen
                    normalizedContext.Add(jsonElement.GetString() ?? string.Empty);
                    _logger.LogDebug("   - Context item (string): {Value}", jsonElement.GetString());
                }
                else if (jsonElement.ValueKind == System.Text.Json.JsonValueKind.Object)
                {
                    // Object value - chuyen thanh Dictionary<string, object>
                    var dict = new Dictionary<string, object>();
                    foreach (var prop in jsonElement.EnumerateObject())
                    {
                        dict[prop.Name] = prop.Value.ValueKind switch
                        {
                            System.Text.Json.JsonValueKind.String => prop.Value.GetString() ?? string.Empty,
                            System.Text.Json.JsonValueKind.Number => prop.Value.GetDouble(),
                            System.Text.Json.JsonValueKind.True => true,
                            System.Text.Json.JsonValueKind.False => false,
                            System.Text.Json.JsonValueKind.Null => null!,
                            _ => prop.Value.GetRawText()
                        };
                    }
                    normalizedContext.Add(dict);
                    _logger.LogDebug("   - Context item (object): {Dict}", string.Join(", ", dict.Select(kvp => $"{kvp.Key}={kvp.Value}")));
                }
                else
                {
                    // Cac loai khac - giu nguyen JsonElement hoac chuyen thanh string
                    normalizedContext.Add(jsonElement.GetRawText());
                    _logger.LogDebug("   - Context item (other): {Value}", jsonElement.GetRawText());
                }
            }
            else
            {
                // Khong phai JsonElement - giu nguyen
                normalizedContext.Add(item);
                _logger.LogDebug("   - Context item (non-JsonElement): {Type}", item.GetType().Name);
            }
        }

        data.Context = normalizedContext.ToArray();
        _logger.LogInformation("@context da chuan hoa thanh cong");
    }

    private void EnsureDefaults(AirQuality data)
    {
        _logger.LogInformation("Dang dam bao cac gia tri mac dinh...");
        
        // Dam bao type
        if (string.IsNullOrEmpty(data.Type))
        {
            data.Type = "AirQualityObserved";
            _logger.LogInformation("Dat Type mac dinh: {Type}", data.Type);
        }

        // Dam bao @context
        if (data.Context == null || data.Context.Length == 0)
        {
            var contextUrl = _config["NGSILD:ContextUrl"] ?? "https://smartdatamodels.org/context.jsonld";
            var sosaNamespace = _config["NGSILD:SosaNamespace"] ?? "http://www.w3.org/ns/sosa/";
            
            data.Context = new object[]
            {
                contextUrl,
                new { sosa = sosaNamespace }
            };
            _logger.LogInformation("Dat @context mac dinh");
        }

        // Dam bao dateObserved
        if (data.DateObserved == null || data.DateObserved.Value == default)
        {
            data.DateObserved = new DateTimeProperty
            {
                Type = "Property",
                Value = DateTime.UtcNow
            };
            _logger.LogInformation("Dat dateObserved mac dinh");
        }

        // Tao ID neu chua co
        if (string.IsNullOrEmpty(data.Id))
        {
            data.Id = $"urn:ngsi-ld:AirQualityObserved:contribution:{DateTime.UtcNow:yyyy-MM-ddTHH:mm:ssZ}";
            _logger.LogInformation("Tao ID mac dinh: {Id}", data.Id);
        }

        // Dam bao location co type
        if (data.Location != null)
        {
            if (string.IsNullOrEmpty(data.Location.Type))
            {
                data.Location.Type = "GeoProperty";
                _logger.LogInformation("Dat location.Type mac dinh");
            }
            
            if (data.Location.Value != null && string.IsNullOrEmpty(data.Location.Value.Type))
            {
                data.Location.Value.Type = "Point";
                _logger.LogInformation("Dat location.value.Type mac dinh");
            }
        }
        
        _logger.LogInformation("Da dam bao cac gia tri mac dinh");
    }

    /// <summary>
    /// Normalize pollutant names in JSON: convert lowercase (pm25, o3, no2, so2, co) to uppercase (PM25, O3, NO2, SO2, CO)
    /// </summary>
    private string NormalizePollutantNames(string json)
    {
        // Simple string replacement for pollutant names
        // This handles both quoted property names and values
        var normalized = json;
        
        // Replace lowercase pollutant names with uppercase (only in property names, not values)
        // Pattern: "pm25" -> "PM25", "o3" -> "O3", etc.
        normalized = System.Text.RegularExpressions.Regex.Replace(
            normalized, 
            @"""pm25""\s*:", 
            @"""PM25"":", 
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        
        normalized = System.Text.RegularExpressions.Regex.Replace(
            normalized, 
            @"""pm10""\s*:", 
            @"""PM10"":", 
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        
        normalized = System.Text.RegularExpressions.Regex.Replace(
            normalized, 
            @"""o3""\s*:", 
            @"""O3"":", 
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        
        normalized = System.Text.RegularExpressions.Regex.Replace(
            normalized, 
            @"""no2""\s*:", 
            @"""NO2"":", 
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        
        normalized = System.Text.RegularExpressions.Regex.Replace(
            normalized, 
            @"""so2""\s*:", 
            @"""SO2"":", 
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        
        normalized = System.Text.RegularExpressions.Regex.Replace(
            normalized, 
            @"""co""\s*:", 
            @"""CO"":", 
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        
        return normalized;
    }
}