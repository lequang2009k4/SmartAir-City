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


import React, { useMemo, useState } from "react";
import "./StationCard.css";
import { getStationDisplayName } from '../utils/stationUtils';

/**
 * Station Card Component
 * Compact card with expand on hover
 */
const StationCard = ({ stationId, data }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Format parameter names
  const formatParameterName = (key) => {
    const names = {
      'pm25': 'PM2.5',
      'pm10': 'PM10',
      'pm1': 'PM1',
      'o3': 'O₃',
      'no2': 'NO₂',
      'so2': 'SO₂',
      'co': 'CO',
      'voc': 'VOC',
      'benzene': 'Benzene',
      'formaldehyde': 'Formaldehyde',
      'temperature': 'Nhiệt độ',
      'humidity': 'Độ ẩm',
      'pressure': 'Áp suất'
    };
    
    return names[key.toLowerCase()] || key.toUpperCase();
  };
  
  // Get unit for parameter
  const getUnitForParameter = (key) => {
    const keyLower = key.toLowerCase();
    
    if (keyLower === 'temperature') return '°C';
    if (keyLower === 'humidity') return '%';
    if (keyLower === 'pressure') return 'hPa';
    
    // Default: µg/m³ for pollutants
    return 'µg/m³';
  };
  
  // Get unit from UN/CEFACT code (NGSI-LD standard)
  const getUnitFromCode = (code) => {
    if (!code) return '';
    
    const units = {
      'GQ': 'µg/m³',
      'CEL': '°C',
      'P1': '%',
      'E30': 'ppb',
      'A97': 'hPa'
    };
    
    return units[code] || '';
  };
  
  // Extract all dynamic metrics from data (không hardcode!)
  const extractAllMetrics = useMemo(() => {
    if (!data) return [];
    
    const metrics = [];
    const excludeKeys = ['id', 'type', '@context', 'dateObserved', 'location', 'airQualityIndex', 'sosa:madeBySensor', 'sosa:hasFeatureOfInterest', 'sosa:observedProperty'];
    
    // Use raw NGSI-LD data if available, otherwise use transformed data
    const sourceData = data._raw || data;
    
    for (const [key, value] of Object.entries(sourceData)) {
      // Skip metadata fields
      if (excludeKeys.includes(key) || key.startsWith('sosa:') || key.startsWith('@') || key.startsWith('_')) {
        continue;
      }
      
      // Check if it's a NGSI-LD Property with value
      if (value && typeof value === 'object' && value.type === 'Property' && value.value !== undefined) {
        const label = formatParameterName(key);
        const numValue = typeof value.value === 'number' ? value.value.toFixed(2) : value.value;
        const unit = getUnitFromCode(value.unitCode) || getUnitForParameter(key);

        metrics.push({
          key: key,
          label: label,
          value: numValue,
          unit: unit
        });
      }
      // Fallback: Check if it's a direct numeric value (transformed format)
      else if (value !== undefined && value !== null && typeof value === 'number') {
        // Skip if this is part of nested object (pollutants, location, etc)
        if (key !== 'timestamp' && key !== 'lat' && key !== 'lng') {
          metrics.push({
            key: key,
            label: formatParameterName(key),
            value: value.toFixed(2),
            unit: getUnitForParameter(key)
          });
        }
      }
    }
    
    return metrics;
  }, [data]);
  
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

  // Station display name (using centralized utility)
  const stationName = getStationDisplayName(stationId);

  if (!data) {
    return (
      <div className="station-card station-card--no-data">
        <div className="station-card__header">
          <h3 className="station-card__title">{stationName}</h3>
          <span className="station-card__id">{stationId}</span>
        </div>
        <div className="station-card__body">
          <p className="station-card__no-data">⏳ Đang chờ dữ liệu từ trạm...</p>
        </div>
      </div>
    );
  }

  const aqiColor = getAqiColor(currentAqi);
  const aqiLabel = getAqiLabel(currentAqi);
  const textColor = getTextColor(currentAqi);

  return (
    <div 
      className={`station-card ${isHovered ? 'station-card--expanded' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Always visible: Station Name + AQI */}
      <div className="station-card__header">
        <h3 className="station-card__title">{stationName}</h3>
      </div>

      {/* AQI Display - Always visible */}
      <div
        className="station-card__aqi"
        style={{ backgroundColor: aqiColor, color: textColor }}
      >
        <div className="station-card__aqi-value">{currentAqi}</div>
        <div className="station-card__aqi-label">{aqiLabel}</div>
      </div>

      {/* Expandable details - Only visible on hover */}
      <div className="station-card__details">
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

      {/* Pollutants - Dynamic rendering based on available data */}
      <div className="station-card__pollutants">
        {extractAllMetrics.map((metric) => (
          <div className="pollutant-item" key={metric.key}>
            <span className="pollutant-item__label">{metric.label}</span>
            <span className="pollutant-item__value">
              {typeof metric.value === 'number' ? metric.value.toFixed(1) : metric.value} {metric.unit}
            </span>
          </div>
        ))}
        
        {extractAllMetrics.length === 0 && (
          <div className="pollutant-item">
            <span className="pollutant-item__label">Không có dữ liệu</span>
          </div>
        )}
      </div>

        {/* Timestamp */}
        <div className="station-card__timestamp">
          {data.dateObserved || data.timestamp
            ? (() => {
                const date = new Date(data.dateObserved || data.timestamp);
                const hours = String(date.getUTCHours()).padStart(2, '0');
                const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                const seconds = String(date.getUTCSeconds()).padStart(2, '0');
                const day = String(date.getUTCDate()).padStart(2, '0');
                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                const year = date.getUTCFullYear();
                return `${hours}:${minutes}:${seconds} ${day}/${month}/${year} (UTC)`;
              })()
            : "--"}
        </div>
      </div>
    </div>
  );
};

export default StationCard;
