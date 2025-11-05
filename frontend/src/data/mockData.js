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

// Generate random sensor data
const generateSensorData = () => {
  const baseAQI = 50 + Math.random() * 100; // AQI from 50 to 150
  
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

// Generate historical data (last 24 hours)
export const generateHistoricalData = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now - i * 3600000); // Every hour
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

// Update station data for real-time simulation
export const updateStationData = (stations) => {
  return stations.map(station => ({
    ...station,
    ...generateSensorData()
  }));
};

// Determine color based on AQI level
export const getAQIColor = (aqi) => {
  if (aqi <= 50) return '#00e400'; // Good - Green
  if (aqi <= 100) return '#ffff00'; // Moderate - Yellow
  if (aqi <= 150) return '#ff7e00'; // Unhealthy for Sensitive Groups - Orange
  if (aqi <= 200) return '#ff0000'; // Unhealthy - Red
  if (aqi <= 300) return '#8f3f97'; // Very Unhealthy - Purple
  return '#7e0023'; // Hazardous - Maroon
};

// Determine air quality level text
export const getAQILevel = (aqi) => {
  if (aqi <= 50) return 'Tốt';
  if (aqi <= 100) return 'Trung bình';
  if (aqi <= 150) return 'Kém';
  if (aqi <= 200) return 'Xấu';
  if (aqi <= 300) return 'Rất xấu';
  return 'Nguy hại';
};
