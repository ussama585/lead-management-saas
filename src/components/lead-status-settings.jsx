import { message } from './ui/notifications.jsx';
import { Modal } from './ui/app-modal.jsx';
import { Input } from './ui/app-controls.jsx';
import { Button, Spin } from './ui/app-controls.jsx';
import React, { useState } from 'react';
import { Alert, Card, Descriptions, Space, Table } from 'antd';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import useUserStore from '../pages/shared/store/user-store.js';
import { canManageLeadStatuses } from '../pages/auth/role-access.js';
import { createLeadStatus, deleteLeadStatus, getLeadStatus, leadStatusError, listLeadStatuses, updateLeadStatus } from '../pages/shared/services/lead-status-service.js';
import SettingsDeleteModal from './settings-delete-modal.jsx';
import formatDateUniversal from '../pages/shared/utils/formatDate.js';

function LeadStatusManager({ user }) {
  const queryClient = useQueryClient();
  const queryKey = ['settingsLeadStatuses', user.id, user.user_type];
  const [editor, setEditor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [nameError, setNameError] = useState('');
  const list = useQuery(queryKey, listLeadStatuses, { refetchOnWindowFocus: false, retry: 1 });
  const detail = useQuery([...queryKey, 'detail', viewId], () => getLeadStatus(viewId), {
    enabled: viewId != null, refetchOnWindowFocus: false, retry: 1,
  });
  const save = useMutation(({ id, name }) => id == null ? createLeadStatus(name) : updateLeadStatus(id, name), {
    onSuccess: async result => {
      message.success(result?.message || 'Lead status saved.');
      setEditor(null);
      await queryClient.invalidateQueries(queryKey);
    },
  });
  const remove = useMutation(deleteLeadStatus, {
    onSuccess: async result => {
      message.success(result?.message || 'Lead status deleted.');
      setDeleteTarget(null);
      await queryClient.invalidateQueries(queryKey);
    },
  });
  const busy = save.isLoading || remove.isLoading;
  function openEditor(row = null) {
    save.reset();
    setNameError('');
    setEditor({ id: row?.id, name: row?.name || '' });
  }
  function submit(event) {
    event?.preventDefault();
    if (!editor?.name.trim()) { setNameError('Enter a lead status name.'); return; }
    setNameError('');
    save.mutate(editor);
  }
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Status name', dataIndex: 'name', key: 'name' },
    { title: 'Actions', key: 'actions', width: 260, render: (_, row) => <Space wrap>
      <Button icon={<Eye size={16} />} onClick={() => setViewId(row.id)} disabled={busy}>View</Button>
      <Button icon={<Pencil size={16} />} onClick={() => openEditor(row)} disabled={busy}>Edit</Button>
      <Button danger icon={<Trash2 size={16} />} disabled={busy} onClick={() => { remove.reset(); setDeleteTarget(row); }}>Delete</Button>
    </Space> },
  ];
  return <>
    <Card title='Lead statuses' extra={<Button type='primary' icon={<Plus size={16} />} onClick={() => openEditor()} disabled={busy}>Add status</Button>}>
      <p className='mb-4 text-sm text-muted-foreground'>Create and manage the statuses used for leads.</p>
      {list.isError ? <Alert type='error' showIcon message={leadStatusError(list.error)} action={<Button onClick={() => list.refetch()} loading={list.isFetching}>Retry</Button>} /> :
        <Table rowKey='id' columns={columns} dataSource={list.data || []} loading={list.isLoading || list.isFetching} scroll={{ x: 520 }} pagination={{ pageSize: 10, hideOnSinglePage: true }} locale={{ emptyText: 'No lead statuses yet. Add a status to get started.' }} />}
    </Card>
    <SettingsDeleteModal title='Delete lead status' itemName={deleteTarget?.name} open={deleteTarget != null}
      loading={remove.isLoading} error={remove.isError ? leadStatusError(remove.error) : null}
      onCancel={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget && !remove.isLoading) remove.mutate(deleteTarget.id); }} />
    <Modal title={editor?.id == null ? 'Add lead status' : 'Edit lead status'} open={editor != null} onCancel={() => { if (!save.isLoading) setEditor(null); }} onOk={submit} okText={editor?.id == null ? 'Create status' : 'Save changes'} confirmLoading={save.isLoading} cancelButtonProps={{ disabled: save.isLoading }} closable={!save.isLoading} maskClosable={!save.isLoading} keyboard={!save.isLoading}>
      <form onSubmit={submit} className='grid gap-3 py-3'>
        <label htmlFor='lead-status-name' className='text-sm font-medium'>Status name</label>
        <Input id='lead-status-name' placeholder='e.g. Active' value={editor?.name || ''} disabled={save.isLoading} aria-required='true' aria-invalid={Boolean(nameError)} aria-describedby={nameError ? 'lead-status-name-error' : undefined} onChange={event => { setEditor(previous => ({ ...previous, name: event.target.value })); setNameError(''); save.reset(); }} />
        {nameError && <p id='lead-status-name-error' role='alert' className='text-sm text-destructive'>{nameError}</p>}
        {save.isError && <Alert type='error' showIcon message={leadStatusError(save.error)} />}
      </form>
    </Modal>
    <Modal title='Lead status details' open={viewId != null} onCancel={() => setViewId(null)} footer={<Button onClick={() => setViewId(null)}>Close</Button>}>
      {detail.isLoading ? <div className='py-6 text-center'><Spin /></div> : detail.isError ? <Alert type='error' showIcon message={leadStatusError(detail.error)} action={<Button onClick={() => detail.refetch()}>Retry</Button>} /> : detail.data &&
        <Descriptions column={1} bordered size='small' className='mt-4' items={[
          { key: 'id', label: 'ID', children: detail.data.id },
          { key: 'name', label: 'Name', children: detail.data.name },
          { key: 'company', label: 'Company', children: detail.data.company ?? '—' },
          { key: 'created', label: 'Created', children: detail.data.created_at ? formatDateUniversal(detail.data.created_at, true) : '—' },
          { key: 'updated', label: 'Updated', children: detail.data.updated_at ? formatDateUniversal(detail.data.updated_at, true) : '—' },
        ]} />}
    </Modal>
  </>;
}

export default function LeadStatusSettings() {
  const { user } = useUserStore();
  if (!canManageLeadStatuses(user?.user_type)) return null;
  return <LeadStatusManager user={user} />;
}
