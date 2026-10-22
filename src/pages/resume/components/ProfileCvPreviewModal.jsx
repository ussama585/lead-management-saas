import React from 'react';
import { Modal } from 'antd';
import ProfileCvPrintView from './ProfileCvPrintView.jsx';

/** Modal wrapper; layout matches `generateProfileCvPdfBlob` in `profileCvPdf.js`. */
function ProfileCvPreviewModal({
  open,
  onCancel,
  details,
  title = 'Profile CV preview',
  width = 880,
  footer = null,
  destroyOnClose = true,
}) {
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      footer={footer}
      width={width}
      destroyOnClose={destroyOnClose}
      wrapClassName="profile-cv-print-modal"
      styles={{
        body: {
          maxHeight: '85vh',
          overflow: 'auto',
          padding: 12,
          background: '#f0f0f0',
        },
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ProfileCvPrintView details={details} />
      </div>
    </Modal>
  );
}

export default ProfileCvPreviewModal;
