import api from "./api.js";
import axios from "axios";

// Get single job detail for regular lead
export const getLeadJobDetail = async (jobId) => {
  try {
    const response = await api.get(`/lead-generation/job/${jobId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching lead job ${jobId}: ${error.message}`);
  }
};

// Create a new job for regular lead
export const createLeadJob = async (jobData) => {
  try {
    const response = await api.post(`/lead-generation/job/create`, jobData);
    return response.data;
  } catch (error) {
    throw new Error(`Error creating lead job: ${error.message}`);
  }
};

// Update an existing job for regular lead
export const updateLeadJob = async (jobId, jobData) => {
  try {
    const response = await api.patch(`/lead-generation/job/${jobId}`, jobData);
    return response.data;
  } catch (error) {
    throw new Error(`Error updating lead job ${jobId}: ${error.message}`);
  }
};

// Delete a job for regular (website) lead
export const deleteWebsiteLeadJob = async (jobId) => {
  const { data } = await api.delete(`/lead-generation/delete-job/${encodeURIComponent(jobId)}`);
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not delete job.');
  return data;
};

// Get all jobs for a regular lead (if needed)
export const getLeadJobsByLeadId = async (leadId, params = {}) => {
  try {
    const transformedParams = {
      page: params.page ?? 1,
      size: params.size ?? params.size ?? 10,
      search: params.search,
      ordering: params.ordering,
    };
    const response = await api.get(`/lead-generation/jobs/${leadId}`, { 
      params: transformedParams 
    });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching jobs for lead ${leadId}: ${error.message}`);
  }
};

// Get all jobs for a lead (used in conversion modal)
export const getLeadAllJobs = async (leadId) => {
  try {
    const response = await api.get(`/lead-generation/all-jobs/${leadId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching all jobs for lead ${leadId}: ${error.message}`);
  }
};

// Get lead detail (if needed)
export const getLeadDetail = async (leadId) => {
  try {
    const response = await api.get(`/lead-generation/update/${leadId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching lead detail ${leadId}: ${error.message}`);
  }
};

// Get duplicate leads (website/data/meta combined for a given lead)
export const getLeadGenerationDuplicateLeads = async (leadId) => {
  try {
    const response = await api.get(`/lead-generation/duplicate-leads/${leadId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching duplicate leads for lead ${leadId}: ${error.message}`);
  }
};

/** GET lead-generation/lead-history-track/:leadId - returns array of { status, updated_at } for website leads */
export const getLeadGenerationHistoryTrack = async (leadId) => {
  try {
    const response = await api.get(`/lead-generation/history/${leadId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching lead history track: ${error.message}`);
  }
};

export const createWebsiteLeadFollowUp = async (leadId, payload) => {
  const response = await api.post(`/lead-generation/website-follow-up/${leadId}`, payload);
  return response.data;
};

export const getWebsiteLeadFollowUpList = async (params = {}) => {
  const response = await api.get('/lead-generation/website-follow-up-list', { params });
  return response.data;
};

// Get conversion-to-potential data for a lead (GET request)
// leadType: 'meta-leads', 'data-leads', or undefined (defaults to 'lead-generation')
export const getConversionToPotential = async (leadId, leadType = undefined) => {
  try {
    let endpoint;
    
    if (leadType === 'meta-leads') {
      endpoint = `/meta-leads/conversion-to-potential/${leadId}`;
    } else if (leadType === 'data-leads') {
      endpoint = `/data-leads/conversion-to-potential/${leadId}`;
    } else {
      endpoint = `/lead-generation/conversion-to-potential/${leadId}`;
    }
    
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: `Error fetching conversion data for lead ${leadId}` };
  }
};

// Create or update conversion-to-potential for a lead (POST/PATCH request)
// leadType: 'meta-leads', 'data-leads', or undefined (defaults to 'lead-generation')
export const createOrUpdateConversionToPotential = async (leadId, payload, leadType = undefined) => {
  try {
    let endpoint;

    if (leadType === 'meta-leads') {
      endpoint = `/meta-leads/conversion-to-potential/${leadId}`;
    } else if (leadType === 'data-leads') {
      endpoint = `/data-leads/conversion-to-potential/${leadId}`;
    } else {
      endpoint = `/lead-generation/conversion-to-potential/${leadId}`;
    }

    // Use POST for all lead types
    const response = await api.post(endpoint, payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: `Error creating/updating conversion for lead ${leadId}` };
  }
};

// Get assigned users for lead generation
export const getAssignedUsers = async () => {
  try {
    const response = await api.get(`/lead-generation/get-users-assign`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching assigned users: ${error.message}`);
  }
};

/** GET lead-generation/list-count - params: start_date, end_date, status, assigned_to, is_duplicate, etc. */
export const getLeadGenerationListCount = async (params = {}) => {
  const response = await api.get('/lead-generation/list-count', { params });
  return response.data;
};

/** GET lead-potential-conversion - params: start_date, end_date. Returns { data: { Meta: [], Data: [], Website: [] } } */
export const getLeadPotentialConversion = async ({ start_date, end_date } = {}) => {
  const params = {};
  if (start_date) params.start_date = start_date;
  if (end_date) params.end_date = end_date;
  const response = await api.get('/lead-potential-conversion', { params });
  return response?.data?.data ?? response?.data ?? {};
};

/** GET lead-generation/piechart - params: start_date, end_date, status (e.g. "status"). Returns [{ type, label, count, percentage }] */
export const getLeadGenerationPiechart = async (params = {}) => {
  const response = await api.get('/lead-generation/piechart', { params });
  return response.data;
};

/** GET lead-generation/duplicate-stats - params: start_date, end_date. Returns { categories: string[], series: [{ name, data }] } */
export const getLeadGenerationDuplicateStats = async (params = {}) => {
  const response = await api.get('/lead-generation/duplicate-stats', { params });
  return response.data;
};

/** GET lead-generation/potential-stats - params: start_date, end_date. Returns { categories: string[], series: [{ name, data }] } for Total Leads vs Potential Client */
export const getLeadGenerationPotentialStats = async (params = {}) => {
  const response = await api.get('/lead-generation/potential-stats', { params });
  return response.data;
};

/** GET lead-generation/progress-chart - params: status, start_date, end_date. Returns e.g. { "Pending Contact": 90 } */
export const getLeadGenerationProgressChart = async (params = {}) => {
  const response = await api.get('/lead-generation/progress-chart', { params });
  return response.data;
};

/** GET lead-generation/resources-stats - params: start_date, end_date. Returns [{ resources: number, count: number }] */
export const getLeadGenerationResourcesStats = async (params = {}) => {
  const response = await api.get('/lead-generation/resources-stats', { params });
  return response.data;
};

// Add user assignments for lead generation
// Accepts either an array of IDs or objects { id, skip_round }
export const addUserAssignments = async (userIds) => {
  try {
    const normalizedUserIds = (userIds || []).map((u) => {
      if (typeof u === 'number' || typeof u === 'string') {
        return { id: Number(u), skip_round: 0 };
      }
      return {
        id: Number(u.id),
        skip_round: typeof u.skip_round === 'number' ? u.skip_round : 0,
      };
    });

    const response = await api.post(`/lead-generation/add-users-assign`, {
      user_ids: normalizedUserIds,
    });
    return response.data;
  } catch (error) {
    throw new Error(`Error adding user assignments: ${error.message}`);
  }
};

// Remove user assignments for lead generation
export const removeUserAssignments = async (userIds) => {
  try {
    const response = await api.delete(`/lead-generation/remove-users-assign`, {
      data: { user_ids: userIds }
    });
    return response.data;
  } catch (error) {
    throw new Error(`Error removing user assignments: ${error.message}`);
  }
};

// Get assigned users for meta leads
export const getMetaLeadsAssignedUsers = async () => {
  try {
    const response = await api.get(`/meta-leads/get-users-assign`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching meta leads assigned users: ${error.message}`);
  }
};

// Add user assignments for meta leads
// Accepts either an array of IDs or objects { id, skip_round }
export const addMetaLeadsUserAssignments = async (userIds) => {
  try {
    const normalizedUserIds = (userIds || []).map((u) => {
      if (typeof u === 'number' || typeof u === 'string') {
        return { id: Number(u), skip_round: 0 };
      }
      return {
        id: Number(u.id),
        skip_round: typeof u.skip_round === 'number' ? u.skip_round : 0,
      };
    });

    const response = await api.post(`/meta-leads/add-users-assign`, {
      user_ids: normalizedUserIds
    });
    return response.data;
  } catch (error) {
    throw new Error(`Error adding meta leads user assignments: ${error.message}`);
  }
};

// Remove user assignments for meta leads
export const removeMetaLeadsUserAssignments = async (userIds) => {
  try {
    const response = await api.delete(`/meta-leads/remove-users-assign`, {
      data: { user_ids: userIds }
    });
    return response.data;
  } catch (error) {
    throw new Error(`Error removing meta leads user assignments: ${error.message}`);
  }
};
