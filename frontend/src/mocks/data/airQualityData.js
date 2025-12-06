// SmartAir City – IoT Platform for Urban Air Quality Monitoring
// based on NGSI-LD and FiWARE Standards

// SPDX-License-Identifier: MIT
// @version   0.1.x
// @author    SmartAir City Team <smartaircity@gmail.com>
// @copyright © 2025 SmartAir City Team. 
// @license   MIT License
// See LICENSE file in root directory for full license text.
// @see       https://github.com/lequang2009k4/SmartAir-City   SmartAir City Open Source Project

// This software is an open-source component of the SmartAir City initiative.
// It provides real-time environmental monitoring, NGSI-LD–compliant data
// models, MQTT-based data ingestion, and FiWARE Smart Data Models for
// open-data services and smart-city applications.

/**
 * Air Quality Mock Data Generator
 * Generates NGSI-LD compliant mock data based on openapi.yaml specs
 */

// ============================================
// HELPER: Generate Random Values
// ============================================

const randomBetween = (min, max) => Math.random() * (max - min) + min;

const randomChoice = (array) => array[Math.floor(Math.random() * array.length)];

// ============================================
// STATION LOCATIONS (Hanoi)
// ============================================

export const HANOI_LOCATIONS = [
  { name: 'Hoàn Kiếm', coordinates: [105.8542, 21.0285] },
  { name: 'Ba Đình', coordinates: [105.8189, 21.0333] },
  { name: 'Hai Bà Trưng', coordinates: [105.8544, 21.0136] },
  { name: 'Đống Đa', coordinates: [105.8270, 21.0189] },
  { name: 'Cầu Giấy', coordinates: [105.7944, 21.0333] },
  { name: 'Thanh Xuân', coordinates: [105.8144, 20.9925] },
  { name: 'Tây Hồ', coordinates: [105.8190, 21.0583] },
  { name: 'Long Biên', coordinates: [105.8967, 21.0364] },
];

// ============================================
// GENERATE SINGLE AIR QUALITY RECORD
// ============================================

/**
 * Generate một bản ghi Air Quality theo chuẩn NGSI-LD
 * @param {object} options - Options for generation
 * @returns {object} NGSI-LD AirQualityObserved entity
 */
export const generateAirQualityRecord = (options = {}) => {
  const location = options.location || randomChoice(HANOI_LOCATIONS);
  const timestamp = options.timestamp || new Date();
  const stationId = options.stationId || `station-${location.name.toLowerCase().replace(/\s/g, '-')}`;
  
  // Generate AQI (20-150 range)
  const aqi = options.aqi || randomBetween(20, 150);
  
  // Generate pollutant values based on AQI
  const pm25 = randomBetween(10, aqi * 0.7);
  const pm10 = randomBetween(15, aqi * 0.9);
  const o3 = randomBetween(5, aqi * 0.4);
  const no2 = randomBetween(8, aqi * 0.5);
  const so2 = randomBetween(3, aqi * 0.3);
  const co = randomBetween(0.5, aqi * 0.1);

  return {
    id: `urn:ngsi-ld:AirQualityObserved:${stationId}:${timestamp.toISOString()}`,
    type: 'AirQualityObserved',
    '@context': [
      'https://smartdatamodels.org/context.jsonld',
      { 'sosa': 'http://www.w3.org/ns/sosa/' }
    ],
    
    // SOSA properties
    'sosa:madeBySensor': `urn:ngsi-ld:Device:mq135-${stationId}`,
    'sosa:observedProperty': 'AirQuality',
    'sosa:hasFeatureOfInterest': `urn:ngsi-ld:Air:urban-hanoi-${location.name}`,
    
    // Location (GeoProperty)
    location: {
      type: 'GeoProperty',
      value: {
        type: 'Point',
        coordinates: location.coordinates
      }
    },
    
    // Date Observed
    dateObserved: {
      type: 'Property',
      value: timestamp.toISOString()
    },
    
    // Air Quality Index
    airQualityIndex: {
      type: 'Property',
      value: parseFloat(aqi.toFixed(1)),
      unitCode: 'P1'
    },
    
    // PM2.5
    pm25: {
      type: 'Property',
      value: parseFloat(pm25.toFixed(2)),
      unitCode: 'GQ',
      observedAt: timestamp.toISOString()
    },
    
    // PM10
    pm10: {
      type: 'Property',
      value: parseFloat(pm10.toFixed(2)),
      unitCode: 'GQ',
      observedAt: timestamp.toISOString()
    },
    
    // O3 (Ozone)
    o3: {
      type: 'Property',
      value: parseFloat(o3.toFixed(2)),
      unitCode: 'GQ',
      observedAt: timestamp.toISOString()
    },
    
    // NO2 (Nitrogen Dioxide)
    no2: {
      type: 'Property',
      value: parseFloat(no2.toFixed(2)),
      unitCode: 'GQ',
      observedAt: timestamp.toISOString()
    },
    
    // SO2 (Sulfur Dioxide)
    so2: {
      type: 'Property',
      value: parseFloat(so2.toFixed(2)),
      unitCode: 'GQ',
      observedAt: timestamp.toISOString()
    },
    
    // CO (Carbon Monoxide)
    co: {
      type: 'Property',
      value: parseFloat(co.toFixed(2)),
      unitCode: 'GQ',
      observedAt: timestamp.toISOString()
    }
  };
};

// ============================================
// GENERATE MULTIPLE RECORDS
// ============================================

/**
 * Generate array of Air Quality records
 * @param {number} count - Number of records
 * @param {object} options - Options
 * @returns {array} Array of NGSI-LD records
 */
export const generateAirQualityRecords = (count = 10, options = {}) => {
  const records = [];
  
  for (let i = 0; i < count; i++) {
    const location = randomChoice(HANOI_LOCATIONS);
    const timestamp = new Date(Date.now() - i * 60 * 1000); // 1 phút/record
    
    records.push(generateAirQualityRecord({
      location,
      timestamp,
      ...options
    }));
  }
  
  return records;
};

// ============================================
// GENERATE HISTORICAL DATA
// ============================================

/**
 * Generate historical data for a date range
 * @param {Date} fromDate - Start date
 * @param {Date} toDate - End date
 * @param {number} intervalMinutes - Interval between records
 * @returns {array} Array of historical records
 */
export const generateHistoricalData = (fromDate, toDate, intervalMinutes = 60) => {
  const records = [];
  let currentDate = new Date(fromDate);
  
  while (currentDate <= toDate) {
    const location = randomChoice(HANOI_LOCATIONS);
    records.push(generateAirQualityRecord({
      location,
      timestamp: new Date(currentDate)
    }));
    
    currentDate = new Date(currentDate.getTime() + intervalMinutes * 60 * 1000);
  }
  
  return records.sort((a, b) => 
    new Date(a.dateObserved.value) - new Date(b.dateObserved.value)
  );
};

// ============================================
// GET LATEST RECORD
// ============================================

/**
 * Get latest air quality record
 * @returns {object} Latest NGSI-LD record
 */
export const getLatestAirQualityRecord = () => {
  return generateAirQualityRecord({
    timestamp: new Date()
  });
};

// Export default
const airQualityMockData = {
  generateAirQualityRecord,
  generateAirQualityRecords,
  generateHistoricalData,
  getLatestAirQualityRecord,
  HANOI_LOCATIONS,
};

export default airQualityMockData;
