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


using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using SmartAirCity.Models;

namespace SmartAirCity.Filters;

public class FileUploadOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var descriptor = context.ApiDescription.ActionDescriptor as ControllerActionDescriptor;
        
        if (descriptor == null) return;

        // Kiểm tra nếu action có parameter là FileUploadModel
        var hasFileUploadModel = context.MethodInfo.GetParameters()
            .Any(p => p.ParameterType == typeof(FileUploadModel));

        if (!hasFileUploadModel) return;

        // Xóa các parameters cũ (nếu có)
        operation.Parameters?.Clear();

        operation.RequestBody = new OpenApiRequestBody
        {
            Content =
            {
                ["multipart/form-data"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema
                    {
                        Type = "object",
                        Properties = new Dictionary<string, OpenApiSchema>
                        {
                            ["file"] = new OpenApiSchema
                            {
                                Type = "string",
                                Format = "binary",
                                Description = "JSON file chứa dữ liệu AirQuality theo chuẩn NGSI-LD"
                            }
                        },
                        Required = new HashSet<string> { "file" }
                    },
                    Encoding = new Dictionary<string, OpenApiEncoding>
                    {
                        ["file"] = new OpenApiEncoding
                        {
                            ContentType = "application/json"
                        }
                    }
                }
            }
        };

        // Thêm mô tả cho operation
        operation.Summary = "Upload JSON file chứa dữ liệu AirQuality";
        operation.Description = "Nhận file JSON theo chuẩn NGSI-LD, validate và lưu vào hệ thống";
    }
}