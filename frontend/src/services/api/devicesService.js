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
 * Devices API Service
 * Service layer cho Devices endpoints (openapi (1).yaml)
 * 
 * Endpoints:
 * - GET /api/devices          → getAll()
 * - PUT /api/devices/{id}     → update(id, data)
 * - DELETE /api/devices/{id}  → remove(id)
 */

import { coreApiAxios } from './axiosInstance';

// ============================================
// DATA TRANSFORMATION
// ============================================

/**
 * Transform device data từ backend → frontend format
 * Backend response fields: deviceId, deviceName, type, observedProperty, featureOfInterest, location, status, description
 * Keep backend field names as-is for display
 */
const transformDevice = (device) => {
  if (!device) return null;

  return {
    id: device.id,
    deviceId: device.deviceId, // Keep backend field
    deviceName: device.deviceName, // Keep backend field
    type: device.type,
    status: device.status,
    observedProperty: device.observedProperty, // New field from backend
    featureOfInterest: device.featureOfInterest, // New field from backend
    location: device.location, // Keep GeoJSON format as-is
    description: device.description, // Keep backend field
    createdAt: device.createdAt,
    updatedAt: device.updatedAt,
    _raw: device, // Keep original for debugging
  };
};

/**
 * Transform array of devices
 */
const transformDeviceArray = (devices) => {
  if (!Array.isArray(devices)) return [];
  return devices.map(transformDevice);
};

/**
 * Transform frontend device data → backend format for create/update
 * Maps UI fields to backend API schema
 */
const transformDeviceToBackend = (device) => {
  const backendDevice = {
    deviceName: device.deviceName || device.name,
    type: device.type,
    status: device.status,
    observedProperty: device.observedProperty || 'AirQuality',
    featureOfInterest: device.featureOfInterest || 'urn:ngsi-ld:Air:urban-hanoi',
    description: device.description || '',
  };

  // Transform location if provided
  if (device.location) {
    backendDevice.location = {
      type: 'Point',
      coordinates: device.location.coordinates || [
        device.location.lng || 105.852,
        device.location.lat || 21.034,
      ],
    };
  }

  return backendDevice;
};

// ============================================
// API METHODS
// ============================================

/**
 * Get all devices
 * @param {boolean} transform - Transform to frontend format (default: true)
 * @returns {Promise<array>} Array of devices
 */
export const getAll = async (transform = true) => {
  console.log('🔍 [DevicesService] coreApiAxios.defaults.baseURL:', coreApiAxios.defaults.baseURL);
  console.log('🔍 [DevicesService] Full URL will be:', coreApiAxios.defaults.baseURL + '/api/Devices');
  const data = await coreApiAxios.get('/api/Devices');
  return transform ? transformDeviceArray(data) : data;
};

/**
 * Alias for getAll (for hook compatibility)
 */
export const getAllDevices = async (params = {}) => {
  return await getAll(true);
};

/**
 * Get device by ID
 * @param {string} id - Device ID
 * @returns {Promise<object>} Device data
 */
export const getDeviceById = async (id) => {
  const data = await coreApiAxios.get(`/api/Devices/${id}`);
  return transformDevice(data);
};

/**
 * Create new device
 * @param {object} deviceData - Device data
 * @returns {Promise<object>} Created device
 */
export const createDevice = async (deviceData) => {
  const backendData = transformDeviceToBackend(deviceData);
  const data = await coreApiAxios.post('/api/Devices', backendData);
  return transformDevice(data);
};

/**
 * Update device by ID
 * @param {string} id - Device ID
 * @param {object} deviceData - Device data to update
 * @param {boolean} transform - Transform response to frontend format (default: true)
 * @returns {Promise<object>} Updated device
 */
export const updateDevice = async (id, deviceData) => {
  return await update(id, deviceData, true);
};

/**
 * Update device by ID
 * @param {string} id - Device ID
 * @param {object} deviceData - Device data to update
 * @param {boolean} transform - Transform response to frontend format (default: true)
 * @returns {Promise<object>} Updated device
 */
export const update = async (id, deviceData, transform = true) => {
  const backendData = transformDeviceToBackend(deviceData);
  const data = await coreApiAxios.put(`/api/Devices/${id}`, backendData);
  return transform ? transformDevice(data) : data;
};

/**
 * Delete device by ID
 * @param {string} id - Device ID
 * @returns {Promise<void>}
 */
export const remove = async (id) => {
  await coreApiAxios.delete(`/api/Devices/${id}`);
};

/**
 * Alias for remove (for hook compatibility)
 */
export const deleteDevice = async (id) => {
  return await remove(id);
};

/**
 * Update device status
 * @param {string} id - Device ID
 * @param {string} status - New status ('active' or 'inactive')
 * @returns {Promise<object>} Response with message and status
 */
export const updateDeviceStatus = async (id, status) => {
  const response = await coreApiAxios.put(`/api/Devices/${id}/status`, {
    status
  });
  
  console.log('🔄 [DevicesService] updateDeviceStatus response:', response);
  
  return {
    success: true,
    message: response.message || 'Cập nhật trạng thái thành công',
    status: response.status
  };
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get device status color
 * @param {string} status - Device status
 * @returns {object} Status info with color
 */
export const getStatusInfo = (status) => {
  const statusMap = {
    active: { label: 'Hoạt động', color: '#4CAF50', icon: '✅' },
    inactive: { label: 'Không hoạt động', color: '#9E9E9E', icon: '⚫' },
    maintenance: { label: 'Bảo trì', color: '#FF9800', icon: '🔧' },
    error: { label: 'Lỗi', color: '#f44336', icon: '❌' },
  };

  return statusMap[status?.toLowerCase()] || statusMap.inactive;
};

/**
 * Get device type info
 * @param {string} type - Device type
 * @returns {object} Type info with icon
 */
export const getTypeInfo = (type) => {
  const typeMap = {
    sensor: { label: 'Cảm biến', icon: '📡' },
    gateway: { label: 'Gateway', icon: '🌐' },
    controller: { label: 'Bộ điều khiển', icon: '🎛️' },
    monitor: { label: 'Màn hình', icon: '📺' },
  };

  return typeMap[type?.toLowerCase()] || { label: type, icon: '🔌' };
};

/**
 * Filter devices by status
 * @param {array} devices - Array of devices
 * @param {string} status - Status to filter
 * @returns {array} Filtered devices
 */
export const filterByStatus = (devices, status) => {
  if (!status || status === 'all') return devices;
  return devices.filter(device => device.status?.toLowerCase() === status.toLowerCase());
};

/**
 * Filter devices by type
 * @param {array} devices - Array of devices
 * @param {string} type - Type to filter
 * @returns {array} Filtered devices
 */
export const filterByType = (devices, type) => {
  if (!type || type === 'all') return devices;
  return devices.filter(device => device.type?.toLowerCase() === type.toLowerCase());
};

/**
 * Calculate device statistics
 * @param {array} devices - Array of devices
 * @returns {object} Statistics
 */
export const getStatistics = (devices) => {
  if (!Array.isArray(devices)) return null;

  const stats = {
    total: devices.length,
    byStatus: {},
    byType: {},
  };

  devices.forEach(device => {
    // Count by status
    const status = device.status?.toLowerCase() || 'unknown';
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

    // Count by type
    const type = device.type?.toLowerCase() || 'unknown';
    stats.byType[type] = (stats.byType[type] || 0) + 1;
  });

  return stats;
};

// Default export
const devicesService = {
  // Original methods
  getAll,
  update,
  remove,
  
  // Hook-compatible aliases
  getAllDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  updateDeviceStatus,
  
  // Helpers
  getStatusInfo,
  getTypeInfo,
  filterByStatus,
  filterByType,
  getStatistics,
};

export default devicesService;
