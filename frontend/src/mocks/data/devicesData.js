// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

/**
 * Devices Mock Data Generator
 * Based on openapi (1).yaml specs
 */

import { HANOI_LOCATIONS } from './airQualityData';

const randomChoice = (array) => array[Math.floor(Math.random() * array.length)];

// ============================================
// DEVICE TYPES & PROPERTIES
// ============================================

const DEVICE_TYPES = [
  'AirQualitySensor',
  'TemperatureSensor',
  'HumiditySensor',
  'PressureSensor',
  'WindSensor',
];

const OBSERVED_PROPERTIES = [
  'AirQuality',
  'Temperature',
  'Humidity',
  'Pressure',
  'WindSpeed',
];

const DEVICE_STATUS = ['active', 'inactive', 'maintenance'];

// ============================================
// GENERATE DEVICE
// ============================================

/**
 * Generate một device theo OpenAPI schema
 * @param {object} options - Options
 * @returns {object} Device object
 */
export const generateDevice = (options = {}) => {
  const location = options.location || randomChoice(HANOI_LOCATIONS);
  const deviceType = options.type || randomChoice(DEVICE_TYPES);
  const index = options.index !== undefined ? options.index : Math.floor(Math.random() * 1000);
  const id = options.id || `device-${String(index).padStart(3, '0')}`; // Fixed format: device-001, device-002, etc.
  
  return {
    id: id,
    deviceId: `urn:ngsi-ld:Device:${id}`,
    deviceName: options.deviceName || `${deviceType} ${location.name}`,
    type: deviceType,
    observedProperty: options.observedProperty || randomChoice(OBSERVED_PROPERTIES),
    featureOfInterest: `urn:ngsi-ld:Air:urban-hanoi-${location.name}`,
    
    // GeoJsonPoint format
    location: {
      type: 'Point',
      coordinates: location.coordinates
    },
    
    status: options.status || randomChoice(DEVICE_STATUS),
    description: options.description || `IoT sensor deployed in ${location.name} district for environmental monitoring.`,
  };
};

// ============================================
// GENERATE MULTIPLE DEVICES
// ============================================

/**
 * Generate array of devices
 * @param {number} count - Number of devices
 * @returns {array} Array of devices
 */
export const generateDevices = (count = 10) => {
  const devices = [];
  
  HANOI_LOCATIONS.forEach((location, index) => {
    if (index < count) {
      devices.push(generateDevice({ location, index: index + 1 })); // Pass index for fixed IDs
    }
  });
  
  // Fill remaining if needed
  while (devices.length < count) {
    devices.push(generateDevice({ index: devices.length + 1 }));
  }
  
  return devices;
};

// ============================================
// MOCK DEVICES DATABASE
// ============================================

// Pre-generated devices cho consistency
export const MOCK_DEVICES = generateDevices(8);

// Export default
const devicesMockData = {
  generateDevice,
  generateDevices,
  MOCK_DEVICES,
  DEVICE_TYPES,
  DEVICE_STATUS,
};

export default devicesMockData;
