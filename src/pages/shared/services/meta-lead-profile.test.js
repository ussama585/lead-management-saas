import { expect, it, vi } from 'vitest';
import api from './api.js';
import { updateMetaLead } from './metaLeads.js';

vi.mock('./api.js', () => ({ default: { patch: vi.fn() } }));
vi.mock('./assignment-endpoint.js', () => ({ assignmentEndpoint: () => '/accounts/users-for-assigning' }));

it('patches profile information using the meta lead endpoint', async () => {
  const payload = { full_name: 'Ali', company_name: 'Company', phone_number: '03001234567', work_email: 'ali@example.com', job_title: 'Manager' };
  api.patch.mockResolvedValue({ data: { status: true } });
  await expect(updateMetaLead(payload, 7)).resolves.toEqual({ status: true });
  expect(api.patch).toHaveBeenCalledWith('/meta-leads/lead/7', payload);
});
