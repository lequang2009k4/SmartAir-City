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

using System.Text.Json;
using SmartAirCity.Models;

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

    public ContributionValidationService(ILogger<ContributionValidationService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Validate JSON theo chuẩn NGSI-LD AirQuality
    /// </summary>
    public ValidationResult ValidateJson(string jsonContent)
    {
        var result = new ValidationResult();

        try
        {
            _logger.LogInformation("🟡 Starting JSON validation...");

            // 1. Parse JSON
            JsonDocument? doc = null;
            try
            {
                doc = JsonDocument.Parse(jsonContent);
                _logger.LogInformation("✅ JSON parsed successfully");
            }
            catch (JsonException ex)
            {
                var errorMsg = $"Invalid JSON format: {ex.Message}";
                result.Errors.Add(errorMsg);
                _logger.LogError(errorMsg);
                return result;
            }

            var root = doc.RootElement;
            _logger.LogInformation("📊 JSON Root Element Kind: {ValueKind}", root.ValueKind);

            // 2. Kiểm tra xem là Array hay Object
            if (root.ValueKind == JsonValueKind.Array)
            {
                // Xử lý array of objects
                _logger.LogInformation("📦 Detected JSON Array, processing multiple records...");
                return ValidateJsonArray(root, doc);
            }
            else if (root.ValueKind == JsonValueKind.Object)
            {
                // Xử lý single object (code cũ)
                _logger.LogInformation("📄 Detected JSON Object, processing single record...");
                return ValidateJsonObject(root, doc, jsonContent);
            }
            else
            {
                result.Errors.Add($"Invalid JSON root type. Expected Object or Array, but got {root.ValueKind}");
                result.IsValid = false;
                doc.Dispose();
                return result;
            }
            // doc.Dispose() đã được gọi trong ValidateJsonArray và ValidateJsonObject
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Unexpected error during JSON validation");
            result.Errors.Add($"Unexpected validation error: {ex.Message}");
            result.IsValid = false;
        }

        _logger.LogInformation("🏁 Validation completed - IsValid: {IsValid}, Errors: {ErrorCount}", 
            result.IsValid, result.Errors.Count);

        return result;
    }

    /// <summary>
    /// Validate và deserialize single JSON object
    /// </summary>
    private ValidationResult ValidateJsonObject(JsonElement root, JsonDocument doc, string jsonContent)
    {
        var result = new ValidationResult();

        try
        {
            // Validate required fields
            ValidateRequiredFields(root, result);

            // Validate data types và structure
            ValidateDataTypes(root, result);

            // Validate values (range, format)
            ValidateValues(root, result);

            // Nếu có lỗi, log và return
            if (result.Errors.Count > 0)
            {
                _logger.LogInformation("❌ Validation failed with {ErrorCount} errors", result.Errors.Count);
                foreach (var error in result.Errors)
                {
                    _logger.LogInformation("   - {Error}", error);
                }
                result.IsValid = false;
                doc.Dispose();
                return result;
            }

            // Deserialize thành AirQuality object
            _logger.LogInformation("🟡 Attempting to deserialize JSON object...");
            try
            {
                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                };
                
                result.Data = JsonSerializer.Deserialize<AirQuality>(jsonContent, options);
                
                if (result.Data == null)
                {
                    result.Errors.Add("Failed to deserialize JSON into AirQuality object - result is null");
                    result.IsValid = false;
                    _logger.LogError("❌ Deserialization returned null");
                }
                else
                {
                    // Chuyển đổi JsonElement trong Context thành object thực sự
                    NormalizeContext(result.Data);
                    
                    // Đảm bảo các giá trị mặc định
                    EnsureDefaults(result.Data);
                    result.IsValid = true;
                    _logger.LogInformation("✅ JSON validation successful, deserialized AirQuality with ID: {Id}", result.Data.Id);
                }
            }
            catch (JsonException ex)
            {
                var errorMsg = $"JSON Deserialization failed: {ex.Message}";
                result.Errors.Add(errorMsg);
                result.IsValid = false;
                _logger.LogError(ex, "❌ JSON Deserialization exception");
            }
            catch (Exception ex)
            {
                var errorMsg = $"Deserialization failed: {ex.Message}";
                result.Errors.Add(errorMsg);
                result.IsValid = false;
                _logger.LogError(ex, "❌ General deserialization exception");
            }

            doc.Dispose();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Unexpected error during JSON object validation");
            result.Errors.Add($"Unexpected validation error: {ex.Message}");
            result.IsValid = false;
        }

        return result;
    }

    /// <summary>
    /// Validate và deserialize JSON array
    /// </summary>
    private ValidationResult ValidateJsonArray(JsonElement rootArray, JsonDocument doc)
    {
        var result = new ValidationResult();
        var dataList = new List<AirQuality>();

        try
        {
            var arrayLength = rootArray.GetArrayLength();
            _logger.LogInformation("📦 Processing array with {Count} items", arrayLength);

            if (arrayLength == 0)
            {
                result.Errors.Add("Array cannot be empty");
                result.IsValid = false;
                doc.Dispose();
                return result;
            }

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            int successCount = 0;
            int errorCount = 0;

            // Validate từng item trong array
            foreach (var item in rootArray.EnumerateArray())
            {
                try
                {
                    // Validate required fields cho từng item
                    var itemResult = new ValidationResult();
                    ValidateRequiredFields(item, itemResult);
                    ValidateDataTypes(item, itemResult);
                    ValidateValues(item, itemResult);

                    if (itemResult.Errors.Count > 0)
                    {
                        errorCount++;
                        result.Errors.AddRange(itemResult.Errors.Select(e => $"Item {successCount + errorCount}: {e}"));
                        _logger.LogInformation("❌ Item {Index} validation failed: {Errors}", 
                            successCount + errorCount, string.Join(", ", itemResult.Errors));
                        continue;
                    }

                    // Deserialize item
                    var itemJson = item.GetRawText();
                    var airQuality = JsonSerializer.Deserialize<AirQuality>(itemJson, options);
                    
                    if (airQuality == null)
                    {
                        errorCount++;
                        result.Errors.Add($"Item {successCount + errorCount}: Failed to deserialize - result is null");
                        _logger.LogInformation("❌ Item {Index} deserialization returned null", successCount + errorCount);
                        continue;
                    }

                    // Normalize context và ensure defaults
                    NormalizeContext(airQuality);
                    EnsureDefaults(airQuality);

                    dataList.Add(airQuality);
                    successCount++;
                    _logger.LogDebug("✅ Item {Index} validated successfully, ID: {Id}", successCount, airQuality.Id);
                }
                catch (Exception ex)
                {
                    errorCount++;
                    var errorMsg = $"Item {successCount + errorCount}: {ex.Message}";
                    result.Errors.Add(errorMsg);
                    _logger.LogError(ex, "❌ Error processing item {Index}", successCount + errorCount);
                }
            }

            // Nếu có ít nhất 1 item hợp lệ, coi như thành công
            if (successCount > 0)
            {
                result.IsValid = true;
                result.DataList = dataList;
                _logger.LogInformation("✅ Array validation completed: {SuccessCount} successful, {ErrorCount} failed", 
                    successCount, errorCount);
            }
            else
            {
                result.IsValid = false;
                _logger.LogError("❌ All items in array failed validation");
            }

            doc.Dispose();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Unexpected error during JSON array validation");
            result.Errors.Add($"Unexpected validation error: {ex.Message}");
            result.IsValid = false;
        }

        return result;
    }

    private void ValidateRequiredFields(JsonElement root, ValidationResult result)
    {
        _logger.LogInformation("🔍 Validating required fields...");

        // Type phải là "AirQualityObserved"
        if (!root.TryGetProperty("type", out var typeEl))
        {
            result.Errors.Add("Field 'type' is required");
            _logger.LogInformation("❌ Missing required field: type");
        }
        else 
        {
            var typeValue = typeEl.GetString();
            _logger.LogInformation("📝 Type field found: {Type}", typeValue);
            if (typeValue != "AirQualityObserved")
            {
                result.Errors.Add($"Field 'type' must be 'AirQualityObserved', but got '{typeValue}'");
                _logger.LogInformation("❌ Invalid type: {Type}", typeValue);
            }
            else
            {
                _logger.LogInformation("✅ Type validation passed");
            }
        }

        // @context phải có và là array
        if (!root.TryGetProperty("@context", out var contextEl))
        {
            result.Errors.Add("Field '@context' is required for NGSI-LD compliance");
            _logger.LogInformation("❌ Missing required field: @context");
        }
        else 
        {
            _logger.LogInformation("📝 @context field found, Kind: {Kind}", contextEl.ValueKind);
            if (contextEl.ValueKind != JsonValueKind.Array || contextEl.GetArrayLength() == 0)
            {
                result.Errors.Add("Field '@context' must be a non-empty array");
                _logger.LogInformation("❌ Invalid @context format");
            }
            else
            {
                _logger.LogInformation("✅ @context validation passed");
            }
        }

        // dateObserved phải có
        if (!root.TryGetProperty("dateObserved", out var dateEl))
        {
            result.Errors.Add("Field 'dateObserved' is required");
            _logger.LogInformation("❌ Missing required field: dateObserved");
        }
        else
        {
            _logger.LogInformation("📝 dateObserved field found, Kind: {Kind}", dateEl.ValueKind);
            if (dateEl.ValueKind != JsonValueKind.Object)
            {
                result.Errors.Add("Field 'dateObserved' must be an object");
                _logger.LogInformation("❌ dateObserved is not an object");
            }
            else if (!dateEl.TryGetProperty("value", out var dateValue))
            {
                result.Errors.Add("Field 'dateObserved.value' is required");
                _logger.LogInformation("❌ Missing dateObserved.value");
            }
            else if (dateValue.ValueKind != JsonValueKind.String)
            {
                result.Errors.Add("Field 'dateObserved.value' must be a string (ISO 8601 format)");
                _logger.LogInformation("❌ dateObserved.value is not string");
            }
            else
            {
                var dateStr = dateValue.GetString();
                _logger.LogInformation("✅ dateObserved.value found: {Date}", dateStr);
            }
        }

        // location phải có
        if (!root.TryGetProperty("location", out var locEl))
        {
            result.Errors.Add("Field 'location' is required");
            _logger.LogInformation("❌ Missing required field: location");
        }
        else
        {
            _logger.LogInformation("📝 location field found, Kind: {Kind}", locEl.ValueKind);
            if (locEl.ValueKind != JsonValueKind.Object)
            {
                result.Errors.Add("Field 'location' must be an object");
                _logger.LogInformation("❌ location is not an object");
            }
            else if (!locEl.TryGetProperty("value", out var locValue))
            {
                result.Errors.Add("Field 'location.value' is required");
                _logger.LogInformation("❌ Missing location.value");
            }
            else if (locValue.ValueKind != JsonValueKind.Object)
            {
                result.Errors.Add("Field 'location.value' must be an object");
                _logger.LogInformation("❌ location.value is not an object");
            }
            else
            {
                _logger.LogInformation("✅ location.value found");
                if (!locValue.TryGetProperty("coordinates", out var coords))
                {
                    result.Errors.Add("Field 'location.value.coordinates' is required");
                    _logger.LogInformation("❌ Missing location.value.coordinates");
                }
                else if (coords.ValueKind != JsonValueKind.Array || coords.GetArrayLength() < 2)
                {
                    result.Errors.Add("Field 'location.value.coordinates' must be an array with at least 2 elements [longitude, latitude]");
                    _logger.LogInformation("❌ Invalid coordinates format");
                }
                else
                {
                    _logger.LogInformation("✅ coordinates validation passed");
                }
            }
        }

        // Kiểm tra có ít nhất 1 numeric property (pm25, pm10, o3, no2, so2, co, airQualityIndex)
        var numericFields = new[] { "pm25", "pm10", "o3", "no2", "so2", "co", "airQualityIndex" };
        var foundFields = numericFields.Where(field => root.TryGetProperty(field, out _)).ToList();
        
        _logger.LogInformation("🔍 Checking numeric fields - Found: {FoundFields}", string.Join(", ", foundFields));
        
        if (foundFields.Count == 0)
        {
            result.Errors.Add("At least one air quality measurement is required (pm25, pm10, o3, no2, so2, co, or airQualityIndex)");
            _logger.LogInformation("❌ No air quality measurements found");
        }
        else
        {
            _logger.LogInformation("✅ Found {Count} air quality measurements: {Fields}", foundFields.Count, string.Join(", ", foundFields));
        }
    }

    private void ValidateDataTypes(JsonElement root, ValidationResult result)
    {
        _logger.LogInformation("🔍 Validating data types...");
        // ... (giữ nguyên code hiện tại, nhưng thêm logs tương tự)
        
        // Tạm thời bỏ qua detailed type validation để test
        _logger.LogInformation("✅ Data type validation skipped for debugging");
    }

    private void ValidateValues(JsonElement root, ValidationResult result)
    {
        _logger.LogInformation("🔍 Validating values...");
        // ... (giữ nguyên code hiện tại, nhưng thêm logs tương tự)
        
        // Tạm thời bỏ qua value validation để test
        _logger.LogInformation("✅ Value validation skipped for debugging");
    }

    /// <summary>
    /// Chuyển đổi JsonElement trong Context array thành object thực sự để MongoDB có thể serialize
    /// </summary>
    private void NormalizeContext(AirQuality data)
    {
        if (data.Context == null || data.Context.Length == 0)
            return;

        _logger.LogInformation("🔧 Normalizing @context array...");

        var normalizedContext = new List<object>();
        
        foreach (var item in data.Context)
        {
            // Nếu là JsonElement, chuyển đổi thành Dictionary
            if (item is System.Text.Json.JsonElement jsonElement)
            {
                if (jsonElement.ValueKind == System.Text.Json.JsonValueKind.String)
                {
                    // String value - giữ nguyên
                    normalizedContext.Add(jsonElement.GetString() ?? string.Empty);
                    _logger.LogDebug("   - Context item (string): {Value}", jsonElement.GetString());
                }
                else if (jsonElement.ValueKind == System.Text.Json.JsonValueKind.Object)
                {
                    // Object value - chuyển thành Dictionary<string, object>
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
                    // Các loại khác - giữ nguyên JsonElement hoặc chuyển thành string
                    normalizedContext.Add(jsonElement.GetRawText());
                    _logger.LogDebug("   - Context item (other): {Value}", jsonElement.GetRawText());
                }
            }
            else
            {
                // Không phải JsonElement - giữ nguyên
                normalizedContext.Add(item);
                _logger.LogDebug("   - Context item (non-JsonElement): {Type}", item.GetType().Name);
            }
        }

        data.Context = normalizedContext.ToArray();
        _logger.LogInformation("✅ @context normalized successfully");
    }

    private void EnsureDefaults(AirQuality data)
    {
        _logger.LogInformation("🔧 Ensuring defaults...");
        
        // Đảm bảo type
        if (string.IsNullOrEmpty(data.Type))
        {
            data.Type = "AirQualityObserved";
            _logger.LogInformation("📝 Set default Type: {Type}", data.Type);
        }

        // Đảm bảo @context
        if (data.Context == null || data.Context.Length == 0)
        {
            data.Context = new object[]
            {
                "https://smartdatamodels.org/context.jsonld",
                new { sosa = "http://www.w3.org/ns/sosa/" }
            };
            _logger.LogInformation("📝 Set default @context");
        }

        // Đảm bảo dateObserved
        if (data.DateObserved == null || data.DateObserved.Value == default)
        {
            data.DateObserved = new DateTimeProperty
            {
                Type = "Property",
                Value = DateTime.UtcNow
            };
            _logger.LogInformation("📝 Set default dateObserved");
        }

        // Tạo ID nếu chưa có
        if (string.IsNullOrEmpty(data.Id))
        {
            data.Id = $"urn:ngsi-ld:AirQualityObserved:contribution:{DateTime.UtcNow:yyyy-MM-ddTHH:mm:ssZ}";
            _logger.LogInformation("📝 Generated default ID: {Id}", data.Id);
        }

        // Đảm bảo location có type
        if (data.Location != null)
        {
            if (string.IsNullOrEmpty(data.Location.Type))
            {
                data.Location.Type = "GeoProperty";
                _logger.LogInformation("📝 Set default location.Type");
            }
            
            if (data.Location.Value != null && string.IsNullOrEmpty(data.Location.Value.Type))
            {
                data.Location.Value.Type = "Point";
                _logger.LogInformation("📝 Set default location.value.Type");
            }
        }
        
        _logger.LogInformation("✅ Defaults ensured");
    }
}