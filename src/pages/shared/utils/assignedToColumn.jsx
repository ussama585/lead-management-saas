import React from 'react';
import { Select } from 'antd';
import { isLeadConvertedToClient } from './statusColumn.jsx';

const { Option } = Select;

/**
 * Creates an "Assigned To" column definition for lead tables
 * Based on the logic from leads.jsx
 * 
 * @param {Object} config - Configuration object
 * @param {string} config.userType - Current user type (admin, sales_manager, sales_executive, marketing_manager)
 * @param {Object} config.user - Current user object
 * @param {Array} config.executivesList - List of executives/managers available for assignment
 * @param {Function} config.onAssignmentChange - Callback when assignment changes (lead, newAssigneeId) => void
 * @param {boolean} config.isLoading - Whether assignment update is in progress
 * @param {boolean} config.loadingAssigningUsers - Whether executives list is loading
 * @param {Object} config.additionalProps - Additional props to pass to Select component
 * @param {number} config.size - Column size (optional)
 * @returns {Object} Column definition object
 */
export const createAssignedToColumn = ({
  userType,
  user,
  executivesList = [],
  onAssignmentChange,
  isLoading = false,
  loadingAssigningUsers = false,
  additionalProps = {},
  size,
  editableRoles = ['sales_manager', 'admin', 'super_admin', 'company_admin'],
  useAssigneeIds = false,
}) => {

  return {
    header: 'Assigned To',
    id: 'assigned_to_name', // Explicit id for sorting
    accessorKey: 'assigned_to_name',
    sortUndefined: 'last', // Handle undefined/null values
    sortDescFirst: false, // Start with ascending order (A to Z)
    ...(size !== undefined && { size }),
    Cell: ({ cell, row }) => {
      const entry = row.original;
      const assignedName = entry.assigned_to_name || '-';
      const assignedType = entry.assigned_to_type || '';
      const isConvertedToClient = isLeadConvertedToClient(entry);
      
      // Editable dropdown for sales managers and admin
      if (editableRoles.includes(userType)) {
        // Ensure logged-in manager is always in the options list
        const optionsList = [...executivesList];
        if (useAssigneeIds && entry.assigned_to != null && assignedName !== '-' && !optionsList.some(option => String(option.id) === String(entry.assigned_to))) {
          optionsList.unshift({ id: entry.assigned_to, name: assignedName, user_type: assignedType });
        }
        if (user && userType === 'sales_manager' && !useAssigneeIds) {
          const isUserInList = optionsList.some(exec => exec.id === user.id);
          if (!isUserInList) {
            optionsList.unshift({
              id: user.id,
              name: user.name,
              user_type: user.user_type
            });
          }
        }

        return (
          <Select
            value={useAssigneeIds ? (entry.assigned_to == null ? undefined : String(entry.assigned_to)) : assignedName !== '-' ? assignedName : undefined}
            placeholder="Not Assigned"
            onChange={(value) => {
              if (onAssignmentChange) {
                onAssignmentChange(entry, value);
              }
            }}
            // Show loading spinner only while fetching executives list, not while updating a single row
            loading={loadingAssigningUsers}
            // Still disable the control during an in-progress assignment update
            disabled={isLoading || isConvertedToClient}
            popupMatchSelectWidth={false}
            style={{ width: 'fit-content', minWidth: '150px' }}
            allowClear={false}
            className="antd-input dropdown"
            {...additionalProps}
          >
            {optionsList.map((executive) => (
              <Option key={executive.id} value={useAssigneeIds ? String(executive.id) : executive.name}>
                {executive.name}{executive.user_type ? ` - ${executive.user_type.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())}` : ''}
              </Option>
            ))}
          </Select>
        );
      }
      
      // Display format for sales executives (show their own name with type)
      if (userType === 'sales_executive') {
        return (
          <span>
            {user?.name || '-'} - {user?.user_type === 'sales_manager' ? 'Manager' : 'Executive'}
          </span>
        );
      }
      
      // Fallback display
      return (
        <span>
          {assignedName}
          {assignedType && assignedName !== '-' ? ` - ${assignedType === 'sales_executive' ? 'Executive' : 'Manager'}` : ''}
        </span>
      );
    },
  };
};

