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

using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using SmartAirCity.Controllers;

namespace SmartAirCity.Filters;

/// <summary>
/// Schema filter để Swagger hiển thị example tốt hơn cho TestUrlRequest
/// </summary>
public class TestUrlRequestSchemaFilter : ISchemaFilter
{
    public void Apply(OpenApiSchema schema, SchemaFilterContext context)
    {
        if (context.Type == typeof(TestUrlRequest))
        {
            // Set example cho toàn bộ request (dùng placeholder cho API key và URL - không để lộ thông tin thật)
            schema.Example = new Microsoft.OpenApi.Any.OpenApiObject
            {
                ["url"] = new Microsoft.OpenApi.Any.OpenApiString("https://api.example.com/airquality/data"),
                ["headers"] = new Microsoft.OpenApi.Any.OpenApiObject
                {
                    ["X-API-Key"] = new Microsoft.OpenApi.Any.OpenApiString("your-api-key-here")
                }
            };
            
            // Override schema cho Headers property để hiển thị example thay vì additionalProp
            if (schema.Properties != null && schema.Properties.ContainsKey("headers"))
            {
                var headersSchema = schema.Properties["headers"];
                headersSchema.Example = new Microsoft.OpenApi.Any.OpenApiObject
                {
                    ["X-API-Key"] = new Microsoft.OpenApi.Any.OpenApiString("your-api-key-here")
                };
            }
        }
    }
}

