import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { useFormik } from 'formik';
import { Command, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Label } from '@/components/ui/label.jsx';
import InputField from '@/components/input-field.component.jsx';
import { loginSuperAdmin } from '@/pages/shared/services/auth-service.js';
import { loginValidationSchema } from '@/pages/shared/schemas/schema.js';
import useUserStore from '@/pages/shared/store/user-store.js';
import { getRoleHome } from '../role-home.js';

export default function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, setUser } = useUserStore();
  useEffect(() => {
    if (localStorage.getItem('access_token') && getRoleHome(user?.user_type)) {
      navigate(getRoleHome(user.user_type), { replace: true });
    }
  }, [navigate, user]);
  const mutation = useMutation(loginSuperAdmin, {
    onSuccess: account => {
      queryClient.clear();
      setUser(account);
      navigate(getRoleHome(account.user_type), { replace: true });
    },
  });
  const formik = useFormik({
    initialValues: { email: '', password: '' }, validationSchema: loginValidationSchema,
    onSubmit: values => mutation.mutate(values),
  });
  return <div className='sop-auth'>
    <aside className='sop-auth-brand'>
      <div className='flex items-center gap-3 text-lg font-semibold'><Command />Search O Pal</div>
      <div><h2>Super admin workspace</h2><p>Manage your application, users, and settings.</p></div>
      <span className='text-sm'>Search O Pal management system</span>
    </aside>
    <main className='sop-auth-form'><div>
      <div className='mb-8 flex items-center gap-2 font-semibold'><ShieldCheck className='size-5' />Super Admin</div>
      <h1>Super admin sign in</h1><p className='sop-muted'>Enter your super admin credentials to continue.</p>
      <form onSubmit={formik.handleSubmit} noValidate>
        {['email', 'password'].map(name => <div className='sop-field' key={name}>
          <Label htmlFor={`super-admin-${name}`}>{name === 'email' ? 'Email address' : 'Password'}</Label>
          <InputField id={`super-admin-${name}`} name={name} type={name} autoComplete={name === 'email' ? 'username' : 'current-password'}
            placeholder={name === 'email' ? 'admin@company.com' : 'Enter your password'} disabled={mutation.isLoading}
            value={formik.values[name]} onChange={formik.handleChange} onBlur={formik.handleBlur}
            aria-invalid={Boolean(formik.touched[name] && formik.errors[name])} aria-describedby={formik.touched[name] && formik.errors[name] ? `super-admin-${name}-error` : undefined} />
          {formik.touched[name] && formik.errors[name] && <span id={`super-admin-${name}-error`} className='sop-field-error'>{formik.errors[name]}</span>}
        </div>)}
        <Button type='submit' disabled={mutation.isLoading}>{mutation.isLoading && <Loader2 className='size-4 animate-spin' />}{mutation.isLoading ? 'Signing in...' : 'Sign in'}</Button>
        {mutation.isError && <p role='alert' className='sop-field-error'>{mutation.error.message}</p>}
      </form>
      <Link to='/' className='mt-6 inline-block text-sm underline underline-offset-4'>Back to regular sign in</Link>
    </div></main>
  </div>;
}
