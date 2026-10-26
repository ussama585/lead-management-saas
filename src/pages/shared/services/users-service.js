import api from './api.js';

export async function getAllUsers({ page = 1, pageSize = 10, userType = 'all', search = '', sorting = [], isActive = '' } = {}) {
  const params = { page, size: pageSize };
  if (userType !== 'all') params.user_type = userType;
  if (search.trim()) params.search = search.trim();
  if (isActive !== '') params.is_active = isActive;
  if (sorting.length) {
    params.sort_by = sorting[0].id;
    params.order = sorting[0].desc ? 'desc' : 'asc';
  }
  const { data } = await api.get('/accounts/all-users', { params });
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not load users.');
  if (!Array.isArray(data?.results)) throw new Error('Could not read the users list.');
  return data;
}



export const getUsers = async (page = 1, pageSize = 10, user_type = "all", search = "", sorting = []) => {
  try {
    const queryParams = new URLSearchParams({
      page,
      size: pageSize,
    });

    if (user_type !== "all") {
      queryParams.append("user_type", user_type);
    }

    if (search) {
      queryParams.append("search", search);
    }

    if (sorting.length > 0) {
      sorting.forEach(({ id, desc }) => {
        queryParams.append("sort_by", id);
        queryParams.append("order", desc ? "desc" : "asc");
      });
    }

    const endpoint = `/accounts/all-users?${queryParams.toString()}`;
    console.log("endpoint: ", endpoint);

    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};



export const getUserDetails = async (userId) => {
 
  try {
    const response = await api.get(`/accounts/update-user/${userId}`);
    console.log(response.data);
    return response.data;


  }

  catch (error) {
    throw new Error(`Error fetching user details: ${error.message}`);
  }
};

export const getUserCount = async () => {
  try {
    const response = await api.get(`/accounts/user-count`);
    // console.log(response.data);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching user details: ${error.message}`);
  }
};





export const editUser = async (userId, userData) => {

  try {

    const response = await api.patch(`/accounts/update-user/${userId}`, userData); // Adjust URL as needed
    return response.data;

  }

  catch (error) {

    console.error('Error updating user:', error);
    throw error;

  }
};

/**
 * Step 1: Request OTP for user deletion. This triggers an OTP email to the user.
 * @param {string|number} userId
 * @returns {Promise<object>} API response
 */
export const requestDeleteUserOtp = async (userId) => {
  try {
    // This endpoint triggers the OTP email (DELETE method, but only triggers OTP, does not delete)
    const response = await api.delete(`/accounts/update-user/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error requesting OTP for user deletion ${userId}:`, error);
    throw new Error(`Error requesting OTP for user deletion: ${error.message}`);
  }
};

/**
 * Step 2: Validate OTP and complete user deletion.
 * @param {string|number} userId
 * @param {string} otp
 * @returns {Promise<object>} API response
 */
export const validateDeleteUserOtp = async (userId, otp) => {
  try {
    const formData = new FormData();
    formData.append('otp', otp);
    const response = await api.post(`/accounts/validate-delete-user/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log("response: ", response.data);
    return response.data;
  } catch (error) {
    console.error(`Error validating OTP for user deletion ${userId}:`, error);
    throw new Error(`Error validating OTP for user deletion: ${error.message}`);
  }
};

// DEPRECATED: This function does not use the OTP-based deletion flow. Use requestDeleteUserOtp and validateDeleteUserOtp instead.
// export const deleteUser = async (userId) => {

//   try {
//     const response = await api.delete(`/accounts/update-user/${userId}`);
//     return response.data;

//   }

//   catch (error) {

//     console.error(`Error deleting user ${userId}:`, error);
//     throw new Error(`Error deleting user: ${error.message}`);
//   }
// };

export const toggleUserActivation = async (userId, isActive) => {

  try {
    const response = await api.patch(`/accounts/update-user/${userId}`, { is_active: !isActive});
    return response.data;
  }

  catch (error) {
      console.error( isActive ? `Error deactivating user ${userId}:` : `Error activating user ${userId}:`, error);
      throw new Error(isActive ? `Error deactivating user: ${error.message}` : `Error activating user: ${error.message}`);
  }
};




export const getAssigningUsersListing = async (user_type = "sales_manager") => {
  try {

    const endpoint = `/accounts/users-for-assigning?user_type=sales_executive`;
    console.log("endpoint: ", endpoint);

    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching assigningusers:', error);
    throw error;
  }
};


export const assignProject = async (projectId, userId) => {
  try {

    const formData = new FormData();
    formData.append("assigned_to", userId);

    const response = await api.patch(`/project/detail/${projectId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data", // Ensure headers are set for formData
      },
    });

    return response.data;

  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};


export const assignClient = async (clientId, userId) => {
  try {

    const formData = new FormData();
    formData.append("assigned_to", userId);

    const response = await api.patch(`/lead-generation/update/${clientId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data", // Ensure headers are set for formData
      },
    });
    return response.data;

  } catch (error) {
    console.error("Error updating client:", error);
    throw error;
  }
};

export const getManangersExecutives = async (userType = null) => {
  try {
    // Assignment dropdowns consistently request sales executives for every role.
    const endpoint = `/accounts/users-for-assigning?user_type=sales_executive`;
    console.log("endpoint: ", endpoint);

    const response = await api.get(endpoint);
    console.log("Response from getManangersExecutives:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching potential client details:', error);
    throw error;
  }
};

export const getExecutives = async() => {
   try {

    const endpoint = `/data-entry/user-tabs-count`;
    console.log("endpoint: ", endpoint);

    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching potential client details:', error);
    throw error;
  }
};

/**
 * Delete a headhunting client with a required delete_reason.
 * Backend expects: DELETE /api/headhunting/delete-client/:id with form/delete_reason.
 */
export const deleteHeadhuntingClient = async (clientId, deleteReason) => {
  try {
    const formData = new FormData();
    if (deleteReason != null) {
      formData.append('delete_reason', deleteReason);
    }

    const response = await api.delete(`/api/headhunting/delete-client/${clientId}`, {
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting headhunting client ${clientId}:`, error);
    throw error;
  }
};

/**
 * Delete a headhunting job with a required delete_reason.
 * Backend expects: DELETE /api/headhunting/delete-job/:id with form/delete_reason.
 */
export const deleteHeadhuntingJob = async (jobId, deleteReason) => {
  try {
    const formData = new FormData();
    if (deleteReason != null) {
      formData.append('delete_reason', deleteReason);
    }

    const response = await api.delete(`/api/headhunting/delete-job/${jobId}`, {
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting headhunting job ${jobId}:`, error);
    throw error;
  }
};

export const getPotentialClientDetails = async (id) => {
  try {

    const endpoint = `/client/potential/${id}`;
    console.log("endpoint: ", endpoint);

    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching potential client details:', error);
    throw error;
  }
};
// http://192.168.100.42:8001/api/accounts/assigning-user-list


export const getPotentialClientListing = async () => {
  try {

    const endpoint = `/client/potential-listing`;
    

    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching potential client listing:', error);
    throw error;
  }
};


export const mergePotentialClient = async (client_id, potential_id) => {
  try {
    const endpoint = `/client/merge-clients`;

    // Create a FormData object and append values
    const formData = new FormData();

    formData.append('client_id', client_id);
    formData.append('potential_id', potential_id);

    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error merging potential client:', error);
    throw error;
  }
};

