/**
 * UN/CEFACT Common Code to Human-Readable Unit Mapper
 * 
 * Maps NGSI-LD unitCode values (UN/CEFACT codes) to display strings
 * Reference: https://unece.org/trade/cefact/UNLOCODE-Download
 */

export const UNIT_CODE_MAP = {
  // Air Quality - Concentration
  'GQ': 'µg/m³',      // Microgram per cubic metre
  'GP': 'mg/m³',      // Milligram per cubic metre
  '59': 'ppm',        // Parts per million
  
  // Temperature
  'CEL': '°C',        // Degree Celsius
  'FAH': '°F',        // Degree Fahrenheit
  'KEL': 'K',         // Kelvin
  
  // Percentage
  'P1': '%',          // Percentage
  
  // Pressure
  'A97': 'hPa',       // Hectopascal
  'E96': 'Pa',        // Pascal
  
  // Speed
  'MTS': 'm/s',       // Metre per second
  'KMH': 'km/h',      // Kilometre per hour
};

/**
 * Convert UN/CEFACT unit code to human-readable display string
 * @param {string} unitCode - UN/CEFACT code (e.g., 'GQ')
 * @returns {string} Display string (e.g., 'µg/m³')
 */
export const getUnitDisplay = (unitCode) => {
  if (!unitCode) return '';
  
  // If already a display string, return as-is
  if (unitCode.includes('µ') || unitCode.includes('°')) {
    return unitCode;
  }
  
  return UNIT_CODE_MAP[unitCode] || unitCode;
};

/**
 * Format value with unit for display
 * @param {number} value - Numeric value
 * @param {string} unitCode - UN/CEFACT code
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted string (e.g., '25.50 µg/m³')
 */
export const formatValueWithUnit = (value, unitCode, decimals = 2) => {
  if (value === null || value === undefined) return 'N/A';
  
  const formattedValue = typeof value === 'number' 
    ? value.toFixed(decimals) 
    : value;
  
  const unit = getUnitDisplay(unitCode);
  
  return unit ? `${formattedValue} ${unit}` : formattedValue;
};

