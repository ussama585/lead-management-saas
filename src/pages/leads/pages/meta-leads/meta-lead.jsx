import { message } from '../../../../components/ui/notifications.jsx';
import { Modal } from '../../../../components/ui/app-modal.jsx';
import { Select } from '../../../../components/ui/app-select.jsx';
import { Input } from '../../../../components/ui/app-controls.jsx';
import { Button } from '../../../../components/ui/app-controls.jsx';
import React, { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "react-query";

import { Trash2 as DeleteOutlined } from 'lucide-react';
import { MaterialReactTable, useMaterialReactTable } from "material-react-table";
import BreadCrumb from "../../../../components/breadcrumb.component.jsx";
import LeadCard from "../../../../components/lead-card.component.jsx";
import StatusHistoryModal, { createStatusHistoryColumn } from "../../../../components/status-history-modal.jsx";
import { ConfirmationModal } from "../../../clients/components/LazyModals.jsx";
import api from "../../../shared/services/api.js";
import {
  getMetaLeadDetail,
  getMetaLeadJobHistory,
  updateMetaLeadJobById,
  deleteMetaLeadJob,
} from "../../../shared/services/metaLeads.js";
import useUserStore from "../../../shared/store/user-store.js";
import { getRoleHome } from "../../../auth/role-home.js";
import { countriesNames, citiesNames, currencyOptions, paymentTermOptions } from "../../../shared/utils/countries.js";
import { loadTableState } from "../../../shared/utils/persistTableState.js";
import { formatSalaryNum } from "../../../shared/utils/formatters.js";

const MetaLead = () => {
  const { id } = useParams();
  const leadId = id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useUserStore();

  // Load persisted state from sessionStorage with safe fallbacks
  const initialState = React.useMemo(() => {
    try {
      return loadTableState(`meta-lead-jobs-${leadId}`, searchParams, {
        defaultStatus: '',
        status: '',
      });
    } catch (error) {
      console.warn('Failed to load table state:', error);
      return {
        pageIndex: 0,
        pageSize: 10,
        sorting: [],
        search: '',
      };
    }
  }, [leadId, searchParams]);

  const [pagination, setPagination] = useState({ 
    pageIndex: initialState?.pageIndex ?? 0, 
    pageSize: initialState?.pageSize ?? 10
  });
  const [sorting, setSorting] = useState(initialState?.sorting ?? []);
  const [globalFilter, setGlobalFilter] = useState(initialState?.search || '');
  const [descModalOpen, setDescModalOpen] = useState(false);
  const [descEditValue, setDescEditValue] = useState("");
  const [descEditRow, setDescEditRow] = useState(null);
  const [descLoading, setDescLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ visible: false, job: null });
  const [deleteReason, setDeleteReason] = useState("");
  const [historyJob, setHistoryJob] = useState(null);

  // Persist table state to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(
        `tableState_meta-lead-jobs-${leadId}`,
        JSON.stringify({
          search: globalFilter,
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          sorting: sorting,
          timestamp: Date.now(),
        })
      );
    } catch (e) {
      console.warn('Failed to save meta-lead jobs table state:', e);
    }
  }, [globalFilter, pagination.pageIndex, pagination.pageSize, sorting, leadId]);

  const {
  data: jobsData,
  isLoading,
  isFetching,
  refetch: refetchJobs,
} = useQuery(
  [
    `metaLeadJobs-${leadId}`,
    pagination.pageIndex,
    pagination.pageSize,
    globalFilter,
    sorting?.[0]?.['id'],
    sorting?.[0]?.['desc'],
  ],
  async () => await api.get(`/meta-leads/jobs/${leadId}?page=${pagination.pageIndex+1}&size=${pagination.pageSize}&search=${globalFilter}&sort_by=${sorting?.[0]?.['id'] ?? ''}&order=${sorting?.[0]?.['desc'] ? 'desc' : 'asc'}`),
  {
    enabled: Boolean(leadId),
    staleTime: 5 * 60 * 1000, // 5 minutes - jobs data changes frequently
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  },
);


  const jobs = jobsData?.data?.results ?? [];
  const totalCount = jobsData?.data?.count ?? (Array.isArray(jobs) ? jobs.length : 0);

  const deleteJobMutation = useMutation(
    ({ jobId, reason }) => deleteMetaLeadJob(jobId, reason),
    {
      onSuccess: (res) => {
        message.success(res?.message || "Job deleted successfully");
        setDeleteModal({ visible: false, job: null });
        setDeleteReason("");
        queryClient.invalidateQueries([`metaLeadJobs-${leadId}`]);
        refetchJobs();
      },
      onError: (error) => {
        message.error(error?.message || "Failed to delete job");
      },
    },
  );

  const handleDeleteJob = useCallback((job) => {
    setDeleteModal({ visible: true, job });
  }, []);

  const handleConfirmDeleteJob = useCallback(() => {
    if (!deleteReason.trim()) {
      message.error("Please provide a reason for deletion");
      return;
    }
    deleteJobMutation.mutate({ jobId: deleteModal.job?.id, reason: deleteReason.trim() });
  }, [deleteModal.job, deleteReason, deleteJobMutation]);

 const { data: leadDetail, refetch: refetchLeadDetail } = useQuery(
  ["metaLeadDetail", leadId],
  () => getMetaLeadDetail(leadId),
  { enabled: Boolean(leadId), refetchOnWindowFocus: false },
);

  const leadMeta =
    leadDetail ??
    jobsData?.lead ??
    (Array.isArray(jobsData?.results) ? jobsData?.results?.lead : null) ??
    {};

  const leadForCard = useMemo(() => {
    if (!leadMeta || (typeof leadMeta === "object" && !Object.keys(leadMeta).length)) return null;
    return {
      ...leadMeta,
      id: leadMeta.id ?? leadId,
      contact_person_name: leadMeta.contact_person_name ?? leadMeta.full_name ?? "-",
      company_name: leadMeta.company_name ?? "-",
      phone_number: leadMeta.phone_number ?? leadMeta.phone ?? "",
      email: leadMeta.email ?? leadMeta.work_email ?? "",
      contact_person_designation: leadMeta.contact_person_designation ?? leadMeta.designation ?? leadMeta.job_title ?? "",
      status: leadMeta.status ?? "Pending Contact",
      assigned_to: leadMeta.assigned_to ?? leadMeta.assigned_to_id ?? null,
      created_at: leadMeta.created_at ?? leadMeta.created ?? null,
      identifier: leadMeta.identifier ?? leadMeta.slug ?? "",
      promo_code: leadMeta.promo_code ?? "",
      is_accepting_response: leadMeta.is_accepting_response ?? false,
      converted_to_client: leadMeta.converted_to_client ?? false,
    };
  }, [leadMeta, leadId]);
  const isReadOnlyLead =

    leadForCard?.converted_to_client === true

  const canDeleteJob = (user?.user_type === "super_admin" || user?.user_type === "sales_manager") && !isReadOnlyLead;

  const formatDate = useCallback((value) => {
    if (!value) return "—";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? value
      : parsed.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  }, []);

  const routePrefix = getRoleHome(user?.user_type);

  const handleCreateJob = useCallback(() => {
    if (!leadId) return;
    navigate(`${routePrefix}/meta-leads/${leadId}/new-job`);
  }, [navigate, leadId, routePrefix]);

  // Function to normalize employment_type values
  const normalizeEmploymentType = useCallback((value) => {
    if (!value) return value;
    const employmentTypeMap = {
      "office-based": "Office-Based",
      remote: "Remote",
      hybrid: "Hybrid",
    };
    return employmentTypeMap[value.toLowerCase()] || value;
  }, []);

  // Options for dropdowns
  const vacancyOptions = Array.from({ length: 100 }, (_, i) => ({
    label: i + 1,
    value: i + 1,
  })).concat({ label: "100+", value: 101 });

  const jobTypeOptions = [
    { label: "Full-Time", value: "Full-Time" },
    { label: "Part-Time", value: "Part-Time" },
    { label: "Contract", value: "Contract" },
    { label: "Temporary", value: "Temporary" },
  ];

  const employmentTypeOptions = [
    { label: "Office-Based", value: "Office-Based" },
    { label: "Remote", value: "Remote" },
    { label: "Hybrid", value: "Hybrid" },
  ];

  const genderOptions = [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "No Preference", value: "No Preference" },
  ];

  const columns = useMemo(
    () => [
      {
        header: "Job",
        id: "job_title", // Explicit id for sorting
        accessorKey: "job_title",
        size: 0.5,
        enableEditing: false,
        sortUndefined: "last", // Handle undefined/null values
        sortDescFirst: false, // Start with ascending order (A to Z)
        Cell: ({ cell, row }) => (
          <span
            style={{ textDecoration: "underline" }}
            onClick={() => {
              if (isReadOnlyLead) return;
              navigate(`${routePrefix}/meta-leads/${leadId}/job/${row.original.id}`);
            }}
          >
            {cell.getValue() || "-"}
          </span>
        ),
      },
      {
        header: "No. of Resources",
        id: "number_of_vacancies", // Explicit id for sorting
        accessorKey: "number_of_vacancies",
        size: 0.5,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          return <span>{value == "101" || value == 101 ? "100+" : value || "-"}</span>;
        },
        Edit: ({ cell, row, table }) => {
          const [value, setValue] = React.useState(cell.getValue() === "101" ? "100+" : cell.getValue());
          return (
            <Select
              className="antd-input dropdown"
              value={value}
              options={vacancyOptions}
              onChange={(newValue) => {
                setValue(newValue);
                updateMetaLeadJobById(row.original.id, { number_of_vacancies: newValue })
                  .then(() => {
                    message.success("Updated");
                    refetchJobs();
                    table.setEditingCell(null);
                  })
                  .catch(() => message.error("Update failed"));
              }}
              style={{ width: "100%" }}
              autoFocus
              popupMatchSelectWidth={false}
            />
          );
        },
      },
      {
        header: "Job Type",
        id: "job_type", // Explicit id for sorting
        accessorKey: "job_type",
        size: 0.5,
        Edit: ({ cell, row, table }) => {
          const [value, setValue] = React.useState(cell.getValue());
          return (
            <Select
              className="antd-input dropdown"
              value={value}
              options={jobTypeOptions}
              onChange={(newValue) => {
                setValue(newValue);
                updateMetaLeadJobById(row.original.id, { job_type: newValue })
                  .then(() => {
                    message.success("Updated");
                    refetchJobs();
                    table.setEditingCell(null);
                  })
                  .catch(() => message.error("Update failed"));
              }}
              style={{ width: "100%" }}
              autoFocus
              popupMatchSelectWidth={false}
            />
          );
        },
      },
      {
        header: "Employment Type",
        id: "employment_type", // Explicit id for sorting
        accessorKey: "employment_type",
        size: 0.5,
        Edit: ({ cell, row, table }) => {
          const [value, setValue] = React.useState(normalizeEmploymentType(cell.getValue()));
          return (
            <Select
              className="antd-input dropdown"
              value={value}
              options={employmentTypeOptions}
              onChange={(newValue) => {
                setValue(newValue);
                updateMetaLeadJobById(row.original.id, { employment_type: newValue })
                  .then(() => {
                    message.success("Updated");
                    refetchJobs();
                    table.setEditingCell(null);
                  })
                  .catch(() => message.error("Update failed"));
              }}
              style={{ width: "100%" }}
              autoFocus
              popupMatchSelectWidth={false}
            />
          );
        },
      },
      {
        header: "Department",
        id: "department", // Explicit id for sorting
        accessorKey: "department",
        size: 0.5,
        sortUndefined: "last", // Handle undefined/null values
        sortDescFirst: false, // Start with ascending order (A to Z)
        muiEditTextFieldProps: ({ cell, row, table }) => ({
          onBlur: async (event) => {
            const value = event.target.value;
            if (value !== row.original.department) {
              try {
                await updateMetaLeadJobById(row.original.id, { department: value });
                message.success("Updated");
                refetchJobs();
              } catch (e) {
                message.error("Update failed");
              }
            }
          },
        }),
      },
      {
        header: "City",
        id: "location_city", // Explicit id for sorting
        accessorKey: "location_city",
        size: 0.5,
        Edit: ({ cell, row, table }) => {
          const [value, setValue] = React.useState(cell.getValue());
          return (
            <Select
              className="antd-input dropdown"
              value={value}
              options={citiesNames}
              showSearch
              onChange={(newValue) => {
                setValue(newValue);
                updateMetaLeadJobById(row.original.id, { location_city: newValue })
                  .then(() => {
                    message.success("Updated");
                    refetchJobs();
                    table.setEditingCell(null);
                  })
                  .catch(() => message.error("Update failed"));
              }}
              style={{ width: "100%" }}
              autoFocus
              popupMatchSelectWidth={false}
            />
          );
        },
      },
      {
        header: "Country",
        id: "location_country", // Explicit id for sorting
        accessorKey: "location_country",
        size: 0.5,
        sortUndefined: "last", // Handle undefined/null values
        sortDescFirst: false, // Start with ascending order (A to Z), then default, then descending
        Edit: ({ cell, row, table }) => {
          const [value, setValue] = React.useState(cell.getValue());
          return (
            <Select
              className="antd-input dropdown"
              value={value}
              options={countriesNames}
              showSearch
              onChange={(newValue) => {
                setValue(newValue);
                updateMetaLeadJobById(row.original.id, { location_country: newValue })
                  .then(() => {
                    message.success("Updated");
                    refetchJobs();
                    table.setEditingCell(null);
                  })
                  .catch(() => message.error("Update failed"));
              }}
              style={{ width: "100%" }}
              autoFocus
              popupMatchSelectWidth={false}
            />
          );
        },
      },
      {
        header: "Experience (Min)",
        id: "min_experience", // Explicit id for sorting
        accessorKey: "min_experience",
        size: 0.5,
        muiEditTextFieldProps: ({ cell, row, table }) => ({
          type: "number",
          onBlur: async (event) => {
            const value = Number(event.target.value);
            const max = Number(row.original.max_experience);
            if (value > max && max !== 0) {
              message.error("Minimum experience cannot be greater than maximum experience");
              return;
            }
            if (value !== row.original.min_experience) {
              try {
                await updateMetaLeadJobById(row.original.id, { min_experience: value });
                message.success("Updated");
                refetchJobs();
              } catch (e) {
                message.error("Update failed");
              }
            }
          },
        }),
      },
      {
        header: "Experience (Max)",
        id: "max_experience", // Explicit id for sorting
        accessorKey: "max_experience",
        size: 0.5,
        muiEditTextFieldProps: ({ cell, row, table }) => ({
          type: "number",
          onBlur: async (event) => {
            const value = Number(event.target.value);
            const min = Number(row.original.min_experience);
            if (value < min) {
              message.error("Maximum experience cannot be less than minimum experience");
              return;
            }
            if (value !== row.original.max_experience) {
              try {
                await updateMetaLeadJobById(row.original.id, { max_experience: value });
                message.success("Updated");
                refetchJobs();
              } catch (e) {
                message.error("Update failed");
              }
            }
          },
        }),
      },
      {
        header: "Min Salary",
        id: "min_salary", // Explicit id for sorting
        accessorKey: "min_salary",
        size: 0.5,
        Cell: ({ cell }) => <span>{cell.getValue() != null ? formatSalaryNum(cell.getValue()) : '-'}</span>,
        muiEditTextFieldProps: ({ cell, row, table }) => ({
          type: "number",
          onBlur: async (event) => {
            const value = Number(event.target.value);
            const max = Number(row.original.max_salary);
            if (value > max && max !== 0) {
              message.error("Minimum salary cannot be greater than maximum salary");
              return;
            }
            if (value !== row.original.min_salary) {
              try {
                await updateMetaLeadJobById(row.original.id, { min_salary: value });
                message.success("Updated");
                refetchJobs();
              } catch (e) {
                message.error("Update failed");
              }
            }
          },
        }),
      },
      {
        header: "Max Salary",
        id: "max_salary", // Explicit id for sorting
        accessorKey: "max_salary",
        size: 0.5,
        Cell: ({ cell }) => <span>{cell.getValue() != null ? formatSalaryNum(cell.getValue()) : '-'}</span>,
        muiEditTextFieldProps: ({ cell, row, table }) => ({
          type: "number",
          onBlur: async (event) => {
            const value = Number(event.target.value);
            const min = Number(row.original.min_salary);
            if (value < min) {
              message.error("Maximum salary cannot be less than minimum salary");
              return;
            }
            if (value !== row.original.max_salary) {
              try {
                await updateMetaLeadJobById(row.original.id, { max_salary: value });
                message.success("Updated");
                refetchJobs();
              } catch (e) {
                message.error("Update failed");
              }
            }
          },
        }),
      },
       {
        header: "Currency",
        id: "currency", // Explicit id for sorting
        accessorKey: "currency",
        size: 0.5,
        Edit: ({ cell, row, table }) => {
          const [value, setValue] = React.useState(cell.getValue());
          return (
            <Select
              className="antd-input dropdown"
              value={value}
              options={currencyOptions}
              onChange={(newValue) => {
                setValue(newValue);
                updateMetaLeadJobById(row.original.id, { currency: newValue })
                  .then(() => {
                    message.success("Updated");
                    refetchJobs();
                    table.setEditingCell(null);
                  })
                  .catch(() => message.error("Update failed"));
              }}
              style={{ width: "100%" }}
              autoFocus
              popupMatchSelectWidth={false}
            />
          );
        },
      },
      {
        header: "Payment Term",
        id: "payment_term", // Explicit id for sorting
        accessorKey: "payment_term",
        size: 0.5,
        Edit: ({ cell, row, table }) => {
          const [value, setValue] = React.useState(cell.getValue());
          return (
            <Select
              className="antd-input dropdown"
              value={value}
              options={paymentTermOptions}
              onChange={(newValue) => {
                setValue(newValue);
                updateMetaLeadJobById(row.original.id, { payment_term: newValue })
                  .then(() => {
                    message.success("Updated");
                    refetchJobs();
                    table.setEditingCell(null);
                  })
                  .catch(() => message.error("Update failed"));
              }}
              style={{ width: "100%" }}
              autoFocus
              popupMatchSelectWidth={false}
            />
          );
        },
      },
      {
        header: "Gender",
        id: "gender_preference", // Explicit id for sorting
        accessorKey: "gender_preference",
        size: 0.5,
        Edit: ({ cell, row, table }) => {
          const [value, setValue] = React.useState(cell.getValue());
          return (
            <Select
              className="antd-input dropdown"
              value={value}
              options={genderOptions}
              onChange={(newValue) => {
                setValue(newValue);
                updateMetaLeadJobById(row.original.id, { gender_preference: newValue })
                  .then(() => {
                    message.success("Updated");
                    refetchJobs();
                    table.setEditingCell(null);
                  })
                  .catch(() => message.error("Update failed"));
              }}
              style={{ width: "100%" }}
              autoFocus
              popupMatchSelectWidth={false}
            />
          );
        },
      },
      {
        header: "CV Submission Deadline",
        id: "cv_submission_deadline",
        accessorKey: "cv_submission_deadline",
        size: 0.5,
        enableEditing: false,
        Cell: ({ cell }) => <span>{cell.getValue() || "—"}</span>,
      },
      {
        header: "Job Description",
        id: "job_description", // Explicit id for sorting
        accessorKey: "job_description",
        size: 1,
        Cell: ({ cell, row }) => (
          <>
            
            <Button
              size="small"
              style={{ marginLeft: 8 }}
              disabled={isReadOnlyLead}
              onClick={() => {
                if (isReadOnlyLead) return;
                setDescEditValue(cell.getValue() || "");
                setDescEditRow(row.original);
                setDescModalOpen(true);
              }}
            >
              Edit
            </Button>
          </>
      ),
    },
    // Delete column - only for admin and sales_manager
    ...(canDeleteJob
      ? [
          {
            header: "Delete",
            id: "delete",
            enableSorting: false,
            enableEditing: false,
            size: 0.4,
            Cell: ({ row }) => (
              <DeleteOutlined size="1em" className="app-icon"
                style={{ cursor: "pointer", color: "#ff4d4f", fontSize: "16px" }}
                onClick={() => handleDeleteJob(row.original)}
              />
            ),
          },
        ]
      : []),
    createStatusHistoryColumn({
      header: 'History',
      accessorKey: 'job_history',
      buttonTitle: 'View Job History',
      onOpenHistory: setHistoryJob,
    }),
    ],
    [navigate, routePrefix, leadId, normalizeEmploymentType, refetchJobs, isReadOnlyLead, canDeleteJob, handleDeleteJob],
  );

  const getRowId = useCallback(
    (row) => row.id?.toString() ?? `${row.job_title}-${row.created_at}`,
    [],
  );

  // Custom handler to allow sorting to go to default state
  const handleSortingChange = useCallback((newSorting) => {
    // Allow clearing to empty array for default/unsorted state
    // This matches the behavior where clicking multiple times cycles: asc -> desc -> default
    setSorting(newSorting || []);
  }, []);

  const table = useMaterialReactTable({
    columns,
    data: Array.isArray(jobs) ? jobs : [],
    enableEditing: !isReadOnlyLead,
    editDisplayMode: "cell",
    muiTableBodyCellProps: ({ cell, column, table }) => ({
      onClick: () => {
        if (column.id !== "job_title" && !isReadOnlyLead) {
          table.setEditingCell(cell);
          queueMicrotask(() => {
            const textField = table.refs.editInputRefs.current?.[column.id];
            if (textField) {
              textField.focus();
              textField.select?.();
            }
          });
        }
      },
      style: { cursor: column.id !== "job_title" && !isReadOnlyLead ? "pointer" : undefined },
    }),
    layoutMode: "semantic",
    enableStickyFooter: true,
    enableStickyHeader: true,
    enableRowNumbers: true,
    enableColumnActions: false,
    muiTableHeadCellProps: {
      sx: {
        fontSize: "12px",
        padding: "4px 8px",
      },
    },
    muiTableBodyCellProps: undefined,
    muiTopToolbarProps: {
      sx: {
        padding: "6px 12px",
        minHeight: "40px",
        backgroundColor: "#f5f5f5",
        borderTopLeftRadius: "8px",
        borderTopRightRadius: "8px",
        display: "flex",
      },
    },
    renderTopToolbarCustomActions: () => (
      <div style={{ fontSize: "16px", fontWeight: "600", color: "#3E6A9F" }}>
        Jobs
      </div>
    ),
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        marginTop: "10px",
        boxShadow: "none",
        border: "1px solid #ddd",
        borderRadius: "8px",
      },
    },
    state: {
      pagination,
      globalFilter,
      sorting,
      isLoading: isLoading || isFetching,
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onSortingChange: handleSortingChange,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableSortingRemoval: true, // Allow cycling through: asc -> default -> desc
    rowCount: totalCount,
    enableGlobalFilter: true,
  });

const getMetaLeadUrl = () => {
  return `${routePrefix}/meta-leads`;
};

  return (
    <>
     <BreadCrumb 
  linkText="Meta Lead Jobs" 
  goBack={() => navigate(getMetaLeadUrl())} 
/>
      <div className="leads">
        <div className="container">
     <Box
        sx={{
          padding: "0rem",
          minHeight: "calc(100vh - 120px)",
        }}
      >
        {leadForCard && <LeadCard lead={leadForCard} leadType="Meta Lead" refetchLeadDetail={refetchLeadDetail} />}
        <Stack direction="row" spacing={1} sx={{ mb: 2, mt: 2 }}>
          <Button
            className="custom-button"
            onClick={handleCreateJob}
            disabled={!leadId || isReadOnlyLead}
            size="large"
            style={{
              backgroundColor: "#3e6a9f",
              borderColor: "#3e6a9f",
              color: "white",
              height: 40,
              borderRadius: 8,
              fontWeight: 600,
              padding: "0 24px",
            }}
          >
            Add new Job
          </Button>
        </Stack>

            <MaterialReactTable table={table} />
          </Box>
        </div>
      </div>
      <Modal
        title="Edit Job Description"
        open={descModalOpen}
        onCancel={() => setDescModalOpen(false)}
        footer={null}
      >
        <Input.TextArea
          rows={6}
          value={descEditValue}
          onChange={(e) => setDescEditValue(e.target.value)}
        />
        <div style={{ textAlign: "right", marginTop: 16 }}>
          <Button onClick={() => setDescModalOpen(false)} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button
            type="primary"
            loading={descLoading}
            onClick={async () => {
              setDescLoading(true);
              try {
                await updateMetaLeadJobById(descEditRow.id, { job_description: descEditValue });
                message.success("Description updated");
                refetchJobs();
                setDescModalOpen(false);
                setDescEditRow(null);
                setDescEditValue("");
              } catch (e) {
                message.error("Update failed");
              } finally {
                setDescLoading(false);
              }
            }}
            style={{
              backgroundColor: "#3E6A9F",
              borderColor: "#3E6A9F",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#2d5a8a";
              e.target.style.borderColor = "#2d5a8a";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#3E6A9F";
              e.target.style.borderColor = "#3E6A9F";
            }}
          >
            Save
          </Button>
        </div>
      </Modal>

      <StatusHistoryModal
        open={historyJob != null}
        entity={historyJob}
        onClose={() => setHistoryJob(null)}
        fetchHistoryApi={getMetaLeadJobHistory}
        title={job => `Meta Lead Job History - ${job?.job_title || 'Job'}`}
        getTitleFromEntity={job => job?.job_title || 'Job'}
        historyDateKey="changed_at"
        queryKeyPrefix={`metaLeadJobHistory-${user?.id}-${user?.user_type}-${leadId}`}
        emptyMessage="No job history available."
      />
      <Suspense fallback={null}>
        <ConfirmationModal
          showModal={deleteModal.visible}
          setShowModal={(visible) => {
            setDeleteModal((prev) => ({ ...prev, visible }));
            if (!visible) setDeleteReason("");
          }}
          mutation={deleteJobMutation}
          onConfirm={handleConfirmDeleteJob}
          showReasonField={true}
          reason={deleteReason}
          setReason={setDeleteReason}
          message={
            <span>
              This action cannot be reversed. Are you sure you want to delete job: <strong>{deleteModal.job?.job_title}</strong>?
            </span>
          }
        />
      </Suspense>
    </>
  );
};

export default MetaLead;

