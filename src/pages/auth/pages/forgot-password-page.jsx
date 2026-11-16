import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import { useMutation } from 'react-query';
import { Button } from '@/components/ui/button.jsx';
import { Label } from '@/components/ui/label.jsx';
import { message } from '@/components/ui/notifications.jsx';
import InputField from '@/components/input-field.component.jsx';
import AuthCard from '../components/auth-card.jsx';
import { forgotPasswordSchema, resetPasswordOtpSchema } from '../schemas/forgot-password-schema.js';
import { requestPasswordResetOtp, resetPasswordWithOtp } from '../../shared/services/password-reset-service.js';
import { otpErrorMessage } from '../../shared/utils/otp-error.js';
import useOtpResend from '../hooks/use-otp-resend.js';

export default function ForgotPasswordPage({ signInPath = '/' }) {
  const navigate = useNavigate();
  const [resetEmail, setResetEmail] = useState('');
  const requestOtp = useMutation(requestPasswordResetOtp, {
    onSuccess: result => {
      resetForm.resetForm();
      setResetEmail(result.email);
      message.success(result.message || 'OTP sent successfully to your email.');
    },
    onError: error => message.error(otpErrorMessage(error) || 'Could not send OTP. Please try again.'),
  });
  const reset = useMutation(resetPasswordWithOtp, {
    onSuccess: result => {
      resetForm.resetForm();
      message.success(result?.message || 'Password reset successfully. Sign in with your new password.');
      navigate(signInPath, { replace: true });
    },
    onError: error => message.error(otpErrorMessage(error) || 'Could not reset password. Please try again.'),
  });
  const emailForm = useFormik({
    initialValues: { email: '' }, validationSchema: forgotPasswordSchema,
    onSubmit: values => { if (!requestOtp.isLoading) requestOtp.mutate(values.email); },
  });
  const resetForm = useFormik({
    initialValues: { otp: '', new_password: '', confirm_password: '' }, validationSchema: resetPasswordOtpSchema,
    onSubmit: values => { if (resetEmail && !reset.isLoading && !resend.pending) reset.mutate({ email: resetEmail, ...values }); },
  });
  const resend = useOtpResend({ open: Boolean(resetEmail), email: resetEmail, onResent: result => {
    resetForm.setFieldValue('otp', '', false);
    message.success(result?.message || 'A new OTP has been sent to your email.');
  } });
  const busy = reset.isLoading || resend.pending;
  const fieldError = (form, name) => form.touched[name] && form.errors[name]
    ? <span id={`${name}-error`} className="sop-field-error">{form.errors[name]}</span> : null;

  return <AuthCard signInPath={signInPath} title={resetEmail ? 'Reset password' : 'Forgot password?'}
    description={resetEmail ? `Enter the OTP sent to ${resetEmail} and choose your new password.` : 'Enter your email address to receive a password reset OTP.'}>
    {!resetEmail ? <form onSubmit={emailForm.handleSubmit} noValidate className="grid gap-4">
      <div className="sop-field">
        <Label htmlFor="email">Email address</Label>
        <InputField id="email" name="email" type="email" placeholder="Enter email" autoComplete="email" disabled={requestOtp.isLoading}
          value={emailForm.values.email} onChange={emailForm.handleChange} onBlur={emailForm.handleBlur}
          aria-invalid={Boolean(emailForm.touched.email && emailForm.errors.email)} aria-describedby={emailForm.touched.email && emailForm.errors.email ? 'email-error' : undefined} />
        {fieldError(emailForm, 'email')}
      </div>
      <Button type="submit" className="mt-2" disabled={requestOtp.isLoading}>{requestOtp.isLoading ? 'Sending...' : 'Send OTP'}</Button>
    </form> : <form onSubmit={resetForm.handleSubmit} noValidate className="grid gap-4">
      {[
        { name: 'otp', label: 'OTP', type: 'text', placeholder: 'Enter six digit OTP', autoComplete: 'one-time-code' },
        { name: 'new_password', label: 'New password', type: 'password', placeholder: 'Enter new password', autoComplete: 'new-password' },
        { name: 'confirm_password', label: 'Confirm password', type: 'password', placeholder: 'Confirm new password', autoComplete: 'new-password' },
      ].map(({ label, ...field }) => <div key={field.name} className="sop-field">
        <Label htmlFor={field.name}>{label}</Label>
        <InputField {...field} id={field.name} value={resetForm.values[field.name]} disabled={busy}
          {...(field.name === 'otp' ? { inputMode: 'numeric', maxLength: 6 } : {})}
          onChange={resetForm.handleChange} onBlur={resetForm.handleBlur}
          aria-invalid={Boolean(resetForm.touched[field.name] && resetForm.errors[field.name])}
          aria-describedby={resetForm.touched[field.name] && resetForm.errors[field.name] ? `${field.name}-error` : undefined} />
        {fieldError(resetForm, field.name)}
      </div>)}
      <Button type="submit" className="mt-2" disabled={busy}>{reset.isLoading ? 'Resetting...' : 'Reset password'}</Button>
      <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
        <button type="button" className="text-primary underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: 'transparent', border: 0, padding: 0 }} disabled={!resend.canResend || reset.isLoading} onClick={resend.resend}>
          {resend.pending ? 'Resending OTP...' : resend.remaining > 0 ? `Resend OTP in ${resend.remaining}s` : 'Resend OTP'}
        </button>
      </div>
      {resend.error && <p role="alert" className="sop-field-error">{resend.error}</p>}
    </form>}
  </AuthCard>;
}
