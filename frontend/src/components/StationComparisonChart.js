// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { getAQIColor } from '../data/mockData';
import './StationComparisonChart.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StationComparisonChart = ({ stations }) => {
  // Prepare data for the chart
  const chartData = {
    labels: stations.map(s => s.name),
    datasets: [
      {
        label: 'AQI',
        data: stations.map(s => s.aqi),
        backgroundColor: stations.map(s => {
          const color = getAQIColor(s.aqi);
          // Convert hex to rgba with opacity 0.7
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, 0.7)`;
        }),
        borderColor: stations.map(s => getAQIColor(s.aqi)),
        borderWidth: 2,
        borderRadius: 6,
        barThickness: 50
      }
    ]
  };

  // Chart configuration
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'So sánh AQI giữa các trạm đo',
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
            const value = Math.round(context.parsed.y * 10) / 10;
            const station = stations[context.dataIndex];
            return [
              `AQI: ${value}`,
              `PM2.5: ${station.pm25} µg/m³`,
              `PM10: ${station.pm10} µg/m³`,
              `Nhiệt độ: ${station.temperature}°C`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Chỉ số AQI',
          font: {
            size: 12,
            weight: '500'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          stepSize: 25
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };

  return (
    <div className="comparison-chart-container">
      <div className="comparison-chart-wrapper">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default StationComparisonChart;
