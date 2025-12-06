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
 * MSW Handlers Index
 * Combine all API handlers
 */

import { airQualityHandlers } from './airQualityHandlers';
import { devicesHandlers } from './devicesHandlers';
import { usersHandlers } from './usersHandlers';

// ============================================
// COMBINE ALL HANDLERS
// ============================================

export const handlers = [
  ...airQualityHandlers,
  ...devicesHandlers,
  ...usersHandlers,
];

export default handlers;
