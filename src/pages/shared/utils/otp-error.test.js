import { describe, expect, it } from 'vitest';
import { otpErrorMessage } from './otp-error.js';

describe('OTP API errors', () => {
  it.each([
    [{ message: 'The code has expired.' }, 'The code has expired.'],
    [{ detail: 'Incorrect verification code.' }, 'Incorrect verification code.'],
    [{ errors: { otp: ['Invalid OTP.', 'Request another code.'] } }, 'Invalid OTP. Request another code.'],
    [{ otp: ['Code is invalid.'] }, 'Code is invalid.'],
  ])('shows the API response instead of the HTTP error', (body, expected) => {
    expect(otpErrorMessage({ response: { data: body }, message: 'Request failed with status code 400' })).toBe(expected);
  });
  it('preserves errors already extracted by a service', () => {
    expect(otpErrorMessage(new Error('OTP does not match.'))).toBe('OTP does not match.');
  });
});
