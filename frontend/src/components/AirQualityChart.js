// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useAirQuality } from '../hooks';
import './AirQualityChart.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AirQualityChart = ({ historicalData: historicalDataProp, locationId, dateRange }) => {
  const [localHistoricalData, setLocalHistoricalData] = useState([]);
  
  // Use the hook for fetching historical data
  const { 
    historicalData: hookHistoricalData, 
    latestData,
    fetchHistoricalData,
    isLoading,
    error 
  } = useAirQuality({
    enableWebSocket: false, // No need WebSocket for historical chart
  });

  // Fetch historical data when locationId or dateRange changes
  useEffect(() => {
    if (locationId && dateRange) {
      const { startDate, endDate } = dateRange;
      fetchHistoricalData(locationId, startDate, endDate)
        .then(data => setLocalHistoricalData(data))
        .catch(err => console.error('Failed to fetch historical data:', err));
    }
  }, [locationId, dateRange, fetchHistoricalData]);

  // Use prop data if provided, otherwise use hook data or local data
  const historicalData = historicalDataProp || localHistoricalData || hookHistoricalData;

  // If no historical data, use latest data for basic chart
  const displayData = historicalData.length > 0 
    ? historicalData 
    : latestData.slice(0, 24); // Show first 24 stations if no historical data
  
  // Prepare data for the chart
  const chartData = {
    labels: displayData.map(d => 
      new Date(d.timestamp).toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    ),
    datasets: [
      {
        label: 'AQI',
        data: displayData.map(d => d.aqi),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5
      },
      {
        label: 'PM2.5',
        data: displayData.map(d => d.pm25),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5
      }
    ]
  };

  // Chart configuration
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
            family: 'Inter'
          },
          padding: 15,
          usePointStyle: true
        }
      },
      title: {
        display: true,
        text: 'Xu hướng chất lượng không khí (24 giờ)',
        font: {
          size: 16,
          weight: '600',
          family: 'Inter'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 13
        },
        bodyFont: {
          size: 12
        },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += Math.round(context.parsed.y * 10) / 10;
            if (context.dataset.label === 'PM2.5') {
              label += ' µg/m³';
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Giá trị',
          font: {
            size: 12,
            weight: '500'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <div className="chart-container">
      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '4px',
          marginBottom: '16px',
          color: '#856404',
          fontSize: '14px'
        }}>
          ⚠️ {error}
        </div>
      )}
      
      {isLoading && displayData.length === 0 ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '300px',
          fontSize: '14px',
          color: '#666'
        }}>
          ⏳ Đang tải dữ liệu biểu đồ...
        </div>
      ) : displayData.length === 0 ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '300px',
          fontSize: '14px',
          color: '#999'
        }}>
          📊 Chưa có dữ liệu để hiển thị
        </div>
      ) : (
        <div className="chart-wrapper">
          <Line data={chartData} options={options} />
        </div>
      )}
    </div>
  );
};

export default AirQualityChart;
