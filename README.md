# SmartAir City

A real-time air quality monitoring platform that collects, processes, and visualizes environmental data from IoT sensors and third-party APIs.

## Overview

SmartAir City is an IoT-based platform designed to monitor urban air quality metrics including particulate matter (PM2.5, PM10), ozone (O3), nitrogen dioxide (NO2), sulfur dioxide (SO2), carbon monoxide (CO), temperature, and humidity. The system integrates data from IoT sensors and the OpenAQ API, stores it in MongoDB using the NGSI-LD standard, and displays real-time analytics through an interactive web dashboard.

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
- Swagger/OpenAPI documentation
- NGSI-LD data model

### Frontend
- React 19.2.0
- Leaflet.js for interactive maps
- Chart.js for data visualization
- Axios for API communication

## System Requirements

- .NET 8.0 SDK or later
- MongoDB 4.4 or later
- Node.js 16.x or later
- npm or yarn package manager

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend/SmartAirCity
```

2. Restore dependencies:
```bash
dotnet restore
```

3. Configure MongoDB connection in `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "MongoDb": "mongodb://localhost:27017"
  },
  "Mongo": {
    "Database": "SmartAirCityDB"
  }
}
```

4. (Optional) Configure OpenAQ API key in `appsettings.json`:
```json
{
  "OpenAQ": {
    "ApiKey": "your-api-key-here",
    "City": "Hanoi",
    "Parameters": "pm25,pm10,o3,no2,so2,co"
  }
}
```

5. Run the backend server:
```bash
dotnet run
```

The API will be available at `http://localhost:5000` and Swagger UI at `http://localhost:5000`.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`.

## API Endpoints

### POST /api/iot-data
Receive IoT sensor data in JSON-LD format.

**Request Body:**
```json
{
  "id": "urn:ngsi-ld:AirQualityObserved:station-001",
  "type": "AirQualityObserved",
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [105.8542, 21.0285]
    }
  },
  "temperature": {
    "type": "Property",
    "value": 28.5,
    "unitCode": "CEL"
  },
  "humidity": {
    "type": "Property",
    "value": 65,
    "unitCode": "P1"
  }
}
```

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

## Project Structure

```
SmartAir-City/
├── backend/
│   └── SmartAirCity/
│       ├── Controllers/        # API controllers
│       ├── Data/              # MongoDB context
│       ├── Models/            # Data models
│       ├── Services/          # Business logic
│       ├── appsettings.json   # Configuration
│       └── Program.cs         # Application entry point
├── frontend/
│   ├── public/                # Static files
│   └── src/
│       ├── components/        # React components
│       ├── data/             # Data utilities
│       ├── utils/            # Helper functions
│       └── App.js            # Main application
├── CHANGELOG.md              # Version history
├── CONTRIBUTING.md           # Contribution guidelines
└── LICENSE                   # MIT License
```

## Configuration

### MongoDB
Ensure MongoDB is running on your system. The default connection string points to `mongodb://localhost:27017`. Update the connection string in `appsettings.json` if using a different configuration.

### OpenAQ API
The system can optionally integrate with OpenAQ for additional air quality data. Register for a free API key at [openaq.org](https://openaq.org/) and add it to your configuration.

## Usage

1. Start MongoDB service
2. Run the backend API server
3. Start the frontend development server
4. Access the dashboard at `http://localhost:3000`
5. View real-time air quality data on the map and charts
6. Use the API endpoints to send IoT sensor data or query historical records

## Development

### Running Tests

Backend:
```bash
cd backend/SmartAirCity
dotnet test
```

Frontend:
```bash
cd frontend
npm test
```

### Building for Production

Backend:
```bash
dotnet publish -c Release
```

Frontend:
```bash
npm run build
```

## Contributing

We welcome contributions from the community. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Authors

- Le Van Quang - Initial work - [lequang2009k4](https://github.com/lequang2009k4)

## Acknowledgments

- OpenAQ for providing global air quality data
- FIWARE NGSI-LD for IoT data standards
- MongoDB for database support
