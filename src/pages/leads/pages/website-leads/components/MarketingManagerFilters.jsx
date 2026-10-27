import { Select } from '../../../../../components/ui/app-select.jsx';
import React from 'react';


/**
 * Marketing Manager Filters Component
 * Displays multiple selection dropdowns for Executive and Status filters
 * with pills/chips display for selected items
 */
const MarketingManagerFilters = ({
  executivesList = [],
  statusTabs = [],
  selectedExecutive = [],
  selectedStatus = [],
  onExecutiveChange,
  onStatusChange,
  getExecutiveCount,
  getStatusCount,
  leadCounts = {},
  userType = 'marketing_manager',
}) => {
  // Normalize values to arrays
  const executiveValue = Array.isArray(selectedExecutive) 
    ? selectedExecutive 
    : (selectedExecutive ? [selectedExecutive] : []);
  
  const statusValue = Array.isArray(selectedStatus) 
    ? selectedStatus 
    : (selectedStatus ? [selectedStatus] : []);

  return (
    <div style={{ 
      display: 'flex', 
      gap: '16px', 
      marginBottom: '16px', 
      padding: '0 20px', 
      flexWrap: 'wrap', 
      alignItems: 'center' 
    }}>
      {/* Executive Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontWeight: '500', fontSize: '14px' }}>Executive:</span>
        <Select
          mode="multiple"
          style={{ width: 'fit-content', minWidth: '200px' }}
          value={executiveValue}
          onChange={onExecutiveChange}
          placeholder="Select Executive(s)"
          allowClear
          showSearch
          optionFilterProp="children"
          popupMatchSelectWidth={false}
          maxTagCount="responsive"
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        >
          {executivesList.map(executive => {
            const executiveCount = getExecutiveCount ? getExecutiveCount(executive.id) : 0;
            return (
              <Select.Option 
                key={executive.id} 
                value={executive.id.toString()}
                label={executive.name || executive.label || 'Executive'}
              >
                {executive.name || executive.label || 'Executive'} ({executiveCount})
              </Select.Option>
            );
          })}
        </Select>
      </div>

      {/* Status Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontWeight: '500', fontSize: '14px' }}>Status:</span>
        <Select
          mode="multiple"
          style={{ width: 'fit-content', minWidth: '200px' }}
          value={statusValue}
          onChange={onStatusChange}
          placeholder="Select Status(es)"
          allowClear
          showSearch
          optionFilterProp="children"
          popupMatchSelectWidth={false}
          maxTagCount="responsive"
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        >
          {statusTabs
            .filter(tab =>
              tab.value !== 'Unassigned' || userType === 'super_admin' || userType === 'sales_manager' || userType === 'marketing_manager'
            )
            .map(tab => {
              const count = tab.apiKey === 'total_count' 
                ? (getStatusCount ? getStatusCount(leadCounts, 'total_count') : 0)
                : (getStatusCount ? getStatusCount(leadCounts, tab.apiKey) : 0);
              return (
                <Select.Option 
                  key={tab.value} 
                  value={tab.value}
                  label={tab.label}
                >
                  {tab.label} ({count})
                </Select.Option>
              );
            })}
        </Select>
      </div>
    </div>
  );
};

export default MarketingManagerFilters;

