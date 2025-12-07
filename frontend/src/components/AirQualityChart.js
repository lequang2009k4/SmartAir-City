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

import React, { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAirQualityContext } from "../contexts/AirQualityContext";
import "./AirQualityChart.css";

// localStorage key for chart data persistence
const CHART_DATA_KEY = 'smartair_chart_data';
const CHART_TIMESTAMP_KEY = 'smartair_chart_timestamp';
const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Air Quality Chart Component
 * Displays real-time AQI trends for each station
 */
const AirQualityChart = () => {
  const { latestData, isConnected } = useAirQualityContext();
  const chartRef = useRef(null);
  const [tiltStyle, setTiltStyle] = useState({});

  // Handle mouse move for 3D tilt effect
  const handleMouseMove = (e) => {
    if (!chartRef.current) return;
    
    const chart = chartRef.current;
    const rect = chart.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -3; // Max 3deg (lighter than cards)
    const rotateY = ((x - centerX) / centerX) * 3;
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      transition: 'transform 0.1s ease-out'
    });
  };

  // Reset tilt on mouse leave
  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
      transition: 'transform 0.3s ease'
    });
  };
  
  // Station name mapping
  const stationNames = {
    'hanoi-oceanpark': 'HN Ocean Park',
    'hanoi-nguyenvancu': 'HN Nguyễn Văn Cừ',
    'hanoi-congvien-hodh': 'HN Công viên',
    'hcm-cmt8': 'HCM CMT8',
    'hcm-carecentre': 'HCM Care Centre'
  };
  
  // Load chart data from localStorage on mount (with expiry check)
  const loadChartData = () => {
    try {
      const savedTimestamp = localStorage.getItem(CHART_TIMESTAMP_KEY);
      const saved = localStorage.getItem(CHART_DATA_KEY);
      
      if (!saved || !savedTimestamp) return [];
      
      // Check if cache expired (older than 10 minutes)
      const age = Date.now() - parseInt(savedTimestamp);
      if (age > CACHE_EXPIRY_MS) {
        localStorage.removeItem(CHART_DATA_KEY);
        localStorage.removeItem(CHART_TIMESTAMP_KEY);
        return [];
      }
      
      console.log('📊 [Chart] Loading cached data:', JSON.parse(saved).length, 'points');
      return JSON.parse(saved);
    } catch (error) {
      console.error('Failed to load chart data from localStorage:', error);
      return [];
    }
  };
  
  const [chartData, setChartData] = useState(loadChartData());
  const [maxDataPoints] = useState(20); // Keep last 20 data points

  // Save chart data to localStorage whenever it changes
  useEffect(() => {
    if (chartData.length > 0) {
      try {
        localStorage.setItem(CHART_DATA_KEY, JSON.stringify(chartData));
        localStorage.setItem(CHART_TIMESTAMP_KEY, Date.now().toString());
      } catch (error) {
        console.error('Failed to save chart data to localStorage:', error);
      }
    }
  }, [chartData]);

  // Update chart data when new data arrives
  useEffect(() => {
    // latestData is now an object: { 'hanoi-oceanpark': {...}, 'hcm-cmt8': {...} }
    if (!latestData || Object.keys(latestData).length === 0) {
      console.log('📊 [Chart] No latestData available');
      return;
    }

    // Get current timestamp
    const now = Date.now();
    const timeStr = new Date(now).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // Create new data point with AQI from all stations
    const newDataPoint = {
      time: timeStr,
      timestamp: now
    };

    // Add AQI for each station
    Object.entries(latestData).forEach(([stationId, data]) => {
      if (data && data.aqi != null) {
        newDataPoint[stationId] = Math.round(data.aqi);
      }
    });

    console.log('📊 [Chart] New data point:', newDataPoint);

    setChartData((prevData) => {
      // Check if this data point already exists
      const isDuplicate = prevData.some(point => point.timestamp === newDataPoint.timestamp);
      
      if (isDuplicate) {
        console.log('📊 [Chart] Duplicate timestamp detected, skipping:', newDataPoint.timestamp);
        return prevData;
      }

      // Add new point and keep only last N points
      const updatedData = [...prevData, newDataPoint].slice(-maxDataPoints);
      console.log('📊 [Chart] ✅ Added new data point! Total:', updatedData.length, 'points');
      return updatedData;
    });
  }, [latestData, maxDataPoints]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-time">{payload[0].payload.time}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {stationNames[entry.dataKey] || entry.dataKey}: <strong>{entry.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Clear chart cache
  const handleClearCache = () => {
    localStorage.removeItem(CHART_DATA_KEY);
    localStorage.removeItem(CHART_TIMESTAMP_KEY);
    setChartData([]);
    console.log('📊 [Chart] Cache cleared, restarting...');
  };

  return (
    <div 
      className="chart-container"
      ref={chartRef}
      style={tiltStyle}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="chart-header">
        <h3>Biểu đồ theo dõi chất lượng không khí</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {isConnected && <span className="realtime-indicator">🟢 Realtime</span>}
          <button 
            onClick={handleClearCache} 
            className="btn-clear-cache"
            title="Xóa cache và khởi động lại biểu đồ"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="chart-empty">
          <p>⏳ Đang chờ dữ liệu realtime...</p>
        </div>
      ) : (
        <>
          {/* Multi-Station AQI Chart */}
          <div className="chart-wrapper">
            <h4 className="chart-subtitle">AQI Trung Bình Các Trạm (Theo Thời Gian)</h4>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="time"
                  stroke="#6b7280"
                  style={{ fontSize: "12px" }}
                />
                <YAxis 
                  stroke="#6b7280" 
                  style={{ fontSize: "12px" }}
                  label={{ value: 'AQI', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "14px" }} iconType="line" />

                {/* HN Ocean Park - Purple */}
                <Line
                  type="monotone"
                  dataKey="hanoi-oceanpark"
                  name={stationNames['hanoi-oceanpark']}
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />

                {/* HN Nguyễn Văn Cừ - Blue */}
                <Line
                  type="monotone"
                  dataKey="hanoi-nguyenvancu"
                  name={stationNames['hanoi-nguyenvancu']}
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />

                {/* HN Công viên - Green */}
                <Line
                  type="monotone"
                  dataKey="hanoi-congvien-hodh"
                  name={stationNames['hanoi-congvien-hodh']}
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />

                {/* HCM CMT8 - Orange */}
                <Line
                  type="monotone"
                  dataKey="hcm-cmt8"
                  name={stationNames['hcm-cmt8']}
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />

                {/* HCM Care Centre - Red */}
                <Line
                  type="monotone"
                  dataKey="hcm-carecentre"
                  name={stationNames['hcm-carecentre']}
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div className="chart-info">
        <p>
          Biểu đồ hiển thị {maxDataPoints} điểm dữ liệu gần nhất, tự động cập nhật khi có dữ liệu mới
        </p>
        <p>📊 <strong>5 đường biểu diễn AQI trung bình của 5 trạm</strong></p>
        <p>🚫 <strong>Biểu đồ CO đã được loại bỏ theo yêu cầu</strong></p>
      </div>
    </div>
  );
};

export default AirQualityChart;
