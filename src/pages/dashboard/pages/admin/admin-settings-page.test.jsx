import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('../../../shared/services/api.js', () => ({ default: { post: vi.fn(), get: vi.fn() } }));
vi.mock('../../../shared/store/user-store.js', () => ({ default: vi.fn() }));
import api from '../../../shared/services/api.js';
import { createCheckupDuration, listCheckupDurations } from './admin-settings-page.jsx';

beforeEach(() => vi.clearAllMocks());

it('creates a duration against the selected company for super admin', async () => {
  api.post.mockResolvedValue({ data: { status: true } });
  await createCheckupDuration(15, '9');
  expect(api.post).toHaveBeenCalledWith('/follow-up/checkup-duration', { duration_minutes: 15, company_id: 9 });
});

it('omits company ID for company admin', async () => {
  api.post.mockResolvedValue({ data: { status: true } });
  await createCheckupDuration(15);
  expect(api.post).toHaveBeenCalledWith('/follow-up/checkup-duration', { duration_minutes: 15 });
});

it('loads durations for the selected company', async () => {
  api.get.mockResolvedValue({ data: { results: [] } });
  await listCheckupDurations('9');
  expect(api.get).toHaveBeenCalledWith('/follow-up/checkup-duration-list', { params: { company_id: 9 } });
});

it('surfaces duplicate duration errors from the API', async () => {
  api.post.mockResolvedValue({ data: { status: false, message: 'A follow-up check duration already exists for this company. Update it instead.' } });
  await expect(createCheckupDuration(15, '9')).rejects.toThrow('A follow-up check duration already exists for this company. Update it instead.');
});
