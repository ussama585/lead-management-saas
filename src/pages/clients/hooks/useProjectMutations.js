import { message } from '../../../components/ui/notifications.jsx';
import { useMutation, useQueryClient } from 'react-query';

import { updateProjectStatus, updateProjectProposal, deleteHeadhuntingProject } from '../../shared/services/headhunting.js';

/**
 * Hook for deleting project
 */
export const useProjectDeleteMutation = (clientId, onSuccessCallback) => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ id, reason }) => deleteHeadhuntingProject(id, reason),
    {
      onSuccess: (res) => {
        message.success(res?.message || 'Project deleted successfully');
        
        // Invalidate queries to ensure fresh data
        queryClient.invalidateQueries('clientProjects');
        if (clientId) {
          queryClient.invalidateQueries(['clientProjectCounts', clientId]);
          queryClient.invalidateQueries(['clientProjects', clientId]);
        }
        
        if (onSuccessCallback) {
          onSuccessCallback(res);
        }
      },
      onError: (error) => {
        message.error(error?.message || 'Failed to delete project');
      },
    }
  );
};

/**
 * Hook for updating project status
 */
export const useProjectStatusMutation = (clientId, onSuccessCallback) => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ id, value, selected_jobs, recruiter_id, project_completion_deadline }) => {
      const payload = { status: value };

      if (selected_jobs) {
        payload.selected_jobs = selected_jobs;
      }

      if (recruiter_id) {
        payload.recruiter_id = recruiter_id;
      }

      if (project_completion_deadline) {
        payload.project_completion_deadline = project_completion_deadline;
      }

      const response = await updateProjectStatus(id, payload);
      return response;
    },
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Project status updated successfully');
        
        // Invalidate queries to ensure fresh data
        queryClient.invalidateQueries('clientProjects');
        if (clientId) {
          queryClient.invalidateQueries(['clientProjectCounts', clientId]);
        }
        
        if (onSuccessCallback) {
          onSuccessCallback(response);
        }
      },
      onError: (error) => {
        message.error(error?.message || 'Failed to update project status');
      },
    }
  );
};

/**
 * Hook for updating project remarks
 */
export const useProjectRemarksMutation = (onSuccessCallback) => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ id, remarks }) => {
      const payload = { remarks: remarks || '' };
      return updateProjectStatus(id, payload);
    },
    {
      onSuccess: (response) => {
        message.success(response?.message);
        
        // Invalidate queries to ensure fresh data
        queryClient.invalidateQueries('clientProjects');
        
        if (onSuccessCallback) {
          onSuccessCallback(response);
        }
      },
      onError: (error) => {
        message.error(error?.message || 'Failed to update project remarks');
      },
    }
  );
};

/**
 * Hook for updating project proposal
 */
export const useProjectProposalMutation = (onSuccessCallback) => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ id, contractData }) => {
      return updateProjectProposal(id, contractData);
    },
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Proposal updated successfully');
        
        // Invalidate queries to ensure fresh data
        queryClient.invalidateQueries('clientProjects');
        
        if (onSuccessCallback) {
          onSuccessCallback(response);
        }
      },
      onError: (error) => {
        message.error(error?.message || 'Failed to update proposal');
      },
    }
  );
};

