// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

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
  transformAirQualityData,
  transformAirQualityArray,
  getAQILevel,
  calculateAverageAQI,
  getDateRange,
} from './api/airQualityService';

// Will be added in Phase 4:
// export { default as devicesService } from './api/devicesService';
// export { default as usersService } from './api/usersService';

// ============================================
// WEBSOCKET SERVICES (Will be added in Phase 5)
// ============================================
// export { default as WebSocketManager } from './websocket/WebSocketManager';
// export { default as airQualityWS } from './websocket/airQualityWS';
