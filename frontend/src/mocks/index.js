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
 * Mocks Index
 * Central export point for all mock utilities
 */

export * from './data/airQualityData';
export * from './data/devicesData';
export * from './data/usersData';

export { handlers } from './handlers';
export { worker, startMockServer } from './browser';

export { default as airQualityMockData } from './data/airQualityData';
export { default as devicesMockData } from './data/devicesData';
export { default as usersMockData } from './data/usersData';
