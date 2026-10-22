import React from 'react';
import { Select, message } from 'antd';
import { getConversionToPotential, createOrUpdateConversionToPotential } from '../services/leads.js';

const { Option } = Select;
export const isLeadConvertedToClient = (entry) =>
  entry?.converted_to_client === true ||
  entry?.converted_to_client === 1 ||
  entry?.converted_to_client === '1' ||
  entry?.converted_to_client === 'true';

// Exact status options that should be used across all lead pages
export const STATUS_OPTIONS = [
  "Pending Contact",
  "Potential Client",
  "Company Profile Sent Through Whatsapp",
  "Company Profile Sent Through Email",
  "Company Profile Sent Through Email & Whatsapp",
  "SaaS Client",
  "Follow Up",
  "Job Seeker",
  "Opportunity Lost",
  "Not Ready to Pay",
  "Contacted But No Response - Company Profile Sent Through Whatsapp",
  "Contacted But No Response - Company Profile Sent Through Email",
  "Contacted But No Response - Company Profile Sent Through Email & Whatsapp",
  "Phone Powered Off - Company Profile Sent Through Whatsapp",
  "Phone Powered Off - Company Profile Sent Through Email",
  "Phone Powered Off - Company Profile Sent Through Email & Whatsapp",
  "Incorrect Phone Number",
  "Duplicate Lead",
  "Irrelevant Lead"
];

/**
 * Creates a status column definition for lead tables
 * Based on the logic from leads.jsx
 * 
 * When converting to "Potential Client", this uses the conversion-to-potential API endpoints:
 * - GET: getConversionToPotential(leadId) - fetches existing conversion data
 * - POST: createOrUpdateConversionToPotential(leadId, payload) - creates/updates conversion
 * 
 * @param {Object} config - Configuration object
 * @param {Set<string>} config.statusesRequiringRemarks - Set of statuses that require remarks
 * @param {Object} config.statusColors - Object mapping status to color
 * @param {string} config.userType - Current user type (admin, sales_manager, sales_executive, marketing_manager)
 * @param {Object} config.user - Current user object
 * @param {Function} config.onStatusChange - Callback when status changes (lead, newStatus) => void
 * @param {Function} config.onOpenRemarksModal - Callback to open remarks modal (lead, newStatus) => void
 * @param {Function} config.onDirectStatusUpdate - Callback for direct status update without remarks (lead, newStatus) => void
 * @param {boolean} config.isLoading - Whether status update is in progress
 * @param {number|null} config.updatingStatusId - ID of lead being updated (for loading state)
 * @param {Object} config.additionalProps - Additional props to pass to Select component
 * @param {number} config.size - Column size (optional)
 * @returns {Object} Column definition object
 */
export const createStatusColumn = ({
  statusesRequiringRemarks,
  statusColors,
  userType,
  user,
  onStatusChange,
  onOpenRemarksModal,
  onDirectStatusUpdate,
  isLoading = false,
  updatingStatusId = null,
  additionalProps = {},
  size,
  leadType, // 'meta-leads', 'data-leads', or undefined (for regular leads)
}) => {
  console.log('[StatusColumn] createStatusColumn called with:', {
    userType,
    userId: user?.id,
    userName: user?.name,
    isLoading,
    updatingStatusId
  });
  
  // Temporary alert to verify code is running - remove after debugging
  if (typeof window !== 'undefined' && window.localStorage.getItem('showStatusColumnAlert') !== 'false') {
    console.warn('[StatusColumn] createStatusColumn is being used - check console logs below');
  }
  
  return {
    header: 'Status',
    id: 'status', // Explicit id for sorting
    accessorKey: 'status',
    enableSorting: true, // Explicitly enable sorting
    ...(size !== undefined && { size }),
    Cell: ({ cell, row }) => {
      const entry = row.original;
      const currentStatus = cell.getValue();
      const isUpdating = updatingStatusId === entry.id || isLoading;
      const isConvertedToClient = isLeadConvertedToClient(entry);

      console.log('[StatusColumn] Rendering status cell:', {
        entryId: entry.id,
        currentStatus,
        userType,
        converted_to_client: entry.converted_to_client,
        isConvertedToClient,
        isUpdating,
        isLoading
      });
      
      // Force log to console even if filtered
      console.warn('[StatusColumn] CELL RENDERED - Entry ID:', entry.id, 'UserType:', userType, 'Converted:', isConvertedToClient);

      // If lead is converted to client, no one can edit status (read-only for everyone)
      if (isConvertedToClient) {
        console.log('[StatusColumn] Read-only because converted_to_client is true');
        return (
          <span style={{ 
            color: statusColors[currentStatus] || '#666',
            fontWeight: 500,
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: '#f0f0f0'
          }}>
            {currentStatus || '-'}
          </span>
        );
      }

      // Role-based access control (only if not converted to client):
      // - Marketing managers cannot edit status
      // - Sales executives can edit status if converted_to_client is false
      // - Admin can always edit all leads
      // - Sales managers can edit all leads (including executives' leads)
      const canEdit = userType !== 'marketing_manager' && (
        userType === 'admin' || 
        userType === 'sales_manager' ||
        userType === 'sales_executive'
      );

      console.log('[StatusColumn] canEdit evaluation:', {
        entryId: entry.id,
        userType,
        isMarketingManager: userType === 'marketing_manager',
        isAdmin: userType === 'admin',
        isSalesManager: userType === 'sales_manager',
        isSalesExecutive: userType === 'sales_executive',
        canEdit
      });

      // If not editable, show as text
      if (!canEdit) {
        console.log('[StatusColumn] Rendering read-only because canEdit is false');
        return (
          <span style={{ 
            color: statusColors[currentStatus] || '#666',
            fontWeight: 500,
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: '#f0f0f0'
          }}>
            {currentStatus || '-'}
          </span>
        );
      }

      // Editable dropdown
      console.log('[StatusColumn] Rendering editable dropdown for entry:', entry.id);
      return (
        <Select
          style={{ width: 'fit-content' }}
          value={currentStatus || 'Select Status'}
          onChange={async value => {
            // Check if converting to Potential Client and job count is 0
            if (value === 'Potential Client') {
              const jobCount = entry.job_count || 0;
              if (jobCount === 0) {
                message.error('At least 1 job must be present to convert lead to Potential Client');
                return;
              }
              
              // Show loading state while fetching conversion data
              const loadingMessage = message.loading('Loading conversion data...', 0);
              
              // Fetch conversion-to-potential data if it exists (GET request)
              const leadId = entry.id;
              let conversionData = null;
              
              if (leadId) {
                try {
                  conversionData = await getConversionToPotential(leadId, leadType);
                  console.log('[StatusColumn] Fetched conversion-to-potential data:', conversionData);
                } catch (error) {
                  // If conversion doesn't exist (404), that's okay - it's a new conversion
                  if (error?.response?.status !== 404) {
                    console.error('[StatusColumn] Error fetching conversion data:', error);
                    message.error('Failed to load conversion data');
                  }
                  conversionData = null;
                } finally {
                  // Hide loading message
                  loadingMessage();
                }
              } else {
                loadingMessage();
              }
              
              // Pass conversion data and leadType to modal if available
              const leadWithConversion = {
                ...entry,
                conversionData: conversionData,
                proposalData: conversionData, // Also set as proposalData for backward compatibility
                leadType: leadType, // Pass leadType to modal
              };
              
              if (onOpenRemarksModal) {
                onOpenRemarksModal(leadWithConversion, value);
              }
              return;
            }

            // Check if status requires remarks
            if (statusesRequiringRemarks && statusesRequiringRemarks.has(value)) {
              if (onOpenRemarksModal) {
                onOpenRemarksModal(entry, value);
              }
              return;
            }

            // Direct status update without remarks
            if (onDirectStatusUpdate) {
              onDirectStatusUpdate(entry, value);
            } else if (onStatusChange) {
              onStatusChange(entry, value);
            }
          }}
          loading={isUpdating}
          disabled={isUpdating}
          popupMatchSelectWidth={false}
          className="antd-input dropdown"
          {...additionalProps}
        >
          {STATUS_OPTIONS.map((status) => (
            <Option key={status} value={status}>
              {status}
            </Option>
          ))}
        </Select>
      );
    },
  };
};

/**
 * Helper function to fetch conversion-to-potential data for a lead
 * Uses the conversion-to-potential API (GET request)
 * 
 * @param {number|string} leadId - The lead ID
 * @returns {Promise<Object|null>} Conversion data or null if not found
 */
export const fetchConversionData = async (leadId, leadType = undefined) => {
  if (!leadId) return null;
  
  try {
    const conversionData = await getConversionToPotential(leadId, leadType);
    console.log('[StatusColumn] Fetched conversion-to-potential data:', conversionData);
    return conversionData;
  } catch (error) {
    // If conversion doesn't exist (404), that's okay - it's a new conversion
    if (error?.response?.status !== 404) {
      console.error('[StatusColumn] Error fetching conversion data:', error);
    }
    return null;
  }
};

/**
 * Helper function to create or update conversion-to-potential for a lead
 * Uses the conversion-to-potential API (POST request)
 * 
 * @param {number|string} leadId - The lead ID
 * @param {Object} payload - The conversion payload (contract details, jobs, etc.)
 * @returns {Promise<Object>} Updated conversion data
 */
export const updateConversionData = async (leadId, payload, leadType = undefined) => {
  if (!leadId) {
    throw new Error('Lead ID is required');
  }
  
  try {
    const updatedData = await createOrUpdateConversionToPotential(leadId, payload, leadType);
    console.log('[StatusColumn] Updated conversion-to-potential data:', updatedData);
    return updatedData;
  } catch (error) {
    console.error('[StatusColumn] Error updating conversion data:', error);
    throw error;
  }
};

