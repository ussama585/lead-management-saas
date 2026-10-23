import React, { useState, useEffect, useCallback, Suspense } from "react";

import NewTableComponent from "../../components/tables/new-table.jsx";
import { Avatar, Alert, Modal, Button, message, Select, Tooltip } from "antd";
import api from '../shared/services/api.js';
import { useSearchParams, useNavigate } from "react-router-dom";
import { Download as DownloadOutlined } from 'lucide-react';
import { useQuery } from "react-query";
import ExecutiveTabButton from "../../components/executive-tab-button.component.jsx";
import StatusFilterTabs from "../../components/status-filter-tabs.jsx";
import {
  listDataEntry,
  getStatusCount,
  bulkAssignDataEntry,
  listAssignedDataEntry,
} from "../shared/services/data-entry-service.js";
import { getAssigningUserList } from "../shared/services/headhunting.js";
import "../../assets/styles/legacy/create-user.css";
import "../../assets/styles/legacy/client-listing-page.css";
import BreadCrumb from "../../components/breadcrumb.component.jsx";
import {
  getExecutives,
} from "../shared/services/users-service.js";
import useUserStore from "../shared/store/user-store.js";
import { isSuperAdmin } from '../auth/role-access.js';
import { ConfirmationModal } from "../clients/components/LazyModals.jsx";
import { formatDateUniversal } from "../shared/utils/formatDate.js";

/** StatusFilterTabs statusColors keys — matches `assigned` / `unassigned` tab values */
const DATA_ENTRY_SCOPE_TAB_COLORS = {
  assigned: "#3e6a9f",
  unassigned: "#fa8c16",
};

const baseColumns = [
  { header: "Designation", accessorKey: "designation" },
  { header: "Company Name", accessorKey: "company_name" },
  { header: "Industry/Sector", accessorKey: "industry_sector" },
  { header: "Phone", accessorKey: "phone" },
  { header: "Email", accessorKey: "email" },
  { header: "City", accessorKey: "city" },
  { header: "Country", accessorKey: "country" },
  { header: "Company Address", accessorKey: "company_address" },
  { header: "Company Website", accessorKey: "company_website" },
  { header: "Company Social Media", accessorKey: "company_social_link" },
  { header: "Data Acquired Through", accessorKey: "acquired_through" },
  { header: "Added By", accessorKey: "added_by_name" },
  { header: "Assigned To", accessorKey: "assigned_to_name" },
  {
    header: "Created At",
    accessorKey: "created_at",
    Cell: ({ cell }) => (
      <span>
        {formatDateUniversal(cell.getValue(), true)}
      </span>
    )
  },
];

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

// Copy to clipboard function
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    message.success("Copied to clipboard!");
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    message.success("Copied to clipboard!");
  }
};

export async function getSalesDataCompanies() {
  const { data } = await api.get('/company/simple-list');
  if (!Array.isArray(data)) throw new Error(data?.message || 'Could not load companies.');
  return data;
}

async function listDataEntryCount(params = {}) {
  const { data } = await api.get('/data-entry/list-count', { params });
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not load counts.');
  return data;
}

const DataEntryTable = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const superAdmin = isSuperAdmin(user?.user_type);
  const [companyId, setCompanyId] = useState(null);
  const companyParams = superAdmin && companyId != null ? { company_id: companyId } : {};
  const companies = useQuery(['sales-data-company-options', user?.id, user?.user_type], getSalesDataCompanies, {
    enabled: superAdmin, refetchOnWindowFocus: false, keepPreviousData: true,
  });
  
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read initial values from URL params
  const rawTab = searchParams.get("tab") || (superAdmin ? 'all' : 'assigned');
  const initialTabFromUrl = ["assigned", "unassigned", "all"].includes(rawTab) ? rawTab : "assigned";
  const initialStatusFromUrl = searchParams.get("status") || "";
  const initialExecIdFromUrl = searchParams.get("execId") ? Number(searchParams.get("execId")) : null;
  const initialSearchFromUrl = searchParams.get("search") || "";
  const initialPageIndexFromUrl = parseInt(searchParams.get("page")) || 0;
  const initialPageSizeFromUrl = parseInt(searchParams.get("pageSize")) || 10;
  const initialSortFieldFromUrl = searchParams.get("sortBy");
  const initialSortOrderFromUrl = searchParams.get("sortOrder");
  
  // Initialize states with URL param values
  const [pagination, setPagination] = useState({ 
    pageIndex: initialPageIndexFromUrl, 
    pageSize: initialPageSizeFromUrl 
  });
  
  const [sorting, setSorting] = useState(() => {
    if (initialSortFieldFromUrl) {
      return [{
        id: initialSortFieldFromUrl,
        desc: initialSortOrderFromUrl === 'desc'
      }];
    }
    return [];
  });
  
  const [globalFilter, setGlobalFilter] = useState(initialSearchFromUrl);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [statusFilter, setStatusFilter] = useState(initialStatusFromUrl);
  const [selectedTab, setSelectedTab] = useState(initialTabFromUrl);
  const [selectedExecId, setSelectedExecId] = useState(initialExecIdFromUrl);
  const [rowSelection, setRowSelection] = useState({});
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [executivesList, setExecutivesList] = useState([]); // for tabs
  const [assignableUsers, setAssignableUsers] = useState([]); // for dropdown
  const [isSaving, setIsSaving] = useState(false);
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    assigned: 0,
    unassigned: 0,
  });

 // Sync all state to URL params
  useEffect(() => {
    const newParams = {};
    
    // Tab
    if (selectedTab !== "assigned") {
      newParams.tab = selectedTab;
    }
    
    // Status filter
    if (statusFilter) {
      newParams.status = statusFilter;
    }
    
    // Executive filter
    if (selectedExecId) {
      newParams.execId = selectedExecId.toString();
    }
    
    // Search
    if (globalFilter && globalFilter.trim()) {
      newParams.search = globalFilter.trim();
    }
    
    // Pagination
    if (pagination.pageIndex !== 0) {
      newParams.page = pagination.pageIndex.toString();
    }
    if (pagination.pageSize !== 10) {
      newParams.pageSize = pagination.pageSize.toString();
    }
    
    // Sorting
    if (sorting && sorting.length > 0 && sorting[0]?.id) {
      newParams.sortBy = sorting[0].id;
      newParams.sortOrder = sorting[0].desc ? 'desc' : 'asc';
    }
    
    setSearchParams(newParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, selectedTab, selectedExecId, globalFilter, pagination.pageIndex, pagination.pageSize, sorting]);
  const {
    data: statusCount,
    isLoading: isStatusCountLoading,
    refetch: refetchStatusCount,
  } = useQuery(
    ["status-count", user?.id, user?.user_type, companyId, globalFilter, selectedTab, selectedExecId, statusFilter],
    async () => {
      const params = {
        ...companyParams,
        search: globalFilter,
      };

      if (selectedTab === "assigned") {
        params.assigned = true;
        if (selectedExecId) {
          params.assigned_to = selectedExecId;
        }
      } else if (selectedTab === "unassigned") {
        params.assigned = false;
      }

      const countData = await getStatusCount(params);
      return countData;
    },
    {
      enabled: !!selectedTab, // only run if tab is selected
      keepPreviousData: true,
    }
  );

  const { data, isLoading, refetch } = useQuery(
    [
      "data-entry-list",
      user?.id,
      user?.user_type,
      companyId,
      pagination,
      sorting,
      globalFilter,
      statusFilter,
      selectedTab,
      selectedExecId,
    ],
    async () => {
      const params = {
        ...companyParams,
        page: pagination.pageIndex + 1,
        size: pagination.pageSize,
        search: globalFilter,
        sort_by: sorting?.[0]?.["id"] ?? "",
        order: sorting?.[0]?.["desc"] ? "desc" : "asc",
      };

      if (selectedTab === "assigned") {
        if (statusFilter !== "") {
          params.status = statusFilter;
        }
        if (selectedExecId) {
          params.assigned_to = selectedExecId;
        }

        // Use the assigned endpoint with params for sorting, pagination, and search
        const assignedData = await listAssignedDataEntry(params);
        return {
          results: assignedData.results || [],
          count: assignedData.count || 0,
        };
      } else if (selectedTab === "unassigned") {
        // For unassigned tab, don't send status filter
        // Use the main endpoint with assigned: false
        const unassignedData = await listDataEntry({
          ...params,
          assigned: false,
        });
        return {
          results: unassignedData?.results || [],
          count: unassignedData?.count || 0,
        };
      } else {
        // All
        const allData = await listDataEntry(params);
        return {
          results: allData?.results || [],
          count: allData?.count || 0,
        };
      }
    },
    { keepPreviousData: true }
  );
  const [uploadResultModalVisible, setUploadResultModalVisible] =
    useState(false);
  const [uploadResult, setUploadResult] = useState({
    skipped: [],
    message: "",
  });
  const [assignSkippedModalVisible, setAssignSkippedModalVisible] =
    useState(false);
  const [assignSkippedResult, setAssignSkippedResult] = useState({
    skipped: [],
    message: "",
  });
  const [confirmAssignModalVisible, setConfirmAssignModalVisible] =
    useState(false);
  const [pendingAssignee, setPendingAssignee] = useState(null);
  useEffect(() => {
    if (selectedTab !== "assigned") {
      setSelectedExecId(null);
    }
  }, [selectedTab]);

  const columns = React.useMemo(
    () =>
      [
        {
          header: "#",
          accessorKey: "row_number",
          enableSorting: false,
          Cell: ({ row }) => {
            const rowIndex = row.index;
            const pageIndex = pagination.pageIndex;
            const pageSize = pagination.pageSize;
            return <span>{pageIndex * pageSize + rowIndex + 1}</span>;
          },
        },
        // 3. Company Name
        {
          header: "Company Name",
          accessorKey: "company_name",
          size: 260,
          Cell: ({ cell, row }) => (
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar size={40} style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', flexShrink: 0 }} aria-hidden='true'>
                {Array.from(String(cell.getValue() || '').trim())[0]?.toUpperCase() || '?'}
              </Avatar>
            {user.user_type === "admin" ? (
              <a
                style={{ textDecoration: "underline", color: "#3E6A9F" }}
                href={`/data-entry/edit/${row.original.id}`}
                onClick={(e) => { e.preventDefault(); navigate(`/data-entry/edit/${row.original.id}`); }}
              >
                {cell.getValue()}
              </a>
            ) : (
              <span>{cell.getValue() || "-"}</span>
            )}
            </span>
          ),
        },
        // Assigned To
        (user?.user_type !== "sales_executive" && selectedTab !== "unassigned") && {
  header: "Assigned To",
  accessorKey: "assigned_to_name",
  Cell: ({ cell }) => <span>{cell.getValue() || "-"}</span>,
},
        // Representative Name
        {
          header: "Representative Name",
          accessorKey: "representative_name",
          Cell: ({ cell }) => <span>{cell.getValue() || "-"}</span>,
        },
        // 4. Phone
        {
          header: "Phone",
          accessorKey: "phone",
          Cell: ({ cell }) => (
            <Tooltip title="Click to copy phone">
              <span
                className="cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(cell.getValue());
                  message.success("Phone No. copied to clipboard");
                }}
              >
                {cell.getValue()}
              </span>
            </Tooltip>
          ),
        },
        // 5. Email
        {
          header: "Email",
          accessorKey: "email",
          Cell: ({ cell }) => (
            <Tooltip title="Click to copy email">
              <span
                className="cursor-pointer"
                onClick={async () => {
                  const text = cell.getValue();
                  try {
                    if (navigator.clipboard?.writeText) {
                      await navigator.clipboard.writeText(text);
                      message.success("Email copied to clipboard");
                    } else {
                      throw new Error("Clipboard API not supported");
                    }
                  } catch (err) {
                    message.error("Failed to copy email");
                  }
                }}
              >
                {cell.getValue()}
              </span>
            </Tooltip>
          ),
        },
        // 6+. Rest of the fields (excluding those already added)
        ...baseColumns.filter(
          (col) =>
            ![
              "status",
              "assigned_to_name",
              "company_name",
              "phone",
              "email",
              "Representative Name",
              "Assigned To",
            ].includes(col.header) &&
            ![
              "status",
              "assigned_to_name",
              "company_name",
              "phone",
              "email",
              "representative_name",
            ].includes(col.accessorKey)
        ),
      ].filter(Boolean),
    [user, navigate, selectedTab, pagination]
  );

  // Fetch executives/managers for tabs (executive/manager filter buttons)
  React.useEffect(() => {
    async function fetchExecutivesForTabs() {
      try {
        let data = [];
        if (superAdmin || user.user_type === "sales_manager") {
          data = await getExecutives();
        }
        setExecutivesList(Array.isArray(data) ? data : []);
      } catch (err) {
        setExecutivesList([]);
      }
    }
    if (superAdmin || user.user_type === "sales_manager") {
      fetchExecutivesForTabs();
    }
  }, [user.user_type]);

  // Fetch assignable users for dropdowns (Assign to)
 React.useEffect(() => {
  async function fetchAssignableUsers() {
    try {
      let data = [];
      if (superAdmin || ['company_admin', 'sales_manager'].includes(user.user_type)) {
        data = await getAssigningUserList(); // NEW unified endpoint
      }
      setAssignableUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setAssignableUsers([]);
    }
  }
  if (superAdmin || ['company_admin', 'sales_manager'].includes(user.user_type)) {
    fetchAssignableUsers();
  }
}, [user.user_type]);
  // Fetch tab counts
  React.useEffect(() => {
    let active = true;
    if (user?.id) {
      listDataEntryCount(companyParams).then((counts) => {
        if (!active) return;
        setTabCounts({
          all: counts.all || 0,
          assigned: counts.assigned || 0,
          unassigned: counts.unassigned || 0,
        });
      }).catch(() => { if (active) setTabCounts({ all: 0, assigned: 0, unassigned: 0 }); });
    }
    return () => { active = false; };
  }, [user.id, user.user_type, companyId]);
  // Assign when dropdown value changes and rows are selected
  React.useEffect(() => {
    // Only show confirmation modal if a new assignee is selected (not cleared)
    if (
      (user.user_type === "admin" || user.user_type === "sales_manager") &&
      selectedAssignee &&
      !confirmAssignModalVisible // Prevent showing modal if it's already visible
    ) {
      setPendingAssignee(selectedAssignee);
      setConfirmAssignModalVisible(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAssignee, confirmAssignModalVisible]);
  const handleConfirmAssign = async () => {
    // Get the selected row IDs (as strings)
    const selectedRowIds = Object.keys(rowSelection).filter(
      (key) => rowSelection[key]
    );
    const safeResults = Array.isArray(data?.results) ? data.results : [];
    const selectedRows = safeResults.filter((row) =>
      selectedRowIds.includes(String(row.id))
    );
    const selectedIds = selectedRows.map((row) => row.id);
    if (!pendingAssignee || selectedIds.length === 0) return;
    setIsSaving(true);
    try {
      const res = await bulkAssignDataEntry(
        selectedIds.join(","),
        pendingAssignee
      );
      message.success(res?.message || "Assigned successfully");
      setRowSelection({});
      setSelectedAssignee(null);
      refetch();
      refetchStatusCount();
      // Refresh tab counts after assignment
      listDataEntryCount(companyParams).then((counts) => {
        setTabCounts({
          all: counts.all || 0,
          assigned: counts.assigned || 0,
          unassigned: counts.unassigned || 0,
        });
      });
      // Show skipped assignments if any
      if (res && Array.isArray(res.skipped) && res.skipped.length > 0) {
        setAssignSkippedResult({ skipped: res.skipped, message: res.message });
        setAssignSkippedModalVisible(true);
      }
    } catch (err) {
      let errorMsg = err?.message || "Failed to assign";
      if (err?.response?.data?.message) errorMsg = err.response.data.message;
      else if (err?.message) errorMsg = err.message;
      else if (typeof err === "object") {
        errorMsg =
          err.message || JSON.stringify(err) || "An unknown error occurred.";
        if (errorMsg === "{}" || errorMsg === "[object Object]")
          errorMsg = "An unknown error occurred.";
      } else errorMsg = String(err);
      if (
        err &&
        err.skipped &&
        Array.isArray(err.skipped) &&
        err.skipped.length > 0
      ) {
        setAssignSkippedResult({
          skipped: err.skipped,
          message: "Not assigned",
        });
        setAssignSkippedModalVisible(true);
        message.error(errorMsg);
      } else {
        message.error(errorMsg);
      }
    } finally {
      setIsSaving(false);
      setConfirmAssignModalVisible(false);
      setPendingAssignee(null);
    }
  };
  // Reset row selection when data changes to prevent index mismatch errors
  React.useEffect(() => {
    setRowSelection({});
  }, [data]);


  const handleExportAll = async () => {
    try {
      // Fetch total count first
      const params = {
        ...companyParams,
        page: 1,
        size: tabCounts.all || 10000, // fallback to 10k if count missing
        search: "",
        sort_by: "",
        order: "asc",
      };
      const allData = await listDataEntry(params);
      const results = Array.isArray(allData?.results) ? allData.results : [];
      if (!results.length) {
        message.info("No data to export.");
        return;
      }
      const csv = arrayToCSV(results, baseColumns);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `data-entry-export-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      message.success("Data exported successfully!");
    } catch (err) {
      let errorMsg = "Failed to export data.";
      if (err?.response?.data?.message) errorMsg = err.response.data.message;
      else if (err?.message) errorMsg = err.message;
      else if (typeof err === "object") errorMsg = JSON.stringify(err);
      else errorMsg = String(err);
      message.error(errorMsg);
    }
  };

  const handleExportCurrentView = async () => {
    try {
      const currentData = Array.isArray(data?.results) ? data.results : [];
      if (!currentData.length) {
        message.info("No data to export.");
        return;
      }
      const csv = arrayToCSV(currentData, baseColumns);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `data-entry-current-view-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      message.success("Current view exported successfully!");
    } catch (err) {
      let errorMsg = "Failed to export current view.";
      if (err?.response?.data?.message) errorMsg = err.response.data.message;
      else if (err?.message) errorMsg = err.message;
      else if (typeof err === "object") errorMsg = JSON.stringify(err);
      else errorMsg = String(err);
      message.error(errorMsg);
    }
  };
  const handleScopeTabFilter = useCallback((valueOrUpdater) => {
    setSelectedTab((prevTab) => {
      const prevFilter = prevTab === "all" ? "" : prevTab;
      const next =
        typeof valueOrUpdater === "function" ? valueOrUpdater(prevFilter) : valueOrUpdater;
      if (next === "" || next === "All") return "all";
      if (next === "assigned") return "assigned";
      if (next === "unassigned") return "unassigned";
      return "all";
    });
    setPagination({ pageIndex: 0, pageSize: 10 });
  }, []);

  const handleRowClick = (row) => {
    if (!row || !row.id) return;
    // Only allow for admin, manager, executive
    if (["admin", "sales_manager"].includes(user?.user_type)) {
      navigate(`/data-entry/edit/${row.id}`);
    }
  };
  return (
    <>
      <BreadCrumb linkText="Sales Data" />
      <Modal
        title="Assignment Issues"
        open={assignSkippedModalVisible}
        onCancel={() => setAssignSkippedModalVisible(false)}
        footer={
          <Button onClick={() => setAssignSkippedModalVisible(false)}>
            Close
          </Button>
        }
        width={500}
      >
        <div
          style={{
            marginBottom: 16,
            color: "#d4380d",
            fontWeight: 500,
            fontSize: 16,
          }}
        >
          {assignSkippedResult.message ||
            "Some entries could not be assigned. See details below."}
        </div>
        {assignSkippedResult.skipped &&
        assignSkippedResult.skipped.length > 0 ? (
          <div style={{ maxHeight: 350, overflowY: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      border: "1px solid #eee",
                      padding: 6,
                      background: "#f5f5f5",
                    }}
                  >
                    ID
                  </th>
                  <th
                    style={{
                      border: "1px solid #eee",
                      padding: 6,
                      background: "#f5f5f5",
                    }}
                  >
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody>
                {assignSkippedResult.skipped.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ border: "1px solid #eee", padding: 6 }}>
                      {item.id}
                    </td>
                    <td
                      style={{
                        border: "1px solid #eee",
                        padding: 6,
                        color: "#d4380d",
                      }}
                    >
                      {item.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: "#666", fontSize: 14 }}>
            No skipped assignments.
          </div>
        )}
      </Modal>
      <div className="listing-page-content">
        {superAdmin && <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="sales-data-company-filter">Company</label>
          <Select id="sales-data-company-filter" aria-label="Filter sales data by company" showSearch allowClear
            optionFilterProp="label" placeholder="All companies" value={companyId ?? undefined}
            loading={companies.isFetching} style={{ width: 280, maxWidth: '100%' }}
            options={(companies.data || []).map(company => ({ value: company.id, label: `${company.name} (ID: ${company.id})` }))}
            onChange={value => { setCompanyId(value ?? null); setPagination(previous => ({ ...previous, pageIndex: 0 }));
              setRowSelection({}); setSelectedExecId(null); setSelectedAssignee(null); }} />
          {companies.isError && <Alert type="error" message={companies.error?.message || 'Could not load companies.'}
            action={<Button onClick={() => companies.refetch()}>Retry</Button>} />}
        </div>}
        <div className="listing-toolbar-flex">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {user.user_type === "admin" && (
              <button type="button" className="listing-btn-primary" onClick={handleExportAll}>
                <DownloadOutlined size="1em" className="app-icon" style={{ marginRight: 8 }} />
                Export All to CSV
              </button>
            )}
          </div>
        </div>

        {(
          <>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <StatusFilterTabs
                statusFilter={selectedTab === "all" ? "" : selectedTab}
                setStatusFilter={handleScopeTabFilter}
                statusChoices={[
                  { label: "Assigned", value: "assigned", apiKey: "assigned" },
                  { label: "Unassigned", value: "unassigned", apiKey: "unassigned" },
                ]}
                getTotalCount={() => tabCounts.all}
                getStatusCount={(apiKey) => tabCounts[apiKey] ?? 0}
                statusColors={DATA_ENTRY_SCOPE_TAB_COLORS}
              />
            </div>

            {(superAdmin || user.user_type === "sales_manager") && selectedTab === "assigned" && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <ExecutiveTabButton
                  isSelected={selectedExecId == null}
                  onClick={() => {
                    setSelectedExecId(null);
                    setPagination({ pageIndex: 0, pageSize: 10 });
                  }}
                />
                {executivesList.map((exec) => {
                  const count =
                    typeof exec.count === "number" ? exec.count : undefined;
                  return (
                    <ExecutiveTabButton
                      key={exec.id}
                      executive={exec}
                      count={count}
                      isSelected={selectedExecId === exec.id}
                      onClick={() => {
                        const next =
                          selectedExecId === exec.id ? null : exec.id;
                        setSelectedExecId(next);
                        setPagination({ pageIndex: 0, pageSize: 10 });
                      }}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {(user.user_type === "admin" || user.user_type === "sales_manager") &&
          Object.keys(rowSelection).some((key) => rowSelection[key]) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
                flexWrap: "wrap",
              }}
            >
              <label
                htmlFor="assign-to-select"
                style={{ color: "#3E6A9F", fontWeight: 500, marginRight: 8 }}
              >
                Assign to
              </label>
              <Select
                id="assign-to-select"
                style={{ minWidth: 220, cursor: "pointer" }}
                dropdownStyle={{
                  minWidth: 220,
                  width: "auto",
                  whiteSpace: "normal",
                }}
                placeholder="Select Executive/Manager"
                value={selectedAssignee || undefined}
                onChange={(value) => setSelectedAssignee(value)}
                loading={isSaving}
              >
                {assignableUsers.map((exec) => (
                  <Select.Option
                    key={exec.id}
                    value={exec.id}
                    style={{
                      whiteSpace: "normal",
                      textOverflow: "unset",
                      overflow: "visible",
                    }}
                  >
                    {exec.name} -{" "}
                    {exec.user_type === "sales_manager" ? "Manager" : "Executive"}
                  </Select.Option>
                ))}
              </Select>
            </div>
          )}

        <div className="table-container">
          <NewTableComponent
            totalCount={data?.count || 0}
            columns={columns}
            data={
              Array.isArray(data?.results)
                ? data.results.map((row) => {
                    const newRow = { ...row };
                    const allAccessorKeys = [
                      "designation",
                      "company_name",
                      "industry_sector",
                      "phone",
                      "email",
                      "city",
                      "country",
                      "company_address",
                      "company_website",
                      "company_social_link",
                      "acquired_through",
                      "added_by_name",
                      "assigned_to_name",
                      "representative_name",
                    ];
                    allAccessorKeys.forEach((key) => {
                      const val = newRow[key];
                      if (val === undefined || val === null || val === "") {
                        newRow[key] = "-";
                      }
                    });
                    return newRow;
                  })
                : []
            }
            pagination={pagination}
            onPaginationChange={setPagination}
            onPageSizeChange={() => {}}
            sorting={sorting}
            onSortingChange={setSorting}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            isLoading={isLoading}
            enableRowSelection={selectedTab === "unassigned"}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            getRowId={(row) => row.id}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            getRowProps={(row) => ({
              style: {
                cursor: ["admin", "sales_manager"].includes(user?.user_type)
                  ? "pointer"
                  : "default",
              },
            })}
            heading={`Sales Data (${data?.count ?? 0}) `}
          />
        </div>

        <Suspense fallback={null}>
        <ConfirmationModal
          showModal={confirmAssignModalVisible}
          setShowModal={(visible) => {
            setConfirmAssignModalVisible(visible);
            // Reset selectedAssignee when modal is closed/canceled
            if (!visible) {
              setSelectedAssignee(null);
              setPendingAssignee(null);
            }
          }}
          mutation={{
            isLoading: isSaving,
            mutate: handleConfirmAssign,
          }}
          value={null}
          message={(() => {
            const selectedRowIds = Object.keys(rowSelection).filter(
              (key) => rowSelection[key]
            );
            const safeResults = Array.isArray(data?.results)
              ? data.results
              : [];
            const selectedRows = safeResults.filter((row) =>
              selectedRowIds.includes(String(row.id))
            );

            // Find the assignee name
            const assigneeName =
              assignableUsers.find((user) => user.id === pendingAssignee)
                ?.name || "Unknown User";

            if (!selectedRows.length)
              return "Do you want to assign the selected entries?";
            return (
              <>
                <div
                  style={{
                    marginBottom: 12,
                    maxHeight: 250,
                    overflowY: "auto",
                  }}
                >
                  {selectedRows.map((row, idx) => (
                    <div
                      key={row.id || idx}
                      style={{
                        marginBottom: 8,
                        padding: 8,
                        border: "1px solid #eee",
                        borderRadius: 4,
                      }}
                    >
                      <div>
                        <strong>Company Name:</strong> {row.company_name || "-"}
                      </div>
                      <div>
                        <strong>Phone:</strong> {row.phone || "-"}
                      </div>
                      <div>
                        <strong>Email:</strong> {row.email || "-"}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, fontWeight: 500 }}>
                  Are you sure you want to assign these entries to{" "}
                  <strong>{assigneeName}</strong>?
                </div>
              </>
            );
          })()}
        />
        </Suspense>
      </div>
    </>
  );
};

export default DataEntryTable;
