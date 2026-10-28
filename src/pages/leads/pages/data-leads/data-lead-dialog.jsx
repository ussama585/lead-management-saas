import { message } from '../../../../components/ui/notifications.jsx';
import { Modal } from '../../../../components/ui/app-modal.jsx';
import { Select } from '../../../../components/ui/app-select.jsx';
import { Input } from '../../../../components/ui/app-controls.jsx';
import { Button, Spin } from '../../../../components/ui/app-controls.jsx';
import React from 'react';
import { Alert, Descriptions, Switch } from 'antd';
import { useFormik } from 'formik';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import api from '../../../shared/services/api.js';
import useUserStore from '../../../shared/store/user-store.js';
import { isSuperAdmin } from '../../../auth/role-access.js';
import { dataLeadSchema, dataLeadEditSchema, dataLeadEditFields } from '../../schemas/data-lead-schema.js';

const emptyLead = { company: undefined, industry: '', company_name: '', contact_person_name: '', contact_person_designation: '', email: '', phone_number: '', status: '', remarks: '', project_size: '', assigned_to: null, contract_currency: 'PKR', contract_price: null, is_accepting_response: true, followup_date: '' };
const labels = { industry: 'Industry', company_name: 'Company name', contact_person_name: 'Contact name', contact_person_designation: 'Designation', email: 'Email', phone_number: 'Phone number', status: 'Status', project_size: 'Project size', assigned_to: 'Assigned user ID', contract_currency: 'Currency', contract_price: 'Contract price', followup_date: 'Follow-up date', remarks: 'Remarks' };

export function dataLeadPayload(values, superAdmin) {
  const payload = {};
  for (const key of Object.keys(emptyLead)) {
    if (key === 'company') { if (superAdmin) payload.company = Number(values.company); continue; }
    if (['assigned_to', 'contract_price'].includes(key)) payload[key] = values[key] === '' || values[key] == null ? null : Number(values[key]);
    else if (key === 'is_accepting_response') payload[key] = values[key] === true;
    else if (key === 'followup_date') payload[key] = values[key] || null;
    else payload[key] = String(values[key] ?? '').trim();
  }
  return payload;
}
function success(data) {
  if (data?.success === false || data?.status === false) throw new Error(data.message || 'The data lead request failed.');
  return data;
}
export async function getDataLeadDetails(id) {
  const { data } = await api.get(`/data-leads/details/${encodeURIComponent(id)}`);
  success(data);
  if (data?.data?.id == null) throw new Error('Could not read lead details.');
  return data.data;
}
export async function saveDataLead({ id, values, superAdmin }) {
  const payload = id == null ? dataLeadPayload(values, superAdmin) : Object.fromEntries(dataLeadEditFields.map(key => [key, String(values[key] ?? '').trim()]));
  const response = id == null ? await api.post('/data-leads/create', payload) : await api.patch(`/data-leads/details/${encodeURIComponent(id)}`, payload);
  return success(response.data);
}
export function dataLeadError(error) {
  const body = error?.response?.data;
  return body?.message || body?.detail || error?.message || 'The request failed. Please try again.';
}

export default function DataLeadDialog({ mode, id, onClose, onSaved, statuses = [], projectSizes = [], assignees = [] }) {
  const { user } = useUserStore();
  const superAdmin = isSuperAdmin(user?.user_type);
  const queryClient = useQueryClient();
  const detail = useQuery(['dataLeadDetail', user?.id, user?.user_type, id], () => getDataLeadDetails(id), { enabled: id != null, retry: 1, refetchOnWindowFocus: false, refetchOnMount: 'always' });
  const [companySearch, setCompanySearch] = React.useState('');
  const companies = useQuery(['dataLeadCompanies', user?.id, companySearch], async () => {
    const { data } = await api.get('/company/list', { params: { page: 1, size: 50, search: companySearch } });
    success(data);
    return Array.isArray(data?.results) ? data.results : [];
  }, { enabled: superAdmin && mode === 'create', refetchOnWindowFocus: false });
  const save = useMutation(saveDataLead, {
    onSuccess: async result => {
      message.success(result?.message || 'Data lead saved.');
      onClose();
      await Promise.all(['dataLeads', 'dataLeadsCounts', 'dataLeadDetail', 'dataLeadsStats'].map(key => queryClient.invalidateQueries([key])));
      await onSaved?.();
    },
    onError: error => {
      const body = error?.response?.data;
      const fields = body?.errors || body;
      const errors = {};
      for (const key of Object.keys(emptyLead)) {
        if (Array.isArray(fields?.[key])) errors[key] = fields[key].join(' ');
        else if (typeof fields?.[key] === 'string') errors[key] = fields[key];
      }
      formik.setErrors(errors);
      formik.setTouched(Object.fromEntries(Object.keys(errors).map(key => [key, true])), false);
      formik.setStatus(Object.keys(errors).length ? null : dataLeadError(error));
    },
  });
  const initial = id != null && detail.data ? Object.fromEntries(Object.entries(emptyLead).map(([key, fallback]) => [key, key === 'followup_date' ? (detail.data[key] || '').slice(0, 10) : detail.data[key] ?? fallback])) : emptyLead;
  const formik = useFormik({ initialValues: initial, enableReinitialize: true, validationSchema: mode === 'edit' ? dataLeadEditSchema() : dataLeadSchema(superAdmin), onSubmit: async values => { try { await save.mutateAsync({ id, values, superAdmin }); } catch { /* Formik displays API errors. */ } } });
  const pending = save.isLoading;
  function close() { if (!pending) onClose(); }
  const loading = id != null && detail.isFetching;
  const detailError = id != null && detail.isError;
  const companyOptions = (companies.data || []).map(company => ({ value: company.id, label: `${company.name} (ID: ${company.id})` }));
  if (detail.data?.company != null && !companyOptions.some(option => option.value === detail.data.company)) companyOptions.push({ value: detail.data.company, label: `Company ID: ${detail.data.company}` });
  function control(key) {
    const common = { id: `data-lead-${key}`, name: key, disabled: pending, value: formik.values[key], onBlur: formik.handleBlur, 'aria-invalid': Boolean(formik.touched[key] && formik.errors[key]), 'aria-describedby': formik.touched[key] && formik.errors[key] ? `data-lead-${key}-error` : undefined };
    if (key === 'company') return <Select {...common} className='w-full' showSearch filterOption={false} onSearch={setCompanySearch} loading={companies.isFetching} options={companyOptions} onChange={value => formik.setFieldValue(key, value)} onBlur={() => formik.setFieldTouched(key, true)} placeholder='Search for a company' />;
    if (['assigned_to', 'contract_price'].includes(key)) return key === 'assigned_to' && assignees.length ? <Select {...common} className='w-full' allowClear showSearch optionFilterProp='label' options={assignees.map(item => ({ value: item.id, label: item.name }))} onChange={value => formik.setFieldValue(key, value ?? null)} onBlur={() => formik.setFieldTouched(key, true)} /> : <Input {...common} type='number' className='h-10 w-full' min={key === 'assigned_to' ? 1 : 0} step={key === 'contract_price' ? 'any' : 1} onChange={event => formik.setFieldValue(key, event.target.value === '' ? null : Number(event.target.value))} />;
    if (key === 'is_accepting_response') return <Switch id={common.id} disabled={pending} checked={formik.values[key]} onChange={value => formik.setFieldValue(key, value)} />;
    if (['status', 'project_size'].includes(key)) return <Select {...common} className='w-full' showSearch optionFilterProp='label' options={[...new Set((key === 'status' ? statuses : projectSizes).concat(formik.values[key] || []).filter(Boolean))].map(value => ({ value, label: value }))} onChange={value => formik.setFieldValue(key, value)} onBlur={() => formik.setFieldTouched(key, true)} placeholder='Select a value' />;
    if (key === 'remarks') return <Input.TextArea {...common} rows={3} onChange={formik.handleChange} />;
    return <Input {...common} type={key === 'email' ? 'email' : key === 'followup_date' ? 'date' : 'text'} onChange={formik.handleChange} />;
  }
  return <Modal title={mode === 'view' ? 'Data lead details' : mode === 'edit' ? 'Edit data lead' : 'Create data lead'} open width={800} style={{ width: 'calc(100% - 32px)' }} onCancel={close}
    onOk={formik.submitForm} okText={mode === 'edit' ? 'Save changes' : 'Create lead'} confirmLoading={pending} okButtonProps={{ disabled: loading || detailError }}
    cancelButtonProps={{ disabled: pending }} closable={!pending} maskClosable={!pending} keyboard={!pending} footer={mode === 'view' ? <Button onClick={close}>Close</Button> : undefined}>
    {loading ? <div className='py-6 text-center'><Spin /></div> : detailError ? <Alert type='error' showIcon message={dataLeadError(detail.error)} action={<Button onClick={() => detail.refetch()}>Retry</Button>} /> : mode === 'view' ?
      <Descriptions column={1} bordered size='small' items={Object.entries(labels).map(([field, title]) => { const key = field === 'assigned_to' ? 'assigned_to_name' : field; const label = field === 'assigned_to' ? 'Assigned to' : title; return ({ key, label, children: String(detail.data?.[key] ?? '—') }); })} /> :
      <form onSubmit={formik.handleSubmit} noValidate className='mt-4 grid gap-x-6 gap-y-6 sm:grid-cols-2'>
        {(mode === 'edit' ? dataLeadEditFields.map(key => [key, labels[key]]) : [...(superAdmin ? [['company', 'Company']] : []), ...Object.entries(labels), ['is_accepting_response', 'Accepting responses']]).map(([key, label]) => <div key={key} className={key === 'remarks' ? 'sm:col-span-2' : undefined}>
          <label htmlFor={`data-lead-${key}`} className='mb-2 block text-sm font-medium'>{label}</label>{control(key)}
          {formik.touched[key] && formik.errors[key] && <p id={`data-lead-${key}-error`} role='alert' className='mt-1 text-sm text-destructive'>{formik.errors[key]}</p>}
        </div>)}
        {companies.isError && superAdmin && mode === 'create' && <Alert className='sm:col-span-2' type='error' message='Could not load companies.' action={<Button onClick={() => companies.refetch()}>Retry</Button>} />}
        {formik.status && <Alert className='sm:col-span-2' type='error' showIcon message={formik.status} />}
        <button type='submit' hidden disabled={pending}>Save lead</button>
      </form>}
  </Modal>;
}
