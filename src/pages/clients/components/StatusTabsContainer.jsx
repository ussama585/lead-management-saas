import React from 'react';
import StatusTabs from './StatusTabs.jsx';

/**
 * @deprecated Prefer importing StatusTabs and passing onTabChange.
 * Thin adapter for legacy callers that used onTabClick(tab).
 */
const StatusTabsContainer = ({
  tabs,
  activeTab,
  statusColors,
  onTabClick,
  loading = false,
  getCount,
}) => (
  <StatusTabs
    tabs={tabs}
    activeTab={activeTab}
    statusColors={statusColors}
    loading={loading}
    getCount={getCount}
    onTabChange={(value) => {
      const tab = tabs.find((t) => t.value === value);
      if (tab) onTabClick(tab);
    }}
  />
);

export default StatusTabsContainer;
