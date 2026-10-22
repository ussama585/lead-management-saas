import React, { useMemo, useState, useCallback, useEffect, useRef, Suspense } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Link,
  IconButton,
} from "@mui/material";
import { getDataLeadsStats } from "../../../shared/services/data-leads-service.js";
import StatusFilterTabs from "../../../../components/status-filter-tabs.jsx";
import { File as InsertDriveFileOutlinedIcon } from 'lucide-react';
import GlobalStyles from "@mui/material/GlobalStyles";
import { alpha } from "@mui/material/styles";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useNavigate, Link as RouterLink, useSearchParams } from "react-router-dom";
import {
  message,
  Avatar as AntAvatar,
  Alert as AntAlert,
  Select as AntSelect,
  Tooltip as AntTooltip,
  Button as AntButton,
  Space,
} from "antd";
import { Info as InfoCircleOutlined, MessageCircle as CommentOutlined, Upload as UploadOutlined, Minus as MinusOutlined, Clock as ClockCircleOutlined } from 'lucide-react';
import DuplicateLeadModal from '../../../../components/duplicate-lead-modal.component.jsx';
import { useDuplicateLead } from '../../../../components/hooks/useDuplicateLead.js';
import BreadCrumb from "../../../../components/breadcrumb.component.jsx";
import NewTableComponent from "../../../../components/tables/new-table.jsx";
import {
  getDataLeadHistoryTrack,
  createDataLeadFollowUp,
} from "../../../shared/services/data-leads-service.js";
import formatDateUniversal from "../../../shared/utils/formatDate.js";
import { getManangersExecutives } from "../../../shared/services/users-service.js";
import ShowRemarksLead from "../../../../components/show-remarks-lead.jsx";
import { createStatusColumn, isLeadConvertedToClient } from "../../../shared/utils/statusColumn.jsx";
import { createAssignedToColumn } from "../../../shared/utils/assignedToColumn.jsx";
import useUserStore from "../../../shared/store/user-store.js";
import { ConfirmationModal } from "../../../clients/components/LazyModals.jsx";
import BootstrapDateRangeModal from "../../../../components/bootstrap-date-range-modal.component.jsx";
import { loadTableState } from "../../../shared/utils/persistTableState.js";
import StatusHistoryModal, { createStatusHistoryColumn } from "../../../../components/status-history-modal.jsx";
import dayjs from "dayjs";
import api from '../../../shared/services/api.js';
import DataLeadDialog from './data-lead-dialog.jsx';

async function getDataLeadsList(params) {
  const { data } = await api.get('/data-leads/list', { params });
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not load data leads.');
  if (!Array.isArray(data?.results)) throw new Error('Could not read the data leads list.');
  return data;
}
async function getDataLeadsListCount(params) {
  const { data } = await api.get('/data-leads/list-count', { params });
  if (data?.success === false || data?.status === false) throw new Error(data.message || 'Could not load lead counts.');
  return data;
}
async function updateDataLeadStatus(id, payload, config = {}) {
  const { data } = await api.patch(`/data-leads/details/${encodeURIComponent(id)}`, payload, config);
  if (data?.success === false || data?.status === false) throw new Error(data.message || 'Could not update the lead.');
  return data;
}

import {
  STATUS_OPTIONS,
  STATUS_API_KEYS,
  STATUS_TAB_COLORS,
  STATUSES_REQUIRING_REMARKS,
  PROJECT_SIZE_OPTIONS,
} from "./data-leads-constants.js";
import MarketingManagerFilters from "../website-leads/components/marketing-manager-filters.jsx";
import FollowUpModal from "../../../../components/follow-up-modal.component.jsx";
import { MARKETING_MANAGER_PAGE_SIZE_OPTIONS } from "../../constants/marketing-manager-table-page-sizes.js";


const mapStatusToApiKey = (status) =>
  STATUS_API_KEYS[status] ||
  status
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");


const DataLeads = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [leadDialog, setLeadDialog] = useState(null);
  const [projectSizeFilter, setProjectSizeFilter] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Load persisted state from sessionStorage
  const initialState = loadTableState('data-leads-page', searchParams, {
    defaultStatus: '',
    status: '',
  });
  
  const [pagination, setPagination] = useState({ 
    pageIndex: initialState.pageIndex, 
    pageSize: initialState.pageSize 
  });
  const [sorting, setSorting] = useState(initialState.sorting);
  const [globalFilter, setGlobalFilter] = useState(initialState.search || '');
  const [selectedStatus, setSelectedStatus] = useState(initialState.statusFilter || '');
  const [selectedExecutive, setSelectedExecutive] = useState(initialState.executiveFilter || '');
  const [duplicateCheck, setDuplicateCheck] = useState(
    initialState.duplicateCheck || "all",
  );
  
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
  
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [remarksModal, setRemarksModal] = useState({
    visible: false,
    lead: null,
    forStatusChange: false,
    newStatus: null,
  });
  const [remarksLoading, setRemarksLoading] = useState(false);
  const [proposalFile, setProposalFile] = useState(null);
  const proposalInputRef = useRef(null);
  const [updatingProjectSizeId, setUpdatingProjectSizeId] = useState(null);
  const [assignmentModal, setAssignmentModal] = useState({
    visible: false,
    lead: null,
    newAssigneeId: null,
    newAssigneeName: null,
  });
  const [showDateModal, setShowDateModal] = useState(false);
  const [datePickerResetKey, setDatePickerResetKey] = useState(0);
  const [followUpModal, setFollowUpModal] = useState({ visible: false, lead: null });
  const queryClient = useQueryClient();

  // Status history modal (admin only)
  const [statusHistoryModal, setStatusHistoryModal] = useState({ visible: false, entity: null });

  // Duplicate lead hook
  const { duplicateModal, openDuplicateModal, closeDuplicateModal, isDuplicate, getRowStyle } = useDuplicateLead();

  // Stats for executives (data leads assigned per executive)
  const {
    data: dataLeadsStats,
    isLoading: isStatsLoading,
  } = useQuery("dataLeadsStats", () => getDataLeadsStats(), {
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Executives / managers list for assignment dropdowns
  const {
    data: assigningUsersData,
    isLoading: loadingAssigningUsers,
  } = useQuery({
    queryKey: ["executiveList", user?.user_type],
    queryFn: () => getManangersExecutives(user?.user_type),
    enabled: user?.user_type === "sales_manager" || user?.user_type === "admin",
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Persist table state to sessionStorage
  useEffect(() => {
    try {
      const stateToSave = {
        statusFilter: selectedStatus,
        executiveFilter: selectedExecutive,
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

      sessionStorage.setItem('tableState_data-leads-page', JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Failed to save data-leads table state:', e);
    }
  }, [selectedStatus, selectedExecutive, duplicateCheck, globalFilter, pagination.pageIndex, pagination.pageSize, sorting, dateRange]);



  const { data: countsData, isLoading: isCountsLoading, isError: isCountsError, error: countsError, refetch: refetchCounts } = useQuery(
    ["dataLeadsCounts", user?.id, user?.user_type, projectSizeFilter, selectedExecutive, duplicateCheck, dateRange?.[0]?.format('YYYY-MM-DDTHH:mm:ssZ'), dateRange?.[1]?.format('YYYY-MM-DDTHH:mm:ssZ')],
    () => {
      const params = {
        assigned_to: selectedExecutive || undefined,
        project_size: projectSizeFilter || undefined,
      };
      if (duplicateCheck === "duplicate") {
        params.is_duplicate = true;
      } else if (duplicateCheck === "not_duplicate") {
        params.is_duplicate = false;
      }
      if (dateRange?.[0]) {
        params.start_date = dateRange[0].format('YYYY-MM-DDTHH:mm:ssZ');
      }
      if (dateRange?.[1]) {
        params.end_date = dateRange[1].format('YYYY-MM-DDTHH:mm:ssZ');
      }
      return getDataLeadsListCount(params);
    },
    {
      refetchOnWindowFocus: false,
    },
  );

  
  // Executive tabs: list and count from stats API only (data-leads/stats)
  const executivesList = useMemo(() => {
    return Array.isArray(dataLeadsStats) ? dataLeadsStats : [];
  }, [dataLeadsStats]);

  const statusCounts = countsData || {};
  const getStatusCount = useCallback(
    (key) =>
      statusCounts && statusCounts[key] !== undefined ? statusCounts[key] : 0,
    [statusCounts],
  );

  // Main data leads listing
  const { data, isLoading, isFetching, isError: isListError, error: listError, refetch } = useQuery(
    [
      "dataLeads", user?.id, user?.user_type, projectSizeFilter,
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      sorting?.[0]?.id,
      sorting?.[0]?.desc,
      selectedStatus,
      selectedExecutive,
      duplicateCheck,
      dateRange?.[0]?.format('YYYY-MM-DDTHH:mm:ssZ'),
      dateRange?.[1]?.format('YYYY-MM-DDTHH:mm:ssZ'),
    ],
    () => {
      const params = {
        page: pagination.pageIndex + 1,
        size: pagination.pageSize,
        search: globalFilter,
        sort_by: sorting?.[0]?.id || undefined,
        order: sorting?.[0]?.desc ? "desc" : "asc",
        status: selectedStatus || undefined,
        assigned_to: selectedExecutive || undefined,
        project_size: projectSizeFilter || undefined,
      };
      if (duplicateCheck === "duplicate") {
        params.is_duplicate = true;
      } else if (duplicateCheck === "not_duplicate") {
        params.is_duplicate = false;
      }
      if (dateRange?.[0]) {
        params.start_date = dateRange[0].format('YYYY-MM-DDTHH:mm:ssZ');
      }
      if (dateRange?.[1]) {
        params.end_date = dateRange[1].format('YYYY-MM-DDTHH:mm:ssZ');
      }
      return getDataLeadsList(params);
    },
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
    },
  );

  const tableData = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const statusTabs = useMemo(
    () => [
      { label: "All", value: "", apiKey: "total_count" },
      ...[...new Set([...STATUS_OPTIONS, ...tableData.map(row => row.status), ...Object.keys(statusCounts).filter(key => !['total_count', 'assigned_count', 'unassigned', 'other'].includes(key)).map(key => key.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()))])].filter(Boolean).map((status) => ({
        label: status,
        value: status,
        apiKey: mapStatusToApiKey(status),
      })),
      {
        label: "Unassigned",
        value: "Unassigned",
        apiKey: STATUS_API_KEYS.Unassigned,
      },
      { label: "Other", value: "Other", apiKey: STATUS_API_KEYS.Other },
    ],
    [tableData, statusCounts],
  );

  const { mutate: mutateStatus } = useMutation(
    ({ leadId, data, config }) => updateDataLeadStatus(leadId, data, config),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          predicate: ({ queryKey }) =>
            Array.isArray(queryKey) && queryKey[0] === "dataLeads",
        });
        queryClient.invalidateQueries(["dataLeadsCounts"]);
        message.success("Status updated");
      },
      onError: (error) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update status";
        message.error(errorMessage);
      },
    },
  );

  const {
    mutate: mutateAssignment,
    isLoading: isAssignmentUpdating,
  } = useMutation(
    ({ leadId, assigned_to }) =>
      updateDataLeadStatus(leadId, { assigned_to }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          predicate: ({ queryKey }) =>
            Array.isArray(queryKey) && queryKey[0] === "dataLeads",
        });
        message.success("Assignee updated");
        setAssignmentModal({ visible: false, lead: null, newAssigneeId: null, newAssigneeName: null });
      },
      onError: (error) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update assignee";
        message.error(errorMessage);
        setAssignmentModal({ visible: false, lead: null, newAssigneeId: null, newAssigneeName: null });
      },
    },
  );

  const { mutate: mutateProjectSize } = useMutation(
    ({ leadId, projectSize }) =>
      updateDataLeadStatus(leadId, { project_size: projectSize }),
    {
      onMutate: ({ leadId }) => {
        setUpdatingProjectSizeId(leadId);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          predicate: ({ queryKey }) =>
            Array.isArray(queryKey) && queryKey[0] === "dataLeads",
        });
        queryClient.invalidateQueries(["dataLeadsCounts"]);
        message.success("Project size updated");
      },
      onError: (error) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update project size";
        message.error(errorMessage);
      },
      onSettled: () => setUpdatingProjectSizeId(null),
    },
  );

  const { mutateAsync: mutateDataLeadFollowUpAsync } = useMutation(
    ({ leadId, payload }) => createDataLeadFollowUp(leadId, payload),
    {
      onSuccess: (response) => {
        message.success(response?.message || "Data lead follow up saved successfully");
        queryClient.invalidateQueries({
          predicate: ({ queryKey }) =>
            Array.isArray(queryKey) && queryKey[0] === "dataLeads",
        });
        refetch();
      },
      onError: (error) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to save data lead follow up";
        message.error(errorMessage);
      },
    }
  );

  const handleInlineStatusChange = useCallback(
    (lead, nextStatus) => {
      if (!lead?.id || !nextStatus) return;
      if (isLeadConvertedToClient(lead)) return;

      if (STATUSES_REQUIRING_REMARKS.has(nextStatus)) {
        setProposalFile(null);
        setRemarksModal({
          visible: true,
          lead,
          forStatusChange: true,
          newStatus: nextStatus,
        });
        return;
      }

      // Status change without remarks modal - don't include remarks in payload
      setUpdatingStatusId(lead.id);
      mutateStatus(
        { leadId: lead.id, data: { status: nextStatus } },
        {
          onSettled: () => setUpdatingStatusId(null),
        },
      );
    },
    [mutateStatus],
  );

  const handleCloseRemarksModal = useCallback(() => {
    setRemarksModal({
      visible: false,
      lead: null,
      forStatusChange: false,
      newStatus: null,
    });
    setRemarksLoading(false);
    setProposalFile(null);
    if (proposalInputRef.current) {
     proposalInputRef.current.value = '';
   }
  }, []);

  const handleRemarksSave = useCallback(
    (remarksText = "", contractData = {}) => {
      if (!remarksModal.lead?.id) {
        handleCloseRemarksModal();
        return;
      }

      const trimmed = remarksText.trim();
      const includeRemarks = Boolean(trimmed);

      // Detect remarks-only mode (no status change)
      const isRemarksOnlyMode = !remarksModal.forStatusChange && !remarksModal.newStatus;

      console.log("isRemarksOnlyMode (Data Leads):", isRemarksOnlyMode);

      if (isRemarksOnlyMode) {
        // REMARKS ONLY - Don't include status or any contract data
        if (!includeRemarks) {
          // Nothing to update
          handleCloseRemarksModal();
          return;
        }

        const dataPayload = {
          remarks: trimmed,
        };

        setRemarksLoading(true);
        setUpdatingStatusId(remarksModal.lead.id);

        mutateStatus(
          { leadId: remarksModal.lead.id, data: dataPayload },
          {
            onSuccess: () => {
              setProposalFile(null);
              handleCloseRemarksModal();
            },
            onError: () => {},
            onSettled: () => {
              setRemarksLoading(false);
              setUpdatingStatusId(null);
            },
          },
        );

        return;
      }

      // STATUS CHANGE MODE - Include contract data + status
      const targetStatus = remarksModal.forStatusChange
        ? remarksModal.newStatus
        : remarksModal.lead.status;

      // Check if conversion was already handled by conversion-to-potential API
      if (targetStatus === 'Potential Client' && contractData?._conversionHandled) {
        // Conversion API already handled everything including status update
        // No need to call mutateStatus - just close modal and refresh table
        console.log('Conversion already handled by API, status updated by conversion API');
        setProposalFile(null);
        message.success('Lead converted to Potential Client successfully');
        handleCloseRemarksModal();
        return;
      }

      if (STATUSES_REQUIRING_REMARKS.has(targetStatus) && !trimmed) {
        message.error("Remarks are required");
        return;
      }

      const filteredContractData = Object.entries(contractData || {}).reduce(
        (acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            acc[key] = value;
          }
          return acc;
        },
        {},
      );

      const payload = {
        status: targetStatus,
        ...filteredContractData,
      };
      if (includeRemarks) {
        payload.remarks = trimmed;
      }

      const runMutation = (data, config) =>
        new Promise((resolve, reject) => {
          mutateStatus(
            { leadId: remarksModal.lead.id, data, config },
            {
              onSuccess: resolve,
              onError: reject,
              onSettled: () => setUpdatingStatusId(null),
            },
          );
        });

      setRemarksLoading(true);
      setUpdatingStatusId(remarksModal.lead.id);

      const mutationPromise =
        proposalFile && targetStatus === "Potential Client"
          ? (() => {
              const formData = new FormData();
              Object.entries(payload).forEach(([key, value]) => {
                formData.append(key, value);
              });
              formData.append("proposal", proposalFile);
              return runMutation(formData, {
                headers: { "Content-Type": "multipart/form-data" },
              });
            })()
          : runMutation(payload);

      mutationPromise
        .then(() => {
          setProposalFile(null);
          handleCloseRemarksModal();
        })
        .catch(() => {})
        .finally(() => {
          setRemarksLoading(false);
        });
    },
    [handleCloseRemarksModal, mutateStatus, proposalFile, remarksModal],
  );

  // Handle assignment change - show confirmation modal
  const handleAssignedToChange = useCallback(
    (lead, newAssigneeName) => {
      if (isLeadConvertedToClient(lead)) return;
      const newAssignee = executivesList?.find((user) => user.name === newAssigneeName);
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
    },
    [executivesList],
  );

  // Confirm assignment - call API directly like statusColumn
  const confirmAssignment = useCallback(() => {
    if (!assignmentModal.lead || !assignmentModal.newAssigneeId) return;
    
    // Call API directly, same pattern as statusColumn's onDirectStatusUpdate
    mutateAssignment({ 
      leadId: assignmentModal.lead.id, 
      assigned_to: assignmentModal.newAssigneeId || null 
    });
  }, [assignmentModal.lead, assignmentModal.newAssigneeId, mutateAssignment]);

  const copyToClipboard = useCallback(async (value, label) => {
    if (!value) {
      message.warning(`No ${label} available to copy.`);
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      message.success(`${label} copied to clipboard`);
    } catch (error) {
      message.error(`Failed to copy ${label}`);
    }
  }, []);

  const handleProjectSizeChange = useCallback(
    (lead, newSize) => {
      if (!lead?.id) return;
      if (isLeadConvertedToClient(lead)) return;
      mutateProjectSize({ leadId: lead.id, projectSize: newSize });
    },
    [mutateProjectSize],
  );

  const columns = useMemo(
  () => [
      {
        header: "#",
        accessorKey: "row_number",
        enableSorting: false,
        size: 70,
        Cell: ({ row }) => {
          const rowIndex = row.index;
          const pageIndex = pagination.pageIndex;
          const pageSize = pagination.pageSize;
          return <span>{pageIndex * pageSize + rowIndex + 1}</span>;
        },
      },
      {
        header: "Old Remarks",
        id: "remarks", // Explicit id for sorting
        accessorKey: "remarks",
        size: 200,
        sortUndefined: "last", // Handle undefined/null values
        sortDescFirst: false, // Start with ascending order (A to Z)
        Cell: ({ row }) => (
          <CommentOutlined size="1em" className="app-icon"
            style={{
              cursor: "pointer",
              color: row.original.remarks ? "#1890ff" : "#aaa",
              fontSize: 18,
            }}
            onClick={() => {
              setProposalFile(null);
              setRemarksModal({
                visible: true,
                lead: row.original,
                forStatusChange: false,
                newStatus: null,
              });
            }}
          />
        ),
      },
      ...((user?.user_type === "sales_manager" || user?.user_type === "sales_executive") ? [{
        header: "Follow Ups and Remarks",
        id: "follow_up",
        accessorKey: "follow_up",
        enableSorting: false,
        size: 200,
        Cell: ({ row }) => (
          <AntTooltip title="Follow Ups and Remarks">
            <ClockCircleOutlined size="1em" className="app-icon"
              style={{ cursor: 'pointer', fontSize: 18, color: '#3E6A9F' }}
              onClick={() => {
                setFollowUpModal({ visible: true, lead: row.original });
              }}
            />
          </AntTooltip>
        ),
      }] : []),
      {
        header: "Name",
        accessorKey: "contact_person_name",
        size: 200,
        Cell: ({ cell, row }) => {
          const name = cell.getValue() || "-";
          const lead = row.original;
          const isDuplicateLead = isDuplicate(lead);
          const isFollowupDelayed =
            lead?.is_followup_delayed === true || lead?.is_followed_delayed === true;

          const duplicateIcon = isDuplicateLead && (
            <AntTooltip title="View duplicate information">
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
            </AntTooltip>
          );
          const delayedInfoIcon = isFollowupDelayed && (
            <AntTooltip title="This follow up is delayed">
              <InfoCircleOutlined size="1em" className="app-icon" style={{ color: "#ff4d4f", fontSize: "14px" }} />
            </AntTooltip>
          );

          return (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AntAvatar
                size={40}
                style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', flexShrink: 0 }}
                aria-hidden='true'
              >
                {Array.from(String(cell.getValue() || '').trim())[0]?.toUpperCase() || '?'}
              </AntAvatar>
              {name}
              {delayedInfoIcon}
              {duplicateIcon}
            </span>
          );
        },
      },
      {
        header: "Company",
        accessorKey: "company_name",
        size: 200,
        Cell: ({ row, cell }) => {
          // Marketing managers see simple text, no hyperlink
          if (user?.user_type === 'marketing_manager') {
            return <span>{cell.getValue() || "N/A"}</span>;
          }
          
          // Other users see hyperlink
          return (
            <Link
              component={RouterLink}
              to={`/data-lead/${row.original.id}`}
              underline="always"
              sx={{
                fontWeight: 600,
                color: "#1f3a61",
                textDecorationColor: "#1f3a61",
                "&:hover": { color: "#2d5a8a", textDecorationColor: "#2d5a8a" },
              }}
            >
              {cell.getValue() || "N/A"}
            </Link>
          );
        },
      },
      // Status column — use createStatusColumn for all users (it handles permissions based on converted_to_client)
      createStatusColumn({
        statusesRequiringRemarks: STATUSES_REQUIRING_REMARKS,
        statusColors: STATUS_TAB_COLORS,
        userType: user?.user_type,
        user,
        leadType: 'data-leads',
        onOpenRemarksModal: (lead, newStatus) => {
          setProposalFile(null);
          setRemarksModal({
            visible: true,
            lead,
            forStatusChange: true,
            newStatus,
          });
        },
        onDirectStatusUpdate: (lead, newStatus) => {
          handleInlineStatusChange(lead, newStatus);
        },
        updatingStatusId,
        size: 180,
        additionalProps: {
          style: { minWidth: 180, cursor: "pointer" },
          listHeight: window.innerHeight * 0.6,
          optionFilterProp: "children",
          showSearch: true,
        },
      }),
      {
        header: "Project Size",
        id: "project_size", // Explicit id for sorting
        accessorKey: "project_size",
        size: 160,
        sortUndefined: "last", // Handle undefined/null values
        sortDescFirst: false, // Start with ascending order (A to Z)
        Cell: ({ row, cell }) => {
          const currentValue = cell.getValue();
          const isUpdating = updatingProjectSizeId === row.original.id;
          
          // Read-only for marketing managers
          if (user?.user_type === 'marketing_manager') {
            return <span>{currentValue || "-"}</span>;
          }
          
          return (
            <AntSelect
              value={currentValue || undefined}
              placeholder="Select project size"
              options={PROJECT_SIZE_OPTIONS}
              onChange={(value) => handleProjectSizeChange(row.original, value)}
              loading={isUpdating}
              popupMatchSelectWidth={false}
              className="ant-select-pointer antd-input dropdown"
              style={{ minWidth: 160 }}
              disabled={isUpdating || isLeadConvertedToClient(row.original)}
            />
          );
        },
      },
      // Assigned To column - exclude for sales_executive
      ...(user?.user_type !== 'sales_executive' ? [
        createAssignedToColumn({
          userType: user?.user_type,
          user,
          executivesList,
          onAssignmentChange: handleAssignedToChange,
          isLoading: isAssignmentUpdating,
          loadingAssigningUsers,
          size: 200,
          additionalProps: {
            style: { minWidth: 200, cursor: "pointer" },
            optionFilterProp: "children",
            showSearch: true,
          },
        })
      ] : []),
      {
        header: "Designation",
        accessorKey: "contact_person_designation",
        size: 180,
        Cell: ({ cell }) => <span>{cell.getValue() || "-"}</span>,
      },
      {
        header: "Email",
        accessorKey: "email",
        size: 220,
        Cell: ({ cell }) => (
          <AntTooltip title="Click to copy email">
            <span
              className="cursor-pointer"
              onClick={() => copyToClipboard(cell.getValue(), "Email")}
            >
              {cell.getValue() || "-"}
            </span>
          </AntTooltip>
        ),
      },
      {
        header: "Phone",
        accessorKey: "phone_number",
        size: 180,
        Cell: ({ cell }) => (
          <AntTooltip title="Click to copy phone">
            <span
              className="cursor-pointer"
              onClick={() => copyToClipboard(cell.getValue(), "Phone")}
            >
              {cell.getValue() || "-"}
            </span>
          </AntTooltip>
        ),
      },
      // Hide Jobs column for marketing managers
      ...(user?.user_type !== 'marketing_manager' ? [{
        header: "Jobs",
        accessorKey: "job_count",
        size: 140,
        Cell: ({ cell }) => <span>{cell.getValue() ?? "-"}</span>,
      }] : []),
      {
        header: "No. of Resources",
        accessorKey: "total_vacancies",
        size: 140,
        Cell: ({ cell }) => {
          const raw = cell.getValue();
          const value = Number(raw);
          if (!raw && raw !== 0) return <span>-</span>;
          return (
            <span>{Number.isFinite(value) ? (value > 100 ? "100+" : value) : "-"}</span>
          );
        },
      },
      {
        header: "Date",
        accessorKey: "created_at",
        size: 160,
        Cell: ({ cell }) => (
          <span style={{ whiteSpace: "nowrap" }}>
            {cell.getValue()
              ? formatDateUniversal(cell.getValue(), false)
              : "-"}
          </span>
        ),
      },
      {
        header: "Proposal",
        id: "proposal", // Explicit id for sorting
        accessorKey: "proposal",
        size: 160,
        sortUndefined: "last", // Handle undefined/null values
        sortDescFirst: false, // Start with ascending order (A to Z)
        Cell: ({ cell, row }) => {
          const proposalUrl = cell.getValue() || row.original.proposal_url;
          if (!proposalUrl) {
            return <span>-</span>;
          }
          const fileLabel = '';
          const handleOpen = () => {
            const href = proposalUrl?.startsWith("http")
              ? proposalUrl
              : `${proposalUrl}`;
            window.open(href, "_blank", "noopener,noreferrer");
          };
          return (
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                size="small"
                onClick={handleOpen}
                sx={{
                  color: "#3e6a9f",
                  border: "1px solid #3e6a9f30",
                }}
              >
                <InsertDriveFileOutlinedIcon size="1em" className="app-icon"  style={{ fontSize: 20 }} />
              </IconButton>
              <Link
                component="button"
                type="button"
                onClick={handleOpen}
                underline="always"
                sx={{
                  color: "#1f3a61",
                  fontWeight: 500,
                }}
              >
                {fileLabel}
              </Link>
            </Stack>
          );
        },
      },
      {
        header: "Contract Currency",
        id: "contract_currency", // Explicit id for sorting
        accessorKey: "contract_currency",
        size: 160,
        sortUndefined: "last", // Handle undefined/null values
        sortDescFirst: false, // Start with ascending order (A to Z)
        Cell: ({ cell }) => <span>{cell.getValue() || "-"}</span>,
      },
      {
        header: "Contract Price",
        id: "contract_price", // Explicit id for sorting
        accessorKey: "contract_price",
        size: 160,
        sortUndefined: "last", // Handle undefined/null values
        sortDescFirst: false, // Start with ascending order (A to Z)
        Cell: ({ cell }) =>
          cell.getValue()
            ? Number(cell.getValue()).toLocaleString()
            : "-",
      },
      {
        header: "Industry",
        id: "industry", // Explicit id for sorting
        accessorKey: "industry",
        size: 180,
        sortUndefined: "last", // Handle undefined/null values
        sortDescFirst: false, // Start with ascending order (A to Z)
        Cell: ({ row }) => (
          <span>
            {row.industry ||
              row.original.industry ||
              row.original.industry_sector ||
              "-"}
          </span>
        ),
      },
      {
        header: "Added By",
        id: "added_by_name",
        accessorKey: "added_by_name",
        size: 160,
        sortUndefined: "last",
        sortDescFirst: false,
        Cell: ({ cell }) => <span>{cell.getValue() || "-"}</span>,
      },
      ...(user?.user_type === "admin"
        ? [
            createStatusHistoryColumn({
              onOpenHistory: (entity) =>
                setStatusHistoryModal({ visible: true, entity }),
              accessorKey: "status_history_data",
            }),
          ]
        : []),
      {
        header: 'Actions', id: 'lead_actions', enableSorting: false, size: 160,
        Cell: ({ row }) => <Space wrap>
          <AntButton size='small' onClick={() => setLeadDialog({ mode: 'view', id: row.original.id })}>View</AntButton>
          <AntButton size='small' disabled={isLeadConvertedToClient(row.original)} onClick={() => setLeadDialog({ mode: 'edit', id: row.original.id })}>Edit</AntButton>
        </Space>,
      },
    ],
    [
      executivesList,
      copyToClipboard,
      handleAssignedToChange,
      handleInlineStatusChange,
      loadingAssigningUsers,
      isAssignmentUpdating,
      pagination,
      handleProjectSizeChange,
      updatingProjectSizeId,
      updatingStatusId,
      user,
    ],
  );

  const getRowId = useCallback((row) => row.id?.toString() ?? row.identifier, []);

  const handleStatusChange = useCallback((value) => {
    setSelectedStatus(value);
    // Reset pagination to default values
    setPagination({ pageIndex: 0, pageSize: 10 });
  }, []);

  const handleExecutiveClick = useCallback((executiveId) => {
    setSelectedExecutive(executiveId);
    // Reset pagination to default values
    setPagination({ pageIndex: 0, pageSize: 10 });
  }, []);

  // Handle date range change
  const handleDateRangeChange = useCallback((range) => {
    setDateRange(range);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    // Refetch both counts and listing when date range changes
    setTimeout(() => {
      refetchCounts();
      refetch();
    }, 100);
  }, [refetchCounts, refetch]);

  // Clear date range
  const clearDateRange = useCallback(() => {
    setDateRange(null);
    setDatePickerResetKey((prev) => prev + 1);
    setShowDateModal(false);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setTimeout(() => {
      refetchCounts();
      refetch();
    }, 100);
  }, [refetchCounts, refetch]);

  const getExecutiveCount = useCallback(
    (executiveId) => {
      if (!Array.isArray(dataLeadsStats)) return 0;
      const stat = dataLeadsStats.find((item) => item.id === executiveId);
      return stat?.data_leads_assigned ?? 0;
    },
    [dataLeadsStats],
  );

  const handleCreateJob = useCallback(() => {
    navigate("/data-leads/create-job");
  }, [navigate]);

  return (
    <>
      <GlobalStyles
        styles={{
          ".ant-select-pointer .ant-select-selector": {
            cursor: "pointer !important",
          },
        }}
      />
      <BreadCrumb linkText="Data Leads" goBack={() => navigate(-1)} />
      {isListError && <AntAlert type='error' showIcon message={listError?.response?.data?.message || listError?.message || 'Could not load data leads.'} action={<AntButton onClick={() => refetch()}>Retry</AntButton>} />}
      {isCountsError && <AntAlert type='error' showIcon message={countsError?.message || 'Could not load lead counts.'} action={<AntButton onClick={() => refetchCounts()}>Retry</AntButton>} />}
      {leadDialog && <DataLeadDialog {...leadDialog} onClose={() => setLeadDialog(null)}
        statuses={[...STATUS_OPTIONS, ...tableData.map(row => row.status)].filter(Boolean)}
        projectSizes={[...PROJECT_SIZE_OPTIONS.map(option => option.value), ...tableData.map(row => row.project_size)].filter(Boolean)}
        assignees={Array.isArray(assigningUsersData) ? assigningUsersData : Array.isArray(assigningUsersData?.results) ? assigningUsersData.results : []} />}
      <div className='mb-4 flex flex-wrap items-center gap-3'>
        <label htmlFor='data-leads-project-size'>Project size</label>
        <AntSelect id='data-leads-project-size' style={{ minWidth: 180 }} allowClear placeholder='All project sizes' value={projectSizeFilter || undefined}
          options={[...new Set([...PROJECT_SIZE_OPTIONS.map(option => option.value), ...tableData.map(row => row.project_size)].filter(Boolean))].map(value => ({ value, label: value }))}
          onChange={value => { setProjectSizeFilter(value || ''); setPagination(previous => ({ ...previous, pageIndex: 0 })); }} />
      </div>
      <div className="leads">
        <div className="container">
      <Box
        sx={{
         
         
          minHeight: "calc(100vh - 120px)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
            flexWrap: "wrap",
            gap: 1,
          }}
        >
         
         
        </Box>

        {/* Date Range Filter and Add New Lead button */}
        <div style={{ padding: '0 0 1rem 0', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <Space align="center">
            <span style={{ fontWeight: '500', fontSize: '14px', padding: "8px 12px", borderRadius: "6px" }}>Filter by Date Range:</span>
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
              <AntButton
                size="small"
                danger
                onClick={clearDateRange}
              >
                Clear
              </AntButton>
            )}
          </Space>
          
          {/* Add New Lead button */}
          {user?.user_type !== 'marketing_manager' && (
            <AntButton
              type="primary"
              onClick={() => setLeadDialog({ mode: 'create' })}
              style={{
                cursor: 'pointer',
                pointerEvents: 'auto',
                position: 'relative',
                zIndex: 10,
                background: '#3E6A9F',
                borderColor: '#3E6A9F'
              }}
            >
              Add New Lead
            </AntButton>
          )}
        </div>

        <Stack
          direction="column"
          spacing={1}
          sx={{ mb: 2 }}
        >
          {user?.user_type === 'marketing_manager' ? (
            <MarketingManagerFilters
              executivesList={executivesList}
              statusTabs={statusTabs}
              selectedExecutive={selectedExecutive}
              selectedStatus={selectedStatus}
              duplicateCheck={duplicateCheck}
              onDuplicateCheckChange={(val) => {
                setDuplicateCheck(val || "all");
                setPagination({ pageIndex: 0, pageSize: 10 });
              }}
              onExecutiveChange={handleExecutiveClick}
              onStatusChange={handleStatusChange}
              getExecutiveCount={getExecutiveCount}
              getStatusCount={(_counts, apiKey) => getStatusCount(apiKey)}
              leadCounts={statusCounts}
              userType={user?.user_type}
            />
          ) : (
            <>
              {/* Executive filter tabs (All + per executive with counts) */}
              <Stack
                direction="row"
                flexWrap="wrap"
                spacing={1}
                useFlexGap
                sx={{ mb: 1 }}
              >
                <button
                  key="all-executives"
                  className={`tab ${selectedExecutive === "" ? "active" : ""}`}
                  style={{
                    flex: "0 0 auto",
                    border:
                      selectedExecutive === ""
                        ? "1px solid #3e6a9f"
                        : "1px solid #3e6a9f30",
                    borderRadius: "4px",
                    margin: "1px",
                    padding: "6px 14px",
                    minWidth: "min-content",
                    whiteSpace: "nowrap",
                    backgroundColor:
                      selectedExecutive === "" ? "#3e6a9f" : "#3e6a9f15",
                    color: selectedExecutive === "" ? "#ffffff" : "#3e6a9f",
                    fontWeight: 500,
                  }}
                  onClick={() => handleExecutiveClick("")}
                >
                  All
                </button>

                {executivesList.map((executive) => {
                  const isSelected =
                    selectedExecutive === executive.id?.toString();
                  const color = "#3e6a9f";
                  const count = getExecutiveCount(executive.id);
                  return (
                    <button
                      key={executive.id}
                      className={`tab ${isSelected ? "active" : ""}`}
                      style={{
                        flex: "0 0 auto",
                        border: isSelected
                          ? `1px solid ${color}`
                          : `1px solid ${color}30`,
                        borderRadius: "4px",
                        margin: "1px",
                        padding: "6px 14px",
                        minWidth: "min-content",
                        whiteSpace: "nowrap",
                        backgroundColor: isSelected ? color : `${color}15`,
                        color: isSelected ? "#ffffff" : color,
                        fontWeight: 500,
                      }}
                      onClick={() =>
                        handleExecutiveClick(executive.id?.toString() || "")
                      }
                    >
                      {executive.user_type
                        ? `${executive.name} - ${executive.user_type === 'sales_manager' ? 'Manager' : 'Executive'}`
                        : executive.name}{" "}
                      {`(${count})`}
                    </button>
                  );
                })}
              </Stack>

              {/* Status tabs */}
              <StatusFilterTabs
                statusFilter={selectedStatus}
                setStatusFilter={handleStatusChange}
                statusChoices={statusTabs}
                getTotalCount={() => getStatusCount("total_count")}
                getStatusCount={getStatusCount}
              />
            </>
          )}
        </Stack>

        <NewTableComponent
          heading={`Data Leads (${totalCount})`}
          columns={columns}
          data={tableData}
          totalCount={totalCount}
          pagination={pagination}
          onPaginationChange={setPagination}
          onPageSizeChange={setPagination}
          sorting={sorting}
          onSortingChange={setSorting}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          isLoading={isLoading || isFetching}
          enableRowSelection={false}
          getRowId={getRowId}
          getRowStyle={getRowStyle}
          pageSizeOptions={
            user?.user_type === 'marketing_manager'
              ? MARKETING_MANAGER_PAGE_SIZE_OPTIONS
              : undefined
          }
        />
        <ShowRemarksLead
          visible={remarksModal.visible}
          onClose={handleCloseRemarksModal}
          lead={remarksModal.lead}
          onSave={handleRemarksSave}
          loading={remarksLoading}
          showContractFields={
            remarksModal.forStatusChange &&
            remarksModal.newStatus === "Potential Client"
          }
          proposalRequired={
            remarksModal.forStatusChange &&
            remarksModal.newStatus === "Potential Client"
          }
          isProposalAttached={!!proposalFile}
          leadType="data-leads"
          saveButtonText={
            remarksModal.forStatusChange
              ? remarksModal.newStatus === "Potential Client"
                ? "Convert"
                : "Update Status"
              : "Save Remarks"
          }
          viewOnlyMode={
            isLeadConvertedToClient(remarksModal.lead) ||
            (user?.user_type === 'marketing_manager' && !remarksModal.forStatusChange) ||
            ((user?.user_type === 'sales_manager' || user?.user_type === 'sales_executive') &&
              !remarksModal.forStatusChange)
          }
          remarksRequired={
            remarksModal.forStatusChange &&
            STATUSES_REQUIRING_REMARKS.has(remarksModal.newStatus)
          }
          extra={
            remarksModal.forStatusChange &&
            remarksModal.newStatus === "Potential Client" ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <AntButton
                  type="dashed"
                  icon={<UploadOutlined size="1em" className="app-icon" />}
                  onClick={() => proposalInputRef.current?.click()}
                  style={{
                    borderStyle: "dashed",
                    borderColor: "#3E6A9F",
                    color: "#3E6A9F",
                    justifyContent: "flex-start",
                    height: 40,
                  }}
                  block
                >
                  {proposalFile ? "Change Proposal PDF" : "Attach Proposal PDF"}
                </AntButton>
                <input
                  type="file"
                  accept="application/pdf"
                  ref={proposalInputRef}
                  style={{ display: "none" }}
                  onChange={(event) =>
                    setProposalFile(event.target.files?.[0] || null)
                  }
                />
                {proposalFile && (
                  <span style={{ fontSize: 12, color: "#3E6A9F" }}>
                    {proposalFile.name}
                  </span>
                )}
              </div>
            ) : null
          }
        />
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
            isLoading={isAssignmentUpdating}
            message={
              <div>
                <p style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.5' }}>
                  You are about to reassign this data lead to a different team member.
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

        {/* Duplicate Lead Modal */}
        <DuplicateLeadModal
          visible={duplicateModal.visible}
          lead={duplicateModal.lead}
          onClose={closeDuplicateModal}
          leadType="data-leads"
        />
        {user?.user_type === "admin" && (
          <StatusHistoryModal
            open={statusHistoryModal.visible}
            entity={statusHistoryModal.entity}
            onClose={() => setStatusHistoryModal({ visible: false, entity: null })}
            fetchHistoryApi={getDataLeadHistoryTrack}
            getTitleFromEntity={(entity) => entity?.company_name || "Lead"}
            queryKeyPrefix="dataLeadStatusHistory"
            emptyMessage="No status history available."
          />
        )}
        <FollowUpModal
          open={followUpModal.visible}
          onClose={() => setFollowUpModal({ visible: false, lead: null })}
          lead={followUpModal.lead}
          leadType="data"
          readOnlyMode={isLeadConvertedToClient(followUpModal.lead)}
          onSubmit={async (values, lead) => {
            if (!lead?.id || isLeadConvertedToClient(lead)) return false;

            const isNextFollowupRequired = !values?.addFollowUp;
            await mutateDataLeadFollowUpAsync({
              leadId: lead.id,
              payload: {
                current_followup_date: new Date().toISOString(),
                next_followup_date: isNextFollowupRequired && values?.followUpDate
                  ? new Date(values.followUpDate).toISOString()
                  : null,
                is_next_followup_required: isNextFollowupRequired,
                remarks: values?.remarks?.trim() || "",
              },
            });
          }}
        />
      </Box>
        </div>
      </div>
    </>
  );
};

export default DataLeads;
