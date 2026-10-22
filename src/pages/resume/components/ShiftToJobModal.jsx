import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Select, Button, Spin, Empty, message } from 'antd';
import { LoaderCircle as LoadingOutlined } from 'lucide-react';
import { useQuery, useMutation } from 'react-query';
import {
  getUserActiveProjects,
  getUserActiveJobsByProject,
  shiftCvPoolToPublic,
} from '../../shared/services/headhunting.js';

const resolveApplicantEmail = (record) => {
  const email = record?.email ?? record?.profile_email ?? record?.candidate_email ?? '';
  const trimmed = String(email).trim();
  return trimmed && trimmed !== '-' ? trimmed : '';
};

const ShiftToJobModal = ({
  open,
  onClose,
  record,
  onSuccess,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const candidateName = record?.name || 'Candidate';
  const recordKey =
    record?.id ?? record?.candidate_details_id ?? record?.email ?? 'unknown';

  useEffect(() => {
    if (!open) {
      setSelectedProjectId(null);
      setSelectedJobId(null);
    }
  }, [open, recordKey]);

  const { data: projects = [], isLoading: loadingProjects } = useQuery(
    ['userActiveProjects', recordKey],
    getUserActiveProjects,
    {
      enabled: open,
      refetchOnWindowFocus: false,
      staleTime: 0,
      cacheTime: 0,
      refetchOnMount: 'always',
    }
  );

  const { data: jobs = [], isLoading: loadingJobs } = useQuery(
    ['userActiveJobs', selectedProjectId, recordKey],
    () => getUserActiveJobsByProject(selectedProjectId),
    {
      enabled: open && !!selectedProjectId,
      refetchOnWindowFocus: false,
      staleTime: 0,
      cacheTime: 0,
      refetchOnMount: 'always',
    }
  );

  const shiftMutation = useMutation(shiftCvPoolToPublic, {
    onSuccess: (response) => {
      onSuccess?.(response);
      onClose?.();
    },
    onError: (error) => {
      message.error(error?.message || 'Failed to shift CV to Public CV');
    },
  });

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        value: project.id,
        label: project.client_name
          ? `${project.project_name} — ${project.client_name}`
          : project.project_name,
      })),
    [projects]
  );

  const jobOptions = useMemo(
    () =>
      jobs.map((job) => ({
        value: job.id,
        label: `Job - ${job.id} - ${job.job_title || 'Untitled'}`,
      })),
    [jobs]
  );

  const handleProjectChange = (projectId) => {
    setSelectedProjectId(projectId ?? null);
    setSelectedJobId(null);
  };

  const handleConfirm = () => {
    const email = resolveApplicantEmail(record);
    if (!selectedJobId) return;
    if (!email) {
      message.warning('Candidate email is not available for this CV');
      return;
    }

    shiftMutation.mutate({
      job_id: Number(selectedJobId),
      email,
    });
  };

  return (
    <Modal
      title={`Shift to Job${candidateName && candidateName !== '-' ? `: ${candidateName}` : ''}`}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={shiftMutation.isLoading}>
          Cancel
        </Button>,
        <Button
          key="shift"
          type="primary"
          onClick={handleConfirm}
          loading={shiftMutation.isLoading}
          disabled={!selectedJobId}
          style={{ background: '#3E6A9F', borderColor: '#3E6A9F', color: '#fff' }}
        >
          Shift to Job
        </Button>,
      ]}
      width="92%"
      style={{ maxWidth: 560 }}
      destroyOnClose
    >
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, color: '#3E6A9F', fontWeight: 600 }}>
          Active Project
        </label>
        <Select
          showSearch
          allowClear
          placeholder="Search and select a project"
          value={selectedProjectId}
          onChange={handleProjectChange}
          loading={loadingProjects}
          optionFilterProp="label"
          filterOption={(input, option) =>
            String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={projectOptions}
          style={{ width: '100%' }}
          notFoundContent={loadingProjects ? <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="small" /> : 'No active projects found'}
        />
      </div>

      {selectedProjectId && (
        <div>
          <label style={{ display: 'block', marginBottom: 8, color: '#3E6A9F', fontWeight: 600 }}>
            Select Job
          </label>
          <Select
            showSearch
            allowClear
            placeholder="Search and select a job"
            value={selectedJobId}
            onChange={(val) => setSelectedJobId(val ?? null)}
            loading={loadingJobs}
            optionFilterProp="label"
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={jobOptions}
            style={{ width: '100%' }}
            notFoundContent={
              loadingJobs ? <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="small" /> : <Empty description="No active jobs for this project" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            }
          />
        </div>
      )}
    </Modal>
  );
};

export default ShiftToJobModal;
