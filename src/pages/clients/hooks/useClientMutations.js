import { message } from '../../../components/ui/notifications.jsx';
import { useMutation, useQueryClient } from 'react-query';

import { updateHeadhuntingClient, updateHeadhuntingClientJSON, deleteHeadhuntingClient } from '../../shared/services/headhunting.js';

/**
 * Hook for deleting client
 */
export const useClientDeleteMutation = (onSuccessCallback) => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ id, reason }) => deleteHeadhuntingClient(id, reason),
    {
      onSuccess: (res) => {
        message.success(res?.message || 'Client deleted successfully');
        
        // Invalidate all variations of the query to ensure fresh data
        queryClient.invalidateQueries('headhuntingClients');
        queryClient.invalidateQueries('headhuntingClientCounts');
        queryClient.invalidateQueries('headhuntingClientStats');
        queryClient.invalidateQueries('headhuntingClientStatsLevel1');
        queryClient.invalidateQueries('headhuntingClientStatsLevel2');
        queryClient.invalidateQueries('headhuntingClientStatsLevel3');
        queryClient.invalidateQueries('headhuntingClientStatsLevel4');
        
        if (onSuccessCallback) {
          onSuccessCallback(res);
        }
      },
      onError: (error) => {
        message.error(error?.message || 'Failed to delete client');
      },
    }
  );
};

/**
 * Hook for updating client status
 */
export const useClientStatusMutation = (onSuccessCallback) => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ id, ...values }) => {
      // Use JSON when sending complex structures like selected_jobs
      if (values.selected_jobs) {
        return await updateHeadhuntingClientJSON(id, values);
      }
      return await updateHeadhuntingClient(id, values);
    },
    {
      onSuccess: (res) => {
        message.success(res?.message || 'Status updated successfully');
        
        // Invalidate all variations of the query to ensure fresh data
        queryClient.invalidateQueries('headhuntingClients');
        queryClient.invalidateQueries('headhuntingClientCounts');
        
        if (onSuccessCallback) {
          onSuccessCallback(res);
        }
      },
      onError: (error) => {
        // Prefer server-provided message when available
        const serverMsg =
          error?.message ||
          (typeof error === 'string' ? error : null) ||
          error?.detail ||
          (error && typeof error === 'object' && error.error ? error.error : null) ||
          (error && typeof error === 'object' && error.data && error.data.message ? error.data.message : null);

        if (serverMsg) {
          message.error(serverMsg);
        } else {
          message.error('Failed to update status');
        }
      },
    }
  );
};

/**
 * Hook for updating client remarks
 */
export const useClientRemarksMutation = (onSuccessCallback) => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ id, remarks }) => updateHeadhuntingClient(id, { remarks }),
    {
      onSuccess: (res) => {
        message.success(res?.message);
        
        // Invalidate all variations of the query to ensure fresh data
        queryClient.invalidateQueries('headhuntingClients');
        queryClient.invalidateQueries('headhuntingClientCounts');
        
        if (onSuccessCallback) {
          onSuccessCallback(res);
        }
      },
      onError: (error) => {
        message.error(error?.message || 'Failed to update remarks');
      },
    }
  );
};

/**
 * Hook for assigning recruiter to client
 */
export const useRecruiterAssignmentMutation = (onSuccessCallback) => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ clientId, recruiterId }) =>
      updateHeadhuntingClient(clientId, { assigned_to: recruiterId }),
    {
      onSuccess: (res) => {
        message.success(res?.message || 'Assigned successfully');
        
        // Invalidate all variations of the query to ensure fresh data
        queryClient.invalidateQueries('headhuntingClients');
        queryClient.invalidateQueries('headhuntingClientCounts');
        
        if (onSuccessCallback) {
          onSuccessCallback(res);
        }
      },
      onError: (error) => {
        message.error(error?.message || 'Failed to assign');
      },
    }
  );
};

