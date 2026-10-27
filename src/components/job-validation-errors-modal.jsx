import { Modal } from './ui/app-modal.jsx';
import { Button } from './ui/app-controls.jsx';
import React from 'react';
import { Alert } from 'antd';
import useUserStore from '../pages/shared/store/user-store.js';
import { getLeadJobEditUrl } from '../pages/shared/utils/conversion-job-errors.js';

const JobValidationErrorsModal = ({
  open,
  onClose,
  validationErrors,
  leadId,
  leadType,
}) => {
  const { user } = useUserStore();

  if (!validationErrors) {
    return null;
  }

  return (
    <Modal
      title="Jobs Need Attention"
      open={open}
      onCancel={onClose}
      zIndex={2000}
      centered
      destroyOnClose
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <Alert
        type="warning"
        message={validationErrors.message}
        showIcon
        style={{ marginBottom: 16 }}
      />
      <div>
        {validationErrors.errors.map((job) => {
          const editUrl = getLeadJobEditUrl(leadId, job.job_id, leadType, user?.user_type);

          return (
            <div
              key={job.job_id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
                padding: '12px 0',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, color: '#111827' }}>
                  {job.job_title || `Job #${job.job_id}`}
                </div>
                {Array.isArray(job.missing_fields) && job.missing_fields.length > 0 && (
                  <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
                    {job.missing_fields.join(', ')}
                  </div>
                )}
              </div>
              <Button
                type="primary"
                className="custom-button"
                disabled={!editUrl}
                onClick={() => {
                  if (editUrl) window.open(editUrl, '_blank', 'noopener,noreferrer');
                }}
              >
                Edit Job
              </Button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

export default JobValidationErrorsModal;
