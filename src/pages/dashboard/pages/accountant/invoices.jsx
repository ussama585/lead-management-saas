import React, { useMemo, useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import dayjs from 'dayjs';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import NewTableComponent from '../../../../components/tables/new-table.jsx';
import { Modal, Tooltip, Select, message } from 'antd';
import { FileImage as FileImageOutlined, MessageCircle as CommentOutlined } from 'lucide-react';
import ApprovalStatusTabs from '../../../../components/approval-status-tabs.component.jsx';
import { ConfirmationModal } from '../../../clients/components/LazyModals.jsx';
import { getProjectPaymentCount, getOverallProjectPaymentList, updateProjectPaymentStatus } from '../../../shared/services/headhunting.js';
import useUserStore from '../../../shared/store/user-store.js';
import '../../../../assets/styles/legacy/table-remarks-icon.css';

const AccountantInvoices = () => {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const isAdmin = user?.user_type === 'admin';
  const canEditStatus = isAdmin || user?.user_type === 'accountant';
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [modal, setModal] = useState({ visible: false, remarks: '' });
  const [selectedTab, setSelectedTab] = useState('Pending');
  const [statusChangeModal, setStatusChangeModal] = useState({ visible: false, id: null, oldStatus: null, newStatus: null, reason: '' });

  const { data: approvalCounts = {} } = useQuery(
    'invoiceApprovalCounts',
    getProjectPaymentCount,
    { staleTime: 30 * 1000 }
  );

  const { data: paymentsData, isLoading } = useQuery(
    ['invoicePaymentList', selectedTab, pagination.pageIndex, pagination.pageSize],
    () => getOverallProjectPaymentList(selectedTab, pagination.pageIndex + 1, pagination.pageSize),
    { keepPreviousData: true }
  );

  const statusMutation = useMutation(
    ({ id, status, reason }) => updateProjectPaymentStatus(id, status, reason),
    {
      onSuccess: () => {
        message.success('Payment status updated successfully');
        queryClient.invalidateQueries('invoicePaymentList');
        queryClient.invalidateQueries('invoiceApprovalCounts');
        setStatusChangeModal({ visible: false, id: null, oldStatus: null, newStatus: null, reason: '' });
      },
      onError: (error) => {
        message.error(error?.message || 'Failed to update payment status');
      },
    }
  );

  const rows = paymentsData?.results || [];

  const columns = useMemo(() => [
    {
      header: '#',
      accessorKey: 'id',
      enableSorting: false,
      Cell: ({ row }) => <span>{row.index + 1 + pagination.pageIndex * pagination.pageSize}</span>,
    },
    {
      header: 'Project Title',
      accessorKey: 'project_name',
      Cell: ({ cell, row }) => {
        const title = cell.getValue();
        if (!isAdmin || !row.original.project_id) return <span>{title}</span>;
        return (
          <a
            onClick={(e) => {
              e.preventDefault();
              navigate(`/edit-project-headhunting/${row.original.project_id}`);
            }}
            href={`/edit-project-headhunting/${row.original.project_id}`}
            style={{ color: '#3E6A9F' }}
          >
            {title}
          </a>
        );
      },
    },
    {
      header: 'Invoice Amount',
      accessorKey: 'amount',
      Cell: ({ cell }) => {
        const val = cell.getValue();
        const num = Number(val);
        return <span>{isNaN(num) ? val : num.toLocaleString()}</span>;
      },
    },
    {
      header: 'View Invoice',
      accessorKey: 'invoice',
      enableSorting: false,
      Cell: ({ cell }) => {
        const url = cell.getValue();
        return url ? (
          <Tooltip title="View Invoice">
            <FileImageOutlined size="1em" className="app-icon"
              style={{ color: '#3E6A9F', fontSize: 18, cursor: 'pointer' }}
              onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
            />
          </Tooltip>
        ) : (
          <span>-</span>
        );
      },
    },
    {
      header: 'Payment Proof',
      accessorKey: 'payment_proof',
      enableSorting: false,
      Cell: ({ cell }) => {
        const url = cell.getValue();
        return url ? (
          <Tooltip title="View Payment Proof">
            <FileImageOutlined size="1em" className="app-icon"
              style={{ color: '#3E6A9F', fontSize: 18, cursor: 'pointer' }}
              onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
            />
          </Tooltip>
        ) : (
          <span>-</span>
        );
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      Cell: ({ cell, row }) => {
        const value = cell.getValue() || 'Pending';
        if (!canEditStatus) return <span>{value}</span>;
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
      header: 'Remarks',
      accessorKey: 'reason',
      Cell: ({ cell }) => (
        <CommentOutlined size="1em"
          className={["app-icon", `table-remarks-icon ${cell.getValue() ? 'table-remarks-icon--filled' : 'table-remarks-icon--empty'}`].filter(Boolean).join(' ')}
          onClick={() => setModal({ visible: true, remarks: cell.getValue() || '' })}
        />
      ),
    }] : []),
    {
      header: 'Payment Date',
      accessorKey: 'payment_date',
      Cell: ({ cell }) => {
        const val = cell.getValue();
        return <span>{val ? dayjs(val).format('DD MMM YYYY') : '-'}</span>;
      },
    },
  ], [pagination.pageIndex, pagination.pageSize, selectedTab, statusMutation.isLoading, canEditStatus]);

  return (
    <>
      <BreadCrumb linkText="Invoices" />
      <div className="container">
        <ApprovalStatusTabs
          activeValue={selectedTab}
          counts={approvalCounts}
          onChange={(val) => { setSelectedTab(val); setPagination({ pageIndex: 0, pageSize: 10 }); }}
        />
        <NewTableComponent
          totalCount={paymentsData?.count || 0}
          heading={`Invoices (${paymentsData?.count || 0})`}
          columns={columns}
          data={rows}
          initialState
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={setSorting}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          isLoading={isLoading}
          enableRowSelection={false}
        />
        <Modal
          title="Remarks"
          open={modal.visible}
          onOk={() => setModal({ visible: false, remarks: '' })}
          onCancel={() => setModal({ visible: false, remarks: '' })}
          okText="OK"
          cancelButtonProps={{ style: { display: 'none' } }}
        >
          <div>{modal.remarks || 'No remarks'}</div>
        </Modal>
        <Suspense fallback={null}>
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
        </Suspense>
      </div>
    </>
  );
};

export default AccountantInvoices;
