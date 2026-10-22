import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { useFormik } from 'formik';
import { Command, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Label } from '@/components/ui/label.jsx';
import InputField from '@/components/input-field.component.jsx';
import { loginWithPassword } from '@/pages/shared/services/auth-service.js';
import { loginValidationSchema } from '@/pages/shared/schemas/schema.js';
import useUserStore from '@/pages/shared/store/user-store.js';
import { getRoleHome } from '../role-home.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, setUser } = useUserStore();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (localStorage.getItem('access_token') && getRoleHome(user?.user_type)) navigate(getRoleHome(user.user_type), { replace: true });
  }, [navigate, user]);
  const mutation = useMutation(loginWithPassword, {
    onSuccess: account => {
      queryClient.clear();
      setUser(account);
      navigate(getRoleHome(account.user_type), { replace: true });
    },
  });
  const formik = useFormik({ initialValues: { email: '', password: '' }, validationSchema: loginValidationSchema, onSubmit: values => mutation.mutate(values) });
  return <div className='sop-auth'>
    <aside className='sop-auth-brand'>
      <div className='flex items-center gap-3 text-lg font-semibold'><Command />Search O Pal</div>
      <div><h2>Your team. Your work.<br />One workspace.</h2><p>Manage your leads, clients, projects, and people with a clear view of what matters.</p></div>
      <span className='text-sm'>Search O Pal management system</span>
    </aside>
    <main className='sop-auth-form'><div>
      <div className='mb-8 flex items-center gap-2 font-semibold'><Command className='size-5' />Search O Pal</div>
      <h1>Welcome back</h1><p className='sop-muted'>Enter your credentials to sign in to your workspace.</p>
      <form onSubmit={formik.handleSubmit} noValidate>
        {['email', 'password'].map(name => <div className='sop-field' key={name}>
          <Label htmlFor={name}>{name === 'email' ? 'Email address' : 'Password'}</Label>
          <InputField id={name} name={name} type={name} autoComplete={name === 'email' ? 'username' : 'current-password'} placeholder={name === 'email' ? 'name@company.com' : 'Enter your password'} disabled={mutation.isLoading} value={formik.values[name]} onChange={formik.handleChange} onBlur={formik.handleBlur} aria-invalid={Boolean(formik.touched[name] && formik.errors[name])} aria-describedby={formik.touched[name] && formik.errors[name] ? `${name}-error` : undefined} />
          {formik.touched[name] && formik.errors[name] && <span id={`${name}-error`} className='sop-field-error'>{formik.errors[name]}</span>}
        </div>)}
        <Link to='/forgot-password' className='text-right text-sm underline underline-offset-4'>Forgot password?</Link>
        <Button type='submit' disabled={mutation.isLoading}>{mutation.isLoading && <Loader2 className='size-4 animate-spin' />}{mutation.isLoading ? 'Signing in...' : 'Sign in'}</Button>
        {mutation.isError && <p role='alert' className='sop-field-error'>{mutation.error?.message || 'Unable to sign in. Please check your credentials and try again.'}</p>}
      </form>
    </div></main>
  </div>;
}
