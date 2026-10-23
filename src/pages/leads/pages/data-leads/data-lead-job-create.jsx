import React, { useState } from 'react';
import { useFormik, getIn, setIn } from 'formik';
import { Alert, Button, Input, InputNumber, Select, Space, Spin, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import SettingsDeleteModal from '../../../../components/settings-delete-modal.jsx';
import { isSuperAdmin } from '../../../auth/role-access.js';
import { useNavigate, useParams } from 'react-router-dom';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import api from '../../../shared/services/api.js';
import useUserStore from '../../../shared/store/user-store.js';
import { getRolePath } from '../../../auth/role-home.js';
import { dataLeadJobSchema, dataLeadJobChoices } from '../../schemas/data-lead-job-schema.js';
import { languageOptions, nationalityOptions, departmentOptions, workingDaysOptions } from '../../../shared/utils/job-form-options.js';
import '../../../../assets/styles/data-lead-job-form.css';

export const emptyDataLeadJob = {
  data_lead: null, job_title: '', number_of_vacancies: null, job_type: '', employment_type: '', department: '',
  location_country: '', location_city: '', job_description: '', job_requirements: '', job_responsibilities: '',
  key_skills_required: '', min_experience: 0, max_experience: 0, educational_qualification: '', other_benefits: '',
  currency: 'Pakistani Rupee (PKR)', min_salary: null, max_salary: null, payment_term: 'Per Month',
  languages_required: '', gender_preference: 'No Preference', nationality_preference: '', notes: '',
  timezone: '(UTC+05:00) Ekaterinburg, Islamabad, Karachi, Tashkent', working_days: '', working_hours: '',
  cv_submission_deadline: '', expected_joining_date: '', degree_level: '', job_shift: '', hours_per_week: null,
  contract_length: '', contract_period: '', address: '', degrees: [], skills: [],
};
const numericFields = ['data_lead', 'number_of_vacancies', 'min_experience', 'max_experience', 'min_salary', 'max_salary', 'hours_per_week'];
const dates = ['cv_submission_deadline', 'expected_joining_date'];
const multiline = ['job_description', 'job_requirements', 'job_responsibilities', 'other_benefits', 'notes'];
const labels = { job_title: 'Job Title', number_of_vacancies: 'No. of Vacancies', languages_required: 'Language Required', gender_preference: 'Gender Preference', nationality_preference: 'Nationality Preference', department: 'Department', working_hours: 'Working Hours', cv_submission_deadline: 'CV Submission Deadline', expected_joining_date: 'Expected Joining Date', timezone: 'Timezone', min_experience: 'Min Experience (Years)', max_experience: 'Max Experience (Years)', employment_type: 'Employment Type', location_city: 'City', location_country: 'Country', address: 'Address', degree_level: 'Degree Level', educational_qualification: 'Educational Qualification', job_type: 'Job Type', currency: 'Currency', min_salary: 'Minimum Salary', max_salary: 'Maximum Salary', payment_term: 'Payment Terms', job_description: 'Job Description', job_responsibilities: 'Responsibilities', job_requirements: 'Requirements', other_benefits: 'Other Benefits', notes: 'Notes', job_shift: 'Job Shift', hours_per_week: 'Hours per Week', contract_length: 'Contract Length', contract_period: 'Contract Period' };
const requiredFields = new Set(['job_title', 'number_of_vacancies', 'gender_preference', 'min_experience', 'max_experience', 'employment_type', 'location_city', 'location_country', 'job_type', 'job_description']);
const tagChoices = { languages_required: languageOptions, nationality_preference: nationalityOptions, department: departmentOptions };
const splitTags = value => String(value || '').split(',').map(value => value.trim()).filter(Boolean);


export function dataLeadJobPayload(values) {
  const payload = {};
  for (const key of Object.keys(emptyDataLeadJob)) {
    if (['degrees', 'skills'].includes(key)) continue;
    payload[key] = typeof values[key] === 'string' ? values[key].trim() : values[key] ?? null;
  }
  numericFields.forEach(key => { payload[key] = values[key] === '' || values[key] == null ? null : Number(values[key]); });
  const offset = values.timezone?.match(/\(UTC([+-]\d{2}:\d{2})\)/)?.[1] || '+00:00';
  dates.forEach(key => {
    const value = values[key];
    payload[key] = value ? /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}${value.length === 16 ? ':00' : ''}${offset}` : null;
  });
  payload.degrees = values.degrees.map(degree => ({ degree_name: degree.degree_name.trim() }));
  payload.skills = values.skills.map(skill => ({ skill_name: skill.skill_name.trim(), experience: Number(skill.experience), last_used: Number(skill.last_used) }));
  return payload;
}

export async function createDataLeadJob(values) {
  const { data } = await api.post('/data-leads/create-job', dataLeadJobPayload(values));
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not create job.');
  return data;
}
export async function getDataLeadJob(jobId) {
  const { data } = await api.get(`/data-leads/update-job/${encodeURIComponent(jobId)}`);
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not load job.');
  const job = data?.data ?? data;
  if (job?.id == null) throw new Error('Could not read job details.');
  return job;
}
export async function updateDataLeadJob(jobId, values) {
  const { data } = await api.patch(`/data-leads/update-job/${encodeURIComponent(jobId)}`, dataLeadJobPayload(values));
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not update job.');
  return data;
}
export async function deleteDataLeadJob(jobId) {
  const { data } = await api.delete(`/data-leads/update-job/${encodeURIComponent(jobId)}`);
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not delete job.');
  return data;
}
export function dataLeadJobFormValues(job, leadId) {
  const values = { ...emptyDataLeadJob };
  for (const key of Object.keys(values)) if (job?.[key] != null) values[key] = job[key];
  values.data_lead = Number(leadId);
  const offset = values.timezone.match(/\(UTC([+-])(\d{2}):(\d{2})\)/);
  const minutes = offset ? (Number(offset[2]) * 60 + Number(offset[3])) * (offset[1] === '-' ? -1 : 1) : 0;
  dates.forEach(key => {
    if (!values[key]) return;
    const timestamp = Date.parse(values[key]);
    values[key] = Number.isNaN(timestamp) ? '' : new Date(timestamp + minutes * 60000).toISOString().slice(0, 16);
  });
  values.degrees = (job?.degrees || []).map(degree => ({ degree_name: degree.degree_name }));
  values.skills = (job?.skills || []).map(skill => ({ skill_name: skill.skill_name, experience: Number(skill.experience ?? 0), last_used: Number(skill.last_used ?? 0) }));
  return values;
}
const errorMessage = error => error?.response?.data?.message || error?.response?.data?.detail || error?.message || 'Could not create job.';

export default function DataLeadJobCreate() {
  const { id, leadId, jobId } = useParams();
  const dataLeadId = leadId || id;
  const { user } = useUserStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const back = () => navigate(getRolePath(user?.user_type, `/data-lead/${dataLeadId}`));
  const [deleteOpen, setDeleteOpen] = useState(false);
  const detail = useQuery(['dataLeadJobDetail', user?.id, user?.user_type, jobId], () => getDataLeadJob(jobId), {
    enabled: Boolean(jobId), refetchOnWindowFocus: false, refetchOnMount: 'always',
  });
  const save = useMutation(values => jobId ? updateDataLeadJob(jobId, values) : createDataLeadJob(values), { onSuccess: result => {
    message.success(result?.message || (jobId ? 'Job updated successfully' : 'Job created successfully'));
    queryClient.invalidateQueries(['dataLeadJobs']);
    queryClient.invalidateQueries(['dataLeadDetail']);
    queryClient.invalidateQueries(['dataLeadJobDetail']);
    back();
  } });
  const remove = useMutation(() => deleteDataLeadJob(jobId), { onSuccess: result => {
    message.success(result?.message || 'Job deleted successfully');
    queryClient.invalidateQueries(['dataLeadJobs']);
    queryClient.invalidateQueries(['dataLeadJobDetail']);
    setDeleteOpen(false); back();
  } });
  const formik = useFormik({ initialValues: dataLeadJobFormValues(detail.data, dataLeadId), enableReinitialize: true,
    validationSchema: dataLeadJobSchema, onSubmit: async (values, helpers) => {
      if (save.isLoading) return;
      try { await save.mutateAsync(values); }
      catch (error) {
        const fields = error?.response?.data?.errors || error?.response?.data;
        let errors = {};
        const collect = (value, path) => {
          if (typeof value === 'string') errors = setIn(errors, path, value);
          else if (Array.isArray(value) && value.every(item => typeof item === 'string')) errors = setIn(errors, path, value.join(' '));
          else if (value && typeof value === 'object') Object.entries(value).forEach(([key, entry]) => collect(entry, `${path}.${key}`));
        };
        Object.keys(emptyDataLeadJob).forEach(key => { if (fields?.[key] != null) collect(fields[key], key); });
        helpers.setErrors(errors);
      }
    },
  });
  const fieldError = key => formik.submitCount || getIn(formik.touched, key) ? getIn(formik.errors, key) : null;
  function field(key, label = labels[key], choices = dataLeadJobChoices[key], className = '') {
    const value = getIn(formik.values, key);
    const error = fieldError(key);
    const props = { id: key, name: key, disabled: save.isLoading, onBlur: () => formik.setFieldTouched(key, true),
      status: typeof error === 'string' ? 'error' : undefined, 'aria-describedby': `${key}-error` };
    let control;
    if (tagChoices[key]) control = <Select {...props} mode="tags" style={{ width: '100%' }} value={splitTags(value)} options={tagChoices[key]}
      placeholder={`Select or enter ${key === 'department' ? 'departments' : key === 'languages_required' ? 'languages' : 'nationalities'}`} tokenSeparators={[',']}
      onChange={values => formik.setFieldValue(key, values.join(', '))} />;
    else if (choices) control = <Select {...props} showSearch optionFilterProp="label" style={{ width: '100%' }} value={value === '' ? undefined : value}
      options={choices.map(option => ({ value: option, label: String(option) }))} placeholder={`Select ${label?.toLowerCase() || 'option'}`} onChange={value => formik.setFieldValue(key, value)} />;
    else if (numericFields.includes(key)) control = <InputNumber {...props} min={key === 'number_of_vacancies' || key === 'hours_per_week' ? 1 : 0} style={{ width: '100%' }} value={value} onChange={value => formik.setFieldValue(key, value)} />;
    else if (multiline.includes(key)) control = <Input.TextArea {...props} rows={5} placeholder={label} value={value} onChange={formik.handleChange} />;
    else control = <Input {...props} type={dates.includes(key) ? 'datetime-local' : 'text'} placeholder={label} value={value} onChange={formik.handleChange} />;
    return <div key={key} className={`data-job-field ${className}`}>
      <label htmlFor={key}>{label}{requiredFields.has(key) ? '*' : ''}</label>{control}
      {typeof error === 'string' && <p id={`${key}-error`} role="alert" className="mt-1 text-sm text-destructive">{error}</p>}
    </div>;
  }
  const section = (title, children, className = '') => <section className={`data-job-section ${className}`} aria-label={title}>
    <h2>{title}</h2>{children}
  </section>;
  const changeWorkingDay = (side, value) => {
    const [from = '', to = ''] = formik.values.working_days.split(/\s*-\s*/);
    formik.setFieldValue('working_days', side === 'from' ? `${value || ''}-${to}` : `${from}-${value || ''}`);
  };
  const [workingFrom = '', workingTo = ''] = formik.values.working_days.split(/\s*-\s*/);
  if (jobId && detail.isLoading) return <><BreadCrumb linkText="Edit Data Lead Job" goBack={back} /><Spin /></>;
  if (jobId && detail.isError) return <><BreadCrumb linkText="Edit Data Lead Job" goBack={back} /><Alert type="error" message={errorMessage(detail.error)} action={<Button onClick={() => detail.refetch()}>Retry</Button>} /></>;
  return <><BreadCrumb linkText={jobId ? 'Edit Data Lead Job' : 'Add Data Lead Job'} goBack={back} />
    <form onSubmit={formik.handleSubmit} noValidate className="data-job-form">
      {fieldError('data_lead') && <Alert type="error" message={fieldError('data_lead')} />}
      {section('Basic Job Info', <div className="data-job-grid">
        {field('job_title')}{field('number_of_vacancies')}{field('languages_required')}{field('gender_preference')}
        {field('nationality_preference')}{field('department')}{field('working_hours')}{field('cv_submission_deadline')}
        {field('expected_joining_date')}{field('timezone')}
        <div className="data-job-field data-job-span-all">
          <label htmlFor="working-days-from">Working Days</label>
          <div className="data-job-working-days">
            <Select id="working-days-from" aria-label="Working days from" placeholder="From" value={workingFrom || undefined} disabled={save.isLoading}
              options={workingDaysOptions} onChange={value => changeWorkingDay('from', value)} />
            <span>to</span>
            <Select id="working-days-to" aria-label="Working days to" placeholder="To" value={workingTo || undefined} disabled={save.isLoading}
              options={workingDaysOptions} onChange={value => changeWorkingDay('to', value)} />
          </div>
        </div>
        {field('min_experience')}{field('max_experience')}
      </div>)}
      {section('Job Location', <div className="data-job-grid">
        {field('employment_type', undefined, undefined, 'data-job-span-two')}{field('location_city')}{field('location_country')}
        {field('address', undefined, undefined, 'data-job-span-two')}
      </div>)}
      <div className="data-job-paired-sections">
        {section('Education', <div className="data-job-stack">
          {field('degree_level')}
          <div className="data-job-field"><label htmlFor="degree-names">Degree Name(s)</label>
            <Select id="degree-names" mode="tags" placeholder="Select or type degree names" disabled={save.isLoading}
              style={{ width: '100%' }} value={formik.values.degrees.map(degree => degree.degree_name)}
              onChange={names => formik.setFieldValue('degrees', names.map(degree_name => ({ degree_name })))} />
            <p className="data-job-help">Please type/select one degree name at a time</p>
            {typeof fieldError('degrees') === 'string' && <p role="alert" className="text-destructive">{fieldError('degrees')}</p>}
          </div>
          {field('educational_qualification')}
        </div>)}
        {section('Job Nature', <div className="data-job-stack">
          {field('job_type')}
          <div className="data-job-nature-grid">{field('job_shift')}{field('hours_per_week')}{field('contract_length')}{field('contract_period')}</div>
        </div>)}
      </div>
      {section('Required Skills', <div className="data-job-stack">
        <div className="data-job-field"><label htmlFor="required-skills">Required Skills*</label>
          <Select id="required-skills" mode="tags" placeholder="Search or type a skill name" style={{ width: '100%' }} disabled={save.isLoading}
            value={formik.values.skills.map(skill => skill.skill_name).filter(Boolean)}
            options={['Python', 'Django', 'REST APIs', 'PostgreSQL', 'JavaScript', 'React', 'Node.js', 'SQL', 'AWS'].map(value => ({ value, label: value }))}
            onChange={names => {
              formik.setFieldValue('skills', names.map(skill_name => formik.values.skills.find(skill => skill.skill_name === skill_name) || { skill_name, experience: 0, last_used: 0 }));
              formik.setFieldValue('key_skills_required', names.join(', '));
            }} />
          <p className="data-job-help">Search existing skills or type a custom skill, then press Enter</p>
          {typeof fieldError('skills') === 'string' && <p role="alert" className="text-destructive">{fieldError('skills')}</p>}
        </div>
        {formik.values.skills.map((skill, index) => skill.skill_name && <div key={index} className="data-job-skill-row">
          {field(`skills.${index}.skill_name`, 'Skill Name')}
          {field(`skills.${index}.experience`, 'Experience (Years)', dataLeadJobChoices.min_experience)}
          {field(`skills.${index}.last_used`, 'Last Used (Years Ago)', [0, 1, 2, 3, 4, 5])}
          <Button disabled={save.isLoading} onClick={() => {
            const remaining = formik.values.skills.filter((_, i) => i !== index);
            formik.setFieldValue('skills', remaining); formik.setFieldValue('key_skills_required', remaining.map(skill => skill.skill_name).join(', '));
          }}>Remove</Button>
        </div>)}
        {field('key_skills_required', 'Key Skills Summary')}
      </div>)}
      {section('Salary & Compensation', <div className="data-job-grid">
        {field('currency')}{field('min_salary')}{field('max_salary')}{field('payment_term')}
      </div>)}
      {section('Job Details', <div className="data-job-stack">
        {field('job_description')}{field('job_responsibilities')}{field('job_requirements')}{field('other_benefits')}{field('notes')}
      </div>)}
      <p className="data-job-help">Hiring dates and times use the selected timezone.</p>
      {save.isError && <Alert type="error" showIcon message={errorMessage(save.error)} />}
      <Space wrap><Button htmlType="submit" type="primary" loading={save.isLoading} disabled={remove.isLoading}>{jobId ? 'Save changes' : 'Create job'}</Button><Button disabled={save.isLoading || remove.isLoading} onClick={back}>Cancel</Button>
        {jobId && (isSuperAdmin(user?.user_type) || user?.user_type === 'sales_manager') && <Button danger disabled={save.isLoading || remove.isLoading} onClick={() => { remove.reset(); setDeleteOpen(true); }}>Delete job</Button>}
      </Space>
    </form>
    <SettingsDeleteModal title="Delete job" itemName={detail.data?.job_title || 'this job'} open={deleteOpen}
      loading={remove.isLoading} error={remove.isError ? errorMessage(remove.error) : null} onCancel={() => setDeleteOpen(false)}
      onConfirm={() => { if (!remove.isLoading) remove.mutate(); }} />
  </>;
}
