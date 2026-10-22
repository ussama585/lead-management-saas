import api from './api.js';


export const markClientLost = async (client_id, reason) => {
    try {
      const endpoint = `/client/mark-lost`;
  
      // Create a FormData object and append values
      const formData = new FormData();
  
      formData.append('client_id', client_id);
      formData.append('reason', reason);
  
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      return response.data;
    } catch (error) {
      console.error('Error marking client as lost:', error);
      throw error;
    }
  };

export const getClientDetails = async (clientId) => {
  try {
    const endpoint = `/headhunting/update-client/${clientId}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching client details:', error);
    throw error;
  }
};
  