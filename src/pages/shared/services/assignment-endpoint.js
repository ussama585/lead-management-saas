import useUserStore from '../store/user-store.js';

export function assignmentEndpoint(companyId = null, { omitUserType = false } = {}) {
  const role = useUserStore.getState().user?.user_type;
  const base = '/accounts/users-for-assigning' + (omitUserType ? '' : '?user_type=sales_executive');
  if (role === 'company_admin') return base;
  if (role === 'super_admin' || role === 'admin') {
    let savedCompanyId = null;
    try { savedCompanyId = sessionStorage.getItem('assignmentCompanyId'); } catch { /* Storage may be unavailable. */ }
    const selectedId = companyId ?? (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('company_id') : null) ?? savedCompanyId;
    return /^[1-9]\d*$/.test(String(selectedId ?? '')) ? `${base}${omitUserType ? '?' : '&'}company_id=${encodeURIComponent(selectedId)}` : base;
  }
  return base;
}
