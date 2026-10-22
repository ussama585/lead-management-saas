import { useQuery } from 'react-query';
import { 
  getClientDetails, 
  getClientProjectListCount, 
  getClientProjectsList, 
  getAssignRecruiterList 
} from '../../shared/services/headhunting.js';

/**
 * Hook for fetching client details
 */
export const useClientDetails = (clientId) => {
  return useQuery(
    ['clientDetails', clientId],
    () => getClientDetails(clientId),
    {
      enabled: !!clientId,
      staleTime: 10 * 60 * 1000,
      cacheTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );
};

/**
 * Hook for fetching project counts by status
 */
export const useProjectCounts = (clientId) => {
  return useQuery(
    ['clientProjectCounts', clientId],
    () => getClientProjectListCount(clientId),
    {
      enabled: !!clientId,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );
};

/**
 * Hook for fetching projects list with filters, pagination, and sorting
 */
export const useProjectsList = (clientId, selectedTab, pagination, sorting, globalFilter) => {
  // Serialize sorting state for proper cache invalidation
  const sortField = sorting && sorting.length > 0 && sorting[0]?.id ? sorting[0].id : null;
  const sortDirection = sorting && sorting.length > 0 && sorting[0]?.desc !== undefined ? sorting[0].desc : null;

  return useQuery(
    [
      'clientProjects',
      clientId,
      selectedTab,
      pagination.pageIndex,
      pagination.pageSize,
      sortField, // Serialized sorting field
      sortDirection, // Serialized sorting direction
      globalFilter
    ],
    () => {
      const statusParam = selectedTab === 'All' ? null : selectedTab;
      return getClientProjectsList(
        clientId,
        statusParam,
        pagination.pageIndex + 1,
        pagination.pageSize,
        sorting,
        globalFilter,
      );
    },
    {
      enabled: !!clientId,
      staleTime: 0, // Always consider data stale - ensures fresh data on every change
      cacheTime: 0, // Don't cache - ensures sorting changes trigger immediate refetch
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    }
  );
};

/**
 * Hook for fetching recruiter list for project assignment
 */
export const useRecruiterList = (onSuccess) => {
  return useQuery('recruiterListForProjectClient', getAssignRecruiterList, {
    onSuccess,
    staleTime: 5 * 60 * 1000, // 5 minutes - recruiters don't change frequently
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    refetchOnMount: true, // Only refetch when component mounts
  });
};

