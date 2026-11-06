import { getRolePath } from '../auth/role-home.js';
import { isSuperAdmin } from '../auth/role-access.js';

export function userManagementReturnPath(viewerRole, editedUser) {
  const path = getRolePath(viewerRole, '/user-management');
  if (!isSuperAdmin(viewerRole)) return path;
  const params = new URLSearchParams({ users_scope: isSuperAdmin(editedUser?.user_type) ? 'super_admin' : 'company' });
  const companyId = editedUser?.company_id ?? editedUser?.company?.id ?? editedUser?.company;
  if (!isSuperAdmin(editedUser?.user_type) && /^[1-9]\d*$/.test(String(companyId ?? ''))) params.set('company_id', companyId);
  return `${path}?${params}`;
}
