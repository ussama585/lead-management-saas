import { it, expect, vi } from 'vitest';
import api from './api.js';
import { getLeadFilterCounts, leadCountTabs } from './lead-filter-counts.js';
vi.mock('./api.js', () => ({ default: { get: vi.fn() } }));
it('builds filters from API keys including new statuses and zero counts', () => {
  expect(leadCountTabs({ total_count: 4, assigned_count: 2, pending_contact: 2, custom_status: 0, unassigned: 2, success: true }))
    .toEqual([{ label: 'Pending Contact', value: 'Pending Contact', apiKey: 'pending_contact' }, { label: 'Custom Status', value: 'Custom Status', apiKey: 'custom_status' }, { label: 'Unassigned', value: 'Unassigned', apiKey: 'unassigned' }]);
});
it('loads the requested endpoint with active filters and unwraps counts', async () => {
  api.get.mockResolvedValue({ data: { success: true, data: { total_count: 3, activated: 3 } } });
  expect(await getLeadFilterCounts({ assigned_to: 8 })).toEqual({ total_count: 3, activated: 3 });
  expect(api.get).toHaveBeenLastCalledWith('/lead-generation/list-count', { params: { assigned_to: 8 } });
});
it('does not add hardcoded status filters', () => {
  expect(leadCountTabs({ total_count: 0 })).toEqual([]);
});
