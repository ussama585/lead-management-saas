import { message } from '../../../components/ui/notifications.jsx';
import { useState } from 'react';


/**
 * Custom hook that provides all handler functions for client management
 * including remarks, status changes, and recruiter assignments
 */
export const useClientHandlers = ({
  remarksMutation,
  statusMutation,
  recruiterAssignmentMutation,
  recruiterExecutivesList,
}) => {
  // Modal states
  const [remarksModal, setRemarksModal] = useState({ 
    visible: false, 
    client: null, 
    remarks: '' 
  });
  const [remarksLoading, setRemarksLoading] = useState(false);
  const [remarksError, setRemarksError] = useState('');

  const [statusModal, setStatusModal] = useState({ 
    visible: false, 
    client: null, 
    oldStatus: '', 
    newStatus: '',
    remarks: '',
  });

  // ShowRemarks modal state for Lost status
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [remarksClientId, setRemarksClientId] = useState('');
  const [pendingStatusChange, setPendingStatusChange] = useState(null);

  // Recruiter assignment state
  const [assigningRecruiter, setAssigningRecruiter] = useState(false);

  // Handler for opening remarks modal
  const handleRemarksModal = (client) => {
    setRemarksModal({ visible: true, client, remarks: client.remarks || '' });
    setRemarksError(''); // Clear any previous errors
  };

  // Handler for saving remarks
  const handleRemarksSave = async () => {
    // Clear previous errors
    setRemarksError('');
    
    // Validate remarks is not empty
    if (!remarksModal.remarks || remarksModal.remarks.trim() === '') {
      setRemarksError('Remarks cannot be empty');
      return;
    }
    
    setRemarksLoading(true);
    try {
      await remarksMutation.mutateAsync({ id: remarksModal.client.id, remarks: remarksModal.remarks });
    } catch (error) {
      // error handled in mutation
    } finally {
      setRemarksLoading(false);
    }
  };

  // Handler for status change
  const handleStatusChange = (client, value) => {
    // If status is being changed to Lost, show ShowRemarks modal first
    if (value === 'Lost') {
      setRemarksClientId(client.id);
      setPendingStatusChange({ client, oldStatus: client.status || 'No Status', newStatus: value });
      setShowRemarksModal(true);
    } else {
      // For other status changes, show the regular confirmation modal
      setStatusModal({
        visible: true,
        client,
        oldStatus: client.status || 'No Status',
        newStatus: value,
        remarks: '',
      });
    }
  };

  // Handler for confirming status change
  const handleStatusConfirm = async () => {
    const payload = { 
      id: statusModal.client.id, 
      status: statusModal.newStatus 
    };
    
    if (statusModal.newStatus === 'Lost') {
      payload.remarks = statusModal.remarks;
    }
    
    statusMutation.mutate(payload);
  };

  // Handler for when ShowRemarks modal is closed
  const handleShowRemarksClose = () => {
    setShowRemarksModal(false);
    setRemarksClientId('');
    setPendingStatusChange(null);
  };

  // Handler for when remarks are saved successfully
  const handleRemarksSaved = () => {
    if (pendingStatusChange) {
      // Proceed with the status change after remarks are saved
      setStatusModal({
        visible: true,
        client: pendingStatusChange.client,
        oldStatus: pendingStatusChange.oldStatus,
        newStatus: pendingStatusChange.newStatus,
        remarks: '' // Remarks are already saved via ShowRemarks component
      });
      
      // Close the remarks modal
      setShowRemarksModal(false);
      setRemarksClientId('');
      setPendingStatusChange(null);
    }
  };

  // Handler for recruiter assignment change
  const handleRecruiterAssignmentChange = (client, newRecruiterName) => {
    const recruiter = recruiterExecutivesList.find(
      (r) => r.name === newRecruiterName
    );
    if (!recruiter) {
      message.error('Recruiter not found');
      return;
    }
    setAssigningRecruiter(true);
    recruiterAssignmentMutation.mutate({
      clientId: client.id,
      recruiterId: recruiter.id,
    });
  };

  return {
    // State
    remarksModal,
    setRemarksModal,
    remarksLoading,
    remarksError,
    setRemarksError,
    statusModal,
    setStatusModal,
    showRemarksModal,
    setShowRemarksModal,
    remarksClientId,
    setRemarksClientId,
    pendingStatusChange,
    setPendingStatusChange,
    assigningRecruiter,
    setAssigningRecruiter,
    
    // Handlers
    handleRemarksModal,
    handleRemarksSave,
    handleStatusChange,
    handleStatusConfirm,
    handleShowRemarksClose,
    handleRemarksSaved,
    handleRecruiterAssignmentChange,
  };
};

