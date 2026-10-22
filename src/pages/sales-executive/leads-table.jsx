import React, { useState, useMemo, useEffect } from 'react';
import NewTableComponent from '../../components/tables/new-table.jsx';
import { Modal, Button, message, Spin, Select } from 'antd';
import { Copy as CopyOutlined } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'react-query';
import { listDataEntry, updateDataEntryStatus } from '../shared/services/data-entry-service.js';
import formatDateUniversal from '../shared/utils/formatDate.js';
import '../../assets/styles/legacy/create-user.css';
import '../../assets/styles/legacy/leads.generated.css';
import BreadCrumb from '../../components/breadcrumb.component.jsx';

const statusOptions = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Converted', value: 'Converted' },
  { label: 'Contacted But No Response', value: 'Contacted But No Response' },
];

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
  const { data, isLoading, refetch } = useQuery(
    ['data-entry-list', pagination, sorting, globalFilter],
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
      header: 'Company Name',
      accessorKey: 'company_name',
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
            onGlobalFilterChange={setGlobalFilter}
            isLoading={isLoading}
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
