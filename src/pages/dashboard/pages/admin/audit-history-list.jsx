import React, { useMemo, useState, useCallback } from 'react';
import { Button, Select, Spin } from 'antd';
import { LoaderCircle as LoadingOutlined } from 'lucide-react';
import { useQuery } from 'react-query';
import dayjs from 'dayjs';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import BootstrapDateRangeModal from '../../../../components/bootstrap-date-range-modal.component.jsx';
import NewTableComponent from '../../../../components/tables/new-table.jsx';
import formatDateUniversal from '../../../shared/utils/formatDate.js';
import { getAccountsAllUsers, getAuditHistoryList, getHistoryModelNames } from '../../../shared/services/admin-graphs.js';
import '../../../../assets/styles/legacy/table-client-actions.css';

const THEME_PRIMARY = '#3E6A9F';

const formatCellValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return String(value);
    }
  }
  return String(value);
};

const formatFieldName = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDurationFromDate = (value) => {
  if (!value) return '-';
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return '-';

  const diffMs = Date.now() - ts;
  const absMs = Math.abs(diffMs);

  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (absMs < minuteMs) return 'just now';

  const makeLabel = (count, unit) => `${count} ${unit}${count === 1 ? '' : 's'} ago`;

  if (absMs < hourMs) return makeLabel(Math.floor(absMs / minuteMs), 'min');
  if (absMs < dayMs) return makeLabel(Math.floor(absMs / hourMs), 'hour');
  return makeLabel(Math.floor(absMs / dayMs), 'day');
};

const getActivityLinkPath = (row) => {
  const objectId = row?.object_id ?? row?.id;
  if (!objectId) return null;
  const leadId =
    row?.lead_id ??
    row?.lead ??
    row?.leadId ??
    row?.parent_id ??
    row?.parentId ??
    row?.source_id ??
    row?.sourceId ??
    null;

  const modelName = String(row?.model_name || '').toLowerCase();
  const category = String(row?.category || '').toLowerCase();
  const lookup = `${modelName} ${category}`;

  switch (true) {
    case /sales data|dataentry/.test(lookup):
      return `/admin/sales-data-detail/${objectId}`;
    case /website lead job|leadgenerationrequestjob/.test(lookup):
      return `/admin/lead-job-detail/${objectId}?source=website${leadId ? `&leadId=${leadId}` : ''}`;
    case /meta lead job|metaleadjob/.test(lookup):
      return `/admin/lead-job-detail/${objectId}?source=meta${leadId ? `&leadId=${leadId}` : ''}`;
    case /data lead job|dataleadjob/.test(lookup):
      return `/admin/lead-job-detail/${objectId}?source=data${leadId ? `&leadId=${leadId}` : ''}`;
    case /website lead|leadgenerationrequest/.test(lookup):
      return `/admin/leads/${objectId}`;
    case /meta lead|metalead/.test(lookup):
      return `/admin/meta-leads/${objectId}`;
    case /data lead|datalead/.test(lookup):
      return `/data-lead/${objectId}`;
    case /client job/.test(lookup):
      return `/job-headhunting/${objectId}`;
    case /project|headhuntingproject|client project/.test(lookup):
      return `/project-listing-page/${objectId}`;
    case /client|headhuntingclient/.test(lookup):
      return `/client-head-hunting/${objectId}`;
    case /job|headhuntingjob/.test(lookup):
      return `/job-headhunting/${objectId}`;
    default:
      return null;
  }
};

const SORT_FIELD_MAP = {
  id: 'id',
  name: 'changed_by_name',
  email: 'changed_by_email',
  new_value: 'new_value',
  old_value: 'old_value',
  field_name: 'field_name',
  category: 'category',
  date: 'date',
  duration: 'changed_at',
};

const resolveSortField = (sorting) => {
  const columnId = sorting?.[0]?.id;
  if (!columnId) return 'changed_at';
  return SORT_FIELD_MAP[columnId] || columnId;
};

const getCurrentMonthRange = () => [dayjs().startOf('month'), dayjs().endOf('month')];

export default function AuditHistoryListPage() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([{ id: 'changed_at', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [modelNameFilter, setModelNameFilter] = useState('');
  const [changedByFilter, setChangedByFilter] = useState([]);
  const [dateRangeFilter, setDateRangeFilter] = useState(getCurrentMonthRange);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({});
  const sortBy = resolveSortField(sorting);
  const sortOrder = sorting?.[0]?.desc ? 'desc' : 'asc';

  const handleGlobalFilterChange = useCallback((value) => {
    setGlobalFilter(value ?? '');
  }, []);

  const { data: allUsers = [] } = useQuery(
    ['accountsAllUsers'],
    () => getAccountsAllUsers(),
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const { data: modelNames = [] } = useQuery(
    ['historyModelNames'],
    () => getHistoryModelNames(),
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const { data, isLoading, isFetching } = useQuery(
    [
      'auditHistoryList',
      pagination.pageIndex,
      pagination.pageSize,
      sortBy,
      sortOrder,
      globalFilter,
      modelNameFilter,
      changedByFilter.join(','),
      dateRangeFilter?.[0]?.format?.('YYYY-MM-DD') ?? '',
      dateRangeFilter?.[1]?.format?.('YYYY-MM-DD') ?? '',
    ],
    () =>
      getAuditHistoryList({
        page: pagination.pageIndex + 1,
        size: pagination.pageSize,
        sortBy,
        order: sortOrder,
        search: globalFilter,
        modelName: modelNameFilter,
        changedBy: changedByFilter,
        startDate: dateRangeFilter?.[0]?.format?.('YYYY-MM-DD'),
        endDate: dateRangeFilter?.[1]?.format?.('YYYY-MM-DD'),
      }),
    {
      keepPreviousData: true,
      staleTime: 0,
      refetchOnWindowFocus: false,
    }
  );

  const totalCount = data?.count ?? 0;
  const rows = Array.isArray(data?.results) ? data.results : [];
  const usersDropdownOptions = useMemo(
    () =>
      (Array.isArray(allUsers) ? allUsers : []).map((user) => ({
        value: String(user?.id ?? ''),
        label:
          user?.combined ||
          (user?.name && user?.user_type ? `${user.name} (${String(user.user_type).replace(/_/g, ' ')})` : null) ||
          user?.name ||
          user?.email ||
          `User ${user?.id}`,
      })),
    [allUsers]
  );
  const modelNameDropdownOptions = useMemo(
    () =>
      (Array.isArray(modelNames) ? modelNames : [])
        .filter((name) => name !== null && name !== undefined && String(name).trim() !== '')
        .map((name) => ({
          value: String(name),
          label: String(name),
        })),
    [modelNames]
  );
  const selectedUserPills = useMemo(() => {
    if (!Array.isArray(changedByFilter) || changedByFilter.length === 0) return [];
    const byId = new Map(usersDropdownOptions.map((opt) => [String(opt.value), opt.label]));
    return changedByFilter.map((id) => ({
      id: String(id),
      label: byId.get(String(id)) || `User ${id}`,
    }));
  }, [changedByFilter, usersDropdownOptions]);

  const clearFilters = () => {
    setGlobalFilter('');
    setModelNameFilter('');
    setChangedByFilter([]);
    setDateRangeFilter(null);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const columns = useMemo(
    () => [
      {
        header: 'ID',
        id: 'id',
        accessorKey: 'id',
        size: 90,
        Cell: ({ row }) => {
          const v = row.original?.id ?? row.original?.change_id ?? row.original?.object_id;
          return <span>{formatCellValue(v)}</span>;
        },
      },
      {
        header: 'Name',
        id: 'name',
        accessorKey: 'name',
        size: 180,
        Cell: ({ row }) => {
          const v = row.original?.name ?? row.original?.changed_by_name;
          return <span>{formatCellValue(v)}</span>;
        },
      },
      {
        header: 'Email',
        id: 'email',
        accessorKey: 'email',
        size: 230,
        Cell: ({ row }) => {
          const v = row.original?.email ?? row.original?.changed_by_email;
          return <span>{formatCellValue(v)}</span>;
        },
      },
      {
        header: 'New Value',
        id: 'new_value',
        accessorKey: 'new_value',
        size: 200,
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Old Value',
        id: 'old_value',
        accessorKey: 'old_value',
        size: 200,
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Field',
        id: 'field_name',
        accessorKey: 'field_name',
        size: 180,
        Cell: ({ row }) => {
          const v = row.original?.field_name;
          return <span>{formatFieldName(v)}</span>;
        },
      },
      {
        header: 'Category',
        id: 'category',
        accessorKey: 'category',
        size: 180,
        Cell: ({ row }) => {
          const v = row.original?.category ?? row.original?.field_name ?? row.original?.model_name;
          const href = getActivityLinkPath(row.original);
          const label = formatFieldName(v);

          if (!href) return <span>{label}</span>;

          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: THEME_PRIMARY, textDecoration: 'underline' }}
            >
              {label}
            </a>
          );
        },
      },
      {
        header: 'Date',
        id: 'date',
        accessorKey: 'date',
        size: 180,
        Cell: ({ row }) => {
          const value = row.original?.date ?? row.original?.changed_at;
          return <span>{value ? formatDateUniversal(value, true) : '-'}</span>;
        },
      },
      {
        header: 'Duration',
        id: 'duration',
        accessorKey: 'duration',
        size: 120,
        Cell: ({ row }) => {
          const value = row.original?.date ?? row.original?.changed_at;
          return <span>{formatDurationFromDate(value)}</span>;
        },
      },
    ],
    []
  );

  return (
    <>
      <BreadCrumb linkText="User Activity" />
      <div className="container">
        <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <Select
            placeholder="Filter by Category"
            value={modelNameFilter || undefined}
            onChange={(value) => {
              setModelNameFilter(value ? String(value) : '');
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            options={modelNameDropdownOptions}
            showSearch
            optionFilterProp="label"
            style={{ width: 'fit-content', minWidth: 240, maxWidth: '100%' }}
            allowClear
          />
          <Select
            placeholder="Filter by changed by user"
            mode="multiple"
            value={changedByFilter}
            onChange={(value) => {
              setChangedByFilter(Array.isArray(value) ? value.map((v) => String(v)) : []);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            options={usersDropdownOptions}
            showSearch
            optionFilterProp="label"
            maxTagCount={0}
            maxTagPlaceholder={() => null}
            dropdownMatchSelectWidth
            dropdownStyle={{ minWidth: 520 }}
            style={{ width: 520, minWidth: 520, maxWidth: '100%' }}
            allowClear
          />
          <BootstrapDateRangeModal
            value={dateRangeFilter}
            onChange={() => {}}
            showModal={showDateRangeModal}
            setShowModal={setShowDateRangeModal}
            onDone={(range) => {
              setDateRangeFilter(range);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            triggerStyle={{ border: '1px solid #d9d9d9', height: 32, display: 'inline-flex', alignItems: 'center' }}
          />
          <Button onClick={clearFilters}>Clear Filters</Button>
        </div>
        {selectedUserPills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {selectedUserPills.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => {
                  setChangedByFilter((prev) => prev.filter((id) => String(id) !== pill.id));
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                style={{
                  border: '1px solid #d9d9d9',
                  background: '#f5f5f5',
                  borderRadius: 999,
                  padding: '2px 8px',
                  fontSize: 12,
                  lineHeight: '18px',
                  cursor: 'pointer',
                }}
                title="Remove filter"
              >
                {pill.label} x
              </button>
            ))}
          </div>
        )}
        <div className="table-container">
          {isLoading ? (
            <div className="sop-branded-spin-wrap">
              <Spin
                size="large"
                indicator={<LoadingOutlined size="1em" className={["app-icon app-icon-spin", "sop-branded-spin-icon"].filter(Boolean).join(' ')}  aria-hidden />}
              />
              <p className="sop-branded-spin-text">Loading user activity...</p>
            </div>
          ) : (
            <NewTableComponent
              totalCount={totalCount}
              columns={columns}
              data={rows}
              denseCells
              muiTableContainerProps={{ sx: { width: 'fit-content', maxWidth: '100%' } }}
              pagination={pagination}
              onPaginationChange={setPagination}
              sorting={sorting}
              onSortingChange={setSorting}
              globalFilter={globalFilter}
              onGlobalFilterChange={handleGlobalFilterChange}
              isLoading={isFetching}
              enableRowSelection={false}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={setColumnVisibility}
              heading={`User Activity (${totalCount})`}
            />
          )}
        </div>
      </div>
    </>
  );
}
