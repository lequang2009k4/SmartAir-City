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

import React from 'react';
import UserCard from './UserCard';
import './UserList.css';

/**
 * User List Component
 * Displays all users in a grid layout
 */
const UserList = ({ users, onSendEmail, onDelete }) => {
  if (!users || users.length === 0) {
    return (
      <div className="user-list-empty">
        <div className="empty-icon">👤</div>
        <h3>Không có người dùng nào</h3>
        <p>Chọc hệ thống sẽ sớm có người dùng!</p>
      </div>
    );
  }

  return (
    <div className="user-list">
      <div className="user-grid">
        {users.map(user => (
          <UserCard
            key={user.id}
            user={user}
            onSendEmail={() => onSendEmail(user)}
            onDelete={() => onDelete(user.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default UserList;
