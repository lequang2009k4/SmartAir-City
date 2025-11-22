// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Custom hook to initialize and manage a Leaflet map
 * Uses pure Leaflet (BSD-2-Clause) for full OSI-compliance
 * 
 * @param {Object} options - Map configuration options
 * @param {Array} options.center - Initial map center [lat, lng]
 * @param {number} options.zoom - Initial zoom level
 * @param {boolean} options.scrollWheelZoom - Enable scroll wheel zoom (default: true)
 * @returns {Object} { mapRef, mapInstance } - Refs to the map container and Leaflet instance
 */
const useLeafletMap = ({ center = [21.0285, 105.8542], zoom = 12, scrollWheelZoom = true } = {}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // Prevent re-initialization if map already exists
    if (mapInstanceRef.current) return;

    // Initialize Leaflet map
    const map = L.map(mapRef.current, {
      center,
      zoom,
      scrollWheelZoom,
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Fix Leaflet default icon issue with Webpack
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      iconUrl: require('leaflet/dist/images/marker-icon.png'),
      shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    });

    mapInstanceRef.current = map;

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, scrollWheelZoom]);

  return {
    mapRef,
    mapInstance: mapInstanceRef.current,
  };
};

export default useLeafletMap;
