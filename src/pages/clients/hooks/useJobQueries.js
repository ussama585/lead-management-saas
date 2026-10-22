import { useQuery } from 'react-query';
import { getProjectJobList, getProjectJobListCount, getProjectInformation } from '../../shared/services/headhunting.js';
import api from '../../shared/services/api.js';
import { API_URL } from '../../shared/utils/api.js';

/**
 * Hook to fetch job counts for a project
 */
export const useJobCounts = (projectId) => {
  return useQuery(
    ['projectJobCounts', projectId],
    () => getProjectJobListCount(projectId),
    {
      enabled: !!projectId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 2,
      refetchOnMount: true,
    }
  );
};

/**
 * Hook to fetch project information (status, etc.)
 */
export const useProjectInfo = (projectId) => {
  return useQuery(
    ['projectInfo', projectId],
    () => getProjectInformation(projectId),
    {
      enabled: !!projectId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 2,
      refetchOnMount: true,
    }
  );
};

/**
 * Hook to fetch project details (for client ID navigation)
 */
export const useProjectDetails = (projectId) => {
  return useQuery(
    ['projectDetails', projectId],
    () => api.get(`/headhunting/update-project/${projectId}`).then(res => res.data),
    {
      enabled: !!projectId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 2,
      refetchOnMount: true,
    }
  );
};

/**
 * Hook to fetch jobs list for a project
 */
export const useJobsList = (projectId, selectedTab, pagination, sorting, globalFilter) => {
  // Serialize sorting state for proper cache invalidation
  const sortField = sorting && sorting.length > 0 && sorting[0]?.id ? sorting[0].id : null;
  const sortDirection = sorting && sorting.length > 0 && sorting[0]?.desc !== undefined ? sorting[0].desc : null;

  return useQuery(
    [
      'projectJobs',
      projectId,
      selectedTab,
      pagination.pageIndex,
      pagination.pageSize,
      sortField,
      sortDirection,
      globalFilter
    ],
    () => {
      const statusParam = selectedTab === 'All' ? null : selectedTab;
      return getProjectJobList(
        projectId,
        statusParam,
        pagination.pageIndex + 1,
        pagination.pageSize,
        sorting,
        globalFilter,
      );
    },
    {
      enabled: !!projectId,
      staleTime: 30 * 1000, // 30 seconds
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );
};

