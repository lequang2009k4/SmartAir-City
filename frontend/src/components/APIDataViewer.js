// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

import React, { useState } from "react";
import { useAirQualityContext } from "../contexts/AirQualityContext";
import "./APIDataViewer.css";

/**
 * API Data Viewer Component
 * Displays raw Air Quality API data for developers
 * Shows only ONE sample record (not realtime)
 */
const APIDataViewer = () => {
  const [showRaw, setShowRaw] = useState(false);

  // Get data from Air Quality context (shared state)
  const {
    latestData: airQualityData,
    isLoading,
    error,
  } = useAirQualityContext();

  // Get ONLY the first record as a sample for developers
  const sampleData = airQualityData?.length > 0 ? [airQualityData[0]] : [];

  // Clean data for display - remove transformation artifacts
  const cleanData = (data) => {
    if (!Array.isArray(data)) return data;
    
    return data.map(item => {
      // If showing raw NGSI-LD format
      if (showRaw && item._raw) {
        return item._raw;
      }
      
      // Show cleaned transformed data (remove nested pollutants and _raw)
      const { pollutants, _raw, ...cleanItem } = item;
      
      // Remove temperature/humidity if they are default fallback values
      if (cleanItem.temperature === 25 && cleanItem.humidity === 60) {
        delete cleanItem.temperature;
        delete cleanItem.humidity;
      }
      
      return cleanItem;
    });
  };

  const displayData = cleanData(sampleData);

  return (
    <div className="api-data-viewer">
      {/* Header */}
      <div className="page-header">
        <h2>API Data Viewer</h2>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-box">
          <h4>❌ Error Loading Data</h4>
          <p>{error}</p>
        </div>
      )}

      {/* Loading Display */}
      {isLoading && (
        <div className="loading-box">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      )}

      {/* Data Display */}
      {!isLoading && !error && (
        <div className="data-display">
          <div className="data-header">
            <h3>Sample JSON Data (1 Record)</h3>
            <div className="data-actions">
              <button
                className={`btn-toggle ${showRaw ? 'active' : ''}`}
                onClick={() => setShowRaw(!showRaw)}
              >
                {showRaw ? '📋 Show Transformed' : '🔍 Show NGSI-LD'}
              </button>
              <button
                className="btn-copy"
                onClick={() => {
                  navigator.clipboard.writeText(
                    JSON.stringify(displayData, null, 2)
                  );
                  alert("Đã copy JSON vào clipboard!");
                }}
              >
                📋 Copy JSON
              </button>
              <button
                className="btn-download"
                onClick={() => {
                  const blob = new Blob(
                    [JSON.stringify(displayData, null, 2)],
                    { type: "application/json" }
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `sample-airquality-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                💾 Download JSON
              </button>
            </div>
          </div>

          {displayData.length > 0 ? (
            <pre className="json-viewer">
              <code>{JSON.stringify(displayData, null, 2)}</code>
            </pre>
          ) : (
            <div className="no-data-box">
              <p>⚠️ Không có dữ liệu mẫu</p>
            </div>
          )}
        </div>
      )}

      {/* API Endpoints Reference */}
      <div className="api-reference">
        <h3>Air Quality API Endpoints</h3>
        <div className="endpoint-grid">
          <div className="endpoint-card">
            <h4>Air Quality API</h4>
            <code>GET /api/airquality</code>
            <code>GET /api/airquality/latest</code>
            <code>GET /api/airquality/history</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIDataViewer;
