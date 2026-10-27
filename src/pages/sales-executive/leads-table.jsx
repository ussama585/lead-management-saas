import { message } from '../../components/ui/notifications.jsx';
import { Button } from '../../components/ui/app-controls.jsx';
import React, { useState, useMemo, useEffect } from 'react';
import NewTableComponent from '../../components/tables/new-table.jsx';
import { Avatar, Alert } from 'antd';
import { Copy as CopyOutlined } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../shared/services/api.js';
import useUserStore from '../shared/store/user-store.js';
import formatDateUniversal from '../shared/utils/formatDate.js';
import '../../assets/styles/legacy/create-user.css';
import '../../assets/styles/legacy/leads.generated.css';
import BreadCrumb from '../../components/breadcrumb.component.jsx';
import StatusFilterTabs from '../../components/status-filter-tabs.jsx';

export async function getDataEntryCounts() {
  const { data } = await api.get('/data-entry/list-count');
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not load counts.');
  if (!data || !['all', 'assigned', 'unassigned'].every(key => Number.isFinite(Number(data[key])))) throw new Error('Could not read sales data counts.');
  return data;
}

export async function listDataEntry(params = {}) {
  const { data } = await api.get('/data-entry/list', { params });
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not load sales data.');
  if (!Array.isArray(data?.results)) throw new Error('Could not read the sales data list.');
  return data;
}

const baseColumns = [
  { header: 'Representative Name', accessorKey: 'representative_name' },
  { header: 'Designation', accessorKey: 'designation' },
  { header: 'Company Name', accessorKey: 'company_name' },
  { header: 'Industry/Sector', accessorKey: 'industry_sector' },
  { header: 'Phone', accessorKey: 'phone' },
  { header: 'Email', accessorKey: 'email' },
  { header: 'City', accessorKey: 'city' },
  { header: 'Country', accessorKey: 'country' },
  { header: 'Company Address', accessorKey: 'company_address' },
  { header: 'Company Website', accessorKey: 'company_website' },
  { header: 'Company Social Media', accessorKey: 'company_social_link' },
  { header: 'Data Acquired Through', accessorKey: 'acquired_through' },
  { header: 'Status', accessorKey: 'status' },
  { header: 'Added By', accessorKey: 'added_by_name' },
  { header: 'Assigned To', accessorKey: 'assigned_to_name' },
  { 
    header: 'Date', 
    accessorKey: 'created_at',
    Cell: ({ cell }) => (
      <span style={{ whiteSpace: 'nowrap' }}>
        {cell.getValue() ? formatDateUniversal(cell.getValue(), false) : '-'}
      </span>
    ),
  },
];

// Function to copy row data to clipboard
const copyRowToClipboard = (row) => {
  // Create a string representation of the row (CSV style)
  const rowString = Object.values(row).join(', ');
  navigator.clipboard.writeText(rowString)
    .then(() => message.success('Row copied to clipboard!'))
    .catch(() => message.error('Failed to copy row.'));
};

const LeadsTable = () => {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial values from URL params
  const initialSearchFromUrl = searchParams.get("search") || "";
  const initialPageIndexFromUrl = parseInt(searchParams.get("page")) || 0;
  const initialPageSizeFromUrl = parseInt(searchParams.get("pageSize")) || 10;
  const initialSortFieldFromUrl = searchParams.get("sortBy");
  const initialSortOrderFromUrl = searchParams.get("sortOrder");

  // Table state for dynamic features - initialize from URL params
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
  const [scope, setScope] = useState(() => {
    const tab = searchParams.get('tab');
    return tab === 'all' ? '' : tab === 'unassigned' ? 'unassigned' : 'assigned';
  });
  const counts = useQuery(['data-entry-list-count', user?.id, user?.user_type], getDataEntryCounts, { refetchOnWindowFocus: false });

  // Sync all state to URL params
  useEffect(() => {
    const newParams = {};
    if (scope !== 'assigned') newParams.tab = scope || 'all';
    
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
  }, [globalFilter, pagination.pageIndex, pagination.pageSize, sorting, scope]);

  // Fetch dynamic data
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery(
    ['data-entry-list', user?.id, user?.user_type, pagination, sorting, globalFilter, scope],
    async () => {
      const params = {
        page: pagination.pageIndex + 1,
        size: pagination.pageSize,
        search: globalFilter,
        sort_by: sorting?.[0]?.id || '',
        order: sorting?.[0]?.desc ? 'desc' : 'asc',
      };
      if (scope) params.assigned = scope === 'assigned';
      return await listDataEntry(params);
    },
    { keepPreviousData: true }
  );


  const columns = useMemo(() => [
    {
      header: 'Company Name',
      accessorKey: 'company_name',
      size: 260,
      Cell: ({ cell, row }) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar size={40} style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', flexShrink: 0 }} aria-hidden='true'>
            {Array.from(String(cell.getValue() || '').trim())[0]?.toUpperCase() || '?'}
          </Avatar>
        <span
          className="cursor-pointer"
          style={{ textDecoration: 'underline', color: '#3E6A9F' }}
          onClick={() => navigate(`/data-entry/edit/${row.original.id}`)}
        >
          {cell.getValue()}
        </span>
        </span>
      ),
    },
    ...baseColumns.filter(col => col.header !== 'Company Name'),
    {
      header: 'Copy',
      id: 'copy',
      Cell: ({ row }) => (
        <Button
          type="text"
          size="small"
          icon={<CopyOutlined size="1em" className="app-icon" />}
          onClick={() => copyRowToClipboard(row.original)}
          style={{ padding: '2px', minWidth: 'auto' }}
        >
          Copy
        </Button>
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
  ], [refetch, navigate]);

  return (
    <>
    <BreadCrumb linkText="Sales Data"  />
    {isError && <Alert type="error" showIcon message={error?.response?.data?.message || error?.message || 'Could not load sales data.'}
      action={<Button loading={isFetching} onClick={() => refetch()}>Retry</Button>} />}
    <div className="container ">
      <StatusFilterTabs statusFilter={scope} setStatusFilter={value => {
        setScope(previous => typeof value === 'function' ? value(previous) : value);
        setPagination(previous => ({ ...previous, pageIndex: 0 }));
      }} statusChoices={[
        { label: 'Assigned', value: 'assigned', apiKey: 'assigned' },
        { label: 'Unassigned', value: 'unassigned', apiKey: 'unassigned' },
      ]} getTotalCount={() => counts.data?.all ?? (counts.isLoading ? '…' : '-')}
        getStatusCount={key => counts.data?.[key] ?? (counts.isLoading ? '…' : '-')}
        statusColors={{ assigned: '#3e6a9f', unassigned: '#fa8c16' }} />
      {counts.isError && <Alert type="error" showIcon message={counts.error?.message || 'Could not load counts.'}
        action={<Button loading={counts.isFetching} onClick={() => counts.refetch()}>Retry</Button>} />}
      <div className="" style={{ marginTop: 24, marginBottom: 24 }}>
        
        <div style={{ marginTop: 8 }}>
          <NewTableComponent
            totalCount={data?.count || 0}
            columns={columns}
            data={(data?.results || []).map(row => {
              const newRow = { ...row };
              columns.forEach(col => {
                const val = newRow[col.accessorKey];
                if (val === undefined || val === null || val === "") {
                  newRow[col.accessorKey] = "-";
                }
              });
              return newRow;
            })}
            pagination={pagination}
            onPaginationChange={setPagination}
            onPageSizeChange={() => {}}
            sorting={sorting}
            onSortingChange={setSorting}
            globalFilter={globalFilter}
            onGlobalFilterChange={value => { setGlobalFilter(value); setPagination(previous => ({ ...previous, pageIndex: 0 })); }}
            isLoading={isLoading || isFetching}
            enableRowSelection={false}
            heading={`Sales Data (${data?.count || 0})`}
          />
        </div>
      </div>
    </div>
    </>
  );
};

export default LeadsTable; 
