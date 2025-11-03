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
import { generateMockStations, generateHistoricalData } from './data/mockData';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [stations, setStations] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);

  // Initialize data when component mounts
  useEffect(() => {
    const initialStations = generateMockStations();
    const initialHistory = generateHistoricalData();
    
    setStations(initialStations);
    setHistoricalData(initialHistory);
    
    console.log('Stations loaded:', initialStations);
    console.log('Historical data loaded:', initialHistory);
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
      
      default:
        return (
          <div className="page-header">
            <h2>Đang phát triển...</h2>
            <p className="page-subtitle">Tính năng này sẽ được hoàn thiện trong các commit tiếp theo</p>
          </div>
        );
    }
  };

  return (
    <div className="App">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
