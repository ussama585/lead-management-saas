import React, { useState } from 'react';
import { Alert, Avatar, Button, Card, Descriptions, Input, Modal, Space, Spin, Switch, Table, Tag, message } from 'antd';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import BreadCrumb from '../../../components/breadcrumb.component.jsx';
import useUserStore from '../../shared/store/user-store.js';
import { isSuperAdmin } from '../../auth/role-access.js';
import api from '../../shared/services/api.js';
import { useFormik } from 'formik';
import { companySchema } from '../schemas/company-schema.js';
import SettingsDeleteModal from '../../../components/settings-delete-modal.jsx';
import formatDateUniversal from '../../shared/utils/formatDate.js';

const emptyCompany = { name: '', email: '', phone: '', website: '', address: '', country: '', city: '', is_active: true };
const companyFields = Object.keys(emptyCompany);

function companyPayload(values) {
  const payload = {};
  for (const field of companyFields) payload[field] = field === 'is_active' ? values[field] !== false : String(values[field] ?? '').trim();
  return payload;
}

function assertCompanySuccess(data) {
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'The company request failed.');
  return data;
}

export async function listCompanies({ page = 1, pageSize = 10, search = '', sortBy, order } = {}) {
  const params = { page, size: pageSize };
  if (search.trim()) params.search = search.trim();
  if (sortBy) { params.sort_by = sortBy; params.order = order || 'asc'; }
  const { data } = await api.get('/company/list', { params });
  assertCompanySuccess(data);
  if (!Array.isArray(data?.results)) throw new Error('Could not read the companies list.');
  return data;
}

export async function createCompany(values) {
  const { data } = await api.post('/company/create', companyPayload(values));
  return assertCompanySuccess(data);
}

export async function getCompanyDetails(id) {
  const { data } = await api.get(`/company/detail/${encodeURIComponent(id)}`);
  assertCompanySuccess(data);
  if (data?.data?.id == null || typeof data.data.name !== 'string') throw new Error('Could not read company details.');
  return data.data;
}

export async function updateCompany(id, values) {
  const { data } = await api.patch(`/company/detail/${encodeURIComponent(id)}`, companyPayload(values));
  return assertCompanySuccess(data);
}

export async function deleteCompany(id) {
  const { data } = await api.delete(`/company/detail/${encodeURIComponent(id)}`);
  return assertCompanySuccess(data);
}

export function companyFieldErrors(error) {
  const body = error?.response?.data;
  const fields = body?.errors || body;
  const errors = {};
  if (fields && typeof fields === 'object') {
    for (const field of companyFields) {
      const value = fields[field];
      if (Array.isArray(value)) errors[field] = value.join(' ');
      else if (typeof value === 'string') errors[field] = value;
    }
  }
  return errors;
}

export function companyError(error) {
  const body = error?.response?.data;
  if (typeof (body?.message || body?.detail) === 'string') return body.message || body.detail;
  const fields = body?.errors || body;
  if (fields && typeof fields === 'object') {
    const errors = Object.entries(fields).filter(([, value]) => typeof value === 'string' || Array.isArray(value))
      .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(' ') : value}`);
    if (errors.length) return errors.join(' ');
  }
  return error?.message || 'The request failed. Please try again.';
}

export default function CompaniesPage() {
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState({});
  const [dialog, setDialog] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryPrefix = ['companiesList', user?.id, user?.user_type];
  const detailPrefix = ['companyDetail', user?.id, user?.user_type];
  const list = useQuery([...queryPrefix, pagination, search, sorting],
    () => listCompanies({ page: pagination.current, pageSize: pagination.pageSize, search, ...sorting }),
    { enabled: isSuperAdmin(user?.user_type), keepPreviousData: true, refetchOnWindowFocus: false, retry: 1 });
  const detail = useQuery([...detailPrefix, dialog?.id], () => getCompanyDetails(dialog.id), {
    enabled: isSuperAdmin(user?.user_type) && dialog?.id != null,
    refetchOnWindowFocus: false, refetchOnMount: 'always', retry: 1,
  });
  const save = useMutation(({ id, values }) => id == null ? createCompany(values) : updateCompany(id, values), {
    onSuccess: async (result, variables) => {
      message.success(result?.message || (variables.id == null ? 'Company created successfully.' : 'Company updated successfully.'));
      setDialog(null);
      if (variables.id == null) setPagination(previous => ({ ...previous, current: 1 }));
      await Promise.all([queryClient.invalidateQueries(queryPrefix), queryClient.invalidateQueries(detailPrefix)]);
    },
    onError: error => {
      const errors = companyFieldErrors(error);
      formik.setErrors(errors);
      formik.setTouched(Object.fromEntries(Object.keys(errors).map(field => [field, true])), false);
      formik.setStatus(Object.keys(errors).length ? null : companyError(error));
    },
  });
  const remove = useMutation(deleteCompany, {
    onSuccess: async result => {
      message.success(result?.message || 'Company deleted successfully.');
      setDeleteTarget(null);
      if (list.data?.results?.length === 1 && pagination.current > 1) setPagination(previous => ({ ...previous, current: previous.current - 1 }));
      await Promise.all([queryClient.invalidateQueries(queryPrefix), queryClient.invalidateQueries(detailPrefix)]);
    },
  });
  const initialValues = dialog?.mode === 'edit' && detail.data ? companyPayload(detail.data) : emptyCompany;
  const formik = useFormik({
    initialValues, enableReinitialize: true, validationSchema: companySchema,
    onSubmit: async values => {
      try { await save.mutateAsync({ id: dialog?.mode === 'edit' ? dialog.id : undefined, values }); }
      catch { /* Mutation errors are displayed through Formik. */ }
    },
  });
  const busy = save.isLoading || remove.isLoading;
  function openDialog(mode, row) {
    save.reset();
    formik.resetForm({ values: emptyCompany });
    setDialog({ mode, id: row?.id });
  }
  function closeDialog() { if (!save.isLoading) setDialog(null); }
  if (!isSuperAdmin(user?.user_type)) return null;
  const columns = [
    { title: 'Company', dataIndex: 'name', key: 'name', sorter: true, render: (name, row) => <Space>
      <Avatar size={40} style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', flexShrink: 0 }} aria-hidden='true'>{Array.from(String(name || '').trim())[0]?.toUpperCase() || '?'}</Avatar>
      <span>{name}<span className='block text-xs text-muted-foreground'>ID: {row.id}</span></span>
    </Space> },
    ...[['email', 'Email'], ['phone', 'Phone'], ['address', 'Address'], ['city', 'City'], ['country', 'Country']].map(([field, title]) => ({
      title, dataIndex: field, key: field, sorter: ['email', 'city', 'country'].includes(field), render: value => value || '?',
    })),
    { title: 'Website', dataIndex: 'website', key: 'website', render: value => /^https?:\/\//i.test(value || '') ? <a href={value} target='_blank' rel='noopener noreferrer' className='text-primary underline'>{value}</a> : value || '?' },
    { title: 'Status', dataIndex: 'is_active', key: 'is_active', render: value => <Tag color={value ? 'green' : 'default'}>{value ? 'Active' : 'Inactive'}</Tag> },
    { title: 'Created', dataIndex: 'created_at', key: 'created_at', sorter: true, render: value => value ? formatDateUniversal(value, true) : '?' },
    { title: 'Actions', key: 'actions', fixed: 'right', width: 250, render: (_, row) => <Space wrap size={8} style={{ maxWidth: '100%' }}>
      <Button size='small' icon={<Eye size={16} />} disabled={busy} onClick={() => openDialog('view', row)}>View</Button>
      <Button size='small' icon={<Pencil size={16} />} disabled={busy} onClick={() => openDialog('edit', row)}>Edit</Button>
      <Button size='small' danger icon={<Trash2 size={16} />} disabled={busy} onClick={() => { remove.reset(); setDeleteTarget(row); }}>Delete</Button>
    </Space> },
  ];
  const detailReady = dialog?.id == null || (!detail.isFetching && !detail.isError && detail.data);
  return <>
    <BreadCrumb linkText='Companies' />
    <Card title='Companies' extra={<Button type='primary' icon={<Plus size={16} />} disabled={busy} onClick={() => openDialog('create')}>Create company</Button>}>
      <Input.Search aria-label='Search companies' placeholder='Search companies...' allowClear onSearch={value => { setSearch(value.trim()); setPagination(previous => ({ ...previous, current: 1 })); }} className='mb-4' style={{ maxWidth: 360 }} />
      {list.isError && <Alert type='error' showIcon message={companyError(list.error)} className='mb-4' action={<Button onClick={() => list.refetch()}>Retry</Button>} />}
      <Table rowKey='id' columns={columns} dataSource={list.data?.results || []} loading={list.isLoading || list.isFetching} scroll={{ x: 1550 }}
        pagination={{ ...pagination, total: list.data?.count || 0, showSizeChanger: true, showTotal: total => `${total} companies` }}
        onChange={(next, _filters, sorter, extra) => {
          setPagination({ current: extra.action === 'sort' || next.pageSize !== pagination.pageSize ? 1 : next.current, pageSize: next.pageSize });
          setSorting(sorter.order ? { sortBy: sorter.field, order: sorter.order === 'descend' ? 'desc' : 'asc' } : {});
        }} locale={{ emptyText: list.isError ? 'Companies could not be loaded.' : 'No companies found.' }} />
    </Card>
    <Modal title={dialog?.mode === 'edit' ? 'Edit company' : 'Create company'} open={dialog?.mode === 'create' || dialog?.mode === 'edit'} width={680}
      onOk={formik.submitForm} okText={dialog?.mode === 'edit' ? 'Save changes' : 'Create company'} confirmLoading={save.isLoading}
      okButtonProps={{ disabled: !detailReady || formik.isSubmitting }} onCancel={closeDialog} cancelButtonProps={{ disabled: save.isLoading }} closable={!save.isLoading} maskClosable={!save.isLoading} keyboard={!save.isLoading}>
      {dialog?.mode === 'edit' && detail.isFetching ? <div className='py-6 text-center'><Spin /></div> : dialog?.mode === 'edit' && detail.isError ?
        <Alert type='error' showIcon message={companyError(detail.error)} action={<Button onClick={() => detail.refetch()}>Retry</Button>} /> :
        <form onSubmit={formik.handleSubmit} noValidate className='mt-4'>
          <div className='grid gap-x-4 gap-y-4 sm:grid-cols-2'>
            {[
              ['name', 'Company name', 'Company name', 'text'], ['email', 'Email', 'info@company.com', 'email'],
              ['phone', 'Phone', 'Phone number', 'tel'], ['website', 'Website', 'https://example.com', 'url'],
              ['country', 'Country', 'Country', 'text'], ['city', 'City', 'City', 'text'], ['address', 'Address', 'Company address', 'text'],
            ].map(([field, label, placeholder, type]) => <div key={field} className={field === 'address' ? 'sm:col-span-2' : undefined}>
              <label htmlFor={`company-${field}`} className='mb-2 block text-sm font-medium'>{label}{['name', 'email'].includes(field) ? ' *' : ''}</label>
              {React.createElement(field === 'address' ? Input.TextArea : Input, {
                id: `company-${field}`, name: field, placeholder, ...(field === 'address' ? { rows: 2 } : { type }),
                value: formik.values[field], onChange: formik.handleChange, onBlur: formik.handleBlur, disabled: save.isLoading,
                status: formik.touched[field] && formik.errors[field] ? 'error' : undefined,
                'aria-required': ['name', 'email'].includes(field), 'aria-invalid': Boolean(formik.touched[field] && formik.errors[field]),
                'aria-describedby': formik.touched[field] && formik.errors[field] ? `company-${field}-error` : undefined,
              })}
              {formik.touched[field] && formik.errors[field] && <p id={`company-${field}-error`} role='alert' className='mt-1 text-sm text-destructive'>{formik.errors[field]}</p>}
            </div>)}
          </div>
          <div className='my-4 flex items-center gap-3'><label htmlFor='company-active' className='text-sm font-medium'>Active company</label>
            <Switch id='company-active' checked={formik.values.is_active} disabled={save.isLoading} onChange={checked => formik.setFieldValue('is_active', checked)} />
          </div>
          {formik.status && <Alert type='error' showIcon message={formik.status} />}
          <button type='submit' hidden disabled={save.isLoading}>Save company</button>
        </form>}
    </Modal>
    <Modal title='Company details' open={dialog?.mode === 'view'} width={680} onCancel={closeDialog} footer={<Button onClick={closeDialog}>Close</Button>}>
      {detail.isFetching ? <div className='py-6 text-center'><Spin /></div> : detail.isError ? <Alert type='error' showIcon message={companyError(detail.error)} action={<Button onClick={() => detail.refetch()}>Retry</Button>} /> : detail.data &&
        <Descriptions bordered column={1} size='small' className='mt-4' items={[
          { key: 'id', label: 'ID', children: detail.data.id },
          ...Object.entries({ name: 'Company', email: 'Email', phone: 'Phone', website: 'Website', address: 'Address', country: 'Country', city: 'City' }).map(([field, label]) => ({ key: field, label, children: detail.data[field] || '?' })),
          { key: 'active', label: 'Status', children: detail.data.is_active ? 'Active' : 'Inactive' },
          { key: 'created', label: 'Created', children: detail.data.created_at ? formatDateUniversal(detail.data.created_at, true) : '?' },
          { key: 'updated', label: 'Updated', children: detail.data.updated_at ? formatDateUniversal(detail.data.updated_at, true) : '?' },
        ]} />}
    </Modal>
    <SettingsDeleteModal title='Delete company' itemName={deleteTarget?.name} open={deleteTarget != null} loading={remove.isLoading}
      error={remove.isError ? companyError(remove.error) : null} onCancel={() => setDeleteTarget(null)}
      onConfirm={() => { if (deleteTarget && !remove.isLoading) remove.mutate(deleteTarget.id); }} />
  </>;
}
