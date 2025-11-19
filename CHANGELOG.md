# Changelog

All notable changes to SmartAir City will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-11-06

Initial release of SmartAir City - a real-time air quality monitoring platform.

### Added

**Backend**
- ASP.NET Core 8.0 REST API with Swagger documentation
- MongoDB database with NGSI-LD data model
- OpenAQ API integration for real-time air quality data
- IoT data ingestion endpoint (POST /api/iot-data)
- Air quality data retrieval endpoints:
  - GET /api/airquality - retrieve all records
  - GET /api/airquality/latest - get latest measurement
  - GET /api/airquality/history - query by time range
- Background service for periodic OpenAQ data synchronization
- Support for PM2.5, PM10, O3, NO2, SO2, CO measurements
- Data normalization service for IoT payloads
- Configurable MongoDB and OpenAQ API settings

**Frontend**
- React 19.2.0 web application
- Interactive dashboard with real-time air quality monitoring
- Map visualization using Leaflet.js
- Data charts and analytics using Chart.js
- Features:
  - Station search and filtering
  - Time-series trend analysis
  - Station comparison charts
  - Statistics cards for key metrics
  - Alert banners for air quality warnings
  - Dark mode support
  - CSV and JSON data export
  - Auto-refresh capability
  - Responsive design for mobile and desktop

**Documentation**
- Comprehensive README with installation guide
- Contributing guidelines
- MIT License
- API endpoint documentation

**Technical Stack**
- Backend: .NET 8.0, MongoDB 3.5.0, Swashbuckle 6.6.2
- Frontend: React 19.2.0, Leaflet 1.9.4, Chart.js 4.5.1, Axios 1.13.1

### Known Limitations

- OpenAQ API key required for full functionality
- No authentication or authorization implemented
- MongoDB must be accessible via connection string
- Limited error recovery mechanisms

[0.1.0]: https://github.com/lequang2009k4/SmartAir-City/releases/tag/v0.1.0
