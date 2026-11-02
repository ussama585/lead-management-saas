import { expect, it, vi } from 'vitest';
import api from './api.js';
import { removeUserAssignments } from './leads.js';
vi.mock('./api.js', () => ({ default: { delete: vi.fn() } }));

it('sends the removed assignee IDs in the DELETE request body', async () => {
  api.delete.mockResolvedValue({ data: { status: true, message: 'Removed' } });
  await expect(removeUserAssignments([8])).resolves.toEqual({ status: true, message: 'Removed' });
  expect(api.delete).toHaveBeenCalledWith('/lead-generation/remove-users-assign', { data: { user_ids: [8] } });
});
