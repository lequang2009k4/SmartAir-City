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
 * MSW Browser Setup
 * Setup Mock Service Worker for browser
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// ============================================
// SETUP WORKER
// ============================================

export const worker = setupWorker(...handlers);

// ============================================
// START FUNCTION
// ============================================

/**
 * Start MSW worker
 * @param {object} options - MSW options
 */
export const startMockServer = (options = {}) => {
  const defaultOptions = {
    onUnhandledRequest: 'warn', // Warn for unhandled requests
    ...options,
  };

  return worker.start(defaultOptions);
};

export default worker;
