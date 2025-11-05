// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

/**
 * Export data utilities for SmartAir City
 * Supports CSV and JSON export formats
 */

// Convert stations data to CSV format
export const exportToCSV = (stations) => {
  if (!stations || stations.length === 0) {
    throw new Error('No data to export');
  }

  // CSV headers
  const headers = [
    'ID',
    'Tên trạm',
    'Vĩ độ',
    'Kinh độ',
    'AQI',
    'PM2.5 (µg/m³)',
    'PM10 (µg/m³)',
    'CO (ppm)',
    'Nhiệt độ (°C)',
    'Độ ẩm (%)',
    'Thời gian cập nhật'
  ];

  // Convert stations to CSV rows
  const rows = stations.map(station => [
    station.id,
    station.name,
    station.location.lat,
    station.location.lng,
    station.aqi.toFixed(1),
    station.pm25.toFixed(1),
    station.pm10.toFixed(1),
    station.co.toFixed(2),
    station.temperature.toFixed(1),
    station.humidity.toFixed(1),
    new Date(station.timestamp).toLocaleString('vi-VN')
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
};

// Convert stations data to JSON format
export const exportToJSON = (stations, pretty = true) => {
  if (!stations || stations.length === 0) {
    throw new Error('No data to export');
  }

  const exportData = {
    exportTime: new Date().toISOString(),
    totalStations: stations.length,
    stations: stations.map(station => ({
      id: station.id,
      name: station.name,
      location: {
        latitude: station.location.lat,
        longitude: station.location.lng
      },
      measurements: {
        aqi: parseFloat(station.aqi.toFixed(1)),
        pm25: parseFloat(station.pm25.toFixed(1)),
        pm10: parseFloat(station.pm10.toFixed(1)),
        co: parseFloat(station.co.toFixed(2)),
        temperature: parseFloat(station.temperature.toFixed(1)),
        humidity: parseFloat(station.humidity.toFixed(1))
      },
      timestamp: station.timestamp
    }))
  };

  return pretty ? JSON.stringify(exportData, null, 2) : JSON.stringify(exportData);
};

// Download file to user's computer
export const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};

// Export stations data as CSV file
export const downloadCSV = (stations) => {
  try {
    const csvContent = exportToCSV(stations);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `smartair-city-data-${timestamp}.csv`;
    
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    
    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return { success: false, error: error.message };
  }
};

// Export stations data as JSON file
export const downloadJSON = (stations, pretty = true) => {
  try {
    const jsonContent = exportToJSON(stations, pretty);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `smartair-city-data-${timestamp}.json`;
    
    downloadFile(jsonContent, filename, 'application/json;charset=utf-8;');
    
    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting JSON:', error);
    return { success: false, error: error.message };
  }
};

// Get statistics summary for export
export const getDataSummary = (stations) => {
  if (!stations || stations.length === 0) {
    return null;
  }

  const aqiValues = stations.map(s => s.aqi);
  const avgAQI = aqiValues.reduce((sum, val) => sum + val, 0) / stations.length;
  const maxAQI = Math.max(...aqiValues);
  const minAQI = Math.min(...aqiValues);

  return {
    totalStations: stations.length,
    averageAQI: parseFloat(avgAQI.toFixed(1)),
    maxAQI: parseFloat(maxAQI.toFixed(1)),
    minAQI: parseFloat(minAQI.toFixed(1)),
    exportTime: new Date().toISOString()
  };
};
