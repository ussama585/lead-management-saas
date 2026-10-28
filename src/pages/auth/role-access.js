import { getRoleHome } from './role-home.js';

// Keep API role names intact; legacy admin screens still use the /admin URLs.
export const ADMIN_ROLES = ['admin', 'super_admin', 'company_admin'];

// The API returns `admin` for super admins. Both names represent the same role.
export function isSuperAdmin(role) {
  return role === 'admin' || role === 'super_admin';
}

export function canManageLeadStatuses(role) {
  return role === 'company_admin';
}

export function canManageProjectSizes(role) {
  return role === 'company_admin';
}

// These modules are excluded from the super admin workspace. Other roles keep
// their existing navigation until their permission lists are defined.
const SUPER_ADMIN_REMOVED_MENU_KEYS = new Set(['19', '6', '13', '25', '8', '18', '22', '24', '14', '16', '23']);
const COMPANY_ADMIN_MENU_KEYS = new Set(['1', '20', '10', '15', '9', '17', '11', '2', '3', '4', '21']);
const SALES_MANAGER_MENU_KEYS = new Set(['1', '10', '15', '9', '17', '11', '4']);
const SALES_EXECUTIVE_MENU_KEYS = new Set(['1', '10', '15', '9', '17']);
const SUPER_ADMIN_REMOVED_PATHS = [
  /^\/(?:[^/]+\/)?(?:main-stats|main-leads|meta-pending|meta-spending(?:-[^/]+)?)(?:\/|$)/,
  /^\/(?:[^/]+\/)?(?:project-listing(?:-page)?|project-detail|project-application|project-payments|deleted-projects|projects)(?:\/|$)/,
  /^\/(?:[^/]+\/)?(?:headhunting-client|client-head-hunting|deleted-clients|edit-client)(?:\/|$)/,
  /^\/(?:[^/]+\/)?(?:(?:add-new|edit)-(?:client|project|job)-headhunting|(?:saas-)?job-headhunting)(?:\/|$)/,
  /^\/(?:[^/]+\/)?(?:job-description-request|jobs|deleted-jobs|invoices|deliverables)(?:\/|$)/,
  /^\/(?:[^/]+\/)?(?:resumes|resume-upload|cv-listing|profile-listing|candidate-listings)(?:\/|$)/,
  /^\/(?:[^/]+\/)?(?:(?:add-|edit-)?google-form|screening-forms|available-questionnaires|response-analysis)(?:\/|$)/,
];

export function canAccessMenu(role, key) {
  if (key === '26' || key === '27') return isSuperAdmin(role);
  if (role === 'company_admin') return COMPANY_ADMIN_MENU_KEYS.has(key);
  if (role === 'sales_manager') return SALES_MANAGER_MENU_KEYS.has(key);
  if (role === 'sales_executive') return SALES_EXECUTIVE_MENU_KEYS.has(key);
  return !isSuperAdmin(role) || !SUPER_ADMIN_REMOVED_MENU_KEYS.has(key);
}

export function getLayoutRole(role) {
  return ADMIN_ROLES.includes(role) ? 'admin' : role;
}

export function canAccessRoute(role, allowedRoles = [], pathname = '') {
  if (!getRoleHome(role)) return false;
  const prefix = pathname.match(/^\/(super-admin|company-admin|sales-manager|sales-executive|data-entry-executive)(?=\/|$)/)?.[0];
  if (prefix && prefix !== getRoleHome(role)) return false;
  if (/^\/(?:super-admin|admin)\/demo-requests(?:\/|$)/.test(pathname) && !isSuperAdmin(role)) return false;
  if (/^\/(?:super-admin|admin)\/companies(?:\/|$)/.test(pathname) && !isSuperAdmin(role)) return false;
  if (isSuperAdmin(role) && SUPER_ADMIN_REMOVED_PATHS.some(pattern => pattern.test(pathname))) return false;
  return allowedRoles.includes(role) ||
    (isSuperAdmin(role) && allowedRoles.some(isSuperAdmin)) ||
    (ADMIN_ROLES.includes(role) && allowedRoles.includes('admin'));
}
