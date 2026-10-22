const formatDateUniversal = (rawDate, showTime = false) => {
  if (!rawDate) return '';
  const date = new Date(rawDate);
  if (isNaN(date.getTime())) return '';

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const month = monthNames[date.getMonth()]
  const day = date.getDate();
  const year = date.getFullYear();

  if (showTime) {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}, ${month} ${day}, ${year}`;
  } else {
    return `${month} ${day}, ${year}`;
  }
};

/** Ordinal suffix for day (1st, 2nd, 3rd, 4th, ...) */
const getOrdinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/** Format date as "January 28th, 2026" for proposals */
const formatDateOrdinal = (rawDate) => {
  if (!rawDate) return '';
  const date = new Date(rawDate);
  if (isNaN(date.getTime())) return '';
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = monthNames[date.getMonth()];
  const day = getOrdinal(date.getDate());
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

/** Format time only as "12:30 PM" */
const formatTimeUniversal = (rawDate) => {
  if (!rawDate) return '';
  const date = new Date(rawDate);
  if (isNaN(date.getTime())) return '';
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  return `${hours}:${minutes} ${ampm}`;
};

/**
 * Calculate duration between two dates and return human-readable string.
 * @param {string|Date} startDate - Start date
 * @param {string|Date|null} endDate - End date; if null, uses today (for current roles)
 * @returns {string} e.g. "2 years 3 months", "8 months", "1 year", or "" if invalid
 */
const getDurationBetweenDates = (startDate, endDate = null) => {
  if (!startDate) return '';
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return '';
  const end = endDate ? new Date(endDate) : new Date();
  if (isNaN(end.getTime())) return '';

  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;
  if (months < 0) return '';

  if (months === 0) return 'Less than 1 month';
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const yearPart = `${years} year${years === 1 ? '' : 's'}`;
  if (remainingMonths === 0) return yearPart;
  const monthPart = `${remainingMonths} month${remainingMonths === 1 ? '' : 's'}`;
  return `${yearPart} ${monthPart}`;
};

/**
 * Labels for next follow-up date/time from list/detail API rows.
 * Uses next_followup_date (ISO or date-only) and optional next_followup_time / next_followup_time_str from backend.
 */
const getNextFollowUpDateTimeParts = (row) => {
  const required = !!row?.is_next_followup_required;
  if (!required) {
    return { dateText: 'Not Required', timeText: '-' };
  }
  const raw = row?.next_followup_date ?? null;
  if (raw === null || raw === undefined || raw === '') {
    return { dateText: '-', timeText: '-' };
  }

  // Keep date strictly from API key value (avoid timezone day shift for ISO strings)
  let dateText = '-';
  if (typeof raw === 'string') {
    const datePart = raw.includes('T') ? raw.split('T')[0] : raw;
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const parsed = new Date(`${datePart}T00:00:00`);
      dateText = Number.isNaN(parsed.getTime()) ? '-' : formatDateUniversal(parsed, false);
    } else {
      dateText = formatDateUniversal(raw, false);
    }
  } else {
    dateText = formatDateUniversal(raw, false);
  }
  const explicit =
    row?.next_followup_time_only ??
    row?.next_followup_time ??
    row?.next_followup_time_str;

  let timeText = '-';
  if (explicit != null && String(explicit).trim() !== '') {
    const str = String(explicit).trim();
    if (/[ap]m\b/i.test(str)) {
      timeText = str;
    } else {
      let datePrefix = null;
      if (typeof raw === 'string') {
        datePrefix = raw.includes('T') ? raw.split('T')[0] : raw;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(datePrefix)) datePrefix = null;
      }
      if (!datePrefix) {
        const d = new Date(raw);
        if (!Number.isNaN(d.getTime())) {
          const y = d.getFullYear();
          const mo = String(d.getMonth() + 1).padStart(2, '0');
          const da = String(d.getDate()).padStart(2, '0');
          datePrefix = `${y}-${mo}-${da}`;
        }
      }
      const timeSegment =
        str.length === 5 && /^\d{1,2}:\d{2}$/.test(str) ? `${str}:00` : str;
      const iso = datePrefix ? `${datePrefix}T${timeSegment}` : str;
      const parsed = new Date(iso);
      timeText = Number.isNaN(parsed.getTime()) ? str : formatTimeUniversal(parsed);
    }
  } else {
    timeText = formatTimeUniversal(raw);
  }

  return { dateText, timeText };
};

export default formatDateUniversal;
export {
  formatDateUniversal,
  formatDateOrdinal,
  formatTimeUniversal,
  getDurationBetweenDates,
  getNextFollowUpDateTimeParts,
};
// Deprecated exports for backward compatibility (to be removed after migration)
export const formatDate = (rawDate) => formatDateUniversal(rawDate, false);
export const formatDateTime = (rawDate) => formatDateUniversal(rawDate, true);
