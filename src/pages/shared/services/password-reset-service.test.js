import { beforeEach, expect, it, vi } from 'vitest';
import axios from 'axios';
import { requestPasswordResetOtp, resetPasswordWithOtp } from './password-reset-service.js';

vi.mock('axios', () => ({ default: { post: vi.fn() } }));
vi.mock('../utils/api.js', () => ({ API_URL: 'https://example.com/api/' }));
beforeEach(() => vi.clearAllMocks());

it('requests the OTP using form-data and reads the email challenge', async () => {
  axios.post.mockResolvedValue({ data: { success: true, message: 'OTP sent', data: { email: 'manager@example.com', otp_required: true } } });
  expect(await requestPasswordResetOtp(' manager@example.com ')).toEqual({ email: 'manager@example.com', message: 'OTP sent' });
  const [url, body] = axios.post.mock.lastCall;
  expect(url).toBe('https://example.com/api/accounts/forgot-password');
  expect(body).toBeInstanceOf(FormData);
  expect(Object.fromEntries(body)).toEqual({ email: 'manager@example.com' });
});

it('sends all four reset fields and preserves password contents and OTP leading zeros', async () => {
  axios.post.mockResolvedValue({ data: { success: true } });
  await resetPasswordWithOtp({ email: ' manager@example.com ', otp: ' 012345 ', new_password: ' secret pass ', confirm_password: ' secret pass ' });
  const [url, body] = axios.post.mock.lastCall;
  expect(url).toBe('https://example.com/api/accounts/reset-password');
  expect(Object.fromEntries(body)).toEqual({ email: 'manager@example.com', otp: '012345', new_password: ' secret pass ', confirm_password: ' secret pass ' });
});

it('rejects an unsuccessful response instead of advancing or reporting success', async () => {
  axios.post.mockResolvedValue({ data: { success: false, message: 'Invalid OTP' } });
  await expect(resetPasswordWithOtp({ email: 'manager@example.com', otp: '012345', new_password: 'password', confirm_password: 'password' })).rejects.toThrow('Invalid OTP');
  await expect(requestPasswordResetOtp('manager@example.com')).rejects.toThrow('Invalid OTP');
});

it('does not show the reset step without an OTP challenge', async () => {
  axios.post.mockResolvedValue({ data: { success: true } });
  await expect(requestPasswordResetOtp('manager@example.com')).rejects.toThrow('Could not start password reset');
});
