// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

export const generateMockStations = () => {
  const stations = [
    {
      id: 'station-001',
      name: 'Hoàn Kiếm',
      location: { lat: 21.0285, lng: 105.8542 },
    },
    {
      id: 'station-002',
      name: 'Ba Đình',
      location: { lat: 21.0333, lng: 105.8189 },
    },
    {
      id: 'station-003',
      name: 'Hai Bà Trưng',
      location: { lat: 21.0136, lng: 105.8544 },
    },
    {
      id: 'station-004',
      name: 'Đống Đa',
      location: { lat: 21.0189, lng: 105.8270 },
    },
    {
      id: 'station-005',
      name: 'Cầu Giấy',
      location: { lat: 21.0333, lng: 105.7944 },
    },
    {
      id: 'station-006',
      name: 'Thanh Xuân',
      location: { lat: 20.9925, lng: 105.8144 },
    }
  ];

  return stations.map(station => ({
    ...station,
    ...generateSensorData()
  }));
};

// Hàm tạo dữ liệu cảm biến ngẫu nhiên
const generateSensorData = () => {
  const baseAQI = 50 + Math.random() * 100; // AQI từ 50 đến 150
  
  return {
    aqi: baseAQI,
    pm25: parseFloat((baseAQI * 0.5 + Math.random() * 20).toFixed(1)),
    pm10: parseFloat((baseAQI * 0.8 + Math.random() * 30).toFixed(1)),
    co: parseFloat((Math.random() * 5).toFixed(2)),
    temperature: parseFloat((20 + Math.random() * 15).toFixed(1)),
    humidity: parseFloat((60 + Math.random() * 30).toFixed(1)),
    timestamp: new Date().toISOString()
  };
};

// Hàm tạo dữ liệu lịch sử (24 giờ gần nhất)
export const generateHistoricalData = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now - i * 3600000); // Mỗi giờ
    const baseAQI = 60 + Math.sin(i / 4) * 30 + Math.random() * 20;
    
    data.push({
      timestamp: time.toISOString(),
      aqi: parseFloat(baseAQI.toFixed(1)),
      pm25: parseFloat((baseAQI * 0.5 + Math.random() * 10).toFixed(1)),
      pm10: parseFloat((baseAQI * 0.8 + Math.random() * 15).toFixed(1))
    });
  }
  
  return data;
};

// Hàm cập nhật dữ liệu real-time (mô phỏng)
export const updateStationData = (stations) => {
  return stations.map(station => ({
    ...station,
    ...generateSensorData()
  }));
};

// Hàm xác định màu theo AQI
export const getAQIColor = (aqi) => {
  if (aqi <= 50) return '#00e400'; // Tốt - Xanh lá
  if (aqi <= 100) return '#ffff00'; // Trung bình - Vàng
  if (aqi <= 150) return '#ff7e00'; // Kém - Cam
  if (aqi <= 200) return '#ff0000'; // Xấu - Đỏ
  if (aqi <= 300) return '#8f3f97'; // Rất xấu - Tím
  return '#7e0023'; // Nguy hại - Nâu đỏ
};

// Hàm xác định mức độ chất lượng không khí
export const getAQILevel = (aqi) => {
  if (aqi <= 50) return 'Tốt';
  if (aqi <= 100) return 'Trung bình';
  if (aqi <= 150) return 'Kém';
  if (aqi <= 200) return 'Xấu';
  if (aqi <= 300) return 'Rất xấu';
  return 'Nguy hại';
};
