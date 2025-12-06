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


import React from "react";
import "./ContributorCard.css";

/**
 * Contributor Card Component
 * Displays contributor info card with name, email, and contribution count
 * Note: contributionCount = number of upload sessions (not total records)
 */
const ContributorCard = ({ contributor, onClick, isActive }) => {
  const { userName, email, contributionCount } = contributor;

  return (
    <div 
      className={`contributor-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="card-top">
        <div className="contributor-avatar">
          {userName?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="contributor-badge">
          <span className="badge-number">{contributionCount || 0}</span>
        </div>
      </div>
      
      <div className="card-content">
        <h3 className="contributor-name">{userName || 'Unknown User'}</h3>
        <p className="contributor-email">{email}</p>
        <div className="contribution-label">Đã đóng góp {contributionCount || 0} lần</div>
      </div>
    </div>
  );
};

export default ContributorCard;
