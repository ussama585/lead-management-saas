import { message } from '../../components/ui/notifications.jsx';
import { Modal } from '../../components/ui/app-modal.jsx';
import { Select } from '../../components/ui/app-select.jsx';
import { Input } from '../../components/ui/app-controls.jsx';
import { Button } from '../../components/ui/app-controls.jsx';
import React, { useMemo, useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { List, Switch } from 'antd';
import { Pencil as EditOutlined } from 'lucide-react';
import BreadCrumb from '../../components/breadcrumb.component.jsx';
import NewTableComponent from '../../components/tables/new-table.jsx';
import { ConfirmationModal } from '../clients/components/LazyModals.jsx';
import StatusHistoryModal from '../../components/status-history-modal.jsx';
import ClientDetailCard from '../../components/client-detail-card.component.jsx';
import '../../assets/styles/legacy/client-listing-page.css';
import '../../assets/styles/legacy/project-page.css';
import '../../assets/styles/legacy/table-client-actions.css';
import '../../assets/styles/legacy/table-remarks-icon.css';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  getAssignedProjects,
  getAssignedProjectsCount,
  getAssignedProjectRecruiters,
  updateProjectStatus,
  getClientDetails,
  getAssignRecruiterList,
  getClientJobListByProject,
  getRecruitmentExecutiveStats,
  getProjectRemarksList,
  addProjectRemark,
  getProjectRemarkById,
  updateProjectRemarkById,
  updateProjectApprovalStatus,
  updateProjectApprovalStatusAdmin,
  updateProjectReviewedStatus,
  getProjectApprovalCounts,
} from '../shared/services/headhunting.js';
import { getProposalUrl } from '../shared/services/manager-service.js';
import { assignProjectToRecruitmentExecutive, getRecruiterAssigningList, assignRecruiterToProject } from '../shared/services/project-service.js';
import { getProjectStatusHistory } from '../shared/services/status-history.js';
import useUserStore from '../shared/store/user-store.js';
import { formatDateUniversal } from '../shared/utils/formatDate.js';
import { loadTableState } from '../shared/utils/persistTableState.js';
import HeadhuntingActivateProjectContent from '../../components/headhunting-activate-project-content.jsx';
import PmJobRemarksMatrixModal from '../../components/pm-job-remarks-matrix-modal.component.jsx';
import { useProjectDeleteMutation } from '../clients/hooks/useProjectMutations.js';
import StatusTabs from '../clients/components/StatusTabs.jsx';
import FilterTabRow from '../../components/filter-tab-row.component.jsx';
import ApprovalStatusTabs from '../../components/approval-status-tabs.component.jsx';
import ProjectApprovalDetailsModal from '../../components/project-approval-details-modal.jsx';
import { useProjectColumns } from '../clients/hooks/useProjectColumns.jsx';
import ResumeClearAllFiltersButton from '../resume/components/ResumeClearAllFiltersButton.jsx';

const { TextArea } = Input;

// Status colors (aligned with sales-manager meta/data leads tab styling)
const statusColors = {
  'All': '#8c8c8c',
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

export default function AssignedProjectsPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const userType = user?.user_type;
  const isReadOnly = userType === 'project_manager';
  const isRecruitmentUser =
    userType === 'recruitment_manager' ||
    userType === 'recruitment_executive' ||
    userType === 'project_manager';
  const showApprovalFilter = isRecruitmentUser || userType === 'admin';

  const [searchParams, setSearchParams] = useSearchParams();

  // Load initial state from sessionStorage or URL params
  const routeKey = userType === 'project_manager' ? 'project-manager-projects' : 'recruitment-projects';
  const initialState = loadTableState(routeKey, searchParams, {
    tab: 'Active',
    search: '',
    pageIndex: 0,
    pageSize: 10,
    sorting: [],
    selectedRecruiterId2: '',
    selectedExecId: null,
  });

  const clientIdFromParams = searchParams.get('client_id');
  const assignedToUser = searchParams.get('assigned_to_user') === 'true';

  // Initialize states with loaded values
  const [selectedTab, setSelectedTab] = useState(initialState.tab || 'Active');

  const [pagination, setPagination] = useState({
    pageIndex: initialState.pageIndex || 0,
    pageSize: initialState.pageSize || 10,
  });

  const [globalFilter, setGlobalFilter] = useState(initialState.search || '');

  const [sorting, setSorting] = useState(initialState.sorting || []);

  // Track if component is mounting to prevent resetting pagination from URL params
  const isInitialMount = useRef(true);

  // Prevent clearing search on component mount - handle MaterialReactTable edge cases
  const handleGlobalFilterChange = (value) => {
    setGlobalFilter(value === undefined || value === null ? '' : value);
  };

  const openDeletedProjectsList = useCallback(() => {
    navigate('/admin/deleted-projects');
  }, [navigate]);

  // Status change confirmation modal state
  const [statusModal, setStatusModal] = useState({
    visible: false,
    project: null,
    oldStatus: '',
    newStatus: '',
    recruiterId: undefined,
    hasRecruitmentManager: false,
  });

  // Jobs selection state for converting to Active
  const [jobsList, setJobsList] = useState([]);
  const [loadingJobsList, setLoadingJobsList] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState([]);
  const [jobSelectionError, setJobSelectionError] = useState('');
  const [jobDeadlines, setJobDeadlines] = useState({}); // { [jobId]: Date }
  const [projectSubmissionDeadline, setProjectSubmissionDeadline] = useState(null);

  // Project assignment state
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [selectedRecruiterId, setSelectedRecruiterId] = useState(undefined);
  const [assignmentModal, setAssignmentModal] = useState({ visible: false });
  const [recruiterList, setRecruiterList] = useState([]);

  // Recruiter change confirmation state for per-row dropdown
  const [recruiterChangeModal, setRecruiterChangeModal] = useState({
    visible: false,
    projectId: null,
    projectName: '',
    oldRecruiterName: '',
    newRecruiterId: null,
    newRecruiterName: '',
  });

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ visible: false, project: null });
  const [deleteReason, setDeleteReason] = useState('');
  const [projectRemarksModal, setProjectRemarksModal] = useState({
    visible: false,
    project: null,
  });
  const [newPmRemark, setNewPmRemark] = useState('');
  const [editingPmRemarkId, setEditingPmRemarkId] = useState(null);
  const [editingPmRemarkText, setEditingPmRemarkText] = useState('');
  // Status history modal (admin only)
  const [statusHistoryModal, setStatusHistoryModal] = useState({ visible: false, entity: null });

  // PM Job Remarks matrix modal
  const [pmJobRemarksMatrix, setPmJobRemarksMatrix] = useState({ visible: false, projectId: null });

  const setDeadlineForJob = (jobId, dateObj) => {
    setJobDeadlines(prev => ({ ...prev, [jobId]: dateObj || undefined }));
  };

  const formatDeadlineWithOffset = (dateObj) => {
    if (!dateObj) return '';
    const d = new Date(dateObj);
    const pad = (n, w = 2) => String(n).padStart(w, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    // Return date only (no time)
    return `${year}-${month}-${day}`;
  };

  const isJobDeadlineAfterProjectDeadline = (jobDeadline, projectDeadline) => {
    const job = formatDeadlineWithOffset(jobDeadline);
    const project = formatDeadlineWithOffset(projectDeadline);
    if (!job || !project) return false;
    // YYYY-MM-DD lexical comparison is safe for date ordering.
    return job > project;
  };

  // Approval status filter (for recruitment users only)
  const [selectedApprovalFilter, setSelectedApprovalFilter] = useState(() => {
    const fromUrl = searchParams.get('approval');
    if (fromUrl) return fromUrl;
    try {
      const stored = sessionStorage.getItem(`tableState_${routeKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const isExpired = Date.now() - parsed.timestamp > 60 * 60 * 1000;
        if (!isExpired && parsed.selectedApprovalFilter) {
          return parsed.selectedApprovalFilter;
        }
      }
    } catch (e) {
      // Ignore malformed sessionStorage state
    }
    return 'Approved';
  });

  // Selected project manager filter (for recruitment_manager view) — no UI sets this yet, always empty
  const selectedProjectManagerId = '';

  // Selected recruiter filter (cascades under selectedProjectManagerId)
  const [selectedRecruiterId2, setSelectedRecruiterId2] = useState(initialState.selectedRecruiterId2 ?? '');

  // Selected executive card (for recruitment_manager view)
  const [selectedExecId, setSelectedExecId] = useState(initialState.selectedExecId ?? null);

  // Sync all state to URL params
  useEffect(() => {
    const params = {};

    // Keep existing params
    if (clientIdFromParams) params.client_id = clientIdFromParams;
    if (assignedToUser) params.assigned_to_user = 'true';

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

    // Recruiter filter tab (project_manager only)
    if (selectedRecruiterId2) {
      params.recruiter = selectedRecruiterId2;
    }

    // Executive card click (recruitment_manager only)
    if (selectedExecId) {
      params.execId = String(selectedExecId);
    }

    // Approval status filter (recruitment users / admin only)
    if (selectedApprovalFilter && selectedApprovalFilter !== 'Approved') {
      params.approval = selectedApprovalFilter;
    }

    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, globalFilter, pagination.pageIndex, pagination.pageSize, sorting, selectedRecruiterId2, selectedExecId, selectedApprovalFilter]);

  // Save state to sessionStorage for persistence
  useEffect(() => {
    try {
      sessionStorage.setItem(
        `tableState_${routeKey}`,
        JSON.stringify({
          tab: selectedTab,
          search: globalFilter,
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          sorting: sorting,
          selectedRecruiterId2,
          selectedExecId,
          selectedApprovalFilter,
          timestamp: Date.now(),
        })
      );
    } catch (e) {
      console.warn('Failed to save table state to sessionStorage:', e);
    }
  }, [routeKey, selectedTab, globalFilter, pagination.pageIndex, pagination.pageSize, sorting, selectedRecruiterId2, selectedExecId, selectedApprovalFilter]);

  // Fetch client details
  const { data: clientData, isLoading: clientLoading } = useQuery(
    ['clientDetails', clientId],
    () => getClientDetails(clientId),
    {
      enabled: !!clientId,
      staleTime: 10 * 60 * 1000, // 10 minutes - client details rarely change
      cacheTime: 15 * 60 * 1000, // 15 minutes
      refetchOnWindowFocus: false,
    }
  );

  // selectedExecId (card click) and selectedRecruiterId2 (tab) are mutually exclusive recruiter filters
  const effectiveRecruiterId = selectedExecId ? String(selectedExecId) : selectedRecruiterId2;

  // Fetch project counts using the API
  const { data: projectCounts, isLoading: countsLoading } = useQuery(
    ['assignedProjectsCount', user?.id, selectedProjectManagerId, effectiveRecruiterId, selectedApprovalFilter],
    () => getAssignedProjectsCount('', selectedProjectManagerId, effectiveRecruiterId, selectedApprovalFilter === 'All' ? '' : selectedApprovalFilter),
    {
      enabled: !!user?.id,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  // Fetch approval status counts (Pending/Approved/Rejected) for the filter buttons
  const { data: approvalCounts } = useQuery(
    'projectApprovalCounts',
    getProjectApprovalCounts,
    {
      enabled: !!user?.id && showApprovalFilter,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  // Serialize sorting state for proper cache invalidation
  const sortField = sorting && sorting.length > 0 && sorting[0]?.id ? sorting[0].id : null;
  const sortDirection = sorting && sorting.length > 0 && sorting[0]?.desc !== undefined ? sorting[0].desc : null;

  // Custom handler to allow sorting to go to default state
  const handleSortingChange = (newSorting) => {
    // Allow clearing to empty array for default/unsorted state
    // This matches the behavior where clicking multiple times cycles: asc -> desc -> default
    setSorting(newSorting || []);
  };

  // Fetch projects data using the API
  // Update the useQuery for projects data
  const { data: projectsData, isLoading: projectsLoading } = useQuery(
    [
      'assignedProjects',
      user?.id,
      pagination.pageIndex,
      pagination.pageSize,
      sortField,
      sortDirection,
      globalFilter,
      selectedTab,
      selectedProjectManagerId,
      effectiveRecruiterId,
      selectedApprovalFilter,
    ],
    () => getAssignedProjects(
      pagination.pageIndex + 1,
      pagination.pageSize,
      sorting,
      globalFilter,
      (selectedApprovalFilter === 'Pending' || selectedApprovalFilter === 'Rejected') ? undefined : (selectedTab === 'All' ? undefined : selectedTab),
      selectedProjectManagerId,
      effectiveRecruiterId,
      selectedApprovalFilter === 'All' ? '' : selectedApprovalFilter,
    ),
    {
      enabled: !!user?.id,
      staleTime: 2 * 60 * 1000, // 2 minutes - reasonable for project data
      cacheTime: 10 * 60 * 1000, // 10 minutes cache
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch on mount unless stale
      keepPreviousData: true, // Keep previous data while loading new data
    }
  );

  // Track which project is currently being assigned a recruiter (for individual loading state)
  const [assigningRecruiterProjectId, setAssigningRecruiterProjectId] = useState(null);
  const { data: recruiterListData, isFetching: assigningRecruiter } = useQuery(
    'recruiterListForProjectClient',
    getAssignRecruiterList,
    {
      staleTime: 10 * 60 * 1000,
      cacheTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const recruiterOptions = useMemo(() => {
    if (!Array.isArray(recruiterListData)) return [];
    const base = recruiterListData.map(r => ({ label: r.name, value: Number(r.id) }));
    const includesSelf = base.some(opt => opt.value === Number(user?.id));
    return user?.user_type === 'recruitment_manager' && !includesSelf
      ? [...base, { label: `${user?.name || 'Me'} (You)`, value: Number(user?.id) }]
      : base;
  }, [recruiterListData, user?.id, user?.name, user?.user_type]);

  // Fetch recruiter assigning list for project assignment
  const { data: recruiterAssigningData, isLoading: recruiterAssigningLoading } = useQuery(
    'recruiterAssigningList',
    () => getRecruiterAssigningList(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes - recruiter list changes occasionally
      cacheTime: 15 * 60 * 1000, // 15 minutes cache
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't always refetch on mount
    }
  );

  // Update recruiterList when data changes
  useEffect(() => {
    if (recruiterAssigningData && Array.isArray(recruiterAssigningData)) {
      const base = recruiterAssigningData.map(r => ({ label: r.name, value: r.id }));
      const includesSelf = base.some(opt => opt.value === user?.id);
      const finalList =
        user?.user_type === 'recruitment_manager' && user?.id && !includesSelf
          ? [...base, { label: `${user?.name}`, value: user.id }]
          : base;
      setRecruiterList(finalList);
    }
  }, [recruiterAssigningData, user?.id, user?.name, user?.user_type]);

  // Recruitment executive stats for overview cards (manager view)
  const { data: executiveStatsData } = useQuery(
    'recruitmentExecutiveStats',
    getRecruitmentExecutiveStats,
    {
      enabled: userType === 'recruitment_manager' || userType === 'super_admin',
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  // Fetch recruiters under selected recruitment manager — project_manager and super_admin only
  const { data: projectRecruitersData } = useQuery(
    ['assignedProjectRecruiters', selectedProjectManagerId, userType, selectedApprovalFilter],
    () => getAssignedProjectRecruiters(selectedProjectManagerId, showApprovalFilter ? (selectedApprovalFilter === 'All' ? '' : selectedApprovalFilter) : ''),
    {
      enabled: !!user?.id && (userType === 'project_manager' || userType === 'super_admin'),
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    }
  );

  const projectRecruitersList = useMemo(() => {
    if (Array.isArray(projectRecruitersData)) return projectRecruitersData;
    if (Array.isArray(projectRecruitersData?.results)) return projectRecruitersData.results;
    if (Array.isArray(projectRecruitersData?.data)) return projectRecruitersData.data;
    return [];
  }, [projectRecruitersData]);

  // Reset pagination when filters change (but not on initial mount to preserve URL params)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [globalFilter, selectedTab, selectedProjectManagerId, selectedRecruiterId2, selectedExecId, selectedApprovalFilter]);

  // Clear bulk project selection when leaving the Approved approval tab
  useEffect(() => {
    if (showApprovalFilter && selectedApprovalFilter !== 'Approved') {
      setSelectedProjectIds([]);
    }
  }, [showApprovalFilter, selectedApprovalFilter]);

  // Clear recruiter filter (tab + executive card) when the approval tab changes, so a stale
  // recruiter selection from a previous approval tab doesn't leak into the new tab's request
  const prevApprovalFilterRef = useRef(selectedApprovalFilter);
  useEffect(() => {
    if (prevApprovalFilterRef.current !== selectedApprovalFilter) {
      prevApprovalFilterRef.current = selectedApprovalFilter;
      setSelectedRecruiterId2('');
      setSelectedExecId(null);
    }
  }, [selectedApprovalFilter]);

  // Status change mutation
  const statusMutation = useMutation(
    async ({ id, value, selected_jobs, recruiter_id }) => {
      const payload = { status: value };

      // Include selected jobs if provided
      if (selected_jobs) {
        payload.selected_jobs = selected_jobs;
      }

      // Include recruiter if provided
      if (recruiter_id) {
        payload.recruiter_id = recruiter_id;
      }

      const response = await updateProjectStatus(id, payload);

      return response;
    },
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Project status updated successfully');
        setStatusModal({ visible: false, project: null, oldStatus: '', newStatus: '' });
        // Store current sorting state
        const currentSorting = [...sorting];
        // Invalidate only the affected queries
        queryClient.invalidateQueries(['assignedProjects']);
        queryClient.invalidateQueries(['assignedProjectsCount']);
        // Reapply sorting after a brief delay to ensure data is refreshed
        setTimeout(() => {
          if (currentSorting && currentSorting.length > 0) {
            setSorting(currentSorting);
          }
        }, 100);
        // Don't manually refetch - invalidation will trigger automatic refetch
      },
      onError: (error) => {

        message.error(error?.message || 'Failed to update project status');
      },
    }
  );

  // Approval status mutation
  const [rejectionModal, setRejectionModal] = useState({ visible: false, projectId: null, field: null, row: null, reason: '' });
  const [approvalModal, setApprovalModal] = useState({ visible: false, projectId: null, field: null, row: null });

  const approvalMutation = useMutation(
    ({ id, approvalStatus, reason, field, row }) => {
      if (userType === 'super_admin' && field) {
        const payload = {
          recruitment_manager_approval: field === 'recruitment_manager' ? approvalStatus : (row?.recruitment_manager_approval ?? 'Pending'),
          recruitment_manager_reason: field === 'recruitment_manager'
            ? (approvalStatus === 'Rejected' ? (reason || '') : '')
            : (row?.recruitment_manager_reason || ''),
          recruiter_approval: field === 'recruiter' ? approvalStatus : (row?.recruiter_approval ?? 'Pending'),
          recruiter_reason: field === 'recruiter'
            ? (approvalStatus === 'Rejected' ? (reason || '') : '')
            : (row?.recruiter_reason || ''),
        };
        return updateProjectApprovalStatusAdmin(id, payload);
      }
      return updateProjectApprovalStatus(id, approvalStatus, reason, field);
    },
    {
      onSuccess: () => {
        message.success('Approval status updated');
        setRejectionModal({ visible: false, projectId: null, field: null, row: null, reason: '' });
        queryClient.invalidateQueries(['assignedProjects']);
        queryClient.invalidateQueries(['assignedProjectsCount']);
        queryClient.invalidateQueries('projectApprovalCounts');
      },
      onError: (err) => message.error(err?.message || 'Failed to update approval status'),
    }
  );

  // Project assignment mutation
  const assignmentMutation = useMutation(
    ({ projectIds, recruiterId }) => {
      return assignProjectToRecruitmentExecutive(projectIds.join(','), recruiterId);
    },
    {
      onSuccess: (response) => {
        // Remove ID from message if present
        let successMessage = response?.message || 'Projects assigned successfully';
        successMessage = successMessage.replace(/\s*\(ID:\s*\d+\)/gi, '');
        message.success(successMessage);
        setAssignmentModal({ visible: false });
        setSelectedProjectIds([]);
        setSelectedRecruiterId(undefined);
        // Store current sorting state
        const currentSorting = [...sorting];
        // Invalidate only the necessary queries
        queryClient.invalidateQueries(['assignedProjects']);
        queryClient.invalidateQueries(['assignedProjectsCount']);
        // Reapply sorting after a brief delay to ensure data is refreshed
        setTimeout(() => {
          if (currentSorting && currentSorting.length > 0) {
            setSorting(currentSorting);
          }
        }, 100);
        // Don't manually refetch - invalidation will trigger automatic refetch
      },
      onError: (error) => {
        message.error(error?.response?.data?.message || error?.message || 'Failed to assign projects');
      },
    }
  );

  // Recruiter assignment mutation for individual projects
  const recruiterAssignmentMutation = useMutation(
    async ({ projectId, recruiterId }) => {
      const response = await assignRecruiterToProject(projectId, recruiterId);
      return response;
    },
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Recruiter assigned successfully');
        setAssigningRecruiterProjectId(null); // Clear loading state
        // Store current sorting state
        const currentSorting = [...sorting];
        // Invalidate all related queries to refresh data
        queryClient.invalidateQueries(['assignedProjects']);
        queryClient.invalidateQueries(['assignedProjectsCount']);
        queryClient.invalidateQueries(['clientDetails']);
        queryClient.invalidateQueries('recruiterListForProjectClient');
        queryClient.invalidateQueries('recruiterAssigningList');
        queryClient.invalidateQueries('recruitmentExecutiveStats');
        // Reapply sorting after a brief delay to ensure data is refreshed
        setTimeout(() => {
          if (currentSorting && currentSorting.length > 0) {
            setSorting(currentSorting);
          }
        }, 100);
      },
      onError: (error) => {
        setAssigningRecruiterProjectId(null); // Clear loading state on error
        message.error(error?.response?.data?.message || error?.message || 'Failed to assign recruiter');
      },
    }
  );

  // Review (is_reviewed) toggle mutation
  const reviewedToggleMutation = useMutation(
    ({ projectId, isReviewed }) => updateProjectReviewedStatus(projectId, isReviewed),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['assignedProjects']);
      },
      onError: (error) => {
        message.error(error?.response?.data?.message || error?.message || 'Failed to update preview status');
      },
    }
  );

  const { data: projectRemarksData, isLoading: projectRemarksLoading, isFetching: projectRemarksFetching } = useQuery(
    ['projectPmRemarks', projectRemarksModal.project?.id],
    () => getProjectRemarksList(projectRemarksModal.project?.id),
    {
      enabled: projectRemarksModal.visible && !!projectRemarksModal.project?.id,
      refetchOnWindowFocus: false,
    }
  );

  const projectRemarks = useMemo(
    () => (Array.isArray(projectRemarksData?.results) ? projectRemarksData.results : []),
    [projectRemarksData]
  );

  const invalidateProjectRemarks = useCallback(() => {
    const projectId = projectRemarksModal.project?.id;
    if (!projectId) return;
    queryClient.invalidateQueries(['projectPmRemarks', projectId]);
    queryClient.invalidateQueries(['assignedProjects']);
    queryClient.invalidateQueries(['assignedProjectsCount']);
  }, [projectRemarksModal.project?.id, queryClient]);

  const addProjectRemarkMutation = useMutation(
    ({ projectId, remarks }) => addProjectRemark(projectId, remarks),
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Remark added successfully');
        invalidateProjectRemarks();
        setNewPmRemark('');
      },
      onError: (error) => {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to add remark';
        message.error(errorMessage);
      },
    }
  );

  const updateProjectRemarkMutation = useMutation(
    ({ remarkId, remarks }) => updateProjectRemarkById(remarkId, remarks),
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Remark updated successfully');
        invalidateProjectRemarks();
        setEditingPmRemarkId(null);
        setEditingPmRemarkText('');
      },
      onError: (error) => {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update remark';
        message.error(errorMessage);
      },
    }
  );

  // Handler for recruiter assignment - now opens confirmation modal
  const handleRecruiterChange = (project, recruiterId, recruiterName) => {
    const currentRecruiterName = project.recruiter_name || 'Unassigned';
    setRecruiterChangeModal({
      visible: true,
      projectId: project.id,
      projectName: project.project_name || 'Project',
      oldRecruiterName: currentRecruiterName,
      newRecruiterId: recruiterId,
      newRecruiterName: recruiterName,
    });
  };

  const confirmRecruiterChange = () => {
    if (!recruiterChangeModal.projectId || !recruiterChangeModal.newRecruiterId) {
      setRecruiterChangeModal((prev) => ({ ...prev, visible: false }));
      return;
    }
    setAssigningRecruiterProjectId(recruiterChangeModal.projectId);
    recruiterAssignmentMutation.mutate(
      {
        projectId: recruiterChangeModal.projectId,
        recruiterId: recruiterChangeModal.newRecruiterId,
      },
      {
        onSettled: () => {
          setRecruiterChangeModal((prev) => ({ ...prev, visible: false }));
        },
      }
    );
  };

  // Project delete mutation
  const deleteMutation = useProjectDeleteMutation(null, () => {
    setDeleteModal({ visible: false, project: null });
    setDeleteReason('');
    queryClient.invalidateQueries(['assignedProjects']);
    queryClient.invalidateQueries(['assignedProjectsCount']);
  });

  const handleDeleteProject = (project) => {
    setDeleteModal({ visible: true, project });
  };

  // Use real projects data from API
  const projects = useMemo(() => projectsData?.results || [], [projectsData]);
  const clientName = projectsData?.client_name || clientData?.company_name || 'Client';
  const clientStatus = projectsData?.client_status || clientData?.status || 'Unknown';

  // Status options for dropdown
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

  // Tabs definition with real counts from API (keys align with count APIs where applicable)
  const statusTabs = useMemo(
    () => [
      { label: 'All', value: 'All', key: 'all', count: projectCounts?.total_count || 0 },
      { label: 'Pending', value: 'Pending', key: 'pending', count: projectCounts?.pending || 0 },
      { label: 'Active', value: 'Active', key: 'active', count: projectCounts?.active || 0 },
      { label: 'Delayed', value: 'Delayed', key: 'delayed', count: projectCounts?.delayed || 0 },
      { label: 'Completed', value: 'Completed', key: 'completed', count: projectCounts?.completed || 0 },
      {
        label: 'Completed - Payment Pending',
        value: 'Completed - Payment Pending',
        key: 'completed_payment_pending',
        count: projectCounts?.completed_payment_pending || 0,
      },
      {
        label: 'Completed - Defaulter',
        value: 'Completed - Defaulter',
        key: 'completed_defaulter',
        count: projectCounts?.completed_defaulter || 0,
      },
      {
        label: 'Terminated By Client',
        value: 'Terminated By Client',
        key: 'terminated_by_client',
        count: projectCounts?.terminated_by_client || 0,
      },
      {
        label: 'Terminated By Client + Refunded',
        value: 'Terminated By Client + Refunded',
        key: 'terminated_by_client_refunded',
        count: projectCounts?.terminated_by_client_refunded || 0,
      },
      {
        label: 'Terminated By Search O Pal',
        value: 'Terminated By Search O Pal',
        key: 'terminated_by_search_o_pal',
        count: projectCounts?.terminated_by_search_o_pal || 0,
      },
      {
        label: 'Terminated By Search O Pal + Refunded',
        value: 'Terminated By Search O Pal + Refunded',
        key: 'terminated_by_search_o_pal_refunded',
        count: projectCounts?.terminated_by_search_o_pal_refunded || 0,
      },
    ],
    [projectCounts]
  );
  // Filter projects by selected tab - no need to filter since API returns filtered data
  const filteredProjects = projects;

  // Transform data for table
  const transformedProjectsData = useMemo(
    () =>
      filteredProjects.map((project, idx) => ({
        ...project,
        created_at: project.created_at ? formatDateUniversal(project.created_at) : '-',
        contract_price: project.contract_price?.toLocaleString() ?? '-',
        index: idx + 1 + pagination.pageIndex * pagination.pageSize,
      })),
    [filteredProjects, pagination.pageIndex, pagination.pageSize]
  );



  // Check if user can edit a project
  const canEditProject = useCallback((project) => {
    // Super Admin can edit any project
    if (userType === 'super_admin') {
      return true;
    }

    // Sales manager can edit any project regardless of client status
    if (userType === 'sales_manager') {
      return true;
    }

    // For other non-admin users, check if client status is "Active"
    if (clientStatus !== 'Active') {
      return false;
    }

    // Other users can only edit if the client is assigned to them
    if (assignedToUser) {
      return true;
    }

    return false;


  }, [userType, clientStatus, assignedToUser]);

  // Handler to update project status
  const handleStatusChange = useCallback((projectId, newStatus) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      if (newStatus === 'Active' && Number(project.job_count) === 0) {
        message.error('Cannot be activated. This project has no jobs.');
        return;
      }

      // Check if user can edit this project
      if (!canEditProject(project)) {
        if (clientStatus !== 'Active' && userType !== 'admin' && userType !== 'sales_manager') {
          message.warning('Cannot update project status: Client is not Active');
        } else {
          message.warning('You do not have permission to edit this project');
        }
        return;
      }

      const hasRecruitmentManager =
        project.recruitment_manager !== null && project.recruitment_manager !== undefined;

      setStatusModal({
        visible: true,
        project,
        oldStatus: project.status || 'No Status',
        newStatus: newStatus,
        recruiterId: undefined,
        hasRecruitmentManager,
      });

      // Only fetch jobs when first-time activation (no recruitment manager yet)
      if (newStatus === 'Active' && !hasRecruitmentManager) {
        setJobsList([]);
        setSelectedJobIds([]);
        setJobSelectionError('');
        setJobDeadlines({});
        setProjectSubmissionDeadline(null);
        setLoadingJobsList(true);
        getClientJobListByProject(project.id)
          .then((jobs) => {
            const list = Array.isArray(jobs) ? jobs : [];
            const mapped = list
              .filter(j => j && j.id && j.job_title)
              .map(j => ({ id: j.id, job_title: j.job_title, number_of_vacancies: j.number_of_vacancies }));
            setJobsList(mapped);
            // Auto-select all jobs
            setSelectedJobIds(mapped.map(j => j.id));
          })
          .catch(() => setJobsList([]))
          .finally(() => setLoadingJobsList(false));
      }
    }
  }, [projects, canEditProject, clientStatus, userType]);

  const handleStatusConfirm = async () => {
    // Only validate job/recruiter for first-time activation (no recruitment manager yet)
    if (statusModal.newStatus === 'Active' && !statusModal.hasRecruitmentManager) {
      if (!projectSubmissionDeadline) {
        message.error('Please select project submission deadline');
        return;
      }

      if (!statusModal.recruiterId) {
        message.error('Please select a recruiter');
        return;
      }

      if (!jobsList || jobsList.length === 0) {
        setJobSelectionError('No jobs available for this project');
        return;
      }

      const allJobIds = jobsList.map(job => job.id);
      const allJobsSelected = allJobIds.every(id => selectedJobIds.includes(id));
      if (!allJobsSelected) {
        setJobSelectionError('Please select all jobs');
        return;
      }

      const missingDeadline = selectedJobIds.some(id => !jobDeadlines[id]);
      if (missingDeadline) {
        setJobSelectionError('Please add submission deadline for all selected jobs');
        return;
      }

      const missingCVs = selectedJobIds.some(id => !jobDeadlines[`${id}_cvs`]);
      if (missingCVs) {
        setJobSelectionError('Please select CVs to be provided for all selected jobs');
        return;
      }

      const hasInvalidDeadlineOrder = selectedJobIds.some((id) =>
        isJobDeadlineAfterProjectDeadline(jobDeadlines[id], projectSubmissionDeadline)
      );
      if (hasInvalidDeadlineOrder) {
        setJobSelectionError('CV submission deadline must be on or before project submission deadline for all selected jobs');
        message.error('CV submission deadline must be before or equal to project submission deadline');
        return;
      }
    }

    const payload = {
      id: statusModal.project.id,
      value: statusModal.newStatus,
    };

    if (statusModal.newStatus === 'Active' && !statusModal.hasRecruitmentManager) {
      const selectedJobs = selectedJobIds.map(id => ({
        id,
        cv_submission_deadline: formatDeadlineWithOffset(jobDeadlines[id]),
        cvs_to_be_provided: jobDeadlines[`${id}_cvs`],
      }));
      payload.selected_jobs = selectedJobs;
      payload.recruiter_id = statusModal.recruiterId;
      payload.project_completion_deadline = formatDeadlineWithOffset(projectSubmissionDeadline);
    }

    statusMutation.mutate(payload);
  };

  // Handler for proposal download/view
  const handleProposalClick = async (proposalFileName) => {
    if (!proposalFileName) {
      message.warning('No proposal available');
      return;
    }
    try {
      const proposalUrl = await getProposalUrl(proposalFileName);
      if (proposalUrl) {
        window.open(proposalUrl, '_blank', 'noopener,noreferrer');
      } else {
        message.error('Failed to load proposal');
      }
    } catch (error) {
      message.error('Failed to open proposal');
    }
  };

  // Handler for project selection
  const handleProjectSelect = useCallback((projectId, checked) => {
    if (checked) {
      setSelectedProjectIds(prev => [...prev, projectId]);
    } else {
      setSelectedProjectIds(prev => prev.filter(id => id !== projectId));
    }
  }, []);

  // Handler for select all projects
  // Handler for assignment confirmation
  const handleAssignmentConfirm = () => {
    if (selectedProjectIds.length === 0) {
      message.error('Please select at least one project');
      return;
    }
    if (!selectedRecruiterId) {
      message.error('Please select a recruitment executive');
      return;
    }
    assignmentMutation.mutate({ projectIds: selectedProjectIds, recruiterId: selectedRecruiterId });
  };

  const getFilteredStatusOptions = useCallback((currentStatus, userTypeArg) => {
    // If current status is not "Pending" and user is not admin, exclude "Pending" from options
    if (currentStatus !== 'Pending' && userTypeArg !== 'admin') {
      return statusOptions.filter(option => option.value !== 'Pending');
    }
    // Otherwise, return all status options
    return statusOptions;
  }, [statusOptions]);

  const projectsColumns = useProjectColumns({
    navigate,
    userType,
    user,
    statusColors,
    selectedProjectIds,
    handleProjectSelect,
    recruiterList,
    assigningRecruiterProjectId,
    recruiterAssignmentMutation,
    isRecruitmentUser,
    showApprovalFilter,
    isReadOnly,
    canEditProject,
    handleStatusChange,
    getFilteredStatusOptions,
    handleDeleteProject,
    setPmJobRemarksMatrix,
    approvalMutation,
    selectedApprovalFilter,
    handleRecruiterChange,
    setProjectRemarksModal,
    setNewPmRemark,
    setEditingPmRemarkId,
    setEditingPmRemarkText,
    handleProposalClick,
    setStatusHistoryModal,
    setRejectionModal,
    setApprovalModal,
    reviewedToggleMutation,
  });


  return (
    <>
      <BreadCrumb

        linkText={
          'Projects'
        }
      />

      <div className="listing-page-content">
        {/* Client Detail Card */}
        <ClientDetailCard clientId={clientId} clientData={clientData} />

        {showApprovalFilter && (
          <ApprovalStatusTabs
            activeValue={selectedApprovalFilter}
            counts={approvalCounts}
            onChange={(val) => { setSelectedApprovalFilter(val); setPagination({ pageIndex: 0, pageSize: 10 }); }}
          />
        )}

        {/* Executive summary cards - only for recruitment_manager, using stats API, and only on the Approved tab */}
        {(userType === 'recruitment_manager' || userType === 'super_admin') && selectedApprovalFilter === 'Approved' && Array.isArray(executiveStatsData) && executiveStatsData.length > 0 && (
          <div className="listing-exec-overview">
            <div className="listing-exec-overview__title">Executive Overview</div>
            <div className="listing-exec-overview__grid">
              {executiveStatsData.map((exec) => {
                const isSelected = selectedExecId === exec.id;
                const clients =
                  exec.client_count ??
                  exec.clients ??
                  exec.total_clients ??
                  0;
                const projects =
                  exec.project_count ??
                  exec.projects ??
                  exec.total_projects ??
                  0;
                const jobs =
                  exec.job_count ??
                  exec.jobs ??
                  exec.total_jobs ??
                  0;
                const resources =
                  exec.resources ??
                  exec.resources_required ??
                  exec.total_resources ??
                  0;

                return (
                  <button
                    key={exec.id}
                    type="button"
                    className={`listing-exec-card${isSelected ? ' listing-exec-card--selected' : ''}`}
                    onClick={() =>
                      setSelectedExecId((prev) => (prev === exec.id ? null : exec.id))
                    }
                  >
                    <div className="listing-exec-card__title">
                      {exec.name || exec.label || 'Executive'}
                    </div>
                    <div className="listing-exec-card__meta">
                      <span>Clients: <strong>{clients}</strong></span>
                      <span>Projects: <strong>{projects}</strong></span>
                      <span>Jobs: <strong>{jobs}</strong></span>
                      <span>Resources: <strong>{resources}</strong></span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Recruiter filter tabs - hidden for admin (layer-1 exec cards only) */}
        {userType === 'project_manager' && (
          <FilterTabRow
            items={projectRecruitersList}
            selectedId={selectedRecruiterId2}
            onSelect={(id) => {
              setSelectedRecruiterId2(id);
              setPagination({ pageIndex: 0, pageSize: 10 });
            }}
            style={{ marginBottom: 12 }}
          />
        )}

        {userType === 'super_admin' && selectedExecId && (
          <div style={{ marginBottom: 12 }}>
            <ResumeClearAllFiltersButton
              onClick={() => {
                setSelectedExecId(null);
                setPagination({ pageIndex: 0, pageSize: 10 });
              }}
            />
          </div>
        )}

        <div className="listing-toolbar-flex" style={{ display: showApprovalFilter && selectedApprovalFilter !== 'All' && selectedApprovalFilter !== 'Approved' ? 'none' : undefined }}>
          <StatusTabs
            tabs={statusTabs}
            activeTab={selectedTab}
            statusColors={statusColors}
            loading={countsLoading}
            onTabChange={(value) => {
              setSelectedTab(value);
              setPagination({ pageIndex: 0, pageSize: 10 });
              const params = Object.fromEntries(searchParams);
              if (value !== 'Pending') {
                params.tab = value;
              } else {
                delete params.tab;
              }
              setSearchParams(params);
            }}
          />
        </div>
        {userType === 'super_admin' && (
          <div className="listing-action-bar-end">
            <button
              type="button"
              onClick={openDeletedProjectsList}
              className="listing-btn-warn"
            >
              Deleted Projects
            </button>
          </div>
        )}

        {/* Assignment Controls - Only show if projects are selected and user is recruitment manager */}
        {selectedProjectIds.length > 0 && userType === 'recruitment_manager' && (
          <div className="pp-assignment-panel">
            <div className="pp-assignment-panel__row">
              <span className="pp-assignment-panel__label">
                {selectedProjectIds.length} project(s) selected:

              </span>

              <Select
                className="pp-select-assign-exec"
                placeholder="Select Recruitment Executive"
                value={selectedRecruiterId}
                onChange={(value) => {
                  setSelectedRecruiterId(value);
                  if (value) {
                    setAssignmentModal({ visible: true });
                  }
                }}
                loading={recruiterAssigningLoading}
                showSearch
                optionFilterProp="children"
                allowClear
                onClear={() => setSelectedProjectIds([])}
              >
                {recruiterList.map(recruiter => (
                  <Select.Option key={recruiter.value} value={recruiter.value}>
                    {recruiter.label}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </div>
        )}
        <div className="table-container">
          <NewTableComponent
            columns={projectsColumns}
            data={transformedProjectsData}
            totalCount={projectsData?.count || 0}
            heading={`Projects(${projectsData?.count || 0})`}
            initialState
            pagination={pagination}
            onPaginationChange={setPagination}
            onPageSizeChange
            sorting={sorting}
            onSortingChange={handleSortingChange}
            enableRowSelection={false}
            globalFilter={globalFilter}
            onGlobalFilterChange={handleGlobalFilterChange}
            isLoading={projectsLoading || countsLoading || clientLoading}
          />
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
          details={statusModal.project ? {
            'Company Name': clientName,
            'Project Name': statusModal.project.project_name,
            'Project ID': `#${statusModal.project.id}`,
            'Current Status': statusModal.oldStatus,
            'New Status': statusModal.newStatus,
            'Job Count': statusModal.project.job_count || 0,
            'Recruitment Manager': statusModal.project.recruitment_manager_name || '-',
            'Current Recruiter': statusModal.project.recruiter_name || 'Not Assigned',
            'Contract Currency': statusModal.project.contract_currency || '-',
            'Contract Price': statusModal.project.contract_price
              ? `${Number(statusModal.project.contract_price).toLocaleString()} ${statusModal.project.contract_currency || 'PKR'}`
              : '-',
            'Project Creation': statusModal.project.created_at ? formatDateUniversal(statusModal.project.created_at) : '-',
            'Last Modified': statusModal.project.updated_at ? formatDateUniversal(statusModal.project.updated_at) : '-',
            'Status Change': `From "${statusModal.oldStatus}" to "${statusModal.newStatus}"`,
            ...(statusModal.newStatus === 'Active' && !statusModal.hasRecruitmentManager ? {
              'Select Jobs / Assign Recruiter': (
                <HeadhuntingActivateProjectContent
                  jobsList={jobsList}
                  loadingJobsList={loadingJobsList}
                  selectedJobIds={selectedJobIds}
                  jobDeadlines={jobDeadlines}
                  jobSelectionError={jobSelectionError}
                  onToggleJob={(jobId, checked) => {
                    setJobSelectionError('');
                    if (checked) {
                      setSelectedJobIds(prev => [...prev, jobId]);
                    } else {
                      setSelectedJobIds(prev => prev.filter(id => id !== jobId));
                      setDeadlineForJob(jobId, undefined);
                    }
                  }}
                  onDeadlineChange={(jobId, date) => setDeadlineForJob(jobId, date)}
                  onCvsChange={(jobId, value) =>
                    setJobDeadlines(prev => ({ ...prev, [`${jobId}_cvs`]: value }))
                  }
                  recruiterOptions={recruiterOptions}
                  assigningRecruiter={assigningRecruiter}
                  recruiterId={statusModal.recruiterId}
                  onRecruiterChange={value => setStatusModal(prev => ({ ...prev, recruiterId: value }))}
                  projectSubmissionDeadline={projectSubmissionDeadline}
                  onProjectSubmissionDeadlineChange={date => setProjectSubmissionDeadline(date)}
                />
              ),
            } : {})
          } : null}
          onConfirm={handleStatusConfirm}
        />
      </Suspense>

      {/* Assignment Confirmation Modal */}
      <Suspense fallback={null}>
        <ConfirmationModal
          showModal={assignmentModal.visible}
          setShowModal={(visible) => setAssignmentModal({ visible })}
          mutation={assignmentMutation}
          oldStatus=""
          newStatus=""
          details={{
            'Assignment Type': 'Project Assignment',
            'Selected Projects Count': selectedProjectIds.length,
            'Recruitment Executive': recruiterList.find(r => r.value === selectedRecruiterId)?.label || '-',
            'Client Name': clientName || '-',
            'Client Status': clientStatus || '-',
            'Selected Projects': (
              <div className="pp-assign-scroll-wrap">
                <div className="pp-assign-scroll-box">
                  {selectedProjectIds.map(projectId => {
                    const project = filteredProjects.find(p => p.id === projectId);
                    return project ? (
                      <div key={projectId} className="pp-assign-item">
                        <div className="pp-assign-item__title">
                          {project.project_name}
                        </div>
                        <div className="pp-assign-item__meta">
                          ID: #{project.id} | Jobs: {project.job_count || 0} | Status: {project.status}
                        </div>
                        {project.contract_price && (
                          <div className="pp-assign-item__meta">
                            Contract: {Number(project.contract_price).toLocaleString()} {project.contract_currency || 'PKR'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div key={projectId} className="pp-assign-item-fallback">
                        Project ID: #{projectId} (Details not available)
                      </div>
                    );
                  })}
                </div>
              </div>
            ),
            'Assignment Summary': `Assigning ${selectedProjectIds.length} project(s) to the selected recruitment executive. This will transfer responsibility for project management and job assignments.`,
            'Previous Assignee': filteredProjects[0]?.recruitment_manager_name || '-',
            'Total Jobs Across Selected Projects': selectedProjectIds.reduce((total, projectId) => {
              const project = filteredProjects.find(p => p.id === projectId);
              return total + (project?.job_count || 0);
            }, 0)
          }}
          onConfirm={handleAssignmentConfirm}
          title="Assign Projects"
          description="Are you sure you want to assign the selected projects to the recruitment executive?"
        />
      </Suspense>

      <Modal
        centered
        title={projectRemarksModal.project ? `PM Remarks • ${projectRemarksModal.project.project_name}` : 'PM Remarks'}
        open={projectRemarksModal.visible}
        onCancel={() => {
          setProjectRemarksModal({ visible: false, project: null });
          setNewPmRemark('');
          setEditingPmRemarkId(null);
          setEditingPmRemarkText('');
        }}
        confirmLoading={
          addProjectRemarkMutation.isLoading ||
          updateProjectRemarkMutation.isLoading
        }
        footer={null}
        width={600}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {userType === 'project_manager' && (
          <div className="pp-form-block">
            <label className="pp-label-block" htmlFor="pp-new-remark">
              Add New Remark
            </label>
            <TextArea
              id="pp-new-remark"
              rows={3}
              value={newPmRemark}
              onChange={(e) => setNewPmRemark(e.target.value)}
              placeholder="Type a new remark for this project"
              maxLength={500}
              className="sop-brand-textarea"
            />
            <div style={{ marginTop: 4, textAlign: 'right', fontSize: 12 }} className="sop-brand-text">
              {newPmRemark.length} / 500
            </div>
            <div className="pp-modal-actions">
              <Button
                type="primary"
                onClick={() => {
                  if (!newPmRemark.trim()) {
                    message.warning('Please enter a remark');
                    return;
                  }
                  if (!projectRemarksModal.project?.id) return;
                  addProjectRemarkMutation.mutate({
                    projectId: projectRemarksModal.project.id,
                    remarks: newPmRemark.trim(),
                  });
                }}
                loading={addProjectRemarkMutation.isLoading}
                className="sop-brand-primary"
              >
                Add Remark
              </Button>
            </div>
          </div>
        )}

        <div className="pp-section-heading">
          Existing Remarks {projectRemarksLoading || projectRemarksFetching ? '(Loading...)' : ''}
        </div>
        <div className="pp-remarks-list-scroll">
          <List
            bordered
            locale={{ emptyText: 'No PM remarks available' }}
            dataSource={projectRemarks}
            renderItem={(item) => (
              <List.Item
                actions={[
                  userType === 'project_manager' ? (
                    editingPmRemarkId === item.id ? (
                      <Button
                        key="save"
                        type="link"
                        className="sop-brand-link"
                        onClick={() => {
                          if (!editingPmRemarkText.trim()) {
                            message.warning('Remark cannot be empty');
                            return;
                          }
                          updateProjectRemarkMutation.mutate({
                            remarkId: item.id,
                            remarks: editingPmRemarkText.trim(),
                          });
                        }}
                        loading={updateProjectRemarkMutation.isLoading}
                      >
                        Save
                      </Button>
                    ) : (
                      <Button
                        key="edit"
                        type="link"
                        className="sop-brand-link"
                        icon={<EditOutlined size="1em" className="app-icon" />}
                        onClick={async () => {
                          try {
                            const latest = await getProjectRemarkById(item.id);
                            setEditingPmRemarkId(item.id);
                            setEditingPmRemarkText(
                              latest?.project_manager_remarks ?? item?.project_manager_remarks ?? ''
                            );
                          } catch (_err) {
                            setEditingPmRemarkId(item.id);
                            setEditingPmRemarkText(item?.project_manager_remarks ?? '');
                          }
                        }}
                      >
                        Edit
                      </Button>
                    )
                  ) : null,
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  title={
                    <div>
                      <span className="pp-remark-title-strong">
                        {formatDateUniversal(item?.created_at) || '—'}
                      </span>
                      <span className="pp-remark-meta">
                        ID: {item?.id ?? '—'}
                      </span>
                      {item?.updated_at && item.updated_at !== item.created_at && (
                        <span className="pp-remark-meta">
                          (Edited: {formatDateUniversal(item.updated_at)})
                        </span>
                      )}
                    </div>
                  }
                  description={
                    editingPmRemarkId === item.id && userType === 'project_manager' ? (
                      <TextArea
                        rows={2}
                        value={editingPmRemarkText}
                        onChange={(e) => setEditingPmRemarkText(e.target.value)}
                        maxLength={500}
                        showCount
                      />
                    ) : (
                      <span className="pp-pre-wrap">{item?.project_manager_remarks || ''}</span>
                    )
                  }
                />
              </List.Item>
            )}
          />
        </div>

        <div className="pp-modal-footer-actions">
          <Button
            onClick={() => {
              setProjectRemarksModal({ visible: false, project: null });
              setNewPmRemark('');
              setEditingPmRemarkId(null);
              setEditingPmRemarkText('');
            }}
          >
            Close
          </Button>
        </div>
      </Modal>

      <Suspense fallback={null}>
        <ConfirmationModal
          showModal={deleteModal.visible}
          setShowModal={(visible) => {
            setDeleteModal(prev => ({ ...prev, visible }));
            if (!visible) setDeleteReason('');

          }}
          mutation={deleteMutation}
          onConfirm={() => deleteMutation.mutate({ id: deleteModal.project?.id, reason: deleteReason })}
          showReasonField={true}
          reason={deleteReason}
          setReason={setDeleteReason}
          message={
            <span>
              This action cannot be reversed. Are you sure you want to delete project: <strong>{deleteModal.project?.project_name}</strong>?
            </span>
          }
        />
      </Suspense>

      {userType === 'super_admin' && (
        <StatusHistoryModal
          open={statusHistoryModal.visible}
          entity={statusHistoryModal.entity}
          getEntityId={(entity) =>
            entity?.project_id ?? entity?.projectId ?? entity?.project?.id ?? entity?.id
          }
          onClose={() => setStatusHistoryModal({ visible: false, entity: null })}
          fetchHistoryApi={getProjectStatusHistory}
          historyDateKey="changed_at"
          getTitleFromEntity={(entity) => entity?.project_name || 'Project'}
          queryKeyPrefix="projectAuditHistoryAssigned"
          emptyMessage="No status history available."
        />
      )}

      {/* PM Job Remarks Matrix Modal */}
      <PmJobRemarksMatrixModal
        visible={pmJobRemarksMatrix.visible}
        projectId={pmJobRemarksMatrix.projectId}
        onClose={() => setPmJobRemarksMatrix({ visible: false, projectId: null })}
        companyName={clientName}
      />

      {/* Recruiter change confirmation modal (per row) */}
      <Suspense fallback={null}>
        <ConfirmationModal
          showModal={recruiterChangeModal.visible}
          setShowModal={(visible) =>
            setRecruiterChangeModal((prev) => ({ ...prev, visible }))
          }
          onConfirm={confirmRecruiterChange}
          isLoading={recruiterAssignmentMutation.isLoading}
          details={{
            'Project Name': recruiterChangeModal.projectName || '-',
            'Current Recruiter': recruiterChangeModal.oldRecruiterName || 'Unassigned',
            'New Recruiter': recruiterChangeModal.newRecruiterName || '-',
          }}
          message="Are you sure you want to change the recruiter for this project?"
        />
      </Suspense>

      {/* Rejection reason modal */}
      <Modal
        open={rejectionModal.visible}
        title="Reason for Rejection"
        onCancel={() => setRejectionModal({ visible: false, projectId: null, field: null, row: null, reason: '' })}
        onOk={() => approvalMutation.mutate({ id: rejectionModal.projectId, approvalStatus: 'Rejected', reason: rejectionModal.reason, field: rejectionModal.field, row: rejectionModal.row })}
        okText="Confirm Rejection"
        okButtonProps={{ danger: true, loading: approvalMutation.isLoading, disabled: !rejectionModal.reason.trim() }}
        destroyOnClose
      >
        <p style={{ marginBottom: 8, color: '#64748b', fontSize: 13 }}>Please provide a reason for rejecting this project approval.</p>
        <Input.TextArea
          rows={4}
          placeholder="Enter reason..."
          value={rejectionModal.reason}
          onChange={(e) => setRejectionModal((prev) => ({ ...prev, reason: e.target.value }))}
          autoFocus
        />
      </Modal>

      <ProjectApprovalDetailsModal
        visible={approvalModal.visible}
        projectId={approvalModal.projectId}
        onClose={() => setApprovalModal({ visible: false, projectId: null, field: null, row: null })}
        onConfirm={(projectId) => {
          approvalMutation.mutate(
            { id: projectId, approvalStatus: 'Approved', field: approvalModal.field, row: approvalModal.row },
            {
              onSuccess: () => setApprovalModal({ visible: false, projectId: null, field: null, row: null }),
            }
          );
        }}
        confirmLoading={approvalMutation.isLoading}
      />
    </>
  );
} 
