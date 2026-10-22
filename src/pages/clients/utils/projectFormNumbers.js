/**
 * Shared number formatting/parsing for project forms (add & edit).
 * Keeps currency inputs and 2-decimal rounding consistent.
 */

export function formatNumberWithCommas(value) {
  if (value === null || value === undefined || value === '') return '';
  const str = String(value).replace(/[^\d.]/g, '');
  if (!str) return '';
  const [intPart, decPart] = str.split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
}

export function unformatNumber(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/,/g, '');
}

export function toNumericValue(value) {
  const raw = parseFloat(unformatNumber(value));
  return Number.isFinite(raw) ? raw : 0;
}

export function formatCurrencyInput(value) {
  if (!value) return '';
  const cleanValue = value.replace(/[^\d.,]/g, '');
  return formatNumberWithCommas(cleanValue);
}

export function roundToTwoDecimals(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'string' ? Number(unformatNumber(value)) : Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.round(num * 100) / 100;
}
