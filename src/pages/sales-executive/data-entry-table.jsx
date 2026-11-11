import CompanySelectOption from '../../components/company-select-option.jsx';
import React, { useState, useEffect, useCallback } from "react";

import NewTableComponent from "../../components/tables/new-table.jsx";
import { Avatar, AvatarFallback } from "../../components/ui/avatar.jsx";
import { Select as FilterSelect } from '../../components/ui/app-select.jsx';
import LeadDateRangeField from '../../components/lead-date-range-field.jsx';
import BootstrapDateRangeModal from '../../components/bootstrap-date-range-modal.component.jsx';
import { Building2 } from 'lucide-react';
import { Button } from "../../components/ui/button.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog.jsx";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/select.jsx";
import { Tooltip, TooltipTrigger, TooltipContent } from "../../components/ui/tooltip.jsx";
import toast from 'react-hot-toast';

import api from '../shared/services/api.js';
import { useSearchParams, useNavigate } from "react-router-dom";
import { Download as DownloadOutlined } from 'lucide-react';
import { useQuery } from "react-query";
import LeadListingFilters from "../../components/lead-listing-filters.jsx";
import { changeSalesDataStatus, salesDataFilterParams } from './sales-data-filters.js';
import { leadCountTabs, normalizeLeadCounts } from "../shared/services/lead-filter-counts.js";
import {
  listDataEntry,
  bulkAssignDataEntry,
} from "../shared/services/data-entry-service.js";
import { getAssigningUserList } from "../shared/services/headhunting.js";
import "../../assets/styles/legacy/create-user.css";
import "../../assets/styles/legacy/client-listing-page.css";
import {
} from "../shared/services/users-service.js";
import useUserStore from "../shared/store/user-store.js";
import { isSuperAdmin } from '../auth/role-access.js';
import { getRolePath } from '../auth/role-home.js';
import { formatDateUniversal } from "../shared/utils/formatDate.js";

const message = { success: toast.success, error: toast.error, info: toast };

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
  const canViewUserTabs = superAdmin || ['company_admin', 'sales_manager'].includes(user?.user_type);
  const [selectedCompanyId, setCompanyId] = useState(undefined);
  const companies = useQuery(['sales-data-company-options', user?.id, user?.user_type], getSalesDataCompanies, {
    enabled: superAdmin, refetchOnWindowFocus: false, staleTime: 300000,
  });
  const companyId = selectedCompanyId === undefined ? (superAdmin ? companies.data?.[0]?.id ?? null : null) : selectedCompanyId;
  const [dateRange, setDateRange] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const companyParams = superAdmin ? {
    ...(companyId != null ? { company_id: companyId } : {}),
    ...(dateRange?.[0] ? { start_date: dateRange[0].format('YYYY-MM-DDTHH:mm:ssZ') } : {}),
    ...(dateRange?.[1] ? { end_date: dateRange[1].format('YYYY-MM-DDTHH:mm:ssZ') } : {}),
  } : {};
  
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read initial values from URL params
  const rawTab = searchParams.get("tab") || (superAdmin ? 'all' : 'assigned');
  const initialTabFromUrl = ["assigned", "unassigned", "all"].includes(rawTab) ? rawTab : "assigned";
  const initialStatusFromUrl = searchParams.get("status") || "";
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
  const [rowSelection, setRowSelection] = useState({});
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [assignableUsers, setAssignableUsers] = useState([]); // for dropdown
  const [isSaving, setIsSaving] = useState(false);

 // Sync all state to URL params
  useEffect(() => {
    const newParams = {};
    
    // Tab
    newParams.tab = selectedTab;
    
    // Status filter
    if (statusFilter) {
      newParams.status = statusFilter;
    }
    
    // Executive filter
    
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
  }, [statusFilter, selectedTab, globalFilter, pagination.pageIndex, pagination.pageSize, sorting]);
  const countParams = {
    ...companyParams,
    search: globalFilter,
    ...salesDataFilterParams('', selectedTab),
  };
  const listingParams = {
    ...companyParams,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    search: globalFilter,
    sort_by: sorting?.[0]?.id ?? '',
    order: sorting?.[0]?.desc ? 'desc' : 'asc',
    ...salesDataFilterParams(statusFilter, selectedTab),
  };
  const queryOptions = {
    enabled: Boolean(user?.id) && (!superAdmin || !companies.isLoading),
    keepPreviousData: true,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  };
  const { data: statusCount, refetch: refetchStatusCount } = useQuery(
    ['status-count', user?.id, user?.user_type, countParams],
    async () => normalizeLeadCounts(await listDataEntryCount(countParams)),
    queryOptions,
  );
  const { data, isLoading, refetch } = useQuery(
    ['data-entry-list', user?.id, user?.user_type, listingParams],
    async () => {
      const result = await listDataEntry(listingParams);
      return { results: result?.results || [], count: result?.count || 0 };
    },
    queryOptions,
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
              <Avatar className="size-10 shrink-0" aria-hidden="true">
                <AvatarFallback className="bg-primary text-primary-foreground">
                {Array.from(String(cell.getValue() || '').trim())[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            {superAdmin ? (
              <a className="cursor-pointer"
                style={{ textDecoration: "underline", color: "#3E6A9F" }}
                href={getRolePath(user?.user_type, `/data-entry/edit/${row.original.id}`)}
                onClick={(e) => { e.preventDefault(); navigate(getRolePath(user?.user_type, `/data-entry/edit/${row.original.id}`)); }}
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
            <Tooltip><TooltipTrigger asChild>
              <span
                className="cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(cell.getValue());
                  message.success("Phone No. copied to clipboard");
                }}
              >
                {cell.getValue()}
              </span>
            </TooltipTrigger><TooltipContent>Click to copy phone</TooltipContent></Tooltip>
          ),
        },
        // 5. Email
        {
          header: "Email",
          accessorKey: "email",
          Cell: ({ cell }) => (
            <Tooltip><TooltipTrigger asChild>
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
            </TooltipTrigger><TooltipContent>Click to copy email</TooltipContent></Tooltip>
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

  // Fetch assignable users for dropdowns (Assign to)
 React.useEffect(() => {
  let active = true;
  setAssignableUsers([]);
  async function fetchAssignableUsers() {
    try {
      let data = [];
      if (superAdmin || ['company_admin', 'sales_manager'].includes(user.user_type)) {
        if (superAdmin || user.user_type === 'company_admin') {
          const response = await api.get('/accounts/users-for-assigning', {
            params: superAdmin ? { company_id: companyId } : {},
          });
          data = response.data;
        } else {
          data = await getAssigningUserList();
        }
      }
      if (active) setAssignableUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      if (active) setAssignableUsers([]);
    }
  }
  if ((superAdmin && companyId != null) || ['company_admin', 'sales_manager'].includes(user.user_type)) {
    fetchAssignableUsers();
  }
  return () => { active = false; };
}, [user.id, user.user_type, superAdmin, companyId]);
  const tabCounts = {
    ...statusCount,
    all: statusCount?.all_count ?? statusCount?.all ?? statusCount?.total_count ?? statusCount?.count ?? 0,
  };
  const statusChoices = leadCountTabs(statusCount).filter(choice => !['all', 'all_count'].includes(choice.apiKey))
    .map(choice => ({ ...choice, value: ['assigned', 'unassigned'].includes(choice.apiKey) ? choice.apiKey : choice.value }));
  // Assign when dropdown value changes and rows are selected
  React.useEffect(() => {
    // Only show confirmation modal if a new assignee is selected (not cleared)
    if (
      canViewUserTabs &&
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
    const next = changeSalesDataStatus(statusFilter, valueOrUpdater);
    setStatusFilter(next.status);
    setSelectedTab(next.tab);
    setPagination({ pageIndex: 0, pageSize: 10 });
  }, [statusFilter]);

  const handleRowClick = (row) => {
    if (!row || !row.id) return;
    // Only allow for admin, manager, executive
    if (["admin", "sales_manager"].includes(user?.user_type)) {
      navigate(`/data-entry/edit/${row.id}`);
    }
  };
  return (
    <>
      <Dialog open={assignSkippedModalVisible} onOpenChange={setAssignSkippedModalVisible}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[500px]" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Assignment Issues</DialogTitle></DialogHeader>
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
          <DialogFooter><Button onClick={() => setAssignSkippedModalVisible(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="listing-page-content">
        {superAdmin && <div className="lead-company-date-toolbar lead-company-date-toolbar--compact sales-data-company-toolbar">
          <div className="lead-company-filter">
            <label htmlFor="sales-data-company-filter">Company</label>
            <div className="lead-company-filter__control">
              <Building2 size={20} className="shrink-0" aria-hidden="true" />
              <FilterSelect id="sales-data-company-filter" showSearch allowClear placeholder="All companies"
                value={companyId ?? undefined} loading={companies.isFetching} style={{ width: '100%' }}
                options={(companies.data || []).map(company => ({ value: company.id, label: company.name, email: company.email }))} optionRender={option => <CompanySelectOption option={option} />}
                onChange={value => {
                  setCompanyId(value ?? null);
                  setStatusFilter('');
                  setSelectedTab('all');
                  setPagination(previous => ({ ...previous, pageIndex: 0 }));
                  setRowSelection({}); setSelectedAssignee(null);
                }} />
            </div>
            {companies.isError && <div role="alert">Could not load companies. <Button onClick={() => companies.refetch()}>Retry</Button></div>}
          </div>
          <div className="lead-filter-toolbar lead-company-date-toolbar__date">
            <LeadDateRangeField hasValue={Boolean(dateRange)} onClear={() => { setDateRange(null); setPagination(previous => ({ ...previous, pageIndex: 0 })); setRowSelection({}); }}>
              <BootstrapDateRangeModal value={dateRange} showModal={showDateModal} setShowModal={setShowDateModal}
                onDone={range => { setDateRange(range); setShowDateModal(false); setPagination(previous => ({ ...previous, pageIndex: 0 })); setRowSelection({}); }} />
            </LeadDateRangeField>
          </div>
        </div>}
        <LeadListingFilters
          statusFirst
          requiresCompany={superAdmin && !companyId}
          showExecutives={false}
          statusFilter={statusFilter}
          setStatusFilter={handleScopeTabFilter}
          statusChoices={statusChoices}
          getTotalCount={() => tabCounts.all}
          getStatusCount={key => tabCounts[key] ?? 0}
        />

        {canViewUserTabs &&
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
              <Select placeholder="Select assign to" value={selectedAssignee == null ? '' : String(selectedAssignee)}
                onValueChange={value => setSelectedAssignee(Number(value))} disabled={isSaving}>
                <SelectTrigger id="assign-to-select" className="min-w-[220px]">
                  <SelectValue placeholder="Select Executive/Manager" />
                </SelectTrigger>
                <SelectContent>
                  {assignableUsers.map(exec => <SelectItem key={exec.id} value={String(exec.id)}>
                    {exec.name} - {exec.user_type === 'sales_manager' ? 'Manager' : 'Executive'}
                  </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

        {(superAdmin || user?.user_type === 'company_admin') && (
          <div className="mb-3 flex w-full justify-end">
            <button type="button" className="listing-btn-primary" onClick={handleExportAll}>
              <DownloadOutlined size="1em" className="app-icon" style={{ marginRight: 8 }} />
              Export All to CSV
            </button>
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

        <Dialog open={confirmAssignModalVisible} onOpenChange={visible => {
          if (isSaving) return;
          setConfirmAssignModalVisible(visible);
          if (!visible) { setSelectedAssignee(null); setPendingAssignee(null); }
        }}>
          <DialogContent className="max-h-[85vh] overflow-y-auto" showCloseButton={!isSaving} aria-describedby={undefined}>
            <DialogHeader><DialogTitle>Confirmation</DialogTitle></DialogHeader>
          {(() => {
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
            <DialogFooter>
              <Button variant="outline" disabled={isSaving} onClick={() => {
                setConfirmAssignModalVisible(false); setSelectedAssignee(null); setPendingAssignee(null);
              }}>No</Button>
              <Button disabled={isSaving} onClick={handleConfirmAssign}>{isSaving ? 'Assigning...' : 'Yes'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </>
  );
};

export default DataEntryTable;

