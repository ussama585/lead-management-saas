import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, matchRoutes } from 'react-router-dom';
import api from '../../../shared/services/api.js';
import { createDataLeadJob, getDataLeadJob, updateDataLeadJob, deleteDataLeadJob, dataLeadJobFormValues, dataLeadJobPayload, emptyDataLeadJob } from './data-lead-job-create.jsx';
import { dataLeadJobSchema } from '../../schemas/data-lead-job-schema.js';
import { createRoleRoutes } from '../../../../layouts/role-routes.jsx';

vi.mock('../../../shared/services/api.js', () => ({ default: { post: vi.fn(), get: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
vi.mock('../../../shared/store/user-store.js', () => ({ default: () => ({ user: {} }) }));
beforeEach(() => vi.clearAllMocks());
const values = { ...emptyDataLeadJob, data_lead: 1, job_title: 'Senior Python Developer', number_of_vacancies: 3,
  job_type: 'Full-Time', employment_type: 'Remote', location_country: 'Pakistan', location_city: 'Lahore',
  job_description: 'Develop APIs.', min_experience: 3, max_experience: 6, min_salary: 150000, max_salary: 250000,
  cv_submission_deadline: '2026-11-15T23:59', expected_joining_date: '2026-12-01T09:00',
  degrees: [{ degree_name: 'Bachelor of Computer Science' }, { degree_name: 'Master of Computer Science' }],
  skills: [{ skill_name: 'Python', experience: 5, last_used: 0 }, { skill_name: 'Django', experience: 4, last_used: 0 }, { skill_name: 'PostgreSQL', experience: 3, last_used: 1 }],
};
describe('data lead job route and API', () => {
  it('registers the requested super admin route with its lead ID', () => {
    const definitions = createRoleRoutes(<Route path='/data-leads/create-job/:id' element={<div allowedRoles={['super_admin', 'sales_manager', 'sales_executive']} />} />, 'super_admin').map(route => route.props);
    expect(matchRoutes(definitions, '/super-admin/data-leads/create-job/42')[0].params.id).toBe('42');
  });
  it('posts all payload fields with numeric skills and timezone offsets', async () => {
    api.post.mockResolvedValue({ data: { status: true } });
    await createDataLeadJob(values);
    expect(api.post).toHaveBeenCalledWith('/data-leads/create-job', expect.objectContaining({
      data_lead: 1, degrees: values.degrees, skills: values.skills,
      cv_submission_deadline: '2026-11-15T23:59:00+05:00', expected_joining_date: '2026-12-01T09:00:00+05:00',
    }));
    expect(Object.keys(api.post.mock.calls[0][1]).sort()).toEqual(Object.keys(emptyDataLeadJob).sort());
  });
  it('preserves explicit offsets and zero values', () => {
    const payload = dataLeadJobPayload({ ...values, data_lead: '42', cv_submission_deadline: '2026-11-15T23:59:00+05:00',
      skills: [{ skill_name: 'Python', experience: '0', last_used: '0' }] });
    expect(payload).toMatchObject({ data_lead: 42, cv_submission_deadline: '2026-11-15T23:59:00+05:00', skills: [{ skill_name: 'Python', experience: 0, last_used: 0 }] });
  });
  it('rejects unsuccessful responses', async () => {
    api.post.mockResolvedValue({ data: { status: false, message: 'Invalid lead' } });
    await expect(createDataLeadJob(values)).rejects.toThrow('Invalid lead');
  });
  it('accepts the supplied three-skill structure', async () => {
    await expect(dataLeadJobSchema.validate(values)).resolves.toBeDefined();
  });
  it.each([{ data_lead: null }, { job_type: 'Freelance' }, { max_experience: 2 }, { max_salary: 100 },
    { skills: [{ skill_name: 'Python', experience: 12, last_used: 0 }] }, { skills: [{ skill_name: 'Python', experience: 1, last_used: 6 }] },
    { degrees: [{ degree_name: '' }] }])('validates IDs, choices, ranges and nested fields: %j', async changes => {
    await expect(dataLeadJobSchema.validate({ ...values, ...changes })).rejects.toThrow();
  });
});

describe('data lead job edit and delete', () => {
  it.each([{ id: 7, job_title: 'Developer' }, { data: { id: 7, job_title: 'Developer' }, status: true }])('reads flat and wrapped detail responses', async response => {
    api.get.mockResolvedValue({ data: response });
    expect(await getDataLeadJob(7)).toEqual({ id: 7, job_title: 'Developer' });
    expect(api.get).toHaveBeenCalledWith('/data-leads/update-job/7');
  });
  it('prefills the parent lead, nested arrays, and local times without resaving record IDs', () => {
    const result = dataLeadJobFormValues({ ...values, id: 7, cv_submission_deadline: '2026-11-15T18:59:00Z',
      expected_joining_date: '2026-12-01T04:00:00Z', skills: [{ id: 4, skill_name: 'Python', experience: 0, last_used: 0 }],
      degrees: [{ id: 8, degree_name: 'Computer Science' }] }, '42');
    expect(result).toMatchObject({ data_lead: 42, cv_submission_deadline: '2026-11-15T23:59', expected_joining_date: '2026-12-01T09:00',
      skills: [{ skill_name: 'Python', experience: 0, last_used: 0 }], degrees: [{ degree_name: 'Computer Science' }] });
    expect(dataLeadJobPayload(result).cv_submission_deadline).toBe('2026-11-15T23:59:00+05:00');
  });
  it('patches the same endpoint with the validated JSON shape', async () => {
    api.patch.mockResolvedValue({ data: { status: true } });
    await updateDataLeadJob(7, values);
    expect(api.patch).toHaveBeenCalledWith('/data-leads/update-job/7', dataLeadJobPayload(values));
  });
  it('deletes using the same endpoint without an unrequested request body', async () => {
    api.delete.mockResolvedValue({ data: { status: true } });
    await deleteDataLeadJob(7);
    expect(api.delete).toHaveBeenCalledWith('/data-leads/update-job/7');
  });
  it.each(['get', 'patch', 'delete'])('reports unsuccessful %s responses', async method => {
    api[method].mockResolvedValue({ data: { status: false, message: 'Not allowed' } });
    const request = method === 'get' ? getDataLeadJob(7) : method === 'patch' ? updateDataLeadJob(7, values) : deleteDataLeadJob(7);
    await expect(request).rejects.toThrow('Not allowed');
  });
});
