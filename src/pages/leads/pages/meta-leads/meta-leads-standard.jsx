import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Input, Modal, message, Select, Button, Space, Tooltip } from 'antd';
import { MessageCircle as CommentOutlined, Pencil as EditOutlined, Calendar as CalendarOutlined, Upload as UploadOutlined, History as HistoryOutlined, Download as DownloadOutlined, Info as InfoCircleOutlined, Minus as MinusOutlined, Clock as ClockCircleOutlined, UserPlus as UserAddOutlined } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import StatusFilterTabs from '../../../../components/status-filter-tabs.jsx'
import ImportLeadsButton from '../../../../components/import-leads-button.jsx'
import { createStatusColumn, isLeadConvertedToClient } from '../../../shared/utils/statusColumn.jsx';
import ManageAssigneesModal from '../../../../components/manage-assignees-modal.jsx';
import { getMetaLeadsAssignedUsers, addMetaLeadsUserAssignments, removeMetaLeadsUserAssignments } from '../../../shared/services/leads.js';
import { createAssignedToColumn } from '../../../shared/utils/assignedToColumn.jsx';
import { loadTableState } from '../../../shared/utils/persistTableState.js';

import {getMetaLeadsStats, getMetaLeadsListCount,updateMetaLeadProjectSize, createMetaLeadFollowUp, getMetaLeadHistory} from '../../../shared/services/metaLeads.js'
  // getMetaLeadsCampaignNameList, getMetaLeadsAdsetNameList, getMetaLeadsAdNameList, getMetaLeadsListWithHistory, getMetaLeadsAdsetListByCampaign, getMetaLeadsAdsListByAdset, 
import { getMetaLeadsList } from '../../../shared/services/metaLeads.js';
import NewTableComponent from '../../../../components/tables/new-table.jsx';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import ConfirmationModal from '../../../../components/confirmation-modal.component.jsx';
import {  updateMetaLeadStatus } from '../../../shared/services/headhunting.js';
import { getManangersExecutives } from '../../../shared/services/users-service.js';
import { reassignMetaLead } from '../../../shared/services/metaLeads.js'
import useUserStore from '../../../shared/store/user-store.js';
import { getRoleHome } from '../../../auth/role-home.js';
import formatDateUniversal from '../../../shared/utils/formatDate.js';
import ShowRemarksLead from '../../../../components/show-remarks-lead.jsx';
import BootstrapDateRangeModal from '../../../../components/bootstrap-date-range-modal.component.jsx';

import DuplicateLeadModal from '../../../../components/duplicate-lead-modal.component.jsx';
import { useDuplicateLead } from '../../../../components/hooks/useDuplicateLead.js';
import StatusHistoryModal, { createStatusHistoryColumn } from '../../../../components/status-history-modal.jsx';
import dayjs from 'dayjs';
import FollowUpModal from '../../../../components/follow-up-modal.component.jsx';
import '../../../../assets/styles/legacy/table-client-actions.css';

// // CSV export functions
// const arrayToCSV = (data, columns) => {
//   if (!Array.isArray(data) || data.length === 0) return "";
//   const headers = columns.map((col) => col.header);
//   const keys = columns.map((col) => col.accessorKey);
//   const escape = (str) => `"${String(str).replace(/"/g, '""')}"`;
//   const csvRows = [headers.map(escape).join(",")];
//   data.forEach((row) => {
//     csvRows.push(keys.map((key) => escape(row[key] ?? "")).join(","));
//   });
//   return csvRows.join("\r\n");
// };

const STATUS_OPTIONS = [
  "Pending Contact",
  "Potential Client",
  "Company Profile Sent Through Whatsapp",
  "Company Profile Sent Through Email",
  "Company Profile Sent Through Email & Whatsapp",
  "SaaS Client",
  "Follow Up",
  "Job Seeker",
  "Opportunity Lost",
  "Not Ready to Pay",
  "Contacted But No Response - Company Profile Sent Through Whatsapp",
  "Contacted But No Response - Company Profile Sent Through Email",
  "Contacted But No Response - Company Profile Sent Through Email & Whatsapp",
  "Phone Powered Off - Company Profile Sent Through Whatsapp",
  "Phone Powered Off - Company Profile Sent Through Email",
  "Phone Powered Off - Company Profile Sent Through Email & Whatsapp",
  "Incorrect Phone Number",
  "Duplicate Lead",
  "Irrelevant Lead",
];

const STATUS_DROPDOWN_OPTIONS = STATUS_OPTIONS.map((status) => ({
  label: status,
  value: status,
}));

const toApiKey = (status) =>
  status
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const statusColors = {
  "Pending Contact": "#4DA6FF",
  "Potential Client": "#52c41a",
  "Company Profile Sent Through Whatsapp": "#52c41a",
  "Company Profile Sent Through Email": "#52c41a",
  "Company Profile Sent Through Email & Whatsapp": "#52c41a",
  "SaaS Client": "#13c2c2",
  "Follow Up": "#A38858",
  "Job Seeker": "#FF0000",
  "Opportunity Lost": "#FF0000",
  "Not Ready to Pay": "#FF0000",
  "Contacted But No Response - Company Profile Sent Through Whatsapp": "#FFD700",
  "Contacted But No Response - Company Profile Sent Through Email": "#FFD700",
  "Contacted But No Response - Company Profile Sent Through Email & Whatsapp": "#FFD700",
  "Phone Powered Off - Company Profile Sent Through Whatsapp": "#FFD700",
  "Phone Powered Off - Company Profile Sent Through Email": "#FFD700",
  "Phone Powered Off - Company Profile Sent Through Email & Whatsapp": "#FFD700",
  "Incorrect Phone Number": "#FF0000",
  "Duplicate Lead": "#6889D3",
  "Irrelevant Lead": "#FF0000",
  "Terminated": "#a8071a",
};

const STATUSES_REQUIRING_REMARKS = new Set([
  "Potential Client",
  "SaaS Client",
  "Follow Up",
  "Opportunity Lost",
  "Not Ready to Pay",
  "Irrelevant Lead",
]);

export default function MetaLeadsStandard() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Load persisted state from sessionStorage
  const initialState = loadTableState('meta-leads-page', searchParams, {
    defaultStatus: 'All',
    status: 'All',
  });
  
  const [pagination, setPagination] = useState({ 
    pageIndex: initialState.pageIndex, 
    pageSize: initialState.pageSize 
  });
  const [globalFilter, setGlobalFilter] = useState(initialState.search || '');
  const [sorting, setSorting] = useState(initialState.sorting);
  
  // Restore date range from sessionStorage (convert ISO strings to dayjs objects)
  const [dateRange, setDateRange] = useState(() => {
    if (initialState.dateRange && Array.isArray(initialState.dateRange) && initialState.dateRange.length === 2) {
      return [
        initialState.dateRange[0] ? dayjs(initialState.dateRange[0]) : null,
        initialState.dateRange[1] ? dayjs(initialState.dateRange[1]) : null,
      ];
    }
    return null;
  });
  
  const [showDateModal, setShowDateModal] = useState(false);
  const [datePickerResetKey, setDatePickerResetKey] = useState(0);
  const [selectedExecId, setSelectedExecId] = useState(null);
  const [statusFilter, setStatusFilter] = useState(STATUS_OPTIONS.includes(initialState.statusFilter) ? initialState.statusFilter : 'All');
  const [selectedProjectSize, setSelectedProjectSize] = useState(null);
  const [updatingProjectSizeId, setUpdatingProjectSizeId] = useState(null);
  const [projectSizeFilter, setProjectSizeFilter] = useState(initialState.projectSizeFilter || null);
  const [executiveFilter, setExecutiveFilter] = useState(initialState.executiveFilter || null);
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({});

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);
  const [remarksModal, setRemarksModal] = useState({ visible: false, lead: null, newStatus: null, forStatusChange: false });
  const [remarksLoading, setRemarksLoading] = useState(false);
  
  // Duplicate lead hook
  const { duplicateModal, openDuplicateModal, closeDuplicateModal, isDuplicate, getRowStyle } = useDuplicateLead();
  const metaLeadDetailBasePath = getRoleHome(user?.user_type);

  const [proposalFile, setProposalFile] = useState(null);
  const proposalInputRef = useRef(null);
  const [statusHistoryModal, setStatusHistoryModal] = useState({ visible: false, lead: null });
  const [extraDataModal, setExtraDataModal] = useState({ visible: false, data: [], leadName: '' });
  const [followUpModal, setFollowUpModal] = useState({ visible: false, lead: null });
  const [userAssignmentModalVisible, setUserAssignmentModalVisible] = useState(false);

  // Assignment states
  const [assignmentModal, setAssignmentModal] = useState({
    visible: false,
    lead: null,
    newAssigneeId: null,
    newAssigneeName: null
  });

  // Project size options
  const PROJECT_SIZE_OPTIONS = [
    { label: 'Under PKR 25,000', value: 'Below 25k' },
    { label: 'PKR 25,000 - PKR 50,000', value: '25k - 50k' },
    { label: 'PKR 50,000 - PKR 100,000', value: '50k - 100k' },
    { label: 'PKR 100,000 +', value: 'Above 100k' }
  ];

  // Helper function to format project size for display
  const formatProjectSize = (value) => {
    const option = PROJECT_SIZE_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : value || '-';
  };

  const formatExtraDataValue = (val) => {
    if (!val || typeof val !== 'string') return val || '';
    let s = val
      .replace(/_\+/g, '+')
      .replace(/_-_/g, '-')
      .replace(/under_?pkr_?/gi, 'Under PKR ')
      .replace(/pkr_/gi, 'PKR ')
      .replace(/_/g, ' ')
      .replace(/,\s*/g, ', ')
      .replace(/\s+/g, ' ')
      .trim();
    s = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    s = s.replace(/\si\s/g, ' I ');
    return s;
  };

  const formatExtraDataKey = (key) => {
    if (!key || typeof key !== 'string') return key || '';
    return key
      .replace(/_/g, ' ')
      .replace(/\?$/g, '')
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Project size permissions
  const canViewProjectSize = ['super_admin', 'marketing_manager', 'sales_manager', 'sales_executive'].includes(user?.user_type);
  const canEditProjectSize = (lead) => {
    if (user?.user_type === 'super_admin' || user?.user_type === 'sales_manager') {
      return true;
    }
    if (user?.user_type === 'sales_executive') {
      return lead?.assigned_to === user?.id;
    }
    return false;
  };

  // Check if user is admin or manager
  const canAssign = user?.user_type === 'super_admin' || user?.user_type === 'sales_manager';

  // Meta leads stats query
  const {
    data: metaLeadsStatsData,
    isLoading: loadingMetaLeadsStats,
    refetch: refetchMetaLeadsStats
  } = useQuery(
    ['metaLeadsStats', dateRange],
    () => getMetaLeadsStats(
      dateRange?.[0]?.format('YYYY-MM-DDTHH:mm:ssZ'),
      dateRange?.[1]?.format('YYYY-MM-DDTHH:mm:ssZ'),
      null // No campaign filter for standard users
    ),
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false
    }
  );

  // Meta leads list count query
  const {
    data: metaLeadsCountData,
    isLoading: loadingMetaLeadsCount,
    refetch: refetchMetaLeadsCount
  } = useQuery(
    ['metaLeadsCount', dateRange, selectedExecId, statusFilter, projectSizeFilter, executiveFilter],
    () => getMetaLeadsListCount(
      1, // page
      dateRange?.[0]?.format('YYYY-MM-DDTHH:mm:ssZ'),
      dateRange?.[1]?.format('YYYY-MM-DDTHH:mm:ssZ'),
      selectedExecId,
      null, // No campaign filter for standard users
      null, // No adset filter for standard users
      null, // No ad filter for standard users
      null, // No history status for standard users
      null, // No history start date for standard users
      null, // No history end date for standard users
      projectSizeFilter,
      executiveFilter,
      null,
      null
    ),
    {
      staleTime: 0, // Always consider data stale for count query
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false
    }
  );

  // Fetch meta leads list for table
  const sortField = sorting && sorting.length > 0 && sorting[0]?.id ? sorting[0].id : null;
  const sortDirection = sorting && sorting.length > 0 && sorting[0]?.desc !== undefined ? sorting[0].desc : null;

  const {
    data: metaLeadsData,
    isLoading: loadingMetaLeads,
    isFetching: fetchingMetaLeads,
    refetch: refetchMetaLeads
  } = useQuery(
    [
      'metaLeads',
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      sortField, // Serialized sorting field
      sortDirection, // Serialized sorting direction
      dateRange?.[0]?.format('YYYY-MM-DDTHH:mm:ssZ'),
      dateRange?.[1]?.format('YYYY-MM-DDTHH:mm:ssZ'),
      selectedExecId,
      statusFilter,
      projectSizeFilter,
      executiveFilter
    ],
    () => {
      const sortBy = sortField || '';
      const order = sortDirection ? 'desc' : 'asc';
      console.log('Meta Leads Sorting Debug:', { sorting, sortField, sortDirection, sortBy, order });
      return getMetaLeadsList(
        pagination.pageIndex + 1,
        pagination.pageSize,
        sortBy,
        order,
        globalFilter,
        dateRange?.[0]?.format('YYYY-MM-DDTHH:mm:ssZ'),
        dateRange?.[1]?.format('YYYY-MM-DDTHH:mm:ssZ'),
        selectedExecId,
        statusFilter === 'All' ? null : statusFilter,
        null, // No campaign filter for standard users
        null, // No adset filter for standard users
        null, // No ad filter for standard users
        projectSizeFilter,
        executiveFilter,
        null,
        null
      );
    },
    {
      staleTime: 0, // Always consider data stale - ensures fresh data on every change
      cacheTime: 0, // Don't cache - ensures sorting changes trigger immediate refetch
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: true, // Always refetch on mount
      refetchOnReconnect: false // Don't refetch on reconnect
    }
  );

  // Custom handler to allow sorting to go to default state
  const handleSortingChange = (newSorting) => {
    console.log('handleSortingChange called with:', newSorting);

    // Allow clearing to empty array for default/unsorted state
    // This matches the behavior in data-lead.jsx where clicking multiple times cycles: asc -> desc -> default
    setSorting(newSorting || []);
  };

  // Debug: Log sorting changes
  useEffect(() => {
    console.log('Sorting state changed:', sorting);
    if (sorting && sorting.length > 0) {
      console.log('Sort field:', sorting[0]?.id, 'Desc:', sorting[0]?.desc);
    }
  }, [sorting]);

  // Persist table state to sessionStorage
  useEffect(() => {
    try {
      const stateToSave = {
        statusFilter: statusFilter,
        search: globalFilter,
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting: sorting,
        projectSizeFilter: projectSizeFilter,
        executiveFilter: executiveFilter,
        timestamp: Date.now(),
      };

      // Serialize date range to ISO strings for storage
      if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
        stateToSave.dateRange = [
          dateRange[0] ? dateRange[0].toISOString() : null,
          dateRange[1] ? dateRange[1].toISOString() : null,
        ];
      }

      sessionStorage.setItem('tableState_meta-leads-page', JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Failed to save meta-leads table state:', e);
    }
  }, [statusFilter, globalFilter, pagination.pageIndex, pagination.pageSize, sorting, dateRange, projectSizeFilter, executiveFilter]);

  // Fetch executives/managers list for assignment (same as leads.jsx)
  const { data: assigningUsersData, isLoading: loadingAssigningUsers } = useQuery({
    queryKey: ['executiveList', user?.id, user?.user_type],
    queryFn: () => getManangersExecutives(user?.user_type),
    enabled: ['sales_manager', 'super_admin', 'company_admin'].includes(user?.user_type),
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false
  });

  // Build executives list including current user for sales managers (same as leads.jsx)
  const executivesList = useMemo(() => Array.isArray(assigningUsersData) ? assigningUsersData : [], [assigningUsersData]);

  // Debug executive filter changes
  useEffect(() => {
    console.log('Executive filter state changed to:', executiveFilter);
  }, [executiveFilter]);

  // Reset pagination when filters change (but not on initial mount)
  const isInitialMountRef = useRef(true);
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return; // Skip reset on initial mount to preserve loaded pagination
    }
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [globalFilter, dateRange, selectedExecId, statusFilter, projectSizeFilter]);

  // Reset row selection when data changes to prevent index mismatch errors
  useEffect(() => {
    setRowSelection({});
  }, [metaLeadsData]);

  // Handle date range change
  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  // Status choices for meta leads
  const STATUS_CHOICES = [
    ...STATUS_OPTIONS.map((status) => ({
      label: status,
      value: status,
      apiKey: toApiKey(status),
    })),
    { label: 'Other', value: 'Other', apiKey: 'other' },
  ];

  // Function to get count for a status
  const getStatusCount = (apiKey) => {
    return metaLeadsCountData?.[apiKey] || 0;
  };

  // Function to get total count for "All" tab
  const getTotalCount = () => {
    if (!metaLeadsCountData) return 0;
    // Use the total_count field directly from the API response
    return metaLeadsCountData.total_count || 0;
  };

  // Status update mutation
  const updateStatusMutation = useMutation(
    ({ leadId, ...payload }) => updateMetaLeadStatus(leadId, payload),
    {
      onSuccess: (data, variables) => {
        message.success(data.message || 'Status updated successfully');

        // Refetch all meta leads data to ensure UI shows latest information
        refetchMetaLeads();
        refetchMetaLeadsStats();
        refetchMetaLeadsCount();

        // Also invalidate related queries to ensure fresh data
        queryClient.invalidateQueries(['metaLeads']);
        queryClient.invalidateQueries(['metaLeadsStats']);
        queryClient.invalidateQueries(['metaLeadsCount']);

        setRemarksModal({ visible: false, lead: null, newStatus: null });
      },
      onError: (error) => {
        message.error(error.message || 'Failed to update status');
        setRemarksModal({ visible: false, lead: null, newStatus: null });
      },
    }
  );

  const clearDateRange = () => {
    setDateRange(null);
    setDatePickerResetKey((prev) => prev + 1);
    setShowDateModal(false); // Also close the modal if it's open
  };

  // Assignment mutation
  const assignmentMutation = useMutation(
    ({ leadId, userId }) => reassignMetaLead(leadId, userId),
    {
      onSuccess: (data) => {
        message.success(data.message || 'Lead reassigned successfully');

        // Refetch all meta leads data to ensure UI shows latest information
        refetchMetaLeads();
        refetchMetaLeadsStats();
        refetchMetaLeadsCount();

        // Also invalidate related queries to ensure fresh data
        queryClient.invalidateQueries(['metaLeads']);
        queryClient.invalidateQueries(['metaLeadsStats']);
        queryClient.invalidateQueries(['metaLeadsCount']);

        setAssignmentModal({ visible: false, lead: null, newAssigneeId: null, newAssigneeName: null });
      },
      onError: (error) => {
        message.error(error.message || 'Failed to reassign lead');
        setAssignmentModal({ visible: false, lead: null, newAssigneeId: null, newAssigneeName: null });
      },
    }
  );

  // Project size update mutation
  const updateProjectSizeMutation = useMutation(
    ({ leadId, projectSize }) => updateMetaLeadProjectSize(leadId, projectSize),
    {
      onMutate: ({ leadId }) => {
        setUpdatingProjectSizeId(leadId);
      },
      onSuccess: (data) => {
        message.success(data.message || 'Project size updated successfully');

        // Refetch all meta leads data to ensure UI shows latest information
        refetchMetaLeads();
        refetchMetaLeadsStats();
        refetchMetaLeadsCount();

        // Also invalidate related queries to ensure fresh data
        queryClient.invalidateQueries(['metaLeads']);
        queryClient.invalidateQueries(['metaLeadsStats']);
        queryClient.invalidateQueries(['metaLeadsCount']);

        setUpdatingProjectSizeId(null);
      },
      onError: (error) => {
        message.error(error.message || 'Failed to update project size');
        setUpdatingProjectSizeId(null);
      },
    }
  );

  const followUpMutation = useMutation(
    ({ leadId, payload }) => createMetaLeadFollowUp(leadId, payload),
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Meta lead follow up saved successfully');
        refetchMetaLeads();
        refetchMetaLeadsStats();
        refetchMetaLeadsCount();
        queryClient.invalidateQueries(['metaLeads']);
        queryClient.invalidateQueries(['metaLeadsStats']);
        queryClient.invalidateQueries(['metaLeadsCount']);
      },
      onError: (error) => {
        message.error(error?.response?.data?.message || error?.message || 'Failed to save meta lead follow up');
      },
    }
  );

  // Handle status change
  const handleStatusChange = (lead, newStatus) => {
    if (!lead) return;
    if (isLeadConvertedToClient(lead)) return;
     if (
    newStatus === "Potential Client" &&
    (!lead.company_name || lead.company_name.trim() === "")
  ) {
    message.error("Please add a company name first.");
    return;
  }
    if (STATUSES_REQUIRING_REMARKS.has(newStatus)) {
      setProposalFile(null);
      setRemarksModal({ visible: true, lead, newStatus, forStatusChange: true });
      return;
    }
    // Status change without remarks modal - don't include remarks in payload
    updateStatusMutation.mutate({
      leadId: lead.id,
      status: newStatus,
    });
  };

  // Handle assignment change - show confirmation modal
  const handleAssignmentChange = (lead, newAssigneeName) => {
    if (isLeadConvertedToClient(lead)) return;
    const newAssignee = executivesList?.find((user) => String(user.id) === String(newAssigneeName));
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

  // Handle project size change
  const handleProjectSizeChange = (lead, newProjectSize) => {
    if (isLeadConvertedToClient(lead)) return;
    updateProjectSizeMutation.mutate({
      leadId: lead.id,
      projectSize: newProjectSize
    });
  };

  const columns = useMemo(() => {
    return [
    {
      header: 'ID',
      accessorKey: 'id',
      enableSorting: false,
      Cell: ({ row, cell }) => {
        const leadId = row.original?.id;
        const value = cell.getValue() || '-';
        const lead = row.original;
        const isDuplicateLead = isDuplicate(lead);
        
        if (!leadId) return <span>{value}</span>;
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <a
              style={{ color: '#3E6A9F', fontWeight: 600, textDecoration: 'underline' }}
              href={`${metaLeadDetailBasePath}/meta-leads/${leadId}`}
              onClick={(e) => { e.preventDefault(); navigate(`${metaLeadDetailBasePath}/meta-leads/${leadId}`); }}
            >
              {value}
            </a>
            {isDuplicateLead && (
              <InfoCircleOutlined size="1em" className="app-icon"
                style={{
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  openDuplicateModal(lead);
                }}
                title="View duplicate information"
              />
            )}
          </span>
        );
      },
    },
    ...((user?.user_type === 'sales_manager' || user?.user_type === 'sales_executive') ? [{
      header: 'Follow Ups and Remarks',
      id: 'follow_up',
      accessorKey: 'follow_up',
      enableSorting: false,
      Cell: ({ row }) => (
        <Tooltip title="Follow Ups and Remarks">
          <ClockCircleOutlined size="1em" className="app-icon"
            style={{ cursor: 'pointer', fontSize: 18, color: '#3E6A9F' }}
            onClick={() => {
              setFollowUpModal({ visible: true, lead: row.original });
            }}
          />
        </Tooltip>
      ),
    }] : []),
    // Status column — use createStatusColumn for all users (it handles permissions based on converted_to_client)
      createStatusColumn({
        statusesRequiringRemarks: STATUSES_REQUIRING_REMARKS,
        statusColors,
        userType: user?.user_type,
        user,
        leadType: 'meta-leads',
        onOpenRemarksModal: (lead, newStatus) => {
          setProposalFile(null);
          setRemarksModal({
            visible: true,
            lead,
            newStatus,
            forStatusChange: true,
          });
        },
        onDirectStatusUpdate: (lead, newStatus) => {
          handleStatusChange(lead, newStatus);
        },
        isLoading: updateStatusMutation.isLoading,
        additionalProps: {
          listHeight: window.innerHeight * 0.7,
        },
      }),
// Project Size column - only for users who can view it, positioned right after Status
...(canViewProjectSize ? [{
  header: 'Project Size',
  id: 'project_size', // Explicit id for sorting
  accessorKey: 'project_size',
  sortUndefined: 'last', // Handle undefined/null values
  sortDescFirst: false, // Start with ascending order (A to Z)
  enableSorting: true,
  Cell: ({ cell, row }) => {
    const currentValue = cell.getValue();
    const isUpdating = updatingProjectSizeId === row.original.id;

    // Admin, Sales Manager, Sales Executive - editable based on permissions
    return (
      <Select
        value={currentValue || undefined}
        options={PROJECT_SIZE_OPTIONS}
        onChange={(value) => handleProjectSizeChange(row.original, value)}
        loading={isUpdating}
        placeholder="Select Project Size"
        popupMatchSelectWidth={false}
        style={{ width: 'fit-content', minWidth: '200px' }}
        disabled={!canEditProjectSize(row.original) || isUpdating || isLeadConvertedToClient(row.original)}
      />
    );
  },
}] : []),
    // Assigned To column - shows combined name and type for all users except marketing_manager and sales_executive
    ...(user?.user_type !== 'marketing_manager' && user?.user_type !== 'sales_executive' ? [
      createAssignedToColumn({
        useAssigneeIds: true,
        userType: user?.user_type,
        user,
        executivesList: executivesList,
        onAssignmentChange: handleAssignmentChange,
        isLoading: assignmentMutation.isLoading,
        loadingAssigningUsers,
        additionalProps: {
          placeholder: "Select Assignee",
          allowClear: false,
        },
      })
    ] : []),
    {
      header: 'Who Are You',
      id: 'who_are_you', // Explicit id for sorting
      accessorKey: 'who_are_you',
      sortUndefined: 'last', // Handle undefined/null values
      sortDescFirst: false, // Start with ascending order (A to Z)
      Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
    },
    {
      header: 'Job Title',
      id: 'job_title', // Explicit id for sorting
      accessorKey: 'job_title',
      sortUndefined: 'last', // Handle undefined/null values
      sortDescFirst: false, // Start with ascending order (A to Z)
      Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
    },
    {
      header: 'Role Hiring For',
      id: 'role_hiring_for', // Explicit id for sorting
      accessorKey: 'role_hiring_for',
      sortUndefined: 'last', // Handle undefined/null values
      sortDescFirst: false, // Start with ascending order (A to Z)
      Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
    },
    {
      header: 'Full Name',
      id: 'full_name', // Explicit id for sorting
      accessorKey: 'full_name',
      sortUndefined: 'last', // Handle undefined/null values
      sortDescFirst: false, // Start with ascending order (A to Z)
      Cell: ({ cell, row }) => {
        const name = cell.getValue() || '-';
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
          <Tooltip title="The follow up is delayed">
            <InfoCircleOutlined size="1em" className="app-icon" style={{ color: '#ff4d4f', fontSize: '14px' }} />
          </Tooltip>
        );
        
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {name}
            {delayedInfoIcon}
            {duplicateIcon}
          </span>
        );
      },
    },
    {
      header: 'Phone Number',
      id: 'phone_number', // Explicit id for sorting
      accessorKey: 'phone_number',
      sortUndefined: 'last', // Handle undefined/null values
      sortDescFirst: false, // Start with ascending order (A to Z)
      Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
    },
    {
      header: 'Work Email',
      id: 'work_email', // Explicit id for sorting
      accessorKey: 'work_email',
      sortUndefined: 'last', // Handle undefined/null values
      sortDescFirst: false, // Start with ascending order (A to Z)
      Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
    },
    {
      header: 'Old Remarks',
      id: 'remarks', // Explicit id for sorting
      accessorKey: 'remarks',
      sortUndefined: 'last', // Handle undefined/null values
      sortDescFirst: false, // Start with ascending order (A to Z)
      Cell: ({ row }) => {
        const hasRemarks =
          row.original.remarks && row.original.remarks.trim() !== '';

        return (
          <CommentOutlined size="1em" className="app-icon"
            style={{
              cursor: 'pointer',
              color: hasRemarks ? '#1890ff' : '#aaa',
              fontSize: 18,
            }}
            onClick={() => {
              setRemarksModal({
               visible: true,
               lead: row.original,
               newStatus: row.original.status,
                forStatusChange: false,
              });
            }}
            title={hasRemarks ? 'View/Edit Remarks' : 'Add Remarks'}
          />
        );
      },
    },
    {
      header: 'Company Name',
      id: 'company_name', // Explicit id for sorting
      accessorKey: 'company_name',
      sortUndefined: 'last', // Handle undefined/null values
      sortDescFirst: false, // Start with ascending order (A to Z)
      Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
    },
    {
      header: 'City',
      id: 'city', // Explicit id for sorting
      accessorKey: 'city',
      sortUndefined: 'last', // Handle undefined/null values
      sortDescFirst: false, // Start with ascending order (A to Z)
      Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
    },
    {
      header: 'Preferred Contact Method',
      id: 'preferred_contact_method', // Explicit id for sorting
      accessorKey: 'preferred_contact_method',
      sortUndefined: 'last', // Handle undefined/null values
      sortDescFirst: false, // Start with ascending order (A to Z)
      Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
    },
    {
      header: 'How Many Hires',
      id: 'how_many_hires', // Explicit id for sorting
      accessorKey: 'how_many_hires',
      sortUndefined: 'last', // Handle undefined/null values
      sortDescFirst: false, // Start with ascending order (A to Z)
      Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
    },
    {
      header: 'Created At',
      id: 'created_time', // Explicit id for sorting
      accessorKey: 'created_time',
      sortUndefined: 'last', // Handle undefined/null values
      sortDescFirst: false, // Start with ascending order (A to Z)
      Cell: ({ cell }) => <span>{cell.getValue() ? formatDateUniversal(cell.getValue(), true) : '-'}</span>,
    },
    {
      header: 'Advance Payment Terms',
      id: 'advance_payment', // Explicit id for sorting
      accessorKey: 'advance_payment',
      sortUndefined: 'last', // Handle undefined/null values
      sortDescFirst: false, // Start with ascending order (A to Z)
      Cell: ({ row }) => {
        const extraData = row.original.extra_data;
        if (!extraData || !Array.isArray(extraData)) return <span>-</span>;

        const paymentData = extraData.find(item =>
          item && item.key === 'are_you_prepared_to_pay_a_portion_of_the_fee_(advance)_to_initiate_the_specialized_headhunting_search?'
        );

        if (!paymentData || !paymentData.value) return <span>-</span>;

        // Format the value to be more readable
        const formattedValue = paymentData.value
          .replace(/,/g, ', ')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase())
          .replace(/\s+/g, ' ')
          .trim();

        return <span>{formattedValue}</span>;
      },
    },
    {
      header: 'Monthly Salary Budget',
      id: 'salary_budget', // Explicit id for sorting
      accessorKey: 'salary_budget',
      sortUndefined: 'last', // Handle undefined/null values
      sortDescFirst: false, // Start with ascending order (A to Z)
      Cell: ({ row }) => {
        const extraData = row.original.extra_data;
        if (!extraData || !Array.isArray(extraData)) return <span>-</span>;

        const salaryData = extraData.find(item =>
          item && item.key === 'what_is_the_approximate_monthly_salary_budget_for_this_role?'
        );

        if (!salaryData || !salaryData.value) return <span>-</span>;

        // Format the salary value for better readability
        let formattedValue = salaryData.value;

        // Handle different formats
        if (formattedValue.toLowerCase().includes('pkr')) {
          // Format: "pkr_50,000_-_pkr_100,000" -> "PKR 50,000-PKR 100,000"
          // Format: "under_pkr_50,000" or "underpkr_50,000" -> "under PKR 50,000"
          formattedValue = formattedValue
            .replace(/under_?pkr_?/gi, 'under PKR ') // Handle "under_pkr_", "underpkr_", "underpkr" formats
            .replace(/pkr_/gi, 'PKR ')
            .replace(/\bpkr\b/gi, 'PKR ') // Handle standalone "pkr" with word boundaries
            .replace(/_-_/g, '-') // Handle dash in ranges first (before replacing other underscores)
            .replace(/_\+/g, '+') // Handle plus sign
            .replace(/_/g, '') // Remove remaining underscores (don't replace with commas, numbers already have commas)
            .replace(/\s+/g, ' ')
            .trim();
        } else {
          // General formatting
          formattedValue = formattedValue
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .trim();
        }

        return <span style={{ whiteSpace: 'nowrap' }}>{formattedValue}</span>;
      },
    },
    {
      header: 'Extra Fields',
      accessorKey: 'extra_data',
      enableSorting: false,
      Cell: ({ row }) => {
        const extraData = row.original.extra_data;
        const hasExtraData = extraData && Array.isArray(extraData) && extraData.length > 0;
        if (!hasExtraData) return <span>-</span>;
        return (
          <Tooltip title="View extra fields">
            <Button
              type="primary"
              size="small"
              className="sop-brand-primary"
              onClick={() =>
                setExtraDataModal({
                  visible: true,
                  data: extraData,
                  leadName: row.original.full_name || row.original.company_name || 'Lead',
                })
              }
            >
              View
            </Button>
          </Tooltip>
        );
      },
    },
    ...(user?.user_type === 'super_admin' ? [
      createStatusHistoryColumn({
        onOpenHistory: (lead) => setStatusHistoryModal({ visible: true, lead }),
        accessorKey: 'status_history_meta_standard',
      }),
    ] : []),
    ];
  }, [canAssign, executivesList, loadingAssigningUsers, user?.user_type, canViewProjectSize, canEditProjectSize, PROJECT_SIZE_OPTIONS, updatingProjectSizeId, pagination.pageIndex, pagination.pageSize, assignmentMutation.isLoading]);

  return (
    <>
      <BreadCrumb linkText="Meta Leads" />
      <div className="leads">
        <div className="container">
            {/* Date Range Filter */}
          <div style={{ padding: '0 20px', marginTop: '20px',marginBottom: '20px' }}>
            <Space align="center">
              <span style={{ fontWeight: '500', fontSize: '14px', padding:"8px 12px", borderRadius:"6px" }}>Filter by Date Range:</span>
                <BootstrapDateRangeModal
                  key={datePickerResetKey}
                  value={dateRange}
                  onChange={handleDateRangeChange}
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

            </div>



      {/* Tabs Section (replaces stats cards) */}
        {canAssign && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingRight: '20px' }}>
  <h2 style={{ margin: 0 }}></h2>
  <Space>
    {user?.user_type === 'super_admin' && (
      <Button
        icon={<UserAddOutlined size="1em" className="app-icon" />}
        onClick={() => setUserAssignmentModalVisible(true)}
        style={{ backgroundColor: '#3E6A9F', borderColor: '#3E6A9F', color: 'white' }}
      >
        Manage Assignees
      </Button>
    )}
    {user?.user_type === 'super_admin' && (
      <ImportLeadsButton onSuccess={() => {
        refetchMetaLeads();
        refetchMetaLeadsStats();
        refetchMetaLeadsCount();
      }} />
    )}
  </Space>
</div> }

      {/* Executive/Manager filter tabs */}
        {Array.isArray(metaLeadsStatsData) && metaLeadsStatsData.length > 0 && (
        <div className="client-tabs-container" style={{ marginBottom: 12, borderRadius: '6px', padding: '8px' }}>
          <div className="client-tabs">
                    <button
                      key="All"
                      value="All"
              className={`tab ${selectedExecId === null ? 'active' : ''}`}
              style={{
                border: selectedExecId === null ? '1px solid #3e6a9f' : '1px solid #3e6a9f30',
                borderRadius: '4px',
                margin: '2px',
                padding: '6px 14px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                backgroundColor: selectedExecId === null ? '#3e6a9f' : '#3e6a9f15',
                color: selectedExecId === null ? '#ffffff' : '#3e6a9f',
                fontWeight: '500'
              }}
                      onClick={() => {
                        setSelectedExecId(null);
                        setPagination(previous => ({ ...previous, pageIndex: 0 }));
                      }}
                    >
              All
                    </button>
                    {metaLeadsStatsData.map((userItem) => {
                      const isSelected = selectedExecId === userItem.id;
                      const executiveColor = '#3e6a9f';
                      return (
                        <button
                          key={userItem.id}
                          value={userItem.id}
                  className={`tab ${isSelected ? 'active' : ''}`}
                  style={{
                    border: isSelected ? `1px solid ${executiveColor}` : `1px solid ${executiveColor}30`,
                    borderRadius: '4px',
                    margin: '2px',
                    padding: '6px 14px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    backgroundColor: isSelected ? executiveColor : `${executiveColor}15`,
                    color: isSelected ? '#ffffff' : executiveColor,
                    fontWeight: '500'
                  }}
                        onClick={(e) => {
                          const value = Number(e.currentTarget.value);
                          setSelectedExecId((prev) => (prev === value ? null : value));
                          setPagination(previous => ({ ...previous, pageIndex: 0 }));
                        }}
                      >
                  {userItem.user_type
                    ? `${userItem.name} - ${userItem.user_type === 'sales_manager' ? 'Manager' : 'Executive'}`
                    : userItem.name} ({userItem.meta_leads_assigned || 0})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

      {/* Status filter tabs */}
      <StatusFilterTabs
        statusFilter={statusFilter}
        setStatusFilter={(status) => {
          setStatusFilter(status);
          // Reset pagination to default values
          setPagination({ pageIndex: 0, pageSize: 10 });
        }}
        statusChoices={STATUS_CHOICES}
        getTotalCount={getTotalCount}
        getStatusCount={getStatusCount}
      />


        </div>

        <div className='container' style={{ marginTop: '0px',paddingTop: '0px' }} >
          <NewTableComponent
            totalCount={metaLeadsData?.count || 0}
            columns={columns}
            data={metaLeadsData?.results || []}
            initialState={{}}
            pagination={pagination}
            onPaginationChange={setPagination}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            isLoading={loadingMetaLeads || fetchingMetaLeads}
            enableRowSelection={false}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            getRowId={(row) => row.id}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            enableStickyHeader={true}
            heading={`Meta Leads (${metaLeadsData?.count || 0})`}
            getRowStyle={getRowStyle}
          />
        </div>

        {/* Remarks Modal */}
     <ShowRemarksLead
  visible={remarksModal.visible}
  onClose={() => {
    setRemarksModal({ visible: false, lead: null, newStatus: null, forStatusChange: false });
    setProposalFile(null);
    if (proposalInputRef.current) {
     proposalInputRef.current.value = '';
   }
  }}
   lead={(() => {
    // Add validation before returning the lead object
    if (
      remarksModal.forStatusChange &&
      remarksModal.newStatus === "Potential Client" &&
      (!remarksModal.lead?.company_name || remarksModal.lead.company_name.trim() === "")
    ) {
      message.error("Please add a company name first.");
      // Close the modal and reset state
      setRemarksModal({ visible: false, lead: null, newStatus: null, forStatusChange: false });
      return null;
    }

    return remarksModal.forStatusChange && remarksModal.newStatus === 'Potential Client'
      ? { ...(remarksModal.lead || {}), total_vacancies: remarksModal.lead?.total_vacancies ?? 0, job_count: remarksModal.lead?.job_count ?? 0 }
      : remarksModal.lead;
  })()}
  leadType="meta-leads"
  onSave={async (remarks, contractData = {}) => {
    if (!remarksModal.lead) return;

    setRemarksLoading(true);
    try {
      const trimmedRemarks = typeof remarks === 'string' ? remarks.trim() : '';

      // Detect remarks-only mode (no status change)
      const isRemarksOnlyMode = !remarksModal.forStatusChange;

      console.log('isRemarksOnlyMode (Meta Leads):', isRemarksOnlyMode);

      if (isRemarksOnlyMode) {
        // REMARKS ONLY - Don't include status or any contract data
        console.log('Processing remarks-only update for Meta Lead');

        const payload = {
          leadId: remarksModal.lead.id,
        };

        // Only add remarks if provided
        if (trimmedRemarks) {
          payload.remarks = trimmedRemarks;
        }

        console.log('Remarks-only payload (Meta Leads):', payload);

        await updateStatusMutation.mutateAsync(payload);
        setProposalFile(null);

        return; // Exit early for remarks-only mode
      }

      // STATUS CHANGE MODE - Include contract data
      console.log('Processing status change with contract data (Meta Leads)');

      // For Potential Client conversions, always use conversion API (never use update-status)
      if (remarksModal.newStatus === 'Potential Client') {
        console.log('Potential Client conversion should be handled by conversion API in ShowRemarksLead');
        // If conversion was already handled by conversion-to-potential API
        if (contractData?._conversionHandled) {
          console.log('Conversion already handled by API, status updated by conversion API');
          setProposalFile(null);
          message.success('Lead converted to Potential Client successfully');
          setRemarksModal({ visible: false, lead: null, newStatus: null, forStatusChange: false });
          return;
        } else {
          // If for some reason conversion wasn't handled, show error
          console.error('Potential Client conversion should have been handled by conversion API');
          message.error('Failed to convert lead. Please try again.');
          setRemarksModal({ visible: false, lead: null, newStatus: null, forStatusChange: false });
          return;
        }
      }

      // Filter out empty values from contract data
      const filteredContractData = Object.entries(contractData || {}).reduce((acc, [key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          !(typeof value === 'string' && value.trim() === '') &&
          !(Array.isArray(value) && value.length === 0)
        ) {
          acc[key] = value;
        }
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

      const payload = {
        leadId: remarksModal.lead.id,
        status: remarksModal.newStatus,
        ...filteredContractData,
      };

      if (trimmedRemarks) {
        payload.remarks = trimmedRemarks;
      }

      if (proposalFile) {
        payload.proposal = proposalFile;
      }

      console.log('Status change payload (Meta Leads):', payload);

      await updateStatusMutation.mutateAsync(payload);
      setProposalFile(null);
    } catch (error) {
      console.error('Meta Leads onSave error:', error);
      // Error handling is done in mutation
    } finally {
      setRemarksLoading(false);
    }
  }}
  loading={remarksLoading || updateStatusMutation.isLoading}
  showContractFields={remarksModal.forStatusChange && remarksModal.newStatus === 'Potential Client'}
  proposalRequired={remarksModal.forStatusChange && remarksModal.newStatus === 'Potential Client'}
  isProposalAttached={!!proposalFile}
  saveButtonText={remarksModal.forStatusChange && remarksModal.newStatus === 'Potential Client' ? 'Convert' : 'Update'}
  remarksRequired={
    remarksModal.forStatusChange &&
    STATUSES_REQUIRING_REMARKS.has(remarksModal.newStatus)
  }
  viewOnlyMode={
    isLeadConvertedToClient(remarksModal.lead) ||
    ((user?.user_type === 'sales_manager' || user?.user_type === 'sales_executive') &&
      !remarksModal.forStatusChange)
  }
  extra={
    remarksModal.forStatusChange && remarksModal.newStatus === 'Potential Client' ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        <Button
          type="dashed"
          icon={<UploadOutlined size="1em" className="app-icon" />}
          onClick={() => proposalInputRef.current?.click()}
          style={{
            borderStyle: 'dashed',
            borderColor: '#3E6A9F',
            color: '#3E6A9F',
            justifyContent: 'flex-start',
            height: 40,
          }}
          block
        >
          {proposalFile ? 'Change Proposal PDF' : 'Attach Proposal PDF'}
        </Button>
        <input
          type="file"
          accept="application/pdf"
          ref={proposalInputRef}
          style={{ display: 'none' }}
          onChange={(e) => setProposalFile(e.target.files?.[0] || null)}
        />
        {proposalFile && (
          <span style={{ fontSize: 12, color: '#3E6A9F' }}>{proposalFile.name}</span>
        )}
      </div>
    ) : null
  }
/>

        {/* Assignment Confirmation Modal */}
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
                You are about to reassign this meta lead to a different team member.
                This action will transfer the responsibility for following up on this lead
                to the newly assigned person. The lead's history and current status will be preserved.
              </p>
              <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Lead Name:</strong> {assignmentModal.lead?.full_name || assignmentModal.lead?.contact_person_name || assignmentModal.lead?.lead_id || '-'}
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

        {user?.user_type === 'super_admin' && (
          <StatusHistoryModal
            open={statusHistoryModal.visible}
            entity={statusHistoryModal.lead}
            onClose={() => setStatusHistoryModal({ visible: false, lead: null })}
            fetchHistoryApi={getMetaLeadHistory}
            historyDateKey="changed_at"
            title={lead => `Meta Lead History - ${lead?.company_name || lead?.id || 'Lead'}`}
            getTitleFromEntity={(lead) => lead?.company_name || 'Lead'}
            renderSummary={(lead) => (
              <>
                <strong>Lead ID:</strong> {lead?.id}<br/>
                <strong>Company:</strong> {lead?.company_name || '-'}<br/>
                <strong>Current Status:</strong> {lead?.status || '-'}
              </>
            )}
            queryKeyPrefix={`metaLeadHistory-${user?.id}-${user?.user_type}`}
            emptyMessage="No status history available for this lead."
          />
        )}

        {/* Extra Fields Modal */}
        <Modal
          title={`Extra Fields - ${extraDataModal.leadName}`}
          open={extraDataModal.visible}
          onCancel={() => setExtraDataModal({ visible: false, data: [], leadName: '' })}
          footer={[
            <Button key="close" onClick={() => setExtraDataModal({ visible: false, data: [], leadName: '' })}>
              Close
            </Button>
          ]}
          width={560}
        >
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {extraDataModal.data?.map((item, index) => (
              item && (item.key || item.value) ? (
                <div
                  key={index}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #e8e8e8',
                  }}
                >
                  <div style={{ fontWeight: 500, fontSize: 12, color: '#666', marginBottom: 4 }}>
                    {formatExtraDataKey(item.key)}
                  </div>
                  <div style={{ fontSize: 14, color: '#333' }}>
                    {formatExtraDataValue(item.value)}
                  </div>
                </div>
              ) : null
            ))}
          </div>
        </Modal>

        {/* User Assignment Modal */}
        <ManageAssigneesModal
          visible={userAssignmentModalVisible}
          onClose={() => setUserAssignmentModalVisible(false)}
          leadType="meta-leads"
          fetchAssigned={getMetaLeadsAssignedUsers}
          addAssigned={addMetaLeadsUserAssignments}
          removeAssigned={removeMetaLeadsUserAssignments}
          queryKey="metaLeadsAssignedUsers"
        />

        {/* Duplicate Lead Modal */}
        <DuplicateLeadModal
          visible={duplicateModal.visible}
          lead={duplicateModal.lead}
          onClose={closeDuplicateModal}
          leadType="meta-leads"
        />
        <FollowUpModal
          open={followUpModal.visible}
          onClose={() => setFollowUpModal({ visible: false, lead: null })}
          lead={followUpModal.lead}
          leadType="meta"
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
    </>
  );
}
