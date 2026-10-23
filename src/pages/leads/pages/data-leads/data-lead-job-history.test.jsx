import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../../shared/services/api.js';
import { getDataLeadJobHistory } from './data-lead.jsx';

vi.mock('../../../shared/services/api.js', () => ({ default: { get: vi.fn() } }));
vi.mock('../../../shared/store/user-store.js', () => ({ default: () => ({ user: {} }) }));
vi.mock('../../../../components/lead-card.component.jsx', () => ({ default: () => null }));
vi.mock('../../../../components/settings-delete-modal.jsx', () => ({ default: () => null }));
vi.mock('../../../../components/breadcrumb.component.jsx', () => ({ default: () => null }));
vi.mock('../../../../components/status-history-modal.jsx', () => ({ default: () => null, createStatusHistoryColumn: vi.fn() }));
vi.mock('antd', () => ({ message: {}, Select: () => null, Modal: () => null, Input: () => null, Button: () => null }));

beforeEach(() => vi.clearAllMocks());
describe('data lead job history', () => {
  it('requests history with the job ID and keeps the audit response intact', async () => {
    const history = [{ change_id: 'change-1', model_name: 'DataLeadJob', object_id: 7,
      changed_at: '2026-10-22T09:51:47Z', changed_by: '', change: { field: 'is_active', old: null, new: 'Active' } }];
    api.get.mockResolvedValue({ data: history });
    expect(await getDataLeadJobHistory(7)).toEqual(history);
    expect(api.get).toHaveBeenCalledWith('/data-leads/job-history/7');
  });
  it('supports an empty history', async () => {
    api.get.mockResolvedValue({ data: [] });
    expect(await getDataLeadJobHistory(7)).toEqual([]);
  });
  it.each([{ status: false, message: 'Forbidden' }, { success: false }, { results: [] }])('rejects failed or malformed responses', async data => {
    api.get.mockResolvedValue({ data });
    await expect(getDataLeadJobHistory(7)).rejects.toThrow();
  });
});
