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

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace SmartAirCity.Filters;

public class FileUploadOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var descriptor = context.ApiDescription.ActionDescriptor as ControllerActionDescriptor;

        if (descriptor == null) return;

        // Kiem tra neu action la UploadContribution
        if (descriptor.ActionName == "UploadContribution" && descriptor.ControllerName == "Contribution")
        {
            // Xoa parameters cu
            operation.Parameters?.Clear();

            var schema = new OpenApiSchema
            {
                Type = "object",
                Properties = new Dictionary<string, OpenApiSchema>
                {
                    ["file"] = new OpenApiSchema
                    {
                        Type = "string",
                        Format = "binary",
                        Description = "JSON file chua du lieu AirQuality theo chuan NGSI-LD"
                    },
                    ["email"] = new OpenApiSchema
                    {
                        Type = "string",
                        Description = "Email cua nguoi dong gop de tra cuu userId"
                    }
                },
                Required = new HashSet<string> { "file", "email" }
            };

            operation.RequestBody = new OpenApiRequestBody
            {
                Content =
                {
                    ["multipart/form-data"] = new OpenApiMediaType
                    {
                        Schema = schema
                    }
                }
            };

            operation.Summary = "Upload JSON file chua du lieu AirQuality";
            operation.Description = "Nhan file JSON theo chuan NGSI-LD, validate va luu vao he thong";
        }
    }
}