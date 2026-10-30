import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { listLeadStatuses } from './lead-status-service.js';
import useUserStore from '../store/user-store.js';

export function leadStatusNames(rows) {
  return [...new Set((rows || []).map(row => row?.name?.trim()).filter(Boolean))];
}

export default function useLeadStatusOptions() {
  const { user } = useUserStore();
  const query = useQuery(['settingsLeadStatuses', user?.id, user?.user_type], listLeadStatuses, {
    enabled: Boolean(user) && user.user_type !== 'super_admin', refetchOnWindowFocus: false,
  });
  const options = useMemo(() => leadStatusNames(query.data), [query.data]);
  return { ...query, options };
}
