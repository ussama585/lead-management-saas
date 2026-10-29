export function dashboardEndpoint(resource, userType) {
  const prefixes = { company_admin: 'company-admin', sales_manager: 'sales-manager', sales_executive: 'sales-executive' };
  return `/${prefixes[userType] || 'accounts'}/${resource}`;
}
