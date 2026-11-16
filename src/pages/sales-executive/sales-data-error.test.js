import { expect, it } from 'vitest';
import { salesDataError } from './sales-data-error.js';

it('uses API messages and validation details instead of the generic HTTP error', () => {
  expect(salesDataError({ status: false, message: 'Validation failed.', errors: 'This phone number already exists.' })).toBe('This phone number already exists.');
  expect(salesDataError({ message: 'Request failed with status code 400', response: { data: { message: 'Phone already exists' } } })).toBe('Phone already exists');
  expect(salesDataError({ response: { data: { errors: { phone: ['Invalid phone'], email: ['Invalid email'] } } } })).toBe('Invalid phone Invalid email');
  expect(salesDataError({ email: ['Email already exists'] })).toBe('Email already exists');
});

it('handles network errors and empty errors safely', () => {
  const error = new Error('Network error');
  error.request = error;
  expect(salesDataError(error)).toBe('Network error');
  expect(salesDataError(null, 'Please try again')).toBe('Please try again');
});
