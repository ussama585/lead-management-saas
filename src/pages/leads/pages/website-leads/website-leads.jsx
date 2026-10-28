import { message } from '../../../../components/ui/notifications.jsx';
import { Select } from '../../../../components/ui/app-select.jsx';
import { Tooltip, Spin, Button } from '../../../../components/ui/app-controls.jsx';
  import React, { useMemo, useState, useEffect, useCallback, useRef, Suspense } from 'react';
  import { useSearchParams } from "react-router-dom";
  import { useNavigate, useLocation } from 'react-router-dom';
  import { getRolePath } from '../../../auth/role-home.js';
  import { isSuperAdmin } from '../../../auth/role-access.js';

  //components
  import { ConfirmationModal, ShowRemarksLead, ProposalModal } from '../../../clients/components/LazyModals.jsx';
  import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
  import WebsiteStatusTabs from './website-status-tabs.jsx';
  import ExecutiveTabButton from '../../../../components/executive-tab-button.component.jsx';
  import NewTableComponent from '../../../../components/tables/new-table.jsx';
  import { Avatar, Space } from 'antd';
  import BootstrapDateRangeModal from '../../../../components/bootstrap-date-range-modal.component.jsx';
  import { createStatusColumn, isLeadConvertedToClient } from '../../../shared/utils/statusColumn.jsx';
  import { createAssignedToColumn } from '../../../shared/utils/assignedToColumn.jsx';
  import DuplicateLeadModal from '../../../../components/duplicate-lead-modal.component.jsx';
  import MarketingManagerFilters from './components/marketing-manager-filters.jsx';
  import { useDuplicateLead } from '../../../../components/hooks/useDuplicateLead.js';
  import { saveTableState, loadTableState } from '../../../shared/utils/persistTableState.js';
  import StatusHistoryModal, { createStatusHistoryColumn } from '../../../../components/status-history-modal.jsx';
  import FollowUpModal from '../../../../components/follow-up-modal.component.jsx';

  //api call
  import { useQuery, useMutation, useQueryClient } from 'react-query';
  import { useQueryApi } from '../../../../components/hooks/useQueryApi.js';
  import api, { fetchLeadCounts, fetchLeadStats } from '../../../shared/services/api.js';
  import { updateLeadById, getProposalUrl } from '../../../shared/services/manager-service.js';
  import { createWebsiteLeadFollowUp, getAssignedUsers, addUserAssignments, removeUserAssignments } from '../../../shared/services/leads.js';
  import ManageAssigneesModal from '../../../../components/manage-assignees-modal.jsx';
  import { getManangersExecutives } from '../../../shared/services/users-service.js';


  //utils
  import formatDateUniversal from '../../../shared/utils/formatDate.js';
  import useUserStore from '../../../shared/store/user-store.js';
  import '../../../../assets/styles/legacy/table-remarks-icon.css';
  import {
    STATUS_OPTIONS,
    toStatusKey,
    statusColors,
    STATUSES_REQUIRING_REMARKS,
    PROJECT_SIZE_OPTIONS
  } from './website-leads-constants.js';
  import { MARKETING_MANAGER_PAGE_SIZE_OPTIONS } from '../../constants/marketing-manager-table-page-sizes.js';



  //icons
  import { LoaderCircle as LoadingOutlined, MessageCircle as CommentOutlined, Upload as UploadOutlined, FileText as FilePdfOutlined, FileText as FileTextOutlined, Info as InfoCircleOutlined, Minus as MinusOutlined, Clock as ClockCircleOutlined, Download as DownloadOutlined, UserPlus as UserAddOutlined } from 'lucide-react';
  //css
  import "../../../../assets/styles/legacy/sales-data.generated.css";


  // CSV export helpers
  export async function getWebsiteLeadHistory(leadId) {
    const { data } = await api.get(`/lead-generation/history/${encodeURIComponent(leadId)}`);
    if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not load lead history.');
    if (!Array.isArray(data)) throw new Error('Could not read lead history.');
    return data;
  }

  const arrayToCSV = (data, columns) => {
    if (!Array.isArray(data) || data.length === 0) return "";
    const headers = columns.map((col) => col.header);
    const keys = columns.map((col) => col.accessorKey);
    const escape = (str) => `"${String(str).replace(/"/g, '""')}"`;
    const csvRows = [headers.map(escape).join(",")];
    data.forEach((row) => {
      csvRows.push(keys.map((key) => escape(row[key] ?? "")).join(","));
    });
    return csvRows.join("\r\n");
  };




  const LeadsPage = ({ isDashboard = false }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useUserStore();
    const userType = user?.user_type;

    // Load persisted state from URL params or sessionStorage
    const initialState = loadTableState('leads-page', searchParams, {
      status: searchParams.get("status") || "",
      defaultStatus: "",
      hearAboutUs: searchParams.get("hear_about_us") || "",
    });

    // For marketing managers, use single values (can select both executive and status simultaneously)
    const getInitialStatus = () => {
      const statusParam = initialState.status || searchParams.get("status") || "";
      // If it's an array, take the first value; otherwise use as is
      if (Array.isArray(statusParam)) {
        return statusParam.length > 0 ? statusParam[0] : "";
      }
      return statusParam;
    };

    const getInitialExecutive = () => {
      const execParam = initialState.selectedExecutive || searchParams.get("executive") || "";
      // If it's an array, take the first value; otherwise use as is
      if (Array.isArray(execParam)) {
        return execParam.length > 0 ? execParam[0] : "";
      }
      return execParam;
    };

    const [selectedStatus, setSelectedStatus] = useState(getInitialStatus);
    const [selectedExecutive, setSelectedExecutive] = useState(getInitialExecutive);
    const [hearAboutUs, setHearAboutUs] = useState(() => {
      const urlValues = searchParams.get("hear_about_us");
      const fromState = initialState.hearAboutUs;

      const toArray = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
          return value
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean);
        }
        return [];
      };

      if (fromState) return toArray(fromState);
      if (urlValues) return toArray(urlValues);
      return [];
    });
    const [duplicateCheck, setDuplicateCheck] = useState(
      initialState.duplicateCheck || 'all',
    );
    const [showDateModal, setShowDateModal] = useState(false);

    const [isVisible, setIsVisible] = useState(false);
    const [globalFilter, setGlobalFilter] = useState(initialState.search || "");
    const [leadsData, setLeadsData] = useState([]);
    const [pagination, setPagination] = useState({
      pageIndex: initialState.pageIndex,
      pageSize: initialState.pageSize,
    });
    const [sorting, setSorting] = useState(initialState.sorting);

    // Restore date range from sessionStorage (convert ISO strings to dayjs objects)
    const [dateRange, setDateRange] = useState(() => {
      if (initialState.dateRange && Array.isArray(initialState.dateRange) && initialState.dateRange.length === 2) {
        const dayjs = require('dayjs');
        return [
          initialState.dateRange[0] ? dayjs(initialState.dateRange[0]) : null,
          initialState.dateRange[1] ? dayjs(initialState.dateRange[1]) : null,
        ];
      }
      return null;
    });



    // Custom handler to ensure sorting state is properly maintained
    const handleSortingChange = useCallback((updater) => {
      setSorting((prev) => {
        const newSorting = typeof updater === 'function' ? updater(prev) : updater;
        // Ensure we always have a valid array
        const result = Array.isArray(newSorting) ? newSorting : [];
        // Debug logging to track sorting state changes
        console.log('Sorting state changed:', {
          prev,
          newSorting,
          result,
          firstItem: result[0]
        });
        return result;
      });
    }, []);

    const [remarksModal, setRemarksModal] = useState({ visible: false, lead: null, forStatusChange: false, newStatus: null });
    const [remarksLoading, setRemarksLoading] = useState(false);
    const [proposalFile, setProposalFile] = useState(null);
    const proposalInputRef = useRef(null);
    const [jobsLeadId, setJobsLeadId] = useState(null);
    const [updatingProjectSizeId, setUpdatingProjectSizeId] = useState(null);
    const [assignmentModal, setAssignmentModal] = useState({ visible: false, lead: null, newAssigneeId: null, newAssigneeName: null });
    const [columnVisibility, setColumnVisibility] = useState({});
    const [rowSelection, setRowSelection] = useState({});
    const [proposalModal, setProposalModal] = useState({ visible: false, data: null, loading: false });
    const [followUpModal, setFollowUpModal] = useState({ visible: false, lead: null });
    const [userAssignmentModalVisible, setUserAssignmentModalVisible] = useState(false);

    // Status history modal (admin only)
    const [statusHistoryModal, setStatusHistoryModal] = useState({ visible: false, entity: null });

    // Duplicate lead hook
    const { duplicateModal, openDuplicateModal, closeDuplicateModal, isDuplicate, getRowStyle } = useDuplicateLead();







    const queryClient = useQueryClient();

    // Fetch lead stats for executive counts (needed before executivesList for marketing_manager)
    const {
      data: leadStatsData,
      isLoading: loadingLeadStats,
      refetch: refetchLeadStats
    } = useQuery('leadStats', fetchLeadStats, {
      staleTime: 5 * 60 * 1000, // 5 minutes - stats change when leads are updated
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false
    });

    // Fetch executives/managers list for assignment (same as lead-card)
    // Marketing managers use leadStatsData instead, so they don't need this API
    const { data: assigningUsersData, isLoading: loadingAssigningUsers } = useQuery({
      queryKey: ['executiveList', user?.id, user?.user_type],
      queryFn: () => getManangersExecutives(userType),
      enabled: ['sales_manager', 'admin', 'super_admin', 'company_admin'].includes(userType),
      staleTime: 10 * 60 * 1000,
      cacheTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false
    });

    // Executive tabs: list and count from stats API only (lead-generation/stats)
    const executivesList = useMemo(() => {
      return Array.isArray(leadStatsData) ? leadStatsData : [];
    }, [leadStatsData]);
    const assigneeOptions = useMemo(() => Array.isArray(assigningUsersData) ? assigningUsersData : [], [assigningUsersData]);


    const [statusTabs, setStatusTabs] = useState([]);
    const getStatusCount = useCallback(
      (counts, key) => (counts && counts[key] !== undefined ? counts[key] : 0),
      [],
    );


    const [statusCounts, setStatusCounts] = useState({});

    // Persist all table state to URL params and sessionStorage
    useEffect(() => {
      // Save full state to sessionStorage (includes pagination, sorting, search, dateRange)
      try {
        // Normalize to single values for storage
        const normalizedStatus = Array.isArray(selectedStatus)
          ? (selectedStatus.length > 0 ? selectedStatus[0] : '')
          : selectedStatus;
        const normalizedExecutive = Array.isArray(selectedExecutive)
          ? (selectedExecutive.length > 0 ? selectedExecutive[0] : '')
          : selectedExecutive;
        const normalizedHearAboutUs = Array.isArray(hearAboutUs)
          ? hearAboutUs
          : (hearAboutUs ? [hearAboutUs] : []);

        const stateToSave = {
          status: normalizedStatus,
          selectedExecutive: normalizedExecutive,
          hearAboutUs: normalizedHearAboutUs,
          duplicateCheck,
          search: globalFilter,
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          sorting: sorting,
          timestamp: Date.now(),
        };

        // Serialize date range to ISO strings for storage
        if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
          stateToSave.dateRange = [
            dateRange[0] ? dateRange[0].toISOString() : null,
            dateRange[1] ? dateRange[1].toISOString() : null,
          ];
        }

        sessionStorage.setItem('tableState_leads-page', JSON.stringify(stateToSave));
      } catch (e) {
        console.warn('Failed to save table state:', e);
      }

      // Update URL params (only status and executive for backwards compatibility)
      const params = searchParams.get('company_id') ? { company_id: searchParams.get('company_id') } : {};
      // Normalize to single values (handle arrays by taking first value)
      const normalizedStatus = Array.isArray(selectedStatus)
        ? (selectedStatus.length > 0 ? selectedStatus[0] : '')
        : selectedStatus;
      const normalizedExecutive = Array.isArray(selectedExecutive)
        ? (selectedExecutive.length > 0 ? selectedExecutive[0] : '')
        : selectedExecutive;
      const normalizedHearAboutUsForUrl = Array.isArray(hearAboutUs)
        ? hearAboutUs
        : (hearAboutUs ? [hearAboutUs] : []);

      if (normalizedStatus) params.status = normalizedStatus;
      if (normalizedExecutive) params.executive = normalizedExecutive;
      if (normalizedHearAboutUsForUrl.length > 0) {
        params.hear_about_us = normalizedHearAboutUsForUrl.join(',');
      }
      setSearchParams(params, { replace: true });
    }, [selectedStatus, selectedExecutive, hearAboutUs, duplicateCheck, globalFilter, pagination.pageIndex, pagination.pageSize, sorting, dateRange]);

    // Helper function to reset all persistent filters (except the tab selection)
    const resetAllFilters = () => {
      // Reset pagination
      setPagination({ pageIndex: 0, pageSize: 10 });
      // Reset sorting
      setSorting([]);
      // Reset global filter (search)
      setGlobalFilter('');
      // Reset date range
      setDateRange(null);
      // Close date modal if open
      setShowDateModal(false);
      // Reset hear about us filter
      setHearAboutUs([]);
    };


    // Reset pagination when filters change (but not on initial mount or tab switches)
    const isInitialMount = useRef(true);
    useEffect(() => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return; // Skip reset on initial mount to preserve loaded pagination
      }
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, [globalFilter, dateRange, selectedExecutive, duplicateCheck, hearAboutUs]); // Removed selectedStatus - handled manually in tab clicks


    const {
      data: leadCounts,
      isLoading: isCountsLoading,
      refetch: refetchCounts
    } = useQueryApi({
      key: ['leadCounts', selectedExecutive, duplicateCheck, hearAboutUs, dateRange?.[0]?.format('YYYY-MM-DDTHH:mm:ssZ'), dateRange?.[1]?.format('YYYY-MM-DDTHH:mm:ssZ')],
      url: '/lead-generation/list-count',
      params: {
        ...(selectedExecutive && {
          assigned_to: Array.isArray(selectedExecutive)
            ? (selectedExecutive.length > 0 ? selectedExecutive[0] : '')
            : selectedExecutive
        }),
        ...(duplicateCheck === 'duplicate' ? { is_duplicate: true } : {}),
        ...(duplicateCheck === 'not_duplicate' ? { is_duplicate: false } : {}),
        ...(Array.isArray(hearAboutUs) && hearAboutUs.length > 0
          ? { hear_about_us: hearAboutUs.join(',') }
          : (!Array.isArray(hearAboutUs) && hearAboutUs
            ? { hear_about_us: hearAboutUs }
            : {})),
        ...(dateRange?.[0] && { start_date: dateRange[0].format('YYYY-MM-DDTHH:mm:ssZ') }),
        ...(dateRange?.[1] && { end_date: dateRange[1].format('YYYY-MM-DDTHH:mm:ssZ') }),
      },
      options: {
        staleTime: 0, // Always consider data stale for count query
        cacheTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false
      }
    });

    // Hear About Us options for marketing manager filter
    const {
      data: hearAboutUsOptionsData,
    } = useQueryApi({
      key: ['hearAboutUsOptions'],
      url: '/lead-generation/hear_about_us_options',
      params: {},
      options: {
        staleTime: 10 * 60 * 1000,
        cacheTime: 15 * 60 * 1000,
        refetchOnWindowFocus: false,
      },
    });

    const hearAboutUsOptions = useMemo(() => {
      if (Array.isArray(hearAboutUsOptionsData)) {
        return hearAboutUsOptionsData;
      }
      if (hearAboutUsOptionsData && Array.isArray(hearAboutUsOptionsData.data)) {
        return hearAboutUsOptionsData.data;
      }
      return [];
    }, [hearAboutUsOptionsData]);

    useEffect(() => {
      const tabs = [
        { label: 'All', value: '', apiKey: 'total_count' },
        ...STATUS_OPTIONS.map((status) => ({
          label: status,
          value: status,
          apiKey: toStatusKey(status),
        })),
        { label: 'Unassigned', value: 'Unassigned', apiKey: 'unassigned' },
        { label: 'Other', value: 'Other', apiKey: 'other' },
      ];
      setStatusTabs(tabs);
    }, []);

    // Only set title and mount component if we're actually on the leads page
    useEffect(() => {
      const isLeadsPage = (location.pathname.includes('/leads') || location.pathname.includes('/'));
      setIsVisible(isLeadsPage);

      if (isLeadsPage && !isDashboard) {
        document.title = 'Leads | Search O Pal';
      }
    }, [location.pathname, isDashboard]);

    // Get the base path based on user type
    const getBasePath = () => {
      switch (userType) {
        case 'admin':
          return '/admin';
        case 'sales_manager':
          return '/sales-manager';
        case 'sales_executive':
          return '/sales-executive';
        default:
          return '/sales-manager';
      }
    };

    const basePath = getBasePath();




    // Serialize sorting state for proper cache invalidation
    const activeSort = sorting && sorting.length > 0 && sorting[0]?.id ? sorting[0] : null;
    const sortField = activeSort?.id || null;
    const sortDirection = activeSort?.desc !== undefined ? activeSort.desc : null;

    // Extract sorting parameters properly for API
    // Only include sort parameters if there's an active sort
    const sortBy = sortField || '';
    const sortOrder = sortField ? (sortDirection === true ? 'desc' : 'asc') : 'asc';

    // Helper to format filter params for API
    const formatStatusParam = () => {
      const normalizedStatus = Array.isArray(selectedStatus)
        ? (selectedStatus.length > 0 ? selectedStatus[0] : '')
        : selectedStatus;
      return normalizedStatus ? `&status=${encodeURIComponent(normalizedStatus)}` : '';
    };

    const formatExecutiveParam = () => {
      const normalizedExecutive = Array.isArray(selectedExecutive)
        ? (selectedExecutive.length > 0 ? selectedExecutive[0] : '')
        : selectedExecutive;
      return normalizedExecutive ? `&assigned_to=${encodeURIComponent(normalizedExecutive)}` : '';
    };

    const formatHearAboutUsParam = () => {
      const values = Array.isArray(hearAboutUs)
        ? hearAboutUs
        : (hearAboutUs ? [hearAboutUs] : []);
      if (!values.length) return '';
      return `&hear_about_us=${encodeURIComponent(values.join(','))}`;
    };

    const apiEndpoint =
      (userType === 'super_admin' || userType === 'sales_manager' || 'sales_executive')
        ? `/lead-generation/list?page=${pagination.pageIndex + 1}&size=${pagination.pageSize}&search=${globalFilter}&sort_by=${sortBy}&order=${sortOrder}${formatStatusParam()}${formatExecutiveParam()}${formatHearAboutUsParam()}${duplicateCheck === 'duplicate' ? '&is_duplicate=true' : ''}${duplicateCheck === 'not_duplicate' ? '&is_duplicate=false' : ''}${dateRange?.[0] ? `&start_date=${encodeURIComponent(dateRange[0].format('YYYY-MM-DDTHH:mm:ssZ'))}` : ''}${dateRange?.[1] ? `&end_date=${encodeURIComponent(dateRange[1].format('YYYY-MM-DDTHH:mm:ssZ'))}` : ''}`
        : `/lead-generation/list?id=${user?.id}&page=${pagination.pageIndex + 1}&size=${pagination.pageSize}&search=${globalFilter}&sort_by=${sortBy}&order=${sortOrder}${formatStatusParam()}${formatHearAboutUsParam()}${duplicateCheck === 'duplicate' ? '&is_duplicate=true' : ''}${duplicateCheck === 'not_duplicate' ? '&is_duplicate=false' : ''}${dateRange?.[0] ? `&start_date=${encodeURIComponent(dateRange[0].format('YYYY-MM-DDTHH:mm:ssZ'))}` : ''}${dateRange?.[1] ? `&end_date=${encodeURIComponent(dateRange[1].format('YYYY-MM-DDTHH:mm:ssZ'))}` : ''}`;

    console.log('API Endpoint:', apiEndpoint);


    const { isLoading, data, isError, error, refetch } = useQuery(
      [
        'leads',
        pagination.pageIndex,
        pagination.pageSize,
        globalFilter,
        sortField, // Serialized sorting field
        sortDirection, // Serialized sorting direction
        userType,
        selectedStatus,
        selectedExecutive,
        duplicateCheck,
        hearAboutUs,
        dateRange?.[0]?.format('YYYY-MM-DDTHH:mm:ssZ'),
        dateRange?.[1]?.format('YYYY-MM-DDTHH:mm:ssZ')
      ],
      async () => await api.get(apiEndpoint),
      {
        enabled: (location.pathname.includes('/leads') || location.pathname.includes('/')),
        staleTime: 0, // Always consider data stale - ensures fresh data on every change
        cacheTime: 0, // Don't cache - ensures sorting changes trigger immediate refetch
        refetchOnWindowFocus: false,
        refetchOnMount: true,
      }
    );


    // useEffect(() => {
    //   if (data?.data?.results) {
    //     setLeadsData(data.data.results);
    //   }
    // }, [data]);

    const sendUpdate = async (payload) => {
      console.log('=== sendUpdate DEBUG ===');
      console.log('Full payload received in sendUpdate:', payload);

      const formatSelectedJobIds = (value) => {
        if (Array.isArray(value)) {
          return value.join(',');
        }
        if (typeof value === 'string') {
          return value;
        }
        return '';
      };

      const shouldInclude = (value) => {
        if (value === undefined || value === null) return false;
        if (typeof value === 'string') {
          return value.trim() !== '';
        }
        return true;
      };

      const requestData = {
        status: payload.status,
      };

      if ('selected_job_ids' in payload) {
        requestData.selected_job_ids = formatSelectedJobIds(payload.selected_job_ids);
      }

      const fieldsToCopy = [
        'total_vacancies',
        'job_count',
        'contract_currency',
        'contract_subtotal_amount',
        'discount_amount',
        'discount_percentage',
        'contract_price',
        'total_contract_amount',
        'pricing_type',
      ];

      fieldsToCopy.forEach((field) => {
        if (shouldInclude(payload[field])) {
          requestData[field] = payload[field];
        }
      });

      if (shouldInclude(payload.remarks)) {
        requestData.remarks = payload.remarks;
      }

      const formData = new FormData();
      Object.entries(requestData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) formData.append(key, value);
      });
      const response = await api.patch(`/lead-generation/update/${encodeURIComponent(payload.id)}`, formData);
      if (response.data?.status === false || response.data?.success === false) throw new Error(response.data.message || 'Could not update lead.');
      return response;
    };


    const updateStatusMutation = useMutation(sendUpdate, {
      onSuccess: (response, payload) => {
        message.success(response?.data?.message);
        queryClient.invalidateQueries('leads', { exact: false });
        setRemarksModal({ visible: false, lead: null, forStatusChange: false, newStatus: null });
        refetchCounts();
      },
      onError: (error) => {
        message.error(error?.response?.data?.message || error?.message || "Failed to update status/remarks");
      },
    });

    // Project size update mutation
    const updateProjectSizeMutation = useMutation(
      ({ leadId, projectSize }) => {
        return api.patch(`/lead-generation/update/${leadId}`, { project_size: projectSize });
      },
      {
        onMutate: ({ leadId }) => {
          setUpdatingProjectSizeId(leadId);
        },
        onSuccess: (response) => {
          message.success(response?.data?.message || 'Project size updated successfully');
          queryClient.invalidateQueries('leads', { exact: false });
          refetch();
          setUpdatingProjectSizeId(null);
        },
        onError: (error) => {
          message.error(error?.response?.data?.message || 'Failed to update project size');
          setUpdatingProjectSizeId(null);
        },
      }
    );

    // Handle project size change
    const handleProjectSizeChange = (lead, newProjectSize) => {
      if (isLeadConvertedToClient(lead)) return;
      updateProjectSizeMutation.mutate({
        leadId: lead.id,
        projectSize: newProjectSize
      });
    };

    // Assignment mutation (same as lead-card)
    const assignmentMutation = useMutation(
      async ({ leadId, userId }) => {
        const formData = new FormData();
        formData.append('assigned_to', userId);
        const { data } = await api.patch(`/lead-generation/update/${encodeURIComponent(leadId)}`, formData);
        if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not update assignee.');
        return data;
      },
      {
        onSuccess: (data) => {
          message.success(data?.message || 'Lead reassigned successfully');
          queryClient.invalidateQueries('leads');
          refetch();
          refetchCounts();
          setAssignmentModal({ visible: false, lead: null, newAssigneeId: null, newAssigneeName: null });
        },
        onError: (error) => {
          message.error(error?.message || 'Failed to reassign lead');
          setAssignmentModal({ visible: false, lead: null, newAssigneeId: null, newAssigneeName: null });
        },
      }
    );

  const followUpMutation = useMutation(
    ({ leadId, payload }) => createWebsiteLeadFollowUp(leadId, payload),
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Website follow up saved successfully');
        queryClient.invalidateQueries('leads', { exact: false });
        refetch();
      },
      onError: (error) => {
        message.error(error?.response?.data?.message || error?.message || 'Failed to save website follow up');
      },
    }
  );

    // Handle assignment change - show confirmation modal
    const handleAssignmentChange = (lead, newAssigneeName) => {
      if (isLeadConvertedToClient(lead)) return;
      const newAssignee = assigneeOptions.find((user) => String(user.id) === String(newAssigneeName));
      if (!newAssignee) {
        message.error("Selected assignee not found");
        return;
      }

      // Don't show modal if assigning to the same person
      const currentAssigneeId = lead.assigned_to;
      const newAssigneeId = newAssignee.id;
      if (currentAssigneeId && String(currentAssigneeId) === String(newAssigneeId)) {
        return;
      }

      // Set modal state - this will trigger the confirmation modal
      setAssignmentModal({
        visible: true,
        lead: { ...lead }, // Create a copy to ensure React detects the change
        newAssigneeId: newAssignee.id,
        newAssigneeName: newAssignee.name
      });
    };

    // Confirm assignment - call API directly like statusColumn
    const confirmAssignment = () => {
      if (!assignmentModal.lead || !assignmentModal.newAssigneeId) return;

      // Call API directly, same pattern as statusColumn's onDirectStatusUpdate
      assignmentMutation.mutate({
        leadId: assignmentModal.lead.id,
        userId: assignmentModal.newAssigneeId
      });
    };



    // CSV export handler
    const handleExportSelected = async () => {
      try {
        const selectedRowIds = Object.keys(rowSelection).filter((key) => rowSelection[key]);
        const safeResults = Array.isArray(leadsData) ? leadsData : [];
        const selectedRows = safeResults.filter((row) => selectedRowIds.includes(String(row.id)));

        if (selectedRows.length === 0) {
          message.info("No rows selected for export.");
          return;
        }

        // Transform data to use display names instead of IDs
        const transformedRows = selectedRows.map((row) => {
          const transformedRow = { ...row };

          if (transformedRow.assigned_to_name) {
            transformedRow.assigned_to = transformedRow.assigned_to_name;
          } else {
            transformedRow.assigned_to = '-';
          }

          return transformedRow;
        });

        // Get columns for CSV (excluding action/icon columns)
        const csvColumns = columns.filter(
          (col) =>
            col.accessorKey &&
            !['row_number', 'remarks', 'follow_up', 'proposal', 'status_history_website'].includes(col.accessorKey)
        );

        const csv = arrayToCSV(transformedRows, csvColumns);
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `website-leads-selected-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 0);
        message.success(`${selectedRows.length} leads exported successfully!`);
      } catch (err) {
        message.error("Failed to export selected leads.");
      }
    };

    const columns = useMemo(() => {
      // Extra columns that should be placed at the end
      const extraColumns = [
        {
          header: 'Date',
          accessorKey: 'created_at',
          size: 0.5,
          Cell: ({ cell }) => (
            <span style={{ whiteSpace: 'nowrap' }}>
              {cell.getValue() ? formatDateUniversal(cell.getValue(), true) : '-'}
            </span>
          ),
        },
        // Assigned To - editable for sales managers and admin, exclude for sales_executive
        ...(userType !== 'sales_executive' ? [
          createAssignedToColumn({
            useAssigneeIds: true,
            userType,
            user,
            executivesList: assigneeOptions,
            onAssignmentChange: handleAssignmentChange,
            isLoading: assignmentMutation.isLoading,
            loadingAssigningUsers,
          })
        ] : []),
        // UTM Columns - only for marketing managers (at the end)
        ...(userType === 'marketing_manager' ? [
          {
            header: 'UTM Source',
            accessorKey: 'utm_source',
            size: 0.5,
            Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
          },
          {
            header: 'UTM Medium',
            accessorKey: 'utm_medium',
            size: 0.5,
            Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
          },
          {
            header: 'UTM Campaign',
            accessorKey: 'utm_campaign',
            size: 0.5,
            Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
          },
          {
            header: 'UTM Content',
            accessorKey: 'utm_content',
            size: 0.5,
            Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
          },
        ] : []),
        // Is Link From - marketing manager only
        ...(userType === 'marketing_manager' ? [
          {
            header: 'Is From Link',
            accessorKey: 'is_from_link',
            size: 0.5,
            Cell: ({ cell }) => {
              const val = cell.getValue();
              if (val === null || val === undefined || val === '') return <span></span>;
              if (val === false || val === 'false') return <span>False</span>;
              return <span>True</span>;
            },
          },
        ] : []),
        // Hear About Us - last column for all users
        {
          header: 'Hear About Us',
          id: 'hear_about_us',
          accessorKey: 'hear_about_us',
          size: 0.5,
          sortUndefined: 'last',
          sortDescFirst: false,
          Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
        },
        // Status History is available to Super Admin, including the legacy admin role.
        ...(isSuperAdmin(userType) ? [
          createStatusHistoryColumn({
            header: 'Status History',
            buttonTitle: 'View lead history',
            onOpenHistory: (entity) => setStatusHistoryModal({ visible: true, entity }),
            accessorKey: 'status_history_website',
          }),
        ] : []),
      ];

      const tableColumns = [
        // 0. Row Number - FIRST COLUMN
        {
          header: '#',
          accessorKey: 'row_number',
          size: 60,
          enableSorting: false,
          Cell: ({ row }) => {
            const rowIndex = row.index;
            const pageIndex = pagination.pageIndex;
            const pageSize = pagination.pageSize;
            return <span>{pageIndex * pageSize + rowIndex + 1}</span>;
          },
        },
        // 2. Old remarks (read-only for sales — use follow-up flow for new remarks)
        {
          header: 'Old Remarks',
          id: 'remarks',
          accessorKey: 'remarks',
          size: 0.5,
          sortUndefined: 'last',
          sortDescFirst: false,
          Cell: ({ row }) => (
            <CommentOutlined size="1em"
              className={["app-icon", `table-remarks-icon ${row.original.remarks ? 'table-remarks-icon--filled' : 'table-remarks-icon--empty'}`].filter(Boolean).join(' ')}
              onClick={() => {
                setRemarksModal({ visible: true, lead: row.original, forStatusChange: false, newStatus: null });
              }}
            />
          ),
        },
        ...(['admin', 'super_admin', 'company_admin', 'sales_manager', 'sales_executive'].includes(userType) ? [{
          header: 'Follow Ups and Remarks',
          id: 'follow_up',
          accessorKey: 'follow_up',
          enableSorting: false,
          size: 0.65,
          Cell: ({ row }) => (
            <Tooltip title={<span style={{ color: '#fff' }}>Follow Ups and Remarks</span>}>
              <ClockCircleOutlined size="1em" className="app-icon"
                role="button"
                tabIndex={0}
                aria-label="Follow Ups and Remarks"
                style={{ cursor: 'pointer', fontSize: 18, color: '#3E6A9F' }}
                onClick={() => {
                  setFollowUpModal({ visible: true, lead: row.original });
                }}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setFollowUpModal({ visible: true, lead: row.original });
                  }
                }}
              />
            </Tooltip>
          ),
        }] : []),
        // // 1. Lead assignment date
        // {
        //   header: 'Lead Assignment Date',
        //   id: 'assigned_at',
        //   accessorKey: 'assigned_at',
        //   size: 0.5,
        //   sortUndefined: 'last',
        //   sortDescFirst: false,
        //   Cell: ({ cell }) => (
        //     <span style={{ whiteSpace: 'nowrap' }}>
        //       {cell.getValue() ? formatDateUniversal(cell.getValue(), false) : '-'}
        //     </span>
        //   ),
        // },
        // 2. Status — use createStatusColumn for all users (it handles permissions based on converted_to_client)
        createStatusColumn({
          statusOptions: STATUS_OPTIONS,
          requireRemarksForAll: true,
          editableRoles: ['admin', 'super_admin', 'company_admin', 'sales_manager', 'sales_executive'],
          statusesRequiringRemarks: STATUSES_REQUIRING_REMARKS,
          statusColors,
          userType,
          user,
          onOpenRemarksModal: (lead, newStatus) => {
            setRemarksModal({
              visible: true,
              lead: { ...lead },
              forStatusChange: true,
              newStatus,
            });
          },
          onDirectStatusUpdate: (lead, newStatus) => {
            updateStatusMutation.mutate({
              id: lead.id,
              status: newStatus,
              total_vacancies: lead.total_vacancies,
              selected_job_ids: [],
            });
          },
          isLoading: updateStatusMutation.isLoading,
        }),
        // 3. Client contact date
        {
          header: 'Client Contact Date',
          id: 'contact_date',
          accessorKey: 'contact_date',
          size: 0.5,
          sortUndefined: 'last',
          sortDescFirst: false,
          Cell: ({ cell }) => (
            <span style={{ whiteSpace: 'nowrap' }}>
              {cell.getValue() ? formatDateUniversal(cell.getValue(), false) : '-'}
            </span>
          ),
        },
        // 4. Follow up date
        {
          header: 'Follow Up Date',
          id: 'follow_up_date',
          accessorKey: 'follow_up_date',
          size: 0.5,
          sortUndefined: 'last',
          sortDescFirst: false,
          Cell: ({ cell }) => (
            <span style={{ whiteSpace: 'nowrap' }}>
              {cell.getValue() ? formatDateUniversal(cell.getValue(), false) : '-'}
            </span>
          ),
        },
        // 6. Company
        {
          header: 'Company',
          accessorKey: 'company_name',
          size: 220,
          Cell: ({ cell }) => <Space>
            <Avatar size={40} style={{ flexShrink: 0, backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }} aria-hidden="true">
              {Array.from(String(cell.getValue() || '').trim())[0]?.toUpperCase() || '?'}
            </Avatar>
            <span>{cell.getValue() || '-'}</span>
          </Space>,
        },
        // 7. Name
        {
          header: 'Name',
          accessorKey: 'contact_person_name',
          size: 0.5,
          Cell: ({ cell, row }) => {
            const name = cell.getValue();
            const lead = row.original;
            const isDuplicateLead = isDuplicate(lead);
            const isFollowupDelayed =
              lead?.is_followup_delayed === true || lead?.is_followed_delayed === true;

            const duplicateIcon = isDuplicateLead && (
              <Tooltip title="View duplicate information">
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    padding: '2px 6px',
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openDuplicateModal(lead);
                  }}
                >
                  <MinusOutlined size="1em" className="app-icon" style={{ color: '#595959', fontSize: '12px' }} />
                  <InfoCircleOutlined size="1em" className="app-icon" style={{ color: '#fa8c16', fontSize: '12px' }} />
                </span>
              </Tooltip>
            );
            const delayedInfoIcon = isFollowupDelayed && (
              <Tooltip title="This follow up is delayed">
                <InfoCircleOutlined size="1em" className="app-icon" style={{ color: '#ff4d4f', fontSize: '14px' }} />
              </Tooltip>
            );

            // Marketing managers see simple text, no hyperlink
            if (userType === 'marketing_manager') {
              return (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {name}
                  {delayedInfoIcon}
                  {duplicateIcon}
                </span>
              );
            }

            // Other users see hyperlink
            const identifierQuery = row.original.identifier ? `?identifier=${encodeURIComponent(row.original.identifier)}` : '';
            const leadHref = getRolePath(userType, `/leads/${row.original.id}${identifierQuery}`);
            return (
              <Tooltip title="View lead details">
                <a
                  style={{ textDecoration: 'underline', color: '#3E6A9F', display: 'flex', alignItems: 'center', gap: '6px' }}
                  href={leadHref}
                  onClick={(e) => { e.preventDefault(); navigate(leadHref); }}
                >
                  {name}
                  {delayedInfoIcon}
                  {duplicateIcon}
                </a>
              </Tooltip>
            );
          },
        },
        // 8. Phone
        {
          header: 'Phone',
          accessorKey: 'phone_number',
          size: 0.5,
          Cell: ({ cell }) => (
            <Tooltip title="Click to copy phone">
              <span
                className="cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(cell.getValue());
                  message.success('Phone No. copied to clipboard');
                }}
              >
                {cell.getValue()}
              </span>
            </Tooltip>
          ),
        },
        // 9. Email
        {
          header: 'Email',
          accessorKey: 'email',
          size: 0.5,
          Cell: ({ cell }) => (
            <Tooltip title="Click to copy email">
              <span
                className="cursor-pointer"
                onClick={async () => {
                  const text = cell.getValue();
                  try {
                    if (navigator.clipboard?.writeText) {
                      await navigator.clipboard.writeText(text);
                      message.success('Email copied to clipboard');
                    } else {
                      throw new Error("Clipboard API not supported");
                    }
                  } catch (err) {
                    message.error('Failed to copy email');
                  }
                }}
              >
                {cell.getValue()}
              </span>
            </Tooltip>
          ),
        },
        // 10. Designation
        {
          header: 'Designation',
          accessorKey: 'contact_person_designation',
          size: 0.5,
          Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
        },
        // 11. Job
        ...(userType !== 'marketing_manager' ? [{
          header: 'Job',
          accessorKey: 'job_count',
          size: 0.5,
          Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
        }] : []),
        // 12. No. of Resources
        {
          header: 'No. of Resources',
          accessorKey: 'total_vacancies',
          size: 0.5,
          Cell: ({ cell }) => {
            const raw = cell.getValue();
            const value = Number(raw);
            if (!raw && raw !== 0) return <span>-</span>;
            return <span>{Number.isFinite(value) ? (value > 100 ? '100+' : value) : '-'}</span>;
          },
        },
        // 13. Proposal
        {
          header: 'Proposal',
          id: 'proposal',
          accessorKey: 'proposal',
          size: 0.5,
          sortUndefined: 'last',
          sortDescFirst: false,
          Cell: ({ row }) => {
            const proposalFileName = row.original.proposal;
            const handleProposalClick = async () => {
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
            return proposalFileName ? (
              <Tooltip title="View Proposal">
                <FilePdfOutlined size="1em" className="app-icon"
                  style={{ fontSize: 20, color: '#d4380d', cursor: 'pointer' }}
                  onClick={handleProposalClick}
                />
              </Tooltip>
            ) : null;
          },
        },

        // 14. Contract Currency
        {
          header: 'Contract Currency',
          id: 'contract_currency',
          accessorKey: 'contract_currency',
          size: 0.5,
          sortUndefined: 'last',
          sortDescFirst: false,
          Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
        },
        // 15. Contract Amount
        {
          header: 'Contract Amount',
          id: 'contract_price',
          accessorKey: 'contract_price',
          size: 0.5,
          sortUndefined: 'last',
          sortDescFirst: false,
          Cell: ({ cell }) => <span>{cell.getValue() ? cell.getValue().toLocaleString() : '-'}</span>,
        },
        // 16. Industry
        {
          header: 'Industry',
          id: 'industry',
          accessorKey: 'industry',
          size: 0.5,
          sortUndefined: 'last',
          sortDescFirst: false,
          Cell: ({ row }) => (
            <span>
              {row.original.industry || row.original.industry_sector || '-'}
            </span>
          ),
        },
        // 17. Project Size - for sales managers and sales executives
        ...((userType === 'sales_manager' || userType === 'sales_executive') ? [{
          header: 'Project Size',
          id: 'project_size',
          accessorKey: 'project_size',
          sortUndefined: 'last',
          sortingFn: undefined,
          sortDescFirst: false,
          Cell: ({ cell, row }) => {
            const currentValue = cell.getValue();
            const isUpdating = updatingProjectSizeId === row.original.id;

            // Marketing managers can only view, not edit
            if (userType === 'marketing_manager') {
              return <span>{currentValue || '-'}</span>;
            }

            // Sales managers and executives can edit
            return (
              <Select
                value={currentValue || undefined}
                options={PROJECT_SIZE_OPTIONS}
                onChange={(value) => handleProjectSizeChange(row.original, value)}
                loading={isUpdating}
                placeholder="Select Project Size"
                popupMatchSelectWidth={false}
                style={{ width: 'fit-content', minWidth: '120px' }}
                disabled={isUpdating || isLeadConvertedToClient(row.original)}
              />
            );
          },
        }] : []),
        // Extra columns at the end
        ...extraColumns,
      ];
      const leadingKeys = ['row_number', 'company_name', 'contact_person_name'];
      return [
        ...leadingKeys.map(key => tableColumns.find(column => column.accessorKey === key)),
        ...tableColumns.filter(column => !leadingKeys.includes(column.accessorKey)),
      ];
    }, [userType, navigate, user, updateStatusMutation.isLoading, PROJECT_SIZE_OPTIONS, updatingProjectSizeId, handleProjectSizeChange, executivesList, loadingAssigningUsers, handleAssignmentChange, pagination]);



    useEffect(() => {
      if (data?.data?.results) {
        setLeadsData(data.data.results);
      }
    }, [data]);

    // Reset row selection when data changes to prevent index mismatch errors
    useEffect(() => {
      setRowSelection({});
    }, [data]);

    useEffect(() => {
      if (isVisible) {
        refetch();
      }
    }, [isVisible, refetch]);

    const handleTabClick = (status) => {
      // Normalize status to single value
      const normalizedStatus = Array.isArray(status) ? (status.length > 0 ? status[0] : '') : status;
      setSelectedStatus(normalizedStatus);
      setPagination({ pageIndex: 0, pageSize: 10 });
      setSorting([]);
      setGlobalFilter('');

      // Update URL with status parameter
      const params = searchParams.get('company_id') ? { company_id: searchParams.get('company_id') } : {};
      const normalizedExecutive = Array.isArray(selectedExecutive)
        ? (selectedExecutive.length > 0 ? selectedExecutive[0] : '')
        : selectedExecutive;
      const normalizedHearAboutUs = Array.isArray(hearAboutUs)
        ? hearAboutUs
        : (hearAboutUs ? [hearAboutUs] : []);

      if (normalizedStatus) params.status = normalizedStatus;
      if (normalizedExecutive) params.executive = normalizedExecutive;
      if (normalizedHearAboutUs.length > 0) {
        params.hear_about_us = normalizedHearAboutUs.join(',');
      }
      setSearchParams(params);
    };

    const handleExecutiveClick = (executiveId) => {
      // Normalize executiveId to single value
      const normalizedExecutiveId = Array.isArray(executiveId)
        ? (executiveId.length > 0 ? executiveId[0] : '')
        : executiveId;
      setSelectedExecutive(normalizedExecutiveId);
      // Don't reset status - allow both to be selected simultaneously
      // Reset all persistent filters except status
      setPagination({ pageIndex: 0, pageSize: 10 });
      setSorting([]);
      setGlobalFilter('');
      setDateRange(null);
      setShowDateModal(false);

      // Update URL with executive parameter (keep status if selected)
      const params = searchParams.get('company_id') ? { company_id: searchParams.get('company_id') } : {};
      const normalizedStatus = Array.isArray(selectedStatus)
        ? (selectedStatus.length > 0 ? selectedStatus[0] : '')
        : selectedStatus;
      const normalizedHearAboutUs = Array.isArray(hearAboutUs)
        ? hearAboutUs
        : (hearAboutUs ? [hearAboutUs] : []);

      if (normalizedExecutiveId) params.executive = normalizedExecutiveId;
      if (normalizedStatus) params.status = normalizedStatus;
      if (normalizedHearAboutUs.length > 0) {
        params.hear_about_us = normalizedHearAboutUs.join(',');
      }
      setSearchParams(params);

      // React Query will automatically refetch due to query key changes
    };

    // Handle date range change
    const handleDateRangeChange = (range) => {
      setDateRange(range);
      // React Query will automatically refetch due to query key dependencies
    };

    // Clear date range
    const clearDateRange = () => {
      setDateRange(null);
      setShowDateModal(false);
    };

    // Function to get count for a specific executive
    const getExecutiveCount = (executiveId) => {
      if (!leadStatsData || !Array.isArray(leadStatsData)) return 0;
      const executive = leadStatsData.find(stat => stat.id === executiveId);
      return executive ? executive.website_leads_assigned || 0 : 0;
    };

    // Don't render anything if we're not on the leads page
    if (!isVisible) {
      return null;
    }

    const tableContent = (
      <>

        {/* For Marketing Manager: Show dropdowns instead of tabs */}
        {userType === 'marketing_manager' ? (
          <MarketingManagerFilters
            executivesList={executivesList}
            statusTabs={statusTabs}
            selectedExecutive={selectedExecutive}
            selectedStatus={selectedStatus}
            hearAboutUs={hearAboutUs}
            hearAboutUsOptions={hearAboutUsOptions}
            duplicateCheck={duplicateCheck}
            onDuplicateCheckChange={(val) => {
              setDuplicateCheck(val || 'all');
              setPagination({ pageIndex: 0, pageSize: 10 });
            }}
            onExecutiveChange={handleExecutiveClick}
            onStatusChange={handleTabClick}
            onHearAboutUsChange={(values) => {
              const normalizedValues = Array.isArray(values)
                ? values.filter(Boolean)
                : (values ? [values] : []);
              setHearAboutUs(normalizedValues);
              setPagination({ pageIndex: 0, pageSize: 10 });
              setSorting([]);
              setGlobalFilter('');

              const params = searchParams.get('company_id') ? { company_id: searchParams.get('company_id') } : {};
              const normalizedStatus = Array.isArray(selectedStatus)
                ? (selectedStatus.length > 0 ? selectedStatus[0] : '')
                : selectedStatus;
              const normalizedExecutive = Array.isArray(selectedExecutive)
                ? (selectedExecutive.length > 0 ? selectedExecutive[0] : '')
                : selectedExecutive;

              if (normalizedStatus) params.status = normalizedStatus;
              if (normalizedExecutive) params.executive = normalizedExecutive;
              if (normalizedValues.length > 0) {
                params.hear_about_us = normalizedValues.join(',');
              }
              setSearchParams(params);
            }}
            getExecutiveCount={getExecutiveCount}
            getStatusCount={getStatusCount}
            leadCounts={leadCounts}
            userType={userType}
          />
        ) : (
          <div className="mb-4 grid gap-4">
            <section aria-label="Executives">
            <div className="flex flex-wrap items-center gap-2">
            {/* All Executives Tab */}
            <ExecutiveTabButton
              isSelected={selectedExecutive === ''}
              onClick={() => handleExecutiveClick('')}
            />

            {/* Individual Executive Tabs */}
            {executivesList.map(executive => {
              const isSelected = selectedExecutive === executive.id.toString();
              const executiveCount = getExecutiveCount(executive.id);
              return (
                <ExecutiveTabButton
                  key={executive.id}
                  executive={executive}
                  count={executiveCount}
                  isSelected={isSelected}
                  onClick={() => handleExecutiveClick(executive.id.toString())}
                />
              );
            })}

            </div>
            </section>
            {/* Status Tabs */}
            <WebsiteStatusTabs
              statusFilter={selectedStatus}
              setStatusFilter={handleTabClick}
              statusChoices={statusTabs.filter(tab =>
                tab.value !== 'Unassigned' || userType === 'super_admin' || userType === 'sales_manager' || userType === 'marketing_manager'
              )}
              getTotalCount={() => getStatusCount(leadCounts, 'total_count')}
              getStatusCount={(apiKey) => getStatusCount(leadCounts, apiKey)}
            />
          </div>
        )}

        {/* Export selected button */}
        {Object.keys(rowSelection).filter((key) => rowSelection[key]).length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px', paddingRight: '20px' }}>
            <Button
              icon={<DownloadOutlined size="1em" className="app-icon" />}
              onClick={handleExportSelected}
              style={{
                background: '#3E6A9F',
                color: 'white',
                borderColor: '#3E6A9F',
              }}
            >
              Export Selected ({Object.keys(rowSelection).filter((key) => rowSelection[key]).length})
            </Button>
          </div>
        )}

        <NewTableComponent
          totalCount={data?.data?.count}
          columns={columns}
          data={leadsData}
          initialState
          pagination={pagination}
          onPaginationChange={setPagination}
          onPageSizeChange
          sorting={sorting}
          onSortingChange={handleSortingChange}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          isLoading={isLoading}
          enableRowSelection={true}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          getRowId={(row) => row.id}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          heading={`Website Leads (${data?.data?.count || 0})`}
          getRowStyle={getRowStyle}
          pageSizeOptions={
            userType === 'marketing_manager'
              ? MARKETING_MANAGER_PAGE_SIZE_OPTIONS
              : undefined
          }
        />
      </>
    );

    const handleRemarksSave = async (remarks, contractData = {}) => {


      setRemarksLoading(true);
      try {
        const trimmedRemarks = typeof remarks === 'string' ? remarks.trim() : '';
        const includeRemarks = Boolean(trimmedRemarks);
        if (remarksModal.forStatusChange) {
          if (!includeRemarks) {
            message.error('Enter remarks before changing status.');
            return;
          }
          await updateStatusMutation.mutateAsync({ id: remarksModal.lead.id, status: remarksModal.newStatus, remarks: trimmedRemarks });
          return;
        }


        const isRemarksOnlyMode = !remarksModal.forStatusChange && !remarksModal.newStatus;

        console.log('isRemarksOnlyMode:', isRemarksOnlyMode);

        if (isRemarksOnlyMode) {

          console.log('Processing remarks-only update');

          const payload = {
            id: remarksModal.lead.id,

          };

          // Only add remarks if provided
          if (includeRemarks) {
            payload.remarks = trimmedRemarks;
          }



          await new Promise((resolve, reject) => {
            updateStatusMutation.mutate(payload, { onSuccess: resolve, onError: reject });
          });

          return; // Exit early for remarks-only mode
        }


        // Filter out empty values from contract data
        const filteredContractData = Object.entries(contractData || {}).reduce((acc, [key, value]) => {
          if (
            value === undefined ||
            value === null ||
            (typeof value === 'string' && value.trim() === '') ||
            (Array.isArray(value) && value.length === 0)
          ) {
            return acc;
          }
          acc[key] = value;
          return acc;
        }, {});

        // Ensure required fields have values from lead if not in contract data
        if (filteredContractData.total_vacancies === undefined && remarksModal.lead?.total_vacancies !== undefined) {
          filteredContractData.total_vacancies = remarksModal.lead.total_vacancies;
        }
        if (filteredContractData.job_count === undefined && remarksModal.lead?.job_count !== undefined) {
          filteredContractData.job_count = remarksModal.lead.job_count;
        }
        if (!filteredContractData.selected_job_ids) {
          filteredContractData.selected_job_ids = [];
        }

        const basePayload = includeRemarks ? { remarks: trimmedRemarks } : {};

        const payload = {
          id: remarksModal.lead.id,
          status: remarksModal.newStatus,
          ...filteredContractData,
          ...basePayload,
        };

        if (proposalFile) {
          payload.proposal = proposalFile;
        }

        console.log('Status change payload:', payload);

        if (remarksModal.newStatus === 'Potential Client') {
          // Check if conversion was already handled by conversion-to-potential API
          if (contractData?._conversionHandled) {
            // Conversion API already handled everything including status update
            // No need to call updateLeadById - just close modal and refresh table
            console.log('Conversion already handled by API, status updated by conversion API');
            setProposalFile(null);
            message.success('Lead converted to Potential Client successfully');
            setRemarksModal({ visible: false, lead: null, forStatusChange: false, newStatus: null });
            refetch();
            queryClient.invalidateQueries('leadCounts');
          } else {
            // Legacy flow - update everything via updateLeadById
            const response = await updateLeadById(remarksModal.lead.id, payload);
            setProposalFile(null);
            message.success(response?.message || 'Proposal uploaded and status updated successfully');
            setRemarksModal({ visible: false, lead: null, forStatusChange: false, newStatus: null });
            refetch();
            queryClient.invalidateQueries('leadCounts');
          }
        } else {
          await new Promise((resolve, reject) => {
            updateStatusMutation.mutate(payload, { onSuccess: resolve, onError: reject });
          });
        }
      } catch (error) {
        console.error('handleRemarksSave error:', error);
        if (error?.errors?.remarks && Array.isArray(error.errors.remarks) && error.errors.remarks.length > 0) {
          message.error(error.errors.remarks[0]);
        } else if (error?.message) {
          message.error(error.message);
        } else {
          message.error('Failed to update lead');
        }
      } finally {
        setRemarksLoading(false);
      }
    };

    if (isDashboard) {
      return tableContent;
    }

    return (
      <>
        <BreadCrumb linkText="Website Leads" />

        {/* Date Range Filter and Manage Assignees Button */}
        <div style={{ padding: '0 20px', marginTop: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space align="center">
            <span style={{ fontWeight: '500', fontSize: '14px', padding: "8px 12px", borderRadius: "6px" }}>Filter by Date Range:</span>
            <BootstrapDateRangeModal
              value={dateRange}
              showModal={showDateModal}
              setShowModal={setShowDateModal}
              onDone={(range) => {
                handleDateRangeChange(range);
                setShowDateModal(false); // Close modal after selection
              }}
              triggerStyle={{ border: '1px solid #d9d9d9' }}
            />

            {dateRange && (
              <Button
                size="small"
                danger
                onClick={clearDateRange}
              >
                Clear
              </Button>
            )}
          </Space>

          {/* Manage Assignees Button - Only for Admin */}
          {isSuperAdmin(userType) && (
            <Button
              icon={<UserAddOutlined size="1em" className="app-icon" />}
              onClick={() => setUserAssignmentModalVisible(true)}
              style={{ backgroundColor: '#3E6A9F', borderColor: '#3E6A9F', color: 'white' }}
            >
              Manage Assignees
            </Button>
          )}
        </div>

        <div className="leads">
          <div className="container">
            {tableContent}


            <Suspense fallback={null}>
              <ShowRemarksLead
                visible={remarksModal.visible}
                onClose={() => {
                  setRemarksModal({ visible: false, lead: null, forStatusChange: false, newStatus: null });
                  setProposalFile(null);
                  if (proposalInputRef.current) {
                    proposalInputRef.current.value = '';
                  }
                }}
                lead={remarksModal.lead}
                onSave={handleRemarksSave}
                loading={remarksLoading || updateStatusMutation.isLoading}
                showContractFields={false}
                proposalRequired={false}
                isProposalAttached={!!proposalFile}
                remarksRequired={remarksModal.forStatusChange}
                saveButtonText="Update"
                viewOnlyMode={
                  userType === 'marketing_manager' ||
                  isLeadConvertedToClient(remarksModal.lead) ||
                  ((userType === 'sales_manager' || userType === 'sales_executive') && !remarksModal.forStatusChange)
                }
              />
            </Suspense>

            {/* Assignment Confirmation Modal */}
            <Suspense fallback={null}>
              <ConfirmationModal
                showModal={assignmentModal.visible}
                setShowModal={(visible) => {
                  if (!visible) {
                    setAssignmentModal({ visible: false, lead: null, newAssigneeId: null, newAssigneeName: null });
                  } else {
                    setAssignmentModal(prev => ({ ...prev, visible }));
                  }
                }}
                onConfirm={confirmAssignment}
                isLoading={assignmentMutation.isLoading}
                message={
                  <div>
                    <p style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.5' }}>
                      You are about to reassign this lead to a different team member.
                      This action will transfer the responsibility for following up on this lead
                      to the newly assigned person. The lead's history and current status will be preserved.
                    </p>
                    <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Lead Name:</strong> {assignmentModal.lead?.contact_person_name || '-'}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Company:</strong> {assignmentModal.lead?.company_name || '-'}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Current Assignee:</strong> {assignmentModal.lead?.assigned_to_name || 'Unassigned'}
                      </div>
                      <div>
                        <strong>New Assignee:</strong> {assignmentModal.newAssigneeName || '-'}
                      </div>
                    </div>
                  </div>
                }
              />
            </Suspense>

            {/* Proposal Modal */}
            <Suspense fallback={null}>
              <ProposalModal
                visible={proposalModal.visible}
                onClose={() => setProposalModal({ visible: false, data: null, loading: false })}
                proposalData={proposalModal.data}
                loading={proposalModal.loading}
              />
            </Suspense>

            {/* User Assignment Modal */}
            <ManageAssigneesModal
              visible={userAssignmentModalVisible}
              onClose={() => setUserAssignmentModalVisible(false)}
              leadType="website-leads"
              fetchAssigned={getAssignedUsers}
              addAssigned={addUserAssignments}
              removeAssigned={removeUserAssignments}
              queryKey="leadGenerationAssignedUsers"
            />

            {/* Duplicate Lead Modal */}
            <DuplicateLeadModal
              visible={duplicateModal.visible}
              lead={duplicateModal.lead}
              onClose={closeDuplicateModal}
              leadType="website-leads"
            />
            {isSuperAdmin(userType) && (
              <StatusHistoryModal
                open={statusHistoryModal.visible}
                entity={statusHistoryModal.entity}
                onClose={() => setStatusHistoryModal({ visible: false, entity: null })}
                fetchHistoryApi={getWebsiteLeadHistory}
                title={entity => `Lead History - ${entity?.company_name || 'Lead'}`}
                historyDateKey="changed_at"
                getTitleFromEntity={(entity) => entity?.company_name || 'Lead'}
                queryKeyPrefix={`websiteLeadStatusHistory-${user?.id}-${userType}`}
                emptyMessage="No status history available."
              />
            )}
            <FollowUpModal
              open={followUpModal.visible}
              onClose={() => setFollowUpModal({ visible: false, lead: null })}
              lead={followUpModal.lead}
              leadType="website"
              readOnlyMode={isLeadConvertedToClient(followUpModal.lead)}
            onSubmit={async (values, lead) => {
              if (!lead?.id || isLeadConvertedToClient(lead)) return false;

              const isNextFollowupRequired = !values?.addFollowUp;
              await followUpMutation.mutateAsync({
                leadId: lead.id,
                payload: {
                  current_followup_date: new Date().toISOString(),
                  next_followup_date: isNextFollowupRequired && values?.followUpDate
                    ? new Date(values.followUpDate).toISOString()
                    : null,
                  is_next_followup_required: isNextFollowupRequired,
                  remarks: values?.remarks?.trim() || '',
                },
              });
            }}
            />
          </div>
        </div>
      </>
    );
  };

  export default LeadsPage;

