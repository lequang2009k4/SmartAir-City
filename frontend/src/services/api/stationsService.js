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

/**
 * Stations API Service
 * Service layer for Stations endpoints
 */

import { airQualityAxios } from './axiosInstance';
import { STATIONS_ENDPOINTS } from '../config/apiConfig';
import { normalizeError, logError } from './errorHandler';

// ============================================
// DATA TRANSFORMATION
// ============================================

/**
 * Transform station data from backend to frontend format
 * @param {object} station - Raw station data from API
 * @returns {object} Transformed station data
 */
export const transformStation = (station) => {
  if (!station) return null;

  return {
    stationId: station.stationId,
    name: station.name,
    type: station.type, // 'official', 'external-http', 'external-mqtt'
    latitude: station.latitude,
    longitude: station.longitude,
    isActive: station.isActive,
    lastDataAt: station.lastDataAt,
    
    // Additional metadata
    location: {
      type: 'Point',
      coordinates: [station.longitude, station.latitude],
      lat: station.latitude,
      lng: station.longitude,
    },
    
    // Raw data for debugging
    _raw: station,
  };
};

/**
 * Transform array of stations
 * @param {array} stations - Array of station objects
 * @returns {array} Transformed stations
 */
export const transformStations = (stations) => {
  if (!Array.isArray(stations)) return [];
  return stations.map(transformStation).filter(Boolean);
};

// ============================================
// API METHODS
// ============================================

/**
 * Get all stations from all sources (official + external)
 * @param {string|null} type - Filter by type: 'official', 'external-http', 'external-mqtt'
 * @param {boolean} transform - Transform to frontend format (default: true)
 * @returns {Promise<array>} Array of stations
 */
export const getAll = async (type = null, transform = true) => {
  try {
    const params = type ? { type } : {};
    
    console.log('📍 [stationsService] Fetching all stations...', { type });
    
    const response = await airQualityAxios.get(STATIONS_ENDPOINTS.GET_ALL, { params });
    
    console.log('✅ [stationsService] Stations received:', {
      total: response?.length || 0,
      type,
    });
    
    return transform ? transformStations(response) : response;
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, 'Get All Stations');
    
    console.error('❌ [stationsService] Error fetching stations:', normalizedError.message);
    
    throw normalizedError;
  }
};

/**
 * Get stations formatted for map display
 * Returns minimal data optimized for map visualization
 * @returns {Promise<array>} Array of stations with minimal data
 */
export const getForMap = async () => {
  try {
    console.log('🗺️ [stationsService] Fetching stations for map...');
    
    const response = await airQualityAxios.get(STATIONS_ENDPOINTS.GET_FOR_MAP);
    
    console.log('✅ [stationsService] Map stations received:', {
      total: response?.length || 0,
    });
    
    // Backend already returns optimized format for map
    return response;
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, 'Get Stations For Map');
    
    console.error('❌ [stationsService] Error fetching map stations:', normalizedError.message);
    
    throw normalizedError;
  }
};

/**
 * Get air quality data for a specific station
 * @param {string} stationId - Station ID
 * @param {number} limit - Number of records to retrieve (default: 50)
 * @returns {Promise<object>} Station data response
 */
export const getStationData = async (stationId, limit = 50) => {
  try {
    if (!stationId) {
      throw new Error('Station ID is required');
    }
    
    const params = { limit };
    
    console.log(`📊 [stationsService] Fetching data for station ${stationId}...`, { limit });
    
    const response = await airQualityAxios.get(
      STATIONS_ENDPOINTS.GET_STATION_DATA(stationId),
      { params }
    );
    
    console.log('✅ [stationsService] Station data received:', {
      stationId,
      records: response?.length || 0,
    });
    
    return response;
  } catch (error) {
    const normalizedError = error.type ? error : normalizeError(error);
    logError(normalizedError, `Get Station Data: ${stationId}`);
    
    console.error('❌ [stationsService] Error fetching station data:', normalizedError.message);
    
    throw normalizedError;
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Filter stations by active status
 * @param {array} stations - Array of stations
 * @returns {array} Active stations only
 */
export const getActiveStations = (stations) => {
  return stations.filter(station => station.isActive);
};

/**
 * Filter stations by type
 * @param {array} stations - Array of stations
 * @param {string} type - Type to filter ('official', 'external-http', 'external-mqtt')
 * @returns {array} Filtered stations
 */
export const filterByType = (stations, type) => {
  return stations.filter(station => station.type === type);
};

/**
 * Get station by ID
 * @param {array} stations - Array of stations
 * @param {string} stationId - Station ID to find
 * @returns {object|null} Found station or null
 */
export const findStationById = (stations, stationId) => {
  return stations.find(station => station.stationId === stationId) || null;
};

/**
 * Group stations by type
 * @param {array} stations - Array of stations
 * @returns {object} Grouped stations { official: [], 'external-http': [], 'external-mqtt': [] }
 */
export const groupByType = (stations) => {
  return stations.reduce((groups, station) => {
    const type = station.type || 'unknown';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(station);
    return groups;
  }, {});
};

// ============================================
// EXPORT DEFAULT
// ============================================
const stationsService = {
  getAll,
  getForMap,
  getStationData,
  transformStation,
  transformStations,
  // Helper functions
  getActiveStations,
  filterByType,
  findStationById,
  groupByType,
};

export default stationsService;
