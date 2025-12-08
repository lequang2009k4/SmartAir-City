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

import React, { useState, useEffect, useMemo } from 'react';
import { useAirQualityContext } from '../contexts/AirQualityContext';
import './AlertBanner.css';

const AlertBanner = ({ stations: stationsProp }) => {
  const [recentAlerts, setRecentAlerts] = useState([]);
  
  // Use the context for realtime alerts (shared state)
  const { latestData, alerts, isConnected } = useAirQualityContext();

  // ALWAYS use latestData from context (ignore prop)
  const stations = useMemo(() => latestData, [latestData]);
  // Update recent alerts from hook
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      setRecentAlerts(alerts.slice(0, 3)); // Keep only 3 most recent alerts
    }
  }, [alerts]);
  // Check if there are any stations with dangerous AQI levels
  const hasDangerousStations = stations.some(s => s.aqi > 150);
  const hasUnhealthyStations = stations.some(s => s.aqi > 100 && s.aqi <= 150);
  const hasModerateStations = stations.some(s => s.aqi > 50 && s.aqi <= 100);

  // Don't show banner if air quality is good everywhere
  if (!hasDangerousStations && !hasUnhealthyStations && !hasModerateStations) {
    return (
      <div className="alert-banner good">
        <div className="alert-content">
          <strong>Chất lượng không khí tốt!</strong> 
          Tất cả các khu vực đều có chất lượng không khí ở mức an toàn. 
          Thích hợp cho mọi hoạt động ngoài trời.
          {isConnected && (
            <span style={{ 
              marginLeft: '8px', 
              fontSize: '11px', 
              color: '#51cf66' 
            }}>
              Realtime
            </span>
          )}
        </div>
      </div>
    );
  }

  // Show realtime alerts if available
  if (recentAlerts.length > 0) {
    const latestAlert = recentAlerts[0];
    return (
      <div className="alert-banner danger" style={{ borderLeft: '4px solid #ff6b6b' }}>
        <div className="alert-content">
          <strong>Cảnh báo realtime!</strong> 
          {latestAlert.message || `${latestAlert.locationName || 'Khu vực'} đang có chất lượng không khí xấu (AQI: ${latestAlert.aqi})`}
          <div style={{ 
            fontSize: '11px', 
            color: '#666', 
            marginTop: '4px' 
          }}>
            {new Date(latestAlert.timestamp).toLocaleString('vi-VN')} • Realtime
          </div>
        </div>
      </div>
    );
  }

  // Show most severe alert
  if (hasDangerousStations) {
    const dangerousCount = stations.filter(s => s.aqi > 150).length;
    return (
      <div className="alert-banner danger">
        <div className="alert-content">
          <strong>Cảnh báo nguy hiểm!</strong> 
          {dangerousCount} khu vực có chất lượng không khí ở mức rất xấu (AQI &gt; 150). 
          Hạn chế tối đa hoạt động ngoài trời. Sử dụng khẩu trang khi ra ngoài.
        </div>
      </div>
    );
  }

  if (hasUnhealthyStations) {
    const unhealthyCount = stations.filter(s => s.aqi > 100 && s.aqi <= 150).length;
    return (
      <div className="alert-banner warning">
        <div className="alert-content">
          <strong>Cảnh báo!</strong> 
          {unhealthyCount} khu vực có chất lượng không khí ở mức xấu (AQI: 100-150). 
          Người nhạy cảm nên hạn chế hoạt động ngoài trời.
        </div>
      </div>
    );
  }

  if (hasModerateStations) {
    const moderateCount = stations.filter(s => s.aqi > 50 && s.aqi <= 100).length;
    return (
      <div className="alert-banner moderate">
        <div className="alert-content">
          <strong>Lưu ý!</strong> 
          {moderateCount} khu vực có chất lượng không khí ở mức trung bình (AQI: 50-100). 
          Người nhạy cảm nên cân nhắc khi hoạt động ngoài trời kéo dài.
        </div>
      </div>
    );
  }

  return null;
};

export default AlertBanner;
