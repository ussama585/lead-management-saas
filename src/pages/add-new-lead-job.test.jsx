import { describe, expect, it, vi } from 'vitest';
import api from './shared/services/api.js';
import { createWebsiteLeadJob } from './add-new-lead-job.jsx';
vi.mock('./shared/services/api.js', () => ({ default: { post: vi.fn() } }));
vi.mock('./shared/store/user-store.js', () => ({ default: () => ({ user: {} }) }));
vi.mock('../components/job-form.component.jsx', () => ({ default: () => null }));
vi.mock('../components/breadcrumb.component.jsx', () => ({ default: () => null }));
vi.mock('antd', () => ({ message: {} }));
describe('Website Lead job creation', () => {
  it('posts the parent ID and job fields to the documented endpoint', async () => {
    api.post.mockResolvedValue({ data: { status: true } });
    await createWebsiteLeadJob({ lead_generation_request: '3', job_title: 'Developer', number_of_vacancies: '2', min_experience: '0',
      department: 'Engineering', working_days: 'Monday-Friday', working_days_from: 'Monday', years_of_experience: null,
      degrees: [{ id: 1, degree_name: 'Software Engineering' }], skills: [{ id: 9, skill_name: 'Python', experience: '3', last_used: '0' }] });
    expect(api.post).toHaveBeenLastCalledWith('/lead-generation/create-job', {
      lead_generation_request: 3, job_title: 'Developer', number_of_vacancies: 2, min_experience: 0, department: 'Engineering', working_days: 'Monday-Friday',
      degrees: [{ degree_name: 'Software Engineering' }], skills: [{ skill_name: 'Python', experience: 3, last_used: 0 }],
    });
  });
  it('rejects an invalid parent lead', async () => {
    await expect(createWebsiteLeadJob({ lead_generation_request: 'invalid' })).rejects.toThrow('valid website lead');
  });
  it('reports an unsuccessful API response', async () => {
    api.post.mockResolvedValue({ data: { status: false, message: 'Invalid job' } });
    await expect(createWebsiteLeadJob({ lead_generation_request: 3 })).rejects.toThrow('Invalid job');
  });
});
