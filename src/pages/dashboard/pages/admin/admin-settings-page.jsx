import React, { useState } from 'react';
import { useFormik } from 'formik';
import api from '../../../shared/services/api.js';
import { followUpDurationSchema } from '../schemas/follow-up-duration-schema.js';
import { Alert, Card, Typography, InputNumber, Button, Space, Table, Modal, message } from 'antd';
import SettingsDeleteModal from '../../../../components/settings-delete-modal.jsx';
import { Clock, ListFilter, Ruler } from 'lucide-react';
// import { Palette, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button as SettingsNavButton } from '../../../../components/ui/button.jsx';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import formatDateUniversal from '../../../shared/utils/formatDate.js';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
// import AppearanceSettings from '../../../../components/appearance-settings.jsx';
import LeadStatusSettings from '../../../../components/lead-status-settings.jsx';
import ProjectSizeSettings from '../../../../components/project-size-settings.jsx';
// import RefreshTokenSettings from '../../../../components/refresh-token-settings.jsx';
import useUserStore from '../../../shared/store/user-store.js';
import { isSuperAdmin, canManageLeadStatuses, canManageProjectSizes, getLayoutRole } from '../../../auth/role-access.js';
import '../../../../assets/styles/legacy/table-client-actions.css';
import '../../../../assets/styles/legacy/admin-dashboard-page.css';
import '../../../../assets/styles/settings-page.css';

export async function listCheckupDurations() {
  const { data } = await api.get('/follow-up/checkup-duration-list');
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not load durations.');
  if (!Array.isArray(data?.results)) throw new Error('Could not read the duration list.');
  return data;
}

export async function createCheckupDuration(durationMinutes) {
  const { data } = await api.post('/follow-up/checkup-duration', {
    duration_minutes: Number(durationMinutes),
  });
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not create duration.');
  return data;
}

export async function updateCheckupDuration(id, durationMinutes) {
  const { data } = await api.patch(`/follow-up/checkup-duration-get/${encodeURIComponent(id)}`, {
    duration_minutes: Number(durationMinutes),
  });
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not update duration.');
  return data;
}

export async function deleteCheckupDuration(id) {
  const { data } = await api.delete(`/follow-up/checkup-duration-get/${encodeURIComponent(id)}`);
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not delete duration.');
  return data;
}

const durationError = error => error?.response?.data?.message || error?.response?.data?.detail || error?.message || 'The request failed.';

const AdminSettingsPage = () => {
  const { user } = useUserStore();
  // const canManageAppearance = isSuperAdmin(user?.user_type);
  const settingsSections = [
    // ...(canManageAppearance ? [{ key: 'appearance', label: 'Appearance', icon: Palette }] : []),
    ...(canManageLeadStatuses(user?.user_type) ? [{ key: 'leads', label: 'Leads', icon: ListFilter }] : []),
    ...(canManageProjectSizes(user?.user_type) ? [{ key: 'project-size', label: 'Project Size', icon: Ruler }] : []),
    ...(getLayoutRole(user?.user_type) === 'admin' ? [{ key: 'follow-up-duration', label: 'Follow-up Duration', icon: Clock }] : []),
    // { key: 'refresh-token', label: 'Refresh Token', icon: RefreshCw },
  ];
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSection = settingsSections.find(item => item.key === searchParams.get('section')) || settingsSections[0];
  const section = selectedSection?.key;
  const queryClient = useQueryClient();
  const durationQueryKey = ['checkupDurationList', user?.id, user?.user_type];
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { data: durations, isLoading, isFetching, isError, error, refetch } = useQuery(durationQueryKey, listCheckupDurations, {
    enabled: section === 'follow-up-duration', refetchOnWindowFocus: false,
  });

  const createMutation = useMutation((durationMinutes) => createCheckupDuration(durationMinutes), {
    onSuccess: (res) => {
      message.success(res?.message || 'Created successfully');
      queryClient.invalidateQueries(durationQueryKey);
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || err?.message || 'Failed to create');
    },
  });

  const createForm = useFormik({
    initialValues: { duration_minutes: null },
    validationSchema: followUpDurationSchema,
    onSubmit: async (values, helpers) => {
      try {
        await createMutation.mutateAsync(values.duration_minutes);
        helpers.resetForm();
      } catch (err) {
        const body = err?.response?.data;
        const fieldError = body?.errors?.duration_minutes || body?.duration_minutes;
        helpers.setFieldError('duration_minutes', Array.isArray(fieldError) ? fieldError.join(' ') :
          (typeof fieldError === 'string' ? fieldError : body?.message || err.message || 'Could not create duration.'));
      }
    },
  });

  const updateMutation = useMutation(({ id, minutes }) => updateCheckupDuration(id, minutes), {
    onSuccess: res => {
      message.success(res?.message || 'Duration updated successfully');
      queryClient.invalidateQueries(durationQueryKey);
      setEditTarget(null);
    },
  });
  const deleteMutation = useMutation(deleteCheckupDuration, {
    onSuccess: res => {
      message.success(res?.message || 'Duration deleted successfully');
      queryClient.invalidateQueries(durationQueryKey);
      setDeleteTarget(null);
    },
  });
  const editForm = useFormik({
    initialValues: { duration_minutes: editTarget?.duration_minutes ?? null },
    enableReinitialize: true,
    validationSchema: followUpDurationSchema,
    onSubmit: async (values, helpers) => {
      if (!editTarget || updateMutation.isLoading) return;
      try {
        await updateMutation.mutateAsync({ id: editTarget.id, minutes: values.duration_minutes });
      } catch (err) {
        const field = err?.response?.data?.errors?.duration_minutes || err?.response?.data?.duration_minutes;
        helpers.setFieldError('duration_minutes', Array.isArray(field) ? field.join(' ') : typeof field === 'string' ? field : durationError(err));
      }
    },
  });

  return (
    <>
      <BreadCrumb linkText="Settings" />
      <div className="dashboard-container settings-page">
        <div className="settings-layout">
          <nav aria-label="Settings sections" className="settings-navigation">
            <h2 className="w-full px-3 py-2 text-base font-semibold">Settings</h2>
            {settingsSections.map(({ key, label, icon: Icon }) => <SettingsNavButton key={key} variant={section === key ? 'secondary' : 'ghost'} className="settings-navigation-item" aria-controls="settings-panel" aria-current={section === key ? 'page' : undefined} onClick={() => {
              setSearchParams(previous => {
                const next = new URLSearchParams(previous);
                next.set('section', key);
                return next;
              });
            }}><Icon />{label}</SettingsNavButton>)}
          </nav>
          <div id="settings-panel" className="settings-panel" role="region" aria-label={selectedSection ? `${selectedSection.label} settings` : 'Settings'}>
        {!selectedSection && <p className="text-muted-foreground">No settings are available for your role at the moment.</p>}
        {/* {canManageAppearance && section === 'appearance' && <AppearanceSettings />} */}
        {section === 'leads' && <LeadStatusSettings />}
        {section === 'project-size' && <ProjectSizeSettings />}
        {/* {section === 'refresh-token' && <RefreshTokenSettings />} */}
        

        {section === 'follow-up-duration' && <Card title="Check-up follow-up duration">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {isError && <Alert type="error" showIcon message={error?.response?.data?.message || error?.message || 'Could not load durations.'}
              action={<Button onClick={() => refetch()} loading={isFetching}>Retry</Button>} />}
            <Table rowKey="id" dataSource={durations?.results || []} loading={isLoading || isFetching}
              scroll={{ x: 580 }} pagination={(durations?.results?.length || 0) > 10 ? { pageSize: 10 } : false}
              locale={{ emptyText: isError ? 'Duration list unavailable.' : 'No follow-up duration configured yet.' }}
              columns={[
                { title: 'ID', dataIndex: 'id', width: 80 },
                { title: 'Duration (minutes)', dataIndex: 'duration_minutes' },
                { title: 'Created', dataIndex: 'created_at', render: value => value ? formatDateUniversal(value, true) : '-' },
                { title: 'Updated', dataIndex: 'updated_at', render: value => value ? formatDateUniversal(value, true) : '-' },
                { title: 'Actions', key: 'actions', width: 160, render: (_, record) => <Space wrap>
                  <Button size="small" onClick={() => { updateMutation.reset(); editForm.resetForm(); setEditTarget(record); }}>Edit</Button>
                  <Button size="small" danger onClick={() => { deleteMutation.reset(); setDeleteTarget(record); }}>Delete</Button>
                </Space> },
              ]} />
                <form onSubmit={createForm.handleSubmit} style={{ borderTop: 'none', paddingTop: 0 }}>
                  <label htmlFor="create-duration-minutes">
                    Create duration (minutes)
                  </label>
                  <Space wrap align="start">
                    <InputNumber
                      min={1}
                      max={1440}
                      name="duration_minutes"
                      id="create-duration-minutes"
                      aria-label="Create duration (minutes)"
                      value={createForm.values.duration_minutes}
                      onChange={(v) => createForm.setFieldValue('duration_minutes', v)}
                      onBlur={() => createForm.setFieldTouched('duration_minutes', true)}
                      status={createForm.touched.duration_minutes && createForm.errors.duration_minutes ? 'error' : undefined}
                      aria-describedby="duration-create-error"
                      placeholder="e.g. 15"
                      style={{ width: 200 }}
                    />
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={createMutation.isLoading}
                      className="sop-brand-primary"
                    >
                      Create
                    </Button>
                  </Space>
                  {createForm.touched.duration_minutes && createForm.errors.duration_minutes &&
                    <div id="duration-create-error" role="alert" className="text-sm text-destructive">{createForm.errors.duration_minutes}</div>}
                </form>
          </Space>
        </Card>}
        <Modal title="Edit follow-up duration" open={editTarget != null} onOk={() => editForm.handleSubmit()}
          onCancel={() => { if (!updateMutation.isLoading) setEditTarget(null); }} okText="Save changes"
          confirmLoading={updateMutation.isLoading} cancelButtonProps={{ disabled: updateMutation.isLoading }}
          closable={!updateMutation.isLoading} maskClosable={!updateMutation.isLoading} keyboard={!updateMutation.isLoading}>
          <form onSubmit={editForm.handleSubmit} className="grid gap-3 py-3">
            <label htmlFor="edit-duration-minutes">Duration (minutes)</label>
            <InputNumber id="edit-duration-minutes" min={1} max={1440} value={editForm.values.duration_minutes}
              disabled={updateMutation.isLoading} onChange={value => editForm.setFieldValue('duration_minutes', value)}
              onBlur={() => editForm.setFieldTouched('duration_minutes', true)}
              aria-describedby="edit-duration-error" status={editForm.touched.duration_minutes && editForm.errors.duration_minutes ? 'error' : undefined} />
            {editForm.touched.duration_minutes && editForm.errors.duration_minutes &&
              <div id="edit-duration-error" role="alert" className="text-sm text-destructive">{editForm.errors.duration_minutes}</div>}
          </form>
        </Modal>
        <SettingsDeleteModal title="Delete follow-up duration" open={deleteTarget != null}
          itemName={`${deleteTarget?.duration_minutes ?? ''} minute duration`} loading={deleteMutation.isLoading}
          error={deleteMutation.isError ? durationError(deleteMutation.error) : null} onCancel={() => setDeleteTarget(null)}
          onConfirm={() => { if (deleteTarget && !deleteMutation.isLoading) deleteMutation.mutate(deleteTarget.id); }} />
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSettingsPage;
