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
import DeviceCard from './DeviceCard';
import './DeviceList.css';

/**
 * Device List Component
 * Displays all devices in a grid layout
 */
const DeviceList = ({ devices, onToggleStatus, onViewDetails, onDelete }) => {
  if (!devices || devices.length === 0) {
    return (
      <div className="device-list-empty">
        <div className="empty-icon">📭</div>
        <h3>Không có thiết bị nào</h3>
        <p>Nhấn "Thêm thiết bị mới" để bắt đầu thêm cảm biến IoT</p>
      </div>
    );
  }

  return (
    <div className="device-list">
      <div className="device-grid">
        {devices.map(device => (
          <DeviceCard
            key={device.id}
            device={device}
            onToggleStatus={onToggleStatus}
            onViewDetails={onViewDetails}
            onDelete={() => onDelete(device.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default DeviceList;
