import api from './api.js';


// Get remarks by ID
export const getRemarksById = async (id) => {
  try {
    const endpoint = `/headhunting/remarks/${id}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error fetching remarks for ID ${id}:`, error);
    throw error.response?.data || { message: 'Failed to fetch remarks' };
  }
};

// Update remarks by ID
export const updateRemarksById = async (id, remark) => {
  try {
    const formData = new FormData();
    formData.append('remark', remark);
    
    const endpoint = `/headhunting/remarks/${id}`;
    const response = await api.patch(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating remarks for ID ${id}:`, error);
    throw error.response?.data || { message: 'Failed to update remarks' };
  }
};

// Delete remarks by ID
export const deleteRemarksById = async (id) => {
  try {
    const endpoint = `/headhunting/remarks/${id}`;
    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error deleting remarks for ID ${id}:`, error);
    throw error.response?.data || { message: 'Failed to delete remarks' };
  }
};

// Get follow-up by ID
export const getFollowupById = async (id) => {
  try {
    const endpoint = `/headhunting/jobs-followups/${id}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error fetching follow-up for ID ${id}:`, error);
    throw error.response?.data || { message: 'Failed to fetch follow-up' };
  }
};

// Create job follow-up
export const createJobFollowup = async (jobId, followupDate) => {
  try {
    const formData = new FormData();
    formData.append('followup_date', followupDate);
    
    const endpoint = `/headhunting/jobs-followups/${jobId}`;
    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error creating follow-up for job ID ${jobId}:`, error);
    throw error.response?.data || { message: 'Failed to create follow-up' };
  }
};

// Get job follow-ups list (by job ID)
export const getJobFollowupsList = async (jobId) => {
  try {
    const endpoint = `/headhunting/jobs-followups-list/${jobId}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error fetching follow-ups list for job ID ${jobId}:`, error);
    throw error.response?.data || { message: 'Failed to fetch follow-ups list' };
  }
};

// Get jobs follow-up list (all jobs, past or future). type: 'past' | 'future'
export const getJobsFollowupsList = async (
  type = 'past',
  page = 1,
  pageSize = 10,
  startDate = null,
  endDate = null,
  sortBy = null,
  order = 'asc',
) => {
  try {
    const params = new URLSearchParams({ type, page, size: pageSize });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (sortBy) params.append('sort_by', sortBy);
    if (order) params.append('order', order);
    const endpoint = `/headhunting/jobs-followups-list?${params.toString()}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error fetching jobs follow-ups list (type=${type}):`, error);
    throw error.response?.data || { message: 'Failed to fetch jobs follow-ups list' };
  }
};

// Update follow-up by ID
export const updateFollowupById = async (id, followupDate) => {
  try {
    const formData = new FormData();
    formData.append('followup_date', followupDate);
    
    const endpoint = `/headhunting/followups/${id}`;
    const response = await api.patch(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating follow-up for ID ${id}:`, error);
    throw error.response?.data || { message: 'Failed to update follow-up' };
  }
};

// Delete follow-up by ID
export const deleteFollowupById = async (id) => {
  try {
    const endpoint = `/headhunting/followups/${id}`;
    const response = await api.delete(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error deleting follow-up for ID ${id}:`, error);
    throw error.response?.data || { message: 'Failed to delete follow-up' };
  }
};

// Create job remark
export const createJobRemark = async (jobId, remark) => {
  try {
    const formData = new FormData();
    formData.append('remark', remark);
    
    const endpoint = `/headhunting/jobs-remarks/${jobId}`;
    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error creating remark for job ID ${jobId}:`, error);
    throw error.response?.data || { message: 'Failed to create remark' };
  }
};

// Get job remarks list
export const getJobRemarksList = async (jobId) => {
  try {
    const endpoint = `/headhunting/jobs-remarks-list/${jobId}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error fetching remarks list for job ID ${jobId}:`, error);
    throw error.response?.data || { message: 'Failed to fetch remarks list' };
  }
};
