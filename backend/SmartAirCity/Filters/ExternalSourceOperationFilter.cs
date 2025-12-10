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

using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace SmartAirCity.Filters;

/// <summary>
/// Operation filter để thêm multiple examples cho ExternalSource Create endpoint
/// </summary>
public class ExternalSourceOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var descriptor = context.ApiDescription.ActionDescriptor as ControllerActionDescriptor;

        if (descriptor == null) return;

        // Chỉ áp dụng cho POST /api/sources (Create method)
        if (descriptor.ActionName == "Create" && descriptor.ControllerName == "ExternalSource")
        {
            if (operation.RequestBody?.Content != null && 
                operation.RequestBody.Content.TryGetValue("application/json", out var mediaType))
            {
                // Thêm examples cho RequestBody
                mediaType.Examples = new Dictionary<string, OpenApiExample>
                {
                    ["NGSI-LD Source"] = new OpenApiExample
                    {
                        Summary = "NGSI-LD Source (API returns proper NGSI-LD format)",
                        Description = "API returns proper NGSI-LD format, no mapping needed",
                        Value = new Microsoft.OpenApi.Any.OpenApiObject
                        {
                            ["name"] = new Microsoft.OpenApi.Any.OpenApiString("External Air Quality API"),
                            ["url"] = new Microsoft.OpenApi.Any.OpenApiString("https://api.example.com/airquality/data"),
                            ["stationId"] = new Microsoft.OpenApi.Any.OpenApiString("station-external"),
                            ["headers"] = new Microsoft.OpenApi.Any.OpenApiObject
                            {
                                ["X-API-Key"] = new Microsoft.OpenApi.Any.OpenApiString("your-api-key-here")
                            }
                        }
                    }
                };
            }
        }
    }
}

