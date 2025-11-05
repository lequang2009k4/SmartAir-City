// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

import React, { useState } from "react";
import "./APIDataViewer.css";

const APIDataViewer = ({ stations }) => {
  const [selectedStation, setSelectedStation] = useState(null);
  const [viewMode, setViewMode] = useState("raw"); // 'raw' or 'ngsi-ld'

  // Convert station data to NGSI-LD format
  const convertToNGSILD = (station) => {
    return {
      "@context": [
        "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
        {
          AirQualityObserved:
            "https://smartdatamodels.org/dataModel.Environment/AirQualityObserved",
          fiware: "https://fiware.github.io/data-models/context.jsonld",
        },
      ],
      id: `urn:ngsi-ld:AirQualityObserved:${station.id}`,
      type: "AirQualityObserved",
      dateObserved: {
        type: "Property",
        value: {
          "@type": "DateTime",
          "@value": station.timestamp,
        },
      },
      location: {
        type: "GeoProperty",
        value: {
          type: "Point",
          coordinates: [station.location.lng, station.location.lat],
        },
      },
      address: {
        type: "Property",
        value: {
          addressLocality: station.name,
          addressCountry: "Vietnam",
        },
      },
      airQualityIndex: {
        type: "Property",
        value: station.aqi,
        unitCode: "AQI",
      },
      pm25: {
        type: "Property",
        value: station.pm25,
        unitCode: "GQ",
      },
      pm10: {
        type: "Property",
        value: station.pm10,
        unitCode: "GQ",
      },
      co: {
        type: "Property",
        value: station.co,
        unitCode: "GP",
      },
      temperature: {
        type: "Property",
        value: station.temperature,
        unitCode: "CEL",
      },
      relativeHumidity: {
        type: "Property",
        value: station.humidity,
        unitCode: "P1",
      },
      source: {
        type: "Property",
        value: "IoT Sensor MQ135",
      },
      dataProvider: {
        type: "Property",
        value: "SmartAir City Platform",
      },
    };
  };

  // Copy JSON to clipboard
  const copyToClipboard = () => {
    if (!selectedStation) return;

    const jsonData =
      viewMode === "ngsi-ld"
        ? JSON.stringify(convertToNGSILD(selectedStation), null, 2)
        : JSON.stringify(selectedStation, null, 2);

    navigator.clipboard.writeText(jsonData);
    alert("Đã sao chép JSON vào clipboard!");
  };

  return (
    <div className="api-data-viewer">
      <div className="api-header">
        <h2>📡 API Data - NGSI-LD Format</h2>
        <p className="api-description">
          Dữ liệu từ các trạm giám sát được chuẩn hóa theo NGSI-LD Context
          Information Management, tương thích với nền tảng FIWARE cho thành phố
          thông minh.
        </p>
      </div>

      <div className="api-content">
        {/* Station selector */}
        <div className="station-selector">
          <h3>Chọn trạm đo</h3>
          <div className="station-list">
            {stations.map((station) => (
              <button
                key={station.id}
                className={`station-button ${
                  selectedStation?.id === station.id ? "active" : ""
                }`}
                onClick={() => setSelectedStation(station)}
              >
                <div className="station-name">{station.name}</div>
                <div className="station-aqi">
                  AQI: {Math.round(station.aqi)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Data display */}
        {selectedStation && (
          <div className="data-display">
            <div className="data-controls">
              <button
                className={`view-toggle ${viewMode === "raw" ? "active" : ""}`}
                onClick={() => setViewMode("raw")}
              >
                📊 Raw Data
              </button>
              <button
                className={`view-toggle ${
                  viewMode === "ngsi-ld" ? "active" : ""
                }`}
                onClick={() => setViewMode("ngsi-ld")}
              >
                🔗 NGSI-LD
              </button>
              <button className="copy-button" onClick={copyToClipboard}>
                📋 Copy
              </button>
            </div>

            {viewMode === "raw" ? (
              <div className="raw-data">
                <h3>Station Data: {selectedStation.name}</h3>
                <table className="data-table">
                  <tbody>
                    <tr>
                      <td>
                        <strong>ID:</strong>
                      </td>
                      <td>{selectedStation.id}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Location:</strong>
                      </td>
                      <td>
                        {selectedStation.location.lat},{" "}
                        {selectedStation.location.lng}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>AQI:</strong>
                      </td>
                      <td className="aqi-value">
                        {Math.round(selectedStation.aqi)}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>PM2.5:</strong>
                      </td>
                      <td>{selectedStation.pm25} µg/m³</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>PM10:</strong>
                      </td>
                      <td>{selectedStation.pm10} µg/m³</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>CO:</strong>
                      </td>
                      <td>{selectedStation.co} ppm</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Temperature:</strong>
                      </td>
                      <td>{selectedStation.temperature}°C</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Humidity:</strong>
                      </td>
                      <td>{selectedStation.humidity}%</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Timestamp:</strong>
                      </td>
                      <td>
                        {new Date(selectedStation.timestamp).toLocaleString(
                          "vi-VN"
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="json-ld-view">
                <h3>NGSI-LD Format</h3>
                <pre className="json-code">
                  {JSON.stringify(convertToNGSILD(selectedStation), null, 2)}
                </pre>
              </div>
            )}

            <div className="api-info">
              <h4>📘 About NGSI-LD</h4>
              <p>
                <strong>NGSI-LD</strong> is a standardized API for context
                information management in IoT and smart city systems. Developed
                by ETSI and widely used in the FIWARE platform.
              </p>
              <ul>
                <li>✅ Standardized interaction between systems</li>
                <li>✅ Support for Linked Data and Semantic Web</li>
                <li>✅ Real-time data management</li>
                <li>✅ Integration with Context Broker (Orion-LD)</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default APIDataViewer;
