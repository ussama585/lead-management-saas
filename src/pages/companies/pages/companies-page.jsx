import { message } from '../../../components/ui/notifications.jsx';
import { Modal } from '../../../components/ui/app-modal.jsx';
import { Input } from '../../../components/ui/app-controls.jsx';
import { Button, Spin } from '../../../components/ui/app-controls.jsx';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Avatar, Card, Space, Switch, Table, Tag } from 'antd';
import { Eye, Pencil, Plus, Trash2, RotateCcw } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs.jsx';
import useUserStore from '../../shared/store/user-store.js';
import { isSuperAdmin } from '../../auth/role-access.js';
import api from '../../shared/services/api.js';
import { useFormik } from 'formik';
import { companySchema } from '../schemas/company-schema.js';
import OtpModal from '../../auth/pages/otp-modal.jsx';
import formatDateUniversal from '../../shared/utils/formatDate.js';

const emptyCompany = { name: '', email: '', phone: '', website: '', address: '', country: '', city: '', is_active: true };
const companyFields = Object.keys(emptyCompany);

function companyPayload(values) {
  const payload = {};
  for (const field of companyFields) payload[field] = field === 'is_active' ? values[field] !== false : String(values[field] ?? '').trim();
  return payload;
}

function assertCompanySuccess(data) {
  if (data?.status === false || data?.success === false) {
    const error = new Error(companyError({ response: { data } }));
    error.response = { data };
    throw error;
  }
  return data;
}

export async function listCompanies({ page = 1, pageSize = 10, search = '', sortBy, order, isActive } = {}) {
  const params = { page, size: pageSize };
  if (typeof isActive === 'boolean') params.is_active = isActive;
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

export async function deleteCompany(id, otp) {
  const endpoint = `/company/detail/${encodeURIComponent(id)}`;
  const { data } = await (otp == null ? api.delete(endpoint) : api.delete(endpoint, { data: { otp: String(otp).trim() } }));
  return assertCompanySuccess(data);
}

export async function restoreCompany(id) {
  const { data } = await api.patch(`/company/detail/${encodeURIComponent(id)}`, { is_active: true });
  return assertCompanySuccess(data);
}

function useCompanyDeleteOtp(onDeleted) {
  const [target, setTarget] = useState(null);
  const queryClient = useQueryClient();
  const request = useMutation(company => deleteCompany(company.id), {
    onSuccess: (result, company) => { setTarget(company); message.success(result?.message || 'OTP sent to your registered email.'); },
    onError: error => message.error(companyError(error)),
  });
  const confirm = useMutation(({ company, otp }) => deleteCompany(company.id, otp), {
    onSuccess: async (result, { company }) => {
      message.success(result?.message || 'Company deleted successfully.');
      setTarget(null);
      await Promise.all([queryClient.invalidateQueries(['companiesList']), queryClient.invalidateQueries(['companyDetail'])]);
      onDeleted(company);
    },
    onError: error => message.error(companyError(error)),
  });
  return { target, isLoading: request.isLoading || confirm.isLoading,
    request: company => { if (!request.isLoading && !confirm.isLoading && !target) request.mutate(company); },
    close: () => { if (!confirm.isLoading) setTarget(null); },
    confirm: otp => confirm.mutateAsync({ company: target, otp }) };
}

function CompanyDeleteOtpModal({ deletion }) {
  return <OtpModal openModal={Boolean(deletion.target)} setOpenModal={open => { if (!open) deletion.close(); }}
    title="Confirm company deletion" description={`Enter the six digit OTP sent to your registered email to delete ${deletion.target?.name || 'this company'}.`}
    submitText="Verify and delete company" onSubmit={deletion.confirm} />;
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
  if (typeof body?.errors === 'string' && body.errors.trim()) return body.errors;
  if (Array.isArray(body?.errors) && body.errors.length) return body.errors.join(' ');
  if (!body?.errors && typeof (body?.message || body?.detail) === 'string') return body.message || body.detail;
  const fields = body?.errors || body;
  if (fields && typeof fields === 'object') {
    const errors = Object.entries(fields).filter(([, value]) => typeof value === 'string' || Array.isArray(value))
      .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(' ') : value}`);
    if (errors.length) return errors.join(' ');
  }
  return body?.message || body?.detail || error?.message || 'The request failed. Please try again.';
}

export function CompanyCardActions({ company, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();
  const save = useMutation(values => updateCompany(company.id, values), {
    onSuccess: async result => {
      message.success(result?.message || 'Company updated successfully.');
      setEditing(false);
      await queryClient.invalidateQueries(['companiesList']);
      await onSaved();
    },
    onError: error => {
      const errors = companyFieldErrors(error);
      formik.setErrors(errors);
      formik.setTouched(Object.fromEntries(Object.keys(errors).map(field => [field, true])), false);
      formik.setStatus(Object.keys(errors).length ? null : companyError(error));
    },
  });
  const remove = useCompanyDeleteOtp(onDeleted);
  const formik = useFormik({ initialValues: companyPayload(company), enableReinitialize: true, validationSchema: companySchema,
    onSubmit: async values => { try { await save.mutateAsync(values); } catch { /* Display mutation errors in the form. */ } },
  });
  return <>
    <Space wrap>
      <Button size="small" icon={<Pencil size={16} />} disabled={save.isLoading || remove.isLoading} onClick={() => { formik.resetForm(); save.reset(); setEditing(true); }}>Edit</Button>
      <Button size="small" danger title="Delete company" aria-label="Delete company" icon={<Trash2 size={16} />} disabled={save.isLoading || remove.isLoading} loading={remove.isLoading} onClick={() => remove.request(company)} />
    </Space>
    <Modal title="Edit company" open={editing} width={680} onOk={formik.submitForm} okText="Save changes" confirmLoading={save.isLoading}
      onCancel={() => { if (!save.isLoading) setEditing(false); }} closable={!save.isLoading} maskClosable={!save.isLoading} keyboard={!save.isLoading} cancelButtonProps={{ disabled: save.isLoading }}>
      <form onSubmit={formik.handleSubmit} noValidate className="mt-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries({ name: 'Company name', email: 'Email', phone: 'Phone', website: 'Website', country: 'Country', city: 'City', address: 'Address' }).map(([field, label]) => <div key={field} className={field === 'address' ? 'sm:col-span-2' : undefined}>
            <label htmlFor={`edit-company-${field}`} className="mb-2 block text-sm font-medium">{label}{['name', 'email'].includes(field) ? ' *' : ''}</label>
            {React.createElement(field === 'address' ? Input.TextArea : Input, {
              id: `edit-company-${field}`, name: field, type: field === 'email' ? 'email' : field === 'website' ? 'url' : field === 'phone' ? 'tel' : 'text',
              value: formik.values[field], onChange: formik.handleChange, onBlur: formik.handleBlur, disabled: save.isLoading,
              'aria-invalid': Boolean(formik.touched[field] && formik.errors[field]),
            })}
            {formik.touched[field] && formik.errors[field] && <p role="alert" className="mt-1 text-sm text-destructive">{formik.errors[field]}</p>}
          </div>)}
        </div>
        <div className="my-4 flex items-center gap-3"><label htmlFor="edit-company-active">Active company</label>
          <Switch id="edit-company-active" checked={formik.values.is_active} disabled={save.isLoading} onChange={checked => formik.setFieldValue('is_active', checked)} />
        </div>
        {formik.status && <Alert type="error" showIcon message={formik.status} />}
        <button type="submit" hidden disabled={save.isLoading}>Save changes</button>
      </form>
    </Modal>
    <CompanyDeleteOtpModal deletion={remove} />
  </>;
}

export default function CompaniesPage() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState({});
  const [companyTab, setCompanyTab] = useState('active');
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [dialog, setDialog] = useState(null);
  const queryPrefix = ['companiesList', user?.id, user?.user_type];
  const detailPrefix = ['companyDetail', user?.id, user?.user_type];
  const list = useQuery([...queryPrefix, companyTab, pagination, search, sorting],
    () => listCompanies({ page: pagination.current, pageSize: pagination.pageSize, search, ...sorting, isActive: companyTab === 'active' }),
    { enabled: isSuperAdmin(user?.user_type), refetchOnWindowFocus: false, retry: 1 });
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
  const remove = useCompanyDeleteOtp(() => {
    if (list.data?.results?.length === 1 && pagination.current > 1) setPagination(previous => ({ ...previous, current: previous.current - 1 }));
  });
  const initialValues = dialog?.mode === 'edit' && detail.data ? companyPayload(detail.data) : emptyCompany;
  const formik = useFormik({
    initialValues, enableReinitialize: true, validationSchema: companySchema,
    onSubmit: async values => {
      try { await save.mutateAsync({ id: dialog?.mode === 'edit' ? dialog.id : undefined, values }); }
      catch { /* Mutation errors are displayed through Formik. */ }
    },
  });
  const restore = useMutation(id => restoreCompany(id), {
    onSuccess: async result => {
      message.success(result?.message || 'Company restored successfully.');
      setRestoreTarget(null);
      if (list.data?.results?.length === 1 && pagination.current > 1) setPagination(previous => ({ ...previous, current: previous.current - 1 }));
      await Promise.all([queryClient.invalidateQueries(['companiesList']), queryClient.invalidateQueries(['companyDetail']), queryClient.invalidateQueries(['companies'])]);
    },
    onError: error => message.error(companyError(error)),
  });
  const busy = save.isLoading || remove.isLoading || restore.isLoading;
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
      <span>{companyTab === 'active' ? <Link to={`/super-admin/companies/${row.id}`} className='text-primary underline underline-offset-2'>{name}</Link> : name}<span className='block text-xs text-muted-foreground'>ID: {row.id}</span></span>
    </Space> },
    ...[['email', 'Email'], ['phone', 'Phone'], ['address', 'Address'], ['city', 'City'], ['country', 'Country']].map(([field, title]) => ({
      title, dataIndex: field, key: field, sorter: ['email', 'city', 'country'].includes(field), render: value => value || '?',
    })),
    { title: 'Website', dataIndex: 'website', key: 'website', render: value => /^https?:\/\//i.test(value || '') ? <a href={value} target='_blank' rel='noopener noreferrer' className='text-primary underline'>{value}</a> : value || '?' },
    { title: 'Status', dataIndex: 'is_active', key: 'is_active', render: value => <Tag color={value ? 'green' : 'default'}>{value ? 'Active' : 'Inactive'}</Tag> },
    { title: 'Created', dataIndex: 'created_at', key: 'created_at', sorter: true, render: value => value ? formatDateUniversal(value, true) : '?' },
    { title: companyTab === 'deleted' ? 'Restore' : 'Actions', key: 'actions', width: companyTab === 'deleted' ? 100 : 250, render: (_, row) => companyTab === 'deleted' ?
      <Button title='Restore company' aria-label={`Restore ${row.name}`} size='small' icon={<RotateCcw size={16} />} className='bg-green-100 text-green-700 hover:bg-green-200' disabled={busy} onClick={() => setRestoreTarget(row)} /> : <Space wrap size={8} style={{ maxWidth: '100%' }}>
      <Button title='View company' aria-label={`View ${row.name}`} size='small' icon={<Eye size={16} />} disabled={busy} onClick={() => navigate(`/super-admin/companies/${row.id}`)} />
      <Button title='Edit company' aria-label={`Edit ${row.name}`} size='small' icon={<Pencil size={16} />} disabled={busy} onClick={() => openDialog('edit', row)} />
      {companyTab === 'active' && <Button title='Delete company' aria-label={`Delete ${row.name}`} size='small' danger icon={<Trash2 size={16} />} disabled={busy} onClick={() => remove.request(row)} />}
    </Space> },
  ];
  const detailReady = dialog?.id == null || (!detail.isFetching && !detail.isError && detail.data);
  return <>
    <Tabs value={companyTab} onValueChange={value => { setCompanyTab(value); setPagination(previous => ({ ...previous, current: 1 })); }} className='mb-4'>
      <TabsList>
        <TabsTrigger value='active'>Active Companies</TabsTrigger>
        <TabsTrigger value='deleted'>Deleted Companies</TabsTrigger>
      </TabsList>
    </Tabs>
    <Card extra={<Button type='primary' icon={<Plus size={16} />} disabled={busy} onClick={() => openDialog('create')}>Create company</Button>}>
      <Input.Search aria-label='Search companies' placeholder='Search companies...' allowClear onSearch={value => { setSearch(value.trim()); setPagination(previous => ({ ...previous, current: 1 })); }} className='mb-4' style={{ maxWidth: 360 }} />
      {list.isError && <Alert type='error' showIcon message={companyError(list.error)} className='mb-4' action={<Button onClick={() => list.refetch()}>Retry</Button>} />}
      <Table rowKey='id' columns={columns} dataSource={list.data?.results || []} loading={list.isLoading || list.isFetching} scroll={{ x: 1550 }}
        pagination={{ ...pagination, total: list.data?.count || 0, showSizeChanger: true, showTotal: total => `${total} companies` }}
        onChange={(next, _filters, sorter, extra) => {
          setPagination({ current: extra.action === 'sort' || next.pageSize !== pagination.pageSize ? 1 : next.current, pageSize: next.pageSize });
          setSorting(sorter.order ? { sortBy: sorter.field, order: sorter.order === 'descend' ? 'desc' : 'asc' } : {});
        }} locale={{ emptyText: list.isError ? 'Companies could not be loaded.' : 'No companies found.' }} />
    </Card>
    <Modal title='Restore company' open={Boolean(restoreTarget)} okText='Restore' confirmLoading={restore.isLoading}
      onCancel={() => { if (!restore.isLoading) setRestoreTarget(null); }}
      onOk={() => { if (restoreTarget && !restore.isLoading) restore.mutate(restoreTarget.id); }}>
      <p>Are you sure you want to restore {restoreTarget?.name || 'this company'}?</p>
    </Modal>
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
    <CompanyDeleteOtpModal deletion={remove} />
  </>;
}
