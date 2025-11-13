// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

import React, { useState, useEffect, useRef } from 'react';
import './Header.css';

const Header = ({ activeTab, setActiveTab, user, onLoginClick, onLogout }) => {
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAdminMenu(false);
      }
    };

    if (showAdminMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAdminMenu]);

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

          {/* Auth Section */}
          <div className="auth-section">
            {user ? (
              <>
                <div className="user-dropdown" ref={dropdownRef}>
                  <div 
                    className="user-info"
                    onClick={() => setShowAdminMenu(!showAdminMenu)}
                  >
                    <span className="user-avatar">
                      {user.name?.charAt(0).toUpperCase() || '👤'}
                    </span>
                    <span className="user-name">{user.name}</span>
                    {user.role === 'admin' && (
                      <span className="admin-badge">Admin</span>
                    )}
                    <span className="dropdown-arrow">{showAdminMenu ? '▲' : '▼'}</span>
                  </div>

                  {/* User Dropdown Menu */}
                  {showAdminMenu && (
                    <div className="admin-dropdown-menu">
                      {user.role === 'admin' && (
                        <>
                          <div className="dropdown-header">
                            🔧 Quản lý hệ thống
                          </div>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setActiveTab('devices');
                              setShowAdminMenu(false);
                            }}
                          >
                            📡 Quản lý thiết bị
                          </button>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setActiveTab('users');
                              setShowAdminMenu(false);
                            }}
                          >
                            👥 Quản lý người dùng
                          </button>
                          <div className="dropdown-divider"></div>
                        </>
                      )}
                      <button
                        className="dropdown-item dropdown-logout"
                        onClick={() => {
                          setShowAdminMenu(false);
                          onLogout();
                        }}
                      >
                        🚪 Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button className="btn-login" onClick={onLoginClick}>
                🔐 Đăng nhập
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
