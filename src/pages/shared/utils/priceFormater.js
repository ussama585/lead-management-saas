/**
 * Formats a number as currency with commas
 * @param {number|string} value - The value to format
 * @param {string} currency - Currency code (e.g., 'PKR', 'USD')
 * @returns {string} Formatted price string (e.g., 'PKR 3,200')
 */
export const formatPrice = (value, currency = '') => {
  if (value === null || value === undefined || value === '') return '-';
  
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  
  if (isNaN(numValue)) return '-';
  
  const formatted = numValue.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return currency ? `${currency} ${formatted}` : formatted;
};

/**
 * Formats a number with commas (no currency)
 * @param {number|string} value - The value to format
 * @returns {string} Formatted number string
 */
export const formatNumberWithCommas = (value) => {
  if (value === null || value === undefined || value === '') return '';
  
  const str = String(value).replace(/[^\d.]/g, '');
  if (!str) return '';
  
  const [intPart, decPart] = str.split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
};