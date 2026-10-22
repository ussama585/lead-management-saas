import React, { useMemo, useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Spin, Select, message, Tooltip, Button } from 'antd';
import { LoaderCircle as LoadingOutlined, Pencil as EditOutlined, MessageSquare as MessageOutlined, Clock as ClockCircleOutlined } from 'lucide-react';
import BreadCrumb from '../../components/breadcrumb.component.jsx';
import NewTableComponent from '../../components/tables/new-table.jsx';
import { ConfirmationModal } from '../clients/components/LazyModals.jsx';
import ProjectDetailCard from '../../components/project-detail-card.component.jsx';
import '../../assets/styles/legacy/client-listing-page.css';
import '../../assets/styles/legacy/table-client-actions.css';
import '../../assets/styles/legacy/table-remarks-icon.css';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getProjectJobList, getProjectJobListCount, updateJob, getProjectInformation, addRecruiterRemarkToJob } from '../shared/services/headhunting.js';
import { formatSalaryNum } from '../shared/utils/formatters.js';
import { formatDateUniversal } from '../shared/utils/formatDate.js';
import useUserStore from '../shared/store/user-store.js';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import StatusFilterTabs from '../../components/status-filter-tabs.jsx';
import JobRemarksModal from '../../components/job-remarks-modal.component.jsx';
import JobFollowupsModal from '../../components/job-followups-modal.component.jsx';
import RemarksModal from '../clients/components/RemarksModal.jsx';

// Status colors (matching recruitment projects page)
const statusColors = {
  'Pending': '#faad14', // Orange
  'Active': '#52c41a', // Green
  'Delayed': '#ff7a45', // Dark Orange
  'Completed': '#1890ff', // Blue
  'Completed - Payment Pending': '#fa8c16', // Orange
  'Completed - Defaulter': '#ff4d4f', // Red
  'Terminated By Client': '#13c2c2', // Cyan
  'Terminated By Client + Refunded': '#722ed1', // Purple
  'Terminated By Search O Pal': '#2f54eb', // Blue
  'Terminated By Search O Pal + Refunded': '#531dab', // Dark Purple
};

export default function RecruitmentProjectListing() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);
  
  const goBack = () => {
    navigate(user?.user_type === 'project_manager' ? '/project-manager/projects' : '/recruitment/projects');
  }

  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read initial values from URL params FIRST
  const initialTabFromUrl = searchParams.get("tab") || 'Active';
  const initialSearchFromUrl = searchParams.get("search") || '';
  const initialPageIndexFromUrl = parseInt(searchParams.get("page")) || 0;
  const initialPageSizeFromUrl = parseInt(searchParams.get("pageSize")) || 10;
  const initialSortFieldFromUrl = searchParams.get("sortBy");
  const initialSortOrderFromUrl = searchParams.get("sortOrder");
  
  // Then initialize states with URL param values
  const [selectedTab, setSelectedTab] = useState(initialTabFromUrl);
  
  const [pagination, setPagination] = useState({ 
    pageIndex: initialPageIndexFromUrl, 
    pageSize: initialPageSizeFromUrl 
  });
  
  const [globalFilter, setGlobalFilter] = useState(initialSearchFromUrl);
  
  const [sorting, setSorting] = useState(() => {
    if (initialSortFieldFromUrl) {
      return [{
        id: initialSortFieldFromUrl,
        desc: initialSortOrderFromUrl === 'desc'
      }];
    }
    return [];
  });
  
  // Track if component is mounting to prevent resetting pagination from URL params
  const isInitialMount = useRef(true);
  
  // Prevent clearing search on component mount - handle MaterialReactTable edge cases
  const handleGlobalFilterChange = (value) => {
    setGlobalFilter(value === undefined || value === null ? '' : value);
  };
// Sync all state to URL params
useEffect(() => {
  const params = {};
  
  // Tab
  if (selectedTab !== 'Active') {
    params.tab = selectedTab;
  }
  
  // Search
  if (globalFilter && globalFilter.trim()) {
    params.search = globalFilter.trim();
  }
  
  // Pagination
  if (pagination.pageIndex !== 0) {
    params.page = pagination.pageIndex.toString();
  }
  if (pagination.pageSize !== 10) {
    params.pageSize = pagination.pageSize.toString();
  }
  
  // Sorting
  if (sorting && sorting.length > 0 && sorting[0]?.id) {
    params.sortBy = sorting[0].id;
    params.sortOrder = sorting[0].desc ? 'desc' : 'asc';
  }
  
  setSearchParams(params, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedTab, globalFilter, pagination.pageIndex, pagination.pageSize, sorting]);
  // Status change confirmation modal state
  const [statusModal, setStatusModal] = useState({ 
    visible: false, 
    job: null, 
    oldStatus: '', 
    newStatus: '' 
  });
  const [remarksModal, setRemarksModal] = useState({
    visible: false,
    job: null,
    remarks: '',
  });
  const [remarksError, setRemarksError] = useState('');



  // Fetch job counts using the API
  const { data: jobCounts, isLoading: countsLoading } = useQuery(
    ['projectJobCounts', clientId],
    () => getProjectJobListCount(clientId),
    {
      enabled: !!clientId,
      refetchOnWindowFocus: false,
    }
  );

  // Fetch project information to get project status
  const { data: projectInfo, isLoading: projectInfoLoading } = useQuery(
    ['projectInfo', clientId],
    () => getProjectInformation(clientId),
    {
      enabled: !!clientId,
      refetchOnWindowFocus: false,
    }
  );

  // Serialize sorting state for proper cache invalidation
  const sortField = sorting && sorting.length > 0 && sorting[0]?.id ? sorting[0].id : null;
  const sortDirection = sorting && sorting.length > 0 && sorting[0]?.desc !== undefined ? sorting[0].desc : null;

  // Fetch jobs data using the API
  const { data: jobsData, isLoading: jobsLoading } = useQuery(
    [
      'projectJobs',
      clientId,
      selectedTab,
      pagination.pageIndex,
      pagination.pageSize,
      sortField, // Serialized sorting field
      sortDirection, // Serialized sorting direction
      globalFilter
    ],
    () => getProjectJobList(clientId, selectedTab, pagination.pageIndex + 1, pagination.pageSize, sorting, globalFilter),
    {
      enabled: !!clientId,
      staleTime: 2 * 60 * 1000, // 2 minutes - reasonable for job data
      cacheTime: 10 * 60 * 1000, // 10 minutes cache
      refetchOnWindowFocus: false,
      // Allow refetch on mount when data is stale (e.g. after adding a new job)
      refetchOnMount: true,
      keepPreviousData: true, // Keep previous data while loading new data
    }
  );


  // Reset pagination when tab changes (but not on initial mount to preserve URL params)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [selectedTab]);

  // Status change mutation for jobs
  const statusMutation = useMutation(
    ({ jobId, status }) => {
      return updateJob(jobId, { status });
    },
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Job status updated successfully');
        setStatusModal({ visible: false, job: null, oldStatus: '', newStatus: '' });
        
        queryClient.invalidateQueries(['projectJobCounts', clientId]);
        queryClient.invalidateQueries(['projectJobs', clientId]);
      },
      onError: (error) => {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update job status';
        message.error(errorMessage);
      },
    }
  );

  const remarksMutation = useMutation(
    ({ jobId, remarks }) => addRecruiterRemarkToJob(jobId, remarks),
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Remarks updated successfully');
        setRemarksModal({ visible: false, job: null, remarks: '' });
        setRemarksError('');
        queryClient.invalidateQueries(['projectJobs', clientId]);
      },
      onError: (error) => {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update remarks';
        message.error(errorMessage);
      },
    }
  );

  // Use real jobs data from API (memoized for stable hook deps)
  const jobs = useMemo(() => jobsData?.results || [], [jobsData]);
  const projectStatus = projectInfo?.status || 'Unknown';

  // Status choices for StatusFilterTabs component
  const statusChoices = [
    { label: 'Pending', value: 'Pending', apiKey: 'pending' },
    { label: 'Active', value: 'Active', apiKey: 'active' },
    { label: 'Delayed', value: 'Delayed', apiKey: 'delayed' },
    { label: 'Completed', value: 'Completed', apiKey: 'completed' },
    { label: 'Completed - Payment Pending', value: 'Completed - Payment Pending', apiKey: 'completed_payment_pending' },
    { label: 'Completed - Defaulter', value: 'Completed - Defaulter', apiKey: 'completed_defaulter' },
    { label: 'Terminated By Client', value: 'Terminated By Client', apiKey: 'terminated_by_client' },
    { label: 'Terminated By Client + Refunded', value: 'Terminated By Client + Refunded', apiKey: 'terminated_by_client_refunded' },
    { label: 'Terminated By Search O Pal', value: 'Terminated By Search O Pal', apiKey: 'terminated_by_search_o_pal' },
    { label: 'Terminated By Search O Pal + Refunded', value: 'Terminated By Search O Pal + Refunded', apiKey: 'terminated_by_search_o_pal_refunded' },
  ];

  // Helper functions for StatusFilterTabs
  const getTotalCount = () => {
    if (!jobCounts) return 0;
    return Object.values(jobCounts).reduce((sum, count) => sum + (count || 0), 0);
  };

  const getStatusCount = (apiKey) => {
    return jobCounts?.[apiKey] || 0;
  };


  // Status options for dropdown
  // Added "All" option so 'All' tab works correctly
  const statusOptions = useMemo(
    () => [
    { label: 'Pending', value: 'Pending' },
    { label: 'Active', value: 'Active' },
    { label: 'Delayed', value: 'Delayed' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Completed - Payment Pending', value: 'Completed - Payment Pending' },
    { label: 'Completed - Defaulter', value: 'Completed - Defaulter' },
    { label: 'Terminated By Client', value: 'Terminated By Client' },
    { label: 'Terminated By Client + Refunded', value: 'Terminated By Client + Refunded' },
    { label: 'Terminated By Search O Pal', value: 'Terminated By Search O Pal' },
    { label: 'Terminated By Search O Pal + Refunded', value: 'Terminated By Search O Pal + Refunded' },
    ],
    []
  );
  // Filter jobs by selected tab - no need to filter since API returns filtered data
  const filteredJobs = jobs;

  // Check if user can edit job status
  const canEditJobStatus = useCallback(() => {
    // Admin and recruitment manager can edit any job
    if (user?.user_type === 'admin' || user?.user_type === 'recruitment_manager') {
      return true;
    }
    
    // For other users, check if project status is "Active"
    if (projectStatus !== 'Active') {
      return false;
    }
    
    // Other users can edit if project is Active
    return true;
  }, [projectStatus, user]);

  const canEditRemarks = useCallback((job) => {
    if (!job) return false;
    if (user?.user_type !== 'recruitment_manager' && user?.user_type !== 'recruitment_executive') {
      return false;
    }

    const assignedRecruiterId =
      job?.recruiter ??
      job?.recruiter_id ??
      projectInfo?.recruiter ??
      projectInfo?.recruiter_id ??
      projectInfo?.assigned_to;

    // Primary check: assigned recruiter id equals current user id.
    if (assignedRecruiterId !== undefined && assignedRecruiterId !== null && assignedRecruiterId !== '') {
      return Number(assignedRecruiterId) === Number(user?.id);
    }

    // Fallback check when id is not available: recruiter name equals current user name.
    const assignedRecruiterName = String(
      job?.recruiter_name ??
      projectInfo?.recruiter_name ??
      '',
    )
      .trim()
      .toLowerCase();
    const currentUserName = String(user?.name ?? '')
      .trim()
      .toLowerCase();

    return Boolean(assignedRecruiterName && currentUserName && assignedRecruiterName === currentUserName);
  }, [projectInfo, user]);

  // Transform data for table
  const jobsDataForTable = filteredJobs.map((job, idx) => ({
    ...job,
    posted_on: job.created_at ? formatDateUniversal(job.created_at) : '-',
    index: idx + 1 + pagination.pageIndex * pagination.pageSize,
  }));

  // Handler to update job status
  const handleStatusChange = useCallback((jobId, newStatus) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      // Check if user can edit job status
      if (!canEditJobStatus()) {
        if (projectStatus !== 'Active' && user?.user_type !== 'admin') {
          message.warning('Cannot update job status: Project is not Active');
        } else {
          message.warning('You do not have permission to edit this job');
        }
        return;
      }
      
      setStatusModal({
        visible: true,
        job,
        oldStatus: job.status || 'No Status',
        newStatus: newStatus
      });
    }
  }, [canEditJobStatus, jobs, projectStatus, user]);

  const handleStatusConfirm = () => {
    statusMutation.mutate({ 
      jobId: statusModal.job.id, 
      status: statusModal.newStatus 
    });
  };

  // Project Manager: remarks & follow-ups modals
  const [remarksModalState, setRemarksModalState] = useState({
    visible: false,
    jobId: null,
  });

  const [followupsModalState, setFollowupsModalState] = useState({
    visible: false,
    jobId: null,
  });

  // PM Remarks read-only modal (non-project_manager roles)
  const [pmRemarksModalState, setPmRemarksModalState] = useState({
    visible: false,
    jobId: null,
  });

  // Custom handler to ensure sorting toggles between asc and desc, never clears
  const handleSortingChange = (newSorting) => {
    // If sorting is being cleared (empty array), and we had a previous sort, toggle it instead
    if ((!newSorting || newSorting.length === 0) && sorting && sorting.length > 0 && sorting[0]?.id) {
      // Toggle the existing sort direction instead of clearing
      const currentSort = sorting[0];
      const toggledSort = [{
        id: currentSort.id,
        desc: !currentSort.desc // Toggle between true and false
      }];
      setSorting(toggledSort);
    } else {
      // Normal update
      setSorting(newSorting);
    }
  };

  const jobsColumns = useMemo(
    () => [
      {
        header: 'Job Title',
        id: 'job_title',
        accessorKey: 'job_title',
        sortUndefined: 'last',
        sortDescFirst: false,
        Cell: ({ row, cell }) => {
          const href = user?.user_type === 'project_manager'
            ? `/project-manager/job-headhunting/${row.original.id}?jobId=${row.original.id}`
            : `/recruitment/job-headhunting/${row.original.id}?jobId=${row.original.id}`;
          return (
            <a
              style={{ color: '#3E6A9F', textDecoration: 'underline', cursor: 'pointer' }}
              href={href}
              onClick={(e) => { e.preventDefault(); navigate(href); }}
            >
              {cell.getValue()}
            </a>
          );
        },
      },
      {
        header: 'Job Type',
        id: 'job_type',
        accessorKey: 'job_type',
        sortUndefined: 'last',
        sortDescFirst: false,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Employment Type',
        id: 'employment_type',
        accessorKey: 'employment_type',
        sortUndefined: 'last',
        sortDescFirst: false,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Department',
        id: 'department',
        accessorKey: 'department',
        sortUndefined: 'last',
        sortDescFirst: false,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Location',
        id: 'location_city',
        accessorKey: 'location_city',
        sortUndefined: 'last',
        sortDescFirst: false,
        Cell: ({ cell, row }) => (
          <span>
            {row.original.location_city && row.original.location_country 
              ? `${row.original.location_city}, ${row.original.location_country}`
              : row.original.location_city || row.original.location_country || '-'
            }
          </span>
        ),
      },
      {
        header: 'No. of Resources',
        id: 'number_of_vacancies',
        accessorKey: 'number_of_vacancies',
        sortUndefined: 'last',
        sortDescFirst: false,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'CVs to be Provided',
        id: 'cvs_to_be_provided',
        accessorKey: 'cvs_to_be_provided',
        sortUndefined: 'last',
        sortDescFirst: false,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'CV Submission Deadline',
        id: 'cv_submission_deadline',
        accessorKey: 'cv_submission_deadline',
        sortUndefined: 'last',
        sortDescFirst: false,
        size: 200,
        minSize: 160,
        Cell: ({ cell }) => <span>{cell.getValue() ? formatDateUniversal(cell.getValue()) : '-'}</span>,
      },
      {
        header: 'Salary Range',
        id: 'min_salary',
        accessorKey: 'min_salary',
        sortUndefined: 'last',
        sortDescFirst: false,
        Cell: ({ cell, row }) => {
          const minSalary = row.original.min_salary;
          const maxSalary = row.original.max_salary;
          const currency = row.original.currency;
          const paymentTerm = row.original.payment_term;
          
          if (minSalary && maxSalary) {
            return <span>{`${currency || 'PKR'} ${formatSalaryNum(minSalary)} - ${formatSalaryNum(maxSalary)}${paymentTerm ? ` ${paymentTerm}` : ''}`}</span>;
          } else if (minSalary) {
            return <span>{`${formatSalaryNum(minSalary)} ${currency || ''}${paymentTerm ? ` (${paymentTerm})` : ''}`}</span>;
          } else if (maxSalary) {
            return <span>{`${formatSalaryNum(maxSalary)} ${currency || ''}${paymentTerm ? ` (${paymentTerm})` : ''}`}</span>;
          }
          return <span>-</span>;
        },
      },
      // Project Manager specific columns: Follow Up & Remarks
      ...(user?.user_type === 'project_manager'
        ? [
            {
              header: 'Follow Up',
              id: 'follow_up_actions',
              enableSorting: false,
              muiTableHeadCellProps: {
                align: 'center',
              },
              muiTableBodyCellProps: {
                align: 'center',
                sx: {
                  textAlign: 'center',
                },
              },
              Cell: ({ row }) => (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  <Tooltip title="View & manage follow-ups">
                    <ClockCircleOutlined size="1em" className="app-icon"
                      style={{
                        cursor: 'pointer',
                        fontSize: 18,
                        color: '#3E6A9F',
                      }}
                      onClick={() =>
                        setFollowupsModalState({
                          visible: true,
                          jobId: row.original.id,
                        })
                      }
                    />
                  </Tooltip>
                </div>
              ),
            },
            {
              header: 'Remarks',
              id: 'remarks_actions',
              enableSorting: false,
              muiTableHeadCellProps: {
                align: 'center',
              },
              muiTableBodyCellProps: {
                align: 'center',
                sx: {
                  textAlign: 'center',
                },
              },
              Cell: ({ row }) => (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  <Tooltip title="View & manage remarks">
                    <MessageOutlined size="1em" className="app-icon"
                      style={{
                        cursor: 'pointer',
                        fontSize: 18,
                        color: '#3E6A9F',
                      }}
                      onClick={() =>
                        setRemarksModalState({
                          visible: true,
                          jobId: row.original.id,
                        })
                      }
                    />
                  </Tooltip>
                </div>
              ),
            },
          ]
        : []),
      ...(user?.user_type === 'recruitment_manager' || user?.user_type === 'recruitment_executive'
        ? [
            {
              header: 'Recruiter Remarks',
              id: 'recruitment_remarks_actions',
              enableSorting: false,
              muiTableHeadCellProps: {
                align: 'center',
              },
              muiTableBodyCellProps: {
                align: 'center',
                sx: {
                  textAlign: 'center',
                },
              },
              Cell: ({ row }) => {
                const editable = canEditRemarks(row.original);
                return (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                    <Tooltip title={editable ? 'View & update remarks' : 'View remarks'}>
                      <MessageOutlined size="1em" className="app-icon"
                        style={{
                          cursor: 'pointer',
                          fontSize: 18,
                          color: (
                            String(row.original?.recruiter_remarks ?? '').trim() !== '' ||
                            Number(row.original?.recruiter_remarks_count || 0) > 0
                          ) ? '#1890ff' : '#bbb',
                        }}
                        onClick={() => {
                          setRemarksError('');
                          setRemarksModal({
                            visible: true,
                            job: row.original,
                            remarks: row.original?.recruiter_remarks ?? '',
                          });
                        }}
                      />
                    </Tooltip>
                  </div>
                );
              },
            },
          ]
        : []),
      ...((
        user?.user_type === 'admin' ||
        ((user?.user_type === 'recruitment_manager' || user?.user_type === 'recruitment_executive') && selectedTab === 'Active')
      )
        ? [
            {
              header: 'Job Portal Job',
              id: 'saas_jobs',
              accessorKey: 'saas_jobs',
              enableSorting: false,
              muiTableHeadCellProps: { align: 'center' },
              muiTableBodyCellProps: {
                align: 'center',
                sx: { textAlign: 'center', minWidth: 160 },
              },
              Cell: ({ row }) => {
                const job = row.original;
                const id = job?.id;
                const isSaasCreated = job?.is_job_create === true;

                if (!id) return <span>-</span>;

                if (isSaasCreated) {
                  return (
                    <Button
                      type="primary"
                      size="small"
                      style={{
                        background: '#3E6A9F',
                        borderColor: '#3E6A9F',
                        color: '#fff',
                        height: 26,
                        padding: '0 10px',
                      }}
                      onClick={() => navigate(`/saas-job-headhunting/${id}`)}
                    >
                      View
                    </Button>
                  );
                }

                if (user?.user_type === 'admin') {
                  return <span className="table-saas-client-cell__unavailable">Not Created</span>;
                }

                return (
                  <Button
                    type="default"
                    size="small"
                    style={{
                      borderColor: '#3E6A9F',
                      color: '#3E6A9F',
                      height: 26,
                      padding: '0 10px',
                    }}
                    onClick={() => navigate(`/saas-job-headhunting/${id}`)}
                  >
                    Create
                  </Button>
                );
              },
            },
          ]
        : []),
      // Hide Job Status column for Project Manager only
      ...(
        user?.user_type === 'project_manager'
          ? []
          : [
              {
                header: 'Status',
                id: 'status',
                accessorKey: 'status',
                sortUndefined: 'last',
                sortDescFirst: false,
                Cell: ({ row, cell }) => {
                  const isRestricted =
                    user?.user_type === 'recruitment_manager' ||
                    user?.user_type === 'recruitment_executive';

                  const canEdit = canEditJobStatus();

                  return isRestricted || !canEdit ? (
                    <span>{cell.getValue()}</span> // 👀 only text for restricted roles or when project is not Active
                  ) : (
                    <Select
                      key={`status-${row.original.id}`}
                      value={cell.getValue()}
                      style={{ width: 120 }}
                      options={statusOptions}
                      onChange={(value) =>
                        handleStatusChange(row.original.id, value)
                      }
                      loading={statusMutation.isLoading}
                      disabled={statusMutation.isLoading}
                    />
                  );
                },
              },
            ]
      ),



     {
      header: 'Posted On',
      id: 'posted_on',
      accessorKey: 'posted_on',
      sortUndefined: 'last',
      sortDescFirst: false,
      Cell: ({ cell }) => <span>{cell.getValue()}</span>,
    },

    // ✅ Show Edit column for all except project_manager
    ...(
      user?.user_type !== 'project_manager'
        ? [
            {
              header: 'Edit',
              accessorKey: 'id',
              enableSorting: false,
              size: 52,
              minSize: 44,
              maxSize: 68,
              Cell: ({ row }) => (
                <EditOutlined size="1em" className="app-icon"
                  style={{ cursor: 'pointer', color: '#1890ff', fontSize: '16px' }}
                  onClick={() => navigate(`/edit-job-headhunting/${row.original.id}`)}
                />
              ),
            },
          ]
        : []
    ),
    // PM Remarks — read-only for all non-PM users
    ...(user?.user_type !== 'project_manager'
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
  [
    navigate,
    user,
    selectedTab,
    statusOptions,
    handleStatusChange,
    canEditJobStatus,
    canEditRemarks,
    statusMutation.isLoading,
    setPmRemarksModalState,
  ]
);

    return (
        <>
            <BreadCrumb 
        goBack={goBack} 
        linkText={
          'Projects > Jobs'
        } 
      />
      
     
      
     <div className="container">
       {/* Project Detail Card */}
       <ProjectDetailCard 
         projectData={jobsData} 
         jobCounts={jobCounts} 
         currentUser={user}
         projectId={clientId}
       />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ width: '70%' }}>
          <StatusFilterTabs
            statusFilter={selectedTab}
            setStatusFilter={(value) => {
              setSelectedTab(value);
              setPagination({ pageIndex: 0, pageSize: 10 });
              
              // Update URL params
              const newParams = {};
              if (value && value !== 'Pending') {
                newParams.tab = value;
              }
              setSearchParams(newParams);
              
              // Refetch data for the new tab
              queryClient.invalidateQueries(['projectJobs', clientId, value]);
              queryClient.invalidateQueries(['projectJobCounts', clientId]);
            }}
            statusChoices={statusChoices}
            getTotalCount={getTotalCount}
            getStatusCount={getStatusCount}
            statusColors={statusColors}
            showAllTab={false}
          />
        </div>
        {/* Add New Job button - hide for recruitment executives and project managers */}
        {user?.user_type !== 'recruitment_executive' &&
          user?.user_type !== 'recruitment_manager' &&
          user?.user_type !== 'project_manager' && (
          <button
            className="custom-button"
            style={{ background: '#3E6A9F', color: '#fff' }}
            onClick={() => navigate(`/add-new-job-headhunting?projectId=${clientId}`)}
          >
            Add New Job
          </button>
        )}

      </div>

        {/* Jobs Table Section */}
        <div className="table-container">
          <Spin
            indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />}
            size="large"
            spinning={jobsLoading && !jobsData}
          >
                  <NewTableComponent
          columns={jobsColumns}
            data={jobsDataForTable}
              totalCount={jobsData?.count || 0}
            heading={`Jobs ${jobsData?.count ? `(${jobsData.count})` : ''}`}
            initialState={pagination}
            pagination={pagination}
            onPaginationChange={setPagination}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            enableRowSelection={false}
            globalFilter={globalFilter}
            onGlobalFilterChange={handleGlobalFilterChange}
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
          'No. of Resources': statusModal.job.number_of_vacancies
        } : null}
        onConfirm={handleStatusConfirm}
      />
      </Suspense>

      {/* Project Manager: remarks & follow-ups modals */}
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
      {(user?.user_type === 'recruitment_manager' || user?.user_type === 'recruitment_executive') && (
        <RemarksModal
          visible={remarksModal.visible}
          title={remarksModal.job ? `Job Remarks • ${remarksModal.job.job_title}` : 'Job Remarks'}
          remarks={remarksModal.remarks}
          error={remarksError}
          loading={remarksMutation.isLoading}
          canEdit={canEditRemarks(remarksModal.job)}
          onRemarksChange={(e) => {
            setRemarksModal((prev) => ({ ...prev, remarks: e.target.value }));
            if (remarksError) setRemarksError('');
          }}
          onSave={() => {
            if (!remarksModal.job) return;
            if (!canEditRemarks(remarksModal.job)) return;
            remarksMutation.mutate({
              jobId: remarksModal.job.id,
              remarks: remarksModal.remarks?.trim() || '',
            });
          }}
          onCancel={() => {
            setRemarksModal({ visible: false, job: null, remarks: '' });
            setRemarksError('');
          }}
          placeholder="Enter job remarks..."
          maxLength={1000}
          showCount={true}
        />
      )}
      {user?.user_type !== 'project_manager' && (
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
