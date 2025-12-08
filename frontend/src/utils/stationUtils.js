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
 * Station utilities for consistent station ID handling
 */

/**
 * Normalize station ID to dashboard format
 * Converts backend format (station-oceanpark) to frontend format (hanoi-oceanpark)
 * 
 * @param {string} stationId - Station ID from backend or NGSI-LD ID
 * @returns {string|null} - Normalized station ID or null if invalid
 */
export const normalizeStationId = (stationId) => {
  if (!stationId) return null;
  
  // Remove "station-" prefix if present
  const id = stationId.toLowerCase().replace('station-', '');
  
  // Map station names to dashboard format
  const mapping = {
    'oceanpark': 'hanoi-oceanpark',
    'nguyenvancu': 'hanoi-nguyenvancu',
    'congvien-hodh': 'hanoi-congvien-hodh',
    'congvienhodh': 'hanoi-congvien-hodh',  // Backend variation without dash
    'cmt8': 'hcm-cmt8',
    'carecentre': 'hcm-carecentre',
    'care-centre': 'hcm-carecentre'
  };
  
  return mapping[id] || stationId; // Return original if no mapping found
};

/**
 * Extract station ID from NGSI-LD entity ID
 * Example: "urn:ngsi-ld:AirQualityObserved:station-oceanpark:20251209040941" -> "hanoi-oceanpark"
 * 
 * @param {string} ngsiId - NGSI-LD entity ID
 * @returns {string|null} - Extracted and normalized station ID
 */
export const extractStationIdFromNgsiId = (ngsiId) => {
  if (!ngsiId || typeof ngsiId !== 'string') return null;
  
  // Pattern: urn:ngsi-ld:AirQualityObserved:station-xxx:timestamp
  const match = ngsiId.match(/AirQualityObserved:([^:]+)/);
  if (match) {
    return normalizeStationId(match[1]);
  }
  
  return null;
};

/**
 * Get station display name from normalized station ID
 * 
 * @param {string} stationId - Normalized station ID (e.g., "hanoi-oceanpark")
 * @returns {string} - Display name
 */
export const getStationDisplayName = (stationId) => {
  const nameMap = {
    'hanoi-oceanpark': 'Hà Nội - Ocean Park',
    'hanoi-nguyenvancu': 'Hà Nội - Nguyễn Văn Cừ',
    'hanoi-congvien-hodh': 'Hà Nội - Công viên Hồ Điều Hòa',
    'hcm-cmt8': 'TP.HCM - CMT8',
    'hcm-carecentre': 'TP.HCM - Care Centre',
  };
  
  return nameMap[stationId] || stationId;
};

/**
 * List of all known stations
 */
export const KNOWN_STATIONS = [
  'hanoi-oceanpark',
  'hanoi-nguyenvancu',
  'hanoi-congvien-hodh',
  'hcm-cmt8',
  'hcm-carecentre'
];
