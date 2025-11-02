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
        </nav>
      </div>
    </header>
  );
};

export default Header;
