import axios from 'axios';
import { API_URL } from '../utils/api.js';
import { otpErrorMessage } from '../utils/otp-error.js';

export async function resendOtp(email) {
  const address = email?.trim();
  if (!address) throw new Error('An email address is required to resend the OTP.');
  const body = new FormData();
  body.append('email', address);
  const { data } = await axios.post(`${API_URL.replace(/\/$/, '')}/accounts/resend-otp`, body);
  if (data?.success === false || data?.status === false) {
    const error = new Error(otpErrorMessage({ response: { data } }) || 'Could not resend OTP.');
    error.response = { data };
    throw error;
  }
  return data;
}

export function otpRetrySeconds(response, fallback = 60) {
  const seconds = Number(response?.response?.data?.retry_after ?? response?.retry_after ?? response?.response?.headers?.['retry-after']);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : fallback;
}

export function otpSecondsRemaining(deadline, now = Date.now()) {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
