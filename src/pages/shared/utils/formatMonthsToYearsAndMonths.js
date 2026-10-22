/**
 * Converts a total number of months into a readable "X year(s) Y month(s)" string.
 *
 * @param {number|string|null|undefined} monthsInput - Total months (e.g. 14 → "1 year 2 months")
 * @returns {string}
 *
 * @example
 * formatMonthsToYearsAndMonths(14)  // "1 year 2 months"
 * formatMonthsToYearsAndMonths(12)  // "1 year"
 * formatMonthsToYearsAndMonths(2)   // "2 months"
 * formatMonthsToYearsAndMonths(0)   // "0 months"
 */
export function formatMonthsToYearsAndMonths(monthsInput) {
  if (monthsInput === null || monthsInput === undefined || monthsInput === '') {
    return '-';
  }

  const months = Number(monthsInput);
  if (!Number.isFinite(months) || months < 0) {
    return typeof monthsInput === 'string' ? monthsInput : '-';
  }

  const total = Math.floor(months);
  if (total === 0) {
    return '0 months';
  }

  const years = Math.floor(total / 12);
  const monthsRemainder = total % 12;
  const parts = [];

  if (years > 0) {
    parts.push(`${years} year${years === 1 ? '' : 's'}`);
  }
  if (monthsRemainder > 0) {
    parts.push(`${monthsRemainder} month${monthsRemainder === 1 ? '' : 's'}`);
  }

  return parts.join(' ');
}
