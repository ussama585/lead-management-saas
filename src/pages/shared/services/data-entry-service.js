import api from './api.js';


// Create a single data entry
export const createDataEntry = async (values) => {
  try {
    const response = await api.post(`/data-entry/create`, values);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Something went wrong' };
  }
};

// Bulk create data entries
export const bulkCreateDataEntry = async (entries) => {
  try {
    const response = await api.post(`/data-entry/bulk-create`, entries);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Something went wrong' };
  }
};

// List data entries
export const listDataEntry = async (params = {}) => {
  try {
    // params can be used for query params if needed
    const response = await api.get(`/data-entry/list`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Something went wrong' };
  }
};

export const getStatusCount = async (params = {})=>{
  try {
    const response = await api.get(`/data-entry/list-status-count`,{params});
    return response.data;

  }
  catch(error){
    throw error.response?.data || { message: 'Something went wrong' };
  }
}

// Bulk assign data entries
export const bulkAssignDataEntry = async (ids, assigned_to) => {
  try {
    const formData = new FormData();
    formData.append('ids', ids);
    formData.append('assigned_to', assigned_to);
    const response = await api.post(`/data-entry/assign`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Something went wrong' };
  }
};

// List data entry count
export const listDataEntryCount = async () => {
  try {
    const response = await api.get(`/data-entry/list-count`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Something went wrong' };
  }
};

// List assigned data entries
export const listAssignedDataEntry = async (params = {}) => {
  try {
    const response = await api.get(`/data-entry/list`, { params: { ...params, assigned: true } });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Something went wrong' };
  }
};

// Update data entry status
export const updateDataEntryStatus = async (id, status) => {
  try {
    const formData = new FormData();
    formData.append('status', status);
    const response = await api.patch(`/data-entry/update/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Something went wrong' };
  }
};

// Get data entry executive stats
export const getDataEntryExecutiveStats = async () => {
  try {
    const response = await api.get(`/data-entry-executive/stats`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Something went wrong' };
  }
};

// Get data entry executive graph stats

export const getDataEntryExecutiveGraphStats = async ({ filter }) => {
  const response = await api.get('/data-entry-executive/data-entry-stats', {
    params: { filter }
  });
  return response.data;
};


// Get a single data entry by ID
export const getDataEntryById = async (id) => {
  try {
    const response = await api.get(`/data-entry/update-data/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Something went wrong' };
  }
};

// Update a single data entry by ID
export const updateDataEntryById = async (id, values) => {
  try {
    const response = await api.patch(`/data-entry/update-data/${id}`, values);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Something went wrong' };
  }
};
