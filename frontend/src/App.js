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
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import SearchFilter from './components/SearchFilter';
import { generateMockStations, generateHistoricalData, updateStationData } from './data/mockData';
import { downloadCSV, downloadJSON } from './utils/exportUtils';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize data when component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const initialStations = generateMockStations();
        const initialHistory = generateHistoricalData();
        
        setStations(initialStations);
        setFilteredStations(initialStations); // Initialize filtered stations
        setHistoricalData(initialHistory);
        
        console.log('Stations loaded:', initialStations);
        console.log('Historical data loaded:', initialHistory);
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Không thể tải dữ liệu ban đầu. Vui lòng thử lại.');
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      console.log('Auto-refreshing station data...');
      
      setStations(prevStations => {
        const updatedStations = updateStationData(prevStations);
        console.log('Stations updated:', updatedStations);
        setFilteredStations(updatedStations); // Update filtered stations too
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

            <SearchFilter 
              stations={stations} 
              onFilterChange={setFilteredStations}
            />
            <AlertBanner stations={filteredStations} />
            <StatsCards stations={filteredStations} />
            <AirQualityChart historicalData={historicalData} />
            <StationComparisonChart stations={filteredStations} />
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

            <SearchFilter 
              stations={stations} 
              onFilterChange={setFilteredStations}
            />
            <AlertBanner stations={filteredStations} />
            <AirQualityMap stations={filteredStations} onStationClick={handleStationClick} />
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
    
    try {
      setStations(prevStations => {
        const updatedStations = updateStationData(prevStations);
        console.log('Stations manually updated:', updatedStations);
        setFilteredStations(updatedStations); // Update filtered stations too
        return updatedStations;
      });
      
      setLastUpdate(new Date());
      setError(null); // Clear any existing errors
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Không thể cập nhật dữ liệu. Vui lòng thử lại.');
    }
  };

  // Retry loading initial data
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    
    setTimeout(() => {
      try {
        const initialStations = generateMockStations();
        const initialHistory = generateHistoricalData();
        
        setStations(initialStations);
        setFilteredStations(initialStations); // Update filtered stations too
        setHistoricalData(initialHistory);
        setLoading(false);
      } catch (err) {
        console.error('Error retrying data load:', err);
        setError('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối mạng.');
        setLoading(false);
      }
    }, 1000);
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
    console.log('Auto-refresh toggled:', !autoRefresh);
  };

  // Export data handlers
  const handleExportCSV = () => {
    const result = downloadCSV(stations);
    if (result.success) {
      console.log('CSV exported successfully:', result.filename);
      alert(`✅ Đã xuất file CSV: ${result.filename}`);
    } else {
      console.error('CSV export failed:', result.error);
      alert(`❌ Lỗi xuất CSV: ${result.error}`);
    }
  };

  const handleExportJSON = () => {
    const result = downloadJSON(stations, true);
    if (result.success) {
      console.log('JSON exported successfully:', result.filename);
      alert(`✅ Đã xuất file JSON: ${result.filename}`);
    } else {
      console.error('JSON export failed:', result.error);
      alert(`❌ Lỗi xuất JSON: ${result.error}`);
    }
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
                  className="refresh-btn export-btn" 
                  onClick={handleExportCSV}
                  title="Xuất dữ liệu CSV"
                >
                  📊 CSV
                </button>
                <button 
                  className="refresh-btn export-btn" 
                  onClick={handleExportJSON}
                  title="Xuất dữ liệu JSON"
                >
                  📄 JSON
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
