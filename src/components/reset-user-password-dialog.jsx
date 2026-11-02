import React from 'react';
import { useFormik } from 'formik';
import { useMutation } from 'react-query';
import { Modal } from './ui/app-modal.jsx';
import { Input } from './ui/app-controls.jsx';
import { message } from './ui/notifications.jsx';
import api from '../pages/shared/services/api.js';
import { resetUserPasswordSchema } from '../pages/users/schemas/reset-user-password-schema.js';

export async function resetUserPassword(userSlug, values) {
  if (!userSlug) throw new Error('User slug is missing. Reload the user list and try again.');
  const { data } = await api.post('/accounts/change-password', {
    user_slug: userSlug,
    new_password: values.new_password,
    confirm_password: values.confirm_password,
  });
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not reset password.');
  return data;
}

export default function ResetUserPasswordDialog({ user, onClose }) {
  const mutation = useMutation(values => resetUserPassword(user.user_slug ?? user.slug, values));
  const formik = useFormik({
    initialValues: { new_password: '', confirm_password: '' },
    validationSchema: resetUserPasswordSchema,
    onSubmit: async values => {
      formik.setStatus(null);
      try {
        const result = await mutation.mutateAsync(values);
        message.success(result?.message || 'Password reset successfully.');
        onClose();
      } catch (error) {
        const body = error?.response?.data;
        const fields = body?.errors || body;
        const errors = {};
        for (const field of ['new_password', 'confirm_password']) {
          if (fields?.[field]) errors[field] = Array.isArray(fields[field]) ? fields[field].join(' ') : String(fields[field]);
        }
        formik.setErrors(errors);
        formik.setStatus(Object.keys(errors).length ? null : body?.message || body?.detail || error.message);
      }
    },
  });
  return <Modal open title={`Reset password${user.name ? ` — ${user.name}` : ''}`} onCancel={onClose}
    onOk={formik.submitForm} okText="Reset password" confirmLoading={mutation.isLoading}
    closable={!mutation.isLoading} maskClosable={!mutation.isLoading} keyboard={!mutation.isLoading}
    cancelButtonProps={{ disabled: mutation.isLoading }}>
    <form onSubmit={formik.handleSubmit} noValidate className="grid gap-4 py-4">
      {[['new_password', 'New password'], ['confirm_password', 'Confirm password']].map(([field, label]) => <div key={field}>
        <label htmlFor={`reset-user-${field}`} className="mb-2 block text-sm font-medium">{label}</label>
        <Input.Password id={`reset-user-${field}`} name={field} autoComplete="new-password" value={formik.values[field]}
          onChange={formik.handleChange} onBlur={formik.handleBlur} disabled={mutation.isLoading}
          aria-invalid={Boolean(formik.touched[field] && formik.errors[field])} />
        {formik.touched[field] && formik.errors[field] && <p role="alert" className="mt-1 text-sm text-destructive">{formik.errors[field]}</p>}
      </div>)}
      {formik.status && <p role="alert" className="text-sm text-destructive">{formik.status}</p>}
      <button type="submit" hidden disabled={mutation.isLoading}>Reset password</button>
    </form>
  </Modal>;
}
