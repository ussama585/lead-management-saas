import { message } from '../../../components/ui/notifications.jsx';
import { useState } from 'react';


/**
 * Custom hook for job-related handlers
 * Centralizes handler logic and state management for job listing pages
 */
export const useJobHandlers = ({
  statusMutation,
  remarksMutation,
  refetchJobs,
  canEditJobStatus,
  projectStatus,
  user,
  jobs,
}) => {
  // Status modal state
  const [statusModal, setStatusModal] = useState({
    visible: false,
    job: null,
    oldStatus: '',
    newStatus: '',
    remarks: ''
  });

  // Remarks modal state
  const [remarksModal, setRemarksModal] = useState({
    visible: false,
    job: null
  });

  /**
   * Handler to open status change modal
   */
  const handleStatusChange = (jobId, newStatus) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      // Check if user can edit job status
      if (!canEditJobStatus()) {
        if (projectStatus !== 'Active' && user?.user_type !== 'admin') {
          message.warning('Cannot update job status: Project is not Active');
        } else {
          message.warning('You do not have permission to edit this job');
        }
        return;
      }

      setStatusModal({
        visible: true,
        job,
        oldStatus: job.status || 'No Status',
        newStatus: newStatus,
        remarks: job.remarks || ''
      });
    }
  };

  /**
   * Handler to confirm status change
   */
  const handleStatusConfirm = () => {
    statusMutation.mutate({
      jobId: statusModal.job.id,
      status: statusModal.newStatus,
      remarks: statusModal.remarks
    });
  };

  return {
    // State
    statusModal,
    setStatusModal,
    remarksModal,
    setRemarksModal,

    // Handlers
    handleStatusChange,
    handleStatusConfirm,
  };
};

