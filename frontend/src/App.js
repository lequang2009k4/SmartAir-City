// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import AirQualityChart from './components/AirQualityChart';
import StationComparisonChart from './components/StationComparisonChart';
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

  return (
    <div className="App">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        <div className="page-header">
          <h2>🏠 Trang chủ - Dashboard</h2>
          <p className="page-subtitle">Tổng quan chất lượng không khí thành phố</p>
        </div>

        <StatsCards stations={stations} />

        <AirQualityChart historicalData={historicalData} />

        <StationComparisonChart stations={stations} />

        <div className="data-preview">
          <h3>📊 Dữ liệu chi tiết</h3>
          <p>Số trạm đo: {stations.length}</p>
          <p>Dữ liệu lịch sử: {historicalData.length} điểm</p>
          
          {stations.length > 0 && (
            <div className="station-sample">
              <h4>Ví dụ trạm đầu tiên:</h4>
              <pre>{JSON.stringify(stations[0], null, 2)}</pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
