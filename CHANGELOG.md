# Changelog

All notable changes to SmartAir City will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2025-12-08

### Added
- Enhanced OpenAQ API integration with `OpenAQLiveClient` for improved real-time data retrieval
- Comprehensive About page redesign with project information, goals, and technology stack
- CONTRIBUTING.md with detailed contribution guidelines, PR process, and development setup
- SPDX license headers across all source files for clear licensing compliance
- Community data contribution framework establishing open data repository principles
- API key authentication support for OpenAQ API v3
- Feature cards in UI showcasing platform capabilities (Real-time Monitoring, Data Analysis, Smart Alerts, Open Standards)

### Changed
- Improved OpenAQLiveClient with robust error handling and data validation
- Enhanced About component with modern card-based layout and improved visual hierarchy
- Updated Footer and Header components with better navigation structure
- Refined APIDataViewer for professional NGSI-LD format presentation
- Optimized HTTP client factory usage for external API requests

### Fixed
- Corrected OpenAQ API endpoint URL formatting and response parsing
- Resolved UI styling inconsistencies across components
- Improved error handling for failed API requests with better logging

## [0.1.1] - 2025-11-22

### Added
  - Implemented production API integration and replaced mock data by real API calls (Axios configuration + service replacements)
  - Added realtime updates support (websocket / SignalR) for live air quality push updates
  - Admin UI and device management UI added (Device form, Device list, Device card components)
  - Local storage support for analysis and user preferences
  - New custom React hook `useLeafletMap.js` and Map improvements
  - Admin and user authentication UI added (admin login, user login + role-aware UI)
  - Incorporated API-driven resource (replacing previous MSW mocks) for device and user management flows
  - Added SignalR hub for realtime data push (`AirQualityHub`)
  - Added `MqttSubscriberService` to ingest IoT messages via MQTT
  - Added coreBackend API and background services for OpenAQ/live ingestion and data normalization
  - Device and User API endpoints added/finished
  - Support for improved NGSI-LD ID generation
  - Dockerfile and CORS configuration added for Backend projects
  - Added `DataNormalizationService` and `OpenAQLiveClient` improvements for ingestion and live data
  - Enhanced Swagger/OpenAPI documentation for backend services
  - Added authentication endpoints and admin user flows
  - Docker environment initialized for frontend; Docker comments translated to English
  - README, Frontend.md, and COPYRIGHT files updated with accurate library and license lists
  - Release documentation files added and improved for release automation
  - Added `LICENSE` and updated SPDX headers across source files

### Changed
- Migrated from `react-leaflet` to native Leaflet (custom hook + map refactor) to ensure OSI-compliant licensing
- Refactored `AirQualityMap` UI and map logic to use native Leaflet library and a custom `useLeafletMap` hook
- Replaced Mock Service Worker (MSW) data with real backend API endpoints and cleaned up mock data code
- Upgraded and tidied backend startup and configuration: SignalR, Swagger, CORS and launch ports
- Refactored `AirQualityController` and backend services to rely on new normalized data flows

### Fixed
- Fixed CO unit reporting (ppm to µg/m³)
- Fixed send-email issues in frontend services
- Fixed API views and data display bugs (apiview limited to 1 record, header fixes)
- Various UI/UX fixes: toggle button color, icons, responsive header elements

### Removed
- Removed `react-leaflet` dependency (removed Hippocratic-2.1 licensed package)
- Removed deprecated OpenAQ service implementation and replaced it with live ingestion pipeline and OpenAQLiveClient
- Removed the old `/api/iot-data` endpoint in favor of MQTT ingestion and normalized device endpoints (breaking change)

### Breaking Changes
- Map rendering now uses native Leaflet: update any code that referenced React-Leaflet components and replace with the new `useLeafletMap` hook
- The `/api/iot-data` endpoint has been removed; IoT ingestion is now handled by MQTT and `MqttSubscriberService` — update integrations accordingly
- OpenAQ service / legacy endpoints removed — follow the migration guide for updated routes and data normalization

### Migration Guide
- Frontend: Remove `react-leaflet` and update map components to import from `leaflet` directly and use `useLeafletMap` hook
- Backend: If you used the old OpenAQ endpoint or `/api/iot-data`, switch to MQTT ingestion and update downstream services to use the new normalized API
- Verify SignalR endpoint and update client initialization to use the `AirQualityHub` connection for realtime updates


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

[0.1.1]: https://github.com/lequang2009k4/SmartAir-City/releases/tag/v0.1.1

[0.1.0]: https://github.com/lequang2009k4/SmartAir-City/releases/tag/v0.1.0
