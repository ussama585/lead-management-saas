// Only these Super Admin overview pages opt into company filtering.
const sections = new Set(['', 'user-management', 'sales-manager-listing', 'sales-executive-listing', 'leads', 'data-leads', 'meta-leads', 'follow-up', 'audit-history-list']);

export function companyFilterSection(role, pathname) {
  if (!['super_admin', 'admin'].includes(role)) return null;
  const match = pathname.match(/^\/(?:super-admin|admin)(?:\/(.*?))?\/?$/);
  const section = match?.[1]?.replace(/\/$/, '') ?? '';
  return match && sections.has(section) ? section || 'dashboard' : null;
}

export function selectedCompany(search) {
  const value = new URLSearchParams(search).get('company_id');
  return /^[1-9]\d*$/.test(value ?? '') ? value : null;
}

export function applyCompanyFilter(config, role, location) {
  const section = companyFilterSection(role, location.pathname);
  const companyId = selectedCompany(location.search);
  if (!section || !companyId || config.skipAuth || (config.method ?? 'get').toLowerCase() !== 'get') return config;
  // Never send tenant parameters to external systems, auth, mutations, or company options.
  if (!config.url?.startsWith('/') || config.url.startsWith('//')) return config;
  const path = config.url.split('?')[0].replace(/\/$/, '');
  const overview = /^\/(?:lead-generation|data-leads|meta-leads)\/[^/]+$/.test(path)
    && !/\/(?:create|update|conversion|bulk-)/.test(path);
  const people = /^\/(?:accounts\/(?:all-users|user-listing|user-count|users-for-assigning)|sales-(?:manager|executive)\/list|sales-(?:manager|executive)-stats|overall-users)$/.test(path);
  const dashboard = section === 'dashboard' && (path === '/admin-stats' || path.startsWith('/headhunting/') || /^\/[\w-]+$/.test(path));
  if (!overview && !people && !dashboard && !['/admin-stats', '/follow-up/user-list', '/activity/list'].includes(path)) return config;
  // URLSearchParams and object params are both used by existing services.
  if (config.params instanceof URLSearchParams) {
    config.params = new URLSearchParams(config.params);
    config.params.set('company_id', companyId);
  } else {
    config.params = { ...config.params, company_id: companyId };
  }
  return config;
}
