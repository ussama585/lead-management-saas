import { message } from '../../../../components/ui/notifications.jsx';
import { Modal } from '../../../../components/ui/app-modal.jsx';
import { Input } from '../../../../components/ui/app-controls.jsx';
import { Button, Tooltip } from '../../../../components/ui/app-controls.jsx';
import React, { useMemo, useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { List } from 'antd';
import { Pencil as EditOutlined, MessageSquare as MessageOutlined } from 'lucide-react';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import NewTableComponent from '../../../../components/tables/new-table.jsx';
import api from '../../../shared/services/api.js';
import { ProposalModal, ConfirmationModal } from '../../components/LazyModals.jsx';
import ClientDetailCard from '../../../../components/client-detail-card.component.jsx';
import {
  getClientJobListByProject,
  getProjectProposal,
  getProjectRemarksList,
  addProjectRemark,
  getProjectRemarkById,
  updateProjectRemarkById,
} from '../../../shared/services/headhunting.js';
import { getProposalUrl } from '../../../shared/services/manager-service.js';
import { getProjectStatusHistory } from '../../../shared/services/status-history.js';
import useUserStore from '../../../shared/store/user-store.js';
import { formatDateUniversal } from '../../../shared/utils/formatDate.js';
import HeadhuntingActivateProjectContent from '../../../../components/headhunting-activate-project-content.jsx';
import { saveTableState, loadTableState } from '../../../shared/utils/persistTableState.js';
import { projectStatusOptions, getProjectStatusTabs, statusColors } from '../../constants/client-constants.js';
import { useProjectStatusMutation, useProjectRemarksMutation, useProjectProposalMutation, useProjectDeleteMutation } from '../../hooks/useProjectMutations.js';
import { useClientDetails, useProjectCounts, useProjectsList, useRecruiterList } from '../../hooks/useProjectQueries.js';
import RemarksModal from '../../components/RemarksModal.jsx';
import ProposalUpdateModal from '../../components/ProposalUpdateModal.jsx';
import StatusTabStyles from '../../components/StatusTabStyles.jsx';
import { createProjectColumns } from '../../utils/project-columns.jsx';
import StatusTabsContainer from '../../components/StatusTabsContainer.jsx';
import StatusHistoryModal, { createStatusHistoryColumn } from '../../../../components/status-history-modal.jsx';
import '../../../../assets/styles/legacy/table-remarks-icon.css';
import '../../../../assets/styles/legacy/table-client-actions.css';
import { useQuery, useMutation, useQueryClient } from 'react-query';

const { TextArea } = Input;

export default function ClientHeadhunting() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const userType = user?.user_type;
  const queryClient = useQueryClient();

  const [searchParams, setSearchParams] = useSearchParams();

  // Load persisted state from URL params or sessionStorage
  const initialState = loadTableState(`client-projects-${clientId}`, searchParams, {
    defaultTab: 'Active',
    tab: 'Active',
  });

  // Initialize states with loaded values
  const [selectedTab, setSelectedTab] = useState(
    initialState.tab || 'Active'
  );

  const [pagination, setPagination] = useState({
    pageIndex: initialState.pageIndex,
    pageSize: initialState.pageSize,
  });

  const [columnVisibility, setColumnVisibility] = useState({});

  const [globalFilter, setGlobalFilter] = useState(initialState.search);

  const [sorting, setSorting] = useState(initialState.sorting);

  // Prevent clearing search on component mount - handle MaterialReactTable edge cases
  const handleGlobalFilterChange = (value) => {
    setGlobalFilter(value === undefined || value === null ? '' : value);
  };

  // Status change confirmation modal state
  const [statusModal, setStatusModal] = useState({
    visible: false,
    project: null,
    oldStatus: '',
    newStatus: '',
    recruiterId: undefined,
    hasRecruitmentManager: false, // Track if project already has recruitment manager
  });
  const [remarksModal, setRemarksModal] = useState({
    visible: false,
    project: null,
    currentRemarks: '',
  });

  const [pmRemarksModal, setPmRemarksModal] = useState({
    visible: false,
    project: null,
  });
  const [newPmRemark, setNewPmRemark] = useState('');
  const [editingPmRemarkId, setEditingPmRemarkId] = useState(null);
  const [editingPmRemarkText, setEditingPmRemarkText] = useState('');

  const [proposalModal, setProposalModal] = useState({
    visible: false,
    data: null,
    loading: false,
    openInCustomizeMode: false,
  });

  // Status history modal (admin only)
  const [statusHistoryModal, setStatusHistoryModal] = useState({ visible: false, entity: null });

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ visible: false, project: null });
  const [deleteReason, setDeleteReason] = useState('');

  const loadProposalModal = async (project) => {
    setProposalModal({ visible: true, data: null, loading: true, openInCustomizeMode: false });

    try {
      // Fetch project proposal data from API
      const response = await api.get(`/headhunting/project-proposal/${project.id}`);
      const apiData = response.data;

      const totalPositions = apiData.jobs?.reduce((sum, job) => sum + (job.number_of_vacancies || 0), 0) || 0;
      const contractPrice = apiData.contract_price ?? 0;
      const mobilizationCharges = apiData.mobilization_charges ?? 0;
      const remainingPayment = contractPrice - mobilizationCharges;
      const hiringCity = apiData.proposal_city || clientData?.city || 'Lahore';

      // Transform API data to match proposal component structure (all dynamic fields)
      const proposalData = {
        date: apiData.proposal_date || apiData.created_at || new Date().toISOString(),
        client: {
          company_name: apiData.company_name,
          contact_person_name: apiData.contact_person_name,
          contact_person_designation: apiData.contact_person_designation,
          email: apiData.email,
          phone_number: apiData.phone_number,
          industry: clientData?.industry || '',
          location: {
            city: hiringCity,
            country: clientData?.country || 'Pakistan'
          }
        },
        project: {
          pricing: {
            pricing_type: apiData.pricing_type,
            contract_currency: apiData.contract_currency,
            contract_subtotal_amount: apiData.contract_subtotal_amount,
            discount_amount: apiData.discount_amount,
            discount_percentage: apiData.discount_percentage,
            contract_price: contractPrice,
            mobilization_charges: mobilizationCharges,
            remaining_payment: remainingPayment,
            discounted_service_charges_text: apiData.discounted_service_charges_text ?? `${apiData.contract_currency || 'PKR'} ${Number(contractPrice).toLocaleString()}${totalPositions > 1 ? ` for ${totalPositions} Resources.` : ' for one Resource.'}`
          }
        },
        jobs: apiData.jobs?.map(job => {
          const min = job.min_salary != null ? Number(job.min_salary) : null;
          const max = job.max_salary != null ? Number(job.max_salary) : null;
          let salary_range = job.salary_range;
          if (!salary_range && min != null && max != null) {
            salary_range = `${apiData.contract_currency || 'PKR'} ${min.toLocaleString()} – ${max.toLocaleString()}`;
          }
          return {
            job_title: job.job_title,
            number_of_vacancies: job.number_of_vacancies,
            location_city: hiringCity,
            salary_range,
            min_salary: job.min_salary,
            max_salary: job.max_salary
          };
        }) || [],
        search_o_pal_representative: {
          name: apiData.search_o_pal_representative_name || 'Madeeha Nasim',
          designation: apiData.search_o_pal_representative_designation || 'Head of Department',
          company: 'Search O Pal'
        },
        summary: {
          total_positions: totalPositions,
          total_amount: contractPrice,
          currency: apiData.contract_currency,
          total_salary_range: apiData.jobs?.[0]?.salary_range ?? (apiData.jobs?.[0]?.min_salary != null && apiData.jobs?.[0]?.max_salary != null
            ? `${apiData.contract_currency || 'PKR'} ${Number(apiData.jobs[0].min_salary).toLocaleString()} – ${Number(apiData.jobs[0].max_salary).toLocaleString()}`
            : null)
        },
        service_terms: {
          // Read exactly what API sends; no hardcoded fallbacks
          replacement_guarantee_duration: apiData.replacement_guarantee_duration || '',
          turnaround_text: apiData.turnaround_time || apiData.turnaround_text || ''
        }
      };

      setProposalModal({ visible: true, data: proposalData, loading: false, openInCustomizeMode: false });
    } catch (error) {
      console.error('Error fetching proposal data:', error);
      message.error('Failed to load proposal data');
      setProposalModal({ visible: false, data: null, loading: false, openInCustomizeMode: false });
    }
  };

  // Contract modal state (different from remarks modal)
  const [contractModal, setContractModal] = useState({
    visible: false,
    project: null,
  });
  const [proposalData, setProposalData] = useState(null);
  const [loadingProposal, setLoadingProposal] = useState(false);

  // Jobs selection state for converting to Active
  const [jobsList, setJobsList] = useState([]);
  const [loadingJobsList, setLoadingJobsList] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState([]);
  const [jobSelectionError, setJobSelectionError] = useState('');
  const [jobDeadlines, setJobDeadlines] = useState({});
  const [projectSubmissionDeadline, setProjectSubmissionDeadline] = useState(null);

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
    return `${year}-${month}-${day}`;
  };
  // Sync all state to URL params and sessionStorage
  useEffect(() => {
    const defaultTab = 'Active';

    saveTableState(`client-projects-${clientId}`, {
      tab: selectedTab,
      defaultTab: defaultTab,
      search: globalFilter,
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting: sorting,
    }, setSearchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, globalFilter, pagination.pageIndex, pagination.pageSize, sorting, clientId]);

  // Fetch proposal data when contract modal opens
  useEffect(() => {
    const fetchProposalData = async () => {
      if (!contractModal.visible || !contractModal.project?.id) {
        setProposalData(null);
        return;
      }

      setLoadingProposal(true);
      try {
        const data = await getProjectProposal(contractModal.project.id);

        setProposalData(data);
      } catch (error) {
        console.error('Error fetching proposal data:', error);
        // Don't show error if proposal doesn't exist (404) - it might be a new proposal
        if (error?.response?.status !== 404) {
          message.error('Failed to load proposal data');
        }
        setProposalData(null);
      } finally {
        setLoadingProposal(false);
      }
    };

    fetchProposalData();
  }, [contractModal.visible, contractModal.project?.id]);

  // Fetch data using custom hooks
  const { data: clientData } = useClientDetails(clientId);
  const { data: projectCounts } = useProjectCounts(clientId);
  const { data: projectsData, isLoading: projectsLoading, refetch: refetchProjects } = useProjectsList(
    clientId,
    selectedTab,
    pagination,
    sorting,
    globalFilter
  );

  // Recruiter list
  const [recruiterOptions, setRecruiterOptions] = useState([]);
  const assigningRecruiter = false;
  const { refetch: refetchRecruiterList } = useRecruiterList((data) => {
    if (Array.isArray(data)) {
      setRecruiterOptions(data.map((r) => ({ label: r.name, value: Number(r.id) })));
    }
  });

  // Fetch recruiter list whenever the status modal opens and shows the recruiter options
  useEffect(() => {
    if (
      statusModal.visible &&
      statusModal.newStatus === 'Active' &&
      !statusModal.hasRecruitmentManager &&
      refetchRecruiterList
    ) {
      refetchRecruiterList();
    }
  }, [statusModal.visible, statusModal.newStatus, statusModal.hasRecruitmentManager, refetchRecruiterList]);

  // Initialize mutations
  const statusMutation = useProjectStatusMutation(clientId, () => {
    setStatusModal({ visible: false, project: null, oldStatus: '', newStatus: '' });
    refetchProjects();
  });

  const projects = projectsData?.results || [];
  const clientName = projectsData?.client_name || clientData?.company_name || 'Client';
  const clientStatus = projectsData?.client_status || clientData?.status || 'Unknown';
  const breadcrumbLabel = `${clientStatus || 'Client'} > Projects`;

  const updateProjectRemarksMutation = useProjectRemarksMutation(() => {
    setRemarksModal({ visible: false, project: null, currentRemarks: '' });
    refetchProjects();
  });

  const { data: projectPmRemarksData, isLoading: projectPmRemarksLoading, isFetching: projectPmRemarksFetching } = useQuery(
    ['projectPmRemarksClientPage', pmRemarksModal.project?.id],
    () => getProjectRemarksList(pmRemarksModal.project?.id),
    {
      enabled: pmRemarksModal.visible && !!pmRemarksModal.project?.id,
      refetchOnWindowFocus: false,
    }
  );

  const projectPmRemarks = useMemo(
    () => (Array.isArray(projectPmRemarksData?.results) ? projectPmRemarksData.results : []),
    [projectPmRemarksData]
  );

  const invalidatePmProjectRemarks = useCallback(() => {
    const projectId = pmRemarksModal.project?.id;
    if (!projectId) return;
    queryClient.invalidateQueries(['projectPmRemarksClientPage', projectId]);
    queryClient.invalidateQueries(['clientProjects', clientId]);
    queryClient.invalidateQueries('clientProjects');
    queryClient.invalidateQueries(['clientProjectCounts', clientId]);
  }, [pmRemarksModal.project?.id, queryClient, clientId]);

  const addPmProjectRemarkMutation = useMutation(
    ({ projectId, remarks }) => addProjectRemark(projectId, remarks),
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Remark added successfully');
        setNewPmRemark('');
        invalidatePmProjectRemarks();
        refetchProjects();
      },
      onError: (error) => {
        message.error(error?.response?.data?.message || error?.message || 'Failed to add remark');
      },
    }
  );

  const updatePmProjectRemarkMutation = useMutation(
    ({ remarkId, remarks }) => updateProjectRemarkById(remarkId, remarks),
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Remark updated successfully');
        setEditingPmRemarkId(null);
        setEditingPmRemarkText('');
        invalidatePmProjectRemarks();
        refetchProjects();
      },
      onError: (error) => {
        message.error(error?.response?.data?.message || error?.message || 'Failed to update remark');
      },
    }
  );

  const updateProposalMutation = useProjectProposalMutation(() => {
    setContractModal({ visible: false, project: null });
    refetchProjects();
  });

  const deleteMutation = useProjectDeleteMutation(clientId, async () => {
    setDeleteModal({ visible: false, project: null });
    setDeleteReason('');
    await Promise.all([
      queryClient.invalidateQueries(['clientProjectCounts', clientId]),
      queryClient.invalidateQueries(['clientProjects', clientId]),
      queryClient.invalidateQueries('clientProjects'),
    ]);
    refetchProjects();
  });

  const handleDeleteProject = (project) => {
    setDeleteModal({ visible: true, project });
  };

  const baseStatusTabs = getProjectStatusTabs(projectCounts);

  const totalProjectsCount =
    projectCounts?.total ||
    (projectCounts
      ? (projectCounts?.pending || 0) +
      (projectCounts?.active || 0) +
      (projectCounts?.delayed || 0) +
      (projectCounts?.completed || 0) +
      (projectCounts?.completed_payment_pending || 0) +
      (projectCounts?.completed_defaulter || 0) +
      (projectCounts?.terminated_by_client || 0) +
      (projectCounts?.terminated_by_client_refunded || 0) +
      (projectCounts?.terminated_by_search_o_pal || 0) +
      (projectCounts?.terminated_by_search_o_pal_refunded || 0)
      : 0);

  const statusTabs = [{ label: 'All', value: 'All', count: totalProjectsCount }, ...baseStatusTabs];
  const filteredProjects = projects;

  const transformedProjectsData = filteredProjects.map((project, idx) => ({
    ...project,
    created_at: project.created_at ? formatDateUniversal(project.created_at) : '-',
    contract_price: project.contract_price?.toLocaleString() ?? '-',
    index: idx + 1 + pagination.pageIndex * pagination.pageSize,
  }));

  const goBack = () => {
    navigate('/headhunting-client');
  };

  const canEditProject = (project) => {
    // Admin and sales_manager can always edit projects (their own and executives')
    if (userType === 'super_admin' || userType === 'sales_manager') {
      return true;
    }

    // Sales executives can edit projects (but not status - that's handled in the status column)
    if (userType === 'sales_executive') {
      return true;
    }

    const isAssignedToMe =
      Number(project?.assigned_to) === Number(user?.id) ||
      Number(clientData?.assigned_to) === Number(user?.id);

    // For all other roles, require:
    // - project/client is assigned to current user
    // - client status is Active
    if (!isAssignedToMe) {
      return false;
    }

    if (clientStatus !== 'Active') {
      return false;
    }

    return true;
  };

  const handleStatusChange = (projectId, newStatus) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      // 🚨 NEW CHECK — if job count is 0, block activation
      if (newStatus === "Active" && Number(project.job_count) === 0) {
        message.error("Cannot be activated. This project has no jobs.");
        return;
      }
      if (!canEditProject(project)) {
        if (clientStatus !== 'Active' && userType !== 'admin' && userType !== 'sales_manager') {
          message.warning('Cannot update project status: Client is not Active');
        } else {
          message.warning('You do not have permission to edit this project');
        }
        return;
      }

      // Check if project already has a recruitment manager assigned
      // If recruitment_manager exists, skip job selection and recruiter assignment for both admin and sales_manager
      const hasRecruitmentManager =
        project.recruitment_manager !== null && project.recruitment_manager !== undefined;

      setStatusModal({
        visible: true,
        project,
        oldStatus: project.status || 'No Status',
        newStatus: newStatus,
        recruiterId: undefined,
        hasRecruitmentManager: hasRecruitmentManager,
      });

      // Only fetch jobs and show job selection if changing to Active AND no recruitment manager is assigned
      // This applies to both admin and sales_manager - if recruitment_manager exists, directly convert to Active
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
              .map(j => ({
                id: j.id,
                job_title: j.job_title,
                number_of_vacancies: j.number_of_vacancies
              }));
            setJobsList(mapped);
            // Automatically select all jobs
            const allJobIds = mapped.map(j => j.id);
            setSelectedJobIds(allJobIds);
          })
          .catch(() => setJobsList([]))
          .finally(() => setLoadingJobsList(false));
      }
    }
  };

  const handleStatusConfirm = async () => {
    // Only validate job selection and recruiter if changing to Active AND no recruitment manager is assigned
    if (statusModal.newStatus === 'Active' && !statusModal.hasRecruitmentManager) {
      // Validate project submission deadline
      if (!projectSubmissionDeadline) {
        message.error('Please select project submission deadline');
        return;
      }

      // Validate recruiter selection
      if (!statusModal.recruiterId) {
        message.error('Please select a recruiter');
        return;
      }

      // Validate that ALL jobs are selected
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

      // Validate that all selected jobs have deadlines
      const missingDeadline = selectedJobIds.some(id => !jobDeadlines[id]);
      if (missingDeadline) {
        setJobSelectionError('Please add submission deadline for all selected jobs');
        return;
      }

      // Validate that all selected jobs have CVs count
      const missingCVs = selectedJobIds.some(id => !jobDeadlines[`${id}_cvs`]);
      if (missingCVs) {
        setJobSelectionError('Please select CVs to be provided for all selected jobs');
        return;
      }
    }

    const mutationPayload = {
      id: statusModal.project.id,
      value: statusModal.newStatus
    };

    // Only include job selection and recruiter assignment if no recruitment manager is assigned
    if (statusModal.newStatus === 'Active' && !statusModal.hasRecruitmentManager) {
      const selectedJobs = selectedJobIds.map(id => ({
        id,
        cv_submission_deadline: formatDeadlineWithOffset(jobDeadlines[id]),
        cvs_to_be_provided: jobDeadlines[`${id}_cvs`]
      }));
      mutationPayload.selected_jobs = selectedJobs;
      mutationPayload.recruiter_id = statusModal.recruiterId;
      mutationPayload.project_completion_deadline = formatDeadlineWithOffset(projectSubmissionDeadline);
    }

    statusMutation.mutate(mutationPayload);
  };


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

  const getFilteredStatusOptions = (currentStatus, userType) => {
    if (currentStatus !== 'Pending' && userType !== 'admin') {
      return projectStatusOptions.filter(option => option.value !== 'Pending');
    }
    return projectStatusOptions;
  };

  const projectsColumns = useMemo(
    () =>
      [
        ...createProjectColumns({
          clientName,
          userType,
          statusColors,
          navigate,
          canEditProject,
          handleStatusChange,
          handleProposalClick,
          handleGenerateProposal: loadProposalModal,
          // Customize Proposal column: omit handleCustomizeProposal so it is not shown on this table
          setContractModal,
          getFilteredStatusOptions,
          handleDelete: handleDeleteProject,
        }),
        ...(userType === 'super_admin' ? [
          {
            ...createStatusHistoryColumn({
              onOpenHistory: (entity) => setStatusHistoryModal({ visible: true, entity }),
              header: 'History',
              accessorKey: 'status_history_project',
            }),
            size: 64,
            minSize: 56,
            maxSize: 80,
          },
        ] : []),
        {
          header: 'PM Remarks',
          id: 'project_manager_remarks_action',
          enableSorting: false,
          size: 64,
          minSize: 56,
          maxSize: 80,
          Cell: ({ row }) => {
            const hasPmRemarks =
              String(row.original?.project_manager_remarks ?? '').trim() !== '' ||
              Number(row.original?.project_manager_remarks_count || 0) > 0 ||
              Number(row.original?.pm_remarks_count || 0) > 0;
            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <Tooltip title={userType === 'project_manager' ? 'View & update remarks' : 'View remarks'}>
                  <MessageOutlined size="1em"
                    className={["app-icon", `table-remarks-icon ${hasPmRemarks ? 'table-remarks-icon--filled' : 'table-remarks-icon--empty'}`].filter(Boolean).join(' ')}
                    onClick={() => {
                      setPmRemarksModal({ visible: true, project: row.original });
                      setNewPmRemark('');
                      setEditingPmRemarkId(null);
                      setEditingPmRemarkText('');
                    }}
                  />
                </Tooltip>
              </div>
            );
          },
        },
      ],
    [
      clientName,
      userType,
      navigate,
      canEditProject,
      handleStatusChange,
      handleProposalClick,
      loadProposalModal,
      setContractModal,
      getFilteredStatusOptions,
      handleDeleteProject,
    ]
  );

  return (
    <>
      <StatusTabStyles />
      <BreadCrumb goBack={goBack} linkText={breadcrumbLabel} />

      <div className="container">
        <div style={{ maxWidth: '50%' }}>
          <ClientDetailCard clientId={clientId} clientData={clientData} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <StatusTabsContainer
            tabs={statusTabs}
            activeTab={selectedTab}
            statusColors={statusColors}
            onTabClick={(tab) => {
              setSelectedTab(tab.value);
              setPagination({ pageIndex: 0, pageSize: 10 });
            }}
            getCount={(tab) => tab.count}
          />
        </div>

        {(user.user_type !== 'recruitment_manager' && user.user_type !== 'recruitment_executive' && user.user_type !== 'project_manager') && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button
              className="custom-button"
              style={{ marginRight: '16px' }}
              onClick={() => navigate(`/add-new-project-headhunting?clientId=${clientId}`)}
            >
              Add New Project
            </button>
          </div>
        )}
        <NewTableComponent
          columns={projectsColumns}
          data={transformedProjectsData}
          totalCount={projectsData?.count || 0}
          heading={`Projects ${projectsData?.count ? `(${projectsData.count})` : '(0)'}`}
          initialState={pagination}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={setSorting}
          globalFilter={globalFilter}
          onGlobalFilterChange={handleGlobalFilterChange}
          isLoading={projectsLoading}
          enableRowSelection={false}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
        />
      </div>

      <Suspense fallback={null}>
        <ConfirmationModal
          showModal={statusModal.visible}
          setShowModal={(visible) => setStatusModal(prev => ({ ...prev, visible }))}
          mutation={statusMutation}
          oldStatus={statusModal.oldStatus}
          newStatus={statusModal.newStatus}
          details={statusModal.project ? {
            'Project Name': statusModal.project.project_name,
            'Client': clientName,
            'Contract Price': statusModal.project.contract_price
              ? `${Number(statusModal.project.contract_price).toLocaleString()} PKR`
              : '-',
            'Created At': statusModal.project.created_at ? formatDateUniversal(statusModal.project.created_at) : '-',
            ...(statusModal.newStatus === 'Active' && !statusModal.hasRecruitmentManager
              ? {
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
                        setSelectedJobIds((prev) => [...prev, jobId]);
                      } else {
                        setSelectedJobIds((prev) => prev.filter((id) => id !== jobId));
                        setDeadlineForJob(jobId, undefined);
                      }
                    }}
                    onDeadlineChange={(jobId, date) => setDeadlineForJob(jobId, date)}
                    onCvsChange={(jobId, value) =>
                      setJobDeadlines((prev) => ({
                        ...prev,
                        [`${jobId}_cvs`]: value,
                      }))
                    }
                    recruiterOptions={recruiterOptions}
                    assigningRecruiter={assigningRecruiter}
                    recruiterId={statusModal.recruiterId}
                    onRecruiterChange={(value) =>
                      setStatusModal((prev) => ({ ...prev, recruiterId: value }))
                    }
                    projectSubmissionDeadline={projectSubmissionDeadline}
                    onProjectSubmissionDeadlineChange={(date) => setProjectSubmissionDeadline(date)}
                  />
                ),
              }
              : {})
          } : null}
          onConfirm={handleStatusConfirm}
        />
      </Suspense>

      <Modal
        centered
        title={pmRemarksModal.project ? `PM Remarks • ${pmRemarksModal.project.project_name}` : 'PM Remarks'}
        open={pmRemarksModal.visible}
        onCancel={() => {
          setPmRemarksModal({ visible: false, project: null });
          setNewPmRemark('');
          setEditingPmRemarkId(null);
          setEditingPmRemarkText('');
        }}
        confirmLoading={
          addPmProjectRemarkMutation.isLoading || updatePmProjectRemarkMutation.isLoading
        }
        footer={null}
        width={600}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {userType === 'project_manager' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Add New Remark
            </label>
            <TextArea
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
            <div style={{ marginTop: 10, textAlign: 'right' }}>
              <Button
                type="primary"
                className="sop-brand-primary"
                onClick={() => {
                  if (!newPmRemark.trim()) {
                    message.warning('Please enter a remark');
                    return;
                  }
                  if (!pmRemarksModal.project?.id) return;
                  addPmProjectRemarkMutation.mutate({
                    projectId: pmRemarksModal.project.id,
                    remarks: newPmRemark.trim(),
                  });
                }}
                loading={addPmProjectRemarkMutation.isLoading}
              >
                Add Remark
              </Button>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 8, fontWeight: 500 }}>
          Existing Remarks {projectPmRemarksLoading || projectPmRemarksFetching ? '(Loading...)' : ''}
        </div>
        <List
          bordered
          style={{ maxHeight: 300, overflowY: 'auto' }}
          locale={{ emptyText: 'No PM remarks available' }}
          dataSource={projectPmRemarks}
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
                        updatePmProjectRemarkMutation.mutate({
                          remarkId: item.id,
                          remarks: editingPmRemarkText.trim(),
                        });
                      }}
                      loading={updatePmProjectRemarkMutation.isLoading}
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
                    <span style={{ fontWeight: 600 }}>
                      {formatDateUniversal(item?.created_at) || '—'}
                    </span>
                    <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>
                      ID: {item?.id ?? '—'}
                    </span>
                    {item?.updated_at && item.updated_at !== item.created_at && (
                      <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>
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
                    <span style={{ whiteSpace: 'pre-wrap' }}>{item?.project_manager_remarks || ''}</span>
                  )
                }
              />
            </List.Item>
          )}
        />

        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <Button
            onClick={() => {
              setPmRemarksModal({ visible: false, project: null });
              setNewPmRemark('');
              setEditingPmRemarkId(null);
              setEditingPmRemarkText('');
            }}
          >
            Close
          </Button>
        </div>
      </Modal>

      {/* Project Remarks Modal */}
      <RemarksModal
        visible={remarksModal.visible}
        title={remarksModal.project ? `Project Remarks • ${remarksModal.project.project_name}` : 'Project Remarks'}
        remarks={remarksModal.currentRemarks}
        loading={updateProjectRemarksMutation.isLoading}
        onRemarksChange={(e) =>
          setRemarksModal((prev) => ({
            ...prev,
            currentRemarks: e.target.value,
          }))
        }
        onSave={() => {
          if (!remarksModal.project) {
            setRemarksModal({ visible: false, project: null, currentRemarks: '' });
            return;
          }
          updateProjectRemarksMutation.mutate({
            id: remarksModal.project.id,
            remarks: remarksModal.currentRemarks?.trim() || '',
          });
        }}
        onCancel={() =>
          setRemarksModal({ visible: false, project: null, currentRemarks: '' })
        }
        placeholder="Enter project remarks..."
        maxLength={500}
        showCount={true}
      />

      {/* Contract Modal */}
      <ProposalUpdateModal
        visible={contractModal.visible && !loadingProposal}
        loading={updateProposalMutation.isLoading || loadingProposal}
        project={contractModal.project}
        proposalData={proposalData}
        clientData={clientData}
        clientName={clientName}
        onClose={() => {
          setContractModal({ visible: false, project: null });
          setProposalData(null);
        }}
        onSave={async (remarks, contractPayload) => {
          if (contractPayload) {
            await updateProposalMutation.mutateAsync({
              id: contractModal.project.id,
              contractData: contractPayload,
            });
          } else if (remarks !== undefined) {
            await updateProjectRemarksMutation.mutateAsync({
              id: contractModal.project.id,
              remarks: remarks || '',
            });
          }
        }}
      />

      <Suspense fallback={null}>
        <ProposalModal
          visible={proposalModal.visible}
          onClose={() =>
            setProposalModal({ visible: false, data: null, loading: false, openInCustomizeMode: false })
          }
          proposalData={proposalModal.data}
          loading={proposalModal.loading}
          openInCustomizeMode={proposalModal.openInCustomizeMode}
          onExitCustomizeMode={() =>
            setProposalModal((prev) => ({ ...prev, openInCustomizeMode: false }))
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
          queryKeyPrefix="projectAuditHistory"
          emptyMessage="No status history available."
        />
      )}
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
    </>
  );
}