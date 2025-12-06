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
 * Air Quality API Mock Handlers
 * Mock tất cả endpoints từ openapi.yaml
 */

import { http, HttpResponse } from 'msw';
import {
  generateAirQualityRecords,
  getLatestAirQualityRecord,
  generateHistoricalData,
} from '../data/airQualityData';

const BASE_URL = 'http://localhost:5182';

// ============================================
// AIR QUALITY HANDLERS
// ============================================

export const airQualityHandlers = [
  // GET /api/airquality - List all (with optional limit)
  http.get(`${BASE_URL}/api/airquality`, ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    
    console.log(`[MSW] GET /api/airquality?limit=${limit}`);
    
    const records = generateAirQualityRecords(limit);
    
    return HttpResponse.json(records, { status: 200 });
  }),

  // GET /api/airquality/latest - Get latest record
  http.get(`${BASE_URL}/api/airquality/latest`, () => {
    console.log('[MSW] GET /api/airquality/latest');
    
    const latestRecord = getLatestAirQualityRecord();
    
    return HttpResponse.json(latestRecord, { status: 200 });
  }),

  // GET /api/airquality/history - Get historical data
  http.get(`${BASE_URL}/api/airquality/history`, ({ request }) => {
    const url = new URL(request.url);
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');
    
    console.log(`[MSW] GET /api/airquality/history?from=${fromParam}&to=${toParam}`);
    
    // Validate params
    if (!fromParam || !toParam) {
      return HttpResponse.json(
        { message: 'Thiếu tham số from hoặc to' },
        { status: 400 }
      );
    }
    
    // Parse dates
    let fromDate = new Date(fromParam);
    let toDate = new Date(toParam);
    
    // Auto-adjust time if only date provided
    if (fromParam.length === 10) { // YYYY-MM-DD
      fromDate.setHours(0, 0, 0, 0);
    }
    if (toParam.length === 10) {
      toDate.setHours(23, 59, 59, 999);
    }
    
    // Validate date range
    if (fromDate >= toDate) {
      return HttpResponse.json(
        { message: "Thời gian 'from' phải nhỏ hơn 'to'." },
        { status: 400 }
      );
    }
    
    // Generate historical data (1 record per hour)
    const records = generateHistoricalData(fromDate, toDate, 60);
    
    return HttpResponse.json(records, { status: 200 });
  }),

  // POST /api/iot-data - IoT data ingest (admin only)
  http.post(`${BASE_URL}/api/iot-data`, async ({ request }) => {
    console.log('[MSW] POST /api/iot-data');
    
    const body = await request.json();
    
    // Validate basic NGSI-LD structure
    if (!body.location || !body.dateObserved) {
      return HttpResponse.json(
        { message: 'Payload IoT không hợp lệ (JSON-LD NGSI-LD).' },
        { status: 400 }
      );
    }
    
    // Mock success response
    return HttpResponse.json(
      {
        message: '✅ Đã nhận & lưu IoT JSON-LD',
        id: body.id || `urn:ngsi-ld:AirQualityObserved:mock-${Date.now()}`
      },
      { status: 200 }
    );
  }),
];

export default airQualityHandlers;
