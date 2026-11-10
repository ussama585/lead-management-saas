import { afterEach, expect, it, vi } from 'vitest';
import useUserStore from '../store/user-store.js';
import { assignmentEndpoint } from './assignment-endpoint.js';

vi.mock('../store/user-store.js', () => ({ default: { getState: vi.fn() } }));
afterEach(() => vi.unstubAllGlobals());

it.each(['company_admin', 'sales_manager'])('keeps executive-only requests separate from profile requests for %s', role => {
  useUserStore.getState.mockReturnValue({ user: { user_type: role } });
  expect(assignmentEndpoint()).toBe('/accounts/users-for-assigning?user_type=sales_executive');
  expect(assignmentEndpoint(null, { omitUserType: true })).toBe('/accounts/users-for-assigning');
});

it('preserves company scope without restricting profile assignee roles', () => {
  useUserStore.getState.mockReturnValue({ user: { user_type: 'super_admin' } });
  expect(assignmentEndpoint(9)).toBe('/accounts/users-for-assigning?user_type=sales_executive&company_id=9');
  expect(assignmentEndpoint(9, { omitUserType: true })).toBe('/accounts/users-for-assigning?company_id=9');
});
