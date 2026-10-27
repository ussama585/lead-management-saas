import { Modal } from './ui/app-modal.jsx';
import React from 'react';
import { Alert } from 'antd';
import { Trash2 } from 'lucide-react';

export default function SettingsDeleteModal({ title, itemName, open, loading, error, onConfirm, onCancel }) {
  return <Modal title={title} open={open} onOk={onConfirm} onCancel={() => { if (!loading) onCancel(); }}
    okText='Delete' cancelText='Cancel' okButtonProps={{ danger: true }} confirmLoading={loading}
    cancelButtonProps={{ disabled: loading }} closable={!loading} maskClosable={!loading} keyboard={!loading}>
    <div className='grid gap-4 py-3'>
      <div className='flex items-start gap-3'>
        <span className='rounded bg-destructive/10 p-3 text-destructive'><Trash2 size={22} aria-hidden='true' /></span>
        <div className='min-w-0'>
          <p className='mb-2'>Are you sure you want to delete <strong className='break-words'>{itemName}</strong>?</p>
          <p className='text-sm text-muted-foreground'>This action cannot be undone.</p>
        </div>
      </div>
      {error && <Alert type='error' showIcon message={error} />}
    </div>
  </Modal>;
}
