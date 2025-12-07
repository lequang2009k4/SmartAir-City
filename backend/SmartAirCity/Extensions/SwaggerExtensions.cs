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
using SmartAirCity.Filters;

namespace SmartAirCity.Extensions;

/// <summary>
/// Extension methods for configuring Swagger/OpenAPI documentation
/// </summary>
public static class SwaggerExtensions
{
    /// <summary>
    /// Add Swagger documentation with SmartAir City configuration
    /// </summary>
    public static IServiceCollection AddSmartAirSwagger(this IServiceCollection services)
    {
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", GetApiInfo());

            // Add operation and schema filters
            c.OperationFilter<FileUploadOperationFilter>();
            c.OperationFilter<ExternalSourceOperationFilter>();
            c.SchemaFilter<TestUrlRequestSchemaFilter>();

            // Include XML comments for API documentation
            var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
            c.IncludeXmlComments(xmlPath);
        });

        return services;
    }

    private static OpenApiInfo GetApiInfo()
    {
        return new OpenApiInfo
        {
            Title = "SmartAir City - Open Environmental Data API",
            Version = "1.0.0",
            Description = GetApiDescription(),
            Contact = new OpenApiContact
            {
                Name = "SmartAir City Development Team",
                Email = "smartaircity@gmail.com",
                Url = new Uri("https://github.com/lequang2009k4/SmartAir-City")
            },
            License = new OpenApiLicense
            {
                Name = "Data: CC BY 4.0 | Code: MIT License",
                Url = new Uri("https://creativecommons.org/licenses/by/4.0/")
            }
        };
    }

    private static string GetApiDescription()
    {
        return @"
🌍 **Open API for Urban Air Quality Monitoring**

This API provides real-time and historical environmental data for urban air quality monitoring, including:

- 🌡️ **Air quality metrics** (PM2.5, PM10, CO, NO2, O3, SO2, temperature, humidity, etc.)
- 📍 **Monitoring stations** (IoT sensors, official stations, external data sources)
- 📈 **Historical time-series data** with flexible date range queries
- 👥 **Citizen contributions** for community-driven environmental monitoring
- 🔌 **External data integration** (HTTP APIs, MQTT brokers)

---

## 📊 Data Sources & Updates

- **Real-time IoT data**: Updated continuously via MQTT
- **OpenAQ Air Quality Data**: Integrated from OpenAQ API (https://openaq.org/)
- **External APIs**: Configurable polling intervals (default: 5 minutes)
- **Citizen contributions**: Community-uploaded environmental data
- **Storage**: MongoDB with NGSI-LD compliant data models

**Data Attribution:**
- Air quality data from OpenAQ is provided by OpenAQ (https://openaq.org/)
- OpenAQ aggregates data from government monitoring stations and research-grade sensors worldwide

---

## 🔓 Open Data License

### Data License
Data is released under **Creative Commons Attribution 4.0 International (CC BY 4.0)**

**You are free to:**
- ✅ **Share**: Copy and redistribute the data in any medium or format
- ✅ **Adapt**: Remix, transform, and build upon the data for any purpose, even commercially

**Under the following terms:**
- ⚠️ **Attribution**: You must give appropriate credit, provide a link to the license, and indicate if changes were made

### API Code License
API implementation © 2025 SmartAir City Team  
Licensed under **MIT License**

---

## 🌐 NGSI-LD Compliance

This API follows **ETSI NGSI-LD specification** and **FIWARE Smart Data Models** standards:

- **AirQualityObserved**: Air quality data model (FIWARE)
- **WeatherObserved**: Weather data model (FIWARE)
- **Device**: IoT sensor model (FIWARE)
- **Context**: NGSI-LD @context for semantic interoperability

---

## 📋 Available Endpoints

### Air Quality Data
- Latest observations for all stations or specific station
- Historical data with date range queries (ISO 8601)
- CSV/JSON export for data analysis

### Monitoring Stations
- Get list of all monitoring stations
- Filter by station type (iot, external)
- Station metadata (location, configuration)

### Citizen Contributions
- Upload environmental observations
- Track personal contributions
- Public contribution leaderboard

### External Data Sources
- Register external HTTP APIs (NGSI-LD compliant)
- Configure external MQTT brokers
- Manage data source intervals and status

---

## 🔗 Related Resources

- **OpenAQ**: https://openaq.org/ (Air quality data source)
- **FIWARE Smart Data Models**: https://smartdatamodels.org/
- **NGSI-LD Specification**: https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.08.01_60/gs_CIM009v010801p.pdf
";
    }
}
