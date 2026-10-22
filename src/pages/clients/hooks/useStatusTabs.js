import { useMemo } from 'react';

/**
 * Custom hook for generating status tabs with counts
 * Supports different entity types (clients, projects, jobs)
 */
export const useStatusTabs = (counts, baseTabsConfig, includeTotalTab = true) => {
  return useMemo(() => {
    // Generate base tabs with counts
    const baseTabs = baseTabsConfig.map(tab => ({
      ...tab,
      count: counts?.[tab.countKey] || 0
    }));
    
    // Calculate total count if needed
    if (includeTotalTab) {
      const totalCount = counts?.total || 
        baseTabs.reduce((sum, tab) => sum + (tab.count || 0), 0);
      
      return [
        { label: 'All', value: 'All', count: totalCount },
        ...baseTabs
      ];
    }
    
    return baseTabs;
  }, [counts, baseTabsConfig, includeTotalTab]);
};

