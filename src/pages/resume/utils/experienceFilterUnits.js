/** Parsed CV filters send per-skill / per-designation experience as months. */
export const MONTHS_PER_EXPERIENCE_YEAR = 12;

/** Interpret UI input as whole years only; convert to stored months. */
export function yearsInputToStoredMonths(yearsInput) {
  const digits = String(yearsInput ?? '').replace(/\D/g, '');
  if (digits === '') return 0;
  const intYears = parseInt(digits, 10);
  if (!Number.isFinite(intYears) || intYears < 0) return 0;
  return intYears * MONTHS_PER_EXPERIENCE_YEAR;
}

/** Whole years (rounded) from stored months for filter UI — no decimals. */
export function storedMonthsToYearsDisplay(storedMonths) {
  const m = Number(storedMonths);
  if (!Number.isFinite(m) || m < 0) return '';
  if (m === 0) return '0';
  const wholeYears = Math.round(m / MONTHS_PER_EXPERIENCE_YEAR);
  return String(wholeYears);
}

/** Human-readable months value for CV list rows (e.g. "5 years", "1 year 8 months"). */
export function formatStoredMonthsAsExperience(storedMonths) {
  if (storedMonths == null || storedMonths === '') return '-';
  const m = Number(storedMonths);
  if (!Number.isFinite(m) || m < 0) return '-';
  if (m < 12) return `${m} month${m !== 1 ? 's' : ''}`;
  const years = Math.floor(m / MONTHS_PER_EXPERIENCE_YEAR);
  const remainder = m % MONTHS_PER_EXPERIENCE_YEAR;
  if (remainder === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years} year${years !== 1 ? 's' : ''} ${remainder} month${remainder !== 1 ? 's' : ''}`;
}

/** Active-filter chip label for overall experience (includes Exactly / Up to / At least). */
export function formatOverallExperienceFilterDisplay(experienceMonthsValue, mode, options = []) {
  const option = options.find((opt) => opt.value === String(experienceMonthsValue));
  const base = option
    ? option.label
    : `${experienceMonthsValue} month${Number(experienceMonthsValue) === 1 ? '' : 's'}`;
  const resolvedMode = mode || 'exact';
  if (resolvedMode === 'up_to') return `Up to ${base}`;
  if (resolvedMode === 'at_least') return `At least ${base}`;
  return `Exactly ${base}`;
}
