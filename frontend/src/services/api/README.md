## Files Created

```
src/services/api/
├── axiosInstance.js      # Axios instances với interceptors
├── errorHandler.js       # Error handling utilities
└── __test__.js           # Test file

src/components/
└── ApiTestComponent.js   # React component để test API
```

## Features Implemented

### 1. **Dual Axios Instances**
```javascript
import { airQualityAxios, coreApiAxios } from '@/services';

// Air Quality API (port 5182)
const data = await airQualityAxios.get('/api/airquality/latest');

// Core API (port 5183)
const devices = await coreApiAxios.get('/api/Devices');
```

### 2. **Request Interceptor**
- Auto logging (development mode)
- Add timestamp tracking
- Ready for authentication headers (commented out)

### 3. **Response Interceptor**
- Auto unwrap `response.data`
- Response time logging
- Error normalization

### 4. **Error Handling**
- Normalize all errors thành chuẩn format
- Vietnamese error messages
- Error types: Network, Timeout, Server, Client, etc.
- Detailed logging trong development

### 5. **Helper Functions**
```javascript
import { get, post, put, del } from '@/services';

// Helper wrappers
await get(airQualityAxios, '/api/airquality/latest');
await post(coreApiAxios, '/api/Users/login', { email, password });
```

## Testing

### Option 1: Test với React Component
```javascript
// Trong App.js, thêm:
import ApiTestComponent from './components/ApiTestComponent';

// Render:
<ApiTestComponent />
```

### Option 2: Test với Browser Console
```javascript
// Mở DevTools Console
import { airQualityAxios } from './services';

// Test call
airQualityAxios.get('/api/airquality/latest')
  .then(data => console.log('Data:', data))
  .catch(err => console.error('Error:', err));
```

### Option 3: Backend chưa ready
Nếu backend chưa chạy, bạn sẽ thấy:
```
ERROR:
  Type: NETWORK_ERROR
  Message: Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.
  Status: null
```

## Error Types

| Error Type | Status | Vietnamese Message |
|-----------|--------|-------------------|
| NETWORK_ERROR | null | Không thể kết nối đến server |
| TIMEOUT_ERROR | null | Yêu cầu quá thời gian chờ |
| UNAUTHORIZED | 401 | Bạn cần đăng nhập |
| FORBIDDEN | 403 | Bạn không có quyền truy cập |
| NOT_FOUND | 404 | Không tìm thấy dữ liệu |
| VALIDATION_ERROR | 400 | Dữ liệu không hợp lệ |
| SERVER_ERROR | 5xx | Lỗi server |

## 🔧 Configuration

Axios instances tự động lấy config từ `.env`:

```bash
# .env.development
REACT_APP_AIR_API_URL=http://localhost:5182
REACT_APP_CORE_API_URL=http://localhost:5183
REACT_APP_API_TIMEOUT=10000
REACT_APP_DEBUG_MODE=true
```

## Next Steps

** Air Quality API Service**
- Tạo `airQualityService.js`
- Implement 3 endpoints: getAll, getLatest, getHistory
- Data transformation (NGSI-LD → Frontend format)

## Usage Example

```javascript
import { airQualityAxios, handleApiError } from '@/services';

const MyComponent = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const result = await airQualityAxios.get('/api/airquality/latest');
      setData(result);
    } catch (err) {
      handleApiError(err, setError, 'GET /api/airquality/latest');
    }
  };

  // ...
};
```