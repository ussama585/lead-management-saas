import { describe, expect, it, vi } from 'vitest';
import api from '../../../shared/services/api.js';
import { getWebsiteLeadDetail, getWebsiteLeadJobs, getWebsiteLeadJobHistory } from './lead-detail.jsx';
import { deleteWebsiteLeadJob, createWebsiteLeadFollowUp } from '../../../shared/services/leads.js';
vi.mock('../../../shared/services/api.js', () => ({ default: { get: vi.fn(), delete: vi.fn(), post: vi.fn() } }));
vi.mock('../../../shared/store/user-store.js', () => ({ default: () => ({ user: {} }) }));
vi.mock('../../../../components/lead-card.component.jsx', () => ({ default: () => null }));
vi.mock('../../../../components/status-history-modal.jsx', () => ({ default: () => null, createStatusHistoryColumn: vi.fn() }));
vi.mock('../../../../components/breadcrumb.component.jsx', () => ({ default: () => null }));
vi.mock('../../../clients/components/LazyModals.jsx', () => ({ ConfirmationModal: () => null }));
vi.mock('antd', () => ({ Alert: () => null, Spin: () => null, message: {}, Row: () => null, Col: () => null, Select: () => null, Modal: () => null, Input: () => null, Button: () => null }));
describe('Website Lead detail card API', () => {
  it('submits remarks and scheduling fields to the Website Lead follow-up endpoint', async () => {
    const payload = { current_followup_date: '2026-10-26T10:00:00Z', next_followup_date: '2026-10-27T15:30:00Z', is_next_followup_required: true, remarks: 'Follow up on the proposal.' };
    api.post.mockResolvedValue({ data: { success: true } });
    await createWebsiteLeadFollowUp(2, payload);
    expect(api.post).toHaveBeenLastCalledWith('/lead-generation/follow-up/2', payload);
  });
  it('reports follow-up API failures', async () => {
    api.post.mockResolvedValue({ data: { status: false, message: 'Invalid follow-up' } });
    await expect(createWebsiteLeadFollowUp(2, {})).rejects.toThrow('Invalid follow-up');
  });
  it('loads a job audit history using the job ID', async () => {
    const history = [{ change_id: 'change-1', model_name: 'LeadGenerationRequestJob', object_id: 2,
      changed_at: '2026-10-23T07:02:28Z', changed_by: 'admin@gmail.com', change: { field: 'job_title', old: 'Developer', new: 'Senior Developer' } }];
    api.get.mockResolvedValue({ data: history });
    expect(await getWebsiteLeadJobHistory(2)).toEqual(history);
    expect(api.get).toHaveBeenLastCalledWith('/lead-generation/job-history/2');
  });
  it.each([{ status: false }, { results: [] }])('rejects failed or malformed job histories', async data => {
    api.get.mockResolvedValue({ data });
    await expect(getWebsiteLeadJobHistory(2)).rejects.toThrow();
  });
  it('deletes a job through the shared job endpoint', async () => {
    api.delete.mockResolvedValue({ data: { message: 'Job deleted successfully' } });
    await expect(deleteWebsiteLeadJob(3, '  Position cancelled  ')).resolves.toEqual({ message: 'Job deleted successfully' });
    expect(api.delete).toHaveBeenLastCalledWith('/lead-generation/delete-job/3', { data: { delete_reason: 'Position cancelled' } });
  });
  it('loads the paginated jobs response from job-list using the parent lead ID', async () => {
    const data = { status: true, count: 1, next: null, previous: null, results: [{ id: 18, job_title: 'Python Developer' }] };
    api.get.mockResolvedValue({ data });
    expect(await getWebsiteLeadJobs('5', { page: 2, size: 25, search: 'Python & Django', sortBy: 'job_title', order: 'desc' })).toEqual(data);
    expect(api.get).toHaveBeenLastCalledWith('/lead-generation/job-list/5', { params: { page: 2, size: 25, search: 'Python & Django', sort_by: 'job_title', order: 'desc' } });
  });
  it.each([{ status: false, message: 'Forbidden' }, {}])('rejects failed job-list responses', async data => {
    api.get.mockResolvedValue({ data });
    await expect(getWebsiteLeadJobs(5)).rejects.toThrow();
  });
  it('requests by identifier and reads the flat detail response', async () => {
    const lead = { id: 3, identifier: 'expgrigu', company_name: 'Brother', job_count: 3, total_vacancies: 6 };
    api.get.mockResolvedValue({ data: lead });
    expect(await getWebsiteLeadDetail('expgrigu')).toEqual(lead);
    expect(api.get).toHaveBeenLastCalledWith('/lead-generation/detail/expgrigu');
  });
  it.each([{ status: false, message: 'Forbidden' }, {}, { id: 3 }])('rejects failed or malformed responses', async data => {
    api.get.mockResolvedValue({ data });
    await expect(getWebsiteLeadDetail('expgrigu')).rejects.toThrow();
  });
});
