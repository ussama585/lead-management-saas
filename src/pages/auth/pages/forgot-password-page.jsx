import React from 'react';
import axios from 'axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation } from 'react-query';
import { Button } from '@/components/ui/button.jsx';
import { Label } from '@/components/ui/label.jsx';
import InputField from '@/components/input-field.component.jsx';
import AuthCard from '../components/auth-card.jsx';
import { API_URL } from '@/pages/shared/utils/api.js';
export default function ForgotPasswordPage() {
  const mutation = useMutation(values => axios.post(`${API_URL.replace(/\/$/, '')}/accounts/password_reset/`, values));
  const formik = useFormik({ initialValues: { email: '' }, validationSchema: Yup.object({ email: Yup.string().email('Enter a valid email address').required('Email is required') }), onSubmit: values => mutation.mutate(values) });
  return <AuthCard title='Forgot password?' description='Enter your email address to request password reset instructions.'>
    {mutation.isSuccess ? <p role='status' className='text-sm'>Password reset instructions have been requested. Check your email.</p> : <form onSubmit={formik.handleSubmit} noValidate className='grid gap-4'>
      <div className='sop-field'><Label htmlFor='email'>Email address</Label><InputField id='email' name='email' type='email' autoComplete='email' value={formik.values.email} onChange={formik.handleChange} onBlur={formik.handleBlur} aria-invalid={Boolean(formik.touched.email && formik.errors.email)} />{formik.touched.email && formik.errors.email && <span className='sop-field-error'>{formik.errors.email}</span>}</div>
      <Button type='submit' disabled={mutation.isLoading}>{mutation.isLoading ? 'Sending...' : 'Send reset instructions'}</Button>
      {mutation.isError && <p role='alert' className='sop-field-error'>Unable to send instructions. Please try again.</p>}
    </form>}
  </AuthCard>;
}
