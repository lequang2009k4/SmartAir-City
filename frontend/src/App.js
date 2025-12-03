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

import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import AirQualityChart from './components/AirQualityChart';
import AirQualityMap from './components/AirQualityMap';
import RealtimeDashboard from './components/RealtimeDashboard';
import OpenDataViewer from './components/OpenDataViewer';
import About from './components/About';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import AuthModal from './components/AuthModal';
import DeviceManagement from './components/DeviceManagement';
import UserManagement from './components/UserManagement';
import ContributionManagement from './components/ContributionManagement';
import { getUser, removeToken } from './services/api/usersService';
import { AirQualityProvider } from './contexts/AirQualityContext';
// import SearchFilter from './components/SearchFilter'; // TODO: Update to use hooks
// No longer using mockData.js - all data from MSW + Hooks
// import { downloadCSV, downloadJSON } from './utils/exportUtils'; // Tạm disabled - cần update với hooks

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  
  // Auth state
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = getUser();
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      setDarkMode(true);
      document.body.classList.add('dark-mode');
    }
  }, []);

  // ==========================================
  // NOW USING MSW + HOOKS - No more mockData.js
  // ==========================================

  // Set loading to false immediately (hooks will handle their own loading)
  useEffect(() => {
    setLoading(false);
  }, []);

  // Auth handlers
  const handleLoginClick = () => {
    setShowAuthModal(true);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowAuthModal(false);
    // If admin, switch to devices tab
    if (userData && userData.role === 'admin') {
      setActiveTab('devices');
    }
  };

  const handleLogout = () => {
    removeToken();
    setUser(null);
    setActiveTab('home');
  };

  // Handle station click on map
  const handleStationClick = (station) => {
    console.log('Station clicked:', station);
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <>
            <div className="page-header">
              <h2>Trang chủ - Hệ thống giám sát chất lượng không khí</h2>
              <p className="page-subtitle">Tổng quan chất lượng không khí thành phố</p>
            </div>

            {/* Tạm comment SearchFilter vì dùng mockData */}
            {/* <SearchFilter 
              stations={stations} 
              onFilterChange={setFilteredStations}
            /> */}
            {/* RealtimeDashboard hiển thị dữ liệu thời gian thực */}
            <RealtimeDashboard />
            {/* AirQualityChart sẽ tự lấy data từ useAirQuality hook */}
            <AirQualityChart />
          </>
        );
      
      case 'map':
        return (
          <>
            <div className="page-header">
              <h2>Bản đồ - Trạm đo chất lượng không khí</h2>
              <p className="page-subtitle">
                Nhấp vào các điểm đo trên bản đồ để xem thông tin chi tiết
              </p>
            </div>

            {/* Tạm comment SearchFilter vì dùng mockData */}
            {/* <SearchFilter 
              stations={stations} 
              onFilterChange={setFilteredStations}
            /> */}
            {/* RealtimeDashboard và AirQualityMap sẽ tự lấy data từ context */}
            <RealtimeDashboard />
            <AirQualityMap onStationClick={handleStationClick} />
          </>
        );
      
      case 'data':
        return <OpenDataViewer />;
      
      case 'about':
        return <About />;
      
      case 'devices':
        // Only show if user is admin
        if (!user || user.role !== 'admin') {
          return (
            <div className="access-denied">
              <h2>🔒 Truy cập bị từ chối</h2>
              <p>Bạn cần đăng nhập với quyền Admin để truy cập trang này.</p>
              <button className="btn-back" onClick={() => setActiveTab('home')}>
                ← Quay lại trang chủ
              </button>
            </div>
          );
        }
        return <DeviceManagement />;
      
      case 'users':
        // Only show if user is admin
        if (!user || user.role !== 'admin') {
          return (
            <div className="access-denied">
              <h2>🔒 Truy cập bị từ chối</h2>
              <p>Bạn cần đăng nhập với quyền Admin để truy cập trang này.</p>
              <button className="btn-back" onClick={() => setActiveTab('home')}>
                ← Quay lại trang chủ
              </button>
            </div>
          );
        }
        return <UserManagement />;
      
      case 'contributions':
        // Only show if user is logged in
        if (!user) {
          return (
            <div className="access-denied">
              <h2>🔒 Yêu cầu đăng nhập</h2>
              <p>Bạn cần đăng nhập để đóng góp dữ liệu chất lượng không khí.</p>
              <div className="access-denied-actions">
                <button className="btn-primary" onClick={handleLoginClick}>
                  🔐 Đăng nhập ngay
                </button>
                <button className="btn-back" onClick={() => setActiveTab('home')}>
                  ← Quay lại trang chủ
                </button>
              </div>
            </div>
          );
        }
        return <ContributionManagement user={user} />;
      
      default:
        return (
          <div className="page-header">
            <h2>Đang phát triển...</h2>
          </div>
        );
    }
  };
  // Retry loading - Now handled by hooks
  const handleRetry = () => {
    setError(null);
    setLoading(false);
  };
  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', newMode.toString());
      
      if (newMode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
      
      console.log('Dark mode toggled:', newMode);
      return newMode;
    });
  };

  return (
    <AirQualityProvider>
      <div className="App">
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          user={user}
          onLoginClick={handleLoginClick}
          onLogout={handleLogout}
        />
        
        {/* Auth Modal */}
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
        
        {/* Dark Mode Toggle Button */}
        <button 
          className="dark-mode-toggle" 
          onClick={toggleDarkMode}
          title={darkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
        
        <div className="main-content">
          {/* Show loading state */}
          {loading ? (
            <LoadingSpinner 
              message="Đang tải dữ liệu từ các trạm đo..." 
              size="large"
            />
          ) : error ? (
            /* Show error state with retry */
            <ErrorMessage 
              title="Lỗi tải dữ liệu"
              message={error}
              onRetry={handleRetry}
              type="error"
            />
          ) : (
            /* Show normal content */
            <>
              

              {renderContent()}
            </>
          )}
        </div>
        
        <Footer />
      </div>
    </AirQualityProvider>
  );
}

export default App;
