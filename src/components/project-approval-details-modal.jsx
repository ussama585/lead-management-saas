import { Modal } from './ui/app-modal.jsx';
import { Spin, Button, Tooltip } from './ui/app-controls.jsx';
import React from 'react';
import { Descriptions, Table, Typography, Alert } from 'antd';
import { LoaderCircle as LoadingOutlined, ExternalLink as ExportOutlined } from 'lucide-react';
import { useQuery } from 'react-query';
import { getProjectApprovalDetails } from '../pages/shared/services/headhunting.js';
import { formatDateUniversal } from '../pages/shared/utils/formatDate.js';

const { Title, Text } = Typography;

const PRIMARY_COLOR = '#3E6A9F';

const circularLoader = <LoadingOutlined size="1em" className="app-icon app-icon-spin" style={{ fontSize: 32, color: PRIMARY_COLOR }}  />;

export default function ProjectApprovalDetailsModal({ visible, projectId, onClose, onConfirm, confirmLoading }) {
  const { data, isLoading, error } = useQuery(
    ['projectApprovalDetails', projectId],
    () => getProjectApprovalDetails(projectId),
    {
      enabled: visible && !!projectId,
      refetchOnWindowFocus: false,
    }
  );

  const details = data?.results;

  const jobColumns = [
    { title: 'Job Title', dataIndex: 'job_title', key: 'job_title' },
    { title: 'Vacancies', dataIndex: 'number_of_vacancies', key: 'number_of_vacancies' },
    { title: 'Employment', dataIndex: 'employment_type', key: 'employment_type' },
    { title: 'Payment Term', dataIndex: 'payment_term', key: 'payment_term' },
    {
      title: 'Salary',
      key: 'salary',
      render: (_, record) => `${record.currency || ''} ${record.min_salary ?? 0} - ${record.max_salary ?? 0}`,
    },
    { title: 'CVs Required', dataIndex: 'cvs_to_be_provided', key: 'cvs_to_be_provided' },
    {
      title: 'CV Deadline',
      dataIndex: 'cv_submission_deadline',
      key: 'cv_submission_deadline',
      render: (val) => formatDateUniversal(val),
    },
    {
      title: 'Joining Date',
      dataIndex: 'expected_joining_date',
      key: 'expected_joining_date',
      render: (val) => formatDateUniversal(val),
    },
    {
      title: '',
      key: 'actions',
      width: 40,
      render: (_, record) => (
        <Tooltip title="Open job details in new tab">
          <ExportOutlined size="1em" className="app-icon"
            style={{ color: PRIMARY_COLOR, cursor: 'pointer' }}
            onClick={() => window.open(`/job-detail/${record.id}`, '_blank', 'noopener,noreferrer')}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Modal
      open={visible}
      title="Project Approval Details"
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="back" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          style={{ background: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
          onClick={() => onConfirm(projectId)}
          loading={confirmLoading}
          disabled={isLoading || error || !details}
        >
          Confirm Approval
        </Button>,
      ]}
      destroyOnClose
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin indicator={circularLoader} />
        </div>
      ) : error ? (
        <Alert message="Error fetching details" description={error?.message || 'Something went wrong.'} type="error" showIcon />
      ) : details ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Project Name" span={2}>{details.project_name}</Descriptions.Item>
            <Descriptions.Item label="Client">{details.client_company_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="Project Completion Deadline">
              {formatDateUniversal(details.project_completion_deadline)}
            </Descriptions.Item>
          </Descriptions>

          <div>
            <Title level={5} style={{ color: PRIMARY_COLOR }}>Jobs Overview</Title>
            <Table
              dataSource={details.jobs}
              columns={jobColumns}
              rowKey="id"
              pagination={false}
              size="small"
              bordered
            />
          </div>
        </div>
      ) : (
        <Text>No details available.</Text>
      )}
    </Modal>
  );
}
