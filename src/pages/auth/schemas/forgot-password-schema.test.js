import { expect, it } from 'vitest';
import { forgotPasswordSchema, resetPasswordOtpSchema } from './forgot-password-schema.js';

it('requires a valid email before requesting an OTP', async () => {
  await expect(forgotPasswordSchema.validate({ email: 'invalid' })).rejects.toThrow('valid email');
  await expect(forgotPasswordSchema.validate({ email: ' manager@example.com ' })).resolves.toEqual({ email: 'manager@example.com' });
});

it('validates OTP and matching passwords before calling reset', async () => {
  const values = { otp: '012345', new_password: 'new-password', confirm_password: 'new-password' };
  await expect(resetPasswordOtpSchema.validate(values)).resolves.toEqual(values);
  await expect(resetPasswordOtpSchema.validate({ ...values, otp: '12abc6' })).rejects.toThrow('six digit OTP');
  await expect(resetPasswordOtpSchema.validate({ ...values, confirm_password: 'different' })).rejects.toThrow('Passwords must match');
  await expect(resetPasswordOtpSchema.validate({ ...values, new_password: 'short', confirm_password: 'short' })).rejects.toThrow('at least 8');
});
