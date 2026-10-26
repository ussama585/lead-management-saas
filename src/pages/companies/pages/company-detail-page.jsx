import React, { useState } from 'react';
import { Alert, Avatar, Button, Card, Descriptions, Input, Space, Spin, Table, Tag } from 'antd';
import { useQuery } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';
import BreadCrumb from '../../../components/breadcrumb.component.jsx';
import api from '../../shared/services/api.js';
import useUserStore from '../../shared/store/user-store.js';
import { isSuperAdmin } from '../../auth/role-access.js';
import { companyError, getCompanyDetails } from './companies-page.jsx';
import formatDateUniversal from '../../shared/utils/formatDate.js';

export async function getCompanyUsers(companyId, { page = 1, pageSize = 10, search = '', sortBy, order = 'asc' } = {}) {
  const params = { page, size: pageSize };
  if (search.trim()) params.search = search.trim();
  if (sortBy) { params.sort_by = sortBy; params.order = order; }
  const { data } = await api.get(`/company/users/${encodeURIComponent(companyId)}`, { params });
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not load company users.');
  if (!Array.isArray(data?.results)) throw new Error('Could not read the company users list.');
  return data;
}

function CompanyDetail({ companyId }) {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState({});
  const enabled = isSuperAdmin(user?.user_type) && /^[1-9]\d*$/.test(companyId);
  const company = useQuery(['companyDetail', user?.id, user?.user_type, companyId], () => getCompanyDetails(companyId),
    { enabled, retry: 1, refetchOnWindowFocus: false });
  const users = useQuery(['companyUsers', user?.id, user?.user_type, companyId, pagination, search, sorting],
    () => getCompanyUsers(companyId, { page: pagination.current, pageSize: pagination.pageSize, search, ...sorting }),
    { enabled: enabled && !!company.data && !company.isError, retry: 1, keepPreviousData: true, refetchOnWindowFocus: false });
  const columns = [
    { title: 'Name', dataIndex: 'name', sorter: true, render: (name, row) => <Space>
      <Avatar size={40} src={row.profile_pic || undefined} style={{ flexShrink: 0, background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
        {Array.from(String(name || '').trim())[0]?.toUpperCase() || '?'}
      </Avatar><span>{name || '—'}</span>
    </Space> },
    { title: 'User type', dataIndex: 'user_type', render: value => String(value || '—').replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()) },
    { title: 'Email', dataIndex: 'email', render: value => value || '—' },
    { title: 'Phone', dataIndex: 'phone', render: value => value || '—' },
    { title: 'Status', dataIndex: 'is_active', render: value => value == null ? '—' : <Tag color={value ? 'green' : 'default'}>{value ? 'Active' : 'Inactive'}</Tag> },
  ];
  return <div className="min-w-0 max-w-full space-y-4">
    <BreadCrumb linkText="Company details" goBack={() => navigate('/super-admin/companies')} />
    {!enabled ? <Alert type="error" message="Invalid company." /> : company.isLoading ? <div className="py-6 text-center"><Spin /></div>
      : company.isError ? <Alert type="error" showIcon message={companyError(company.error)} action={<Button onClick={() => company.refetch()}>Retry</Button>} />
      : company.data && <>
        <Card title={<Space><Avatar size={40} style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>{Array.from(company.data.name.trim())[0]?.toUpperCase() || '?'}</Avatar>{company.data.name}</Space>}>
          <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }} size="small" items={[
            { key: 'id', label: 'Company ID', children: company.data.id },
            { key: 'status', label: 'Status', children: <Tag color={company.data.is_active ? 'green' : 'default'}>{company.data.is_active ? 'Active' : 'Inactive'}</Tag> },
            ...Object.entries({ email: 'Email', phone: 'Phone', website: 'Website', address: 'Address', city: 'City', country: 'Country' }).map(([field, label]) => ({
              key: field, label, children: <span className="break-all">{company.data[field] || '—'}</span>,
            })),
            { key: 'created_at', label: 'Created', children: company.data.created_at ? formatDateUniversal(company.data.created_at, true) : '—' },
          ]} />
        </Card>
        <section aria-label="Company users" className="min-w-0">
          <h2 className="mb-3 text-lg font-semibold">Company users</h2>
          <Input.Search aria-label="Search company users" placeholder="Search users..." allowClear className="mb-4" style={{ maxWidth: 360 }}
            onSearch={value => { setSearch(value.trim()); setPagination(previous => ({ ...previous, current: 1 })); }} />
          {users.isError && <Alert className="mb-4" type="error" showIcon message={companyError(users.error)} action={<Button onClick={() => users.refetch()}>Retry</Button>} />}
          <div className="overflow-hidden rounded-lg border border-border">
            <Table rowKey="id" columns={columns} dataSource={users.isError ? [] : users.data?.results || []} loading={users.isFetching} scroll={{ x: 800 }}
              pagination={{ ...pagination, total: users.data?.count || 0, showSizeChanger: true, showTotal: total => `${total} users` }}
              onChange={(next, filters, sorter) => {
                const nextSorting = sorter.order ? { sortBy: sorter.field, order: sorter.order === 'descend' ? 'desc' : 'asc' } : {};
                const resetPage = next.pageSize !== pagination.pageSize || nextSorting.sortBy !== sorting.sortBy || nextSorting.order !== sorting.order;
                setPagination({ current: resetPage ? 1 : next.current, pageSize: next.pageSize });
                setSorting(nextSorting);
              }} locale={{ emptyText: users.isError ? 'Company users could not be loaded.' : 'No users found for this company.' }} />
          </div>
        </section>
      </>}
  </div>;
}

export default function CompanyDetailPage() {
  const { id } = useParams();
  return <CompanyDetail key={id} companyId={id} />;
}
