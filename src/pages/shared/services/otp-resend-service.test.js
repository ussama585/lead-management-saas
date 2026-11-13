import { beforeEach, expect, it, vi } from 'vitest';
import axios from 'axios';
import { resendOtp, otpRetrySeconds, otpSecondsRemaining } from './otp-resend-service.js';

vi.mock('axios', () => ({ default: { post: vi.fn() } }));
vi.mock('../utils/api.js', () => ({ API_URL: 'https://example.com/api/' }));
beforeEach(() => vi.clearAllMocks());

it('posts the trimmed recipient email as form data to resend-otp', async () => {
  axios.post.mockResolvedValue({ data: { success: true, message: 'OTP sent' } });
  expect(await resendOtp(' admin@example.com ')).toEqual({ success: true, message: 'OTP sent' });
  const [url, body] = axios.post.mock.lastCall;
  expect(url).toBe('https://example.com/api/accounts/resend-otp');
  expect(body).toBeInstanceOf(FormData);
  expect(Object.fromEntries(body)).toEqual({ email: 'admin@example.com' });
});

it('does not send a resend request without an email', async () => {
  await expect(resendOtp(' ')).rejects.toThrow('email address');
  expect(axios.post).not.toHaveBeenCalled();
});

it('preserves unsuccessful API responses for displaying errors and retry timing', async () => {
  axios.post.mockResolvedValue({ data: { success: false, message: 'Wait 8 seconds', retry_after: 8 } });
  await expect(resendOtp('admin@example.com')).rejects.toMatchObject({ message: 'Wait 8 seconds', response: { data: { retry_after: 8 } } });
});

it('preserves HTTP 429 retry_after responses', async () => {
  const failure = { response: { status: 429, data: { message: 'Please wait', retry_after: 8 } } };
  axios.post.mockRejectedValue(failure);
  await expect(resendOtp('admin@example.com')).rejects.toBe(failure);
  expect(otpRetrySeconds(failure)).toBe(8);
});

it('supports numeric Retry-After headers and safe retry defaults', () => {
  expect(otpRetrySeconds({ response: { headers: { 'retry-after': '15' } } })).toBe(15);
  expect(otpRetrySeconds({ retry_after: 2.5 })).toBe(3);
  expect(otpRetrySeconds({ retry_after: -1 })).toBe(60);
  expect(otpRetrySeconds({})).toBe(60);
  expect(otpRetrySeconds({}, 0)).toBe(0);
});

it('keeps resend locked for the full minute and handles elapsed/background time', () => {
  const deadline = 160000;
  expect(otpSecondsRemaining(deadline, 100000)).toBe(60);
  expect(otpSecondsRemaining(deadline, 159999)).toBe(1);
  expect(otpSecondsRemaining(deadline, 160000)).toBe(0);
  expect(otpSecondsRemaining(deadline, 200000)).toBe(0);
});
