import React, { useMemo, useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Spin, message, Input, Alert, Space, Button as AntButton } from "antd";
import { LoaderCircle as LoadingOutlined, RotateCw as ReloadOutlined } from 'lucide-react';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import NewTableComponent from '../../../../components/tables/new-table.jsx';
import { ConfirmationModal, ShowRemarksLead } from '../../components/LazyModals.jsx';
import ProjectDetailCard from '../../../../components/project-detail-card.component.jsx';
import JobFollowupsModal from '../../../../components/job-followups-modal.component.jsx';
import JobRemarksModal from '../../../../components/job-remarks-modal.component.jsx';
import '../../../../assets/styles/legacy/client-listing-page.css';
import { useQueryClient } from 'react-query';
import useUserStore from '../../../shared/store/user-store.js';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { saveTableState, loadTableState } from '../../../shared/utils/persistTableState.js';
import StatusTabsContainer from '../../components/StatusTabsContainer.jsx';
import { statusColors, jobStatusOptions, getJobStatusTabs } from '../../constants/client-constants.js';
import { useJobStatusMutation, useJobRemarksMutation, useJobDeleteMutation } from '../../hooks/useJobMutations.js';
import { useJobCounts, useProjectInfo, useProjectDetails, useJobsList } from '../../hooks/useJobQueries.js';
import { Modal } from "antd";
import { createJobColumns } from '../../utils/job-columns.jsx';
import { useJobHandlers } from '../../hooks/useJobHandlers.js';
import StatusHistoryModal, { createStatusHistoryColumn } from '../../../../components/status-history-modal.jsx';
import { getJobStatusHistory } from '../../../shared/services/status-history.js';
import PmJobRemarksMatrixModal from '../../../../components/pm-job-remarks-matrix-modal.component.jsx';

const { TextArea } = Input;
export default function ProjectListing() {
  const { clientId } = useParams(); // Note: This is actually the project ID from the route
  const projectId = clientId; // Alias for clarity - the route param is the project ID
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);

  const goBack = () => {
    const clientIdForNav = projectDetails?.client;
    if (clientIdForNav) {
      navigate(`/client-head-hunting/${clientIdForNav}`);
    } else {
      navigate('/headhunting-client');
    }
  };

  const [searchParams, setSearchParams] = useSearchParams();
  
  // Load persisted state from URL params or sessionStorage
  const initialState = loadTableState(`project-jobs-${projectId}`, searchParams, {
    defaultTab: 'Active',
    tab: 'Active',
  });
  
  // Initialize states with loaded values
  const [selectedTab, setSelectedTab] = useState(initialState.tab || 'Active');
  
  const [pagination, setPagination] = useState({ 
    pageIndex: initialState.pageIndex, 
    pageSize: initialState.pageSize 
  });
  
  const [globalFilter, setGlobalFilter] = useState(initialState.search);
  
  const [sorting, setSorting] = useState(initialState.sorting);
  
  const [columnVisibility, setColumnVisibility] = useState({});
  
  // Project Manager: remarks & follow-ups modals
  const [remarksModalState, setRemarksModalState] = useState({
    visible: false,
    jobId: null,
  });

  // Admin: PM remarks read-only modal
  const [pmRemarksModalState, setPmRemarksModalState] = useState({
    visible: false,
    jobId: null,
  });

  const [followupsModalState, setFollowupsModalState] = useState({
    visible: false,
    jobId: null,
  });

  // Status history modal (admin only)
  const [statusHistoryModal, setStatusHistoryModal] = useState({ visible: false, entity: null });

  // PM Job Remarks matrix modal (admin only)
  const [pmJobRemarksMatrixVisible, setPmJobRemarksMatrixVisible] = useState(false);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ visible: false, job: null });
  const [deleteReason, setDeleteReason] = useState('');

  // Track if component is mounting to prevent resetting pagination from URL params
  const isInitialMount = useRef(true);
  
  // Prevent clearing search on component mount - handle MaterialReactTable edge cases
  const handleGlobalFilterChange = (value) => {
    setGlobalFilter(value === undefined || value === null ? '' : value);
  };
  // Sync all state to URL params and sessionStorage
  useEffect(() => {
    saveTableState(`project-jobs-${projectId}`, {
      tab: selectedTab,
      defaultTab: 'Active',
      search: globalFilter,
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting: sorting,
    }, setSearchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, globalFilter, pagination.pageIndex, pagination.pageSize, sorting, projectId]);

  // Fetch data using custom hooks
  const { data: jobCounts, isLoading: countsLoading, error: countsError } = useJobCounts(clientId);
  const { data: projectInfo, isLoading: projectInfoLoading, error: projectInfoError } = useProjectInfo(clientId);
  const { data: projectDetails, error: projectDetailsError } = useProjectDetails(clientId);
  const { data: jobsData, isLoading: jobsLoading, refetch: refetchJobs, error: jobsError } = useJobsList(
    clientId,
    selectedTab,
    pagination,
    sorting,
    globalFilter
  );

  // Handle clientId changes - invalidate all related queries
  useEffect(() => {
    if (clientId) {
      // Invalidate all queries related to this clientId when it changes
      queryClient.invalidateQueries(['projectJobCounts', clientId]);
      queryClient.invalidateQueries(['projectInfo', clientId]);
      queryClient.invalidateQueries(['projectDetails', clientId]);
      queryClient.invalidateQueries(['projectJobs', clientId]);
    }
  }, [clientId, queryClient]);

  // Refetch data when selectedTab changes
  useEffect(() => {
    if (clientId && selectedTab) {
      // Invalidate and refetch job counts
      queryClient.invalidateQueries(['projectJobCounts', clientId]);
      // Invalidate and refetch jobs data
      queryClient.invalidateQueries(['projectJobs', clientId, selectedTab]);
    }
  }, [selectedTab, clientId, queryClient]);

  // Reset pagination when tab changes (but not on initial mount to preserve URL params)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [selectedTab]);

  // Initialize mutations using custom hooks
  const statusMutation = useJobStatusMutation(clientId, () => {
    setStatusModal({ visible: false, job: null, oldStatus: '', newStatus: '', remarks: '' });
    refetchJobs();
  });

  const remarksMutation = useJobRemarksMutation(clientId, () => {
    setRemarksModal({ visible: false, job: null, remarks: '' });
    refetchJobs();
  });

  const deleteMutation = useJobDeleteMutation(clientId, async () => {
    setDeleteModal({ visible: false, job: null });
    setDeleteReason('');
    await Promise.all([
      queryClient.invalidateQueries(['projectJobCounts', clientId]),
      queryClient.invalidateQueries(['projectInfo', clientId]),
      queryClient.invalidateQueries(['projectDetails', clientId]),
      queryClient.invalidateQueries(['projectJobs', clientId]),
    ]);
    refetchJobs();
  });

  const handleDeleteJob = (job) => {
    setDeleteModal({ visible: true, job });
  };

  // Use real jobs data from API
  const jobs = jobsData?.results || [];
  const projectStatus = projectInfo?.status || 'Unknown';
  const breadcrumbClientStatus =
    projectInfo?.client_status ||
    projectDetails?.client_status ||
    projectInfo?.status ||
    'Client';

  // Get status tabs with counts from constants
  const baseStatusTabs = getJobStatusTabs(jobCounts);
  
  const totalJobsCount =
    jobCounts?.total_count ||
    jobCounts?.total ||
    baseStatusTabs.reduce((sum, tab) => sum + tab.count, 0);

  const statusTabs = [{ label: 'All', value: 'All', count: totalJobsCount }, ...baseStatusTabs];

  // Check if user can edit job status
  const canEditJobStatus = useCallback(() => {
    // Admin can edit any job
    if (user?.user_type === 'admin') {
      return true;
    }

    // For non-admin users, check if project status is "Active"
    if (projectStatus !== 'Active') {
      return false;
    }

    // Other users can edit if project is Active
    return true;
  }, [projectStatus, user?.user_type]);

  // Initialize handlers using custom hook
  const {
    statusModal,
    setStatusModal,
    remarksModal,
    setRemarksModal,
    handleStatusChange,
    handleStatusConfirm,
  } = useJobHandlers({
    statusMutation,
    remarksMutation,
    refetchJobs,
    canEditJobStatus,
    projectStatus,
    user,
    jobs,
  });

  // Transform data for table
  const jobsDataForTable = jobs.map((job, idx) => ({
    ...job,
    posted_on: job.created_at,
    index: idx + 1 + pagination.pageIndex * pagination.pageSize,
  }));

  // Manual refresh function for when API calls fail
  const handleManualRefresh = async () => {
    try {
      message.loading('Refreshing data...', 0);

      // Invalidate all queries for this client
      await Promise.all([
        queryClient.invalidateQueries(['projectJobCounts', clientId]),
        queryClient.invalidateQueries(['projectInfo', clientId]),
        queryClient.invalidateQueries(['projectDetails', clientId]),
        queryClient.invalidateQueries(['projectJobs', clientId]),
      ]);

      message.destroy();
      message.success('Data refreshed successfully');
    } catch (error) {
      message.destroy();
      message.error('Failed to refresh data');
    }
  };

  const canManageSaasJob =
    user?.user_type === 'sales_manager' || user?.user_type === 'sales_executive';

  const handleSaasJobCreate = useCallback(
    (job) => {
      if (!canManageSaasJob || selectedTab !== 'Active' || job?.is_job_create !== false) return;
      navigate(`/saas-job-headhunting/${job.id}`);
    },
    [canManageSaasJob, navigate, selectedTab]
  );

  // Create table columns using custom utility
  const jobsColumns = useMemo(
    () => {
      const base = createJobColumns({
        navigate,
        user,
        statusColors,
        statusOptions: jobStatusOptions,
        canEditJobStatus,
        handleStatusChange,
        setRemarksModal,
        setFollowupsModalState,
        setRemarksModalState,
        setPmRemarksModalState: user?.user_type !== 'project_manager' ? setPmRemarksModalState : undefined,
        statusMutationLoading: statusMutation.isLoading,
        handleDelete: handleDeleteJob,
        compactColumns: true,
        handleSaasJobCreate,
        showSaasJobColumn: user?.user_type === 'admin',
        onOpenPmJobRemarksMatrix: () => setPmJobRemarksMatrixVisible(true),
      });
      return user?.user_type === 'admin'
        ? [
            ...base,
            createStatusHistoryColumn({
              onOpenHistory: (entity) => setStatusHistoryModal({ visible: true, entity }),
              header: 'History',
              accessorKey: 'status_history_job',
              size: 56,
              minSize: 48,
              maxSize: 72,
            }),
          ]
        : base;
    },
    [
      navigate,
      user,
      canEditJobStatus,
      handleStatusChange,
      setRemarksModal,
      statusMutation.isLoading,
      handleSaasJobCreate,
      canManageSaasJob,
      selectedTab,
    ]
  );

  return (
    <>
      <BreadCrumb
        goBack={goBack}
        linkText={`${breadcrumbClientStatus} > Projects > Jobs`}
      />



      <div className="container">
        {/* Error Display */}
        {(countsError || projectInfoError || projectDetailsError || jobsError) && (
          <Alert
            message="Data Loading Error"
            description={
              <Space direction="vertical">
                <span>Some data failed to load. You can try refreshing the page or use the manual refresh button below.</span>
                <AntButton
                  type="primary"
                  icon={<ReloadOutlined size="1em" className="app-icon" />}
                  onClick={handleManualRefresh}
                  loading={jobsLoading || countsLoading || projectInfoLoading}
                >
                  Refresh Data
                </AntButton>
              </Space>
            }
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Project Detail Card */}
        <ProjectDetailCard
          projectData={jobsData}
          jobCounts={jobCounts}
          currentUser={user}
          projectId={clientId}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <StatusTabsContainer
            tabs={statusTabs}
            activeTab={selectedTab}
            statusColors={statusColors}
            onTabClick={(tab) => {
              setSelectedTab(tab.value);
              setPagination({ pageIndex: 0, pageSize: 10 });

              // Update URL params
              const newParams = {};
              if (tab.value !== 'Pending') {
                newParams.tab = tab.value;
              }
              setSearchParams(newParams);

              // Refetch data for the new tab
              queryClient.invalidateQueries(['projectJobs', clientId, tab.value]);
              queryClient.invalidateQueries(['projectJobCounts', clientId]);
            }}
            getCount={(tab) => tab.count}
          />
        </div>

        {user?.user_type !== 'recruitment_manager' &&
          user?.user_type !== 'recruitment_executive' &&
          user?.user_type !== 'project_manager' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button
              className="custom-button"
              style={{ marginRight: '16px', background: '#3E6A9F', color: '#fff' }}
              onClick={() => navigate(`/add-new-job-headhunting?projectId=${clientId}`)}
            >
              Add New Job
            </button>
          </div>
        )}

        {/* Jobs Table Section */}
        <div className="table-container">
          <Spin
            indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />}
            size="large"
            spinning={jobsLoading}
          >
            <NewTableComponent
              columns={jobsColumns}
              data={jobsDataForTable}
              totalCount={jobsData?.count || 0} 
              heading={`Jobs(${jobsData?.count || 0})`}
              initialState={pagination}
              pagination={pagination}
              onPaginationChange={setPagination}
              sorting={sorting}
              onSortingChange={setSorting}
              enableRowSelection={false}
              globalFilter={globalFilter}
              onGlobalFilterChange={handleGlobalFilterChange}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={setColumnVisibility}
            />
          </Spin>
        </div>
      </div>

      {/* Status Change Confirmation Modal */}
      <Suspense fallback={null}>
        <ConfirmationModal
          showModal={statusModal.visible}
          setShowModal={(visible) => setStatusModal(prev => ({ ...prev, visible }))}
          mutation={statusMutation}
          oldStatus={statusModal.oldStatus}
          newStatus={statusModal.newStatus}
          details={statusModal.job ? {
            'Job Title': statusModal.job.job_title,
            'Job Type': statusModal.job.job_type,
            'Employment Type': statusModal.job.employment_type,
            'Department': statusModal.job.department,
            'Location': statusModal.job.location_city && statusModal.job.location_country
              ? `${statusModal.job.location_city}, ${statusModal.job.location_country}`
              : statusModal.job.location_city || statusModal.job.location_country || '-',
            'No. of Resources': statusModal.job.number_of_vacancies,
            'Remarks': (
              <TextArea
                value={statusModal.remarks}
                onChange={(e) => setStatusModal(prev => ({ ...prev, remarks: e.target.value }))}
                rows={4}
                placeholder={statusModal.job.remarks ? `Current: ${statusModal.job.remarks}` : "Enter remarks (optional)"}
                maxLength={1000}
                showCount
                style={{ marginTop: 8 }}
              />
            )
          } : null}
          onConfirm={handleStatusConfirm}
        />
      </Suspense>

      {/* Remarks Modal */}
      <Suspense fallback={null}>
        <ShowRemarksLead
          visible={remarksModal.visible}
          onClose={() => setRemarksModal({ visible: false, job: null })}
          lead={remarksModal.job ? {
            ...remarksModal.job,
            contact_person_name: remarksModal.job.job_title || 'Job'
          } : null}
          onSave={async (remarks, contractData) => {
            if (!remarksModal.job) return;

            try {
              await remarksMutation.mutateAsync({
                jobId: remarksModal.job.id,
                remarks: remarks || ''
              });
            } catch (error) {
              // Error is handled by mutation's onError
            }
          }}
          loading={remarksMutation.isLoading}
          showContractFields={false}
          proposalRequired={false}
          isProposalAttached={false}
          remarksRequired={false}
          saveButtonText="Update"
          viewOnlyMode={false}
        />
      </Suspense>

      {/* Project Manager Modals */}
      {user?.user_type === 'project_manager' && (
        <>
          <JobRemarksModal
            visible={remarksModalState.visible}
            jobId={remarksModalState.jobId}
            onClose={() =>
              setRemarksModalState({
                visible: false,
                jobId: null,
              })
            }
          />
          <JobFollowupsModal
            visible={followupsModalState.visible}
            jobId={followupsModalState.jobId}
            onClose={() =>
              setFollowupsModalState({
                visible: false,
                jobId: null,
              })
            }
          />
        </>
      )}
      {user?.user_type !== 'project_manager' && (
        <JobRemarksModal
          visible={pmRemarksModalState.visible}
          jobId={pmRemarksModalState.jobId}
          readOnly
          onClose={() => setPmRemarksModalState({ visible: false, jobId: null })}
        />
      )}
      {user?.user_type === 'admin' && (
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
          queryKeyPrefix="jobAuditHistory"
          emptyMessage="No status history available."
        />
      )}
      {/* PM Job Remarks Matrix Modal */}
      <PmJobRemarksMatrixModal
        visible={pmJobRemarksMatrixVisible}
        projectId={clientId}
        onClose={() => setPmJobRemarksMatrixVisible(false)}
        companyName={projectDetails?.client_name || projectInfo?.client_name || projectDetails?.name || ''}
      />

      {/* Delete Confirmation Modal */}
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
    </>
  );
}
