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
  // latestData already includes ALL sources: official + MQTT + external from ExternalAirQuality
  const { latestData, isLoading, error, refresh } = useAirQualityContext();

  // Refresh data when component mounts to ensure MQTT/External sources are loaded
  useEffect(() => {
    console.log('🗺️ [AirQualityMap] Component mounted, refreshing data to include MQTT/External sources...');
    if (refresh) {
      refresh().then(() => {
        console.log('✅ [AirQualityMap] Data refresh completed');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Combine all data sources: All from context (includes official + MQTT + External)
  const allMarkers = useMemo(() => {
    const markers = [];
    
    console.log('🗺️ [AirQualityMap] latestData type:', Array.isArray(latestData) ? 'array' : typeof latestData);
    console.log('🗺️ [AirQualityMap] latestData length/keys:', Array.isArray(latestData) ? latestData.length : Object.keys(latestData || {}).length);
    
    // latestData from context can be either array or object
    // Support both formats for compatibility
    let stationsArray = [];
    
    if (Array.isArray(latestData)) {
      stationsArray = latestData;
    } else if (latestData && typeof latestData === 'object') {
      stationsArray = Object.values(latestData);
    }
    
    console.log('🗺️ [AirQualityMap] stationsArray length:', stationsArray.length);
    console.log('🗺️ [AirQualityMap] Sample data:', stationsArray[0]);
    
    // The backend /api/airquality/latest returns data from ExternalAirQuality collection too
    if (stationsArray.length > 0) {
      const uniqueStations = new Map();
      
      stationsArray.forEach(station => {
        const lat = station.location?.lat || station.location?.coordinates?.[1];
        const lng = station.location?.lng || station.location?.coordinates?.[0];
        const key = `${lat},${lng}`;
        
        const existing = uniqueStations.get(key);
        if (!existing || new Date(station.dateObserved) > new Date(existing.dateObserved)) {
          // Determine source type - PRIORITY: Use backend's sourceType if available
          let sourceType = station.sourceType || 'official';
          
          // Fallback detection if backend didn't provide sourceType
          if (!station.sourceType) {
            const stationId = station.id || '';
            const sensorId = station.sensor || '';
            
            // Detection logic priority:
            // 1. Check sensor ID patterns for MQTT
            if (sensorId.toLowerCase().includes('mqtt') || stationId.toLowerCase().includes('mqtt')) {
              sourceType = 'mqtt';
            }
            // 2. Check sensor ID for official devices (mq135, mq7, etc)
            else if (sensorId.toLowerCase().match(/^urn:ngsi-ld:device:(mq\d+|sensor)/i)) {
              sourceType = 'official';
            }
            // 3. If stationId from external source API pattern (not from device)
            else if (stationId.includes('station-') && !sensorId.toLowerCase().includes('mq')) {
              sourceType = 'external-http';
            }
          }
          
          console.log('🔍 [Detection]', station.name, '→', sourceType, '(ID:', station.id, 'Sensor:', station.sensor, ')');
          
          uniqueStations.set(key, { ...station, sourceType });
        }
      });
      
      markers.push(...Array.from(uniqueStations.values()));
    }
    
    console.log('🗺️ [AirQualityMap] Total markers:', markers.length, 
      '(Official:', markers.filter(m => m.sourceType === 'official').length,
      'MQTT:', markers.filter(m => m.sourceType === 'mqtt').length,
      'External:', markers.filter(m => m.sourceType === 'external-http').length + ')');
    
    return markers;
  }, [latestData]);

  // Create custom icon based on AQI level and source type
  const createCustomIcon = (aqi, sourceType = 'official') => {
    const color = getAQIColor(aqi);
    const textColor = aqi <= 100 ? '#000' : '#fff';
    
    // Source type badge
    const sourceBadge = sourceType === 'mqtt' ? '📡' : 
                       sourceType === 'external-http' ? '🌐' : 
                       '🏢'; // official
    
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
        position: relative;
      ">
        ${Math.round(aqi) || '?'}
        <div style="
          position: absolute;
          top: -8px;
          right: -8px;
          background: white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        ">
          ${sourceBadge}
        </div>
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

  // Update markers when allMarkers data changes
  useEffect(() => {
    if (!mapInstance) return;

    if (allMarkers.length > 0) {
      console.log('🗺️ [AirQualityMap] First marker:', allMarkers[0].name, 'Type:', allMarkers[0].sourceType);
    }
    
    const currentMarkers = markersRef.current;
    
    // Clear all existing markers
    currentMarkers.forEach(marker => {
      mapInstance.removeLayer(marker);
    });
    currentMarkers.clear();

    // Add new markers with current AQI
    allMarkers.forEach((station, index) => {
      const lat = station.location?.lat || station.location?.coordinates?.[1];
      const lng = station.location?.lng || station.location?.coordinates?.[0];
      
      if (!lat || !lng) {
        console.warn('⚠️ [AirQualityMap] Missing coordinates for station:', station.name);
        return;
      }

      const marker = L.marker([lat, lng], {
        icon: createCustomIcon(station.aqi, station.sourceType)
      });
      
      // Source type labels
      const sourceLabels = {
        'official': '🏢 Trạm chính thức',
        'mqtt': '📡 MQTT Sensor',
        'external-http': '🌐 API bên thứ 3'
      };

      const popupContent = `
        <div class="popup-content">
          <h3>${station.name}</h3>
          <div class="source-badge" style="
            background: ${station.sourceType === 'official' ? '#228be6' : station.sourceType === 'mqtt' ? '#fab005' : '#51cf66'};
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            margin-bottom: 8px;
            display: inline-block;
          ">
            ${sourceLabels[station.sourceType] || 'Không xác định'}
          </div>
          <div class="aqi-badge" style="background-color: ${getAQIColor(station.aqi)}">
            AQI: ${Math.round(station.aqi) || 'N/A'}
          </div>
          <p class="aqi-level">${station.aqi ? getAQILevel(station.aqi).label : 'Chưa có dữ liệu'}</p>
          ${station.aqi > 0 ? `
          <div class="popup-details">
            <p><strong>PM2.5:</strong> ${station.pm25.toFixed(1)} µg/m³</p>
            <p><strong>PM10:</strong> ${station.pm10.toFixed(1)} µg/m³</p>
            <p><strong>CO:</strong> ${station.co.toFixed(1)} ppm</p>
            <p><strong>SO2:</strong> ${station.so2.toFixed(1)} µg/m³</p>
            <p><strong>NO2:</strong> ${station.no2.toFixed(1)} µg/m³</p>
            <p><strong>O3:</strong> ${station.o3.toFixed(1)} µg/m³</p>
          </div>
          ` : '<p style="color: #868e96; font-size: 12px;">Đang chờ dữ liệu từ nguồn...</p>'}
          <p class="update-time">
            ${station.timestamp ? 'Cập nhật: ' + new Date(station.timestamp || station.dateObserved).toLocaleString('vi-VN') : ''}
          </p>
          ${station.sourceType !== 'official' ? `
          <p style="font-size: 11px; color: #868e96; margin-top: 4px;">
            ${station.sourceType === 'mqtt' ? '📡 Dữ liệu từ MQTT broker' : '🌐 Dữ liệu từ API bên ngoài'}
          </p>
          ` : `
          <p style="font-size: 11px; color: #51cf66; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
            🟢 Realtime
          </p>
          `}
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
  }, [allMarkers, mapInstance, onStationClick]);

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
      
      {isLoading && !allMarkers.length && (
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
