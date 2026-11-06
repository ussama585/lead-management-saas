import { beforeEach, expect, it, vi } from 'vitest';
import api from '../pages/shared/services/api.js';
import { getActivityDetail } from './activity-detail-modal.jsx';
vi.mock('../pages/shared/services/api.js', () => ({ default: { get: vi.fn() } }));
vi.mock('../pages/shared/store/user-store.js', () => ({ default: vi.fn() }));
beforeEach(() => vi.clearAllMocks());

it('requests activity details using change_id and unwraps the response', async () => {
  const detail = { change_id: '80fc4a2f-8dc8-453d-a3c7-fd40310e87bc', model_name: 'Company Project Choices',
    object_id: 47, summary: 'Created a project size', fields: [{ field_name: 'Value', old_value: null, new_value: '145K' }] };
  api.get.mockResolvedValue({ data: { status: true, data: detail } });
  expect(await getActivityDetail(detail.change_id)).toEqual(detail);
  expect(api.get).toHaveBeenCalledWith(`/activity/detail/${detail.change_id}`);
});
it('does not request details without a change ID', async () => {
  await expect(getActivityDetail(null)).rejects.toThrow('change ID');
  expect(api.get).not.toHaveBeenCalled();
});
it('reports unsuccessful and malformed responses', async () => {
  api.get.mockResolvedValue({ data: { status: false, message: 'Not allowed' } });
  await expect(getActivityDetail('change-1')).rejects.toThrow('Not allowed');
  api.get.mockResolvedValue({ data: { status: true, data: {} } });
  await expect(getActivityDetail('change-1')).rejects.toThrow('Could not read');
});
