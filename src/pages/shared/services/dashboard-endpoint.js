export function dashboardEndpoint(resource, userType) {
  if (['lead-status-distribute', 'total-lead-received', 'leads-status-health'].includes(resource)) {
    return `/accounts/${resource}`;
  }
  const prefixes = { company_admin: 'company-admin', sales_manager: 'sales-manager', sales_executive: 'sales-executive' };
  const companyLeadResources = new Set(['lead-stats', 'total-lead-received', 'lead-status-distribute', 'leads-mobilisation-amounts', 'leads-status-health']);
  if (['sales_manager', 'sales_executive'].includes(userType) && companyLeadResources.has(resource)) {
    return `/company-admin/${resource}`;
  }
  return `/${prefixes[userType] || 'accounts'}/${resource}`;
}
