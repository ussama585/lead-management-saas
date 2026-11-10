import { timezoneOptions } from './job-form-options.js';

export function systemJobTimezone() {
  const minutes = -new Date().getTimezoneOffset();
  const absolute = Math.abs(minutes);
  const offset = `${minutes < 0 ? '-' : '+'}${String(Math.floor(absolute / 60)).padStart(2, '0')}:${String(absolute % 60).padStart(2, '0')}`;
  return timezoneOptions.find(option => option.value.startsWith(`(UTC${offset})`))?.value || '';
}
