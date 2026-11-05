import React from 'react';
import { useFormik } from 'formik';
import { Textarea } from '../../../../components/ui/textarea.jsx';
import { deleteJobSchema } from './delete-job-schema.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../../components/ui/dialog.jsx';
import { Button } from '../../../../components/ui/button.jsx';
import { message } from '../../../../components/ui/notifications.jsx';

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
  const isDeleting = formik.isSubmitting;
  const error = formik.touched.remarks && formik.errors.remarks;
  return <Dialog open onOpenChange={open => { if (!open && !isDeleting) onClose(); }}>
    <DialogContent showCloseButton={!isDeleting}>
      <DialogHeader>
        <DialogTitle>Delete Job</DialogTitle>
        <DialogDescription>Add remarks before deleting {job.job_title || 'this job'}. This action cannot be undone.</DialogDescription>
      </DialogHeader>
      <form onSubmit={formik.handleSubmit} noValidate>
        <label htmlFor="delete-job-remarks" className="mb-2 block text-sm font-medium">Remarks *</label>
        <Textarea id="delete-job-remarks" name="remarks" placeholder="Enter reason for deleting this job"
          value={formik.values.remarks} onChange={formik.handleChange} onBlur={formik.handleBlur}
          disabled={isDeleting} rows={4} aria-invalid={Boolean(error)} aria-describedby={error ? 'delete-job-remarks-error' : undefined} />
        {error && <p id="delete-job-remarks-error" role="alert" className="mt-1 text-sm text-destructive">{error}</p>}
        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" disabled={isDeleting} onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="destructive" disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Confirm'}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
