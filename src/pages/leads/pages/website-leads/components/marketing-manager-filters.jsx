import { Select } from '../../../../../components/ui/app-select.jsx';
import React from 'react';

import DuplicateCheckFilter from '../../../../../components/duplicate-check-filter.jsx';

/**
 * Marketing Manager Filters Component
 * Displays single selection dropdowns for Executive and Status filters
 * Both can be selected simultaneously, but only one of each at a time
 */
const MarketingManagerFilters = ({
  executivesList = [],
  statusTabs = [],
  selectedExecutive = '',
  selectedStatus = '',
  hearAboutUs = '',
  hearAboutUsOptions = [],
  duplicateCheck = 'all',
  onDuplicateCheckChange,
  onExecutiveChange,
  onStatusChange,
  onHearAboutUsChange,
  getExecutiveCount,
  getStatusCount,
  leadCounts = {},
  userType = 'marketing_manager',
}) => {
  // Normalize values to single strings (not arrays)
  const executiveValue = Array.isArray(selectedExecutive) 
    ? (selectedExecutive.length > 0 ? selectedExecutive[0] : '')
    : (selectedExecutive || '');
  
  const statusValue = Array.isArray(selectedStatus) 
    ? (selectedStatus.length > 0 ? selectedStatus[0] : '')
    : (selectedStatus || '');

  const hearAboutUsValue = Array.isArray(hearAboutUs)
    ? hearAboutUs
    : (hearAboutUs ? [hearAboutUs] : []);

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
          style={{ width: 'fit-content', minWidth: '200px' }}
          value={executiveValue || undefined}
          onChange={onExecutiveChange}
          placeholder="Select Executive"
          allowClear
          showSearch
          optionFilterProp="children"
          popupMatchSelectWidth={false}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        >
          <Select.Option value="" label="All Executives">
            All Executives
          </Select.Option>
          {executivesList.map(executive => {
            const executiveCount = getExecutiveCount ? getExecutiveCount(executive.id) : 0;
            const baseName = executive.name || executive.label || 'Executive';
            const displayName = executive.user_type
              ? `${baseName} - ${executive.user_type === 'sales_manager' ? 'Manager' : 'Executive'}`
              : baseName;
            return (
              <Select.Option
                key={executive.id}
                value={executive.id.toString()}
                label={displayName}
              >
                {displayName} ({executiveCount})
              </Select.Option>
            );
          })}
        </Select>
      </div>

      {/* Duplicate Check Dropdown */}
      <DuplicateCheckFilter
        value={duplicateCheck || 'all'}
        onChange={(val) => onDuplicateCheckChange?.(val)}
        label="Duplicate:"
        minWidth={200}
      />

      {/* Status Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontWeight: '500', fontSize: '14px' }}>Status:</span>
        <Select
          style={{ width: 'fit-content', minWidth: '200px' }}
          value={statusValue || undefined}
          onChange={onStatusChange}
          placeholder="Select Status"
          allowClear
          showSearch
          optionFilterProp="children"
          popupMatchSelectWidth={false}
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

      {/* Hear About Us Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontWeight: '500', fontSize: '14px' }}>Hear About Us:</span>
        <Select
          style={{ width: 'fit-content', minWidth: '220px' }}
          mode="multiple"
          value={hearAboutUsValue}
          onChange={onHearAboutUsChange}
          placeholder="Select Source"
          allowClear
          showSearch
          optionFilterProp="children"
          popupMatchSelectWidth={false}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        >
          {hearAboutUsOptions.map((option) => (
            <Select.Option
              key={option}
              value={option}
              label={option}
            >
              {option}
            </Select.Option>
          ))}
        </Select>
      </div>
    </div>
  );
};

export default MarketingManagerFilters;

