import { afterEach, expect, it, vi } from 'vitest';
import { systemJobTimezone } from './system-job-timezone.js';

afterEach(() => vi.restoreAllMocks());
it.each([
  [-300, '(UTC+05:00)'], [-345, '(UTC+05:45)'], [300, '(UTC-05:00)'], [0, '(UTC+00:00)'],
])('matches the system offset %s to the timezone dropdown', (minutes, prefix) => {
  vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(minutes);
  expect(systemJobTimezone().startsWith(prefix)).toBe(true);
});
