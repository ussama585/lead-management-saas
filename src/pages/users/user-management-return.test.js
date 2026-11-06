import { expect, it } from 'vitest';
import { userManagementReturnPath } from './user-management-return.js';

it.each(['admin', 'super_admin'])('returns %s to Company Users for a company user edit', role => {
  expect(userManagementReturnPath(role, { user_type: 'sales_manager', company_id: 8 }))
    .toBe('/super-admin/user-management?users_scope=company&company_id=8');
});
it('returns to the Super Admin tab for a super admin edit', () => {
  expect(userManagementReturnPath('super_admin', { user_type: 'super_admin' }))
    .toBe('/super-admin/user-management?users_scope=super_admin');
});
it('keeps company admin navigation unchanged', () => {
  expect(userManagementReturnPath('company_admin', { user_type: 'sales_manager', company_id: 8 }))
    .toBe('/company-admin/user-management');
});
