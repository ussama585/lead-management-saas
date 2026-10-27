import { Modal } from '../../../components/ui/app-modal.jsx';
import { Input } from '../../../components/ui/app-controls.jsx';
import React from 'react';


const { TextArea } = Input;

const BRAND_COLOR = '#3E6A9F';
const ERROR_COLOR = '#ff4d4f';

const defaultOkButtonStyle = { background: BRAND_COLOR, borderColor: BRAND_COLOR };

const RemarksError = ({ message }) =>
  message ? (
    <div style={{ color: ERROR_COLOR, fontSize: '14px', marginTop: '8px' }}>{message}</div>
  ) : null;

const RemarksModal = ({
  visible,
  title = 'Remarks',
  remarks,
  error = '',
  loading = false,
  canEdit = true,
  onRemarksChange,
  onSave,
  onCancel,
  okButtonStyle = defaultOkButtonStyle,
  okText = 'Save',
  cancelText: cancelTextProp,
  placeholder = 'Enter remarks here...',
  rows = 5,
  maxLength = 1000,
  showCount = false,
  width = 520,
  maxWidth = 560,
  customFooter = null,
  /** Tighter Modal body padding for simple single-field dialogs */
  compact = true,
  centered = true,
  destroyOnClose = false,
}) => {
  const cancelText = cancelTextProp ?? (canEdit ? 'Cancel' : 'Close');
  const remarksValue = remarks ?? '';
  const textAreaProps = {
    rows,
    value: remarksValue,
    onChange: onRemarksChange,
    placeholder,
    status: error ? 'error' : '',
    disabled: !canEdit,
    maxLength,
  };

  const renderBody = () => {
    if (showCount && canEdit) {
      return (
        <div>
          <TextArea {...textAreaProps} style={{ borderColor: BRAND_COLOR, marginBottom: 4 }} />
          <div style={{ textAlign: 'right', fontSize: 12, color: BRAND_COLOR }}>
            {remarksValue.length} / {maxLength}
          </div>
          <RemarksError message={error} />
        </div>
      );
    }
    return (
      <>
        <TextArea {...textAreaProps} showCount={!showCount} />
        <RemarksError message={error} />
      </>
    );
  };

  const bodyPadding = compact ? '12px 16px' : '20px 24px';

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      onOk={canEdit ? onSave : undefined}
      confirmLoading={loading}
      okText={okText}
      cancelText={cancelText}
      centered={centered}
      width={width}
      style={{ maxWidth }}
      styles={{ body: { padding: bodyPadding } }}
      okButtonProps={canEdit ? { style: okButtonStyle } : { style: { display: 'none' } }}
      footer={customFooter ?? undefined}
      destroyOnClose={destroyOnClose}
    >
      {renderBody()}
    </Modal>
  );
};

export default RemarksModal;
