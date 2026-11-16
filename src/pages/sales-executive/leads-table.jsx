import { Button } from '../../components/ui/app-controls.jsx';
import React, { useState, useMemo, useEffect } from 'react';
import NewTableComponent from '../../components/tables/new-table.jsx';
import { Avatar, Alert } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../shared/services/api.js';
import useUserStore from '../shared/store/user-store.js';
import formatDateUniversal from '../shared/utils/formatDate.js';
import '../../assets/styles/legacy/create-user.css';
import '../../assets/styles/legacy/leads.generated.css';

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
  { header: 'Added By', accessorKey: 'added_by_name' },
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
  // Sync all state to URL params
  useEffect(() => {
    const newParams = {};
    
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
  }, [globalFilter, pagination.pageIndex, pagination.pageSize, sorting]);

  // Fetch dynamic data
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery(
    ['data-entry-list', user?.id, user?.user_type, pagination, sorting, globalFilter],
    async () => {
      const params = {
        page: pagination.pageIndex + 1,
        size: pagination.pageSize,
        search: globalFilter,
        sort_by: sorting?.[0]?.id || '',
        order: sorting?.[0]?.desc ? 'desc' : 'asc',
      };
      return await listDataEntry(params);
    },
    { keepPreviousData: true }
  );


  const columns = useMemo(() => [
    {
      header: '#',
      id: 'row_number',
      size: 60,
      enableSorting: false,
      Cell: ({ row }) => pagination.pageIndex * pagination.pageSize + row.index + 1,
    },
    {
      header: 'Representative Name',
      accessorKey: 'representative_name',
      size: 260,
      Cell: ({ cell, row }) => (
        <div className="flex items-center gap-3">
          <Avatar size={40} style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', flexShrink: 0 }} aria-hidden="true">
            {Array.from(String(cell.getValue() || '').trim())[0]?.toUpperCase() || '?'}
          </Avatar>
          <div className="min-w-0">
            <div className="font-medium">{cell.getValue() || '-'}</div>
            <div className="break-all text-xs text-muted-foreground">{row.original.email || '-'}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Company Name',
      accessorKey: 'company_name',
      size: 260,
      Cell: ({ cell, row }) => (
        <span
          className="cursor-pointer"
          style={{ textDecoration: 'underline', color: '#3E6A9F' }}
          onClick={() => navigate(`/data-entry/edit/${row.original.id}`)}
        >
          {cell.getValue()}
        </span>
      ),
    },
    ...baseColumns.filter(col => !['company_name', 'representative_name', 'email'].includes(col.accessorKey)),
  ], [navigate, pagination.pageIndex, pagination.pageSize]);

  return (
    <>
    {isError && <Alert type="error" showIcon message={error?.response?.data?.message || error?.message || 'Could not load sales data.'}
      action={<Button loading={isFetching} onClick={() => refetch()}>Retry</Button>} />}
    <div className="container ">
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
