// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <div className="about-hero">
        <h1>🌿 SmartAir City</h1>
        <p className="tagline">IoT Platform for Smart City Air Quality Monitoring</p>
      </div>

      <div className="about-content">
        {/* Introduction Section */}
        <section className="about-section">
          <h2>Introduction</h2>
          <p>
            SmartAir City is an advanced IoT platform designed to monitor and analyze 
            air quality in real-time for smart cities. The system uses a network of 
            MQ135 sensors distributed throughout the city to collect data on critical 
            air pollution indicators.
          </p>
        </section>

        {/* Goals Section */}
        <section className="about-section">
          <h2>Goals</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Real-time Monitoring</h3>
              <p>24/7 air quality tracking with continuous data updates</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Data Analysis</h3>
              <p>Visual charts for trends and area comparisons</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚠️</div>
              <h3>Smart Alerts</h3>
              <p>Color-coded warning system when air quality exceeds thresholds</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <h3>Open Standards</h3>
              <p>NGSI-LD compliance for integration and scalability</p>
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="about-section">
          <h2>Technology Stack</h2>
          <div className="tech-stack">
            <div className="tech-category">
              <h3>Frontend</h3>
              <ul>
                <li>React.js - UI Framework</li>
                <li>Leaflet - Interactive Maps</li>
                <li>Chart.js - Data Visualization</li>
              </ul>
            </div>
            <div className="tech-category">
              <h3>IoT & Sensors</h3>
              <ul>
                <li>MQ135 - Air Quality Sensor</li>
                <li>DHT22 - Temperature/Humidity Sensor</li>
                <li>ESP32/Arduino - Microcontroller</li>
              </ul>
            </div>
            <div className="tech-category">
              <h3>Standards</h3>
              <ul>
                <li>NGSI-LD - Context Information Management</li>
                <li>FIWARE - Smart City Platform</li>
                <li>OpenAQ - Air Quality Data API</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Metrics Section */}
        <section className="about-section">
          <h2>Measured Indicators</h2>
          <div className="metrics-list">
            <div className="metric-item">
              <strong>AQI (Air Quality Index):</strong> Comprehensive air quality index
            </div>
            <div className="metric-item">
              <strong>PM2.5:</strong> Fine particles ≤ 2.5 micrometers in diameter
            </div>
            <div className="metric-item">
              <strong>PM10:</strong> Fine particles ≤ 10 micrometers in diameter
            </div>
            <div className="metric-item">
              <strong>CO:</strong> Carbon Monoxide concentration
            </div>
            <div className="metric-item">
              <strong>Temperature:</strong> Ambient temperature
            </div>
            <div className="metric-item">
              <strong>Humidity:</strong> Air humidity
            </div>
          </div>
        </section>

        {/* AQI Scale */}
        <section className="about-section">
          <h2>AQI Scale</h2>
          <div className="aqi-legend">
            <div className="legend-item" style={{ backgroundColor: '#00e400' }}>
              <span className="legend-range">0-50</span>
              <span className="legend-label">Good</span>
            </div>
            <div className="legend-item" style={{ backgroundColor: '#ffff00', color: '#333' }}>
              <span className="legend-range">51-100</span>
              <span className="legend-label">Moderate</span>
            </div>
            <div className="legend-item" style={{ backgroundColor: '#ff7e00' }}>
              <span className="legend-range">101-150</span>
              <span className="legend-label">Unhealthy for Sensitive Groups</span>
            </div>
            <div className="legend-item" style={{ backgroundColor: '#ff0000' }}>
              <span className="legend-range">151-200</span>
              <span className="legend-label">Unhealthy</span>
            </div>
            <div className="legend-item" style={{ backgroundColor: '#8f3f97' }}>
              <span className="legend-range">201-300</span>
              <span className="legend-label">Very Unhealthy</span>
            </div>
            <div className="legend-item" style={{ backgroundColor: '#7e0023' }}>
              <span className="legend-range">300+</span>
              <span className="legend-label">Hazardous</span>
            </div>
          </div>
        </section>

        {/* Social Impact */}
        <section className="about-section">
          <h2>Social Impact</h2>
          <p>
            SmartAir City helps raise community awareness about air pollution, 
            provides scientific data for policy makers, and supports citizens 
            in making health-informed decisions based on real-time air quality information.
          </p>
        </section>

        {/* Contact Section */}
        <section className="about-section contact-section">
          <h2>Contact</h2>
          <p>
            For more information or collaboration opportunities, please contact us 
            via email or follow the project on GitHub.
          </p>
          <div className="contact-buttons">
            <button className="contact-btn">Email</button>
            <button className="contact-btn">GitHub</button>
            <button className="contact-btn">Feedback</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
