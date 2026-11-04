import { leadOptionCompanyId } from '../utils/lead-option-company.js';
import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { listLeadStatuses } from './lead-status-service.js';
import useUserStore from '../store/user-store.js';

export function leadStatusNames(rows) {
  return [...new Set((rows || []).map(row => row?.name?.trim()).filter(Boolean))];
}

export default function useLeadStatusOptions({ enabled = true, companyId = null } = {}) {
  const { user } = useUserStore();
  const superAdmin = user?.user_type === 'super_admin';
  const selectedId = leadOptionCompanyId(companyId);
  const query = useQuery(['settingsLeadStatuses', user?.id, user?.user_type, superAdmin ? selectedId : null],
    () => listLeadStatuses(superAdmin && selectedId ? { company_id: selectedId } : undefined), {
      enabled: enabled && Boolean(user) && (!superAdmin || Boolean(selectedId)), refetchOnWindowFocus: false, staleTime: 60000, retry: 1,
    });
  const options = useMemo(() => leadStatusNames(query.data), [query.data]);
  return { ...query, options, disabled: superAdmin && !selectedId };
}
