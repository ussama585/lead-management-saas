import { describe, it, expect, vi } from 'vitest';
import api from '../pages/shared/services/api.js';
import { reassignMetaLead } from '../pages/shared/services/metaLeads.js';
import { updateMetaLeadStatus } from '../pages/shared/services/headhunting.js';

vi.mock('../pages/shared/services/api.js', () => ({ default: { patch: vi.fn() } }));

describe('Meta Lead detail card update endpoints', () => {
  it('sends status and remarks to the Meta Lead status endpoint', async () => {
    api.patch.mockResolvedValue({ data: { success: true } });
    await updateMetaLeadStatus(7, { status: 'SaaS Client', remarks: 'Discussed requirements' });
    const [path, payload] = api.patch.mock.lastCall;
    expect(path).toBe('/meta-leads/update-status/7');
    expect(Object.fromEntries(payload)).toEqual({ status: 'SaaS Client', remarks: 'Discussed requirements' });
  });
  it('sends selected assignee user ID to the Meta Lead endpoint', async () => {
    api.patch.mockResolvedValue({ data: { success: true } });
    await reassignMetaLead(7, 25);
    expect(api.patch).toHaveBeenLastCalledWith('/meta-leads/lead/7', { assigned_to: 25 });
  });
});
vi.mock('../pages/shared/store/user-store.js', () => ({ default: { getState: () => ({ user: {} }) } }));
