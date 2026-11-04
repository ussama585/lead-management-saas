export function leadOptionCompanyId(companyId) {
  const valid = value => /^[1-9]\d*$/.test(String(value ?? '')) ? String(value) : null;
  if (valid(companyId)) return valid(companyId);
  if (typeof window === 'undefined') return null;
  const selected = valid(new URLSearchParams(window.location.search).get('company_id'));
  if (selected) return selected;
  // Detail routes do not always include company data in the lead response.
  // Listing routes must remain disabled when their company filter is cleared.
  if (/\/(?:leads|meta-leads|data-lead)\/[^/]+\/?$/.test(window.location.pathname)) {
    try { return valid(sessionStorage.getItem('assignmentCompanyId')); } catch { return null; }
  }
  return null;
}
