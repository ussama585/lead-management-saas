import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { listProjectSizes } from './project-size-service.js';
import useUserStore from '../store/user-store.js';

export function projectSizeOptions(rows) {
  return [...new Set((rows || []).map(row => row?.value?.trim()).filter(Boolean))]
    .map(value => ({ value, label: value }));
}

export default function useProjectSizeOptions({ enabled = true, companyId = null } = {}) {
  const { user } = useUserStore();
  const superAdmin = user?.user_type === 'super_admin';
  const selectedId = companyId ?? (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('company_id') : null);
  const query = useQuery(['settingsProjectSizes', user?.id, user?.user_type, superAdmin ? selectedId : null],
    () => listProjectSizes(superAdmin && selectedId ? { company_id: selectedId } : undefined), {
      enabled: enabled && Boolean(user) && (!superAdmin || Boolean(selectedId)), refetchOnWindowFocus: false,
    });
  const options = useMemo(() => projectSizeOptions(query.data), [query.data]);
  return { ...query, options, disabled: superAdmin && !selectedId };
}
