# SmartAir City

A real-time air quality monitoring platform that collects, processes, and visualizes environmental data from IoT sensors and third-party APIs.
SmartAir City is an IoT-based platform designed to monitor urban air quality metrics including particulate matter (PM2.5, PM10), ozone (O3), nitrogen dioxide (NO2), sulfur dioxide (SO2), carbon monoxide (CO). The system integrates data from IoT sensors and the OpenAQ API, stores it in MongoDB using the NGSI-LD standard, and displays real-time analytics through an interactive web dashboard.

## Features

- Real-time air quality data collection from IoT sensors
- Integration with OpenAQ API for global air quality measurements
- NGSI-LD compliant data model for standardized IoT data exchange
- MongoDB database for efficient time-series data storage
- Interactive web dashboard with maps and charts
- RESTful API for data access and IoT device communication
- Historical data analysis with customizable time ranges
- Responsive UI with dark mode support

## Technology Stack

### Backend
- ASP.NET Core 8.0
- MongoDB 3.5.0

### Frontend
- React 19.2.0

## Project Structure
```
SmartAir-City/
│
├── 📁 backend/                                # Backend services
│   │
│   ├── 📁 SmartAirCity/                      # Air Quality monitoring service
│   │   ├── 📁 Controllers/
│   │   │   └── AirQualityController.cs       # API endpoints for air quality data
│   │   │
│   │   ├── 📁 Data/
│   │   │   └── MongoDbContext.cs             # MongoDB database context
│   │   │
│   │   ├── 📁 Hubs/
│   │   │   └── AirQualityHub.cs              # SignalR Hub for real-time updates
│   │   │
│   │   ├── 📁 Models/
│   │   │   └── AirQuality.cs                 # NGSI-LD data model for air quality
│   │   │
│   │   ├── 📁 Properties/
│   │   │   └── launchSettings.json           # Launch configuration
│   │   │
│   │   ├── 📁 Services/
│   │   │   ├── AirQualityService.cs          # Business logic for air quality operations
│   │   │   ├── DataNormalizationService.cs   # Normalize and merge IoT + OpenAQ data
│   │   │   ├── MqttSubscriberService.cs      # Background service to subscribe MQTT
│   │   │   └── OpenAQLiveClient.cs           # Client to fetch data from OpenAQ API
│   │   │
│   │   ├── 📁 bin/                           # Build output directory
│   │   │   └── 📁 Debug/
│   │   │
│   │   ├── 📁 obj/                           # Build artifacts
│   │   │   ├── project.assets.json
│   │   │   ├── SmartAirCity.csproj.nuget.dgspec.json
│   │   │   ├── SmartAirCity.csproj.nuget.g.props
│   │   │   ├── SmartAirCity.csproj.nuget.g.targets
│   │   │   └── 📁 Debug/
│   │   │
│   │   ├── appsettings.json                  # Application configuration
│   │   ├── appsettings.Development.json      # Development environment config
│   │   ├── Dockerfile                        # Docker container configuration
│   │   ├── Program.cs                        # Application entry point
│   │   ├── SmartAirCity.csproj               # Project file
│   │   └── SmartAirCity.sln                  # Solution file
│   │
│   └── 📁 SmartCity-Core/                    # Core device and user management service
│       ├── 📁 Controllers/
│       │   ├── DevicesController.cs          # API endpoints for device management
│       │   └── UsersController.cs            # API endpoints for user management
│       │
│       ├── 📁 Models/
│       │   ├── Device.cs                     # Device data model
│       │   └── User.cs                       # User data model
│       │
│       ├── 📁 Properties/
│       │   └── launchSettings.json           # Launch configuration
│       │
│       ├── 📁 Services/
│       │   ├── DeviceService.cs              # Business logic for device operations
│       │   └── UserService.cs                # Business logic for user operations
│       │
│       ├── 📁 bin/                           # Build output directory
│       │   └── 📁 Debug/
│       │
│       ├── 📁 obj/                           # Build artifacts
│       │   ├── project.assets.json
│       │   ├── SmartCity-Core.csproj.nuget.dgspec.json
│       │   ├── SmartCity-Core.csproj.nuget.g.props
│       │   ├── SmartCity-Core.csproj.nuget.g.targets
│       │   └── 📁 Debug/
│       │
│       ├── appsettings.json                  # Application configuration
│       ├── appsettings.Development.json      # Development environment config
│       ├── Dockerfile                        # Docker container configuration
│       ├── Program.cs                        # Application entry point
│       ├── SmartCity-Core.csproj             # Project file
│       ├── SmartCity-Core.sln                # Solution file
│       └── SmartCity-Core.http               # HTTP request collection
│
├── 📁 frontend/                              # React frontend application
│   │
│   ├── 📁 public/                            # Static assets (not processed by Webpack)
│   │   ├── favicon.ico                       # Website favicon
│   │   ├── index.html                        # Main HTML template
│   │   ├── logo.png                          # Logo image
│   │   ├── manifest.json                     # PWA manifest
│   │   ├── mockServiceWorker.js              # MSW service worker
│   │   └── robots.txt                        # SEO robots configuration
│   │
│   ├── 📁 src/                               # Main source code
│   │   │
│   │   ├── 📁 components/                    # React Components
│   │   │   ├── About.js                      # About page
│   │   │   ├── About.css
│   │   │   ├── AirQualityChart.js            # Air quality chart visualization
│   │   │   ├── AirQualityChart.css
│   │   │   ├── AirQualityMap.js              # Leaflet map displaying stations
│   │   │   ├── AirQualityMap.css
│   │   │   ├── AlertBanner.js                # Air quality alert banner
│   │   │   ├── AlertBanner.css
│   │   │   ├── APIDataViewer.js              # Direct API data viewer
│   │   │   ├── APIDataViewer.css
│   │   │   ├── AuthModal.js                  # Login/Register modal
│   │   │   ├── AuthModal.css
│   │   │   ├── DeviceCard.js                 # Device display card
│   │   │   ├── DeviceCard.css
│   │   │   ├── DeviceForm.js                 # Add/Edit device form
│   │   │   ├── DeviceForm.css
│   │   │   ├── DeviceList.js                 # Device list component
│   │   │   ├── DeviceList.css
│   │   │   ├── DeviceManagement.js           # Device management page
│   │   │   ├── DeviceManagement.css
│   │   │   ├── EmailModal.js                 # Email sending modal
│   │   │   ├── EmailModal.css
│   │   │   ├── ErrorMessage.js               # Error message display component
│   │   │   ├── ErrorMessage.css
│   │   │   ├── Footer.js                     # Common footer
│   │   │   ├── Footer.css
│   │   │   ├── Header.js                     # Header navigation
│   │   │   ├── Header.css
│   │   │   ├── LoadingSpinner.js             # Loading spinner component
│   │   │   ├── LoadingSpinner.css
│   │   │   ├── RealtimeDashboard.js          # Real-time dashboard with WebSocket
│   │   │   ├── RealtimeDashboard.css
│   │   │   ├── SearchFilter.js               # Search and filter component
│   │   │   ├── SearchFilter.css
│   │   │   ├── StationComparisonChart.js     # Station comparison chart
│   │   │   ├── StationComparisonChart.css
│   │   │   ├── StatsCards.js                 # Statistics display cards
│   │   │   ├── StatsCards.css
│   │   │   ├── UserCard.js                   # User display card
│   │   │   ├── UserCard.css
│   │   │   ├── UserForm.js                   # Add/Edit user form
│   │   │   ├── UserForm.css
│   │   │   ├── UserList.js                   # User list component
│   │   │   ├── UserList.css
│   │   │   ├── UserManagement.js             # User management page
│   │   │   └── UserManagement.css
│   │   │
│   │   ├── 📁 contexts/                      # React Context API
│   │   │   └── AirQualityContext.js          # AirQuality state management context
│   │   │
│   │   ├── 📁 hooks/                         # Custom React Hooks
│   │   │   ├── index.js                      # Export all hooks
│   │   │   ├── useAirQuality.js              # Air quality data management hook
│   │   │   ├── useAuth.js                    # Authentication management hook
│   │   │   └── useDevices.js                 # Device management hook
│   │   │
│   │   ├── 📁 mocks/                         # Mock Service Worker (MSW)
│   │   │   ├── browser.js                    # MSW browser setup
│   │   │   ├── index.js                      # MSW initialization
│   │   │   ├── mockWebSocketAdapter.js       # Mock WebSocket adapter
│   │   │   ├── mockWebSocketServer.js        # Mock WebSocket server
│   │   │   ├── README.md                     # MSW usage guide
│   │   │   │
│   │   │   ├── 📁 data/                      # Mock data
│   │   │   │   ├── airQualityData.js         # Mock air quality data
│   │   │   │   ├── devicesData.js            # Mock devices data
│   │   │   │   └── usersData.js              # Mock users data
│   │   │   │
│   │   │   └── 📁 handlers/                  # MSW Request Handlers
│   │   │       ├── index.js                  # Export all handlers
│   │   │       ├── airQualityHandlers.js     # Handlers for Air Quality API
│   │   │       ├── devicesHandlers.js        # Handlers for Devices API
│   │   │       └── usersHandlers.js          # Handlers for Users API
│   │   │
│   │   ├── 📁 services/                      # Business Logic Layer
│   │   │   ├── index.js                      # Export all services
│   │   │   ├── README.md                     # Services documentation
│   │   │   │
│   │   │   ├── 📁 api/                       # HTTP API Services
│   │   │   │   ├── __test__.js               # Test suite for API services
│   │   │   │   ├── airQualityService.js      # Air Quality API service
│   │   │   │   ├── axiosInstance.js          # Axios instance configuration
│   │   │   │   ├── devicesService.js         # Devices API service
│   │   │   │   ├── errorHandler.js           # Global HTTP error handler
│   │   │   │   ├── usersService.js           # Users API service
│   │   │   │   └── README.md                 # API services documentation
│   │   │   │
│   │   │   ├── 📁 config/                    # Configuration files
│   │   │   │   ├── __test__.js               # Test suite for config
│   │   │   │   ├── apiConfig.js              # API endpoints configuration
│   │   │   │   └── wsConfig.js               # WebSocket/SignalR configuration
│   │   │   │
│   │   │   └── 📁 websocket/                 # WebSocket/SignalR Services
│   │   │       ├── airQualityWebSocket.js    # SignalR connection for Air Quality
│   │   │       └── WebSocketManager.js       # WebSocket manager class
│   │   │
│   │   ├── 📁 utils/                         # Utility Functions
│   │   │   └── exportUtils.js                # Export data to CSV/Excel
│   │   │
│   │   ├── App.js                            # Root component
│   │   ├── App.css                           # Global styles for App
│   │   ├── App.test.js                       # Test suite for App
│   │   ├── index.js                          # Entry point
│   │   ├── index.css                         # Global CSS
│   │   ├── logo.svg                          # Logo SVG
│   │   ├── reportWebVitals.js                # Web vitals reporting
│   │   └── setupTests.js                     # Jest setup file
│   │
│   ├── 📁 node_modules/                      # Dependencies (generated)
│   │
│   ├── .env.development                      # Development environment variables
│   ├── .env.production                       # Production environment variables
│   ├── Dockerfile                            # Dockerfile
│   ├── package.json                          # NPM dependencies and scripts
│   └── package-lock.json                     # NPM lock file
│
├── CHANGELOG.md                              # Project changelog
├── CONTRIBUTING.md                           # Contribution guidelines
├── COPPYRIGHT.txt                            # Used libary and license
├── LICENSE                                   # Project license
└── README.md                                 # Main project README

```
## Usage

### 1. System Requirements

**Local Development**
- .NET 8.0 SDK or later  
- MongoDB 4.4 or later  
- Node.js 16.x or later  
- npm or yarn package manager  

**For Docker Deployment**
- Docker 20.10+  
- Docker Compose 2.0+  

---

### 2. Clone the Project

```bash
# Clone repository
git clone https://github.com/lequang2009k4/SmartAir-City.git

# Move into project directory
cd SmartAir-City
```

---

### 3. Running the Project

## 3.1 Manual Setup

### Configure Environment Variables

**PowerShell (Windows)**

```powershell
$env:MQTT__BrokerHost = "<MQTT_BROKER_IP>"
$env:MQTT__Username   = "<MQTT_USERNAME>"
$env:MQTT__Password   = "<MQTT_PASSWORD>"
$env:MQTT__BrokerPort = "<MQTT_BROKER_PORT>"
$env:MQTT__Topic      = "<MQTT_TOPIC>"

$env:OpenAQ__ApiKey   = "<YOUR_API_KEY>"
```

**Linux/macOS**

```bash
export MQTT__BrokerHost="<MQTT_BROKER_IP>"
export MQTT__Username="<MQTT_USERNAME>"
export MQTT__Password="<MQTT_PASSWORD>"
export MQTT__BrokerPort="<MQTT_BROKER_PORT>"
export MQTT__Topic="<MQTT_TOPIC>"

export OpenAQ__ApiKey="<YOUR_API_KEY>"
```

---

### Backend Setup

#### **SmartAirCity API**

```bash
# Navigate to backend project
cd backend/SmartAirCity

# Restore dependencies
dotnet restore

# Run the backend server
dotnet run
```

API available at: **http://localhost:5182/swagger**

---

#### **SmartAirCore API**

```bash
# Navigate to SmartAirCore
cd ..
cd SmartAirCore

# Restore dependencies
dotnet restore

# Run the backend server
dotnet run
```

API available at: **http://localhost:8080/swagger**

---

### Frontend Setup

```bash
# Navigate to the frontend
cd frontend

# Install dependencies
npm install

# Prepare environment file
cp .env.example .env   # Then edit the .env file with your configuration

# Start development server
npm start
```

Application available at: **http://localhost:3000**

---

## 3.2 Docker Deployment

> *(Add your Docker instructions here. If you want, I can write a complete Docker section based on your docker-compose.yml.)*




## API Endpoints
### GET /api/airquality
Retrieve all air quality records.

**Query Parameters:**
- `limit` (optional): Maximum number of records to return

### GET /api/airquality/latest
Get the most recent air quality measurement.

### GET /api/airquality/history
Retrieve historical data within a time range.

**Query Parameters:**
- `from`: Start date (ISO 8601 format)
- `to`: End date (ISO 8601 format)
## Contributing

We welcome contributions from the community. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Authors

- Le Van Quang - Initial work - [lequang2009k4](https://github.com/lequang2009k4)
