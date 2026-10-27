import { message } from '../../../../components/ui/notifications.jsx';
import { Modal } from '../../../../components/ui/app-modal.jsx';
import { Select } from '../../../../components/ui/app-select.jsx';
import { Input } from '../../../../components/ui/app-controls.jsx';
import { Button } from '../../../../components/ui/app-controls.jsx';
import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from 'react';

import { useSearchParams } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import NewTableComponent from '../../../../components/tables/new-table.jsx';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import { ConfirmationModal, ShowRemarksHeadhunting } from '../../components/LazyModals.jsx';
import ExecutiveTabButton from '../../../../components/executive-tab-button.component.jsx';
import useUserStore from '../../../shared/store/user-store.js';
import { saveTableState, loadTableState } from '../../../shared/utils/persistTableState.js';
import { statusTabs, statusColors, mapClientCounts } from '../../constants/client-constants.js';
import { createClientColumns } from '../../utils/client-columns.jsx';
import '../../../../assets/styles/legacy/prominent-scrollbar.css';
import { useClientStatusMutation, useClientRemarksMutation, useRecruiterAssignmentMutation, useClientDeleteMutation } from '../../hooks/useClientMutations.js';
import { useClientCounts, useClientsList, useHeadhuntingClientStats } from '../../hooks/useClientQueries.js';
import { useClientHandlers } from '../../hooks/useClientHandlers.js';
import { getRecruitmentExecutiveStats, getClientDetails, createSaasClient, getAssignedClientsRecruiters } from '../../../shared/services/headhunting.js';
import { getManangersExecutives } from '../../../shared/services/users-service.js';
import { useQuery, useQueryClient, useMutation } from 'react-query';
import { citiesNames, countriesNames } from '../../../shared/utils/countries.js';

import { LoaderCircle as LoadingOutlined } from 'lucide-react';
import { getClientStatusHistory } from '../../../shared/services/status-history.js';
import RemarksModal from '../../components/RemarksModal.jsx';
import StatusHistoryModal, { createStatusHistoryColumn } from '../../../../components/status-history-modal.jsx';
import '../../../../assets/styles/legacy/client-listing-page.css';
import StatusTabs from '../../components/StatusTabs.jsx';
import FilterTabRow from '../../../../components/filter-tab-row.component.jsx';

export default function HeadhuntingForAdmin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const queryClient = useQueryClient();
  
  // Load persisted table state (all 4 layer tabs: manager, executive, recruitment manager, recruitment executive)
  const initialState = loadTableState('headhunting-clients', searchParams, {
    defaultStatus: 'Active',
    status: 'Active',
    selectedManagerId: '',
    selectedExecutiveId: '',
    selectedRecruitmentManagerId: '',
    selectedRecruitmentExecutiveId: '',
    selectedClientRecruiterId: '',
  });
  
  // Table state - initialize from persisted state so all 4 tab layers restore on reload
  const [selectedStatus, setSelectedStatus] = useState(initialState.status || 'Active');
  const [selectedManagerId, setSelectedManagerId] = useState(initialState.selectedManagerId ?? '');
  const [selectedExecutiveId, setSelectedExecutiveId] = useState(initialState.selectedExecutiveId ?? '');
  const [selectedRecruitmentManagerId, setSelectedRecruitmentManagerId] = useState(initialState.selectedRecruitmentManagerId ?? '');
  const [selectedRecruitmentExecutiveId, setSelectedRecruitmentExecutiveId] = useState(initialState.selectedRecruitmentExecutiveId ?? '');
  const [pagination, setPagination] = useState({ 
    pageIndex: initialState.pageIndex, 
    pageSize: initialState.pageSize 
  });
  const [globalFilter, setGlobalFilter] = useState(initialState.search);
  const [sorting, setSorting] = useState(initialState.sorting);
  const [columnVisibility, setColumnVisibility] = useState({});
  const isInitialMount = useRef(true);

  // Project manager recruiter filter
  const [selectedClientRecruiterId, setSelectedClientRecruiterId] = useState(initialState.selectedClientRecruiterId ?? '');

  // Status history modal (admin only)
  const [statusHistoryModal, setStatusHistoryModal] = useState({ visible: false, entity: null });

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ visible: false, client: null });
  const [deleteReason, setDeleteReason] = useState('');

  // SaaS client modal state
  const [saasClientModal, setSaasClientModal] = useState({ visible: false, clientId: null });
  const [saasClientForm, setSaasClientForm] = useState({ city: null, country: null });
  const openDeletedClientsList = () => {
    navigate('/admin/deleted-clients');
  };

  const handleGlobalFilterChange = (value) => {
    setGlobalFilter(value ?? '');
  };

  // Persist table state to URL and sessionStorage (all 4 layer tabs + status, search, pagination, sorting)
  useEffect(() => {
    saveTableState('headhunting-clients', {
      status: selectedStatus,
      defaultStatus: 'Active',
      selectedManagerId,
      selectedExecutiveId,
      selectedRecruitmentManagerId,
      selectedRecruitmentExecutiveId,
      selectedClientRecruiterId,
      search: globalFilter,
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
    }, setSearchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, selectedManagerId, selectedExecutiveId, selectedRecruitmentManagerId, selectedRecruitmentExecutiveId, selectedClientRecruiterId, globalFilter, pagination.pageIndex, pagination.pageSize, sorting]);

  const isAdmin = user?.user_type === 'admin';
  const isProjectManager = user?.user_type === 'project_manager';
  const isSalesManager = user?.user_type === 'sales_manager';
  const isSalesExecutive = user?.user_type === 'sales_executive';
  const canViewStats = isAdmin || isSalesManager;

  // Fetch data using custom hooks (counts and list filtered by sales_manager, sales_executive)
  const { data: clientCounts, isLoading: loadingCounts } = useClientCounts(selectedExecutiveId, selectedManagerId, selectedRecruitmentManagerId, selectedRecruitmentExecutiveId, (isProjectManager || isAdmin) ? selectedClientRecruiterId : '');

  const {
    data: clientListData,
    isLoading: loadingClients,
    isFetching: fetchingClients,
  } = useClientsList(selectedStatus, pagination, sorting, globalFilter, selectedExecutiveId, selectedManagerId, selectedRecruitmentManagerId, selectedRecruitmentExecutiveId, (isProjectManager || isAdmin) ? selectedClientRecruiterId : '');
  const {
    dataLevel1,
    dataLevel2,
    dataLevel3,
    dataLevel4,
    isLoading: loadingClientStats,
  } = useHeadhuntingClientStats(selectedManagerId, selectedExecutiveId, selectedRecruitmentManagerId, canViewStats);

  // Recruitment executive stats for overview cards (manager view) - using same API as recruitment manager
  const { data: executiveStatsData } = useQuery(
    'recruitmentExecutiveStats',
    getRecruitmentExecutiveStats,
    {
      enabled: isSalesManager,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const { data: clientRecruitersData } = useQuery(
    'assignedClientsRecruiters',
    getAssignedClientsRecruiters,
    {
      enabled: isProjectManager || isAdmin,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const clientRecruitersList = useMemo(() => {
    if (!isProjectManager && !isAdmin) return [];
    const data = clientRecruitersData;
    if (Array.isArray(data)) return data.map(r => ({ ...r, project_count: r.client_count }));
    if (Array.isArray(data?.results)) return data.results.map(r => ({ ...r, project_count: r.client_count }));
    return [];
  }, [clientRecruitersData, isProjectManager]);

  // Reset pagination when filters change (but not on initial mount to preserve URL params)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [selectedStatus, selectedManagerId, selectedExecutiveId, selectedRecruitmentManagerId, selectedRecruitmentExecutiveId, selectedClientRecruiterId, globalFilter]);

  // Stable key for first-row items. For "Unassigned" and "Others" always use name-based slug so API gets tab=Unassigned/tab=Others (not SalesManager with numeric id).
  const getManagerSlugKey = (u) => {
    const name = (u?.name || '').trim();
    const nameLower = name.toLowerCase();
    if (nameLower === 'unassigned') return '_Unassigned';
    if (nameLower === 'others') return '_Others';
    if (u.id != null && u.id !== undefined && u.id !== 'All') return String(u.id);
    return name ? `_${name}` : '_item';
  };

  // Slug for level 2/3/4 rows. For "Unassigned" and "Others" always use name-based slug so API gets tab=Unassigned/tab=Others.
  const getSelectionKey = (item) => {
    const name = (item?.name || '').trim();
    const nameLower = name.toLowerCase();
    if (nameLower === 'unassigned') return '_Unassigned';
    if (nameLower === 'others') return '_Others';
    if (item?.id != null && item?.id !== 'All') return String(item.id);
    return name ? `_${item.name}` : '';
  };

  // First row: from client-stats-level1 (Sales Managers)
  const salesManagersList = useMemo(() => {
    if (!dataLevel1 || !Array.isArray(dataLevel1)) return [];
    return dataLevel1.map((u) => ({
      id: u.id !== 'All' && u.id != null ? Number(u.id) : u.id,
      slugKey: getManagerSlugKey(u),
      name: u.name,
      user_type: u.user_type || '',
      count: u.count,
    }));
  }, [dataLevel1]);

  // Second row: from client-stats-level2 (Sales Executives, filtered by selected manager on backend)
  const executivesForSecondRow = useMemo(() => {
    if (!dataLevel2 || !Array.isArray(dataLevel2)) return [];
    return dataLevel2.map((e) => ({
      id: e.id !== 'All' && e.id != null ? Number(e.id) : e.id,
      name: e.name,
      user_type: e.user_type || 'sales_executive',
      count: e.count,
    }));
  }, [dataLevel2]);

  // Third row: from client-stats-level3 (Recruitment Managers, filtered by selected executive on backend)
  const recruitmentManagersForThirdRow = useMemo(() => {
    if (!dataLevel3 || !Array.isArray(dataLevel3)) return [];
    return dataLevel3.map((rm) => ({
      id: rm.id !== 'All' && rm.id != null ? Number(rm.id) : rm.id,
      name: rm.name,
      user_type: rm.user_type || 'recruitment_manager',
      count: rm.count,
    }));
  }, [dataLevel3]);

  // Fourth row: from client-stats-level4 (Recruitment Executives, filtered by selected recruitment manager on backend)
  const recruitmentExecutivesForFourthRow = useMemo(() => {
    if (!dataLevel4 || !Array.isArray(dataLevel4)) return [];
    return dataLevel4.map((re) => ({
      id: re.id !== 'All' && re.id != null ? Number(re.id) : re.id,
      name: re.name,
      user_type: re.user_type || 'recruitment_executive',
      count: re.count,
    }));
  }, [dataLevel4]);

  // Fetch executives/managers list for assignment
  const { data: assigningUsersData, isLoading: loadingAssigningUsers } = useQuery({
    queryKey: ['executiveList', user?.user_type],
    queryFn: () => getManangersExecutives(user?.user_type),
    enabled: (user?.user_type === 'sales_manager' || user?.user_type === 'admin'),
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  // Recruiter dropdown: build from level1 + level2 (sales managers and sales executives with id)
  const recruiterExecutivesList = useMemo(() => {
    if (user?.user_type === 'admin') {
      const allUsers = assigningUsersData || [];
      return allUsers;
    }

    if (user?.user_type === 'sales_manager') {
      const executives = Array.isArray(assigningUsersData) ? assigningUsersData : [];
      const currentManager = {
        id: user.id,
        name: user.name,
        user_type: user.user_type
      };

      const isManagerAlreadyInList = executives.some(exec => exec.id === user.id);

      if (isManagerAlreadyInList) {
        return executives;
      } else {
        return [currentManager, ...executives];
      }
    }

    const list = [];
    const seen = new Set();
    const add = (u) => {
      if (u.id == null || u.id === undefined || u.id === 'All') return;
      const id = Number(u.id);
      if (isNaN(id) || seen.has(id)) return;
      if (u.user_type === 'sales_manager' || u.user_type === 'sales_executive') {
        seen.add(id);
        list.push({ id, name: u.name, user_type: u.user_type || 'sales_manager' });
      }
    };
    (dataLevel1 || []).forEach(add);
    (dataLevel2 || []).forEach(add);
    if (user?.user_type === 'sales_manager' && !list.some((u) => Number(u.id) === Number(user.id))) {
      list.push({ id: Number(user.id), name: user.name, user_type: user.user_type });
    }
    return list;
  }, [assigningUsersData, dataLevel1, dataLevel2, user]);

  // Initialize mutations
  const statusMutation = useClientStatusMutation(() => {
    setStatusModal({ visible: false, client: null, oldStatus: '', newStatus: '' });
  });

  const remarksMutation = useClientRemarksMutation(() => {
    setRemarksModal({ visible: false, client: null, remarks: '' });
  });

  const recruiterAssignmentMutation = useRecruiterAssignmentMutation(() => {
    setAssigningRecruiter(false);
  });

  const deleteMutation = useClientDeleteMutation(async () => {
    setDeleteModal({ visible: false, client: null });
    setDeleteReason('');
    await Promise.all([
      queryClient.invalidateQueries('headhuntingClientCounts'),
      queryClient.invalidateQueries('headhuntingClients'),
      queryClient.invalidateQueries('headhuntingClientStatsLevel1'),
      queryClient.invalidateQueries('headhuntingClientStatsLevel2'),
      queryClient.invalidateQueries('headhuntingClientStatsLevel3'),
      queryClient.invalidateQueries('headhuntingClientStatsLevel4'),
    ]);
  });

  const handleDeleteClient = (client) => {
    setDeleteModal({ visible: true, client });
  };

  const { data: saasClientDetailData, isLoading: loadingSaasClientDetails } = useQuery(
    ['saasClientDetails', saasClientModal.clientId],
    () => getClientDetails(saasClientModal.clientId),
    {
      enabled: (isSalesManager || isSalesExecutive) && saasClientModal.visible && !!saasClientModal.clientId,
      staleTime: 0,
      cacheTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (!saasClientDetailData) return;
    setSaasClientForm({
      city: saasClientDetailData.city || null,
      country: saasClientDetailData.country || null,
    });
  }, [saasClientDetailData]);

  const createSaasClientMutation = useMutation(
    ({ clientId, city, country }) => createSaasClient(clientId, { city, country }),
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Job Portal client created successfully');
        setSaasClientModal({ visible: false, clientId: null });
        setSaasClientForm({ city: null, country: null });
        queryClient.invalidateQueries('headhuntingClientCounts');
        queryClient.invalidateQueries('headhuntingClients');
      },
      onError: (error) => {
        const errMsg =
          error?.message ||
          error?.details?.message ||
          (typeof error === 'string' ? error : 'Failed to create Job Portal client');
        message.error(errMsg);
      },
    }
  );

  const handleSaasClientCreate = useCallback((client) => {
    if ((user?.user_type !== 'sales_manager' && user?.user_type !== 'sales_executive') || selectedStatus !== 'Active' || client?.is_client_create !== false) return;
    setSaasClientModal({ visible: true, clientId: client.id });
  }, [selectedStatus, user?.user_type]);

  const handleConfirmSaasClientCreate = useCallback(() => {
    if ((user?.user_type !== 'sales_manager' && user?.user_type !== 'sales_executive') || !saasClientModal.clientId) return;
    if (!saasClientForm.city || !saasClientForm.country) {
      message.error('City and country are required');
      return;
    }
    createSaasClientMutation.mutate({
      clientId: saasClientModal.clientId,
      city: saasClientForm.city,
      country: saasClientForm.country,
    });
  }, [
    user?.user_type,
    saasClientModal.clientId,
    saasClientForm.city,
    saasClientForm.country,
    createSaasClientMutation,
  ]);

  const closeSaasClientModal = useCallback(() => {
    setSaasClientModal({ visible: false, clientId: null });
    setSaasClientForm({ city: null, country: null });
  }, []);

  // Use custom handlers hook for all handler functions and modal states
  const {
    remarksModal,
    setRemarksModal,
    remarksLoading,
    remarksError,
    setRemarksError,
    statusModal,
    setStatusModal,
    showRemarksModal,
    remarksClientId,
    setRemarksClientId,
    pendingStatusChange,
    setPendingStatusChange,
    assigningRecruiter,
    setAssigningRecruiter,
    handleRemarksModal,
    handleRemarksSave,
    handleStatusChange,
    handleStatusConfirm,
    handleShowRemarksClose,
    handleRemarksSaved,
    handleRecruiterAssignmentChange,
  } = useClientHandlers({
    remarksMutation,
    statusMutation,
    recruiterAssignmentMutation,
    recruiterExecutivesList,
  });

  // Create table columns using the extracted utility
  const columns = useMemo(
    () => {
      const base = createClientColumns({
        user,
        navigate,
        statusMutationLoading: statusMutation.isLoading,
        recruiterExecutivesList,
        assigningRecruiter,
        loadingClientStats,
        handleRecruiterAssignmentChange,
        handleRemarksModal,
        handleStatusChange,
        handleDelete: handleDeleteClient,
        handleSaasClientCreate: undefined,
        showSaasClientColumn: isAdmin,
      });
      return user?.user_type === 'admin'
        ? [...base, createStatusHistoryColumn({
            onOpenHistory: (entity) => setStatusHistoryModal({ visible: true, entity }),
            header: 'History',
            accessorKey: 'status_history_client',
          })]
        : base;
    },
    [
      user,
      navigate,
      statusMutation.isLoading,
      recruiterExecutivesList,
      assigningRecruiter,
      loadingClientStats,
      handleSaasClientCreate,
      selectedStatus,
      handleRecruiterAssignmentChange,
      handleRemarksModal,
      handleStatusChange,
      handleDeleteClient,
    ]
  );

  // Map counts to tab values
  const mappedCounts = mapClientCounts(clientCounts);

  const handleManagerClick = (managerId) => {
    const id = managerId === '' || managerId == null ? '' : String(managerId);
    setSelectedManagerId(id);
    setSelectedExecutiveId('');
    setSelectedRecruitmentManagerId('');
    setSelectedRecruitmentExecutiveId('');
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleExecutiveClick = (executiveId) => {
    const id = executiveId === '' || executiveId == null ? '' : String(executiveId);
    setSelectedExecutiveId(id);
    setSelectedRecruitmentManagerId('');
    setSelectedRecruitmentExecutiveId('');
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleRecruitmentManagerClick = (managerId) => {
    const id = managerId === '' || managerId == null ? '' : String(managerId);
    setSelectedRecruitmentManagerId(id);
    setSelectedRecruitmentExecutiveId('');
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleRecruitmentExecutiveClick = (executiveId) => {
    const id = executiveId === '' || executiveId == null ? '' : String(executiveId);
    setSelectedRecruitmentExecutiveId(id);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const showExecutiveTabs = (user?.user_type === 'admin' || user?.user_type === 'sales_manager') && (salesManagersList.length > 0 || executivesForSecondRow.length > 0);

  // Dynamic "All" tab: use API item when present (id "All" or id null with name "All")
  const isAllItem = (item) => !item ? false : item.id === 'All' || (item.id == null && item.name === 'All');
  const allTabManager = salesManagersList.find(isAllItem);
  const allTabExecutive = executivesForSecondRow.find(isAllItem);
  const allTabRecruitmentManager = recruitmentManagersForThirdRow.find(isAllItem);
  const allTabRecruitmentExecutive = recruitmentExecutivesForFourthRow.find(isAllItem);

  const managersWithoutAll = salesManagersList.filter((m) => !isAllItem(m));
  const executivesWithoutAll = executivesForSecondRow.filter((e) => !isAllItem(e));
  const recruitmentManagersWithoutAll = recruitmentManagersForThirdRow.filter((rm) => !isAllItem(rm));
  const recruitmentExecutivesWithoutAll = recruitmentExecutivesForFourthRow.filter((re) => !isAllItem(re));

  return (
    <>
      <BreadCrumb linkText="Clients" />

      <div className="listing-page-content">
      {/* Executive summary cards - only for sales_manager, using stats API */}
      {isSalesManager && Array.isArray(executiveStatsData) && executiveStatsData.length > 0 && (
        <div className="listing-exec-overview">
          <div className="listing-exec-overview__title">Executive Overview</div>
          <div className="listing-exec-overview__grid">
            {executiveStatsData.map((exec) => {
              const isSelected = String(selectedRecruitmentExecutiveId) === String(exec.id);
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
                    setSelectedRecruitmentExecutiveId((prev) => (String(prev) === String(exec.id) ? '' : String(exec.id)))
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

     
      {/* {showExecutiveTabs && (
        <div style={{ margin: 16 }}>
          <div style={{ margin: '0 0 8px 0' }}>
            <span style={{ fontWeight: '500', marginRight: 8 }}>Sales Managers:</span>
            <span style={{ display: 'inline-block', marginLeft: 8, marginRight: 8, marginBottom: 8 }}>
              <ExecutiveTabButton
                executive={allTabManager}
                label={allTabManager?.name ?? 'All'}
                count={allTabManager?.count}
                isSelected={selectedManagerId === ''}
                onClick={() => handleManagerClick('')}
                showRoleSuffix={false}
                showCount={typeof allTabManager?.count === 'number'}
              />
            </span>
            {managersWithoutAll.map((manager) => (
              <span key={manager.slugKey} style={{ display: 'inline-block', marginLeft: 8, marginRight: 8, marginBottom: 8 }}>
                <ExecutiveTabButton
                  executive={{ ...manager, id: manager.id ?? manager.slugKey }}
                  count={manager.count}
                  isSelected={selectedManagerId === manager.slugKey}
                  onClick={() => handleManagerClick(manager.slugKey)}
                />
              </span>
            ))}
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: '500', marginRight: 8 }}>Sales Executives:</span>
            <span style={{ display: 'inline-block', marginLeft: 8, marginRight: 8, marginBottom: 8 }}>
              <ExecutiveTabButton
                executive={allTabExecutive}
                label={allTabExecutive?.name ?? 'All'}
                count={allTabExecutive?.count}
                isSelected={selectedExecutiveId === ''}
                onClick={() => handleExecutiveClick('')}
                showRoleSuffix={false}
                showCount={typeof allTabExecutive?.count === 'number'}
              />
            </span>
            {executivesWithoutAll.map((executive) => {
              const key = getSelectionKey(executive) || `exec-${executive.name}`;
              return (
                <span key={key} style={{ display: 'inline-block', marginLeft: 8, marginRight: 8, marginBottom: 8 }}>
                  <ExecutiveTabButton
                    executive={executive}
                    count={executive.count}
                    isSelected={selectedExecutiveId === key}
                    onClick={() => handleExecutiveClick(key)}
                  />
                </span>
              );
            })}
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: '500', marginRight: 8 }}>Recruitment Managers:</span>
            <span style={{ display: 'inline-block', marginLeft: 8, marginRight: 8, marginBottom: 8 }}>
              <ExecutiveTabButton
                executive={allTabRecruitmentManager}
                label={allTabRecruitmentManager?.name ?? 'All'}
                count={allTabRecruitmentManager?.count}
                isSelected={selectedRecruitmentManagerId === ''}
                onClick={() => handleRecruitmentManagerClick('')}
                showRoleSuffix={false}
                showCount={typeof allTabRecruitmentManager?.count === 'number'}
              />
            </span>
            {recruitmentManagersWithoutAll.map((rm) => {
              const key = getSelectionKey(rm) || `rm-${rm.name}`;
              return (
                <span key={key} style={{ display: 'inline-block', marginLeft: 8, marginRight: 8, marginBottom: 8 }}>
                  <ExecutiveTabButton
                    executive={rm}
                    count={rm.count}
                    isSelected={selectedRecruitmentManagerId === key}
                    onClick={() => handleRecruitmentManagerClick(key)}
                  />
                </span>
              );
            })}
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: '500', marginRight: 8 }}>Recruitment Executives:</span>
            <span style={{ display: 'inline-block', marginLeft: 8, marginRight: 8, marginBottom: 8 }}>
              <ExecutiveTabButton
                executive={allTabRecruitmentExecutive}
                label={allTabRecruitmentExecutive?.name ?? 'All'}
                count={allTabRecruitmentExecutive?.count}
                isSelected={selectedRecruitmentExecutiveId === ''}
                onClick={() => handleRecruitmentExecutiveClick('')}
                showRoleSuffix={false}
                showCount={typeof allTabRecruitmentExecutive?.count === 'number'}
              />
            </span>
            {recruitmentExecutivesWithoutAll.map((re) => (
              <span key={re.id ?? `re-${re.name}`} style={{ display: 'inline-block', marginLeft: 8, marginRight: 8, marginBottom: 8 }}>
                <ExecutiveTabButton
                  executive={re}
                  count={re.count}
                  isSelected={selectedRecruitmentExecutiveId === String(re.id)}
                  onClick={() => handleRecruitmentExecutiveClick(re.id)}
                />
              </span>
            ))}
          </div>
        </div>
      )} */}
      {/* Recruiter filter tabs — project_manager and admin */}
      {(isProjectManager || isAdmin) && (
        <FilterTabRow
          items={clientRecruitersList}
          selectedId={selectedClientRecruiterId}
          onSelect={(id) => {
            setSelectedClientRecruiterId(id);
            setPagination({ pageIndex: 0, pageSize: 10 });
          }}
          style={{ marginBottom: 12 }}
        />
      )}

   <div className="listing-toolbar-flex">
  <StatusTabs
    tabs={statusTabs}
    activeTab={selectedStatus}
    statusColors={statusColors}
    loading={loadingCounts}
    getCount={(tab) => mappedCounts[tab.key] ?? 0}
    onTabChange={(value) => {
      setSelectedStatus(value);
      setPagination({ pageIndex: 0, pageSize: 10 });
    }}
  />
</div>

{(user.user_type !== 'recruitment_manager' && user.user_type !== 'recruitment_executive' && user.user_type !== 'project_manager') && (
  <div className="listing-action-bar-end">
    {user?.user_type === 'admin' && (
      <button
        type="button"
        onClick={openDeletedClientsList}
        className="listing-btn-warn"
      >
        Deleted Clients
      </button>
    )}
    <button
      type="button"
      className="listing-btn-primary"
      onClick={() => navigate('/add-new-client-headhunting')}
    >
      Add New Client
    </button>
  </div>
)}
      <div className="table-container">
        <NewTableComponent
          totalCount={clientListData?.count || 0}
          columns={columns}
          data={clientListData?.results || []}
          initialState
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={setSorting}
          globalFilter={globalFilter}
          onGlobalFilterChange={handleGlobalFilterChange}
          isLoading={loadingClients || fetchingClients}
          enableRowSelection={false}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          heading={`Clients Table (${clientListData?.count || 0})`}

        />
      </div>
      </div>
      
      {/* Remarks Modal */}
      <RemarksModal
        visible={remarksModal.visible}
        title="Remarks"
        remarks={remarksModal.remarks}
        error={remarksError}
        loading={remarksLoading}
        canEdit={user.user_type !== 'recruitment_manager' && user.user_type !== 'recruitment_executive'}
        onRemarksChange={(e) => {
          setRemarksModal(rm => ({ ...rm, remarks: e.target.value }));
          if (remarksError) setRemarksError('');
        }}
        onSave={handleRemarksSave}
        onCancel={() => {
          setRemarksModal({ visible: false, client: null, remarks: '' });
          setRemarksError('');
        }}
      />

      {/* ShowRemarks Modal for Lost status */}
      <Suspense fallback={null}>
        <ShowRemarksHeadhunting
          id={remarksClientId}
          setIdForRemarks={setRemarksClientId}
          showRemarksModal={showRemarksModal}
          setShowRemarksModal={handleShowRemarksClose}
          addedById={pendingStatusChange?.client?.added_by || ''}
          setAddedById={() => {}}
          onRemarksSaved={handleRemarksSaved}
        />
      </Suspense>

      {/* Status Change Confirmation Modal */}
      <Suspense fallback={null}>
        <ConfirmationModal
          showModal={statusModal.visible}
          setShowModal={(visible) => setStatusModal(prev => ({ ...prev, visible }))}
          mutation={statusMutation}
          oldStatus={statusModal.oldStatus}
          newStatus={statusModal.newStatus}
          details={statusModal.client ? {
            'Company Name': statusModal.client.company_name,
            'Email': statusModal.client.email,
            'Phone': statusModal.client.phone_number,
            'Address': statusModal.client.city && statusModal.client.country
              ? `${statusModal.client.city}, ${statusModal.client.country}`
              : statusModal.client.city || statusModal.client.country,
          } : null}
          onConfirm={handleStatusConfirm}
        />
      </Suspense>
      {user?.user_type === 'admin' && (
        <StatusHistoryModal
          open={statusHistoryModal.visible}
          entity={statusHistoryModal.entity}
          getEntityId={(entity) =>
            entity?.client_id ?? entity?.clientId ?? entity?.client?.id ?? entity?.id
          }
          onClose={() => setStatusHistoryModal({ visible: false, entity: null })}
          fetchHistoryApi={getClientStatusHistory}
          historyDateKey="changed_at"
          getTitleFromEntity={(entity) => entity?.company_name || 'Client'}
          queryKeyPrefix="clientAuditHistory"
          emptyMessage="No status history available."
        />
      )}
      {(isSalesManager || isSalesExecutive) && (
        <Modal
          title="Job Portal Client"
          open={saasClientModal.visible}
          onCancel={closeSaasClientModal}
          footer={[
            <Button key="cancel" onClick={closeSaasClientModal} disabled={createSaasClientMutation.isLoading}>
              Cancel
            </Button>,
            <Button
              key="create"
              type="primary"
              className="sop-brand-primary"
              onClick={handleConfirmSaasClientCreate}
              loading={createSaasClientMutation.isLoading}
              disabled={loadingSaasClientDetails}
              style={{ background: '#3E6A9F', borderColor: '#3E6A9F' }}
            >
              Create Client
            </Button>,
          ]}
          centered
          destroyOnClose
        >
          {loadingSaasClientDetails ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <LoadingOutlined size="1em" className="app-icon app-icon-spin"  style={{ fontSize: 28, color: '#3E6A9F' }} />
              <div style={{ marginTop: 12, color: '#666' }}>Loading client details...</div>
            </div>
          ) : (
            <>
              <p style={{ marginBottom: 16, color: '#666' }}>
                Review the client details below before creating a Job Portal client.
              </p>
              <div style={{ marginBottom: 12 }}>
                <label className="form-label text-start mb-1" style={{ color: '#3E6A9F' }}>Name</label>
                <Input
                  value={saasClientDetailData?.company_name || saasClientDetailData?.contact_person_name || saasClientDetailData?.name || ''}
                  disabled
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="form-label text-start mb-1" style={{ color: '#3E6A9F' }}>Email</label>
                <Input value={saasClientDetailData?.email || ''} disabled />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="form-label text-start mb-1" style={{ color: '#3E6A9F' }}>Phone</label>
                <Input value={saasClientDetailData?.phone_number || saasClientDetailData?.phone || ''} disabled />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="form-label text-start mb-1" style={{ color: '#3E6A9F' }}>City<sup>*</sup></label>
                <Select
                  className="antd-input dropdown"
                  placeholder="Select City"
                  value={saasClientForm.city || undefined}
                  options={citiesNames}
                  showSearch
                  allowClear
                  style={{ width: '100%' }}
                  onChange={(value) => setSaasClientForm((prev) => ({ ...prev, city: value || null }))}
                />
              </div>
              <div>
                <label className="form-label text-start mb-1" style={{ color: '#3E6A9F' }}>Country<sup>*</sup></label>
                <Select
                  className="antd-input dropdown"
                  placeholder="Select Country"
                  value={saasClientForm.country || undefined}
                  options={countriesNames}
                  showSearch
                  allowClear
                  style={{ width: '100%' }}
                  onChange={(value) => setSaasClientForm((prev) => ({ ...prev, country: value || null }))}
                />
              </div>
            </>
          )}
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Suspense fallback={null}>
        <ConfirmationModal
          showModal={deleteModal.visible}
          setShowModal={(visible) => {
            setDeleteModal(prev => ({ ...prev, visible }));
            if (!visible) setDeleteReason('');
          }}
          mutation={deleteMutation}
          onConfirm={() => deleteMutation.mutate({ id: deleteModal.client?.id, reason: deleteReason })}
          showReasonField={true}
          reason={deleteReason}
          setReason={setDeleteReason}
          message={
            <span>
              This action cannot be reversed. Are you sure you want to delete client: <strong>{deleteModal.client?.company_name}</strong>?
            </span>
          }
        />
      </Suspense>
    </>
  );
}

