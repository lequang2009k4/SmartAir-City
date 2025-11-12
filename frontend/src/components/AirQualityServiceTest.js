// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

/**
 * Air Quality Service Test Component
 * Test Air Quality API Service với MSW mock data
 */

import React, { useState } from 'react';
import airQualityService from '../services/api/airQualityService';

const AirQualityServiceTest = () => {
  const [latestData, setLatestData] = useState(null);
  const [allData, setAllData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Test getLatest
  const testGetLatest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Testing airQualityService.getLatest()...');
      const data = await airQualityService.getLatest();
      console.log('✅ Latest data:', data);
      setLatestData(data);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Test getAll
  const testGetAll = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Testing airQualityService.getAll(10)...');
      const data = await airQualityService.getAll(10);
      console.log('✅ All data:', data);
      setAllData(data);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Test getHistory
  const testGetHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { from, to } = airQualityService.getDateRange('week');
      console.log(`🧪 Testing airQualityService.getHistory(${from.toISOString()}, ${to.toISOString()})...`);
      
      const data = await airQualityService.getHistory(from, to);
      console.log('✅ History data:', data);
      setHistoryData(data);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>🧪 Air Quality Service Test (Phase 3)</h2>
      <p>Test Air Quality API Service với transformed data</p>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={testGetLatest}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          Test getLatest()
        </button>

        <button 
          onClick={testGetAll}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          Test getAll(10)
        </button>

        <button 
          onClick={testGetHistory}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          Test getHistory(week)
        </button>
      </div>

      {loading && <p>⏳ Loading...</p>}

      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '20px',
        }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {/* Latest Data */}
      {latestData && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e8f5e9',
          borderRadius: '4px',
          marginBottom: '20px',
        }}>
          <h3>✅ Latest Air Quality Data (Transformed)</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
            <div>
              <strong>Location:</strong> {latestData.location.lat.toFixed(4)}, {latestData.location.lng.toFixed(4)}
            </div>
            <div>
              <strong>Date:</strong> {new Date(latestData.dateObserved).toLocaleString()}
            </div>
            <div style={{
              gridColumn: '1 / -1',
              padding: '10px',
              backgroundColor: airQualityService.getAQILevel(latestData.aqi).color,
              color: 'white',
              borderRadius: '4px',
              textAlign: 'center',
              fontSize: '18px',
              fontWeight: 'bold',
            }}>
              AQI: {latestData.aqi} - {airQualityService.getAQILevel(latestData.aqi).label}
            </div>
          </div>

          <h4>Pollutants:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
              <strong>PM2.5:</strong> {latestData.pm25?.toFixed(2)} µg/m³
            </div>
            <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
              <strong>PM10:</strong> {latestData.pm10?.toFixed(2)} µg/m³
            </div>
            <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
              <strong>O3:</strong> {latestData.o3?.toFixed(2)} µg/m³
            </div>
            <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
              <strong>NO2:</strong> {latestData.no2?.toFixed(2)} µg/m³
            </div>
            <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
              <strong>SO2:</strong> {latestData.so2?.toFixed(2)} µg/m³
            </div>
            <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
              <strong>CO:</strong> {latestData.co?.toFixed(2)} µg/m³
            </div>
          </div>

          <details style={{ marginTop: '15px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>View Raw NGSI-LD Data</summary>
            <pre style={{ overflow: 'auto', maxHeight: '300px', backgroundColor: 'white', padding: '10px', borderRadius: '4px' }}>
              {JSON.stringify(latestData._raw, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* All Data */}
      {allData && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
          marginBottom: '20px',
        }}>
          <h3>✅ All Air Quality Data ({allData.length} records)</h3>
          <p><strong>Average AQI:</strong> {airQualityService.calculateAverageAQI(allData)}</p>
          
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
              <thead>
                <tr style={{ backgroundColor: '#2196F3', color: 'white' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>AQI</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>PM2.5</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>PM10</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Level</th>
                </tr>
              </thead>
              <tbody>
                {allData.map((record, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '10px' }}>{new Date(record.dateObserved).toLocaleString()}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{record.aqi.toFixed(1)}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{record.pm25?.toFixed(2)}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{record.pm10?.toFixed(2)}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '3px',
                        backgroundColor: airQualityService.getAQILevel(record.aqi).color,
                        color: 'white',
                        fontSize: '12px',
                      }}>
                        {airQualityService.getAQILevel(record.aqi).label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History Data */}
      {historyData && (
        <div style={{
          padding: '15px',
          backgroundColor: '#fff3e0',
          borderRadius: '4px',
        }}>
          <h3>✅ History Data (Last 7 days - {historyData.length} records)</h3>
          <p><strong>Average AQI:</strong> {airQualityService.calculateAverageAQI(historyData)}</p>
          <p>Data points từ {new Date(historyData[0]?.dateObserved).toLocaleDateString()} đến {new Date(historyData[historyData.length - 1]?.dateObserved).toLocaleDateString()}</p>
        </div>
      )}

      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
      }}>
        <h4>📝 Service Methods Tested:</h4>
        <ul>
          <li>✅ <code>airQualityService.getLatest()</code> - Get latest record</li>
          <li>✅ <code>airQualityService.getAll(limit)</code> - Get all records with limit</li>
          <li>✅ <code>airQualityService.getHistory(from, to)</code> - Get historical data</li>
          <li>✅ <code>transformAirQualityData()</code> - Transform NGSI-LD to frontend format</li>
          <li>✅ <code>getAQILevel(aqi)</code> - Get AQI level and color</li>
          <li>✅ <code>calculateAverageAQI(records)</code> - Calculate average</li>
          <li>✅ <code>getDateRange(period)</code> - Get date range helper</li>
        </ul>
      </div>
    </div>
  );
};

export default AirQualityServiceTest;
