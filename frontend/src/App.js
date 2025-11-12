// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import AirQualityChart from './components/AirQualityChart'; // Updated to use hooks
import StationComparisonChart from './components/StationComparisonChart'; // Updated to use hooks
import AirQualityMap from './components/AirQualityMap';
import AlertBanner from './components/AlertBanner';
// import APIDataViewer from './components/APIDataViewer'; // Cần update để dùng hooks
import About from './components/About';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
// import SearchFilter from './components/SearchFilter'; // Tạm comment - dùng mockData
import ApiTestComponent from './components/ApiTestComponent';
import AirQualityServiceTest from './components/AirQualityServiceTest';
import DevicesUsersServiceTest from './components/DevicesUsersServiceTest';
import WebSocketTest from './components/WebSocketTest';
import Phase6Test from './components/Phase6Test';
// import { generateMockStations, generateHistoricalData, updateStationData } from './data/mockData'; // Không dùng nữa - chuyển sang MSW
// import { downloadCSV, downloadJSON } from './utils/exportUtils'; // Tạm disabled - cần update với hooks

function App() {
  const [activeTab, setActiveTab] = useState('home');
  // const [stations, setStations] = useState([]); // Không dùng mockData nữa
  // const [filteredStations, setFilteredStations] = useState([]); // Không dùng mockData nữa
  // const [historicalData, setHistoricalData] = useState([]); // Không dùng mockData nữa
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

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
            {/* AlertBanner và StatsCards sẽ tự lấy data từ useAirQuality hook */}
            <AlertBanner />
            <StatsCards />
            {/* AirQualityChart sẽ tự lấy data từ useAirQuality hook */}
            <AirQualityChart />
            {/* StationComparisonChart sẽ tự lấy data từ useAirQuality hook */}
            <StationComparisonChart />
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
            {/* AlertBanner và AirQualityMap sẽ tự lấy data từ useAirQuality hook */}
            <AlertBanner />
            <AirQualityMap onStationClick={handleStationClick} />
          </>
        );
      
      case 'data':
        return (
          <>
            {/* APIDataViewer cần update để dùng hooks */}
            {/* <APIDataViewer stations={stations} /> */}
            <div className="page-header">
              <h2>API Data Viewer - Đang cập nhật...</h2>
              <p>Component này sẽ được cập nhật để sử dụng hooks</p>
            </div>
          </>
        );
      
      case 'about':
        return <About />;
      
      case 'apitest':
        return <ApiTestComponent />;
      
      case 'aqtest':
        return <AirQualityServiceTest />;
      
      case 'dutest':
        return <DevicesUsersServiceTest />;
      
      case 'wstest':
        return <WebSocketTest />;
      
      case 'phase6':
        return <Phase6Test />;
      
      default:
        return (
          <div className="page-header">
            <h2>Đang phát triển...</h2>
          </div>
        );
    }
  };

  // Manual refresh function - Now handled by hooks
  const handleManualRefresh = () => {
    console.log('Manual refresh triggered - hooks will auto-refresh');
    setLastUpdate(new Date());
    setError(null);
  };

  // Retry loading - Now handled by hooks
  const handleRetry = () => {
    console.log('Retry triggered - hooks will reload data');
    setError(null);
    setLoading(false);
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
    console.log('Auto-refresh toggled:', !autoRefresh);
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

  // Export data handlers - Tạm thời disabled, cần update để dùng hooks
  const handleExportCSV = () => {
    console.log('Export CSV - Feature disabled, needs hook integration');
    alert('Tính năng xuất CSV sẽ sớm được cập nhật với hooks');
    // const result = downloadCSV(stations);
  };

  const handleExportJSON = () => {
    console.log('Export JSON - Feature disabled, needs hook integration');
    alert('Tính năng xuất JSON sẽ sớm được cập nhật với hooks');
    // const result = downloadJSON(stations, true);
  };

  // Format last update time
  const formatUpdateTime = () => {
    return lastUpdate.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="App">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
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
            {/* Auto-refresh control panel */}
            <div className="refresh-panel">
              <div className="refresh-info">
                <span className="refresh-text">
                  {autoRefresh ? 'Tự động cập nhật: Bật' : 'Tự động cập nhật: Tắt'}
                </span>
                <span className="last-update">
                  Cập nhật lần cuối: {formatUpdateTime()}
                </span>
              </div>
              
              <div className="refresh-controls">
                <button 
                  className="refresh-btn export-btn" 
                  onClick={handleExportCSV}
                  title="Xuất dữ liệu CSV"
                >
                  CSV
                </button>
                <button 
                  className="refresh-btn export-btn" 
                  onClick={handleExportJSON}
                  title="Xuất dữ liệu JSON"
                >
                  JSON
                </button>
                <button 
                  className="refresh-btn toggle-btn" 
                  onClick={toggleAutoRefresh}
                  title={autoRefresh ? 'Tắt tự động cập nhật' : 'Bật tự động cập nhật'}
                >
                  {autoRefresh ? '⏸️ Tạm dừng' : '▶️ Kích hoạt'}
                </button>
                <button 
                  className="refresh-btn manual-btn" 
                  onClick={handleManualRefresh}
                  title="Cập nhật ngay"
                >
                  🔄 Cập nhật ngay
                </button>
              </div>
            </div>

            {renderContent()}
          </>
        )}
      </div>
      
      <Footer />
    </div>
  );
}

export default App;
