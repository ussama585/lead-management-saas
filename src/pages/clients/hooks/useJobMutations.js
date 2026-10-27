import { message } from '../../../components/ui/notifications.jsx';
import { useMutation, useQueryClient } from 'react-query';

import { updateJob, deleteHeadhuntingJob } from '../../shared/services/headhunting.js';

/**
 * Hook for job deletion
 */
export const useJobDeleteMutation = (projectId, onSuccessCallback) => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ jobId, reason }) => deleteHeadhuntingJob(jobId, reason),
    {
      onSuccess: (res) => {
        message.success(res?.message || 'Job deleted successfully');
        
        // Invalidate all related queries
        queryClient.invalidateQueries(['projectJobCounts', projectId]);
        queryClient.invalidateQueries(['projectJobs', projectId]);
        queryClient.invalidateQueries(['projectJobs', projectId, 'Pending']);
        queryClient.invalidateQueries(['projectJobs', projectId, 'Active']);
        queryClient.invalidateQueries(['projectJobs', projectId, 'Completed']);
        queryClient.invalidateQueries(['projectJobs', projectId, 'Terminated']);
        
        if (onSuccessCallback) {
          onSuccessCallback(res);
        }
      },
      onError: (error) => {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete job';
        message.error(errorMessage);
      },
    }
  );
};

/**
 * Hook for job status mutation
 * Updates job status with optional remarks
 */
export const useJobStatusMutation = (projectId, onSuccessCallback) => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ jobId, status, remarks }) => {
      const payload = { status };
      if (remarks) {
        payload.remarks = remarks;
      }
      return updateJob(jobId, payload);
    },
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Job status updated successfully');
        
        // Invalidate all related queries
        queryClient.invalidateQueries(['projectJobCounts', projectId]);
        queryClient.invalidateQueries(['projectJobs', projectId]);
        queryClient.invalidateQueries(['projectJobs', projectId, 'Pending']);
        queryClient.invalidateQueries(['projectJobs', projectId, 'Active']);
        queryClient.invalidateQueries(['projectJobs', projectId, 'Completed']);
        queryClient.invalidateQueries(['projectJobs', projectId, 'Terminated']);
        
        if (onSuccessCallback) {
          onSuccessCallback();
        }
      },
      onError: (error) => {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update job status';
        message.error(errorMessage);
      },
    }
  );
};

/**
 * Hook for job remarks mutation
 * Updates job remarks only
 */
export const useJobRemarksMutation = (projectId, onSuccessCallback) => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ jobId, remarks }) => {
      return updateJob(jobId, { remarks });
    },
    {
      onSuccess: (response) => {
        message.success(response?.message );
        
        // Invalidate related queries
        queryClient.invalidateQueries(['projectJobs', projectId]);
        
        if (onSuccessCallback) {
          onSuccessCallback();
        }
      },
      onError: (error) => {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update remarks';
        message.error(errorMessage);
      },
    }
  );
};

