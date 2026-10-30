import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { listProjectSizes } from './project-size-service.js';
import useUserStore from '../store/user-store.js';

export function projectSizeOptions(rows) {
  return [...new Set((rows || []).map(row => row?.value?.trim()).filter(Boolean))]
    .map(value => ({ value, label: value }));
}

export default function useProjectSizeOptions() {
  const { user } = useUserStore();
  const query = useQuery(['settingsProjectSizes', user?.id, user?.user_type], listProjectSizes, {
    enabled: Boolean(user) && user.user_type !== 'super_admin', refetchOnWindowFocus: false,
  });
  const options = useMemo(() => projectSizeOptions(query.data), [query.data]);
  return { ...query, options };
}
