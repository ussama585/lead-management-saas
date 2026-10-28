import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api.js';
import { createDataLeadFollowUp } from './data-leads-service.js';
import { createMetaLeadFollowUp } from './metaLeads.js';
import { createWebsiteLeadFollowUp } from './leads.js';

vi.mock('./api.js', () => ({ default: { post: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());

describe.each([
  ['Data', createDataLeadFollowUp],
  ['Meta', createMetaLeadFollowUp],
  ['Website', createWebsiteLeadFollowUp],
])('%s lead follow-up submission', (_name, submit) => {
  it('posts remarks and scheduling fields to the lead follow-up endpoint', async () => {
    const payload = { current_followup_date: '2026-10-29T10:00:00', next_followup_date: null, is_next_followup_required: false, remarks: 'Called client' };
    api.post.mockResolvedValue({ data: { success: true } });
    await submit(12, payload);
    expect(api.post).toHaveBeenCalledWith('/lead-generation/follow-up/12', payload);
  });
  it('rejects unsuccessful responses', async () => {
    api.post.mockResolvedValue({ data: { success: false, message: 'Unable to save' } });
    await expect(submit(12, {})).rejects.toThrow('Unable to save');
  });
});
