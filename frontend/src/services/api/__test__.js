// SmartAir City – IoT Platform for Urban Air Quality Monitoring
// based on NGSI-LD and FiWARE Standards

// SPDX-License-Identifier: MIT
// @version   0.1.x
// @author    SmartAir City Team <smartaircity@gmail.com>
// @copyright © 2025 SmartAir City Team. 
// @license   MIT License
// @see       https://github.com/lequang2009k4/SmartAir-City   SmartAir City Open Source Project

// This software is an open-source component of the SmartAir City initiative.
// It provides real-time environmental monitoring, NGSI-LD–compliant data
// models, MQTT-based data ingestion, and FiWARE Smart Data Models for
// open-data services and smart-city applications.

/**
 * Test Axios Instance
 * Run this file to verify axios setup works correctly
 * 
 * Usage:
 * 1. Start backend server (ports 5182, 5183)
 * 2. Run: node src/services/api/__test__.js
 */

import { airQualityAxios, coreApiAxios } from './axiosInstance.js';

console.log('='.repeat(60));
console.log('🧪 AXIOS INSTANCE TEST');
console.log('='.repeat(60));

// ============================================
// TEST 1: Air Quality API
// ============================================
console.log('\n📡 Test 1: Air Quality API (GET /api/airquality/latest)');
console.log('Expected: Backend running on port 5182');

airQualityAxios.get('/api/airquality/latest')
  .then(data => {
    console.log('✅ SUCCESS! Response:');
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.log('❌ ERROR:');
    console.log('  Type:', error.type);
    console.log('  Message:', error.message);
    console.log('  Status:', error.status);
    
    if (error.type === 'NETWORK_ERROR') {
      console.log('\n💡 Tip: Backend chưa chạy. Start backend server trước!');
    }
  });

// ============================================
// TEST 2: Core API
// ============================================
console.log('\n📡 Test 2: Core API (GET /api/Devices)');
console.log('Expected: Backend running on port 5183');

// Delay 1s để không conflict với test 1
setTimeout(() => {
  coreApiAxios.get('/api/Devices')
    .then(data => {
      console.log('✅ SUCCESS! Response:');
      console.log(JSON.stringify(data, null, 2));
    })
    .catch(error => {
      console.log('❌ ERROR:');
      console.log('  Type:', error.type);
      console.log('  Message:', error.message);
      console.log('  Status:', error.status);
      
      if (error.type === 'NETWORK_ERROR') {
        console.log('\n💡 Tip: Backend chưa chạy. Start backend server trước!');
      }
    });
}, 1000);

// ============================================
// TEST 3: Error Handling
// ============================================
console.log('\n📡 Test 3: Error Handling (GET /api/nonexistent)');

setTimeout(() => {
  airQualityAxios.get('/api/nonexistent')
    .then(data => {
      console.log('✅ Response:', data);
    })
    .catch(error => {
      console.log('✅ Error handled correctly:');
      console.log('  Type:', error.type);
      console.log('  Message:', error.message);
      console.log('  Status:', error.status);
    });
}, 2000);

console.log('\n' + '='.repeat(60));
console.log('⏳ Running tests... (check output above)');
console.log('='.repeat(60) + '\n');
