// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* About Section */}
        <div className="footer-section">
          <h3>🌿 SmartAir City</h3>
          <p>
            Hệ thống giám sát chất lượng không khí thông minh cho thành phố,
            sử dụng công nghệ IoT và chuẩn mở NGSI-LD.
          </p>
          <div className="footer-badges">
            <span className="badge">IoT Platform</span>
            <span className="badge">NGSI-LD</span>
            <span className="badge">Open Source</span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h3>Liên kết nhanh</h3>
          <ul className="footer-links">
            <li><a href="#home">Trang chủ</a></li>
            <li><a href="#map">Bản đồ</a></li>
            <li><a href="#data">Dữ liệu API</a></li>
            <li><a href="#about">Giới thiệu</a></li>
          </ul>
        </div>

        {/* Technology Stack */}
        <div className="footer-section">
          <h3>Công nghệ</h3>
          <ul className="footer-links">
            <li>React.js</li>
            <li>Leaflet Maps</li>
            <li>Chart.js</li>
            <li>FIWARE NGSI-LD</li>
          </ul>
        </div>

        {/* Contact & Social */}
        <div className="footer-section">
          <h3>Kết nối</h3>
          <div className="social-links">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-link">
              <span>GitHub</span>
            </a>
            <a href="mailto:info@smartaircity.com" className="social-link">
              <span>Email</span>
            </a>
            <a href="#feedback" className="social-link">
              <span>Feedback</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p className="copyright">
            © {currentYear} SmartAir City Team. All rights reserved.
          </p>
          <div className="footer-bottom-links">
            <a href="#privacy">Privacy Policy</a>
            <span className="separator">•</span>
            <a href="#terms">Terms of Service</a>
            <span className="separator">•</span>
            <a href="#license">MIT License</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
