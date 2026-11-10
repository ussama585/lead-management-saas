import { afterEach, expect, it, vi } from 'vitest';
import { dataLeadJobSchema, earliestCvDeadline } from './data-lead-job-schema.js';

afterEach(() => vi.useRealTimers());
it('rejects past dates and permits today and future deadlines', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 10, 15));
  expect(earliestCvDeadline()).toBe('2026-11-10T00:00');
  await expect(dataLeadJobSchema.validateAt('cv_submission_deadline', { cv_submission_deadline: '2026-11-09T23:59' })).rejects.toThrow('cannot be in the past');
  for (const deadline of ['', '2026-11-10T00:00', '2026-11-11T10:00']) {
    await expect(dataLeadJobSchema.validateAt('cv_submission_deadline', { cv_submission_deadline: deadline })).resolves.toBe(deadline);
  }
});

it('rejects past expected joining dates and permits today and future dates', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 10, 15));
  await expect(dataLeadJobSchema.validateAt('expected_joining_date', { expected_joining_date: '2026-11-09T23:59' })).rejects.toThrow('cannot be in the past');
  for (const value of ['', '2026-11-10T00:00', '2026-11-11T10:00']) {
    await expect(dataLeadJobSchema.validateAt('expected_joining_date', { expected_joining_date: value })).resolves.toBe(value);
  }
});
