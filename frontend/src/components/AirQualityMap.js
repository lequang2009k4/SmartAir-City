// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getAQIColor, getAQILevel } from '../data/mockData';
import { useAirQuality } from '../hooks';
import './AirQualityMap.css';

// Fix Leaflet default icon issue with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const AirQualityMap = ({ stations: stationsProp, onStationClick }) => {
  const [center] = useState([21.0285, 105.8542]); // Hanoi center
  const [zoom] = useState(12);

  // Use the hook for realtime data
  const { latestData, isLoading, error, isConnected } = useAirQuality({
    enableWebSocket: true, // Enable realtime updates
  });

  // Use prop data if provided, otherwise use hook data
  const stations = stationsProp || latestData;

  console.log('🗺️ [AirQualityMap] Render:', {
    stationsProp: stationsProp?.length || 0,
    latestData: latestData?.length || 0,
    stations: stations?.length || 0,
    isLoading,
    isConnected
  });

  // Log connection status
  useEffect(() => {
    if (isConnected) {
      console.log('🗺️ Map connected to realtime data');
    }
  }, [isConnected]);

  // Create custom icon based on AQI level
  const createCustomIcon = (aqi) => {
    const color = getAQIColor(aqi);
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
        color: white;
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
      
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {stations && stations.map((station, index) => (
          <Marker
            key={station.id || index}
            position={[station.location?.lat || station.location?.coordinates?.[1], 
                       station.location?.lng || station.location?.coordinates?.[0]]}
            icon={createCustomIcon(station.aqi)}
            eventHandlers={{
              click: () => onStationClick && onStationClick(station)
            }}
          >
            <Popup>
              <div className="popup-content">
                <h3>{station.name}</h3>
                <div className="aqi-badge" style={{ backgroundColor: getAQIColor(station.aqi) }}>
                  AQI: {Math.round(station.aqi)}
                </div>
                <p className="aqi-level">{getAQILevel(station.aqi)}</p>
                <div className="popup-details">
                  <p><strong>PM2.5:</strong> {station.pm25} µg/m³</p>
                  <p><strong>PM10:</strong> {station.pm10} µg/m³</p>
                  <p><strong>CO:</strong> {station.co} ppm</p>
                  <p><strong>Nhiệt độ:</strong> {station.temperature}°C</p>
                  <p><strong>Độ ẩm:</strong> {station.humidity}%</p>
                </div>
                <p className="update-time">
                  Cập nhật: {new Date(station.timestamp).toLocaleString('vi-VN')}
                </p>
                {isConnected && (
                  <p style={{ 
                    fontSize: '11px', 
                    color: '#51cf66', 
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    🟢 Realtime
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default AirQualityMap;
