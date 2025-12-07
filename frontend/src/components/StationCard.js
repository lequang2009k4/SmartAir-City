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


import React, { useMemo, useRef, useState } from "react";
import "./StationCard.css";

/**
 * Station Card Component
 * Hiển thị thông tin 1 station: name, AQI, pollutants (exclude CO)
 */
const StationCard = ({ stationId, data }) => {
  const cardRef = useRef(null);
  const [tiltStyle, setTiltStyle] = useState({});

  // Handle mouse move for 3D tilt effect
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg
    const rotateY = ((x - centerX) / centerX) * 10; // Max 10deg
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease-out'
    });
  };

  // Reset tilt on mouse leave
  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.3s ease'
    });
  };
  // Calculate current AQI for this station (from data.aqi or average of pollutants)
  const currentAqi = useMemo(() => {
    if (!data) return 0;
    return data.aqi || 0;
  }, [data]);

  // Calculate 24h average AQI (giả định, thực tế cần lấy từ historical data)
  // Tạm thời lấy current AQI (sau này có thể fetch historical)
  const averageAqi24h = useMemo(() => {
    if (!data) return 0;
    // TODO: Fetch real 24h average from API
    return data.aqi || 0;
  }, [data]);

  // Get AQI color
  const getAqiColor = (aqi) => {
    if (aqi <= 50) return "#00e400"; // Good
    if (aqi <= 100) return "#ffff00"; // Moderate
    if (aqi <= 150) return "#ff7e00"; // Unhealthy for Sensitive
    if (aqi <= 200) return "#ff0000"; // Unhealthy
    if (aqi <= 300) return "#8f3f97"; // Very Unhealthy
    return "#7e0023"; // Hazardous
  };

  // Get text color based on background (fix contrast)
  const getTextColor = (aqi) => {
    // Yellow background needs dark text
    if (aqi <= 100) return "#000000"; // Black text for Good/Moderate
    return "#ffffff"; // White text for others
  };

  // Get AQI label (Vietnamese)
  const getAqiLabel = (aqi) => {
    if (aqi <= 50) return "Tốt";
    if (aqi <= 100) return "Trung bình";
    if (aqi <= 150) return "Kém";
    if (aqi <= 200) return "Xấu";
    if (aqi <= 300) return "Rất xấu";
    return "Nguy hại";
  };

  // Station display name
  const getStationName = () => {
    const nameMap = {
      "hanoi-oceanpark": "Hà Nội - Ocean Park",
      "hanoi-nguyenvancu": "Hà Nội - Nguyễn Văn Cừ",
      "hanoi-congvien-hodh": "Hà Nội - Công viên Hồ Định Hương",
      "hcm-cmt8": "TP.HCM - CMT8",
      "hcm-carecentre": "TP.HCM - Care Centre",
    };
    return nameMap[stationId] || stationId;
  };

  if (!data) {
    return (
      <div className="station-card station-card--no-data">
        <div className="station-card__header">
          <h3 className="station-card__title">{getStationName()}</h3>
          <span className="station-card__id">{stationId}</span>
        </div>
        <div className="station-card__body">
          <p className="station-card__no-data">Chưa có dữ liệu</p>
        </div>
      </div>
    );
  }

  const aqiColor = getAqiColor(currentAqi);
  const aqiLabel = getAqiLabel(currentAqi);
  const textColor = getTextColor(currentAqi);

  return (
    <div 
      className="station-card" 
      ref={cardRef}
      style={tiltStyle}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="station-card__header">
        <h3 className="station-card__title">{getStationName()}</h3>
        <span className="station-card__id">{stationId}</span>
      </div>

      {/* AQI Display */}
      <div
        className="station-card__aqi"
        style={{ backgroundColor: aqiColor, color: textColor }}
      >
        <div className="station-card__aqi-value">{currentAqi}</div>
        <div className="station-card__aqi-label">{aqiLabel}</div>
      </div>

      {/* 24h Average AQI */}
      <div className="station-card__avg-24h">
        <span className="avg-24h__label">AQI TB 24h:</span>
        <span
          className="avg-24h__value"
          style={{ 
            color: averageAqi24h <= 50 ? '#00a800' : // Green darker
                   averageAqi24h <= 100 ? '#c9a700' : // Yellow darker
                   getAqiColor(averageAqi24h)
          }}
        >
          {averageAqi24h}
        </span>
      </div>

      {/* Pollutants - Exclude CO */}
      <div className="station-card__pollutants">
        <div className="pollutant-item">
          <span className="pollutant-item__label">PM2.5</span>
          <span className="pollutant-item__value">
            {data.pm25?.toFixed(1) ?? "--"} µg/m³
          </span>
        </div>
        <div className="pollutant-item">
          <span className="pollutant-item__label">PM10</span>
          <span className="pollutant-item__value">
            {data.pm10?.toFixed(1) ?? "--"} µg/m³
          </span>
        </div>
        <div className="pollutant-item">
          <span className="pollutant-item__label">O₃</span>
          <span className="pollutant-item__value">
            {data.o3?.toFixed(1) ?? "--"} µg/m³
          </span>
        </div>
        <div className="pollutant-item">
          <span className="pollutant-item__label">NO₂</span>
          <span className="pollutant-item__value">
            {data.no2?.toFixed(1) ?? "--"} µg/m³
          </span>
        </div>
        <div className="pollutant-item">
          <span className="pollutant-item__label">SO₂</span>
          <span className="pollutant-item__value">
            {data.so2?.toFixed(1) ?? "--"} µg/m³
          </span>
        </div>
      </div>

      {/* Timestamp */}
      <div className="station-card__timestamp">
        {data.timestamp
          ? new Date(data.timestamp).toLocaleString("vi-VN")
          : "--"}
      </div>
    </div>
  );
};

export default StationCard;
