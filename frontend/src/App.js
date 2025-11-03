// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import AirQualityChart from './components/AirQualityChart';
import StationComparisonChart from './components/StationComparisonChart';
import AirQualityMap from './components/AirQualityMap';
import AlertBanner from './components/AlertBanner';
import APIDataViewer from './components/APIDataViewer';
import About from './components/About';
import Footer from './components/Footer';
import { generateMockStations, generateHistoricalData, updateStationData } from './data/mockData';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [stations, setStations] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Initialize data when component mounts
  useEffect(() => {
    const initialStations = generateMockStations();
    const initialHistory = generateHistoricalData();
    
    setStations(initialStations);
    setHistoricalData(initialHistory);
    
    console.log('Stations loaded:', initialStations);
    console.log('Historical data loaded:', initialHistory);
  }, []);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      console.log('Auto-refreshing station data...');
      
      setStations(prevStations => {
        const updatedStations = updateStationData(prevStations);
        console.log('Stations updated:', updatedStations);
        return updatedStations;
      });
      
      setLastUpdate(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [autoRefresh]);

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
              <h2>🏠 Trang chủ - Dashboard</h2>
              <p className="page-subtitle">Tổng quan chất lượng không khí thành phố</p>
            </div>

            <AlertBanner stations={stations} />
            <StatsCards stations={stations} />
            <AirQualityChart historicalData={historicalData} />
            <StationComparisonChart stations={stations} />
          </>
        );
      
      case 'map':
        return (
          <>
            <div className="page-header">
              <h2>🗺️ Bản đồ - Trạm đo chất lượng không khí</h2>
              <p className="page-subtitle">
                Nhấp vào các điểm đo trên bản đồ để xem thông tin chi tiết
              </p>
            </div>

            <AlertBanner stations={stations} />
            <AirQualityMap stations={stations} onStationClick={handleStationClick} />
          </>
        );
      
      case 'data':
        return (
          <>
            <APIDataViewer stations={stations} />
          </>
        );
      
      case 'about':
        return <About />;
      
      default:
        return (
          <div className="page-header">
            <h2>Đang phát triển...</h2>
          </div>
        );
    }
  };

  // Manual refresh function
  const handleManualRefresh = () => {
    console.log('Manual refresh triggered');
    
    setStations(prevStations => {
      const updatedStations = updateStationData(prevStations);
      console.log('Stations manually updated:', updatedStations);
      return updatedStations;
    });
    
    setLastUpdate(new Date());
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
    console.log('Auto-refresh toggled:', !autoRefresh);
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
      
      <div className="main-content">
        {/* Auto-refresh control panel */}
        <div className="refresh-panel">
          <div className="refresh-info">
            <span className="refresh-icon">{autoRefresh ? '🔄' : '⏸️'}</span>
            <span className="refresh-text">
              {autoRefresh ? 'Tự động cập nhật: Bật' : 'Tự động cập nhật: Tắt'}
            </span>
            <span className="last-update">
              Cập nhật lần cuối: {formatUpdateTime()}
            </span>
          </div>
          
          <div className="refresh-controls">
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
      </div>
      
      <Footer />
    </div>
  );
}

export default App;
