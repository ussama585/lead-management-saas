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

export function getRolePath(role, path = '') {
  const home = getRoleHome(role);
  if (!home || !path.startsWith('/') || path.startsWith('//')) return path;
  const slug = path.replace(/^\/(?:admin|super-admin|company-admin|sales-manager|sales-executive|data-entry-executive)(?=\/|$)/, '');
  return `${home}${slug === '/' ? '' : slug}`;
}
