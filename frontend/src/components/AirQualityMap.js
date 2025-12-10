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
import { STATIONS_ENDPOINTS } from '../services/config/apiConfig';
import { airQualityAxios } from '../services/api/axiosInstance';
import useLeafletMap from '../hooks/useLeafletMap';
import './AirQualityMap.css';

const { getAQIColor, getAQILevel } = airQualityService;

// Helper functions (same logic as StationCard)
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
    'temperature': 'Nhiệt độ',
    'humidity': 'Độ ẩm',
    'relativehumidity': 'Độ ẩm',
    'pressure': 'Áp suất'
  };
  return names[key.toLowerCase()] || key.toUpperCase();
};

const getUnitForParameter = (key) => {
  const keyLower = key.toLowerCase();
  if (keyLower === 'temperature') return '°C';
  if (keyLower === 'humidity' || keyLower === 'relativehumidity') return '%';
  if (keyLower === 'pressure') return 'hPa';
  return 'µg/m³';
};

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

// Extract metrics dynamically - only air quality parameters
const extractMetrics = (data) => {
  if (!data) return [];
  
  const metrics = [];
  
  // Whitelist: only show actual air quality/weather parameters
  const allowedKeys = ['pm25', 'pm2_5', 'pm10', 'pm10_', 'pm1', 'o3', 'no2', 'so2', 'co', 'voc', 
                       'temperature', 'humidity', 'relativeHumidity', 'pressure', 
                       'PM25', 'PM10', 'PM1', 'O3', 'NO2', 'SO2', 'CO', 'VOC'];
  
  const sourceData = data._raw || data;
  
  for (const [key, value] of Object.entries(sourceData)) {
    // Skip if not in whitelist
    if (!allowedKeys.includes(key)) {
      continue;
    }
    
    // NGSI-LD Property format
    if (value && typeof value === 'object' && value.type === 'Property' && value.value !== undefined) {
      const numericValue = parseFloat(value.value);
      
      // Skip if value is 0 or invalid
      if (!numericValue || numericValue === 0) {
        continue;
      }
      
      const label = formatParameterName(key);
      const unit = getUnitFromCode(value.unitCode) || getUnitForParameter(key);
      
      metrics.push({ key, label, value: numericValue.toFixed(1), unit });
    }
    // Direct numeric value (transformed format)
    else if (typeof value === 'number') {
      // Skip if value is 0
      if (value === 0) {
        continue;
      }
      
      metrics.push({
        key,
        label: formatParameterName(key),
        value: value.toFixed(1),
        unit: getUnitForParameter(key)
      });
    }
  }
  
  return metrics;
};

const AirQualityMap = ({ stations: stationsProp, onStationClick }) => {
  const [center] = useState([21.0285, 105.8542]); // Hanoi center
  const [zoom] = useState(12);
  const [externalData, setExternalData] = useState({}); // MQTT + External sources data

  // Initialize Leaflet map using custom hook (replaces react-leaflet)
  const { mapRef, mapInstance } = useLeafletMap({ center, zoom, scrollWheelZoom: true });

  const markersRef = useRef(new Set());

  // latestData from WebSocket contains Official stations
  const { latestData, isLoading, error, refresh } = useAirQualityContext();

  // Fetch External sources data (external-mqtt and external-http only)
  useEffect(() => {
    console.log('🚀 [AirQualityMap] useEffect STARTED - About to fetch external stations');
    
    const fetchExternalStationsData = async () => {
      try {
        console.log('🗺️ [AirQualityMap] Step 1: Fetching all stations from /api/stations/map...');
        
        // Step 1: Get all stations
        // Note: airQualityAxios interceptor already unwraps response.data
        const allStations = await airQualityAxios.get(STATIONS_ENDPOINTS.GET_FOR_MAP);
        
        if (!Array.isArray(allStations)) {
          console.error('❌ [AirQualityMap] API response is not an array:', allStations);
          return;
        }
        
        console.log('📊 [AirQualityMap] Total stations:', allStations.length);
        console.log('📊 [AirQualityMap] Station types:', 
          allStations.reduce((acc, s) => { acc[s.type] = (acc[s.type] || 0) + 1; return acc; }, {})
        );
        
        // Step 2: Filter ONLY external sources (external-mqtt and external-http)
        // DO NOT include type="mqtt" (those are official IoT devices)
        const externalStations = allStations.filter(station => 
          station.type === 'external-mqtt' || station.type === 'external-http'
        );
        
        console.log('🔍 [AirQualityMap] Step 2: Filtered external stations:', externalStations.length);
        console.log('📡 [AirQualityMap] External MQTT:', externalStations.filter(s => s.type === 'external-mqtt').length);
        console.log('🌐 [AirQualityMap] External HTTP:', externalStations.filter(s => s.type === 'external-http').length);
        console.log('📋 [AirQualityMap] Station IDs:', externalStations.map(s => s.stationId).join(', '));
        
        // Step 3: Fetch latest data for each external station
        console.log('🔄 [AirQualityMap] Step 3: Fetching data for', externalStations.length, 'stations...');
        
        const dataPromises = externalStations.map(station =>
          airQualityService.getLatest(station.stationId)
            .then(data => {
              console.log(`✅ [AirQualityMap] Got data for ${station.stationId}:`, data ? 'HAS DATA' : 'NO DATA');
              return {
                stationId: station.stationId,
                name: station.name,
                latitude: station.latitude,
                longitude: station.longitude,
                type: station.type,
                isActive: station.isActive,
                airQualityData: data
              };
            })
            .catch(err => {
              console.warn(`⚠️ [AirQualityMap] Error fetching ${station.stationId}:`, err.message || err);
              return {
                stationId: station.stationId,
                name: station.name,
                latitude: station.latitude,
                longitude: station.longitude,
                type: station.type,
                isActive: station.isActive,
                airQualityData: null
              };
            })
        );
        
        const results = await Promise.all(dataPromises);
        
        // Step 4: Build external data map (key: stationId)
        const newExternalData = {};
        results.forEach(result => {
          newExternalData[result.stationId] = result;
        });
        
        console.log('✅ [AirQualityMap] Step 3: External data loaded:', Object.keys(newExternalData).length, 'stations');
        setExternalData(newExternalData);
        
      } catch (err) {
        console.error('❌ [AirQualityMap] Error fetching external sources:', err);
      }
    };
    
    // Initial fetch
    fetchExternalStationsData();
    
    // Refresh WebSocket data for official stations
    if (refresh) {
      refresh().then(() => {
        console.log('✅ [AirQualityMap] WebSocket data refresh completed');
      });
    }
    
    // Set up interval to refresh external data every 1 minute
    const interval = setInterval(fetchExternalStationsData, 60 * 1000);
    
    console.log('⏰ [AirQualityMap] Polling interval set: refresh external data every 60 seconds');
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Combine all data sources: WebSocket (Official) + API (External MQTT + External HTTP)
  const allMarkers = useMemo(() => {
    const markers = [];
    
    console.log('🗺️ [AirQualityMap] Building markers...');
    console.log('📊 [AirQualityMap] Official stations (WebSocket):', Object.keys(latestData || {}).length);
    console.log('📊 [AirQualityMap] External stations (API):', Object.keys(externalData || {}).length);
    
    // Part 1: Official stations from WebSocket (type = "official")
    const officialStations = Object.values(latestData || {});
    officialStations.forEach(station => {
      const lat = station.location?.lat || station.location?.coordinates?.[1];
      const lng = station.location?.lng || station.location?.coordinates?.[0];
      
      if (lat && lng) {
        markers.push({
          ...station,
          sourceType: station.sourceType || 'official', // Mark as official
          location: {
            ...station.location,
            lat,
            lng
          }
        });
      }
    });
    
    // Part 2: External stations from API (type = "external-mqtt" or "external-http")
    const externalStations = Object.values(externalData || {});
    externalStations.forEach(stationInfo => {
      const { airQualityData, ...stationMeta } = stationInfo;
      
      console.log(`📍 [AirQualityMap] External station ${stationMeta.name}:`, {
        type: stationMeta.type,
        lat: stationMeta.latitude,
        lng: stationMeta.longitude
      });
      
      // Show marker even if no air quality data yet
      if (stationMeta.latitude && stationMeta.longitude) {
        markers.push({
          // Station metadata
          id: stationMeta.stationId,
          stationId: stationMeta.stationId,
          name: stationMeta.name,
          // Air quality data (if available)
          ...(airQualityData || {}),
          // Source type
          sourceType: stationMeta.type, // 'external-mqtt' or 'external-http'
          // Location
          location: {
            type: 'Point',
            coordinates: [stationMeta.longitude, stationMeta.latitude],
            lat: stationMeta.latitude,
            lng: stationMeta.longitude
          }
        });
      }
    });
    
    console.log('🗺️ [AirQualityMap] Total markers:', markers.length);
    console.log('📊 [AirQualityMap] By type:', {
      official: markers.filter(m => m.sourceType === 'official').length,
      'external-mqtt': markers.filter(m => m.sourceType === 'external-mqtt').length,
      'external-http': markers.filter(m => m.sourceType === 'external-http').length
    });
    
    return markers;
  }, [latestData, externalData]);

  // Create custom icon based on AQI level and source type
  const createCustomIcon = (aqi, sourceType = 'official') => {
    const color = getAQIColor(aqi);
    const textColor = aqi <= 100 ? '#000' : '#fff';
    
    // Source type badge
    const sourceBadge = sourceType === 'external-mqtt' ? '📡' : 
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
        'external-mqtt': '📡 MQTT bên thứ 3',
        'external-http': '🌐 API bên thứ 3'
      };

      // Extract available metrics dynamically
      const metrics = extractMetrics(station);

      const popupContent = `
        <div class="popup-content">
          <h3>${station.name}</h3>
          <div class="source-badge" style="
            background: ${station.sourceType === 'official' ? '#228be6' : station.sourceType === 'external-mqtt' ? '#fab005' : '#51cf66'};
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
          ${metrics.length > 0 ? `
          <div class="popup-details">
            ${metrics.map(metric => `
              <p><strong>${metric.label}:</strong> ${metric.value} ${metric.unit}</p>
            `).join('')}
          </div>
          ` : '<p style="color: #868e96; font-size: 12px;">Đang chờ dữ liệu từ nguồn...</p>'}
          <p class="update-time">
            ${station.timestamp ? 'Cập nhật: ' + new Date(station.timestamp || station.dateObserved).toLocaleString('vi-VN') : ''}
          </p>
          ${station.sourceType !== 'official' ? `
          <p style="font-size: 11px; color: #868e96; margin-top: 4px;">
            ${station.sourceType === 'external-mqtt' ? '📡 Dữ liệu từ MQTT broker' : '🌐 Dữ liệu từ API bên ngoài'}
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
      currentMarkers.add(marker);
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
