// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

import React, { useState } from 'react';
import './SearchFilter.css';

const SearchFilter = ({ stations, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    applyFilters(value, selectedLevel);
  };

  // Handle AQI level filter change
  const handleLevelChange = (level) => {
    setSelectedLevel(level);
    applyFilters(searchTerm, level);
  };

  // Apply filters and pass filtered stations to parent
  const applyFilters = (search, level) => {
    let filtered = stations;

    // Filter by search term (station name)
    if (search.trim() !== '') {
      filtered = filtered.filter(station =>
        station.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by AQI level
    if (level !== 'all') {
      filtered = filtered.filter(station => {
        const aqi = station.aqi;
        switch (level) {
          case 'good':
            return aqi <= 50;
          case 'moderate':
            return aqi > 50 && aqi <= 100;
          case 'unhealthy-sensitive':
            return aqi > 100 && aqi <= 150;
          case 'unhealthy':
            return aqi > 150 && aqi <= 200;
          case 'very-unhealthy':
            return aqi > 200 && aqi <= 300;
          case 'hazardous':
            return aqi > 300;
          default:
            return true;
        }
      });
    }

    onFilterChange(filtered);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedLevel('all');
    onFilterChange(stations);
  };

  // Count stations in each AQI level
  const countByLevel = (level) => {
    return stations.filter(station => {
      const aqi = station.aqi;
      switch (level) {
        case 'good':
          return aqi <= 50;
        case 'moderate':
          return aqi > 50 && aqi <= 100;
        case 'unhealthy-sensitive':
          return aqi > 100 && aqi <= 150;
        case 'unhealthy':
          return aqi > 150 && aqi <= 200;
        case 'very-unhealthy':
          return aqi > 200 && aqi <= 300;
        case 'hazardous':
          return aqi > 300;
        default:
          return true;
      }
    }).length;
  };

  return (
    <div className="search-filter">
      {/* Search Box */}
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Tìm kiếm trạm theo tên..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        {searchTerm && (
          <button className="clear-search" onClick={() => handleSearchChange({ target: { value: '' } })}>
            ✕
          </button>
        )}
      </div>

      {/* AQI Level Filters */}
      <div className="filter-buttons">
        <button
          className={`filter-btn ${selectedLevel === 'all' ? 'active' : ''}`}
          onClick={() => handleLevelChange('all')}
        >
          Tất cả ({stations.length})
        </button>
        <button
          className={`filter-btn good ${selectedLevel === 'good' ? 'active' : ''}`}
          onClick={() => handleLevelChange('good')}
        >
          Tốt ({countByLevel('good')})
        </button>
        <button
          className={`filter-btn moderate ${selectedLevel === 'moderate' ? 'active' : ''}`}
          onClick={() => handleLevelChange('moderate')}
        >
          Trung bình ({countByLevel('moderate')})
        </button>
        <button
          className={`filter-btn unhealthy-sensitive ${selectedLevel === 'unhealthy-sensitive' ? 'active' : ''}`}
          onClick={() => handleLevelChange('unhealthy-sensitive')}
        >
          Không tốt cho nhạy cảm ({countByLevel('unhealthy-sensitive')})
        </button>
        <button
          className={`filter-btn unhealthy ${selectedLevel === 'unhealthy' ? 'active' : ''}`}
          onClick={() => handleLevelChange('unhealthy')}
        >
          Không tốt ({countByLevel('unhealthy')})
        </button>
        <button
          className={`filter-btn very-unhealthy ${selectedLevel === 'very-unhealthy' ? 'active' : ''}`}
          onClick={() => handleLevelChange('very-unhealthy')}
        >
          Rất không tốt ({countByLevel('very-unhealthy')})
        </button>
        <button
          className={`filter-btn hazardous ${selectedLevel === 'hazardous' ? 'active' : ''}`}
          onClick={() => handleLevelChange('hazardous')}
        >
          Nguy hại ({countByLevel('hazardous')})
        </button>
      </div>

      {/* Clear Filters Button */}
      {(searchTerm || selectedLevel !== 'all') && (
        <button className="clear-filters-btn" onClick={handleClearFilters}>
          🔄 Xóa bộ lọc
        </button>
      )}
    </div>
  );
};

export default SearchFilter;
