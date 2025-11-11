// © 2025 SmartAir City Team
// Test file để verify configuration
// Run: node src/services/config/__test__.js (trong terminal)

import {
  AIR_QUALITY_ENDPOINTS,
  DEVICES_ENDPOINTS,
  USERS_ENDPOINTS,
  API_CONFIG,
  buildUrl,
} from './apiConfig.js';

import {
  WS_ENDPOINTS,
  WS_EVENTS,
  WS_CONFIG,
} from './wsConfig.js';

console.log('='.repeat(60));
console.log('📡 API CONFIGURATION TEST');
console.log('='.repeat(60));

console.log('\n🌡️  AIR QUALITY ENDPOINTS:');
console.log('  - GET ALL:', AIR_QUALITY_ENDPOINTS.GET_ALL);
console.log('  - GET LATEST:', AIR_QUALITY_ENDPOINTS.GET_LATEST);
console.log('  - GET HISTORY:', AIR_QUALITY_ENDPOINTS.GET_HISTORY);

console.log('\n🔧 DEVICES ENDPOINTS:');
console.log('  - GET ALL:', DEVICES_ENDPOINTS.GET_ALL);
console.log('  - UPDATE (ID:123):', DEVICES_ENDPOINTS.UPDATE('123'));

console.log('\n👥 USERS ENDPOINTS:');
console.log('  - LOGIN:', USERS_ENDPOINTS.LOGIN);
console.log('  - SIGNUP:', USERS_ENDPOINTS.SIGNUP);

console.log('\n⚙️  GENERAL CONFIG:');
console.log('  - Environment:', API_CONFIG.ENV);
console.log('  - Timeout:', API_CONFIG.TIMEOUT, 'ms');
console.log('  - Auth Enabled:', API_CONFIG.ENABLE_AUTH);

console.log('\n🔌 WEBSOCKET CONFIG:');
console.log('  - Hub URL:', WS_ENDPOINTS.AIR_QUALITY_HUB);
console.log('  - WS URL:', WS_ENDPOINTS.AIR_QUALITY_WS);
console.log('  - Enabled:', WS_CONFIG.ENABLED);
console.log('  - Auto Reconnect:', WS_CONFIG.AUTO_RECONNECT);

console.log('\n📨 WEBSOCKET EVENTS:');
console.log('  - Subscribe:', WS_EVENTS.SUBSCRIBE);
console.log('  - New Data:', WS_EVENTS.NEW_DATA);

console.log('\n🔗 BUILD URL TEST:');
const testUrl = buildUrl(AIR_QUALITY_ENDPOINTS.GET_ALL, { limit: 50 });
console.log('  - With params:', testUrl);

console.log('\n' + '='.repeat(60));
console.log('✅ Configuration loaded successfully!');
console.log('='.repeat(60) + '\n');
