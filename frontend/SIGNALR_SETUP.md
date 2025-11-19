# SignalR Connection Setup

## Current Configuration

### Backend
- **URL**: `http://3.27.249.236:51761`
- **Hub Path**: `/airqualityhub`
- **Full Hub URL**: `http://3.27.249.236:51761/airqualityhub`

### Frontend
- **SignalR Client**: `@microsoft/signalr@9.0.6`
- **WebSocket Manager**: `src/services/websocket/WebSocketManager.js`
- **Air Quality Service**: `src/services/websocket/airQualityWebSocket.js`
- **Hook**: `src/hooks/useAirQuality.js`

## Quick Start

### 1. Start Backend
```bash
cd backend/SmartAirCity
dotnet run
```

Backend should be running at `https://localhost:51761`

### 2. Start Frontend
```bash
cd frontend
npm start
```

Frontend will connect to backend SignalR hub automatically.

### 3. Check Connection

Open browser console and look for:
```
[WebSocket] Using Mock WebSocket Adapter
```
or
```
[WebSocket] Connection established
```

## Environment Configuration

### Current Settings (`.env.development`)
```env
REACT_APP_AIR_API_URL=http://3.27.249.236:51761
REACT_APP_AIR_WS_URL=http://3.27.249.236:51761
REACT_APP_ENABLE_WEBSOCKET=true
REACT_APP_USE_MOCK=false  # Changed from true to use real backend
```

## SignalR Events

### Backend → Frontend Events
The frontend is listening for these events from backend:

```javascript
// Air Quality updates
'ReceiveAirQualityUpdate'  // New or updated air quality data
'ReceiveLatestData'        // Latest data response
'ReceiveAlert'             // Air quality alerts

// Device status
'ReceiveDeviceStatusChanged'  // Device status changes
'ReceiveNewDevice'            // New device added
'ReceiveDeviceUpdated'        // Device updated
'ReceiveDeviceDeleted'        // Device deleted

// Connection
'Connected'      // Connection established
'Disconnected'   // Connection lost
'Reconnecting'   // Attempting to reconnect
'Reconnected'    // Reconnection successful
```

### Frontend → Backend Methods
The frontend can call these methods on the backend hub:

```javascript
// Subscribe/Unsubscribe
'SubscribeToAirQuality'
'UnsubscribeFromAirQuality'

// Data requests (if implemented in backend)
'GetLatestData'
'GetHistoricalData'
'RequestUpdate'
```

## Testing Connection

### 1. Check Console Logs

**Success:**
```
[WebSocket] Connection established
[AirQualityWS] Subscribed to events
```

**Failure (will fallback to HTTP polling):**
```
[WebSocket] Failed to connect, falling back to HTTP polling
[AirQualityWS] WebSocket disabled, using HTTP polling
```

### 2. Test in Browser Console

```javascript
// Check if WebSocket is connected
window.airQualityWebSocket = require('./services').airQualityWebSocket;

// Manual connect
await window.airQualityWebSocket.connect();

// Check connection status
console.log(window.airQualityWebSocket.isConnected());
```

### 3. Monitor Network Tab

1. Open DevTools → Network Tab
2. Filter: `WS` (WebSockets)
3. Look for connection to `wss://localhost:51761/hubs/airquality`

## Troubleshooting

### Issue: CORS Error
**Solution:** Check backend CORS configuration allows `http://localhost:3000`

```csharp
// In Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Important for SignalR!
    });
});
```

### Issue: SSL Certificate Error (HTTPS)
**Solution:** Trust the development certificate

```bash
# Trust ASP.NET Core dev certificate
dotnet dev-certs https --trust
```

### Issue: WebSocket Connection Failed
**Fallback:** The system automatically falls back to HTTP polling every 30 seconds.

**Manual Override:** Set in `.env.development`:
```env
REACT_APP_ENABLE_WEBSOCKET=false
```

### Issue: No Events Received
**Check:**
1. Backend is sending events with correct event names
2. Event names match `WS_EVENTS` in `wsConfig.js`
3. Backend hub method names are correct

## How to Use in Components

### Example 1: Simple Usage

```javascript
import { useAirQuality } from '../hooks';

function MyComponent() {
  const { data, loading, error, isConnected } = useAirQuality({
    enableWebSocket: true,
    autoRefresh: true
  });

  return (
    <div>
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      {data && <div>Latest: {data.pm25} µg/m³</div>}
    </div>
  );
}
```

### Example 2: Manual Control

```javascript
import { airQualityWebSocket } from '../services';

// Connect
await airQualityWebSocket.connect();

// Subscribe to events
airQualityWebSocket.on('newData', (data) => {
  console.log('New air quality data:', data);
});

// Disconnect
airQualityWebSocket.disconnect();
```

## Production Configuration

For production, create `.env.production`:

```env
REACT_APP_AIR_API_URL=https://your-domain.com
REACT_APP_AIR_WS_URL=https://your-domain.com
REACT_APP_ENABLE_WEBSOCKET=true
REACT_APP_USE_MOCK=false
REACT_APP_DEBUG_MODE=false
```

## Next Steps

1. Frontend configured to connect to `http://3.27.249.236:51761`
2. Mock disabled, using real backend
3. SignalR events configured
4. Start backend and test connection
5. Verify events are received
6. Test realtime updates
