import ManualLocationInput from '../../../../components/manual-location-input.jsx';
import { message } from '../../../../components/ui/notifications.jsx';
import { Modal } from '../../../../components/ui/app-modal.jsx';
import { Select } from '../../../../components/ui/app-select.jsx';
import { Input } from '../../../../components/ui/app-controls.jsx';
import { Spin, Button } from '../../../../components/ui/app-controls.jsx';
import React, { useMemo, useState, useEffect } from 'react';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import "../../../../assets/styles/legacy/leads.generated.css";
import { Alert, Row, Col } from 'antd';
import { Trash2 as DeleteOutlined } from 'lucide-react';
import LeadCard from '../../../../components/lead-card.component.jsx';
import StatusHistoryModal, { createStatusHistoryColumn } from '../../../../components/status-history-modal.jsx';
import DeleteJobDialog from './delete-job-dialog.jsx';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import api from '../../../shared/services/api.js';
import { deleteWebsiteLeadJob } from '../../../shared/services/leads.js';
import { formatCurrency, formatPaymentTerm, formatSalaryNum } from '../../../shared/utils/formatters.js';
import useUserStore from '../../../shared/store/user-store.js';
import { nationalityOptions, currencyOptions, paymentTermOptions, languagesOptions } from '../../../shared/utils/countries.js';
import { loadTableState } from '../../../shared/utils/persistTableState.js';
import { getRolePath } from '../../../auth/role-home.js';
import { isSuperAdmin } from '../../../auth/role-access.js';

export async function getWebsiteLeadDetail(identifier) {

    const { data } = await api.get(
        `/lead-generation/update/${encodeURIComponent(identifier)}`
    );

    if (data?.id == null) {
        console.trace('Invalid lead details:', identifier);
        throw new Error('Could not read lead details.');
    }

    console.log('Returning lead data:', data);
    return data;
}

export async function getWebsiteLeadJobHistory(jobId) {
    const { data } = await api.get(`/lead-generation/job-history/${encodeURIComponent(jobId)}`);
    if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not load job history.');
    if (!Array.isArray(data)) throw new Error('Could not read job history.');
    return data;
}

export async function getWebsiteLeadJobs(leadId, { page = 1, size = 10, search = '', sortBy = '', order = 'asc' } = {}) {
    const { data } = await api.get(`/lead-generation/job-list/${encodeURIComponent(leadId)}`, {
        params: { page, size, search, sort_by: sortBy, order },
    });
    if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not load lead jobs.');
    if (!Array.isArray(data?.results)) throw new Error('Could not read lead jobs.');
    return data;
}

const LeadDetailPage = () => {
    document.title = 'Lead | Search O Pal';

    let navigate = useNavigate();
    const { id } = useParams();
    const leadId = id;
    const { user } = useUserStore();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();

    // Load persisted state from sessionStorage
    const initialState = loadTableState(`lead-jobs-${leadId}`, searchParams, {
        defaultStatus: '',
        status: '',
    });

    const [pagination, setPagination] = React.useState({
        pageIndex: initialState.pageIndex,
        pageSize: initialState.pageSize,
    });
    const [sorting, setSorting] = React.useState(initialState.sorting);
    const [globalFilter, setGlobalFilter] = React.useState(initialState.search || "");
    const [descModalOpen, setDescModalOpen] = useState(false);
    const [descEditValue, setDescEditValue] = useState('');
    const [descEditRow, setDescEditRow] = useState(null);
    const [descLoading, setDescLoading] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ visible: false, job: null });
    const [historyJob, setHistoryJob] = useState(null);

    // Persist table state to sessionStorage
    useEffect(() => {
        try {
            sessionStorage.setItem(
                `tableState_lead-jobs-${leadId}`,
                JSON.stringify({
                    search: globalFilter,
                    pageIndex: pagination.pageIndex,
                    pageSize: pagination.pageSize,
                    sorting: sorting,
                    timestamp: Date.now(),
                })
            );
        } catch (e) {
            console.warn('Failed to save lead jobs table state:', e);
        }
    }, [globalFilter, pagination.pageIndex, pagination.pageSize, sorting, leadId]);

    // Function to normalize employment_type values
    const normalizeEmploymentType = (value) => {
        if (!value) return value;
        
        // Map lowercase values to proper case
        const employmentTypeMap = {
            'office-based': 'Office-Based',
            'remote': 'Remote',
            'hybrid': 'Hybrid'
        };
        
        return employmentTypeMap[value.toLowerCase()] || value;
    };

    const identifier = searchParams.get('identifier') || id;
    const { isLoading, data, isError: detailError, error: detailRequestError, refetch: refetchDetail } = useQuery(
        ['websiteLeadDetail', user?.id, user?.user_type, identifier],
        () => getWebsiteLeadDetail(identifier),
        {
            staleTime: 10 * 60 * 1000, // 10 minutes - lead details rarely change
            cacheTime: 15 * 60 * 1000, // 15 minutes
            refetchOnWindowFocus: false
        }
    );
    console.log(data,"datadata__")
    const { isLoading: loadingJobs, data: jobsData, isError: jobsError, error: jobsRequestError, refetch: refetchJobs } = useQuery(
        [
            `leadjobs-${id}`, 
            pagination.pageIndex, 
            pagination.pageSize, 
            globalFilter, 
            sorting?.[0]?.['id'], 
            sorting?.[0]?.['desc']
        ],
        () => getWebsiteLeadJobs(id, { page: pagination.pageIndex + 1, size: pagination.pageSize, search: globalFilter,
            sortBy: sorting?.[0]?.id ?? '', order: sorting?.[0]?.desc ? 'desc' : 'asc' }),
        {
            staleTime: 5 * 60 * 1000, // 5 minutes - jobs data changes frequently
            cacheTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: false
        }
    );

    const jobs = jobsData?.results ?? [];
    const lead = data ?? {};
    console.log(lead,"leadleadlead")
    const isReadOnlyLead =lead?.converted_to_client === true
    const canDeleteJob = (isSuperAdmin(user?.user_type) || user?.user_type === 'sales_manager') && !isReadOnlyLead;

    const deleteJobMutation = useMutation(
        ({ jobId, reason }) => deleteWebsiteLeadJob(jobId, reason),
        {
            onSuccess: (res) => {
                message.success(res?.message || 'Job deleted successfully');
                setDeleteModal({ visible: false, job: null });
                queryClient.invalidateQueries([`leadjobs-${id}`]);
                refetchJobs();
            },
        }
    );

    const handleDeleteJob = (job) => {
        setDeleteModal({ visible: true, job });
    };

    const handleConfirmDeleteJob = (jobId, payload) =>
        deleteJobMutation.mutateAsync({ jobId, reason: payload.delete_reason });

    const goBack = () => {
        navigate(getRolePath(user?.user_type, '/leads'));
    };

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

    const columns = useMemo(() => [
        {
            header: 'Job',
            accessorKey: 'job_title',
            size: 0.5,
            enableEditing: false,
            Cell: ({ cell, row }) => <span style={{ cursor: isReadOnlyLead ? 'default' : 'pointer' }}
                onClick={() => {
                    if (isReadOnlyLead) return;
                    navigate(getRolePath(user?.user_type, `/leads/${id}/job/${row.original.id}`));
                }}>
                <span style={{ textDecoration: isReadOnlyLead ? 'none' : 'underline' }}>{cell.getValue()}</span></span>,
        },
        {
    header: 'No. of Resources',
    id: 'number_of_vacancies', // Explicit id for sorting
    accessorKey: 'number_of_vacancies',
    size: 0.5,
    sortUndefined: 'last', // Handle undefined/null values
    sortDescFirst: false, // Start with ascending order (A to Z)
    Cell: ({ cell }) => {
    const value = cell.getValue();
    return <span>{value == '101' || value == 101 ? '100+' : value}</span>;
},
    Edit: ({ cell, row, table }) => {
        const [value, setValue] = React.useState(cell.getValue() === '101' ? '100+' : cell.getValue());
        return (
            <Select
                className='antd-input dropdown'
                value={value}
                options={vacancyOptions}
                onChange={(newValue) => {
                    setValue(newValue);
                    api.patch(`/lead-generation/job/${row.original.id}`, { number_of_vacancies: newValue })
                        .then(() => {
                            message.success('Updated');
                            refetchJobs();
                            table.setEditingCell(null);
                        })
                        .catch(() => message.error('Update failed'));
                }}
                style={{ width: '100%' }}
                autoFocus
                popupMatchSelectWidth={false}
            />
        );
    },
},
        {
            header: 'Job Type',
            id: 'job_type', // Explicit id for sorting
            accessorKey: 'job_type',
            size: 0.5,
            sortUndefined: 'last', // Handle undefined/null values
            sortDescFirst: false, // Start with ascending order (A to Z)
            Edit: ({ cell, row, table }) => {
                const [value, setValue] = React.useState(cell.getValue());
                return (
                    <Select
                        className='antd-input dropdown'
                        value={value}
                        options={jobTypeOptions}
                        onChange={(newValue) => {
                            setValue(newValue);
                            api.patch(`/lead-generation/job/${row.original.id}`, { job_type: newValue })
                                .then(() => {
                                    message.success('Updated');
                                    refetchJobs();
                                    table.setEditingCell(null);
                                })
                                .catch(() => message.error('Update failed'));
                        }}
                        style={{ width: '100%' }}
                        autoFocus
                        popupMatchSelectWidth={false}
                    />
                );
            },
        },
        {
            header: 'Employment Type',
            id: 'employment_type', // Explicit id for sorting
            accessorKey: 'employment_type',
            size: 0.5,
            sortUndefined: 'last', // Handle undefined/null values
            sortDescFirst: false, // Start with ascending order (A to Z)
            Edit: ({ cell, row, table }) => {
                const [value, setValue] = React.useState(normalizeEmploymentType(cell.getValue()));
                return (
                    <Select
                        className='antd-input dropdown'
                        value={value}
                        options={employmentTypeOptions}
                        onChange={(newValue) => {
                            setValue(newValue);
                            api.patch(`/lead-generation/job/${row.original.id}`, { employment_type: newValue })
                                .then(() => {
                                    message.success('Updated');
                                    refetchJobs();
                                    table.setEditingCell(null);
                                })
                                .catch(() => message.error('Update failed'));
                        }}
                        style={{ width: '100%' }}
                        autoFocus
                        popupMatchSelectWidth={false}
                    />
                );
            },
        },
        {
            header: 'Department',
            id: 'department', // Explicit id for sorting
            accessorKey: 'department',
            size: 0.5,
            sortUndefined: 'last', // Handle undefined/null values
            sortDescFirst: false, // Start with ascending order (A to Z)
            muiEditTextFieldProps: ({ cell, row, table }) => ({
                onBlur: async (event) => {
                    const value = event.target.value;
                    if (value !== row.original.department) {
                        try {
                            await api.patch(`/lead-generation/job/${row.original.id}`, { department: value });
                            message.success('Updated');
                            refetchJobs();
                        } catch (e) {
                            message.error('Update failed');
                        }
                    }
                },
            }),
        },
        {
            header: 'City',
            id: 'location_city', // Explicit id for sorting
            accessorKey: 'location_city',
            size: 0.5,
            sortUndefined: 'last', // Handle undefined/null values
            sortDescFirst: false, // Start with ascending order (A to Z)
            Edit: ({ cell, row, table }) => {
                const [value, setValue] = React.useState(cell.getValue());
                return (
                    <ManualLocationInput commitOnBlur
                        className='antd-input dropdown'
                        value={value}
                        showSearch
                        onChange={(newValue) => {
                            setValue(newValue);
                            api.patch(`/lead-generation/job/${row.original.id}`, { location_city: newValue })
                                .then(() => {
                                    message.success('Updated');
                                    refetchJobs();
                                    table.setEditingCell(null);
                                })
                                .catch(() => message.error('Update failed'));
                        }}
                        style={{ width: '100%' }}
                        autoFocus
                        popupMatchSelectWidth={false}
                    />
                );
            },
        },
        {
            header: 'Country',
            id: 'location_country', // Explicit id for sorting
            accessorKey: 'location_country',
            size: 0.5,
            sortUndefined: 'last', // Handle undefined/null values
            sortDescFirst: false, // Start with ascending order (A to Z)
            Edit: ({ cell, row, table }) => {
                const [value, setValue] = React.useState(cell.getValue());
                return (
                    <ManualLocationInput commitOnBlur
                        className='antd-input dropdown'
                        value={value}
                        showSearch
                        onChange={(newValue) => {
                            setValue(newValue);
                            api.patch(`/lead-generation/job/${row.original.id}`, { location_country: newValue })
                                .then(() => {
                                    message.success('Updated');
                                    refetchJobs();
                                    table.setEditingCell(null);
                                })
                                .catch(() => message.error('Update failed'));
                        }}
                        style={{ width: '100%' }}
                        autoFocus
                        popupMatchSelectWidth={false}
                    />
                );
            },
        },
        {
            header: 'Experience (Min)',
            id: 'min_experience', // Explicit id for sorting
            accessorKey: 'min_experience',
            size: 0.5,
            sortUndefined: 'last', // Handle undefined/null values
            sortDescFirst: false, // Start with ascending order (A to Z)
            muiEditTextFieldProps: ({ cell, row, table }) => ({
                type: 'number',
                onBlur: async (event) => {
                    const value = Number(event.target.value);
                    const max = Number(row.original.max_experience);
                    if (value > max && max !== 0) {
                        message.error('Minimum experience cannot be greater than maximum experience');
                        return;
                    }
                    if (value !== row.original.min_experience) {
                        try {
                            await api.patch(`/lead-generation/job/${row.original.id}`, { min_experience: value });
                            message.success('Updated');
                            refetchJobs();
                        } catch (e) {
                            message.error('Update failed');
                        }
                    }
                },
            }),
        },
        {
            header: 'Experience (Max)',
            id: 'max_experience', // Explicit id for sorting
            accessorKey: 'max_experience',
            size: 0.5,
            sortUndefined: 'last', // Handle undefined/null values
            sortDescFirst: false, // Start with ascending order (A to Z)
            muiEditTextFieldProps: ({ cell, row, table }) => ({
                type: 'number',
                onBlur: async (event) => {
                    const value = Number(event.target.value);
                    const min = Number(row.original.min_experience);
                    if (value < min) {
                        message.error('Maximum experience cannot be less than minimum experience');
                        return;
                    }
                    if (value !== row.original.max_experience) {
                        try {
                            await api.patch(`/lead-generation/job/${row.original.id}`, { max_experience: value });
                            message.success('Updated');
                            refetchJobs();
                        } catch (e) {
                            message.error('Update failed');
                        }
                    }
                },
            }),
        },
        {
            header: 'Min Salary',
            id: 'min_salary', // Explicit id for sorting
            accessorKey: 'min_salary',
            size: 0.5,
            sortUndefined: 'last', // Handle undefined/null values
            sortDescFirst: false, // Start with ascending order (A to Z)
            Cell: ({ cell }) => <span>{cell.getValue() != null ? formatSalaryNum(cell.getValue()) : '-'}</span>,
            muiEditTextFieldProps: ({ cell, row, table }) => ({
                type: 'number',
                onBlur: async (event) => {
                    const value = Number(event.target.value);
                    const max = Number(row.original.max_salary);
                    if (value > max && max !== 0) {
                        message.error('Minimum salary cannot be greater than maximum salary');
                        return;
                    }
                    if (value !== row.original.min_salary) {
                        try {
                            await api.patch(`/lead-generation/job/${row.original.id}`, { min_salary: value });
                            message.success('Updated');
                            refetchJobs();
                        } catch (e) {
                            message.error('Update failed');
                        }
                    }
                },
            }),
        },
        {
            header: 'Max Salary',
            id: 'max_salary', // Explicit id for sorting
            accessorKey: 'max_salary',
            size: 0.5,
            sortUndefined: 'last', // Handle undefined/null values
            sortDescFirst: false, // Start with ascending order (A to Z)
            Cell: ({ cell }) => <span>{cell.getValue() != null ? formatSalaryNum(cell.getValue()) : '-'}</span>,
            muiEditTextFieldProps: ({ cell, row, table }) => ({
                type: 'number',
                onBlur: async (event) => {
                    const value = Number(event.target.value);
                    const min = Number(row.original.min_salary);
                    if (value < min) {
                        message.error('Maximum salary cannot be less than minimum salary');
                        return;
                    }
                    if (value !== row.original.max_salary) {
                        try {
                            await api.patch(`/lead-generation/job/${row.original.id}`, { max_salary: value });
                            message.success('Updated');
                            refetchJobs();
                        } catch (e) {
                            message.error('Update failed');
                        }
                    }
                },
            }),
        },
        {
            header: 'Currency',
            id: 'currency', // Explicit id for sorting
            accessorKey: 'currency',
            size: 0.5,
            sortUndefined: 'last', // Handle undefined/null values
            sortDescFirst: false, // Start with ascending order (A to Z)
            Edit: ({ cell, row, table }) => {
                const [value, setValue] = React.useState(cell.getValue());
                return (
                    <Select
                        className='antd-input dropdown'
                        value={value}
                        options={currencyOptions}
                        onChange={(newValue) => {
                            setValue(newValue);
                            api.patch(`/lead-generation/job/${row.original.id}`, { currency: newValue })
                                .then(() => {
                                    message.success('Updated');
                                    refetchJobs();
                                    table.setEditingCell(null);
                                })
                                .catch(() => message.error('Update failed'));
                        }}
                        style={{ width: '100%' }}
                        autoFocus
                        popupMatchSelectWidth={false}
                    />
                );
            },
        },
        {
            header: 'Payment Term',
            id: 'payment_term', // Explicit id for sorting
            accessorKey: 'payment_term',
            size: 0.5,
            sortUndefined: 'last', // Handle undefined/null values
            sortDescFirst: false, // Start with ascending order (A to Z)
            Edit: ({ cell, row, table }) => {
                const [value, setValue] = React.useState(cell.getValue());
                return (
                    <Select
                        className='antd-input dropdown'
                        value={value}
                        options={paymentTermOptions}
                        onChange={(newValue) => {
                            setValue(newValue);
                            api.patch(`/lead-generation/job/${row.original.id}`, { payment_term: newValue })
                                .then(() => {
                                    message.success('Updated');
                                    refetchJobs();
                                    table.setEditingCell(null);
                                })
                                .catch(() => message.error('Update failed'));
                        }}
                        style={{ width: '100%' }}
                        autoFocus
                        popupMatchSelectWidth={false}
                    />
                );
            },
        },
        {
            header: 'Gender',
            id: 'gender_preference', // Explicit id for sorting
            accessorKey: 'gender_preference',
            size: 0.5,
            sortUndefined: 'last', // Handle undefined/null values
            sortDescFirst: false, // Start with ascending order (A to Z)
            Edit: ({ cell, row, table }) => {
                const [value, setValue] = React.useState(cell.getValue());
                return (
                    <Select
                        className='antd-input dropdown'
                        value={value}
                        options={genderOptions}
                        onChange={(newValue) => {
                            setValue(newValue);
                            api.patch(`/lead-generation/job/${row.original.id}`, { gender_preference: newValue })
                                .then(() => {
                                    message.success('Updated');
                                    refetchJobs();
                                    table.setEditingCell(null);
                                })
                                .catch(() => message.error('Update failed'));
                        }}
                        style={{ width: '100%' }}
                        autoFocus
                        popupMatchSelectWidth={false}
                    />
                );
            },
        },
        {
            header: 'Job Description',
            id: 'job_description', // Explicit id for sorting
            accessorKey: 'job_description',
            size: 1,
            sortUndefined: 'last', // Handle undefined/null values
            sortDescFirst: false, // Start with ascending order (A to Z)
            Cell: ({ cell, row }) => (
                <>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200, display: 'inline-block', verticalAlign: 'middle' }}>
                        {cell.getValue() ? cell.getValue().slice(0, 40) + (cell.getValue().length > 40 ? '...' : '') : '-'}
                    </span>
                    <Button
                        size="small"
                        style={{ marginLeft: 8 }}
                        disabled={isReadOnlyLead}
                        onClick={() => {
                            if (isReadOnlyLead) return;
                            setDescEditValue(cell.getValue() || '');
                            setDescEditRow(row.original);
                            setDescModalOpen(true);
                        }}
                    >Edit</Button>
                </>
            ),
        },
        // Delete column - only for admin and sales_manager
        ...(canDeleteJob
            ? [
                {
                    header: 'Delete',
                    id: 'delete',
                    enableSorting: false,
                    enableEditing: false,
                    size: 0.4,
                    Cell: ({ row }) => (
                        <DeleteOutlined size="1em" className="app-icon"
                            style={{ cursor: 'pointer', color: '#ff4d4f', fontSize: '16px' }}
                            onClick={() => handleDeleteJob(row.original)}
                        />
                    ),
                },
            ]
            : []),
        ...(isSuperAdmin(user?.user_type) ? [{
            ...createStatusHistoryColumn({ header: 'Status History', buttonTitle: 'View job history',
                accessorKey: 'website_job_history', onOpenHistory: setHistoryJob }),
            enableEditing: false, enableColumnFilter: false,
        }] : []),
    ], [id, user?.user_type, navigate, isReadOnlyLead, canDeleteJob]);

    const table = useMaterialReactTable({
        columns,
        data: jobs,
        enableEditing: !isReadOnlyLead,
        editDisplayMode: 'cell',
        muiTableBodyCellProps: ({ cell, column, table }) => ({
            onClick: () => {
                if (column.id !== 'job_title' && !isReadOnlyLead) {
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
            style: { cursor: column.id !== 'job_title' && !isReadOnlyLead ? 'pointer' : undefined },
        }),
        layoutMode: 'semantic',
        enableStickyFooter: true,
        enableStickyHeader: true,
        enableRowNumbers: true,
        enableColumnActions: false,
        muiTableHeadCellProps: {
            sx: {
                fontSize: '12px',
                padding: '4px 8px',
            },
        },
        muiTableBodyCellProps: undefined, // overridden above
        muiTopToolbarProps: {
            sx: {
                padding: '6px 12px',
                minHeight: '40px',
                backgroundColor: '#f5f5f5',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
                display: 'flex'
            },
        },
        renderTopToolbarCustomActions: () => (
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#3E6A9F' }}>
                Jobs 
            </div>
        ),
        muiTablePaperProps: {
            elevation: 0,
            sx: {
                marginTop: '10px',
                boxShadow: 'none',
                border: '1px solid #ddd',
                borderRadius: '8px',
            },
        },
        state: {
            pagination,
            globalFilter,
            sorting,
            isLoading: loadingJobs,
        },
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
        rowCount: jobsData?.count ?? 0,
        enableGlobalFilter: true,
    });

    return (
        <>
            <BreadCrumb goBack={goBack} linkText="Lead" />
            <div className="container">
             
                    
                        {isLoading ? <div className="py-6 text-center"><Spin /></div> : detailError
                            ? <Alert type="error" showIcon message={detailRequestError?.message || 'Could not load lead details.'} action={<Button onClick={() => refetchDetail()}>Retry</Button>} />
                            : <LeadCard lead={lead} leadType="Website Lead" refetchLeadDetail={refetchDetail} />}
                   
               
                <div className="row">
                    <div className="col-12 mt-2">
                        {!isReadOnlyLead && (
                            <button onClick={() => {
                                if (isReadOnlyLead) return;
                                navigate(getRolePath(user?.user_type, `/leads/${lead.id || id}/new-job`), { state: { identifier: lead.identifier } });
                            }} className='custom-button' disabled={isReadOnlyLead}>Add New Job</button>
                        )}
                        {jobsError && <Alert type="error" showIcon message={jobsRequestError?.message || 'Could not load lead jobs.'} action={<Button onClick={() => refetchJobs()}>Retry</Button>} />}
                        <MaterialReactTable table={table} />
                    </div>
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
                    onChange={e => setDescEditValue(e.target.value)}
                />
                <div style={{ textAlign: 'right', marginTop: 16 }}>
                    <Button onClick={() => setDescModalOpen(false)} style={{ marginRight: 8 }}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        loading={descLoading}
                        onClick={async () => {
                            setDescLoading(true);
                            try {
                                await api.patch(`/lead-generation/job/${descEditRow.id}`, { job_description: descEditValue });
                                message.success('Description updated');
                                refetchJobs();
                                setDescModalOpen(false);
                                setDescEditRow(null);
                                setDescEditValue('');
                            } catch (e) {
                                message.error('Update failed');
                            } finally {
                                setDescLoading(false);
                            }
                        }}
                    >
                        Save
                    </Button>
                </div>
            </Modal>

            {isSuperAdmin(user?.user_type) && <StatusHistoryModal
                open={historyJob != null}
                entity={historyJob}
                onClose={() => setHistoryJob(null)}
                fetchHistoryApi={getWebsiteLeadJobHistory}
                title={job => `Lead Job History - ${job?.job_title || 'Job'}`}
                getTitleFromEntity={job => job?.job_title || 'Job'}
                historyDateKey="changed_at"
                queryKeyPrefix={`websiteLeadJobHistory-${user?.id}-${user?.user_type}-${id}`}
                emptyMessage="No job history available."
            />}
            {deleteModal.visible && deleteModal.job && <DeleteJobDialog key={deleteModal.job.id}
                job={deleteModal.job}
                onClose={() => setDeleteModal({ visible: false, job: null })}
                onConfirm={handleConfirmDeleteJob}
            />}
        </>
    );
};

export default LeadDetailPage;

