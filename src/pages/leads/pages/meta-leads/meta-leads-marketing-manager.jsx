import { message } from '../../../../components/ui/notifications.jsx';
import { Modal } from '../../../../components/ui/app-modal.jsx';
import { Select } from '../../../../components/ui/app-select.jsx';
import { Button, Tooltip } from '../../../../components/ui/app-controls.jsx';
import React, { useState, useMemo, useEffect, useRef, useCallback, Suspense } from 'react';
import { Space } from 'antd';
import { MessageCircle as CommentOutlined, Upload as UploadOutlined, Download as DownloadOutlined, Info as InfoCircleOutlined, Minus as MinusOutlined, List as UnorderedListOutlined } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';

import ManageAssigneesModal from '../../../../components/manage-assignees-modal.jsx'
import { getMetaLeadsAssignedUsers, addMetaLeadsUserAssignments, removeMetaLeadsUserAssignments } from '../../../shared/services/leads.js'

import { loadTableState } from '../../../shared/utils/persistTableState.js';

import {
  getMetaLeadsListCount,
  getMetaLeadsList,
  getMetaLeadsCampaignNameList,
  getMetaLeadsAdsetNameList,
  getMetaLeadsAdNameList,
  getMetaLeadsListWithHistory,
  getMetaLeadsAdsetListByCampaign,
  getMetaLeadsAdsListByAdset,
  updateMetaLeadProjectSize,
  getMetaLeadHistory,
  getMetaLeadFormNameList,
} from '../../../shared/services/metaLeads.js';
import NewTableComponent from '../../../../components/tables/new-table.jsx';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import { ConfirmationModal, ShowRemarksLead } from '../../../clients/components/LazyModals.jsx';
import {  updateMetaLeadStatus } from '../../../shared/services/headhunting.js';
import { getManangersExecutives } from '../../../shared/services/users-service.js';
import { reassignMetaLead } from '../../../shared/services/metaLeads.js'
import useUserStore from '../../../shared/store/user-store.js';
import formatDateUniversal from '../../../shared/utils/formatDate.js';
import BootstrapDateRangeModal from '../../../../components/bootstrap-date-range-modal.component.jsx';
import DatePickerField from '../../../../components/DatePickerField.jsx';
import StatusHistoryModal, { createStatusHistoryColumn } from '../../../../components/status-history-modal.jsx';
import DuplicateLeadModal from '../../../../components/duplicate-lead-modal.component.jsx';
import { useDuplicateLead } from '../../../../components/hooks/useDuplicateLead.js';
import DuplicateCheckFilter from '../../../../components/duplicate-check-filter.jsx';
import dayjs from 'dayjs';
import { Box } from '@mui/material';
import { RemovableFilterPill } from '../../../resume/components/FilterPills.jsx';
import ResumeClearAllFiltersButton from '../../../resume/components/ResumeClearAllFiltersButton.jsx';
import '../../../../assets/styles/legacy/resume-filters.css';
import { MARKETING_MANAGER_PAGE_SIZE_OPTIONS } from '../../constants/marketing-manager-table-page-sizes.js';

// CSV export functions
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

const normalizeHistoryStatuses = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [value];
};

const normalizeExcludeKeywords = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

const toExcludeParam = (keywords) => {
  const list = normalizeExcludeKeywords(keywords);
  return list.length > 0 ? list.join(',') : null;
};

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

export default function MetaLeadsMarketingManager() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Load persisted state from sessionStorage
  const initialState = loadTableState('meta-leads-marketing-manager', searchParams, {
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
  const [selectedCampaign, setSelectedCampaign] = useState(initialState.selectedCampaign || null);
  const [selectedAdset, setSelectedAdset] = useState(initialState.selectedAdset || null); // Single selection for adset
  const [selectedAd, setSelectedAd] = useState(initialState.selectedAd || null); // Single selection for ad
  const [availableAdsets, setAvailableAdsets] = useState([]); // Store available adsets
  const [availableAds, setAvailableAds] = useState([]); // Store available ads
  const [selectedHistoryStatuses, setSelectedHistoryStatuses] = useState(() =>
    normalizeHistoryStatuses(
      initialState.selectedHistoryStatuses ?? initialState.selectedHistoryStatus
    )
  );
  const [historyStartDate, setHistoryStartDate] = useState(() => {
    if (initialState.historyStartDate) {
      return dayjs(initialState.historyStartDate);
    }
    return null;
  });
  const [historyEndDate, setHistoryEndDate] = useState(() => {
    if (initialState.historyEndDate) {
      return dayjs(initialState.historyEndDate);
    }
    return null;
  });
  const [selectedProjectSize, setSelectedProjectSize] = useState(null);
  const [updatingProjectSizeId, setUpdatingProjectSizeId] = useState(null);
  const [projectSizeFilter, setProjectSizeFilter] = useState(initialState.projectSizeFilter || null);
  const [executiveFilter, setExecutiveFilter] = useState(initialState.executiveFilter || null);
  const [duplicateCheck, setDuplicateCheck] = useState(initialState.duplicateCheck || 'all');
  const [formNamesFilter, setFormNamesFilter] = useState(
    Array.isArray(initialState.formNamesFilter) ? initialState.formNamesFilter : []
  );
  const [excludeKeywords, setExcludeKeywords] = useState(() =>
    normalizeExcludeKeywords(initialState.excludeKeywords)
  );
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({});

  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);
  const [remarksModal, setRemarksModal] = useState({ visible: false, lead: null, newStatus: null, forStatusChange: false });
  const [remarksLoading, setRemarksLoading] = useState(false);
  
  // Duplicate lead hook
  const { duplicateModal, openDuplicateModal, closeDuplicateModal, isDuplicate, getRowStyle } = useDuplicateLead();

  const [proposalFile, setProposalFile] = useState(null);
  const proposalInputRef = useRef(null);
  const [statusHistoryModal, setStatusHistoryModal] = useState({ visible: false, lead: null });
  const [extraDataModal, setExtraDataModal] = useState({ visible: false, data: [], leadName: '' });
  const [userAssignmentModalVisible, setUserAssignmentModalVisible] = useState(false);

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

  // Meta leads list count query
  const {
    data: metaLeadsCountData,
    isLoading: loadingMetaLeadsCount,
    refetch: refetchMetaLeadsCount
  } = useQuery(
    ['metaLeadsCount', dateRange, selectedCampaign, selectedAdset?.adset_name, selectedAd?.ad_name, selectedHistoryStatuses, historyStartDate, historyEndDate, projectSizeFilter, executiveFilter, duplicateCheck, formNamesFilter, excludeKeywords],
    () => getMetaLeadsListCount(
      1, // page
      dateRange?.[0]?.format('YYYY-MM-DDTHH:mm:ssZ'),
      dateRange?.[1]?.format('YYYY-MM-DDTHH:mm:ssZ'),
      null, // selectedExecId
      selectedCampaign,
      selectedAdset?.adset_name || null,
      selectedAd?.ad_name || null,
      normalizeHistoryStatuses(selectedHistoryStatuses).length > 0
        ? normalizeHistoryStatuses(selectedHistoryStatuses).join(',')
        : null,
      historyStartDate && dayjs(historyStartDate).isValid() ? dayjs(historyStartDate).format('YYYY-MM-DD') : null,
      historyEndDate && dayjs(historyEndDate).isValid() ? dayjs(historyEndDate).format('YYYY-MM-DD') : null,
      projectSizeFilter,
      executiveFilter,
      duplicateCheck === 'duplicate' ? true : duplicateCheck === 'not_duplicate' ? false : null,
      formNamesFilter.length > 0 ? formNamesFilter : null,
      toExcludeParam(excludeKeywords)
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
      selectedCampaign,
      selectedAdset?.adset_name,
      selectedAd?.ad_name,
      selectedHistoryStatuses,
      historyStartDate?.format('YYYY-MM-DD'),
      historyEndDate?.format('YYYY-MM-DD'),
      projectSizeFilter,
      executiveFilter,
      duplicateCheck,
      formNamesFilter,
      excludeKeywords
    ],
    () => {
      const formNamesParam = formNamesFilter.length > 0 ? formNamesFilter : null;
      const excludeParam = toExcludeParam(excludeKeywords);
      // Use history function if history status is selected (even without dates)
      if (selectedHistoryStatuses.length > 0) {
        return getMetaLeadsListWithHistory(
          pagination.pageIndex + 1,
          pagination.pageSize,
          sorting,
          globalFilter,
          normalizeHistoryStatuses(selectedHistoryStatuses).length > 0
            ? normalizeHistoryStatuses(selectedHistoryStatuses).join(',')
            : null,
          historyStartDate && dayjs(historyStartDate).isValid() ? dayjs(historyStartDate).format('YYYY-MM-DD') : null,
          historyEndDate && dayjs(historyEndDate).isValid() ? dayjs(historyEndDate).format('YYYY-MM-DD') : null,
          selectedCampaign,
          selectedAdset?.adset_name,
          selectedAd?.ad_name,
          projectSizeFilter,
          executiveFilter,
          duplicateCheck === 'duplicate' ? true : duplicateCheck === 'not_duplicate' ? false : null,
          formNamesParam,
          excludeParam
        );
      }

      // Use regular function for normal filtering
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
        null, // selectedExecId
        null, // statusFilter
        selectedCampaign,
        selectedAdset?.adset_name,
        selectedAd?.ad_name,
        projectSizeFilter,
        executiveFilter,
        duplicateCheck === 'duplicate' ? true : duplicateCheck === 'not_duplicate' ? false : null,
        formNamesParam,
        excludeParam
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
        search: globalFilter,
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting: sorting,
        projectSizeFilter: projectSizeFilter,
        executiveFilter: executiveFilter,
        duplicateCheck,
        formNamesFilter,
        excludeKeywords,
        selectedCampaign: selectedCampaign,
        selectedAdset: selectedAdset,
        selectedAd: selectedAd,
        selectedHistoryStatuses,
        timestamp: Date.now(),
      };

      // Serialize date range to ISO strings for storage
      if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
        stateToSave.dateRange = [
          dateRange[0] ? dateRange[0].toISOString() : null,
          dateRange[1] ? dateRange[1].toISOString() : null,
        ];
      }

      // Serialize history date range to ISO strings for storage
      if (historyStartDate) {
        stateToSave.historyStartDate = historyStartDate.toISOString();
      }
      if (historyEndDate) {
        stateToSave.historyEndDate = historyEndDate.toISOString();
      }

      sessionStorage.setItem('tableState_meta-leads-marketing-manager', JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Failed to save meta-leads marketing manager table state:', e);
    }
  }, [globalFilter, pagination.pageIndex, pagination.pageSize, sorting, dateRange, projectSizeFilter, executiveFilter, duplicateCheck, formNamesFilter, excludeKeywords, selectedCampaign, selectedAdset, selectedAd, selectedHistoryStatuses, historyStartDate, historyEndDate]);

  // Fetch executives/managers list for assignment (same as leads.jsx)
  const { data: assigningUsersData, isLoading: loadingAssigningUsers } = useQuery({
    queryKey: ['executiveList', user?.user_type],
    queryFn: () => getManangersExecutives(user?.user_type),
    enabled: !!user?.user_type, // Enable for all user types including marketing_manager
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false
  });

  // Build executives list including current user for sales managers (same as leads.jsx)
  const executivesList = useMemo(() => {
    if (user?.user_type === 'super_admin') {
      // For admin, data from getManangersExecutives() is directly the array
      const allUsers = assigningUsersData || [];
      return allUsers;
    }

    // For marketing manager, use getManangersExecutives API to get executives list
    if (user?.user_type === 'marketing_manager') {
      // Filter to only show sales_executive users
      const allUsers = Array.isArray(assigningUsersData) ? assigningUsersData : [];
      return allUsers;
    }

    return [];
  }, [assigningUsersData, user?.user_type]);

  // Fetch campaign name list for marketing_manager
  const {
    data: campaignNamesData,
    isLoading: loadingCampaignNames
  } = useQuery(
    ['metaLeadsCampaignNames'],
    () => getMetaLeadsCampaignNameList(),
    {
      enabled: user?.user_type === 'marketing_manager',
      staleTime: 15 * 60 * 1000, // 15 minutes - campaign names rarely change
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false
    }
  );

  // Fetch adset name list for marketing_manager
  const {
    data: adsetNamesData,
    isLoading: loadingAdsetNames
  } = useQuery(
    ['metaLeadsAdsetNames'],
    () => getMetaLeadsAdsetNameList(),
    {
      enabled: user?.user_type === 'marketing_manager',
      staleTime: 15 * 60 * 1000, // 15 minutes - adset names rarely change
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false
    }
  );

  // Fetch ad name list for marketing_manager
  const {
    data: adNamesData,
    isLoading: loadingAdNames
  } = useQuery(
    ['metaLeadsAdNames'],
    () => getMetaLeadsAdNameList(),
    {
      enabled: user?.user_type === 'marketing_manager',
      staleTime: 15 * 60 * 1000, // 15 minutes - ad names rarely change
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false
    }
  );

  const {
    data: metaLeadFormNamesData,
    isLoading: loadingMetaLeadFormNames,
  } = useQuery(
    ['metaLeadFormNameList'],
    () => getMetaLeadFormNameList(),
    {
      enabled: user?.user_type === 'marketing_manager',
      staleTime: 15 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const formNameListOptions = useMemo(() => {
    const raw = metaLeadFormNamesData;
    const list = Array.isArray(raw) ? raw : [];
    return list.map((name) => ({ label: name, value: name }));
  }, [metaLeadFormNamesData]);

  // Fetch adsets based on selected campaign
  const {
    data: adsetsData,
    isLoading: loadingAdsets,
    refetch: refetchAdsets
  } = useQuery(
    ['metaLeadsAdsetsByCampaign', selectedCampaign],
    () => getMetaLeadsAdsetListByCampaign(selectedCampaign),
    {
      enabled: !!selectedCampaign,
      staleTime: 0, // Always refetch when campaign changes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data && data.adsets) {
          setAvailableAdsets(data.adsets);
        } else {
          setAvailableAdsets([]);
        }
      }
    }
  );

  // Fetch ads based on selected adset
  const {
    data: adsData,
    isLoading: loadingAds,
    refetch: refetchAds
  } = useQuery(
    ['metaLeadsAdsByAdset', selectedAdset?.adset_name, selectedCampaign],
    () => {
      // If adset_name is null/undefined, pass "Unnamed" to the API
      const adsetNameForAPI = selectedAdset.adset_name || 'Unnamed';
      return getMetaLeadsAdsListByAdset(adsetNameForAPI, selectedCampaign);
    },
    {
      enabled: !!selectedAdset,

      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data && data.ads) {
          setAvailableAds(data.ads);
        }
      }
    }
  );

  // Reset pagination when filters change (but not on initial mount)
  const isInitialMountRef = useRef(true);
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return; // Skip reset on initial mount to preserve loaded pagination
    }
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [globalFilter, dateRange, selectedCampaign, selectedAdset, selectedAd, selectedHistoryStatuses, historyStartDate, historyEndDate, projectSizeFilter, duplicateCheck, formNamesFilter, excludeKeywords]);

  // Reset row selection when data changes to prevent index mismatch errors
  useEffect(() => {
    setRowSelection({});
  }, [metaLeadsData]);

  // Handle campaign changes
  useEffect(() => {
    // Clear adsets when campaign changes (after query has updated)
    if (selectedCampaign) {
      // Don't clear here - let the query onSuccess handle it
    } else {
      // Only clear when campaign is deselected
      setAvailableAdsets([]);
    }
  }, [selectedCampaign]);

  // Handle adset selection changes
  useEffect(() => {
    if (selectedAdset) {
      // Clear previous ads when a new adset is selected
      setSelectedAd(null);
      // The React Query will automatically fetch new ads for the selected adset
    } else {
      // Clear ads when no adset is selected
      setAvailableAds([]);
    }
  }, [selectedAdset]);

  // Handle date range change
  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  // Handle history status change
  const handleHistoryStatusChange = (value) => {
    const next = value || [];
    setSelectedHistoryStatuses(next);
    if (next.length === 0) {
      setHistoryStartDate(null);
      setHistoryEndDate(null);
    }
    setPagination({ pageIndex: 0, pageSize: 10 });
  };

  // Handle campaign selection change
  const handleCampaignChange = (value) => {
    setSelectedCampaign(value);
    // Reset adsets and ads when campaign changes
    setSelectedAdset(null);
    setSelectedAd(null);
    setAvailableAds([]);
    // Don't clear availableAdsets here - let the query handle it
    // This ensures adsets are properly fetched when campaign changes
  };

  // Handle adset selection (single selection)
  const handleAdsetSelect = (adset) => {
    if (selectedAdset && selectedAdset.adset_name === adset.adset_name) {
      // If clicking the same adset, deselect it
      setSelectedAdset(null);
      setSelectedAd(null);
      setAvailableAds([]);
    } else {
      // Select new adset
      setSelectedAdset(adset);
      setSelectedAd(null);
      // Don't clear availableAds here - let the query handle it
      // This ensures ads are fetched when adset is selected
    }
  };

  // Handle ad selection (single selection)
  const handleAdSelect = (ad) => {
    if (selectedAd && selectedAd.ad_name === ad.ad_name) {
      // If clicking the same ad, deselect it
      setSelectedAd(null);
    } else {
      // Select new ad
      setSelectedAd(ad);
    }
  };

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
        refetchMetaLeadsCount();

        // Also invalidate related queries to ensure fresh data
        queryClient.invalidateQueries(['metaLeads']);
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

  const hasActiveFilters = useMemo(() => {
    const hasDateRange = dateRange && (dateRange[0] || dateRange[1]);
    return (
      Boolean(globalFilter?.trim()) ||
      hasDateRange ||
      Boolean(selectedCampaign) ||
      Boolean(selectedAdset) ||
      Boolean(selectedAd) ||
      selectedHistoryStatuses.length > 0 ||
      Boolean(historyStartDate) ||
      Boolean(historyEndDate) ||
      Boolean(projectSizeFilter) ||
      Boolean(executiveFilter) ||
      duplicateCheck !== 'all' ||
      formNamesFilter.length > 0 ||
      excludeKeywords.length > 0
    );
  }, [
    globalFilter,
    dateRange,
    selectedCampaign,
    selectedAdset,
    selectedAd,
    selectedHistoryStatuses,
    historyStartDate,
    historyEndDate,
    projectSizeFilter,
    executiveFilter,
    duplicateCheck,
    formNamesFilter,
    excludeKeywords,
  ]);

  const clearAllFilters = useCallback(() => {
    setGlobalFilter('');
    setDateRange(null);
    setDatePickerResetKey((prev) => prev + 1);
    setShowDateModal(false);
    setSelectedCampaign(null);
    setSelectedAdset(null);
    setSelectedAd(null);
    setAvailableAdsets([]);
    setAvailableAds([]);
    setSelectedHistoryStatuses([]);
    setHistoryStartDate(null);
    setHistoryEndDate(null);
    setProjectSizeFilter(null);
    setExecutiveFilter(null);
    setDuplicateCheck('all');
    setFormNamesFilter([]);
    setExcludeKeywords([]);
    setPagination({ pageIndex: 0, pageSize: 10 });
    setRowSelection({});
    try {
      sessionStorage.removeItem('tableState_meta-leads-marketing-manager');
    } catch (e) {
      console.warn('Failed to clear meta-leads marketing manager table state:', e);
    }
  }, []);

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
        refetchMetaLeadsCount();

        // Also invalidate related queries to ensure fresh data
        queryClient.invalidateQueries(['metaLeads']);
        queryClient.invalidateQueries(['metaLeadsCount']);

        setUpdatingProjectSizeId(null);
      },
      onError: (error) => {
        message.error(error.message || 'Failed to update project size');
        setUpdatingProjectSizeId(null);
      },
    }
  );

  // Handle project size change
  const handleProjectSizeChange = (lead, newProjectSize) => {
    updateProjectSizeMutation.mutate({
      leadId: lead.id,
      projectSize: newProjectSize
    });
  };

  // CSV export handlers
  const handleExportSelected = async () => {
    try {
      const selectedRowIds = Object.keys(rowSelection).filter(key => rowSelection[key]);
      const safeResults = Array.isArray(metaLeadsData?.results) ? metaLeadsData.results : [];
      const selectedRows = safeResults.filter((row) => selectedRowIds.includes(String(row.id)));

      if (selectedRows.length === 0) {
        message.info("No rows selected for export.");
        return;
      }

      // Transform data to use display names instead of IDs
      const transformedRows = selectedRows.map(row => {
        const transformedRow = { ...row };

        // Transform assigned_to to use display name format
        if (transformedRow.assigned_to_name && transformedRow.assigned_to_type) {
          const typeDisplay = transformedRow.assigned_to_type === 'sales_executive' ? 'Executive' : 'Manager';
          transformedRow.assigned_to = `${transformedRow.assigned_to_name} (${typeDisplay})`;
        } else if (transformedRow.assigned_to_name) {
          transformedRow.assigned_to = transformedRow.assigned_to_name;
        } else {
          transformedRow.assigned_to = '-';
        }

        return transformedRow;
      });

      // Get columns for CSV (excluding only status_history action column)
      const csvColumns = columns.filter(col =>
        col.accessorKey &&
        !['status_history'].includes(col.accessorKey)
      );

      const csv = arrayToCSV(transformedRows, csvColumns);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meta-leads-selected-${new Date().toISOString().split("T")[0]}.csv`;
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
    // Marketing Manager specific column order
    return [
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
      {
        header: 'Created Date',
        id: 'created_time', // Explicit id for sorting
        accessorKey: 'created_time',
        sortUndefined: 'last', // Handle undefined/null values
        sortDescFirst: false, // Start with ascending order (A to Z)
        Cell: ({ cell }) => <span>{cell.getValue() ? formatDateUniversal(cell.getValue(), true) : '-'}</span>,
      },
      {
        header: 'Ad Name',
        id: 'ad_name', // Explicit id for sorting
        accessorKey: 'ad_name',
        sortUndefined: 'last', // Handle undefined/null values
        sortDescFirst: false, // Start with ascending order (A to Z)
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Ad Set Name',
        id: 'adset_name', // Explicit id for sorting
        accessorKey: 'adset_name',
        sortUndefined: 'last', // Handle undefined/null values
        sortDescFirst: false, // Start with ascending order (A to Z)
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Campaign Name',
        id: 'campaign_name', // Explicit id for sorting
        accessorKey: 'campaign_name',
        sortUndefined: 'last', // Handle undefined/null values
        sortDescFirst: false, // Start with ascending order (A to Z)
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
{
         header: 'Form Name',
         id: 'form_name', // Explicit id for sorting
         accessorKey: 'form_name',
         sortUndefined: 'last', // Handle undefined/null values
         sortDescFirst: false, // Start with ascending order (A to Z)
         Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
       },
       {
         header: 'Form Names',
         id: 'form_names', // Explicit id for sorting
         accessorKey: 'form_names',
         sortUndefined: 'last',
         sortDescFirst: false,
         Cell: ({ cell }) => {
           const formNames = Array.isArray(cell.getValue()) ? cell.getValue().join(', ') : (cell.getValue() || '-');
           return <span>{formNames}</span>;
         },
       },
      {
        header: 'Status',
        accessorKey: 'status',
        Cell: ({ cell }) => (
          <span
            style={{
              color:
                statusColors[cell.getValue() || 'Pending Contact'] ||
                '#666',
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#f0f0f0',
            }}
          >
            {cell.getValue() || 'Pending Contact'}
          </span>
        ),
      },
      // Project Size column - only for users who can view it
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


          if (user?.user_type === 'marketing_manager') {
            return <span>{formatProjectSize(currentValue)}</span>;
          }

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
              disabled={!canEditProjectSize(row.original) || isUpdating}
            />
          );
        },
      }] : []),
      {
        header: 'Platform',
        id: 'platform', // Explicit id for sorting
        accessorKey: 'platform',
        sortUndefined: 'last', // Handle undefined/null values
        sortDescFirst: false, // Start with ascending order (A to Z)
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
    {
      header: 'Remarks',
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
            onClick={() =>
              setRemarksModal({
                visible: true,
                lead: row.original,
                newStatus: row.original.status,
                forStatusChange: false,
              })
            }
            title={hasRemarks ? 'View/Edit Remarks' : 'Add Remarks'}
          />
        );
      },
    },

      {
        header: 'Name',
        id: 'full_name', // Explicit id for sorting
        accessorKey: 'full_name',
        sortUndefined: 'last', // Handle undefined/null values
        sortDescFirst: false, // Start with ascending order (A to Z)
        Cell: ({ cell, row }) => {
          const name = cell.getValue() || '-';
          const lead = row.original;
          const isDuplicateLead = isDuplicate(lead);

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
          
          return (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {name}
              {duplicateIcon}
            </span>
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
        header: 'How Many Hires',
        id: 'how_many_hires', // Explicit id for sorting
        accessorKey: 'how_many_hires',
        sortUndefined: 'last', // Handle undefined/null values
        sortDescFirst: false, // Start with ascending order (A to Z)
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      // Rest of the fields after the specified sequence
      {
        header: 'Lead ID',
        accessorKey: 'lead_id',
        enableSorting: false,
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
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
        header: 'City',
        id: 'city', // Explicit id for sorting
        accessorKey: 'city',
        sortUndefined: 'last', // Handle undefined/null values
        sortDescFirst: false, // Start with ascending order (A to Z)
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Preferred Contact Method',
        accessorKey: 'preferred_contact_method',
        Cell: ({ cell }) => <span>{cell.getValue() || '-'}</span>,
      },
      {
        header: 'Assigned To',
        accessorKey: 'assigned_to',
        Cell: ({ row }) => {
          const assignedName = row.original.assigned_to_name || '-';
          const assignedType = row.original.assigned_to_type || '';

          return (
            <span>
              {assignedName}
              {assignedType && assignedName !== '-' ? ` (${assignedType === 'sales_executive' ? 'Executive' : 'Manager'})` : ''}
            </span>
          );
        },
      },
       createStatusHistoryColumn({
         onOpenHistory: (lead) => setStatusHistoryModal({ visible: true, lead }),
       }),
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
                type="link"
                
                onClick={() =>
                  setExtraDataModal({
                    visible: true,
                    data: extraData,
                    leadName: row.original.full_name || row.original.company_name || 'Lead',
                  })
                }
                style={{ padding: 0 }}
              >
                View
              </Button>
            </Tooltip>
          );
        },
      },
    ];
  }, [canViewProjectSize, canEditProjectSize, PROJECT_SIZE_OPTIONS, updatingProjectSizeId, pagination.pageIndex, pagination.pageSize]);

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




        {/* Campaign dropdown and Adset/Ad pills for marketing_manager */}
          <>
            {/* Campaign Selection */}
            <div style={{ marginBottom: '16px', padding: '0 8px' }}>
              <Space align="center">
                <span style={{ fontWeight: '500', fontSize: '14px' }}>Campaign:</span>
                <Select
                  placeholder="Select Campaign"
                  value={selectedCampaign}
                  onChange={handleCampaignChange}
                  style={{ width: 'fit-content', minWidth: '200px' }}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  loading={loadingCampaignNames}
                  popupMatchSelectWidth={false}
                  options={campaignNamesData?.map(campaign => ({
                    label: campaign,
                    value: campaign
                  }))}
                />
                </Space>
            </div>

            {/* Adset and Ad Pills on Same Line */}
            {(availableAdsets.length > 0 || availableAds.filter(ad => ad.ad_name !== null && ad.ad_name !== undefined && ad.ad_name.trim() !== '').length > 0) && (
              <div style={{ marginBottom: '16px', padding: '0 8px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                  {/* Adset Pills */}
                  {availableAdsets.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '500', fontSize: '14px' }}>Adsets:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {availableAdsets.map((adset, index) => {
                            const isSelected = selectedAdset && selectedAdset.adset_name === adset.adset_name;
                            const displayName = adset.adset_name || 'Unnamed';
                            return (
                              <Button
                                key={index}
                                type="default"
                                size="small"
                                onClick={() => handleAdsetSelect(adset)}
                                style={{
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  padding: '4px 12px',
                                  height: 'auto',
                                  fontWeight: isSelected ? '600' : '400',
                                  backgroundColor: isSelected ? '#3e6a9f' : '#f0f0f0',
                                  borderColor: isSelected ? '#3e6a9f' : '#d9d9d9',
                                  color: isSelected ? '#ffffff' : '#333333'
                                }}
                              >
                                {displayName} ({adset.lead_count})
                              </Button>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Ad Pills */}
                  {availableAds.filter(ad => ad.ad_name !== null && ad.ad_name !== undefined && ad.ad_name.trim() !== '').length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '500', fontSize: '14px' }}>Ads:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {availableAds
                          .filter(ad => ad.ad_name !== null && ad.ad_name !== undefined && ad.ad_name.trim() !== '')
                          .map((ad, index) => {
                            const isSelected = selectedAd && selectedAd.ad_name === ad.ad_name;
                            return (
                              <Button
                                key={index}
                                type="default"
                                size="small"
                                onClick={() => handleAdSelect(ad)}
                                style={{
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  padding: '4px 12px',
                                  height: 'auto',
                                  fontWeight: isSelected ? '600' : '400',
                                  backgroundColor: isSelected ? '#3e6a9f' : '#f0f0f0',
                                  borderColor: isSelected ? '#3e6a9f' : '#d9d9d9',
                                  color: isSelected ? '#ffffff' : '#333333'
                                }}
                              >
                                {ad.ad_name} ({ad.lead_count})
                              </Button>
                            );
                          })}
            </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status History Row */}
            <div style={{ marginBottom: '16px', padding: '0 8px' }}>
              <Space align="center" wrap>
                <Space align="center">
                  <span style={{ fontWeight: '500', fontSize: '14px' }}>Status History:</span>
                  <Select
                    mode="multiple"
                    placeholder="Select Status History"
                    value={selectedHistoryStatuses}
                    onChange={handleHistoryStatusChange}
                    style={{ width: 'fit-content', minWidth: '220px', maxWidth: '320px' }}
                    allowClear
                    maxTagCount={0}
                    popupMatchSelectWidth={false}
                    options={STATUS_DROPDOWN_OPTIONS}
                  />
                </Space>

                {selectedHistoryStatuses.length > 0 && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '500', color: '#666' }}>Start Date</label>
                      <DatePickerField
                        value={historyStartDate}
                        onChange={(date) => {
                          setHistoryStartDate(date);
                          setPagination({ pageIndex: 0, pageSize: 10 });
                        }}
                        placeholder="Select Start Date"
                        format="YYYY-MM-DD"
                        showTime={false}
                        style={{ width: 'fit-content', minWidth: '150px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '500', color: '#666' }}>End Date</label>
                      <DatePickerField
                        value={historyEndDate}
                        onChange={(date) => {
                          setHistoryEndDate(date);
                          setPagination({ pageIndex: 0, pageSize: 10 });
                        }}
                        placeholder="Select End Date"
                        format="YYYY-MM-DD"
                        showTime={false}
                        style={{ width: 'fit-content', minWidth: '150px' }}
                      />
                    </div>
                  </>
                )}
              </Space>

              {(selectedHistoryStatuses.length > 0 || historyStartDate || historyEndDate) && (
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 0.75,
                    mt: 1.25,
                    alignItems: 'center',
                  }}
                >
                  {selectedHistoryStatuses.map((status) => (
                    <RemovableFilterPill
                      key={`status-${status}`}
                      label={status}
                      onRemove={() => {
                        setSelectedHistoryStatuses((prev) =>
                          prev.filter((item) => item !== status)
                        );
                        setPagination({ pageIndex: 0, pageSize: 10 });
                      }}
                    />
                  ))}
                  {historyStartDate && dayjs(historyStartDate).isValid() && (
                    <RemovableFilterPill
                      label={`Start: ${dayjs(historyStartDate).format('YYYY-MM-DD')}`}
                      onRemove={() => {
                        setHistoryStartDate(null);
                        setPagination({ pageIndex: 0, pageSize: 10 });
                      }}
                    />
                  )}
                  {historyEndDate && dayjs(historyEndDate).isValid() && (
                    <RemovableFilterPill
                      label={`End: ${dayjs(historyEndDate).format('YYYY-MM-DD')}`}
                      onRemove={() => {
                        setHistoryEndDate(null);
                        setPagination({ pageIndex: 0, pageSize: 10 });
                      }}
                    />
                  )}
                </Box>
              )}
            </div>

            {/* Project Size Filter Row */}
            <div style={{ marginBottom: '16px', padding: '0 8px' }}>
              <Space align="center">
                <span style={{ fontWeight: '500', fontSize: '14px' }}>Project Size:</span>
                <Select
                  placeholder="Select Project Size"
                  value={projectSizeFilter}
                  onChange={(value) => {
                    setProjectSizeFilter(value);
                    // Reset pagination to default values
                    setPagination({ pageIndex: 0, pageSize: 10 });
                  }}
                  style={{ width: 'fit-content', minWidth: '200px' }}
                  allowClear
                  popupMatchSelectWidth={false}
                  options={PROJECT_SIZE_OPTIONS}
                />
              </Space>
            </div>

            {/* Executive Filter Row - Only for marketing manager */}
            {user?.user_type === 'marketing_manager' && (
              <div style={{ marginBottom: '16px', padding: '0 8px' }}>
                <Space align="center">
                  <span style={{ fontWeight: '500', fontSize: '14px' }}>Executive:</span>
                  <Select
                    placeholder="Select Executive"
                    value={executiveFilter}
                    onChange={(value) => {
                       setExecutiveFilter(value);
                      // Reset pagination to default values
                      setPagination({ pageIndex: 0, pageSize: 10 });
                      // Force refetch of queries
                      setTimeout(() => {
                        queryClient.invalidateQueries(['metaLeadsCount']);
                        queryClient.invalidateQueries(['metaLeads']);
                      }, 100);
                    }}
                    style={{ width: 'fit-content', minWidth: '200px' }}
                    allowClear
                    popupMatchSelectWidth={false}
                    loading={loadingAssigningUsers}
                    options={executivesList?.map(user => ({
                      label: `${user.name} (${user.user_type === 'sales_executive' ? 'Executive' : 'Manager'})`,
                      value: user.id
                    })) || []}
                  />
                </Space>

              </div>
            )}

            {/* Duplicate Check Filter Row */}
            <div style={{ marginBottom: '16px', padding: '0 8px' }}>
              <DuplicateCheckFilter
                value={duplicateCheck}
                onChange={(val) => {
                  setDuplicateCheck(val || 'all');
                  setPagination({ pageIndex: 0, pageSize: 10 });
                }}
                label="Duplicate:"
                minWidth={200}
              />
            </div>

            {user?.user_type === 'marketing_manager' && (
              <div style={{ marginBottom: '16px', padding: '0 8px' }}>
                <Space align="center" wrap>
                  <span style={{ fontWeight: '500', fontSize: '14px' }}>Exclude Keywords:</span>
                  <Select
                    mode="tags"
                    allowClear
                    placeholder="Type keyword and press Enter"
                    value={excludeKeywords}
                    onChange={(values) => {
                      setExcludeKeywords(normalizeExcludeKeywords(values));
                      setPagination({ pageIndex: 0, pageSize: 10 });
                    }}
                    tokenSeparators={[',']}
                    style={{ minWidth: 280, maxWidth: 560 }}
                    maxTagCount="responsive"
                    popupMatchSelectWidth={false}
                  />
                </Space>
              </div>
            )}

            {user?.user_type === 'marketing_manager' && (
              <div style={{ marginBottom: '16px', padding: '0 8px' }}>
                <Space align="center" wrap>
                  <span style={{ fontWeight: '500', fontSize: '14px' }}>Form Names:</span>
                  <Select
                    mode="multiple"
                    allowClear
                    showSearch
                    placeholder="Select form names"
                    value={formNamesFilter}
                    onChange={(values) => {
                      setFormNamesFilter(values || []);
                      setPagination({ pageIndex: 0, pageSize: 10 });
                    }}
                    style={{ minWidth: 280, maxWidth: 560 }}
                    loading={loadingMetaLeadFormNames}
                    options={formNameListOptions}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    maxTagCount="responsive"
                    popupMatchSelectWidth={false}
                  />
                </Space>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: '12px',
                  }}
                >
                  <ResumeClearAllFiltersButton
                    onClick={clearAllFilters}
                    disabled={!hasActiveFilters}
                  />
                </div>
              </div>
            )}

        </>

        {/* Export buttons for marketing manager */}
        {Object.keys(rowSelection).filter(key => rowSelection[key]).length > 0 && (
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
              Export Selected ({Object.keys(rowSelection).filter(key => rowSelection[key]).length})
            </Button>
          </div>
        )}

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
            enableRowSelection={true}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            getRowId={(row) => row.id}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            enableStickyHeader={true}
            heading={`Meta Leads (${metaLeadsData?.count || 0})`}
            getRowStyle={getRowStyle}
            pageSizeOptions={MARKETING_MANAGER_PAGE_SIZE_OPTIONS}
          />
        </div>

        {/* Remarks Modal */}
     <Suspense fallback={null}>
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

      // Job totals come only from an explicit proposal/contract submission.
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
  viewOnlyMode={true}
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
     </Suspense>

        {/* Status History Modal */}
        <StatusHistoryModal
          open={statusHistoryModal.visible}
          entity={statusHistoryModal.lead}
          onClose={() => setStatusHistoryModal({ visible: false, lead: null })}
          fetchHistoryApi={getMetaLeadHistory}
          historyDateKey="changed_at"
          getTitleFromEntity={(lead) => lead?.company_name || 'Lead'}
          renderSummary={(lead) => (
            <>
              <strong>Lead ID:</strong> {lead?.id}<br/>
              <strong>Company:</strong> {lead?.company_name || '-'}<br/>
              <strong>Current Status:</strong> {lead?.status || '-'}
            </>
          )}
          queryKeyPrefix="metaLeadStatusHistory"
          emptyMessage="No status history available for this lead."
        />

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
          </div>
        </div>
    </>
  );
}


