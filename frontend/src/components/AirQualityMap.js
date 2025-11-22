// SmartAir City – IoT Platform for Urban Air Quality Monitoring
// based on NGSI-LD and FiWARE Standards

// SPDX-License-Identifier: MIT
// @version   0.1.x
// @author    SmartAir City Team <smartaircity@gmail.com>
// @copyright © 2025 SmartAir City Team. 
// @license   MIT License
// @see       https://github.com/lequang2009k4/SmartAir-City   SmartAir City Open Source Project

// This software is an open-source component of the SmartAir City initiative.
// It provides real-time environmental monitoring, NGSI-LD–compliant data
// models, MQTT-based data ingestion, and FiWARE Smart Data Models for
// open-data services and smart-city applications.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAirQualityContext } from '../contexts/AirQualityContext';
import { airQualityService } from '../services';
import useLeafletMap from '../hooks/useLeafletMap';
import './AirQualityMap.css';

const { getAQIColor, getAQILevel } = airQualityService;

const AirQualityMap = ({ stations: stationsProp, onStationClick }) => {
  const [center] = useState([21.0285, 105.8542]); // Hanoi center
  const [zoom] = useState(12);

  // Initialize Leaflet map using custom hook (replaces react-leaflet)
  const { mapRef, mapInstance } = useLeafletMap({ center, zoom, scrollWheelZoom: true });
  const markersRef = useRef(new Map());

  // Use the context for realtime data (shared state)
  const { latestData, isLoading, error } = useAirQualityContext();

  // ALWAYS use latestData from context (ignore prop)
  const stations = useMemo(() => {
   
    // Group by location coordinates to avoid duplicates
    const uniqueStations = new Map();
    latestData.forEach(station => {
      const lat = station.location?.lat || station.location?.coordinates?.[1];
      const lng = station.location?.lng || station.location?.coordinates?.[0];
      const key = `${lat},${lng}`;
      
      // Keep the most recent station at each location
      const existing = uniqueStations.get(key);
      if (!existing || new Date(station.dateObserved) > new Date(existing.dateObserved)) {
        uniqueStations.set(key, station);
      }
    });
    
    const result = Array.from(uniqueStations.values());
    return result;
  }, [latestData]);

  // Create custom icon based on AQI level
  const createCustomIcon = (aqi) => {
    const color = getAQIColor(aqi);
    // Use dark text for yellow/green (AQI 0-100), white for others
    const textColor = aqi <= 100 ? '#000' : '#fff';
    const iconHtml = `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: ${textColor};
        font-size: 12px;
      ">
        ${Math.round(aqi)}
      </div>
    `;
    
    return L.divIcon({
      html: iconHtml,
      className: 'custom-marker-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });
  };

  // Update markers when stations data changes
  useEffect(() => {
    if (!mapInstance) return;

    if (stations.length > 0) {
      console.log('🗺️ [AirQualityMap] First station:', stations[0].name, 'AQI:', stations[0].aqi);
    }
    
    const currentMarkers = markersRef.current;
    
    // Clear all existing markers
    currentMarkers.forEach(marker => {
      mapInstance.removeLayer(marker);
    });
    currentMarkers.clear();

    // Add new markers with current AQI
    stations.forEach((station, index) => {
      const lat = station.location?.lat || station.location?.coordinates?.[1];
      const lng = station.location?.lng || station.location?.coordinates?.[0];
      
      if (!lat || !lng) {
        console.warn('⚠️ [AirQualityMap] Missing coordinates for station:', station.name);
        return;
      }

      const marker = L.marker([lat, lng], {
        icon: createCustomIcon(station.aqi)
      });

      const popupContent = `
        <div class="popup-content">
          <h3>${station.name}</h3>
          <div class="aqi-badge" style="background-color: ${getAQIColor(station.aqi)}">
            AQI: ${Math.round(station.aqi)}
          </div>
          <p class="aqi-level">${getAQILevel(station.aqi).label}</p>
          <div class="popup-details">
            <p><strong>PM2.5:</strong> ${station.pm25.toFixed(1)} µg/m³</p>
            <p><strong>PM10:</strong> ${station.pm10.toFixed(1)} µg/m³</p>
            <p><strong>CO:</strong> ${station.co.toFixed(1)} ppm</p>
            <p><strong>SO2:</strong> ${station.so2.toFixed(1)} µg/m³</p>
            <p><strong>NO2:</strong> ${station.no2.toFixed(1)} µg/m³</p>
            <p><strong>O3:</strong> ${station.o3.toFixed(1)} µg/m³</p>
          </div>
          <p class="update-time">
            Cập nhật: ${new Date(station.timestamp || station.dateObserved).toLocaleString('vi-VN')}
          </p>
          <p style="font-size: 11px; color: #51cf66; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
            🟢 Realtime
          </p>
        </div>
      `;

      marker.bindPopup(popupContent);
      
      if (onStationClick) {
        marker.on('click', () => onStationClick(station));
      }

      marker.addTo(mapInstance);
      currentMarkers.set(station.id || index, marker);
    });

    // Cleanup function
    return () => {
      currentMarkers.forEach(marker => {
        if (mapInstance) {
          mapInstance.removeLayer(marker);
        }
      });
      currentMarkers.clear();
    };
  }, [stations, mapInstance, onStationClick]);

  return (
    <div className="map-container">
      {error && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          backgroundColor: '#ff6b6b',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          ⚠️ {error}
        </div>
      )}
      
      {isLoading && !stations.length && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          backgroundColor: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontSize: '14px'
        }}>
          ⏳ Đang tải dữ liệu...
        </div>
      )}
      
      {/* Leaflet map container */}
      <div 
        ref={mapRef} 
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
};

export default AirQualityMap;
