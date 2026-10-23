import { useQuery, useQueries } from 'react-query';
import {
  getClientCount,
  getClientsList,
  getClientsListOfExecutive,
  getClientCountForExecutive,
  getHeadhuntingClientStatsLevel1,
  getHeadhuntingClientStatsLevel2,
  getHeadhuntingClientStatsLevel3,
  getHeadhuntingClientStatsLevel4,
} from '../../shared/services/headhunting.js';
import { getManangersExecutives } from '../../shared/services/users-service.js';

/**
 * Hook for fetching client counts for tabs (optionally filtered by executive id, sales_manager, sales_executive)
 */
export const useClientCounts = (selectedExecutiveId = '', selectedManagerId = '', selectedRecruitmentManagerId = '', selectedRecruitmentExecutiveId = '', recruiter = '') => {
  return useQuery(
    ['headhuntingClientCounts', selectedExecutiveId, selectedManagerId, selectedRecruitmentManagerId, selectedRecruitmentExecutiveId, recruiter],
    () => {
      const sales_manager = selectedManagerId || '';
      const sales_executive = selectedExecutiveId || '';
      const recruitment_manager = selectedRecruitmentManagerId || '';
      const recruitment_executive = selectedRecruitmentExecutiveId || '';
      if (selectedExecutiveId) {
        return getClientCountForExecutive(selectedExecutiveId, sales_manager, sales_executive, recruitment_manager, recruitment_executive, recruiter);
      }
      return getClientCount(sales_manager, sales_executive, recruitment_manager, recruitment_executive, recruiter);
    },
    {
      staleTime: 1 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false
    }
  );
};

/**
 * Hook for fetching client list with filters, pagination, and sorting (optionally filtered by executive id, sales_manager, sales_executive)
 */
export const useClientsList = (selectedStatus, pagination, sorting, globalFilter, selectedExecutiveId = '', selectedManagerId = '', selectedRecruitmentManagerId = '', selectedRecruitmentExecutiveId = '', recruiter = '') => {
  const sales_manager = selectedManagerId || '';
  const sales_executive = selectedExecutiveId || '';
  const recruitment_manager = selectedRecruitmentManagerId || '';
  const recruitment_executive = selectedRecruitmentExecutiveId || '';
  return useQuery(
    [
      'headhuntingClients',
      selectedStatus,
      pagination.pageIndex,
      pagination.pageSize,
      globalFilter,
      sorting?.[0]?.['id'],
      sorting?.[0]?.['desc'],
      selectedExecutiveId,
      selectedManagerId,
      selectedRecruitmentManagerId,
      selectedRecruitmentExecutiveId,
      recruiter,
    ],
    () => {
      const page = pagination.pageIndex + 1;
      const pageSize = pagination.pageSize;
      if (selectedExecutiveId) {
        return getClientsListOfExecutive(selectedExecutiveId, selectedStatus, page, pageSize, sorting, globalFilter, sales_manager, sales_executive, recruitment_manager, recruitment_executive, recruiter);
      }
      return getClientsList('', selectedStatus, page, pageSize, sorting, globalFilter, sales_manager, sales_executive, recruitment_manager, recruitment_executive, recruiter);
    },
    {
      keepPreviousData: true,
      staleTime: 0,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: true
    }
  );
};

/**
 * Maps selection value from UI to API tab and id.
 * - '' or "All" → tab=All, no id
 * - numeric id (e.g. "13") → tab=SalesManager, id=13
 * - Others → tab=Others, no id
 * - Unassigned → tab=Unassigned, no id
 */
function selectionToTabAndId(selection) {
  if (selection == null || selection === '') return { tab: 'All', id: '' };
  const s = String(selection).trim();
  if (/^\d+$/.test(s)) return { tab: 'SalesManager', id: s };
  const lower = s.toLowerCase();
  if (lower === '_others' || lower === 'others') return { tab: 'Others', id: '' };
  if (lower === '_unassigned' || lower === 'unassigned') return { tab: 'Unassigned', id: '' };
  return { tab: 'All', id: '' };
}

/**
 * Hook for headhunting client stats - fetches 4 level APIs (one per row: Sales Managers, Sales Executives, Recruitment Managers, Recruitment Executives)
 * When level 1 tab changes, levels 2–4 are refetched; when level 2 changes, levels 3–4 refetch; when level 3 changes, level 4 refetches.
 * Sends tab (All | SalesManager | Others | Unassigned) and id only when a specific manager/executive is selected (tab=SalesManager).
 * Level 3 (Recruitment Managers) and Level 4 (Recruitment Executives) are always called with default tab=All when their selection is empty.
 * Only runs when enabled is true (e.g. when user is admin); pass false for non-admin to skip these APIs.
 */
export const useHeadhuntingClientStats = (selectedManagerId = '', selectedExecutiveId = '', selectedRecruitmentManagerId = '', enabled = true) => {
  const level2Params = selectionToTabAndId(selectedManagerId);
  const level3Params = selectionToTabAndId(selectedExecutiveId);
  const level4Params = selectionToTabAndId(selectedRecruitmentManagerId);

  const results = useQueries([
    {
      queryKey: ['headhuntingClientStatsLevel1'],
      queryFn: getHeadhuntingClientStatsLevel1,
      enabled,
      staleTime: 1 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    {
      queryKey: ['headhuntingClientStatsLevel2', selectedManagerId],
      queryFn: () => getHeadhuntingClientStatsLevel2(level2Params.tab, level2Params.id),
      enabled,
      staleTime: 1 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    {
      queryKey: ['headhuntingClientStatsLevel3', selectedExecutiveId],
      queryFn: () => getHeadhuntingClientStatsLevel3(level3Params.tab || 'All', level3Params.id || ''),
      enabled,
      staleTime: 1 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    {
      queryKey: ['headhuntingClientStatsLevel4', selectedRecruitmentManagerId],
      queryFn: () => getHeadhuntingClientStatsLevel4(level4Params.tab || 'All', level4Params.id || ''),
      enabled,
      staleTime: 1 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  ]);

  const [q1, q2, q3, q4] = results;
  return {
    dataLevel1: q1.data,
    dataLevel2: q2.data,
    dataLevel3: q3.data,
    dataLevel4: q4.data,
    isLoading: q1.isLoading || q2.isLoading || q3.isLoading || q4.isLoading,
    isFetching: q1.isFetching || q2.isFetching || q3.isFetching || q4.isFetching,
  };
};

/**
 * Hook for fetching assignable users (managers and executives) for recruiter dropdown
 */
export const useAssignableUsers = (userType) => {
  return useQuery({
    queryKey: ['executiveList', userType],
    queryFn: () => getManangersExecutives(userType),
    enabled: userType === 'super_admin' || userType === 'sales_manager',
    staleTime: 1 * 60 * 1000, // Reduced from 10 min to 1 min
    cacheTime: 5 * 60 * 1000, // Reduced from 15 min to 5 min
    refetchOnWindowFocus: false,
  });
};

