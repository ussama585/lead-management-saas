import React from 'react';
import StatusTabButton from './StatusTabButton.jsx';

const DEFAULT_TAB_COLOR = '#8c8c8c';
const ALL_TAB_VALUE = 'All';

const defaultGetCount = (tab) => tab.count ?? 0;

const StatusTabs = ({
  tabs,
  activeTab,
  onTabChange,
  statusColors = {},
  loading = false,
  getCount = defaultGetCount,
}) => (
  <div className="client-tabs-container status-tabs-shell">
    <div className="client-tabs">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        const colorKey = tab.value === '' ? ALL_TAB_VALUE : tab.value;
        const statusColor = statusColors[colorKey] ?? statusColors[tab.value] ?? DEFAULT_TAB_COLOR;
        return (
          <StatusTabButton
            key={tab.key ?? tab.value}
            tab={tab}
            isActive={isActive}
            statusColor={statusColor}
            onClick={() => onTabChange(tab.value)}
            disabled={loading}
            count={getCount(tab)}
          />
        );
      })}
    </div>
  </div>
);

export default StatusTabs;
