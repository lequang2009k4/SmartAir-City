// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

import React from 'react';
import './StatsCards.css';

const StatsCards = ({ stations }) => {
  // Tính toán thống kê từ dữ liệu stations
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
      <div className="stat-card">
        <div className="stat-icon">📊</div>
        <div className="stat-info">
          <h3>AQI Trung bình</h3>
          <p className="stat-value">{stats.avgAQI}</p>
          <span className="stat-label">Chỉ số chất lượng không khí</span>
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
    </div>
  );
};

export default StatsCards;
