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
 * Services Index
 * Central export point for all services
 * 
 * USAGE:
 * import { airQualityService, devicesService } from '@/services';
 */

// ============================================
// CONFIGURATION
// ============================================
export { default as apiConfig } from './config/apiConfig';
export { default as wsConfig } from './config/wsConfig';

export {
  AIR_QUALITY_ENDPOINTS,
  DEVICES_ENDPOINTS,
  USERS_ENDPOINTS,
  CONTRIBUTIONS_ENDPOINTS,
  STATIONS_ENDPOINTS,
  EXTERNAL_SOURCES_ENDPOINTS,
  EXTERNAL_MQTT_ENDPOINTS,
  API_CONFIG,
  buildUrl,
  logApiRequest,
  logApiResponse,
} from './config/apiConfig';

export {
  WS_ENDPOINTS,
  WS_EVENTS,
  WS_CONFIG,
  getWebSocketUrl,
  logWsEvent,
  isWebSocketEnabled,
} from './config/wsConfig';

// ============================================
// API SERVICES
// ============================================
export { default as axiosInstances } from './api/axiosInstance';
export { default as errorHandler } from './api/errorHandler';
export { default as airQualityService } from './api/airQualityService';

export {
  airQualityAxios,
  coreApiAxios,
  get,
  post,
  put,
  del,
} from './api/axiosInstance';

export {
  ERROR_TYPES,
  ERROR_MESSAGES,
  normalizeError,
  logError,
  handleApiError,
  isNetworkError,
  isTimeoutError,
  isServerError,
  isUnauthorized,
  isNotFound,
} from './api/errorHandler';

export {
  getAll as getAirQualityAll,
  getLatest as getAirQualityLatest,
  getHistory as getAirQualityHistory,
  postIotData,
  downloadAirQuality,
  downloadHistory as downloadAirQualityHistory,
  transformAirQualityData,
  transformAirQualityArray,
  getAQIColor,
  getAQILevel,
  calculateAverageAQI,
  getDateRange,
} from './api/airQualityService';

// ============================================
// DEVICES SERVICE (Phase 4)
// ============================================
export { default as devicesService } from './api/devicesService';

export {
  getAll as getDevicesAll,
  update as updateDevice,
  remove as removeDevice,
  updateDeviceStatus,
  getDeviceById,
  getStatusInfo as getDeviceStatusInfo,
  getTypeInfo as getDeviceTypeInfo,
  filterByStatus as filterDevicesByStatus,
  filterByType as filterDevicesByType,
  getStatistics as getDevicesStatistics,
} from './api/devicesService';

// ============================================
// USERS SERVICE (Phase 4)
// ============================================
export { default as usersService } from './api/usersService';

export {
  getAll as getUsersAll,
  signup,
  login,
  logout,
  verifyEmail,
  remove as removeUser,
  saveToken,
  getToken,
  removeToken,
  saveUser,
  getUser,
  isAuthenticated,
  isAdmin,
  getRoleInfo,
  validateEmail,
  validatePassword,
  filterByRole as filterUsersByRole,
  getStatistics as getUsersStatistics,
} from './api/usersService';

// ============================================
// CONTRIBUTIONS SERVICE
// ============================================
export { default as contributionsService } from './api/contributionsService';

export {
  uploadFile as uploadContributionFile,
  validateJsonStructure,
  formatContribution,
  getPublicStats as getContributionsPublicStats,
  getContributionList,
  getLatestByContributionId,
  downloadContribution,
} from './api/contributionsService';

// ============================================
// STATIONS SERVICE (NEW)
// ============================================
export { default as stationsService } from './api/stationsService';

export {
  getAll as getStationsAll,
  getForMap as getStationsForMap,
  getStationData,
  transformStation,
  transformStations,
  getActiveStations,
  filterByType as filterStationsByType,
  findStationById,
  groupByType as groupStationsByType,
} from './api/stationsService';

// ============================================
// EXTERNAL HTTP SOURCES SERVICE (NEW)
// ============================================
export { default as externalSourcesService } from './api/externalSourcesService';

export {
  getAll as getExternalSourcesAll,
  create as createExternalSource,
  deleteSource as deleteExternalSource,
  reactivate as reactivateExternalSource,
  testUrl as testExternalUrl,
  transformSource,
  transformSources,
  transformSourceToBackend,
  validateSourceData,
  getActiveSources as getActiveExternalSources,
  getSourcesWithErrors,
  findSourceById as findExternalSourceById,
} from './api/externalSourcesService';

// ============================================
// EXTERNAL MQTT SOURCES SERVICE (NEW)
// ============================================
export { default as externalMqttService } from './api/externalMqttService';

export {
  getAll as getExternalMqttAll,
  getById as getExternalMqttById,
  create as createExternalMqtt,
  update as updateExternalMqtt,
  deleteSource as deleteExternalMqtt,
  updateOpenAQLocation,
  activate as activateExternalMqtt,
  deactivate as deactivateExternalMqtt,
  testConnection as testMqttConnection,
  transformMqttSource,
  transformMqttSources,
  transformMqttToBackend,
  validateMqttData,
  getActiveSources as getActiveMqttSources,
  getTlsSources,
  findSourceById as findMqttSourceById,
  groupByStatus as groupMqttByStatus,
} from './api/externalMqttService';

// ============================================
// WEBSOCKET SERVICES (Phase 5)
// ============================================
export { default as WebSocketManager } from './websocket/WebSocketManager';
export { default as airQualityWebSocket } from './websocket/airQualityWebSocket';
