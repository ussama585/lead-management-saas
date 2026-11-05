import { leadOptionCompanyId } from './lead-option-company.js';

export function leadModalCompanyPayload(user, lead) {
  if (user?.user_type !== 'super_admin') return {};
  const companyId = leadOptionCompanyId(lead?.company_id ?? lead?.company?.id ?? lead?.company);
  return companyId ? { company_id: Number(companyId) } : {};
}
