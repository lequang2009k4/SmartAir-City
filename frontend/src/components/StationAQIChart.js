// SmartAir City – IoT Platform for Urban Air Quality Monitoring
// based on NGSI-LD and FiWARE Standards

// SPDX-License-Identifier: MIT
// @version   0.1.x
// @author    SmartAir City Team <smartaircity@gmail.com>
// @copyright © 2025 SmartAir City Team. 
// @license   MIT License
// See LICENSE file in root directory for full license text.
// @see       https://github.com/lequang2009k4/SmartAir-City   SmartAir City Open Source Project

// This software is an open-source component of the SmartAir City initiative.
// It provides real-time environmental monitoring, NGSI-LD–compliant data
// models, MQTT-based data ingestion, and FiWARE Smart Data Models for
// open-data services and smart-city applications. 

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useAirQualityContext } from '../contexts/AirQualityContext';
import './StationAQIChart.css';

/**
 * Station AQI Chart Component
 * Biểu đồ cột hiển thị AQI trung bình của từng trạm (exclude CO)
 */
const StationAQIChart = () => {
  const { latestData } = useAirQualityContext();

  // Prepare chart data
  const chartData = useMemo(() => {
    // Station name mapping
    const stationNames = {
      'hanoi-oceanpark': 'HN Ocean Park',
      'hanoi-nguyenvancu': 'HN Nguyễn Văn Cừ',
      'hanoi-congvien-hodh': 'HN Công viên',
      'hcm-cmt8': 'HCM CMT8',
      'hcm-carecentre': 'HCM Care Centre'
    };

    if (!latestData || Object.keys(latestData).length === 0) {
      return [];
    }

    return Object.entries(latestData).map(([stationId, data]) => {
      // Calculate AQI from pollutants (exclude CO)
      const pollutants = ['pm25', 'pm10', 'o3', 'no2', 'so2'];
      const values = pollutants
        .map(p => data[p])
        .filter(v => v != null && !isNaN(v));

      let avgAqi;
      if (values.length > 0) {
        avgAqi = Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
      } else {
        avgAqi = data.aqi || 0;
      }

      return {
        stationId,
        name: stationNames[stationId] || stationId,
        aqi: avgAqi
      };
    });
  }, [latestData]);

  // Get AQI color
  const getAqiColor = (aqi) => {
    if (aqi <= 50) return '#00e400';      // Good
    if (aqi <= 100) return '#ffff00';     // Moderate
    if (aqi <= 150) return '#ff7e00';     // Unhealthy for Sensitive
    if (aqi <= 200) return '#ff0000';     // Unhealthy
    if (aqi <= 300) return '#8f3f97';     // Very Unhealthy
    return '#7e0023';                      // Hazardous
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="station-aqi-tooltip">
          <p className="tooltip-title">{data.name}</p>
          <p className="tooltip-value" style={{ color: getAqiColor(data.aqi) }}>
            AQI: {data.aqi}
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="station-aqi-chart station-aqi-chart--empty">
        <p>Chưa có dữ liệu từ các trạm</p>
      </div>
    );
  }

  return (
    <div className="station-aqi-chart">
      <h3 className="chart-title">AQI Trung Bình Các Trạm (Loại trừ CO)</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            label={{ value: 'AQI', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            payload={[
              { value: 'AQI Trung Bình (PM2.5, PM10, O₃, NO₂, SO₂)', type: 'square', color: '#667eea' }
            ]}
          />
          <Bar dataKey="aqi" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getAqiColor(entry.aqi)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StationAQIChart;
