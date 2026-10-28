import React from 'react';
import { useFormik } from 'formik';
import { useQuery } from 'react-query';
import { LoaderCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import { Button } from '../../components/ui/button.jsx';
import { message } from '../../components/ui/notifications.jsx';
import { demoRequestSchema } from './demo-request-schema.js';

const labels = { name: 'Name', email: 'Email', phone: 'Phone', agency_name: 'Agency Name', team_size: 'Team Size', status: 'Status', message: 'Message' };

export default function DemoRequestEditDialog({ requestId, userId, fetchDetail, updateDetail, onClose, onSaved }) {
  const detail = useQuery(['demoRequestDetail', userId, requestId], () => fetchDetail(requestId), { cacheTime: 0, refetchOnWindowFocus: false });
  const values = Object.fromEntries(Object.keys(labels).map(key => [key, detail.data?.[key] ?? '']));
  const formik = useFormik({
    initialValues: values, enableReinitialize: true, validationSchema: demoRequestSchema,
    onSubmit: async next => {
      try {
        const changed = Object.fromEntries(Object.entries(next).filter(([key, value]) => value !== values[key]));
        if (Object.keys(changed).length) {
          const result = await updateDetail(requestId, changed);
          message.success(result?.message || 'Demo request updated successfully.');
          await onSaved();
        }
        onClose();
      } catch (error) {
        const errors = error.response?.data?.errors;
        if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
          formik.setErrors(Object.fromEntries(Object.entries(errors).map(([key, value]) => [key, Array.isArray(value) ? value.join(' ') : String(value)])));
        }
        message.error(typeof errors === 'string' ? errors : error.response?.data?.message || error.message || 'Could not update demo request.');
      }
    },
  });
  return <Dialog open onOpenChange={open => { if (!open && !formik.isSubmitting) onClose(); }}>
    <DialogContent className="sm:max-w-xl" showCloseButton={!formik.isSubmitting} aria-describedby={undefined}>
      <DialogHeader><DialogTitle>Edit Demo Request</DialogTitle></DialogHeader>
      {detail.isLoading ? <LoaderCircle className="mx-auto animate-spin" aria-label="Loading request" />
        : detail.isError ? <div role="alert" className="space-y-3 text-destructive">
          <p>{detail.error?.message || 'Could not load request.'}</p><Button variant="outline" onClick={() => detail.refetch()}>Retry</Button>
        </div> : <form onSubmit={formik.handleSubmit} noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Object.entries(labels).map(([key, label]) => {
              const Control = key === 'message' ? Textarea : Input;
              const error = formik.touched[key] && formik.errors[key];
              return <div key={key} className={key === 'message' ? 'sm:col-span-2' : ''}>
                <label htmlFor={`demo-${key}`} className="mb-2 block text-sm font-medium">{label}{['name', 'email', 'phone', 'status'].includes(key) ? ' *' : ''}</label>
                <Control id={`demo-${key}`} name={key} type={key === 'email' ? 'email' : 'text'} value={formik.values[key]}
                  onChange={formik.handleChange} onBlur={formik.handleBlur} disabled={formik.isSubmitting}
                  aria-invalid={Boolean(error)} aria-describedby={error ? `demo-${key}-error` : undefined} />
                {error && <p id={`demo-${key}-error`} className="mt-1 text-sm text-destructive">{error}</p>}
              </div>;
            })}
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" disabled={formik.isSubmitting} onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={formik.isSubmitting}>{formik.isSubmitting ? 'Saving...' : 'Save changes'}</Button>
          </DialogFooter>
        </form>}
    </DialogContent>
  </Dialog>;
}
