import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Select, message, Tooltip } from 'antd';
import BreadCrumb from '../../components/breadcrumb.component.jsx';
import NewTableComponent from '../../components/tables/new-table.jsx';
import { Trash2 as DeleteOutlined, Pencil as EditOutlined, MessageSquare as MessageOutlined } from 'lucide-react';
import '../../assets/styles/legacy/table-client-actions.css';
import { ConfirmationModal } from '../clients/components/LazyModals.jsx';
import '../../assets/styles/legacy/prominent-scrollbar.css';
import StatusTabs from '../clients/components/StatusTabs.jsx';
import { statusColors } from '../clients/constants/client-constants.js';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { getAllJobList, getAllJobListCount, updateJobSettings } from '../shared/services/headhunting.js';
import { formatDateUniversal } from '../shared/utils/formatDate.js';
import { useJobDeleteMutation } from '../clients/hooks/useJobMutations.js';
import useUserStore from '../shared/store/user-store.js';
import StatusHistoryModal, { createStatusHistoryColumn } from '../../components/status-history-modal.jsx';
import { getJobStatusHistory } from '../shared/services/status-history.js';
import JobRemarksModal from '../../components/job-remarks-modal.component.jsx';
import '../../assets/styles/legacy/client-listing-page.css';
import '../../assets/styles/legacy/table-remarks-icon.css';

const jobStatusColors = { ...statusColors, Potential: '#faad14' };

// Job status tabs: All + Pending + keys matching all-job-list-count API
const JOB_STATUS_TABS = [
  { label: 'All', value: '', key: 'all' },
  { label: 'Pending', value: 'Pending', key: 'pending' },
  { label: 'Active', value: 'Active', key: 'active' },
  { label: 'Delayed', value: 'Delayed', key: 'delayed' },
  { label: 'Completed', value: 'Completed', key: 'completed' },
  { label: 'Completed - Payment Pending', value: 'Completed - Payment Pending', key: 'completed_payment_pending' },
  { label: 'Completed - Defaulter', value: 'Completed - Defaulter', key: 'completed_defaulter' },
  { label: 'Terminated By Client + Refunded', value: 'Terminated By Client + Refunded', key: 'terminated_by_client_refunded' },
  { label: 'Terminated By Search O Pal', value: 'Terminated By Search O Pal', key: 'terminated_by_search_o_pal' },
  { label: 'Terminated By Search O Pal + Refunded', value: 'Terminated By Search O Pal + Refunded', key: 'terminated_by_search_o_pal_refunded' },
];
const JOB_STATUS_OPTIONS = JOB_STATUS_TABS.filter((tab) => tab.value).map((tab) => tab.value);

function mapJobCounts(counts = {}) {
  return {
    all: counts?.total_count ?? 0,
    pending: counts?.pending ?? 0,
    active: counts?.active ?? 0,
    delayed: counts?.delayed ?? 0,
    completed: counts?.completed ?? 0,
    completed_payment_pending: (counts?.completed_payment_pending ?? 0) || (counts?.completed_pending_payment ?? 0),
    completed_defaulter: counts?.completed_defaulter ?? 0,
    terminated_by_client_refunded: counts?.terminated_by_client_refunded ?? 0,
    terminated_by_search_o_pal: counts?.terminated_by_search_o_pal ?? 0,
    terminated_by_search_o_pal_refunded: counts?.terminated_by_search_o_pal_refunded ?? 0,
  };
}

export default function JobsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('Active');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({});
  const { user } = useUserStore();
  const userType = user?.user_type;
  const [updatingStatusJobId, setUpdatingStatusJobId] = useState(null);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ visible: false, job: null });
  const [deleteReason, setDeleteReason] = useState('');
  // Status history modal (admin only)
  const [statusHistoryModal, setStatusHistoryModal] = useState({ visible: false, entity: null });
  // PM Remarks read-only modal (admin only)
  const [pmRemarksModalState, setPmRemarksModalState] = useState({ visible: false, jobId: null });
  // Optional filters for count/list APIs (sales_manager, sales_executive query params)
  const salesManagerId = '';
  const salesExecutiveId = '';
  const openDeletedJobsList = useCallback(() => {
    navigate('/admin/deleted-jobs');
  }, [navigate]);

  const handleGlobalFilterChange = useCallback((value) => {
    setGlobalFilter(value ?? '');
  }, []);

  const { data: jobCounts, isLoading: loadingCounts } = useQuery(
    ['allJobListCount', salesManagerId, salesExecutiveId],
    () => getAllJobListCount(salesManagerId, salesExecutiveId),
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const mappedCounts = useMemo(() => mapJobCounts(jobCounts), [jobCounts]);

  const { data, isLoading, isFetching } = useQuery(
    [
      'allJobList',
      pagination.pageIndex,
      pagination.pageSize,
      sorting?.[0]?.id,
      sorting?.[0]?.desc,
      globalFilter,
      selectedStatus,
      salesManagerId,
      salesExecutiveId,
    ],
    () =>
      getAllJobList(
        pagination.pageIndex + 1,
        pagination.pageSize,
        sorting,
        globalFilter,
        selectedStatus,
        salesManagerId,
        salesExecutiveId
      ),
    {
      keepPreviousData: true,
      staleTime: 0,
      refetchOnWindowFocus: false,
    }
  );

  const deleteMutation = useJobDeleteMutation(null, () => {
    setDeleteModal({ visible: false, job: null });
    setDeleteReason('');
    // Invalidate queries to refetch counts and list
    queryClient.invalidateQueries('allJobList');
    queryClient.invalidateQueries('allJobListCount');
  });

  const updateJobStatusMutation = useMutation(
    ({ jobId, status }) => updateJobSettings(jobId, { status }),
    {
      onSuccess: () => {
        message.success('Job status updated successfully');
        queryClient.invalidateQueries('allJobList');
        queryClient.invalidateQueries('allJobListCount');
      },
      onError: (error) => {
        message.error(error?.message || 'Failed to update job status');
      },
      onSettled: () => {
        setUpdatingStatusJobId(null);
      },
    }
  );

  const handleDeleteJob = useCallback((job) => {
    setDeleteModal({ visible: true, job });
  }, []);

  const totalCount = data?.count ?? 0;
  const results = data?.results ?? [];

  const getCount = useCallback(
    (tab) => mappedCounts[tab.key] ?? 0,
    [mappedCounts]
  );

  const columns = useMemo(
    () => [
      {
        header: '#',
        id: 'row_number',
        accessorKey: 'row_number',
        size: 60,
        enableSorting: false,
        Cell: ({ row }) => {
          const idx = pagination.pageIndex * pagination.pageSize + row.index + 1;
          return <span>{idx}</span>;
        },
      },
      {
        header: 'Job Title',
        id: 'job_title',
        accessorKey: 'job_title',
        sortDescFirst: false,
        size: 170,
        Cell: ({ cell, row }) => {
          const title = cell.getValue();
          const id = row.original?.id;
          return id ? (
            <a
              style={{ textDecoration: 'underline', color: '#3E6A9F' }}
              href={`/job-headhunting/${id}`}
              onClick={(e) => { e.preventDefault(); navigate(`/job-headhunting/${id}`); }}
            >
              {title || '-'}
            </a>
          ) : (
            <span>{title || '-'}</span>
          );
        },
      },
      {
        header: 'Vacancies',
        id: 'number_of_vacancies',
        accessorKey: 'number_of_vacancies',
        sortDescFirst: false,
        size: 74,
        Cell: ({ cell }) => <span>{cell.getValue() ?? '-'}</span>,
      },
      {
        header: 'Job Type',
        id: 'job_type',
        accessorKey: 'job_type',
        sortDescFirst: false,
        size: 94,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Employment Type',
        id: 'employment_type',
        accessorKey: 'employment_type',
        sortDescFirst: false,
        size: 104,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Department',
        id: 'department',
        accessorKey: 'department',
        sortDescFirst: false,
        size: 104,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Country',
        id: 'location_country',
        accessorKey: 'location_country',
        sortDescFirst: false,
        size: 98,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'City',
        id: 'location_city',
        accessorKey: 'location_city',
        sortDescFirst: false,
        size: 92,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Min Experience',
        id: 'min_experience',
        accessorKey: 'min_experience',
        sortDescFirst: false,
        size: 98,
        Cell: ({ cell }) => {
          const v = cell.getValue();
          return <span>{v != null ? `${v} yrs` : '-'}</span>;
        },
      },
      {
        header: 'CV Submission Deadline',
        id: 'cv_submission_deadline',
        accessorKey: 'cv_submission_deadline',
        sortDescFirst: false,
        size: 200,
        minSize: 160,
        Cell: ({ cell }) => <span>{cell.getValue() ? formatDateUniversal(cell.getValue()) : '-'}</span>,
      },
      {
        header: 'Status',
        id: 'status',
        accessorKey: 'status',
        sortDescFirst: false,
        size: 100,
        minSize: 90,
        maxSize: 120,
        Cell: ({ cell, row }) => {
          const currentStatus = cell.getValue() || '';
          const jobId = row.original?.id;
          const canEditStatus =
            userType === 'admin' ||
            userType === 'sales_manager' ||
            userType === 'sales_executive';

          if (!canEditStatus || !jobId) {
            return <span>{currentStatus || '-'}</span>;
          }

          const isUpdating = updatingStatusJobId === jobId && updateJobStatusMutation.isLoading;
          const dropdownOptions = currentStatus && !JOB_STATUS_OPTIONS.includes(currentStatus)
            ? [currentStatus, ...JOB_STATUS_OPTIONS]
            : JOB_STATUS_OPTIONS;

          return (
            <Select
              value={currentStatus || undefined}
              placeholder="Select status"
              className="antd-input dropdown"
              style={{ width: 'fit-content', minWidth: 100 }}
              popupMatchSelectWidth={false}
              loading={isUpdating}
              disabled={isUpdating}
              onChange={(nextStatus) => {
                if (!nextStatus || nextStatus === currentStatus) return;
                setUpdatingStatusJobId(jobId);
                updateJobStatusMutation.mutate({ jobId, status: nextStatus });
              }}
              options={dropdownOptions.map((status) => ({ label: status, value: status }))}
            />
          );
        },
      },
      {
        header: 'Description',
        id: 'job_description',
        accessorKey: 'job_description',
        sortDescFirst: false,
        size: 210,
        Cell: ({ cell }) => {
          const desc = cell.getValue();
          if (!desc) return <span>-</span>;
          const truncated = desc.length > 80 ? `${desc.slice(0, 80)}...` : desc;
          return <span title={desc}>{truncated}</span>;
        },
      },
      {
        header: 'Job Portal Jobs',
        id: 'saas_jobs',
        accessorKey: 'saas_jobs',
        enableSorting: false,
        size: 130,
        Cell: ({ row }) => {
          const job = row.original;
          const id = job?.id;
          const isSaasCreated = job?.is_job_create === true;

          if (!isSaasCreated) {
            return (
              <span className="table-saas-client-cell__unavailable">Not Created</span>
            );
          }

          if (!id) return <span>-</span>;

          return (
            <Button
              type="primary"
              size="small"
              style={{ background: '#3E6A9F', borderColor: '#3E6A9F', color: '#fff', height: 26, padding: '0 10px' }}
              onClick={() => navigate(`/saas-job-headhunting/${id}`)}
            >
              View
            </Button>
          );
        },
      },
      // Edit / View Job — same visibility as client project job table (not recruitment-only / PM)
      ...(userType !== 'recruitment_manager' &&
      userType !== 'recruitment_executive' &&
      userType !== 'project_manager'
        ? [
            {
              header: 'Edit',
              id: 'edit',
              accessorKey: 'edit',
              size: 52,
              enableSorting: false,
              Cell: ({ row }) => (
                <EditOutlined size="1em" className="app-icon"
                  style={{ cursor: 'pointer', color: '#1890ff', fontSize: '18px' }}
                  onClick={() => navigate(`/edit-job-headhunting/${row.original.id}`)}
                />
              ),
            },
            {
              header: 'View Job',
              id: 'view_job',
              accessorKey: 'view',
              size: 76,
              enableSorting: false,
              Cell: ({ row }) => {
                const id = row.original?.id;
                if (!id) return null;
                return (
                  <Button
                    type="primary"
                    size="small"
                    style={{ background: '#3E6A9F', borderColor: '#3E6A9F', height: 26, padding: '0 10px' }}
                    onClick={() => navigate(`/job-detail/${id}`)}
                  >
                    View
                  </Button>
                );
              },
            },
          ]
        : []),
      // Delete column - only for admin and sales_manager
      ...(userType === 'admin' || userType === 'sales_manager'
        ? [
            {
              header: 'Actions',
              id: 'actions',
              accessorKey: 'id',
              size: 52,
              enableSorting: false,
              Cell: ({ row }) => (
                <DeleteOutlined size="1em" className="app-icon"
                  style={{
                    cursor: 'pointer',
                    color: '#ff4d4f',
                    fontSize: '18px',
                  }}
                  onClick={() => handleDeleteJob(row.original)}
                />
              ),
            },
          ]
        : []),
      ...(userType === 'admin'
        ? [
            {
              ...createStatusHistoryColumn({
                onOpenHistory: (entity) => setStatusHistoryModal({ visible: true, entity }),
                header: 'History',
                accessorKey: 'status_history_job',
              }),
              size: 64,
            },
          ]
        : []),
      ...(userType !== 'project_manager'
        ? [
            {
              header: 'PM Remarks',
              id: 'pm_remarks_action',
              accessorKey: 'pm_remarks_action',
              enableSorting: false,
              size: 64,
              minSize: 56,
              maxSize: 80,
              Cell: ({ row }) => {
                const hasPmRemarks =
                  Number(row.original?.pm_remarks_count || 0) > 0 ||
                  Number(row.original?.project_manager_remarks_count || 0) > 0;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                    <Tooltip title="View PM remarks">
                      <MessageOutlined size="1em"
                        className={["app-icon", `table-remarks-icon ${hasPmRemarks ? 'table-remarks-icon--filled' : 'table-remarks-icon--empty'}`].filter(Boolean).join(' ')}
                        onClick={() => setPmRemarksModalState({ visible: true, jobId: row.original.id })}
                      />
                    </Tooltip>
                  </div>
                );
              },
            },
          ]
        : []),
    ],
    [navigate, pagination.pageIndex, pagination.pageSize, userType, handleDeleteJob, updatingStatusJobId, updateJobStatusMutation]
  );

  return (
    <>
      <BreadCrumb linkText="Jobs" />
      <div className="listing-page-content">
        <div className="listing-toolbar-flex">
          <StatusTabs
            tabs={JOB_STATUS_TABS}
            activeTab={selectedStatus}
            statusColors={jobStatusColors}
            loading={loadingCounts}
            getCount={getCount}
            onTabChange={(value) => {
              setSelectedStatus(value ?? '');
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          />
        </div>
        {userType === 'admin' && (
          <div className="listing-action-bar-end">
            <button
              type="button"
              className="listing-btn-warn"
              onClick={openDeletedJobsList}
            >
              Deleted Jobs
            </button>
          </div>
        )}
        <div className="table-container">
          <NewTableComponent
            totalCount={totalCount}
            columns={columns}
            data={results}
            denseCells
            muiTableContainerProps={{ sx: { width: 'fit-content', maxWidth: '100%' } }}
            initialState
            pagination={pagination}
            onPaginationChange={setPagination}
            sorting={sorting}
            onSortingChange={setSorting}
            globalFilter={globalFilter}
            onGlobalFilterChange={handleGlobalFilterChange}
            isLoading={isLoading || isFetching}
            enableRowSelection={false}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            heading={`Jobs (${totalCount})`}
          />
        </div>
      </div>
      <Suspense fallback={null}>
        <ConfirmationModal
          showModal={deleteModal.visible}
          setShowModal={(visible) => {
            setDeleteModal(prev => ({ ...prev, visible }));
            if (!visible) setDeleteReason('');
          }}
          mutation={deleteMutation}
          onConfirm={() => deleteMutation.mutate({ jobId: deleteModal.job?.id, reason: deleteReason })}
          showReasonField={true}
          reason={deleteReason}
          setReason={setDeleteReason}
          message={
            <span>
              This action cannot be reversed. Are you sure you want to delete job: <strong>{deleteModal.job?.job_title}</strong>?
            </span>
          }
        />
      </Suspense>
      {userType === 'admin' && (
        <StatusHistoryModal
          open={statusHistoryModal.visible}
          entity={statusHistoryModal.entity}
          getEntityId={(entity) =>
            entity?.job_id ?? entity?.jobId ?? entity?.job?.id ?? entity?.job ?? entity?.id
          }
          onClose={() => setStatusHistoryModal({ visible: false, entity: null })}
          fetchHistoryApi={getJobStatusHistory}
          historyDateKey="changed_at"
          getTitleFromEntity={(entity) => entity?.job_title || 'Job'}
          queryKeyPrefix="jobAuditHistoryAllJobs"
          emptyMessage="No status history available."
        />
      )}
      {userType !== 'project_manager' && (
        <JobRemarksModal
          visible={pmRemarksModalState.visible}
          jobId={pmRemarksModalState.jobId}
          readOnly
          onClose={() => setPmRemarksModalState({ visible: false, jobId: null })}
        />
      )}
    </>
  );
}
