import { Select } from '../../../../components/ui/app-select.jsx';
import { Tabs, TabsList, TabsTrigger } from '../../../../components/ui/tabs.jsx';
import { useSearchParams } from 'react-router-dom';
import { selectedCompany } from '../../../shared/utils/company-filter.js';
import { Button, Spin } from '../../../../components/ui/app-controls.jsx';
import React, { useMemo, useState, useCallback } from 'react';
import { Alert } from 'antd';
import { LoaderCircle as LoadingOutlined, Eye } from 'lucide-react';
import ActivityDetailModal from '../../../../components/activity-detail-modal.jsx';
import { useQuery } from 'react-query';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../../../../components/bootstrap-date-range-modal.component.jsx';
import LeadDateRangeField from '../../../../components/lead-date-range-field.jsx';
import '../../../../assets/styles/lead-listing-filters.css';
import NewTableComponent from '../../../../components/tables/new-table.jsx';
import formatDateUniversal from '../../../shared/utils/formatDate.js';
import { getAccountsAllUsers, getHistoryModelNames } from '../../../shared/services/admin-graphs.js';
import api from '../../../shared/services/api.js';
import useUserStore from '../../../shared/store/user-store.js';
import { isSuperAdmin } from '../../../auth/role-access.js';
import '../../../../assets/styles/legacy/table-client-actions.css';


export async function getAuditHistoryList({ page = 1, size = 10, filterBy = 'system_activity', sortBy = 'changed_at', order = 'desc', search, modelName, changedBy, startDate, endDate } = {}) {
  const params = { page, size, filter_by: filterBy };
  if (sortBy) params.sort_by = sortBy;
  if (order) params.order = order;
  if (search?.trim()) params.search = search.trim();
  if (modelName) params.model_name = modelName;
  if (changedBy?.length) params.changed_by = changedBy.join(',');
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const { data } = await api.get('/activity/grouped-list', { params });
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not load user activity.');
  if (!Array.isArray(data?.results)) throw new Error('Could not read the user activity list.');
  return data;
}

export function getActivityChanges(row) {
  const changes = row?.fields ?? row?.changes ?? row?.change;
  if (Array.isArray(changes)) return changes;
  if (changes && typeof changes === 'object') {
    if ('field' in changes || 'field_name' in changes) return [changes];
    return Object.entries(changes).map(([field, values]) => ({ field, ...(values && typeof values === 'object' ? values : { new: values }) }));
  }
  return [{ field: row?.field_name, old: row?.old_value, new: row?.new_value }];
}

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

const SORT_FIELD_MAP = {
  id: 'id',
  name: 'changed_by_name',
  email: 'changed_by_email',
  new_value: 'new_value',
  old_value: 'old_value',
  field_name: 'field_name',
  category: 'model_name',
  date: 'changed_at',
  duration: 'changed_at',
};

const resolveSortField = (sorting) => {
  const columnId = sorting?.[0]?.id;
  if (!columnId) return 'changed_at';
  return SORT_FIELD_MAP[columnId] || columnId;
};

const getCurrentMonthRange = () => [dayjs().startOf('month'), dayjs().endOf('month')];

export default function AuditHistoryListPage() {
  const { user } = useUserStore();
  const [selectedChangeId, setSelectedChangeId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const activityTab = searchParams.get('activity_tab') === 'user_accounts_activity' ? 'user_accounts_activity' : 'system_activity';
  const companyId = selectedCompany(searchParams.toString());
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([{ id: 'changed_at', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [modelNameFilter, setModelNameFilter] = useState('');
  const [changedByFilter, setChangedByFilter] = useState([]);
  const [dateRangeFilter, setDateRangeFilter] = useState(() => ['super_admin', 'company_admin'].includes(user?.user_type) ? null : getCurrentMonthRange());
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [filterCompanyId, setFilterCompanyId] = useState(companyId);
  if (filterCompanyId !== companyId) {
    setFilterCompanyId(companyId);
    if (isSuperAdmin(user?.user_type)) {
      setModelNameFilter('');
      setChangedByFilter([]);
      setPagination(previous => ({ ...previous, pageIndex: 0 }));
    }
  }
  const sortBy = resolveSortField(sorting);
  const sortOrder = sorting?.[0]?.desc ? 'desc' : 'asc';

  const handleGlobalFilterChange = useCallback((value) => {
    setGlobalFilter(value ?? '');
    setPagination(previous => ({ ...previous, pageIndex: 0 }));
  }, []);

  const { data: allUsers = [] } = useQuery(
    ['accountsAllUsers', user?.id, user?.user_type, companyId],
    () => getAccountsAllUsers(isSuperAdmin(user?.user_type) ? companyId : null),
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const { data: modelNames = [] } = useQuery(
    ['historyModelNames', user?.id, user?.user_type, companyId],
    () => getHistoryModelNames(),
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery(
    [
      'auditHistoryList',
      user?.id,
      user?.user_type,
      companyId,
      activityTab,
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
        filterBy: activityTab,
        sortBy,
        order: sortOrder,
        search: globalFilter,
        modelName: modelNameFilter,
        changedBy: changedByFilter,
        startDate: dateRangeFilter?.[0]?.format?.('YYYY-MM-DD'),
        endDate: dateRangeFilter?.[1]?.format?.('YYYY-MM-DD'),
      }),
    {
      keepPreviousData: false,
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
        enableSorting: false,
        size: 90,
        Cell: ({ row }) => {
          return <span>{pagination.pageIndex * pagination.pageSize + row.index + 1}</span>;
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
      ...[
        { header: 'Fields Changed', accessorKey: 'field_count', size: 120, enableSorting: false,
          Cell: ({ cell }) => <span>{formatCellValue(cell.getValue())}</span> },
        { header: 'Summary', accessorKey: 'summary', size: 420, enableSorting: false,
          Cell: ({ cell }) => <span className="whitespace-pre-wrap break-words leading-6">{formatCellValue(cell.getValue())}</span> },
      ],
      {
        header: 'Category',
        id: 'category',
        accessorKey: 'category',
        size: 180,
        Cell: ({ row }) => {
          const v = row.original?.category ?? row.original?.model_name;
          const label = formatFieldName(v);
          return <span>{label}</span>;
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
        header: 'Actions', id: 'actions', size: 90, enableSorting: false, enableColumnFilter: false,
        Cell: ({ row }) => <Button type="text" title="View activity details" aria-label="View activity details"
          className="bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800"
          icon={<Eye size={16} />} disabled={!row.original?.change_id}
          onClick={() => setSelectedChangeId(row.original.change_id)} />,
      },
    ],
    [pagination.pageIndex, pagination.pageSize]
  );

  return (
    <>
      {selectedChangeId && <ActivityDetailModal key={selectedChangeId} changeId={selectedChangeId} onClose={() => setSelectedChangeId(null)} />}
      {isError && <Alert type="error" showIcon message={error?.response?.data?.message || error?.message || 'Could not load user activity.'}
        action={<Button onClick={() => refetch()} loading={isFetching}>Retry</Button>} />}
      <div className="container">
        <Tabs value={activityTab} onValueChange={value => {
          setPagination(previous => ({ ...previous, pageIndex: 0 }));
          setModelNameFilter('');
          setSearchParams(previous => { const next = new URLSearchParams(previous); next.set('activity_tab', value); return next; }, { replace: true });
        }} className="mb-4">
          <TabsList aria-label="Activity type">
            <TabsTrigger value="system_activity">System Activity</TabsTrigger>
            <TabsTrigger value="user_accounts_activity">User Accounts Activity</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="user-activity-filters mb-3 grid min-w-0 grid-cols-1 items-end gap-3 md:grid-cols-2">
          <div className="order-1 min-w-0">
          <Select
            className="user-activity-filter-select"
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
          </div>
          <div className="order-3 min-w-0 md:col-span-2">
          <Select
            className="user-activity-filter-select"
            placeholder="Filter by changed by user"
            value={changedByFilter[0] ?? ''}
            onChange={(value) => {
              setChangedByFilter(value == null || value === '' ? [] : [String(value)]);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            options={usersDropdownOptions}
            showSearch
            optionFilterProp="label"
            dropdownMatchSelectWidth
            dropdownStyle={{ maxWidth: 'calc(100vw - 32px)' }}
            style={{ width: 520, minWidth: 0, maxWidth: '100%' }}
            allowClear
          />
          </div>
          <div className="lead-filter-toolbar order-2 min-w-0 md:justify-self-end" style={{ margin: 0 }}>
          <LeadDateRangeField hasValue={Boolean(dateRangeFilter)} onClear={() => {
            setDateRangeFilter(null);
            setPagination(previous => ({ ...previous, pageIndex: 0 }));
          }}>
          <BootstrapDateRangeModal
            value={dateRangeFilter}
            onChange={() => {}}
            showModal={showDateRangeModal}
            setShowModal={setShowDateRangeModal}
            onDone={(range) => {
              setDateRangeFilter(range);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          />
          </LeadDateRangeField>
          </div>
          <div className="order-4 flex justify-end md:col-span-2">
            <Button className="user-activity-clear-filters" onClick={clearFilters}>Clear Filters</Button>
          </div>
        </div>
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
              heading={`${activityTab === 'system_activity' ? 'System Activity' : 'User Accounts Activity'} (${totalCount})`}
            />
          )}
        </div>
      </div>
    </>
  );
}
