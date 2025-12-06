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
 * Devices API Mock Handlers
 * Mock tất cả endpoints từ openapi (1).yaml - Devices
 */

import { http, HttpResponse } from 'msw';
import { MOCK_DEVICES } from '../data/devicesData';

const BASE_URL = 'http://localhost:5183';

// In-memory database (mutable for testing CRUD)
let devicesDB = [...MOCK_DEVICES];

// ============================================
// DEVICES HANDLERS
// ============================================

export const devicesHandlers = [
  // GET /api/Devices - List all devices
  http.get(`${BASE_URL}/api/Devices`, () => {
    console.log('[MSW] GET /api/Devices');
    
    return HttpResponse.json(devicesDB, { status: 200 });
  }),

  // PUT /api/Devices/:id - Update device
  http.put(`${BASE_URL}/api/Devices/:id`, async ({ params, request }) => {
    const { id } = params;
    const updates = await request.json();
    
    console.log(`[MSW] PUT /api/Devices/${id}`);
    
    const index = devicesDB.findIndex(d => d.id === id);
    
    if (index === -1) {
      return HttpResponse.json(
        { message: 'Device not found' },
        { status: 404 }
      );
    }
    
    // Update device
    devicesDB[index] = {
      ...devicesDB[index],
      ...updates,
      id: id, // Preserve ID
    };
    
    return HttpResponse.json(devicesDB[index], { status: 200 });
  }),

  // DELETE /api/Devices/:id - Delete device
  http.delete(`${BASE_URL}/api/Devices/:id`, ({ params }) => {
    const { id } = params;
    
    console.log(`[MSW] DELETE /api/Devices/${id}`);
    
    const index = devicesDB.findIndex(d => d.id === id);
    
    if (index === -1) {
      return HttpResponse.json(
        { message: 'Device not found' },
        { status: 404 }
      );
    }
    
    // Remove device
    devicesDB.splice(index, 1);
    
    return HttpResponse.json(
      { message: 'Device deleted successfully' },
      { status: 200 }
    );
  }),
];

export default devicesHandlers;
