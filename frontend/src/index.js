// © 2025 SmartAir City Team
// Licensed under the MIT License. See LICENSE file for details.

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// ============================================
// MOCK SERVICE WORKER (Phase 2.5)
// ============================================
// Enable MSW in development mode
// This intercepts all API calls and returns mock data
// Set REACT_APP_USE_MOCK=false to disable
const USE_MOCK = process.env.REACT_APP_USE_MOCK !== 'false';

async function enableMocking() {
  if (!USE_MOCK) {
    console.log('🔌 MSW Disabled - Using real backend APIs');
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    const { worker } = await import('./mocks/browser');
    
    return worker.start({
      onUnhandledRequest: 'bypass', // Don't warn for unhandled requests
    }).then(() => {
      console.log('🎭 MSW Enabled - Using mock APIs');
      console.log('   - Air Quality API: http://localhost:5182');
      console.log('   - Core API (Devices/Users): http://localhost:5183');
      console.log('   - To disable: Set REACT_APP_USE_MOCK=false in .env');
    });
  }
}

// ============================================
// START APP
// ============================================
enableMocking().then(() => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    // Temporarily disable StrictMode to avoid double-mounting during Phase 6 testing
    // <React.StrictMode>
      <App />
    // </React.StrictMode>
  );
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
