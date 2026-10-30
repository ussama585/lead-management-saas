import { message } from '../../../components/ui/notifications.jsx';
import { Modal } from '../../../components/ui/app-modal.jsx';
import { Select } from '../../../components/ui/app-select.jsx';
import { Input } from '../../../components/ui/app-controls.jsx';
import { Button, Spin } from '../../../components/ui/app-controls.jsx';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Avatar, Card, Descriptions, Space, Table, Tag } from 'antd';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Avatar as UserAvatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar.jsx';
import { useFormik } from 'formik';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';
import BreadCrumb from '../../../components/breadcrumb.component.jsx';
import api from '../../shared/services/api.js';
import useUserStore from '../../shared/store/user-store.js';
import { isSuperAdmin } from '../../auth/role-access.js';
import { companyError, getCompanyDetails } from './companies-page.jsx';
import formatDateUniversal from '../../shared/utils/formatDate.js';
import InputField from '../../../components/input-field.component.jsx';
import SettingsDeleteModal from '../../../components/settings-delete-modal.jsx';
import { assertUserSuccess, applyUserErrors, userFormError } from '../../users/user-form-errors.js';
import { managerIdFromOptions } from '../../users/user-manager-options.js';
import { companyUserRoles, companyUserCreateSchema, companyUserEditSchema, companyUserOtpSchema } from '../schemas/company-user-schema.js';
import '../../../assets/styles/user-management-form.css';

export async function createCompanyUser(companyId, values) {
  if (!/^[1-9]\d*$/.test(String(companyId))) throw new Error('A valid company is required.');
  if (!companyUserRoles.includes(values.user_type)) throw new Error('Select a valid user type.');
  const payload = { company_id: Number(companyId), name: values.name.trim(), email: values.email.trim(), phone: values.phone.trim(), password: values.password, user_type: values.user_type };
  if (values.user_type === 'sales_executive' && values.manager) payload.manager_id = Number(values.manager);
  let body = payload;
  if (values.profile_file) {
    body = new FormData();
    Object.entries(payload).forEach(([key, value]) => body.append(key, value));
    body.append('profile_pic', values.profile_file);
  }
  const { data } = await api.post('/accounts/signup', body);
  return assertUserSuccess(data);
}
export async function getCompanyUserDetails(id) {
  const { data } = await api.get(`/accounts/detail/${encodeURIComponent(id)}`);
  assertUserSuccess(data);
  const user = data?.data ?? data;
  if (user?.id == null) throw new Error('Could not read user details.');
  return user;
}
export async function editCompanyUser(id, values, initial) {
  const body = new FormData();
  for (const key of ['name', 'phone', 'password', 'manager']) {
    const value = typeof values[key] === 'string' ? values[key].trim() : values[key];
    if (key === 'manager' && (value === '' || value == null) && initial.manager) {
      body.append('manager_id', '');
      continue;
    }
    if (value !== '' && value != null && String(value) !== String(initial[key] ?? '')) body.append(key === 'manager' ? 'manager_id' : key, key === 'password' ? values[key] : value);
  }
  if (values.profile_file) body.append('profile_pic', values.profile_file);
  if (![...body.keys()].length) return { unchanged: true };
  const { data } = await api.patch(`/accounts/detail/${encodeURIComponent(id)}`, body);
  return assertUserSuccess(data);
}
export async function requestCompanyUserDelete(id) {
  const { data } = await api.delete(`/accounts/detail/${encodeURIComponent(id)}`);
  return assertUserSuccess(data);
}
export async function confirmCompanyUserDelete(id, otp) {
  const body = new FormData(); body.append('otp', otp.trim());
  const { data } = await api.post(`/accounts/validate-delete-user/${encodeURIComponent(id)}`, body);
  return assertUserSuccess(data);
}
export async function getCompanySalesManagers(companyId) {
  if (!companyId) throw new Error('A company is required to load managers.');
  const { data } = await api.get('/sales-manager/simple-list', { params: { company_id: companyId } });
  assertUserSuccess(data);
  if (!Array.isArray(data)) throw new Error('Could not load sales managers.');
  return data;
}

function CompanyUserForm({ companyId, target, onClose, onSaved }) {
  const queryClient = useQueryClient();
  const pictureInput = useRef(null);
  const [picturePreview, setPicturePreview] = useState(null);
  const editing = target.mode === 'edit';
  const details = useQuery(['companyUserEdit', companyId, target.id], () => getCompanyUserDetails(target.id), {
    enabled: editing, staleTime: 0, cacheTime: 0, refetchOnMount: 'always', refetchOnWindowFocus: false, refetchOnReconnect: false, retry: 1,
  });
  const managers = useQuery(['companyUserManagers', companyId, 'simple-list'], () => getCompanySalesManagers(companyId), {
    enabled: Boolean(companyId), refetchOnWindowFocus: false,
  });
  const initial = { name: details.data?.name || '', email: details.data?.email || '', phone: details.data?.phone || '',
    password: '', confirmPassword: '', company_id: Number(companyId), user_type: details.data?.user_type || 'sales_executive',
    manager: managerIdFromOptions(managers.data, details.data), profile_file: null };
  const save = useMutation(values => editing ? editCompanyUser(target.id, values, initial) : createCompanyUser(companyId, values), {
    onSuccess: result => {
      if (result.unchanged) { message.info('No changes were made'); return; }
      if (editing) queryClient.removeQueries(['companyUserEdit', companyId, target.id]);
      message.success(editing ? 'User edited successfully' : 'User created successfully'); onSaved(); onClose();
    },
    onError: error => { message.error(userFormError(error)); applyUserErrors(error, formik); },
  });
  const formik = useFormik({ initialValues: initial, enableReinitialize: true, validationSchema: editing ? companyUserEditSchema : companyUserCreateSchema,
    onSubmit: async values => { try { await save.mutateAsync(values); } catch { /* Errors are displayed by the mutation. */ } } });
  useEffect(() => {
    if (!formik.values.profile_file) { setPicturePreview(null); return; }
    const url = URL.createObjectURL(formik.values.profile_file);
    setPicturePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [formik.values.profile_file]);
  const managerOptions = managers.data || [];
  const fieldError = key => formik.touched[key] && formik.errors[key] ? <div className="error text-sm" style={{ color: 'red' }} role="alert">{formik.errors[key]}</div> : null;
  return <Modal open title={editing ? 'Edit company user' : 'Create company user'} width={720} footer={null}
    closable={!save.isLoading} maskClosable={!save.isLoading} keyboard={!save.isLoading} onCancel={() => { if (!save.isLoading) onClose(); }}>
    {editing && details.isLoading ? <div className="py-6 text-center"><Spin /></div> : editing && details.isError
      ? <Alert type="error" message={userFormError(details.error)} action={<Button onClick={() => details.refetch()}>Retry</Button>} />
      : <form className="user-management-form" onSubmit={formik.handleSubmit} noValidate>
        <div className="mb-5 flex justify-center">
          <div className="relative inline-flex">
            <UserAvatar className="size-20">
              <AvatarImage src={picturePreview || details.data?.profile_pic || undefined} alt="User profile" className="object-cover" />
              <AvatarFallback className="bg-primary text-3xl text-primary-foreground">{Array.from(String(formik.values.name || '').trim())[0]?.toUpperCase() || '?'}</AvatarFallback>
            </UserAvatar>
            <Button type="default" shape="circle" size="small" aria-label="Edit profile picture" title="Edit profile picture"
              icon={<Pencil size={14} />} disabled={save.isLoading} onClick={() => pictureInput.current?.click()}
              style={{ position: 'absolute', bottom: 0, right: 0 }} />
          </div>
          <input ref={pictureInput} id="company-user-picture" type="file" accept="image/*" hidden disabled={save.isLoading}
            onChange={event => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file && !file.type.startsWith('image/')) { message.error('Select an image file.'); event.target.value = ''; return; }
              if (file) formik.setFieldValue('profile_file', file);
            }} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {['name', 'email', 'phone', 'password', ...(!editing ? ['confirmPassword'] : [])].map(key => <div key={key}>
            <label htmlFor={`company-user-${key}`}>{({ name: 'Name', email: 'Email', phone: 'Phone', password: editing ? 'New Password (optional)' : 'Password', confirmPassword: 'Confirm Password' })[key]}{key !== 'password' || !editing ? ' *' : ''}</label>
            <InputField id={`company-user-${key}`} name={key} type={key.toLowerCase().includes('password') ? 'password' : key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'}
              value={formik.values[key]} onChange={formik.handleChange} onBlur={formik.handleBlur} disabled={save.isLoading || (editing && key === 'email')} />
            {fieldError(key)}
          </div>)}
          <div><label htmlFor="company-user-role">User Type *</label>
            <Select id="company-user-role" className="w-full" value={formik.values.user_type} disabled={editing || save.isLoading}
              options={companyUserRoles.map(value => ({ value, label: value.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()) }))}
              onChange={value => { formik.setFieldValue('user_type', value); formik.setFieldValue('manager', ''); }} onBlur={() => formik.setFieldTouched('user_type', true)} />{fieldError('user_type')}
          </div>
          {formik.values.user_type === 'sales_executive' && <div><label htmlFor="company-user-manager">Manager</label>
            <Select id="company-user-manager" className="w-full" placeholder="Select Manager" allowClear showSearch optionFilterProp="label"
              value={formik.values.manager ? String(formik.values.manager) : undefined} loading={managers.isFetching} disabled={save.isLoading || managers.isLoading}
              options={managerOptions.map(item => ({ value: String(item.user_id), label: item.name }))}
              onChange={value => formik.setFieldValue('manager', value ? Number(value) : '')} onBlur={() => formik.setFieldTouched('manager', true)} />{fieldError('manager')}
            {managers.isError && <div role="alert">Could not load managers. <Button type="link" onClick={() => managers.refetch()}>Retry</Button></div>}
          </div>}
        </div>
        <Space className="mt-5"><Button type="primary" htmlType="submit" loading={save.isLoading}>{editing ? 'Save changes' : 'Create user'}</Button><Button disabled={save.isLoading} onClick={onClose}>Cancel</Button></Space>
      </form>}
  </Modal>;
}

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
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState({});
  const [userDialog, setUserDialog] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [otpTarget, setOtpTarget] = useState(null);
  const refreshUsers = () => {
    queryClient.invalidateQueries(['companyUsers']); queryClient.invalidateQueries(['usersList']); queryClient.invalidateQueries(['userCount']);
  };
  const requestDelete = useMutation(id => requestCompanyUserDelete(id), {
    onSuccess: () => { setOtpTarget(deleteTarget); setDeleteTarget(null); }, onError: error => message.error(userFormError(error)),
  });
  const deleteUser = useMutation(otp => confirmCompanyUserDelete(otpTarget.id, otp), {
    onSuccess: () => {
      message.success('User deleted successfully'); setOtpTarget(null); otpForm.resetForm();
      if (users.data?.results?.length === 1 && pagination.current > 1) setPagination(previous => ({ ...previous, current: previous.current - 1 }));
      refreshUsers();
    }, onError: error => message.error(userFormError(error)),
  });
  const otpForm = useFormik({ initialValues: { otp: '' }, validationSchema: companyUserOtpSchema,
    onSubmit: async values => { try { await deleteUser.mutateAsync(values.otp); } catch { /* Keep OTP modal open for retry. */ } } });
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
    { title: 'Actions', key: 'actions', render: (_, row) => <Space>
      <Button aria-label={`Edit ${row.name}`} title="Edit user" icon={<Pencil size={16} />} onClick={() => setUserDialog({ mode: 'edit', id: row.id })} />
      <Button danger aria-label={`Delete ${row.name}`} title="Delete user" icon={<Trash2 size={16} />} onClick={() => { requestDelete.reset(); setDeleteTarget(row); }} />
    </Space> },
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Input.Search aria-label="Search company users" placeholder="Search users..." allowClear style={{ maxWidth: 360 }}
              onSearch={value => { setSearch(value.trim()); setPagination(previous => ({ ...previous, current: 1 })); }} />
            <Button type="primary" icon={<Plus size={16} />} onClick={() => setUserDialog({ mode: 'create' })}>Create company user</Button>
          </div>
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
    {userDialog && <CompanyUserForm key={`${companyId}:${userDialog.mode}:${userDialog.id ?? 'new'}`} companyId={companyId} target={userDialog} onClose={() => setUserDialog(null)} onSaved={() => {
      if (userDialog.mode === 'create') setPagination(previous => ({ ...previous, current: 1 }));
      refreshUsers();
    }} />}
    <SettingsDeleteModal title="Delete company user" itemName={deleteTarget?.name} open={deleteTarget != null} loading={requestDelete.isLoading}
      error={requestDelete.isError ? userFormError(requestDelete.error) : null} onCancel={() => { if (!requestDelete.isLoading) setDeleteTarget(null); }}
      onConfirm={() => { if (deleteTarget && !requestDelete.isLoading) requestDelete.mutate(deleteTarget.id); }} />
    <Modal open={otpTarget != null} title="Verify user deletion" footer={null} closable={!deleteUser.isLoading} maskClosable={!deleteUser.isLoading}
      onCancel={() => { if (!deleteUser.isLoading) { setOtpTarget(null); otpForm.resetForm(); } }}>
      <p className="mb-4">Enter the OTP sent for deleting {otpTarget?.name}.</p>
      <form className="user-management-form" noValidate onSubmit={otpForm.handleSubmit}>
        <label htmlFor="company-user-delete-otp">OTP</label>
        <Input id="company-user-delete-otp" name="otp" autoComplete="one-time-code" value={otpForm.values.otp} onChange={otpForm.handleChange} onBlur={otpForm.handleBlur} disabled={deleteUser.isLoading} />
        {otpForm.touched.otp && otpForm.errors.otp && <div role="alert" style={{ color: 'red' }}>{otpForm.errors.otp}</div>}
        <Button danger type="primary" className="mt-4" htmlType="submit" loading={deleteUser.isLoading}>Verify and delete</Button>
      </form>
    </Modal>
  </div>;
}

export default function CompanyDetailPage() {
  const { id } = useParams();
  return <CompanyDetail key={id} companyId={id} />;
}
