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
 * Users API Mock Handlers
 * Mock tất cả endpoints từ openapi (1).yaml - Users
 */

import { http, HttpResponse } from 'msw';
import { MOCK_USERS, mockLogin, mockSignup } from '../data/usersData';

const BASE_URL = 'http://localhost:5183';

// In-memory database
let usersDB = [...MOCK_USERS];

// ============================================
// USERS HANDLERS
// ============================================

export const usersHandlers = [
  // GET /api/Users - List all users
  http.get(`${BASE_URL}/api/Users`, () => {
    console.log('[MSW] GET /api/Users');
    
    // Don't return passwords
    const safeUsers = usersDB.map(({ pw, ...user }) => user);
    
    return HttpResponse.json(safeUsers, { status: 200 });
  }),

  // POST /api/Users/singup - Signup (note the typo in backend API)
  http.post(`${BASE_URL}/api/Users/singup`, async ({ request }) => {
    console.log('[MSW] POST /api/Users/singup');
    
    const body = await request.json();
    const { email, password, username } = body;
    
    if (!email || !password) {
      return HttpResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    const result = mockSignup(email, password, username);
    
    if (!result.success) {
      return HttpResponse.json(
        { message: result.error },
        { status: 400 }
      );
    }
    
    // Update DB
    usersDB = [...MOCK_USERS];
    
    return HttpResponse.json(result, { status: 200 });
  }),

  // POST /api/Users/login - Login
  http.post(`${BASE_URL}/api/Users/login`, async ({ request }) => {
    console.log('[MSW] POST /api/Users/login');
    
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return HttpResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    const result = mockLogin(email, password);
    
    if (!result.success) {
      return HttpResponse.json(
        { message: result.error },
        { status: 401 }
      );
    }
    
    return HttpResponse.json(result, { status: 200 });
  }),

  // POST /api/Users/email - Send email
  http.post(`${BASE_URL}/api/Users/email`, async ({ request }) => {
    console.log('[MSW] POST /api/Users/email');
    
    const body = await request.json();
    const { email, message, subject } = body;
    
    if (!email || !message) {
      return HttpResponse.json(
        { message: 'Email and message are required' },
        { status: 400 }
      );
    }
    
    // Mock success
    return HttpResponse.json(
      {
        success: true,
        message: `Email sent to ${email}`,
        subject: subject || 'No subject',
      },
      { status: 200 }
    );
  }),

  // DELETE /api/Users/:id - Delete user
  http.delete(`${BASE_URL}/api/Users/:id`, ({ params }) => {
    const { id } = params;
    
    console.log(`[MSW] DELETE /api/Users/${id}`);
    
    const index = usersDB.findIndex(u => u.id === id);
    
    if (index === -1) {
      return HttpResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Remove user
    usersDB.splice(index, 1);
    
    return HttpResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );
  }),
];

export default usersHandlers;
