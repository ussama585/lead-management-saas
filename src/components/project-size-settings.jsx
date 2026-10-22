import React, { useState } from 'react';
import { Alert, Button, Card, Descriptions, Input, Modal, Space, Spin, Table, message } from 'antd';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import useUserStore from '../pages/shared/store/user-store.js';
import { canManageProjectSizes } from '../pages/auth/role-access.js';
import { createProjectSize, deleteProjectSize, getProjectSize, projectSizeError, listProjectSizes, updateProjectSize } from '../pages/shared/services/project-size-service.js';
import SettingsDeleteModal from './settings-delete-modal.jsx';
import formatDateUniversal from '../pages/shared/utils/formatDate.js';

function ProjectSizeManager({ user }) {
  const queryClient = useQueryClient();
  const queryKey = ['settingsProjectSizes', user.id, user.user_type];
  const [editor, setEditor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [valueError, setValueError] = useState('');
  const list = useQuery(queryKey, listProjectSizes, { refetchOnWindowFocus: false, retry: 1 });
  const detail = useQuery([...queryKey, 'detail', viewId], () => getProjectSize(viewId), {
    enabled: viewId != null, refetchOnWindowFocus: false, retry: 1,
  });
  const save = useMutation(({ id, value }) => id == null ? createProjectSize(value) : updateProjectSize(id, value), {
    onSuccess: async result => {
      message.success(result?.message || 'Project size saved.');
      setEditor(null);
      await queryClient.invalidateQueries(queryKey);
    },
  });
  const remove = useMutation(deleteProjectSize, {
    onSuccess: async result => {
      message.success(result?.message || 'Project size deleted.');
      setDeleteTarget(null);
      await queryClient.invalidateQueries(queryKey);
    },
  });
  const busy = save.isLoading || remove.isLoading;
  function openEditor(row = null) {
    save.reset();
    setValueError('');
    setEditor({ id: row?.id, value: row?.value || '' });
  }
  function submit(event) {
    event?.preventDefault();
    if (!editor?.value.trim()) { setValueError('Enter a project size value.'); return; }
    setValueError('');
    save.mutate(editor);
  }
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Project size', dataIndex: 'value', key: 'value' },
    { title: 'Actions', key: 'actions', width: 260, render: (_, row) => <Space wrap>
      <Button icon={<Eye size={16} />} onClick={() => setViewId(row.id)} disabled={busy}>View</Button>
      <Button icon={<Pencil size={16} />} onClick={() => openEditor(row)} disabled={busy}>Edit</Button>
      <Button danger icon={<Trash2 size={16} />} disabled={busy} onClick={() => { remove.reset(); setDeleteTarget(row); }}>Delete</Button>
    </Space> },
  ];
  return <>
    <Card title='Project sizes' extra={<Button type='primary' icon={<Plus size={16} />} onClick={() => openEditor()} disabled={busy}>Add size</Button>}>
      <p className='mb-4 text-sm text-muted-foreground'>Create and manage the available project size choices.</p>
      {list.isError ? <Alert type='error' showIcon message={projectSizeError(list.error)} action={<Button onClick={() => list.refetch()} loading={list.isFetching}>Retry</Button>} /> :
        <Table rowKey='id' columns={columns} dataSource={list.data || []} loading={list.isLoading || list.isFetching} scroll={{ x: 520 }} pagination={{ pageSize: 10, hideOnSinglePage: true }} locale={{ emptyText: 'No project sizes yet. Add a size to get started.' }} />}
    </Card>
    <SettingsDeleteModal title='Delete project size' itemName={deleteTarget?.value} open={deleteTarget != null}
      loading={remove.isLoading} error={remove.isError ? projectSizeError(remove.error) : null}
      onCancel={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget && !remove.isLoading) remove.mutate(deleteTarget.id); }} />
    <Modal title={editor?.id == null ? 'Add project size' : 'Edit project size'} open={editor != null} onCancel={() => { if (!save.isLoading) setEditor(null); }} onOk={submit} okText={editor?.id == null ? 'Create size' : 'Save changes'} confirmLoading={save.isLoading} cancelButtonProps={{ disabled: save.isLoading }} closable={!save.isLoading} maskClosable={!save.isLoading} keyboard={!save.isLoading}>
      <form onSubmit={submit} className='grid gap-3 py-3'>
        <label htmlFor='project-size-value' className='text-sm font-medium'>Project size</label>
        <Input id='project-size-value' placeholder='e.g. 25k' value={editor?.value || ''} disabled={save.isLoading} aria-required='true' aria-invalid={Boolean(valueError)} aria-describedby={valueError ? 'project-size-value-error' : undefined} onChange={event => { setEditor(previous => ({ ...previous, value: event.target.value })); setValueError(''); save.reset(); }} />
        {valueError && <p id='project-size-value-error' role='alert' className='text-sm text-destructive'>{valueError}</p>}
        {save.isError && <Alert type='error' showIcon message={projectSizeError(save.error)} />}
      </form>
    </Modal>
    <Modal title='Project size details' open={viewId != null} onCancel={() => setViewId(null)} footer={<Button onClick={() => setViewId(null)}>Close</Button>}>
      {detail.isLoading ? <div className='py-6 text-center'><Spin /></div> : detail.isError ? <Alert type='error' showIcon message={projectSizeError(detail.error)} action={<Button onClick={() => detail.refetch()}>Retry</Button>} /> : detail.data &&
        <Descriptions column={1} bordered size='small' className='mt-4' items={[
          { key: 'id', label: 'ID', children: detail.data.id },
          { key: 'value', label: 'Value', children: detail.data.value },
          { key: 'created', label: 'Created', children: detail.data.created_at ? formatDateUniversal(detail.data.created_at, true) : '—' },
          { key: 'updated', label: 'Updated', children: detail.data.updated_at ? formatDateUniversal(detail.data.updated_at, true) : '—' },
        ]} />}
    </Modal>
  </>;
}

export default function ProjectSizeSettings() {
  const { user } = useUserStore();
  if (!canManageProjectSizes(user?.user_type)) return null;
  return <ProjectSizeManager user={user} />;
}
