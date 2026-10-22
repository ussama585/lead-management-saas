import React, { useEffect, useMemo, useState } from 'react';
import { Card, Typography, InputNumber, Button, Spin, Space, message, Table, Popconfirm } from 'antd';
import { LoaderCircle as LoadingOutlined, Palette, Clock, ListFilter, Ruler, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button as SettingsNavButton } from '../../../../components/ui/button.jsx';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import AppearanceSettings from '../../../../components/appearance-settings.jsx';
import LeadStatusSettings from '../../../../components/lead-status-settings.jsx';
import ProjectSizeSettings from '../../../../components/project-size-settings.jsx';
import RefreshTokenSettings from '../../../../components/refresh-token-settings.jsx';
import useUserStore from '../../../shared/store/user-store.js';
import { isSuperAdmin, canManageLeadStatuses, canManageProjectSizes, getLayoutRole } from '../../../auth/role-access.js';
import {
  listCheckupDurations,
  updateCheckupDuration,
  createCheckupDuration,
  deleteCheckupDuration,
} from '../../../shared/services/checkup-duration-service.js';
import formatDateUniversal from '../../../shared/utils/formatDate.js';
import '../../../../assets/styles/legacy/table-client-actions.css';
import '../../../../assets/styles/legacy/admin-dashboard-page.css';
import '../../../../assets/styles/settings-page.css';

const LIST_QUERY_KEY = ['checkupDurationList'];

const AdminSettingsPage = () => {
  const { user } = useUserStore();
  const canManageAppearance = isSuperAdmin(user?.user_type);
  const settingsSections = [
    ...(canManageAppearance ? [{ key: 'appearance', label: 'Appearance', icon: Palette }] : []),
    ...(canManageLeadStatuses(user?.user_type) ? [{ key: 'leads', label: 'Leads', icon: ListFilter }] : []),
    ...(canManageProjectSizes(user?.user_type) ? [{ key: 'project-size', label: 'Project Size', icon: Ruler }] : []),
    ...(getLayoutRole(user?.user_type) === 'admin' ? [{ key: 'follow-up-duration', label: 'Follow-up Duration', icon: Clock }] : []),
    { key: 'refresh-token', label: 'Refresh Token', icon: RefreshCw },
  ];
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSection = settingsSections.find(item => item.key === searchParams.get('section')) || settingsSections[0];
  const section = selectedSection.key;
  const queryClient = useQueryClient();
  const [draftById, setDraftById] = useState({});
  const [newMinutes, setNewMinutes] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery(LIST_QUERY_KEY, () => listCheckupDurations(), {
    enabled: section === 'follow-up-duration',
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const rows = useMemo(() => (Array.isArray(data?.results) ? data.results : []), [data?.results]);
  const hasExistingDuration = rows.length > 0;

  useEffect(() => {
    const next = {};
    rows.forEach((r) => {
      if (r?.id != null && r.duration_minutes !== undefined && r.duration_minutes !== null) {
        next[r.id] = Number(r.duration_minutes);
      }
    });
    setDraftById(next);
  }, [rows]);

  const updateMutation = useMutation(({ id, durationMinutes }) => updateCheckupDuration(durationMinutes, id), {
    onSuccess: (res) => {
      message.success(res?.message || 'Updated successfully');
      queryClient.invalidateQueries(LIST_QUERY_KEY);
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || err?.message || 'Failed to update');
    },
  });

  const createMutation = useMutation((durationMinutes) => createCheckupDuration(durationMinutes), {
    onSuccess: (res) => {
      message.success(res?.message || 'Created successfully');
      queryClient.invalidateQueries(LIST_QUERY_KEY);
      setNewMinutes(null);
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || err?.message || 'Failed to create');
    },
  });

  const deleteMutation = useMutation((id) => deleteCheckupDuration(id), {
    onSuccess: (res) => {
      message.success(res?.message || 'Deleted successfully');
      queryClient.invalidateQueries(LIST_QUERY_KEY);
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || err?.message || 'Failed to delete');
    },
  });

  const validateMinutes = (v) => {
    if (v === null || v === undefined || Number.isNaN(Number(v))) {
      message.warning('Enter a valid number of minutes');
      return null;
    }
    const n = Number(v);
    if (n < 1 || n > 24 * 60) {
      message.warning('Use between 1 and 1440 minutes (24 hours)');
      return null;
    }
    return n;
  };

  const handleSaveRow = (id) => {
    const n = validateMinutes(draftById[id]);
    if (n == null) return;
    updateMutation.mutate({ id, durationMinutes: n });
  };

  const handleCreate = () => {
    const n = validateMinutes(newMinutes);
    if (n == null) return;
    createMutation.mutate(n);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Duration (minutes)',
      key: 'duration_minutes',
      render: (_, record) => (
        <InputNumber
          min={1}
          max={1440}
          value={draftById[record.id]}
          onChange={(v) => setDraftById((prev) => ({ ...prev, [record.id]: v }))}
          style={{ width: 160 }}
        />
      ),
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (v) => (v ? formatDateUniversal(v, true) : '—'),
    },
    {
      title: 'Action',
      key: 'action',
      width: 190,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            loading={updateMutation.isLoading && updateMutation.variables?.id === record.id}
            onClick={() => handleSaveRow(record.id)}
            className="sop-brand-primary"
          >
            Save
          </Button>
          <Popconfirm
            title="Delete this duration?"
            okText="Delete"
            cancelText="Cancel"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button
              danger
              size="small"
              loading={deleteMutation.isLoading && deleteMutation.variables === record.id}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
          <div id="settings-panel" className="settings-panel" role="region" aria-label={`${selectedSection.label} settings`}>
        {canManageAppearance && section === 'appearance' && <AppearanceSettings />}
        {section === 'leads' && <LeadStatusSettings />}
        {section === 'project-size' && <ProjectSizeSettings />}
        {section === 'refresh-token' && <RefreshTokenSettings />}
        

        {section === 'follow-up-duration' && <Card title="Check-up follow-up duration">
          {isLoading ? (
            <div className="sop-branded-spin-wrap">
              <Spin
                size="large"
                indicator={<LoadingOutlined size="1em" className={["app-icon app-icon-spin", "sop-branded-spin-icon"].filter(Boolean).join(' ')}  aria-hidden />}
              />
              <p className="sop-branded-spin-text">Loading settings...</p>
            </div>
          ) : (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {isError ? (
                <Typography.Text type="danger">
                  {error?.response?.data?.message || error?.message || 'Could not load list.'}{' '}
                  <Button type="link" size="small" onClick={() => refetch()}>
                    Retry
                  </Button>
                </Typography.Text>
              ) : null}

              <Table
                rowKey="id"
                columns={columns}
                dataSource={rows}
                pagination={rows.length > 10 ? { pageSize: 10 } : false}
                locale={{ emptyText: 'No check-up duration configured yet.' }}
              />

              {!hasExistingDuration ? (
                <div style={{ borderTop: 'none', paddingTop: 0 }}>
                  <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Create duration (minutes)
                  </Typography.Text>
                  <Space wrap align="start">
                    <InputNumber
                      min={1}
                      max={1440}
                      value={newMinutes}
                      onChange={(v) => setNewMinutes(v)}
                      placeholder="e.g. 15"
                      style={{ width: 200 }}
                    />
                    <Button
                      type="primary"
                      onClick={handleCreate}
                      loading={createMutation.isLoading}
                      className="sop-brand-primary"
                    >
                      Create
                    </Button>
                  </Space>
                </div>
              ) : (
                <Typography.Text type="secondary">
                  Duration is already configured. You can update or delete the existing row only.
                </Typography.Text>
              )}
            </Space>
          )}
        </Card>}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSettingsPage;
