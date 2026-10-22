import { useState, useCallback } from 'react';
import useUserStore from '../../pages/shared/store/user-store.js';

/**
 * Reusable hook for managing duplicate lead modal state and utilities
 * @returns {Object} Object containing modal state, open/close handlers, and utilities
 */
export function useDuplicateLead() {
  const user = useUserStore((state) => state.user);
  const canSeeDelayedHighlight =
    user?.user_type === 'admin' ||
    user?.user_type === 'sales_manager' ||
    user?.user_type === 'sales_executive';

  const [duplicateModal, setDuplicateModal] = useState({
    visible: false,
    lead: null,
  });

  const openDuplicateModal = useCallback((lead) => {
    setDuplicateModal({
      visible: true,
      lead,
    });
  }, []);

  const closeDuplicateModal = useCallback(() => {
    setDuplicateModal({
      visible: false,
      lead: null,
    });
  }, []);

  /**
   * Check if a lead is marked as duplicate
   * @param {Object} lead - The lead object
   * @returns {boolean} True if lead is duplicate
   */
  const isDuplicate = useCallback((lead) => {
    return lead?.is_duplicate === true;
  }, []);

  /**
   * Get row style props for duplicate leads
   * @param {Object} row - The table row object
   * @param {Object} lead - The lead data
   * @returns {Object} Style props for the row
   */
  const getRowStyle = useCallback((row, lead) => {
    const isFollowupDelayed =
      lead?.is_followup_delayed === true || lead?.is_followed_delayed === true;

    if (canSeeDelayedHighlight && isFollowupDelayed) {
      return {
        sx: {
          backgroundColor: '#ffd6d6', // darker red row background
          '&:hover': {
            backgroundColor: '#ffb3b3',
          },
        },
      };
    }

    if (isDuplicate(lead)) {
      return {
        sx: {
          backgroundColor: '#ffe08a', // Darker amber background for duplicates
          borderLeft: '4px solid #faad14', // Clear visual indicator (AntD warning color)
          '&:hover': {
            backgroundColor: '#ffd666', // Darker on hover
          },
        },
      };
    }
    return {};
  }, [isDuplicate, canSeeDelayedHighlight]);

  return {
    duplicateModal,
    openDuplicateModal,
    closeDuplicateModal,
    isDuplicate,
    getRowStyle,
  };
}

