// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

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
 * Backend: GeoJsonPoint schema với location.coordinates
 * Frontend: Simplified format với lat, lng
 */
const transformDevice = (device) => {
  if (!device) return null;

  return {
    id: device.id,
    name: device.name,
    type: device.type,
    status: device.status,
    location: {
      lat: device.location?.coordinates?.[1] || 0, // GeoJSON: [lng, lat]
      lng: device.location?.coordinates?.[0] || 0,
      address: device.location?.address || '',
    },
    lastActive: device.lastActive,
    metadata: device.metadata || {},
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
 * Transform frontend device data → backend format
 * Frontend: { lat, lng }
 * Backend: GeoJsonPoint { coordinates: [lng, lat] }
 */
const transformDeviceToBackend = (device) => {
  const backendDevice = {
    name: device.name,
    type: device.type,
    status: device.status,
    metadata: device.metadata || {},
  };

  // Transform location if provided
  if (device.location) {
    backendDevice.location = {
      type: 'Point',
      coordinates: [
        device.location.lng || 0,
        device.location.lat || 0,
      ],
      address: device.location.address || '',
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
  
  // Helpers
  getStatusInfo,
  getTypeInfo,
  filterByStatus,
  filterByType,
  getStatistics,
};

export default devicesService;
