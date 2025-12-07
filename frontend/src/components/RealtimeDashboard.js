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

import React from 'react';
import { useAirQualityContext } from '../contexts/AirQualityContext';
import StationCard from './StationCard';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import './RealtimeDashboard.css';

/**
 * Realtime Dashboard Component
 * Hiển thị 5 station cards với data realtime từ WebSocket
 */
const RealtimeDashboard = () => {
  const { latestData, isLoading, error, isConnected } = useAirQualityContext();

  // Define 5 stations to display
  const stations = [
    'hanoi-oceanpark',
    'hanoi-nguyenvancu',
    'hanoi-congvien-hodh',
    'hcm-cmt8',
    'hcm-carecentre'
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="realtime-dashboard">
      {/* Header */}
      <div className="realtime-dashboard__header">
        <h1 className="realtime-dashboard__title">
          🌍 Theo Dõi Chất Lượng Không Khí Realtime
        </h1>
        <div className="realtime-dashboard__status">
          <span className={`status-indicator ${isConnected ? 'status-indicator--connected' : 'status-indicator--disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
      </div>

      {/* Station Grid */}
      <div className="realtime-dashboard__grid">
        {stations.map(stationId => (
          <StationCard
            key={stationId}
            stationId={stationId}
            data={latestData[stationId]}
          />
        ))}
      </div>

      {/* Info Footer */}
      <div className="realtime-dashboard__footer">
        <p>
          📡 Dữ liệu cập nhật realtime qua WebSocket SignalR
          <br />
          🚫 Biểu đồ CO đã được loại bỏ theo yêu cầu
          <br />
          📊 AQI tính trung bình từ 5 chất ô nhiễm: PM2.5, PM10, O₃, NO₂, SO₂
        </p>
      </div>
    </div>
  );
};

export default RealtimeDashboard;
