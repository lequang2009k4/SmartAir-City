## 📁 Structure

```
src/mocks/
├── browser.js                      # MSW setup
├── handlers/
│   ├── index.js                    # Combined handlers
│   ├── airQualityHandlers.js       # Air Quality API (openapi.yaml)
│   ├── devicesHandlers.js          # Devices API (openapi (1).yaml)
│   └── usersHandlers.js            # Users API (openapi (1).yaml)
└── data/
    ├── airQualityData.js           # NGSI-LD mock data generator
    ├── devicesData.js              # Devices mock data
    └── usersData.js                # Users mock data
```

## 🎯 Mocked Endpoints

### Air Quality API (Port 5182)
```
✅ GET  /api/airquality          → List with limit
✅ GET  /api/airquality/latest   → Latest record (NGSI-LD)
✅ GET  /api/airquality/history  → History (from, to)
✅ POST /api/iot-data            → IoT ingest
```

### Core API - Devices (Port 5183)
```
✅ GET    /api/Devices           → List devices
✅ PUT    /api/Devices/:id       → Update device
✅ DELETE /api/Devices/:id       → Delete device
```

### Core API - Users (Port 5183)
```
✅ GET    /api/Users             → List users
✅ POST   /api/Users/singup      → Signup (note: typo in backend)
✅ POST   /api/Users/login       → Login
✅ POST   /api/Users/email       → Send email
✅ DELETE /api/Users/:id         → Delete user
```

## 🚀 Usage

### Enable/Disable Mock Server

**Option 1: Environment Variable**
```bash
# .env.development
REACT_APP_USE_MOCK=true   # Enable mock
REACT_APP_USE_MOCK=false  # Disable mock (use real backend)
```

**Option 2: Code**
```javascript
// src/index.js
const USE_MOCK = false; // Change to false to disable
```

### Test Mock APIs

1. **Start app:**
```bash
npm start
```

2. **Check console:**
```
🎭 MSW Enabled - Using mock APIs
   - Air Quality API: http://localhost:5182
   - Core API (Devices/Users): http://localhost:5183
```

3. **Go to API Test tab:**
- Click "Test Air Quality API" → Sẽ thấy mock data (NGSI-LD format)
- Click "Test Devices API" → Sẽ thấy mock devices

4. **Check Network tab (F12):**
- Requests vẫn show như bình thường
- Status: 200 OK
- Response: Mock data

## 📊 Mock Data Features

### NGSI-LD Compliance
Mock data tuân thủ 100% OpenAPI specs:
```json
{
  "id": "urn:ngsi-ld:AirQualityObserved:station-hoan-kiem:2025-11-12T...",
  "type": "AirQualityObserved",
  "@context": [...],
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [105.8542, 21.0285]
    }
  },
  "pm25": {
    "type": "Property",
    "value": 35.67,
    "unitCode": "µg/m³"
  }
}
```

### Dynamic Data
- ✅ Random but realistic values
- ✅ Proper NGSI-LD structure
- ✅ 8 Hanoi locations
- ✅ Timestamps match current time
- ✅ Historical data generation

### CRUD Support
- ✅ In-memory database
- ✅ Update/Delete devices
- ✅ Add/Remove users
- ✅ Persists during session

## 🔄 Switching to Real Backend

### When Backend is Ready:

**Step 1: Disable MSW**
```bash
# .env.development
REACT_APP_USE_MOCK=false
```

**Step 2: Update URLs (if needed)**
```bash
# .env.production
REACT_APP_AIR_API_URL=https://real-api.smartcity.com
REACT_APP_CORE_API_URL=https://real-api.smartcity.com
```

**Step 3: Restart app**
```bash
npm start
```

**That's it!** Frontend sẽ gọi real APIs.

## 🧪 Testing Mock Data

### Manual Test
```javascript
// Browser console
import { generateAirQualityRecord } from './mocks';

const record = generateAirQualityRecord();
console.log(record);
```

### With Axios
```javascript
import { airQualityAxios } from './services';

// This will be intercepted by MSW
const data = await airQualityAxios.get('/api/airquality/latest');
console.log('Mock data:', data);
```