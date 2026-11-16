import * as Yup from 'yup';

export const forgotPasswordSchema = Yup.object({
  email: Yup.string().trim().email('Enter a valid email address').required('Email is required'),
});

export const resetPasswordOtpSchema = Yup.object({
  otp: Yup.string().trim().matches(/^\d{6}$/, 'Enter the six digit OTP').required('OTP is required'),
  new_password: Yup.string().min(8, 'Password must be at least 8 characters').required('New password is required'),
  confirm_password: Yup.string().required('Confirm your new password').oneOf([Yup.ref('new_password')], 'Passwords must match'),
});
