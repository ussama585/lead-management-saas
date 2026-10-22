export const roleHome = {
  super_admin: '/super-admin',
  company_admin: '/company-admin',
  sales_manager: '/sales-manager',
  sales_executive: '/sales-executive',
  data_entry_executive: '/data-entry-executive',
};

export const USER_TYPES = Object.keys(roleHome);

export function getRoleHome(role) {
  // Older API responses use admin for the same super admin role.
  const normalized = role === 'admin' ? 'super_admin' : role;
  return Object.hasOwn(roleHome, normalized) ? roleHome[normalized] : undefined;
}
