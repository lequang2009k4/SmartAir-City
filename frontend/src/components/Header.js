// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

import React from 'react';
import './Header.css';

const Header = ({ activeTab, setActiveTab }) => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-section">
          <img src="/logo.png" alt="SmartAir City Logo" className="logo-icon" />
          <div className="logo-text">
            <h1>SmartAir City</h1>
            <p>Nền tảng IoT giám sát chất lượng không khí</p>
          </div>
        </div>
        
        <nav className="nav-menu">
          <button 
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            Trang chủ
          </button>
          <button 
            className={`nav-item ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            Bản đồ
          </button>
          <button 
            className={`nav-item ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            API Data
          </button>
          <button 
            className={`nav-item ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            Giới thiệu
          </button>
          <button 
            className={`nav-item ${activeTab === 'apitest' ? 'active' : ''}`}
            onClick={() => setActiveTab('apitest')}
            style={{ backgroundColor: '#ff9800', color: 'white' }}
            title="Phase 2 - API Testing"
          >
            API Test
          </button>
          <button 
            className={`nav-item ${activeTab === 'aqtest' ? 'active' : ''}`}
            onClick={() => setActiveTab('aqtest')}
            style={{ backgroundColor: '#4CAF50', color: 'white' }}
            title="Phase 3 - Air Quality Service Testing"
          >
            AQ Service
          </button>
          <button 
            className={`nav-item ${activeTab === 'dutest' ? 'active' : ''}`}
            onClick={() => setActiveTab('dutest')}
            style={{ backgroundColor: '#9C27B0', color: 'white' }}
            title="Phase 4 - Devices & Users Service Testing"
          >
            👥 D&U Service
          </button>
          <button 
            className={`nav-item ${activeTab === 'wstest' ? 'active' : ''}`}
            onClick={() => setActiveTab('wstest')}
            style={{ backgroundColor: '#00BCD4', color: 'white' }}
            title="Phase 5 - WebSocket Testing"
          >
            🌐 WebSocket
          </button>
          <button 
            className={`nav-item ${activeTab === 'phase6' ? 'active' : ''}`}
            onClick={() => setActiveTab('phase6')}
            style={{ backgroundColor: '#E91E63', color: 'white' }}
            title="Phase 6 - React Hooks Integration Testing"
          >
            🎣 Phase 6
          </button>
          <button 
            className={`nav-item ${activeTab === 'devices' ? 'active' : ''}`}
            onClick={() => setActiveTab('devices')}
            style={{ backgroundColor: '#3F51B5', color: 'white' }}
            title="Phase 8 - Device Management UI"
          >
            📡 Devices
          </button>
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
            style={{ backgroundColor: '#E91E63', color: 'white' }}
            title="Phase 9 - User Management UI"
          >
            👥 Users
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
