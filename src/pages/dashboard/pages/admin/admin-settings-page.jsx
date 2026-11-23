import CompanySelect from '../../../../components/company-select.jsx';
import { message } from '../../../../components/ui/notifications.jsx';
import { Modal } from '../../../../components/ui/app-modal.jsx';
import { Button } from '../../../../components/ui/app-controls.jsx';
import { getCompanies } from '../../../../components/company-filtered-page.jsx';
import React, { useState } from 'react';
import { useFormik } from 'formik';
import api from '../../../shared/services/api.js';
import { followUpDurationSchema } from '../schemas/follow-up-duration-schema.js';
import { Alert, Card, InputNumber, Space } from 'antd';
import SettingsDeleteModal from '../../../../components/settings-delete-modal.jsx';
import { Clock, Plus } from 'lucide-react';
import TableActionMenu from '../../../../components/tables/table-action-menu.jsx';
// import { Palette, RefreshCw } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import formatDateUniversal from '../../../shared/utils/formatDate.js';
// import AppearanceSettings from '../../../../components/appearance-settings.jsx';
import LeadStatusSettings from '../../../../components/lead-status-settings.jsx';
import ProjectSizeSettings from '../../../../components/project-size-settings.jsx';
import CompanyLeadSettingsList from '../../../../components/company-lead-settings-list.jsx';
// import RefreshTokenSettings from '../../../../components/refresh-token-settings.jsx';
import useUserStore from '../../../shared/store/user-store.js';
import { isSuperAdmin, canManageLeadStatuses, canManageProjectSizes, getLayoutRole } from '../../../auth/role-access.js';
import '../../../../assets/styles/legacy/table-client-actions.css';
import '../../../../assets/styles/legacy/admin-dashboard-page.css';
import '../../../../assets/styles/settings-page.css';

export async function listCheckupDurations(companyId = null) {
  const { data } = await api.get('/follow-up/checkup-duration-list', { params: companyId ? { company_id: Number(companyId) } : {} });
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not load durations.');
  if (!Array.isArray(data?.results)) throw new Error('Could not read the duration list.');
  return data;
}

export async function createCheckupDuration(durationMinutes, companyId = null) {
  const { data } = await api.post('/follow-up/checkup-duration', {
    duration_minutes: Number(durationMinutes),
    ...(companyId ? { company_id: Number(companyId) } : {}),
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
  const superAdmin = isSuperAdmin(user?.user_type);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCompanyId, setCompanyId] = useState(undefined);
  // const canManageAppearance = isSuperAdmin(user?.user_type);
  const showLeadSettings = canManageLeadStatuses(user?.user_type) || superAdmin;
  const showProjectSizeSettings = canManageProjectSizes(user?.user_type) || superAdmin;
  const showDurationSettings = getLayoutRole(user?.user_type) === 'admin';
  const companies = useQuery(['overviewCompanies', user?.id], getCompanies, {
    enabled: superAdmin && showDurationSettings, staleTime: 300000, refetchOnWindowFocus: false,
  });
  const companyId = selectedCompanyId === undefined ? companies.data?.[0]?.value ?? null : selectedCompanyId;
  const queryClient = useQueryClient();
  const durationQueryKey = ['checkupDurationList', user?.id, user?.user_type, superAdmin ? companyId : null];
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { data: durations, isLoading, isFetching, isError, error, refetch } = useQuery(durationQueryKey, () => listCheckupDurations(superAdmin ? companyId : null), {
    enabled: showDurationSettings && (!superAdmin || Boolean(companyId)), refetchOnWindowFocus: false,
  });
  const canCreateDuration = Boolean(durations) && !isLoading && !isFetching && !isError
    && durations.results.length === 0 && (!superAdmin || Boolean(companyId));

  const createMutation = useMutation((durationMinutes) => createCheckupDuration(durationMinutes, superAdmin ? companyId : null), {
    onSuccess: (res) => {
      message.success(res?.message || 'Created successfully');
      setCreateOpen(false);
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
      if (superAdmin && !companyId) { helpers.setStatus('Select a company first.'); return; }
      if (createMutation.isLoading || !canCreateDuration) return;
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
      <div className="dashboard-container settings-page">
        <div className="settings-layout">
          <div id="settings-panel" className="settings-panel" role="region" aria-label="Settings">
        {!showLeadSettings && !showProjectSizeSettings && !showDurationSettings && <p className="text-muted-foreground">No settings are available for your role at the moment.</p>}
        {showLeadSettings && (superAdmin ? <CompanyLeadSettingsList key="leads" type="leads" /> : <LeadStatusSettings />)}
        {showProjectSizeSettings && (superAdmin ? <CompanyLeadSettingsList key="project-size" type="project-size" /> : <ProjectSizeSettings />)}
        

        {showDurationSettings && <Card title="Check-up follow-up duration">
          <div className="settings-duration-content">
            <div className="settings-choice-toolbar">
            {superAdmin && <CompanySelect id="duration-company" options={companies.data || []}
                value={companyId ?? undefined} loading={companies.isFetching}
                disabled={createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading}
                onChange={value => { setCompanyId(value || null); setCreateOpen(false); createForm.resetForm(); setEditTarget(null); setDeleteTarget(null); }} />}
              {canCreateDuration && <span className="settings-choice-toolbar__action"><Button type="primary" icon={<Plus size={16} />} onClick={() => { createForm.resetForm(); setCreateOpen(true); }}>Add duration</Button></span>}
            </div>
            {superAdmin && companies.isError && <Alert type="error" message="Could not load companies." action={<Button onClick={() => companies.refetch()}>Retry</Button>} />}
            {superAdmin && !companyId && <p className="text-sm text-muted-foreground">Select a company to manage its follow-up duration.</p>}
            {isError && <Alert type="error" showIcon message={error?.response?.data?.message || error?.message || 'Could not load durations.'}
              action={<Button onClick={() => refetch()} loading={isFetching}>Retry</Button>} />}
            {isLoading || isFetching ? <p role="status" className="text-sm text-muted-foreground">Loading follow-up duration...</p> :
              durations?.results?.length ? <div className="settings-choice-grid">
                {durations.results.map(record => <div key={record.id} className="settings-choice-card">
                  <div className="space-y-2">
                    <div className="settings-choice-card__content">
                      <span className="settings-choice-card__icon"><Clock size={22} /></span>
                      <div><p className="settings-choice-card__label">Follow-up duration</p>
                        <p className="settings-choice-card__title">{record.duration_minutes} minutes</p></div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>Created: {record.created_at ? formatDateUniversal(record.created_at, true) : '-'}</p>
                      <p>Updated: {record.updated_at ? formatDateUniversal(record.updated_at, true) : '-'}</p>
                    </div>
                  </div>
                  <div className="settings-choice-card__actions"><TableActionMenu actions={[
                    { label: 'Edit duration', disabled: updateMutation.isLoading || deleteMutation.isLoading, onClick: () => { updateMutation.reset(); editForm.resetForm(); setEditTarget(record); } },
                    { label: 'Delete duration', disabled: updateMutation.isLoading || deleteMutation.isLoading, onClick: () => { deleteMutation.reset(); setDeleteTarget(record); } },
                  ]} /></div>
                </div>)}
              </div> : !isError && <p className="text-sm text-muted-foreground">No follow-up duration configured yet.</p>}

          </div>
        </Card>}
        <Modal title="Add follow-up duration" open={createOpen && canCreateDuration} footer={null}
          onCancel={() => { if (!createMutation.isLoading) setCreateOpen(false); }} confirmLoading={createMutation.isLoading}>
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
                      disabled={createMutation.isLoading || (superAdmin && !companyId)}
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
                      disabled={superAdmin && !companyId}
                      className="sop-brand-primary"
                    >
                      Create
                    </Button>
                  </Space>
                  {createForm.touched.duration_minutes && createForm.errors.duration_minutes &&
                    <div id="duration-create-error" role="alert" className="text-sm text-destructive">{createForm.errors.duration_minutes}</div>}
                  {createForm.status && <div role="alert" className="text-sm text-destructive">{createForm.status}</div>}
                </form>
        </Modal>
        <Modal title="Edit follow-up duration" open={editTarget != null} onOk={() => editForm.handleSubmit()}
          onCancel={() => { if (!updateMutation.isLoading) setEditTarget(null); }} okText="Save changes"
          confirmLoading={updateMutation.isLoading} cancelButtonProps={{ disabled: updateMutation.isLoading }}
          closable={!updateMutation.isLoading} maskClosable={!updateMutation.isLoading} keyboard={!updateMutation.isLoading}>
          <form onSubmit={editForm.handleSubmit} className="grid gap-3 py-3">
            <label htmlFor="edit-duration-minutes">Duration (minutes)</label>
            <InputNumber placeholder="Enter duration (minutes)" id="edit-duration-minutes" min={1} max={1440} value={editForm.values.duration_minutes}
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
