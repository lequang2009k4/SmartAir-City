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

import React, { useEffect, useMemo } from 'react';
import { useAirQualityContext } from '../contexts/AirQualityContext';
import './StatsCards.css';

const StatsCards = ({ stations: stationsProp }) => {
  // Use the context for realtime data (shared state)
  const { latestData, isLoading, isConnected } = useAirQualityContext();

  // ALWAYS use latestData from context (ignore prop)
  const stations = useMemo(() => latestData, [latestData]);

  console.log('📊 [StatsCards] Render:', {
    stationsProp: stationsProp?.length || 0,
    latestData: latestData?.length || 0,
    stations: stations?.length || 0,
    isLoading,
    isConnected,
    firstStation: stations[0],
    sampleAQI: stations[0]?.aqi,
    sampleTimestamp: stations[0]?.dateObserved
  });

  // Log realtime updates
  useEffect(() => {
    if (isConnected && latestData.length > 0) {
      console.log('📈 Stats updated with realtime data, AQI:', latestData[0]?.aqi);
    }
  }, [isConnected, latestData]);

  // Calculate statistics from stations data
  const calculateStats = () => {
    if (!stations || stations.length === 0) {
      return {
        avgAQI: 0,
        goodStations: 0,
        warningStations: 0,
        dangerStations: 0
      };
    }

    const totalAQI = stations.reduce((sum, s) => sum + s.aqi, 0);
    const avgAQI = totalAQI / stations.length;

    return {
      avgAQI: avgAQI.toFixed(1),
      goodStations: stations.filter(s => s.aqi <= 50).length,
      warningStations: stations.filter(s => s.aqi > 50 && s.aqi <= 100).length,
      dangerStations: stations.filter(s => s.aqi > 100).length
    };
  };

  const stats = calculateStats();

  return (
    <div className="stats-cards">
      {isLoading && stations.length === 0 ? (
        <div style={{ 
          gridColumn: '1 / -1', 
          textAlign: 'center', 
          padding: '40px',
          color: '#666'
        }}>
          ⏳ Đang tải thống kê...
        </div>
      ) : (
        <>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>AQI Trung bình</h3>
              <p className="stat-value">{stats.avgAQI}</p>
              <span className="stat-label">Chỉ số chất lượng không khí</span>
              {isConnected && (
                <span style={{ 
                  display: 'block', 
                  fontSize: '10px', 
                  color: '#51cf66', 
                  marginTop: '4px' 
                }}>
                  🟢 Realtime
                </span>
              )}
            </div>
          </div>
          
          <div className="stat-card good">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>Trạm tốt</h3>
              <p className="stat-value">{stats.goodStations}</p>
              <span className="stat-label">AQI ≤ 50</span>
            </div>
          </div>
          
          <div className="stat-card warning">
            <div className="stat-icon">⚠️</div>
            <div className="stat-info">
              <h3>Trạm cảnh báo</h3>
              <p className="stat-value">{stats.warningStations}</p>
              <span className="stat-label">50 &lt; AQI ≤ 100</span>
            </div>
          </div>
          
          <div className="stat-card danger">
            <div className="stat-icon">🚨</div>
            <div className="stat-info">
              <h3>Trạm nguy hiểm</h3>
              <p className="stat-value">{stats.dangerStations}</p>
              <span className="stat-label">AQI &gt; 100</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatsCards;
