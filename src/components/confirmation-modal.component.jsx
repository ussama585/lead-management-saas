import React from "react";
import { Spin, Modal, Button, Input } from 'antd';
import { LoaderCircle as LoadingOutlined } from 'lucide-react';

const { TextArea } = Input;

const ConfirmationModal = ({ 
  showModal, 
  setShowModal, 
  mutation, 
  value, 
  message,
  details,
  oldStatus,
  newStatus,
  onConfirm,
  hideHeader = false,
  hideFooter = false,
  isLoading = false,
  title = 'Confirmation',
  confirmText = 'Yes',
  cancelText = 'No',
  showReasonField = false,
  reason = '',
  setReason = () => {},
}) => {

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else if (mutation) {
      mutation.mutate(value);
    }
  };

  // ✅ Covers both states (backwards-compatible with older react-query)
  const isPending = isLoading || mutation?.isLoading || mutation?.isPending;

  return (
    <Modal
      className="sales-data"
      open={showModal}
      onCancel={() => setShowModal(false)}
      footer={hideFooter ? null : [
        <div 
          key="footer" 
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}
        >
          {/* No button */}
          <Button 
            className="default-btn-look" 
            type='default' 
            variant='filled' 
            key="no" 
            onClick={() => setShowModal(false)} 
            disabled={isPending}
          >
            {cancelText}
          </Button>

          {/* Yes button with custom Spin */}
          <Button 
  className='project-button' 
  type='primary' 
  variant='filled' 
  key="yes" 
  onClick={handleConfirm} 
  disabled={isPending}
>
  {isPending ? (
    <>
      {confirmText}
      <LoadingOutlined size="1em" className="app-icon app-icon-spin"  style={{ marginLeft: 8 }} />
    </>
  ) : (
    confirmText
  )}
</Button>

        </div>
      ]}
      centered
      title={hideHeader ? null : title}
    >
      <div style={{ fontSize: '1rem', marginBottom: '12px' }}>
        {/* Details Section */}
        {details && (
          <div style={{ marginBottom: '16px' }}>
            {Object.entries(details).map(([key, value]) => (
              <div key={key} style={{ marginBottom: '8px' }}>
                <strong>{key}:</strong> {value || '-'}
              </div>
            ))}
          </div>
        )}
        
        {/* Status Change Confirmation */}
        {oldStatus && newStatus && (
          <div style={{ marginBottom: '16px' }}>
            Are you sure you want to update status from <strong>"{oldStatus}"</strong> to <strong>"{newStatus}"</strong>?
          </div>
        )}
        
        {/* Custom Message */}
        {message && (
          <div style={{ marginBottom: showReasonField ? '16px' : '0' }}>
            {React.isValidElement(message) ? message : <span>{message}</span>}
          </div>
        )}

        {/* Reason Field for Deletion/Cancellation */}
        {showReasonField && (
          <div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Reason:</strong>
            </div>
            <TextArea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason here..."
              maxLength={1000}
              showCount
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
