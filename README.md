# SmartAir City

## Mô tả

SmartAir City là nền tảng IoT giám sát chất lượng không khí trong thành phố, bao gồm các cảm biến đo pm25,pm10,o3,no2,so2,co. Dữ liệu được thu thập và gửi tới API .NET 8 và hiển thị trên frontend ReactJS.

## Cấu trúc dự án

- **Backend**: API Web (ASP.NET 8) cho việc nhận dữ liệu và lưu trữ vào MongoDB.
- **Frontend**: Dashboard web hiển thị dữ liệu trên bản đồ (Leaflet.js) và biểu đồ (Chart.js).

## Các bước cài đặt

1. Clone repo và vào thư mục dự án.
2. Cài .NET SDK 8 và MongoDB ≥ 6.0
3. (Tùy chọn) Cấu hình mà không cần sửa mã nguồn:
   - PowerShell:
     ```powershell
     $env:ConnectionStrings__MongoDb = "mongodb://localhost:27017"
     $env:Mongo__Database = "SmartAirCityDB"
     $env:OpenAQ__ApiKey = "<YOUR_API_KEY>"
     ```
   - Hoặc chỉnh `backend/SmartAirCity/appsettings.json` với các key: `ConnectionStrings.MongoDb`, `Mongo.Database`, `OpenAQ.ApiKey`
4. Chạy backend:
   ```powershell
   cd backend/SmartAirCity
   dotnet restore
   dotnet build -c Release
   dotnet run -c Release
   ```
5. Truy cập Swagger: `http://localhost:5182/swagger`

## License

This project is licensed under the MIT License.
