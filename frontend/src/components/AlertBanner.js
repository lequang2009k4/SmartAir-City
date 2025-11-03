// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

import React from 'react';
import './AlertBanner.css';

const AlertBanner = ({ stations }) => {
  // Check if there are any stations with dangerous AQI levels
  const hasDangerousStations = stations.some(s => s.aqi > 150);
  const hasUnhealthyStations = stations.some(s => s.aqi > 100 && s.aqi <= 150);
  const hasModerateStations = stations.some(s => s.aqi > 50 && s.aqi <= 100);

  // Don't show banner if air quality is good everywhere
  if (!hasDangerousStations && !hasUnhealthyStations && !hasModerateStations) {
    return (
      <div className="alert-banner good">
        <span className="alert-icon">✅</span>
        <div className="alert-content">
          <strong>Chất lượng không khí tốt!</strong> 
          Tất cả các khu vực đều có chất lượng không khí ở mức an toàn. 
          Thích hợp cho mọi hoạt động ngoài trời.
        </div>
      </div>
    );
  }

  // Show most severe alert
  if (hasDangerousStations) {
    const dangerousCount = stations.filter(s => s.aqi > 150).length;
    return (
      <div className="alert-banner danger">
        <span className="alert-icon">🚨</span>
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
        <span className="alert-icon">⚠️</span>
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
        <span className="alert-icon">ℹ️</span>
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
