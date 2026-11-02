import { expect, it, vi } from 'vitest';
import api from '../pages/shared/services/api.js';
import { resetUserPassword } from './reset-user-password-dialog.jsx';
import { resetUserPasswordSchema } from '../pages/users/schemas/reset-user-password-schema.js';
vi.mock('../pages/shared/services/api.js', () => ({ default: { post: vi.fn() } }));

it('resets the selected user by slug without sending an old password', async () => {
  api.post.mockResolvedValue({ data: { status: true } });
  await resetUserPassword('selected-user', { new_password: 'new-secret', confirm_password: 'new-secret' });
  expect(api.post).toHaveBeenLastCalledWith('/accounts/change-password', {
    user_slug: 'selected-user', new_password: 'new-secret', confirm_password: 'new-secret',
  });
});
it('does not send a request without a user slug', async () => {
  api.post.mockClear();
  await expect(resetUserPassword(undefined, {})).rejects.toThrow('User slug is missing');
  expect(api.post).not.toHaveBeenCalled();
});
it('keeps API failure messages', async () => {
  api.post.mockResolvedValue({ data: { status: false, message: 'Reset denied' } });
  await expect(resetUserPassword('selected-user', {})).rejects.toThrow('Reset denied');
});
it('requires matching passwords with at least eight characters', async () => {
  await expect(resetUserPasswordSchema.validate({ new_password: 'password123', confirm_password: 'password123' })).resolves.toBeTruthy();
  await expect(resetUserPasswordSchema.validate({ new_password: 'password123', confirm_password: 'different' })).rejects.toThrow('match');
  await expect(resetUserPasswordSchema.validate({ new_password: 'short', confirm_password: 'short' })).rejects.toThrow('8 characters');
});
