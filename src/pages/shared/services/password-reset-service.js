import axios from 'axios';
import { API_URL } from '../utils/api.js';
import { otpErrorMessage } from '../utils/otp-error.js';

async function postPasswordReset(resource, fields) {
  const body = new FormData();
  Object.entries(fields).forEach(([key, value]) => body.append(key, value));
  const { data } = await axios.post(`${API_URL.replace(/\/$/, '')}/accounts/${resource}`, body);
  if (data?.success === false || data?.status === false) {
    const error = new Error(otpErrorMessage({ response: { data } }) || 'Password reset failed.');
    error.response = { data };
    throw error;
  }
  return data;
}

export async function requestPasswordResetOtp(email) {
  const address = email.trim();
  const result = await postPasswordReset('forgot-password', { email: address });
  const challenge = result?.data ?? result;
  if (challenge?.otp_required !== true) throw new Error('Could not start password reset. Please try again.');
  return { email: challenge.email || address, message: result?.message };
}

export function resetPasswordWithOtp({ email, otp, new_password, confirm_password }) {
  return postPasswordReset('reset-password', { email: email.trim(), otp: otp.trim(), new_password, confirm_password });
}
