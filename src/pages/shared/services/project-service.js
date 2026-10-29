import { assignmentEndpoint } from './assignment-endpoint.js';
import api from './api.js';


export const markProjectTerminated = async (project_id, reason) => {
    try {
      const endpoint = `/project/mark-terminated`;

      // Create a FormData object and append values
      const formData = new FormData();

      formData.append('project_id', project_id);
      formData.append('reason', reason);

      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error marking project as terminated:', error);
      throw error;
    }
  };

// Assign projects to recruitment executive
export const assignProjectToRecruitmentExecutive = async (project_ids, recruitment_executive_id) => {
  try {
    const endpoint = `/headhunting/assign-project`;
    
    // Create FormData object
    const formData = new FormData();
    formData.append('project_ids', project_ids);
    formData.append('recruitment_executive_id', recruitment_executive_id);

    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error assigning projects to recruitment executive:', error);
    throw error;
  }
};

// Assign recruiter to a single project
export const assignRecruiterToProject = async (project_id, recruiter_id) => {
  try {
    const endpoint = `/headhunting/assign-project`;
    
    // Create FormData object
    const formData = new FormData();
    formData.append('project_ids', project_id.toString());
    formData.append('recruitment_executive_id', recruiter_id);

    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error assigning recruiter to project:', error);
    throw error;
  }
};

// Get recruiter assigning list
export const getRecruiterAssigningList = async () => {
  try {
    const endpoint = assignmentEndpoint();
    
    const response = await api.get(endpoint);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching recruiter assigning list:', error);
    throw error;
  }
};
  
