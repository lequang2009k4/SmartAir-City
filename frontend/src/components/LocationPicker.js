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
// open-data services and smart-city applications. tAir City Open Source Project

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LocationPicker.css';

/**
 * LocationPicker Component
 * Interactive Leaflet map to pick location coordinates
 * 
 * @param {Object} props
 * @param {number} props.latitude - Initial latitude
 * @param {number} props.longitude - Initial longitude
 * @param {Function} props.onChange - Callback when location changes: (lat, lng) => {}
 * @param {number} props.zoom - Initial zoom level (default: 13)
 */
const LocationPicker = ({ latitude, longitude, onChange, zoom = 13 }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  
  const [currentPosition, setCurrentPosition] = useState({
    lat: latitude || 21.0285,
    lng: longitude || 105.8542
  });

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current) return; // Already initialized

    // Fix Leaflet default marker icon issue
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      iconUrl: require('leaflet/dist/images/marker-icon.png'),
      shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    });

    const map = L.map(mapRef.current, {
      center: [currentPosition.lat, currentPosition.lng],
      zoom: zoom,
      scrollWheelZoom: true,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create draggable marker
    const marker = L.marker([currentPosition.lat, currentPosition.lng], {
      draggable: true,
      autoPan: true,
    }).addTo(map);

    // Update position on drag
    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      setCurrentPosition({ lat, lng });
      if (onChange) onChange(lat, lng);
    });

    // Click on map to move marker
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setCurrentPosition({ lat, lng });
      if (onChange) onChange(lat, lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Update marker position when props change
  useEffect(() => {
    if (!markerRef.current || !mapInstanceRef.current) return;
    
    const newLat = latitude || 21.0285;
    const newLng = longitude || 105.8542;
    
    markerRef.current.setLatLng([newLat, newLng]);
    mapInstanceRef.current.panTo([newLat, newLng]);
    setCurrentPosition({ lat: newLat, lng: newLng });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]); // Only update when lat/lng props change

  return (
    <div className="location-picker">
      <div className="location-picker-map" ref={mapRef}></div>
      <div className="location-picker-info">
        <span className="location-coords">
          📍 {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
        </span>
        <span className="location-hint">
          💡 Click vào bản đồ hoặc kéo marker để chọn vị trí
        </span>
      </div>
    </div>
  );
};

export default LocationPicker;
