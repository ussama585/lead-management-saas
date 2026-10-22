import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import dayjs from 'dayjs';
import { Button, Form, Input, Modal, Select, Tag, Upload, message } from 'antd';
import { Inbox as InboxOutlined, Plus as PlusOutlined, FileImage as FileImageOutlined } from 'lucide-react';
import BreadCrumb from '../../../components/breadcrumb.component.jsx';
import NewTableComponent from '../../../components/tables/new-table.jsx';
import ApprovalStatusTabs from '../../../components/approval-status-tabs.component.jsx';
import ConfirmationModal from '../../../components/confirmation-modal.component.jsx';
import useUserStore from '../../shared/store/user-store.js';
import {
  getJobDescriptionRequestList,
  getJobDescriptionRequestCount,
  getJobDescriptionRequestView,
  createJobDescriptionRequest,
  updateJobDescriptionRequest,
} from '../../shared/services/headhunting.js';

const { TextArea } = Input;
const { Dragger } = Upload;

const STATUS_COLORS = {
  Pending: 'gold',
  Approved: 'green',
  Rejected: 'red',
};

export default function JobDescriptionRequestPage() {
  const { user } = useUserStore();
  const canCreateRequest = user?.user_type === 'sales_executive' || user?.user_type === 'sales_manager';
  const canReview = user?.user_type === 'recruitment_manager' || user?.user_type === 'admin';
  const queryClient = useQueryClient();

  const [selectedTab, setSelectedTab] = useState('Pending');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [reasonModal, setReasonModal] = useState({ visible: false, reason: '' });
  const [descriptionModalId, setDescriptionModalId] = useState(null);
  const [statusChangeModal, setStatusChangeModal] = useState({ visible: false, id: null, oldStatus: null, newStatus: null, reason: '' });
  const [form] = Form.useForm();

  const { data: listData, isLoading } = useQuery(
    ['jobDescriptionRequestList', selectedTab, pagination.pageIndex, pagination.pageSize],
    () => getJobDescriptionRequestList(selectedTab, pagination.pageIndex + 1, pagination.pageSize),
    { keepPreviousData: true }
  );

  const { data: statusCounts = {} } = useQuery('jobDescriptionRequestCount', getJobDescriptionRequestCount, {
    staleTime: 30 * 1000,
  });

  const { data: descriptionModalData, isLoading: isDescriptionModalLoading } = useQuery(
    ['jobDescriptionRequestView', descriptionModalId],
    () => getJobDescriptionRequestView(descriptionModalId),
    {
      enabled: descriptionModalId != null,
      onError: (error) => {
        message.error(error?.message || 'Failed to fetch job description');
      },
    }
  );

  const tabCounts = useMemo(
    () => ({
      pending: statusCounts?.Pending,
      approved: statusCounts?.Approved,
      rejected: statusCounts?.Rejected,
    }),
    [statusCounts]
  );

  const createMutation = useMutation(createJobDescriptionRequest, {
    onSuccess: () => {
      message.success('Job description request submitted');
      queryClient.invalidateQueries('jobDescriptionRequestList');
      queryClient.invalidateQueries('jobDescriptionRequestCount');
      form.resetFields();
      setModalVisible(false);
    },
    onError: (error) => {
      message.error(error?.message || 'Failed to submit job description request');
    },
  });

  const statusMutation = useMutation(
    ({ id, status, reason }) => updateJobDescriptionRequest(id, { status, reason }),
    {
      onSuccess: () => {
        message.success('Request status updated successfully');
        queryClient.invalidateQueries('jobDescriptionRequestList');
        queryClient.invalidateQueries('jobDescriptionRequestCount');
        setStatusChangeModal({ visible: false, id: null, oldStatus: null, newStatus: null, reason: '' });
      },
      onError: (error) => {
        message.error(error?.message || 'Failed to update request status');
      },
    }
  );

  const rows = listData?.results || [];

  const handleCreateRequest = async () => {
    try {
      const values = await form.validateFields();
      const file = values.attachment?.[0]?.originFileObj;
      createMutation.mutate({
        title: values.title,
        description: values.description,
        file,
      });
    } catch (err) {
      // validation errors are shown inline by the form
    }
  };

  const columns = useMemo(
    () => [
      {
        header: '#',
        accessorKey: 'index',
        enableSorting: false,
        Cell: ({ row }) => <span>{row.index + 1 + pagination.pageIndex * pagination.pageSize}</span>,
      },
      {
        header: 'ID',
        accessorKey: 'id',
        enableSorting: false,
      },
      {
        header: 'Title',
        accessorKey: 'title',
        Cell: ({ cell }) => cell.getValue() || '-',
      },
      {
        header: 'Description',
        accessorKey: 'description',
        Cell: ({ row }) => (
          <Button
            type="primary"
            size="small"
            icon={row.original.file ? <FileImageOutlined size="1em" className="app-icon" /> : undefined}
            style={{ background: '#3E6A9F', borderColor: '#3E6A9F' }}
            onClick={() => setDescriptionModalId(row.original.id)}
          >
            View
          </Button>
        ),
      },
      { header: 'Requested By', accessorKey: 'requested_by_name' },
      { header: 'Accepted By', accessorKey: 'accepted_by_name', Cell: ({ cell }) => cell.getValue() || '-' },
      {
        header: 'Read',
        accessorKey: 'is_read',
        Cell: ({ cell }) => <Tag color={cell.getValue() ? 'green' : 'default'}>{cell.getValue() ? 'Read' : 'Unread'}</Tag>,
      },
      {
        header: 'Status',
        accessorKey: 'status',
        Cell: ({ cell, row }) => {
          const value = cell.getValue() || 'Pending';
          if (!canReview) return <Tag color={STATUS_COLORS[value] || 'default'}>{value}</Tag>;
          return (
            <Select
              size="small"
              value={value}
              style={{ width: 120 }}
              loading={statusMutation.isLoading}
              onChange={(val) => {
                if (val === value) return;
                setStatusChangeModal({ visible: true, id: row.original.id, oldStatus: value, newStatus: val, reason: '' });
              }}
            >
              <Select.Option value="Pending">Pending</Select.Option>
              <Select.Option value="Approved">Approved</Select.Option>
              <Select.Option value="Rejected">Rejected</Select.Option>
            </Select>
          );
        },
      },
      ...(selectedTab === 'Rejected' ? [{
        header: 'Reason',
        accessorKey: 'reason',
        Cell: ({ cell }) => (
          <Button
            type="link"
            style={{ padding: 0, height: 'auto' }}
            onClick={() => setReasonModal({ visible: true, reason: cell.getValue() || 'No reason provided' })}
          >
            View
          </Button>
        ),
      }] : []),
      {
        header: 'Requested On',
        accessorKey: 'created_at',
        Cell: ({ cell }) => (cell.getValue() ? dayjs(cell.getValue()).format('DD MMM YYYY') : '-'),
      },
    ],
    [pagination.pageIndex, pagination.pageSize, selectedTab, canReview, statusMutation.isLoading]
  );

  return (
    <div>
      <BreadCrumb linkText="Job Description Requests" />

      <div style={{ padding: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            margin: '16px 0',
          }}
        >
          <h2 style={{ margin: 0 }}>Job Description Requests</h2>
          {canCreateRequest && (
            <Button
              type="primary"
              icon={<PlusOutlined size="1em" className="app-icon" />}
              style={{ background: '#3E6A9F', borderColor: '#3E6A9F' }}
              onClick={() => setModalVisible(true)}
            >
              New Request
            </Button>
          )}
        </div>

        <ApprovalStatusTabs
          activeValue={selectedTab}
          counts={tabCounts}
          onChange={(val) => {
            setSelectedTab(val);
            setPagination({ pageIndex: 0, pageSize: 10 });
          }}
        />

        <NewTableComponent
          totalCount={listData?.count || 0}
          heading={`Requests (${listData?.count || 0})`}
          columns={columns}
          data={rows}
          isLoading={isLoading}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={setSorting}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          enableRowSelection={false}
        />
      </div>

      <Modal
        title="New Job Description Request"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={handleCreateRequest}
        okText="Submit"
        confirmLoading={createMutation.isLoading}
        okButtonProps={{ style: { background: '#3E6A9F', borderColor: '#3E6A9F' } }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="Enter a title for this request" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            dependencies={['attachment']}
            rules={[
              {
                validator: (_, value) => {
                  const attachment = form.getFieldValue('attachment');
                  if (value?.trim() || attachment?.length) return Promise.resolve();
                  return Promise.reject(new Error('Please provide a description or attach a file'));
                },
              },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Describe the role, requirements, notes for the writer..."
              onChange={() => form.validateFields(['attachment'])}
            />
          </Form.Item>
          <Form.Item
            name="attachment"
            label="Attachment"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
            dependencies={['description']}
            rules={[
              {
                validator: (_, value) => {
                  const description = form.getFieldValue('description');
                  if (value?.length || description?.trim()) return Promise.resolve();
                  return Promise.reject(new Error('Please provide a description or attach a file'));
                },
              },
            ]}
          >
            <Dragger
              beforeUpload={() => false}
              maxCount={1}
              onChange={() => form.validateFields(['description'])}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined size="1em" className="app-icon" />
              </p>
              <p className="ant-upload-text">Click or drag a file to this area to upload</p>
            </Dragger>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Description"
        open={descriptionModalId != null}
        onOk={() => setDescriptionModalId(null)}
        onCancel={() => setDescriptionModalId(null)}
        okText="OK"
        okButtonProps={{ style: { background: '#3E6A9F', borderColor: '#3E6A9F' } }}
        cancelButtonProps={{ style: { display: 'none' } }}
        confirmLoading={isDescriptionModalLoading}
      >
        <div>{isDescriptionModalLoading ? 'Loading...' : (descriptionModalData?.description || 'No description provided')}</div>
        {descriptionModalData?.file && (
          <div style={{ marginTop: 12 }}>
            <img
              src={descriptionModalData.file}
              alt="Attachment"
              style={{ maxWidth: 160, maxHeight: 160, borderRadius: 4, cursor: 'pointer' }}
              onClick={() => window.open(descriptionModalData.file, '_blank', 'noopener,noreferrer')}
            />
          </div>
        )}
      </Modal>

      <Modal
        title="Rejection Reason"
        open={reasonModal.visible}
        onOk={() => setReasonModal({ visible: false, reason: '' })}
        onCancel={() => setReasonModal({ visible: false, reason: '' })}
        okText="OK"
        okButtonProps={{ style: { background: '#3E6A9F', borderColor: '#3E6A9F' } }}
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <div>{reasonModal.reason}</div>
      </Modal>

      <ConfirmationModal
        showModal={statusChangeModal.visible}
        setShowModal={(visible) => setStatusChangeModal((prev) => ({ ...prev, visible }))}
        title={statusChangeModal.newStatus === 'Rejected' ? 'Reason for Rejection' : 'Confirmation'}
        oldStatus={statusChangeModal.oldStatus}
        newStatus={statusChangeModal.newStatus}
        showReasonField={statusChangeModal.newStatus === 'Rejected'}
        reason={statusChangeModal.reason}
        setReason={(reason) => setStatusChangeModal((prev) => ({ ...prev, reason }))}
        isLoading={statusMutation.isLoading}
        confirmText={statusChangeModal.newStatus === 'Rejected' ? 'Confirm Rejection' : 'Yes'}
        onConfirm={() => {
          if (statusChangeModal.newStatus === 'Rejected' && !statusChangeModal.reason.trim()) {
            message.error('Please provide a reason for rejection');
            return;
          }
          statusMutation.mutate({
            id: statusChangeModal.id,
            status: statusChangeModal.newStatus,
            reason: statusChangeModal.reason,
          });
        }}
      />
    </div>
  );
}
