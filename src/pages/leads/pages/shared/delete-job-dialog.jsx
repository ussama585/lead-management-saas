import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../../components/ui/dialog.jsx';
import { Button } from '../../../../components/ui/button.jsx';
import { message } from '../../../../components/ui/notifications.jsx';

export default function DeleteJobDialog({ job, onClose, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const confirmDelete = async () => {
      if (isDeleting) return;
      setIsDeleting(true);
      try {
        await onConfirm(job.id, {});
        onClose();
      } catch (error) {
        const data = error.response?.data;
        message.error(typeof data?.errors === 'string' ? data.errors : data?.message || error.message || 'Could not delete job.');
      } finally { setIsDeleting(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open && !isDeleting) onClose(); }}>
    <DialogContent showCloseButton={!isDeleting}>
      <DialogHeader>
        <DialogTitle>Delete Job</DialogTitle>
        <DialogDescription>Are you sure you want to delete {job.job_title || 'this job'}? This action cannot be undone.</DialogDescription>
      </DialogHeader>
        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" disabled={isDeleting} onClick={onClose}>Cancel</Button>
          <Button type="button" variant="destructive" disabled={isDeleting} onClick={confirmDelete}>{isDeleting ? 'Deleting...' : 'Confirm'}</Button>
        </DialogFooter>
    </DialogContent>
  </Dialog>;
}
