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
// API SERVICES (Will be added in Phase 2-4)
// ============================================
// export { default as axiosInstance } from './api/axiosInstance';
// export { default as airQualityService } from './api/airQualityService';
// export { default as devicesService } from './api/devicesService';
// export { default as usersService } from './api/usersService';

// ============================================
// WEBSOCKET SERVICES (Will be added in Phase 5)
// ============================================
// export { default as WebSocketManager } from './websocket/WebSocketManager';
// export { default as airQualityWS } from './websocket/airQualityWS';
