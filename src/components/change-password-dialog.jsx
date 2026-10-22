import React from 'react';
import { Alert, Input, Modal, message } from 'antd';
import { useFormik } from 'formik';
import { useMutation } from 'react-query';
import api from '../pages/shared/services/api.js';
import { changePasswordSchema } from '../pages/auth/schemas/change-password-schema.js';

export async function changePassword({ old_password, new_password }) {
  const { data } = await api.post('/accounts/change-password', { old_password, new_password });
  if (data?.success === false || data?.status === false) throw new Error(data.message || 'Could not change password.');
  return data;
}

export default function ChangePasswordDialog({ open, onClose }) {
  const mutation = useMutation(changePassword, {
    onSuccess: result => {
      message.success(result?.message || 'Password changed successfully.');
      formik.resetForm();
      onClose();
    },
    onError: error => {
      const body = error?.response?.data;
      const fields = body?.errors || body;
      const errors = {};
      for (const field of ['old_password', 'new_password']) {
        if (typeof fields?.[field] === 'string') errors[field] = fields[field];
        else if (Array.isArray(fields?.[field])) errors[field] = fields[field].join(' ');
      }
      formik.setErrors(errors);
      formik.setTouched(Object.fromEntries(Object.keys(errors).map(field => [field, true])), false);
      formik.setStatus(Object.keys(errors).length ? null : body?.message || body?.detail || error.message || 'Could not change password.');
    },
  });
  const formik = useFormik({
    initialValues: { old_password: '', new_password: '', confirm_password: '' },
    validationSchema: changePasswordSchema,
    onSubmit: async values => { try { await mutation.mutateAsync(values); } catch { /* Show errors through Formik. */ } },
  });
  function close() {
    if (mutation.isLoading) return;
    formik.resetForm();
    mutation.reset();
    onClose();
  }
  return <Modal title='Reset password' open={open} onCancel={close} onOk={formik.submitForm} okText='Update password' confirmLoading={mutation.isLoading}
    closable={!mutation.isLoading} maskClosable={!mutation.isLoading} keyboard={!mutation.isLoading} cancelButtonProps={{ disabled: mutation.isLoading }}>
    <form onSubmit={formik.handleSubmit} noValidate className='grid gap-4 py-4'>
      {[
        ['old_password', 'Current password', 'current-password'], ['new_password', 'New password', 'new-password'], ['confirm_password', 'Confirm new password', 'new-password'],
      ].map(([field, label, autoComplete]) => <div key={field}>
        <label htmlFor={`change-${field}`} className='mb-2 block text-sm font-medium'>{label}</label>
        <Input.Password id={`change-${field}`} name={field} autoComplete={autoComplete} value={formik.values[field]} onChange={formik.handleChange} onBlur={formik.handleBlur}
          disabled={mutation.isLoading} status={formik.touched[field] && formik.errors[field] ? 'error' : undefined}
          aria-invalid={Boolean(formik.touched[field] && formik.errors[field])} aria-describedby={formik.touched[field] && formik.errors[field] ? `${field}-error` : undefined} />
        {formik.touched[field] && formik.errors[field] && <p id={`${field}-error`} role='alert' className='mt-1 text-sm text-destructive'>{formik.errors[field]}</p>}
      </div>)}
      {formik.status && <Alert type='error' showIcon message={formik.status} />}
      <button type='submit' hidden disabled={mutation.isLoading}>Update password</button>
    </form>
  </Modal>;
}
