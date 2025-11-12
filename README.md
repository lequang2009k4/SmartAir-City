# SmartAir City

## Mô tả

SmartAir City là nền tảng IoT giám sát chất lượng không khí trong thành phố, bao gồm các cảm biến đo pm25,pm10,o3,no2,so2,co. Dữ liệu được thu thập và gửi tới API .NET 8 và hiển thị trên frontend ReactJS.

## Cấu trúc dự án

- **Backend**: API Web (ASP.NET 8) cho việc nhận dữ liệu và lưu trữ vào MongoDB.
- **Frontend**: Dashboard web hiển thị dữ liệu trên bản đồ (Leaflet.js) và biểu đồ (Chart.js).

## Các bước cài đặt

### 1. Clone repo và vào thư mục dự án.

```bash
git clone https://github.com/lequang2009k4/SmartAir-City.git
cd SmartAir-City/backend/SmartAirCity
```

### 2. Cài .NET SDK 8 và MongoDB ≥ 6.0

### 3. (Tùy chọn) Cấu hình mà không cần sửa mã nguồn:

#### **Phương pháp 1: Environment Variables (Khuyến nghị)**

```powershell
# PowerShell
$env:MQTT__BrokerHost = "<MQTT_BROKER_IP>"
$env:MQTT__Username = "<MQTT_USERNAME>"
$env:MQTT__Password = "<MQTT_PASSWORD>"
$env:OpenAQ__ApiKey = "<YOUR_API_KEY>"
```

````bash
# Linux/macOS
export MQTT__BrokerHost="<MQTT_BROKER_IP>"
export MQTT__Username="<MQTT_USERNAME>"
export MQTT__Password="<MQTT_PASSWORD>"
export MQTT__ApiKey="<YOUR_API_KEY>"

#### **Phương pháp 2: Chỉnh sửa appsettings.json**

Mở file `backend/SmartAirCity/appsettings.json` và điền thông tin vào các trường đang để trống:

```json
{
  "OpenAQ": {
    "ApiKey": "",
      ...
  },

  "MQTT": {
    "BrokerHost": "",
    "BrokerPort": "1883",
    "Username": "",
    "Password": "",
    ....
  }
}
```

### 3. Lấy credentials

**MQTT:** Liên hệ nhóm trưởng (Lê Văn Quang)
**OpenAQ API Key:** Đăng ký miễn phí tại https://openaq.org/developers

### 4. Chạy backend

```bash
# Chạy
dotnet watch run
```

### 5. Kiểm tra kết quả

Truy cập Swagger: `http://localhost:5182/swagger`

## License

This project is licensed under the MIT License.
````
