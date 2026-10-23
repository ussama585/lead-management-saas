import React, { useMemo, useState, useCallback, useEffect, Suspense } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { message, Select, Modal, Input, Button as AntButton } from "antd";
import { Trash2 as DeleteOutlined } from 'lucide-react';
import { MaterialReactTable, useMaterialReactTable } from "material-react-table";
import BreadCrumb from "../../../../components/breadcrumb.component.jsx";
import LeadCard from "../../../../components/lead-card.component.jsx";
import SettingsDeleteModal from '../../../../components/settings-delete-modal.jsx';
import api from '../../../shared/services/api.js';
import { isSuperAdmin } from '../../../auth/role-access.js';
import { getRolePath } from '../../../auth/role-home.js';
import {
  getDataLeadJobs,
  getDataLead,
} from "../../../shared/services/data-leads-service.js";
import useUserStore from "../../../shared/store/user-store.js";
import { countriesNames, citiesNames, currencyOptions, paymentTermOptions } from "../../../shared/utils/countries.js";
import { loadTableState } from "../../../shared/utils/persistTableState.js";
import { formatSalaryNum } from "../../../shared/utils/formatters.js";

async function updateDataLeadJob(jobId, payload) {
  const { data } = await api.patch(`/data-leads/update-job/${encodeURIComponent(jobId)}`, payload);
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not update job.');
  return data;
}
async function deleteDataLeadJob(jobId) {
  const { data } = await api.delete(`/data-leads/update-job/${encodeURIComponent(jobId)}`);
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not delete job.');
  return data;
}

const DataLead = () => {
  const { id } = useParams();
  const dataLeadId = id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useUserStore();

  // Load persisted state from sessionStorage
  const initialState = loadTableState(`data-lead-jobs-${dataLeadId}`, searchParams, {
    defaultStatus: '',
    status: '',
  });

  const [pagination, setPagination] = useState({ 
    pageIndex: initialState.pageIndex, 
    pageSize: initialState.pageSize 
  });
  const [sorting, setSorting] = useState(initialState.sorting);
  const [globalFilter, setGlobalFilter] = useState(initialState.search || '');
  const [descModalOpen, setDescModalOpen] = useState(false);
  const [descEditValue, setDescEditValue] = useState("");
  const [descEditRow, setDescEditRow] = useState(null);
  const [descLoading, setDescLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ visible: false, job: null });

  // Persist table state to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(
        `tableState_data-lead-jobs-${dataLeadId}`,
        JSON.stringify({
          search: globalFilter,
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          sorting: sorting,
          timestamp: Date.now(),
        })
      );
    } catch (e) {
      console.warn('Failed to save data-lead jobs table state:', e);
    }
  }, [globalFilter, pagination.pageIndex, pagination.pageSize, sorting, dataLeadId]);

  // Serialize sorting state for proper cache invalidation
  const sortField = sorting && sorting.length > 0 && sorting[0]?.id ? sorting[0].id : null;
  const sortDirection = sorting && sorting.length > 0 && sorting[0]?.desc !== undefined ? sorting[0].desc : null;

  const { data, isLoading, isFetching, refetch: refetchJobs } = useQuery(
    ["dataLeadJobs", dataLeadId, pagination.pageIndex, pagination.pageSize, sortField, sortDirection, globalFilter],
    async () => {
      const params = {
        page: pagination.pageIndex + 1,
        size: pagination.pageSize,
      };

      if (globalFilter) {
        params.search = globalFilter;
      }

      if (sorting.length) {
        const { id: sortId, desc } = sorting[0];
        params.sort_by = sortId;
        params.order = desc ? 'desc' : 'asc';
      }

      return getDataLeadJobs(dataLeadId, params);
    },
    {
      enabled: Boolean(dataLeadId),
      staleTime: 0, // Always consider data stale - ensures fresh data on every change
      cacheTime: 0, // Don't cache - ensures sorting changes trigger immediate refetch
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  );

  const jobs = data?.results ?? [];
  const totalCount = data?.count ?? jobs.length;

  const deleteJobMutation = useMutation(
    ({ jobId }) => deleteDataLeadJob(jobId),
    {
      onSuccess: (res) => {
        message.success(res?.message || "Job deleted successfully");
        setDeleteModal({ visible: false, job: null });
        queryClient.invalidateQueries(["dataLeadJobs", dataLeadId]);
        queryClient.invalidateQueries(['dataLeadJobDetail']);
        queryClient.invalidateQueries(['dataLeadDetail']);
        refetchJobs();
      },
      onError: (error) => {
        message.error(error?.message || "Failed to delete job");
      },
    },
  );

  const handleDeleteJob = useCallback((job) => {
    deleteJobMutation.reset();
    setDeleteModal({ visible: true, job });
  }, []);

  const handleConfirmDeleteJob = useCallback(() => {
    if (!deleteModal.job || deleteJobMutation.isLoading) return;
    deleteJobMutation.mutate({ jobId: deleteModal.job.id });
  }, [deleteModal.job, deleteJobMutation]);

  const { data: leadDetail, refetch: refetchLeadDetail } = useQuery(
    ["dataLeadDetail", dataLeadId],
    () => getDataLead(dataLeadId),
    { enabled: Boolean(dataLeadId) },
  );

  const leadMeta = leadDetail ?? data?.lead ?? data?.data_lead ?? {};

  const leadForCard = useMemo(() => {
    if (!leadMeta || !Object.keys(leadMeta).length) return null;
    return {
      ...leadMeta,
      id: leadMeta.id ?? dataLeadId,
      contact_person_name: leadMeta.contact_person_name ?? leadMeta.full_name ?? "-",
      company_name: leadMeta.company_name ?? "-",
      phone_number: leadMeta.phone_number ?? leadMeta.phone ?? leadMeta.contact_phone ?? "",
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
  }, [leadMeta, dataLeadId]);
  const isReadOnlyLead =
    leadForCard?.status === 'Potential Client' ||
    leadForCard?.converted_to_client === true ||
    leadForCard?.converted_to_client === 1 ||
    leadForCard?.converted_to_client === '1' ||
    leadForCard?.converted_to_client === 'true';
  const canDeleteJob = (isSuperAdmin(user?.user_type) || user?.user_type === "sales_manager") && !isReadOnlyLead;

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

  const handleCreateJob = useCallback(() => {
    if (!dataLeadId) return;
    navigate(`/data-leads/create-job/${dataLeadId}`);
  }, [navigate, dataLeadId]);

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

      // Hide Job column for marketing managers
      ...(user?.user_type !== 'marketing_manager' ? [{
        header: "Job",
        accessorKey: "job_title",
        size: 0.5,
        enableEditing: false,
        Cell: ({ cell, row }) => (
          <span
            style={{ cursor: isReadOnlyLead ? "default" : "pointer", textDecoration: isReadOnlyLead ? "none" : "underline" }}
            onClick={() => {
              if (isReadOnlyLead) return;
              navigate(`/data-leads/${dataLeadId}/edit/${row.original.id}`);
            }}
          >
            {cell.getValue() || "-"}
          </span>
        ),
      }] : []),
      {
        header: "No. of Resources",
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
                updateDataLeadJob(row.original.id, { number_of_vacancies: newValue })
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
                updateDataLeadJob(row.original.id, { job_type: newValue })
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
                updateDataLeadJob(row.original.id, { employment_type: newValue })
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
                await updateDataLeadJob(row.original.id, { department: value });
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
                updateDataLeadJob(row.original.id, { location_city: newValue })
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
        sortDescFirst: false, // Start with ascending order (A to Z)
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
                updateDataLeadJob(row.original.id, { location_country: newValue })
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
                await updateDataLeadJob(row.original.id, { min_experience: value });
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
                await updateDataLeadJob(row.original.id, { max_experience: value });
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
                await updateDataLeadJob(row.original.id, { min_salary: value });
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
                await updateDataLeadJob(row.original.id, { max_salary: value });
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
                updateDataLeadJob(row.original.id, { currency: newValue })
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
                updateDataLeadJob(row.original.id, { payment_term: newValue })
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
                updateDataLeadJob(row.original.id, { gender_preference: newValue })
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
        header: "Job Description",
        accessorKey: "job_description",
        size: 1,
        Cell: ({ cell, row }) => (
          <>
           
            <AntButton
              size="small"
              style={{ marginLeft: 8 }}
              disabled={isReadOnlyLead}
              onClick={() => {
                setDescEditValue(cell.getValue() || "");
                setDescEditRow(row.original);
                setDescModalOpen(true);
              }}
          >
            Edit
            </AntButton>
          </>
        ),
      },
      {
        header: 'View Details', id: 'view_details', enableSorting: false, enableEditing: false,
        Cell: ({ row }) => <AntButton size="small" onClick={() => navigate(getRolePath(user?.user_type, `/data-leads/${dataLeadId}/jobs/${row.original.id}`))}>View Details</AntButton>,
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
    ],
    [navigate, dataLeadId, normalizeEmploymentType, refetchJobs, isReadOnlyLead, canDeleteJob, handleDeleteJob, user?.user_type],
  );

  const getRowId = useCallback(
    (row) => row.id?.toString() ?? `${row.job_title}-${row.created_at}`,
    [],
  );

  // Custom handler to ensure sorting toggles between asc and desc, never clears
  const handleSortingChange = useCallback((newSorting) => {
    // If sorting is being cleared (empty array), and we had a previous sort, toggle it instead
    if ((!newSorting || newSorting.length === 0) && sorting && sorting.length > 0 && sorting[0]?.id) {
      // Toggle the existing sort direction instead of clearing
      const currentSort = sorting[0];
      const toggledSort = [{
        id: currentSort.id,
        desc: !currentSort.desc // Toggle between true and false
      }];
      setSorting(toggledSort);
    } else {
      // Normal update
      setSorting(newSorting);
    }
  }, [sorting]);

  const table = useMaterialReactTable({
    columns,
    data: jobs,
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
    rowCount: totalCount,
    enableGlobalFilter: true,
  });

  return (
    <>
      <BreadCrumb linkText="Data Lead Jobs" goBack={() => navigate(-1)} />
      <div className="leads">
        <div className="container">
      <Box
        sx={{
         
          minHeight: "calc(100vh - 120px)",
        }}
      >
        {leadForCard && <LeadCard lead={leadForCard} leadType="Data Lead" refetchLeadDetail={refetchLeadDetail} />}
        {!isReadOnlyLead && (
          <Stack direction="row" spacing={1} sx={{ mb: 2, mt: 2 }}>
            <Button
              className="custom-button"
              onClick={handleCreateJob}
              disabled={!dataLeadId}
              sx={{
                backgroundColor: "#3e6a9f",
                "&:hover": { backgroundColor: "#2d5a8a" },
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Add new Job
            </Button>
          </Stack>
        )}

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
          disabled={isReadOnlyLead}
          onChange={(e) => setDescEditValue(e.target.value)}
        />
        <div style={{ textAlign: "right", marginTop: 16 }}>
          <AntButton onClick={() => setDescModalOpen(false)} style={{ marginRight: 8 }}>
            Cancel
          </AntButton>
          <AntButton
            type="primary"
            loading={descLoading}
            disabled={isReadOnlyLead}
            onClick={async () => {
              setDescLoading(true);
              try {
                await updateDataLeadJob(descEditRow.id, { job_description: descEditValue });
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
          </AntButton>
        </div>
      </Modal>

      <SettingsDeleteModal title="Delete job" itemName={deleteModal.job?.job_title}
        open={deleteModal.visible} loading={deleteJobMutation.isLoading}
        error={deleteJobMutation.isError ? deleteJobMutation.error?.response?.data?.message || deleteJobMutation.error?.message || 'Could not delete job.' : null}
        onCancel={() => setDeleteModal({ visible: false, job: null })} onConfirm={handleConfirmDeleteJob} />
    </>
  );
};

export default DataLead;

