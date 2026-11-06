import { beforeEach, expect, it, vi } from 'vitest';
import api from '../../../shared/services/api.js';
import { getAuditHistoryList, getActivityChanges } from './audit-history-list.jsx';
vi.mock('../../../shared/services/api.js', () => ({ default: { get: vi.fn() } }));
vi.mock('../../../shared/store/user-store.js', () => ({ default: vi.fn() }));
vi.mock('../../../../components/bootstrap-date-range-modal.component.jsx', () => ({ default: () => null }));
vi.mock('../../../../components/tables/new-table.jsx', () => ({ default: () => null }));
vi.mock('../../../shared/services/admin-graphs.js', () => ({ getAccountsAllUsers: vi.fn(), getHistoryModelNames: vi.fn() }));
beforeEach(() => vi.clearAllMocks());

it.each(['system_activity', 'user_accounts_activity'])('loads grouped %s with pagination and filters', async filterBy => {
  const data = { status: true, count: 1, results: [{ change_id: 'change-1', model_name: 'Meta Lead Job' }] };
  api.get.mockResolvedValue({ data });
  expect(await getAuditHistoryList({ filterBy, page: 2, size: 25, search: ' Ali ', modelName: 'Meta Lead Job',
    changedBy: ['1', '3'], startDate: '2026-11-01', endDate: '2026-11-06' })).toEqual(data);
  expect(api.get).toHaveBeenCalledWith('/activity/grouped-list', { params: {
    filter_by: filterBy, page: 2, size: 25, sort_by: 'changed_at', order: 'desc', search: 'Ali',
    model_name: 'Meta Lead Job', changed_by: '1,3', start_date: '2026-11-01', end_date: '2026-11-06',
  } });
});
it('defaults to system activity', async () => {
  api.get.mockResolvedValue({ data: { results: [], count: 0 } });
  await getAuditHistoryList();
  expect(api.get.mock.lastCall[1].params.filter_by).toBe('system_activity');
});
it('rejects unsuccessful or malformed results', async () => {
  api.get.mockResolvedValue({ data: { status: false, message: 'Denied' } });
  await expect(getAuditHistoryList()).rejects.toThrow('Denied');
  api.get.mockResolvedValue({ data: {} });
  await expect(getAuditHistoryList()).rejects.toThrow('Could not read');
});
it('keeps all changes belonging to one grouped activity', () => {
  const changes = [{ field: 'status', old: 'New', new: 'Active' }, { field: 'is_active', old: true, new: false }];
  expect(getActivityChanges({ changes })).toEqual(changes);
  expect(getActivityChanges({ change: changes[0] })).toEqual([changes[0]]);
  expect(getActivityChanges({ changes: { status: { old: 'New', new: 'Active' } } })).toEqual([changes[0]]);
  expect(getActivityChanges({ field_name: 'name', old_value: 'A', new_value: 'B' })).toEqual([{ field: 'name', old: 'A', new: 'B' }]);
});
