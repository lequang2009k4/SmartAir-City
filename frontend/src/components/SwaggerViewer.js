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

import React from 'react';
import './SwaggerViewer.css';

/**
 * Swagger API Documentation Viewer Component
 * Embeds Swagger UI from backend API
 */
const SwaggerViewer = () => {
  const swaggerUrl = process.env.REACT_APP_AIR_API_URL 
    ? `${process.env.REACT_APP_AIR_API_URL}/swagger/index.html`
    : 'http://localhost:51872/swagger/index.html';

  return (
    <div className="swagger-viewer">
      <div className="swagger-container">
        <iframe
          src={swaggerUrl}
          title="Swagger API Documentation"
          className="swagger-iframe"
          frameBorder="0"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default SwaggerViewer;
