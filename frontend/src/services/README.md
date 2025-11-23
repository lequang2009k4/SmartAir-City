# Services Configuration

This folder contains all API and WebSocket configuration for SmartAir City frontend.

## 📁 Structure

```
services/
├── config/
│   ├── apiConfig.js      # API endpoints & HTTP config
│   ├── wsConfig.js       # WebSocket/SignalR config
│   └── __test__.js       # Configuration test file
├── api/                  # HTTP API services
├── websocket/            # WebSocket services
└── index.js              # Central export point
```

## 🚀 Usage

### Import configuration:
```javascript
import { 
  AIR_QUALITY_ENDPOINTS, 
  API_CONFIG 
} from '@/services/config/apiConfig';

// Get endpoint
const url = AIR_QUALITY_ENDPOINTS.GET_LATEST;

// Build URL with params
import { buildUrl } from '@/services/config/apiConfig';
const url = buildUrl(AIR_QUALITY_ENDPOINTS.GET_ALL, { limit: 50 });
```

### Environment Variables:
```bash
# Development
REACT_APP_AIR_API_URL=http://localhost:51872
REACT_APP_CORE_API_URL=http://localhost:8080

# Production (just change domain!)
REACT_APP_AIR_API_URL=<API_APP_AIR_URL>
REACT_APP_CORE_API_URL=<API_CORE_URL>
```

## 🔧 Configuration Files

### `.env.development`
- Local development settings
- Localhost URLs
- Debug mode enabled

### `.env.production`
- Production settings
- Production domain
- Optimized intervals

