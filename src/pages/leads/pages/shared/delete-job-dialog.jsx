import React from 'react';
import { useFormik } from 'formik';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../../components/ui/dialog.jsx';
import { Textarea } from '../../../../components/ui/textarea.jsx';
import { Button } from '../../../../components/ui/button.jsx';
import { message } from '../../../../components/ui/notifications.jsx';
import { deleteJobSchema } from './delete-job-schema.js';

export default function DeleteJobDialog({ job, onClose, onConfirm }) {
  const formik = useFormik({
    initialValues: { remarks: '' },
    validationSchema: deleteJobSchema,
    onSubmit: async values => {
      try {
        await onConfirm(job.id, { delete_reason: values.remarks.trim() });
        onClose();
      } catch (error) {
        const data = error.response?.data;
        message.error(typeof data?.errors === 'string' ? data.errors : data?.message || error.message || 'Could not delete job.');
      }
    },
  });
  const error = formik.touched.remarks && formik.errors.remarks;
  return <Dialog open onOpenChange={open => { if (!open && !formik.isSubmitting) onClose(); }}>
    <DialogContent showCloseButton={!formik.isSubmitting}>
      <DialogHeader>
        <DialogTitle>Delete Job</DialogTitle>
        <DialogDescription>Add remarks before deleting {job.job_title || 'this job'}. This action cannot be undone.</DialogDescription>
      </DialogHeader>
      <form onSubmit={formik.handleSubmit} noValidate>
        <label htmlFor="delete-lead-remarks" className="mb-2 block text-sm font-medium">Remarks *</label>
        <Textarea id="delete-lead-remarks" name="remarks" value={formik.values.remarks} onChange={formik.handleChange}
          onBlur={formik.handleBlur} disabled={formik.isSubmitting} placeholder="Enter remarks" rows={4}
          aria-invalid={Boolean(error)} aria-describedby={error ? 'delete-lead-remarks-error' : undefined} />
        {error && <p id="delete-lead-remarks-error" className="mt-1 text-sm text-destructive">{error}</p>}
        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" disabled={formik.isSubmitting} onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="destructive" disabled={formik.isSubmitting}>{formik.isSubmitting ? 'Deleting...' : 'Confirm'}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
