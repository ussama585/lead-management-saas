import React from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from 'react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button } from '@/components/ui/button.jsx';
import { Label } from '@/components/ui/label.jsx';
import InputField from '@/components/input-field.component.jsx';
import { API_URL } from '@/pages/shared/utils/api.js';
import AuthCard from '../components/auth-card.jsx';
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');
  const mutation = useMutation(values => axios.post(`${API_URL.replace(/\/$/, '')}/accounts/password_reset/confirm/?token=${encodeURIComponent(token)}`, { ...values, token }), { onSuccess: () => navigate('/') });
  const formik = useFormik({ initialValues: { password: '', password_again: '' }, validationSchema: Yup.object({ password: Yup.string().min(8, 'Use at least 8 characters').required('Password is required'), password_again: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Confirm your password') }), onSubmit: values => mutation.mutate(values) });
  return <AuthCard title='Reset your password' description='Choose a new password for your account.'>
    {!token ? <p role='alert' className='sop-field-error'>This reset link is missing its token. Request a new reset email.</p> : <form onSubmit={formik.handleSubmit} noValidate className='grid gap-4'>
      {['password', 'password_again'].map(name => <div key={name} className='sop-field'><Label htmlFor={name}>{name === 'password' ? 'New password' : 'Confirm password'}</Label><InputField id={name} name={name} type='password' autoComplete='new-password' value={formik.values[name]} onChange={formik.handleChange} onBlur={formik.handleBlur} aria-invalid={Boolean(formik.touched[name] && formik.errors[name])} />{formik.touched[name] && formik.errors[name] && <span className='sop-field-error'>{formik.errors[name]}</span>}</div>)}
      <Button type='submit' disabled={mutation.isLoading}>{mutation.isLoading ? 'Updating...' : 'Update password'}</Button>
      {mutation.isError && <p role='alert' className='sop-field-error'>Unable to update your password. Check your reset link and try again.</p>}
    </form>}
  </AuthCard>;
}
