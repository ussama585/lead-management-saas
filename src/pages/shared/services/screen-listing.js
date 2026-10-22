import api from './api.js';


// Get screening forms list
export const getScreeningForms = async (params = {}) => {
    try {
      const { page = 1, pageSize = 10, search = '', sort_by = '', order = 'asc' } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: pageSize.toString(),
        ...(search && { search }),
        ...(sort_by && { sort_by }),
        ...(sort_by && { order })
      });

      const endpoint = `/screening/list?${queryParams}`;
      console.log("endpoint: ", endpoint);

      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching screening forms:', error);
      throw error;
    }
  };
  
  // Create screening form
  export const createScreeningForm = async (formData) => {
    try {
      const response = await api.post(`/screening/create`, formData);
      return response.data;
    } catch (error) {
      console.error('Error creating screening form:', error);
      throw error;
    }
  };
  
  // Get screening form by ID
  export const getScreeningForm = async (formId) => {
    try {
      const response = await api.get(`/screening/update/${formId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching screening form:', error);
      throw error;
    }
  };

  // Update screening form
  export const updateScreeningForm = async (formId, formData) => {
    try {
      const response = await api.patch(`/screening/update/${formId}`, formData);
      return response.data;
    } catch (error) {
      console.error('Error updating screening form:', error);
      throw error;
    }
  };