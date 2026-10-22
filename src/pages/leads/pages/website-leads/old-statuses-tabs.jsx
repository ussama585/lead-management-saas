import React from 'react';
import { OLD_STATUSES } from './website-leads-constants.js';

const OldStatusesTabs = ({
  selectedStatus,
  setSelectedStatus,
  selectedExecutive,
  resetAllFilters,
  refetchCounts,
  refetch,
  setSearchParams,
  getStatusCount,
  leadCounts
}) => {
  return (
    <div style={{ marginTop: '16px', marginBottom: '16px', padding: '0 8px' }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '500', color: '#666' }}>Old Statuses</h4>
      <div className="client-tabs-container" style={{ borderRadius: '6px', padding: '8px' }}>
        <div className="client-tabs">
          {OLD_STATUSES.map((status) => {
            const count = getStatusCount(leadCounts, status.apiKey);
            const isSelected = selectedStatus === status.label;
            return (
              <button
                key={status.apiKey}
                className={`tab ${isSelected ? 'active' : ''}`}
                style={{
                  border: isSelected ? '1px solid #8c8c8c' : '1px solid #8c8c8c30',
                  borderRadius: '4px',
                  margin: '2px',
                  backgroundColor: isSelected ? '#8c8c8c' : '#8c8c8c15',
                  color: isSelected ? '#ffffff' : '#8c8c8c',
                  fontWeight: '500',
                  padding: '5px 10px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const newStatus = isSelected ? '' : status.label;
                  setSelectedStatus(newStatus);
                  // Reset all persistent filters (pagination, sorting, search, date range)
                  resetAllFilters();

                  // Update URL with status parameter (using label)
                  const params = {};
                  if (newStatus) params.status = newStatus;
                  if (selectedExecutive) params.executive = selectedExecutive;
                  setSearchParams(params);

                  // Refetch both counts and listing with the same query params
                  refetchCounts();
                  refetch();
                }}
              >
                {status.label} ({count})
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OldStatusesTabs;
