import api from './api.js';

export const getMetaLeadHistory = async (leadId) => {
  const { data } = await api.get(`/meta-leads/history/${encodeURIComponent(leadId)}`);
  if (!Array.isArray(data)) throw new Error(data?.message || 'Could not load meta lead history.');
  return data;
};

export const getMetaLeadJobHistory = async (jobId) => {
  const { data } = await api.get(`/meta-leads/job-history/${jobId}`);
  if (!Array.isArray(data)) throw new Error('Could not load meta lead job history.');
  return data;
};

/** Serialize filter values for query params (comma-separated). */
const toCommaSeparatedQueryParam = (value) => {
  if (value == null || value === '') return null;
  if (Array.isArray(value)) {
    const parts = value.map((v) => String(v).trim()).filter(Boolean);
    return parts.length > 0 ? parts.join(',') : null;
  }
  return String(value);
};


// Meta Leads - Reassign lead to user
export const reassignMetaLead = async (leadId, userId) => {
  try {
    const formData = new FormData();
    formData.append('user_id', userId);
    
    const response = await api.post(`/meta-leads/reassign/${leadId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

// Meta Leads - Get assigning user list
export const getMetaLeadsAssigningUserList = async () => {
  try {
    const endpoint = `/accounts/users-for-assigning?user_type=sales_executive`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching meta leads assigning user list: ${error.message}`);
  }
};

// Add this to your metaLeads.js service file
export const bulkUpdateMetaLeads = async (leadsData) => {
  try {
    const endpoint = `/meta-leads/bulk-update-leads`;
    
    const response = await api.post(endpoint, leadsData);
    return response.data;
  } catch (error) {
    throw new Error(`Error updating meta leads: ${error.message}`);
  }
};


export const bulkAddMetaLeads = async (leadsData) => {
  try {
    const endpoint = `/meta-leads/bulk-add-missing-leads`;
    
    const response = await api.post(endpoint, leadsData);
    return response.data;
  } catch (error) {
    throw new Error(`Error importing meta leads: ${error.message}`);
  }
};

// Meta Leads - Fetch all jobs for a specific lead
export const getMetaLeadAllJobs = async (leadId) => {
  try {
    const endpoint = `/meta-leads/all-jobs/${leadId}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching jobs for meta lead ${leadId}: ${error.message}`);
  }
};


// Meta Leads - Get stats
export const getMetaLeadsStats = async (startDate, endDate, campaignName = null) => {
  try {
    const endpoint = `/meta-leads/stats`;
    const params = {
      start_date: startDate,
      end_date: endDate,
    };
    
    if (campaignName) {
      params.campaign_name = campaignName;
    }
    
    const response = await api.get(endpoint, { params });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching meta leads stats: ${error.message}`);
  }
};

// Meta Leads - Get list count
export const getMetaLeadsListCount = async (page = 1, startDate = null, endDate = null, executiveId = null, campaignName = null, adsetNames = null, adNames = null, historyStatus = null, historyStartDate = null, historyEndDate = null, projectSize = null, executiveFilter = null, isDuplicate = null, formNames = null, exclude = null) => {
  try {
    const endpoint = `/meta-leads/list-count`;
    
    const params = {
      // page: page,
    };
    
    if (startDate) {
      params.start_date = startDate;
    }
    
    if (endDate) {
      params.end_date = endDate;
    }
    
    if (executiveId) {
      params.executive_id = executiveId;
    }
    
    if (campaignName) {
      params.campaign_name = campaignName;
    }
    
    if (adsetNames && Array.isArray(adsetNames) && adsetNames.length > 0) {
      params.adset_name = adsetNames.join(',');
    } else if (adsetNames && !Array.isArray(adsetNames)) {
      params.adset_name = adsetNames;
    }
    
    if (adNames && Array.isArray(adNames) && adNames.length > 0) {
      params.ad_name = adNames.join(',');
    } else if (adNames && !Array.isArray(adNames)) {
      params.ad_name = adNames;
    }
    
    // Add history parameters (comma-separated when multiple values)
    const historyStatusParam = toCommaSeparatedQueryParam(historyStatus);
    if (historyStatusParam) {
      params.history_status = historyStatusParam;
    }

    const historyStartParam = toCommaSeparatedQueryParam(historyStartDate);
    if (historyStartParam) {
      params.history_start_date = historyStartParam;
    }

    const historyEndParam = toCommaSeparatedQueryParam(historyEndDate);
    if (historyEndParam) {
      params.history_end_date = historyEndParam;
    }
    
    // Add project size filter
    if (projectSize) {
      params.project_size = projectSize;
    }
    
    // Add executive filter
    if (executiveFilter) {
      params.executive_id = executiveFilter;
      console.log('Meta Leads API - Adding executive filter:', executiveFilter);
    }

    // Duplicate filter (backend field is_duplicate)
    if (typeof isDuplicate === 'boolean') {
      params.is_duplicate = isDuplicate;
    }

    if (formNames && Array.isArray(formNames) && formNames.length > 0) {
      params.form_name = formNames.join(',');
    }

    const excludeParam = toCommaSeparatedQueryParam(exclude);
    if (excludeParam) {
      params.exclude = excludeParam;
    }
    
    console.log('Meta Leads Count API - Final params:', params);
    const response = await api.get(endpoint, { params });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching meta leads list count: ${error.message}`);
  }
};

// Meta Leads — distinct form names (for filters)
export const getMetaLeadFormNameList = async () => {
  try {
    const endpoint = `/meta-leads/meta-lead-form-name`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching meta lead form names: ${error.message}`);
  }
};

// Meta Leads - Get campaign name list
export const getMetaLeadsCampaignNameList = async () => {
  try {
    const endpoint = `/meta-leads/campaign-name-list`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching meta leads campaign name list: ${error.message}`);
  }
};

// Meta Leads - Get adset name list
export const getMetaLeadsAdsetNameList = async () => {
  try {
    const endpoint = `/meta-leads/adset-name-list`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching meta leads adset name list: ${error.message}`);
  }
};

// Meta Leads - Get ad name list
export const getMetaLeadsAdNameList = async () => {
  try {
    const endpoint = `/meta-leads/ad-name-list`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching meta leads ad name list: ${error.message}`);
  }
};

// Meta Leads - Get adset list by campaign name
export const getMetaLeadsAdsetListByCampaign = async (campaignName) => {
  try {
    const endpoint = `/meta-leads/campaign-adset-list`;
    const params = {
      campaign_name: campaignName,
    };
    const response = await api.get(endpoint, { params });
    return response.data; // Returns { campaign_name, adsets: [{ adset_name, lead_count }] }
  } catch (error) {
    throw new Error(`Error fetching meta leads adset list by campaign: ${error.message}`);
  }
};

// Meta Leads - Get ads list by adset name
export const getMetaLeadsAdsListByAdset = async (adsetName, campaignName) => {
  try {
    const endpoint = `/meta-leads/adset-ads-list`;
    const params = {
      adset_name: adsetName,
      campaign_name: campaignName,
    };
    const response = await api.get(endpoint, { params });
    return response.data; // Returns { adset_name, ads: [{ ad_name, lead_count }] }
  } catch (error) {
    throw new Error(`Error fetching meta leads ads list by adset: ${error.message}`);
  }
};

// Meta Leads - Get lead history track
export const getMetaLeadHistoryTrack = async (leadId) => {
  try {
    const endpoint = `/meta-leads/lead-history-track/${leadId}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching meta lead history track: ${error.message}`);
  }
};

// Meta Leads - Update project size
export const updateMetaLeadProjectSize = async (leadId, projectSize) => {
  try {
    const formData = new FormData();
    formData.append('project_size', projectSize);
    
    const response = await api.patch(`/meta-leads/update-project-size/${leadId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const createMetaLeadFollowUp = async (leadId, payload) => {
  const response = await api.post(`/meta-leads/meta-follow-up/${leadId}`, payload);
  return response.data;
};

export const getMetaLeadFollowUpList = async (params = {}) => {
  const response = await api.get('/meta-leads/meta-follow-up-list', { params });
  return response.data;
};

// Meta Leads - Get list with history status filtering
export const getMetaLeadsListWithHistory = async (page = 1, pageSize = 10, sorting = [], globalFilter = '', historyStatus = null, historyStartDate = null, historyEndDate = null, campaignName = null, adsetName = null, adName = null, projectSize = null, executiveFilter = null, isDuplicate = null, formNames = null, exclude = null) => {
  try {
    const endpoint = `/meta-leads/list`;
    
    // Build query parameters
    const params = {
      page: page,
      size: pageSize,
    };
    
    // Add history filters (comma-separated when multiple values)
    const historyStatusParam = toCommaSeparatedQueryParam(historyStatus);
    if (historyStatusParam) {
      params.history_status = historyStatusParam;
    }

    const historyStartParam = toCommaSeparatedQueryParam(historyStartDate);
    if (historyStartParam) {
      params.history_start_date = historyStartParam;
    }

    const historyEndParam = toCommaSeparatedQueryParam(historyEndDate);
    if (historyEndParam) {
      params.history_end_date = historyEndParam;
    }
    
    // Add campaign filters
    if (campaignName) {
      params.campaign_name = campaignName;
    }
    
    if (adsetName && Array.isArray(adsetName) && adsetName.length > 0) {
      params.adset_name = adsetName.join(',');
    } else if (adsetName && !Array.isArray(adsetName)) {
      params.adset_name = adsetName;
    }
    
    if (adName && Array.isArray(adName) && adName.length > 0) {
      params.ad_name = adName.join(',');
    } else if (adName && !Array.isArray(adName)) {
      params.ad_name = adName;
    }
    
    // Add project size filter
    if (projectSize) {
      params.project_size = projectSize;
    }
    
    // Add executive filter
    if (executiveFilter) {
      params.executive_id = executiveFilter;
      console.log('Meta Leads API - Adding executive filter:', executiveFilter);
    }

    // Duplicate filter (backend field is_duplicate)
    if (typeof isDuplicate === 'boolean') {
      params.is_duplicate = isDuplicate;
    }

    if (formNames && Array.isArray(formNames) && formNames.length > 0) {
      params.form_name = formNames.join(',');
    }

    const excludeParam = toCommaSeparatedQueryParam(exclude);
    if (excludeParam) {
      params.exclude = excludeParam;
    }
    
    // Add global filter/search if provided
    if (globalFilter && globalFilter.trim() !== '') {
      params.search = globalFilter.trim();
    }
    
    // Add sorting if provided
    if (sorting && sorting.length > 0) {
      const sortField = sorting[0].id;
      params.ordering = sorting[0].desc ? `-${sortField}` : sortField;
    }
    
    const response = await api.get(endpoint, { params });
    
    // Return data in the expected format for the table component
    return {
      results: response.data.results || [],
      count: response.data.count || 0,
      next: response.data.next,
      previous: response.data.previous,
      status: response.data.status
    };
  } catch (error) {
    throw new Error(`Error fetching meta leads list with history: ${error.response?.data?.message || error.message}`);
  }
};



// Meta Leads - Get filtered list
export const getMetaLeadsList = async (page = 1, pageSize = 10, sortBy = '', order = 'asc', globalFilter = '', startDate = null, endDate = null, executiveId = null, status = null, campaignName = null, adsetName = null, adName = null, projectSize = null, executiveFilter = null, isDuplicate = null, formNames = null, exclude = null) => {
  try {
    const endpoint = `/meta-leads/list`;
    
    // Build query parameters
    const params = {
      page: page,
      size: pageSize,
    };
    
    // Add optional filters
    if (startDate) {
      params.start_date = startDate;
    }
    
    if (endDate) {
      params.end_date = endDate;
    }
    
    if (executiveId) {
      params.executive_id = executiveId;
    }
    
    if (status) {
      params.status = status;
    }
    
    if (campaignName) {
      params.campaign_name = campaignName;
    }
    
    if (adsetName && Array.isArray(adsetName) && adsetName.length > 0) {
      params.adset_name = adsetName.join(',');
    } else if (adsetName && !Array.isArray(adsetName)) {
      params.adset_name = adsetName;
    }
    
    if (adName && Array.isArray(adName) && adName.length > 0) {
      params.ad_name = adName.join(',');
    } else if (adName && !Array.isArray(adName)) {
      params.ad_name = adName;
    }
    
    // Add project size filter
    if (projectSize) {
      params.project_size = projectSize;
    }
    
    // Add executive filter
    if (executiveFilter) {
      params.executive_id = executiveFilter;
      console.log('Meta Leads API - Adding executive filter:', executiveFilter);
    }

    // Duplicate filter (backend field is_duplicate)
    if (typeof isDuplicate === 'boolean') {
      params.is_duplicate = isDuplicate;
    }

    if (formNames && Array.isArray(formNames) && formNames.length > 0) {
      params.form_name = formNames.join(',');
    }

    const excludeParam = toCommaSeparatedQueryParam(exclude);
    if (excludeParam) {
      params.exclude = excludeParam;
    }
    
    // Add global filter/search if provided
    if (globalFilter && globalFilter.trim() !== '') {
      params.search = globalFilter.trim();
    }
    
    // Add sorting if provided
    if (sortBy && sortBy.trim() !== '') {
      params.sort_by = sortBy;
      params.order = order;
    }
    
    const response = await api.get(endpoint, { params });
    
    // Return data in the expected format for the table component
    return {
      results: response.data.results || [],
      count: response.data.count || 0,
      next: response.data.next,
      previous: response.data.previous,
      status: response.data.status
    };
  } catch (error) {
    throw new Error(`Error fetching meta leads list: ${error.response?.data?.message || error.message}`);
  }
};

// Meta Leads - Get all jobs by lead id
export const getMetaLeadJobsByLeadId = async (leadId, params = {}) => {
  try {
    const endpoint = `/meta-leads/jobs/${leadId}`;
    const transformedParams = {
      page: params.page ?? 1,
      size: params.size ?? params.size ?? 10,
      search: params.search,
      ordering: params.ordering,
    };
    const response = await api.get(endpoint, { params: transformedParams });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching jobs for meta lead ${leadId}: ${error.message}`);
  }
};

// Meta Leads - Create job
export const createMetaLeadJob = async (payload) => {
  try {
    const endpoint = `/meta-leads/create-job`;
    const response = await api.post(endpoint, payload);
    return response.data;
  } catch (error) {
    throw new Error(`Error creating meta lead job: ${error.message}`);
  }
};


export const updateMetaLead = async (payload, leadID) => {
  try {
    const endpoint = `/meta-leads/update/${leadID}`;
    const response = await api.patch(endpoint, payload); // Use PATCH instead of POST
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || `Error updating meta lead: ${error.message}`);
  }
};


// Meta Leads - Get job by job id
export const getMetaLeadJobById = async (jobId) => {
  try {
    const endpoint = `/meta-leads/update-job/${jobId}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching meta lead job ${jobId}: ${error.message}`);
  }
};

// Meta Leads - Update job by job id
export const updateMetaLeadJobById = async (jobId, payload) => {
  try {
    const endpoint = `/meta-leads/update-job/${jobId}`;
    const response = await api.patch(endpoint, payload);
    return response.data;
  } catch (error) {
    throw new Error(`Error updating meta lead job ${jobId}: ${error.message}`);
  }
};

// Meta Leads - Delete job by job id
export const deleteMetaLeadJob = async (jobId, reason) => {
  try {
    const formData = new FormData();
    formData.append('delete_reason', reason);
    const response = await api.delete(`/meta-leads/delete-meta-lead-job/${jobId}`, {
      data: formData,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

// Meta Leads - Get lead detail by id
export const getMetaLeadDetail = async (leadId) => {
  try {
    const endpoint = `/meta-leads/lead/${leadId}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching meta lead ${leadId}: ${error.message}`);
  }
};

// Meta Leads - Get all duplicate leads for a given meta lead
export const getMetaLeadDuplicateLeads = async (leadId) => {
  try {
    const endpoint = `/meta-leads/duplicate-leads/${leadId}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching duplicate leads for meta lead ${leadId}: ${error.message}`);
  }
};

// ---------------------------
// Marketing Manager Dashboard
// ---------------------------

/**
 * Meta Leads - Get percentage breakdown for charts
 * Example params:
 * - { status: 'status', start_date: '2025-01-01', end_date: '2026-01-31' }
 * - { project_size: 'project-size', start_date: '2025-01-01', end_date: '2026-01-31' }
 */
export const getMetaLeadsPercentage = async (params = {}) => {
  try {
    const response = await api.get('/meta-leads/piechart', { params });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching meta leads percentage: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Meta Leads - Get project progress radial chart value
 * Example params: { status: 'Pending Contact', start_date: '2025-01-01', end_date: '2026-01-31' }
 */
export const getMetaLeadsProgressChart = async (params = {}) => {
  try {
    const response = await api.get('/meta-leads/progress-chart', { params });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching meta leads progress chart: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Meta Leads - Get top performing campaigns
 * Example params: { from: '2025-01-01', to: '2026-01-01', campaign: 'A, B' }
 */
export const getMetaLeadsTopPerformingCampaigns = async (params = {}) => {
  try {
    const response = await api.get('/meta-leads/top-performing-campaigns', { params });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching top performing campaigns: ${error.response?.data?.message || error.message}`);
  }
};


export const getMetaLeadsCampaignLeads = async (params = {}) => {
  try {
    const response = await api.get('/meta-leads/campaign-leads', { params });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching campaign leads: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Meta Leads - Compare multiple campaigns/adsets across statuses
 * Example params:
 * - { campaign1, campaign2, campaign3, adset1, adset2, adset3, status, from, to }
 */
export const getMetaLeadsCampaignComparison = async (params = {}) => {
  try {
    const response = await api.get('/meta-leads/campaign-comparison', { params });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching campaign comparison: ${error.response?.data?.message || error.message}`);
  }
};


 
export const getMetaLeadsDuplicateUniqueChart = async (params = {}) => {
  try {
    const apiParams = {};
    if (params.group_by != null && params.group_by !== '') {
      apiParams.group_by = params.group_by;
    }
    if (params.start_date) {
      apiParams.start_date = params.start_date;
    }
    if (params.end_date) {
      apiParams.end_date = params.end_date;
    }
    const response = await api.get('/meta-leads/duplicate-stats', { params: apiParams });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching duplicate vs unique chart: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Meta Spending - paginated ads insights listing.
 * API: GET /meta-leads/ads-insights
 */
export const getMetaAdsInsightsList = async (params = {}) => {
  try {
    const response = await api.get('/meta-leads/ads-insights', { params });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching meta spending list: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Meta Spending - detail by insight id.
 * API: GET /meta-leads/ads-insights-detail/:id
 */
export const getMetaAdsInsightsDetail = async (id, params = {}) => {
  try {
    const response = await api.get(`/meta-leads/ads-insights-detail/${id}`, { params });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching meta spending detail: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Meta Spending - paginated campaigns insights listing.
 * API: GET /meta-leads/campaigns-insights
 */
export const getMetaCampaignsInsightsList = async (params = {}) => {
  try {
    const response = await api.get('/meta-leads/campaigns-insights', { params });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching campaigns insights list: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Meta Spending - paginated campaigns listing.
 * API: GET /meta-leads/campaigns
 */
export const getMetaCampaignsList = async (params = {}) => {
  try {
    const response = await api.get('/meta-leads/campaigns', { params });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching campaigns list: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Meta Spending - paginated adsets insights listing filtered by campaign.
 * API: GET /meta-leads/adsets-insights
 */
export const getMetaAdsetsInsightsList = async (params = {}) => {
  try {
    const response = await api.get('/meta-leads/adsets-insights', { params });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching adsets insights list: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Meta Spending - paginated adsets listing for a campaign.
 * API: GET /meta-leads/campaigns-adsets/{campaignId}
 */
export const getMetaCampaignAdsetsList = async (campaignId, params = {}) => {
  try {
    const response = await api.get(`/meta-leads/campaigns-adsets/${campaignId}`, { params });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching campaign adsets list: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Meta Spending - adset detail.
 * API: GET /meta-leads/adsets/{adsetId}
 */
export const getMetaAdsetDetail = async (adsetId) => {
  try {
    const response = await api.get(`/meta-leads/adsets/${adsetId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching adset detail: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Meta Spending - campaign detail.
 * API: GET /meta-leads/campaigns-details/{campaignId}
 */
export const getMetaCampaignDetail = async (campaignId, params = {}) => {
  try {
    const response = await api.get(`/meta-leads/campaigns-details/${campaignId}`, { params });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching campaign detail: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Meta Spending - paginated ads listing for an adset.
 * API: GET /meta-leads/adsets-ads/{adsetId}
 */
export const getMetaAdsetAdsList = async (adsetId, params = {}) => {
  try {
    const response = await api.get(`/meta-leads/adsets-ads/${adsetId}`, { params });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching adset ads list: ${error.response?.data?.message || error.message}`);
  }
};

export const getMetaAdInsights = async (adId, params = {}) => {
  try {
    const response = await api.get(`/meta-leads/ads-new-insights/${adId}`, { params });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching ad insights: ${error.response?.data?.message || error.message}`);
  }
};

export const getMetaAdInsightDetail = async (adId) => {
  try {
    const response = await api.get(`/meta-leads/ad-insight-detail/${adId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching ad insight detail: ${error.response?.data?.message || error.message}`);
  }
};

export const getMetaAdDetail = async (adId) => {
  try {
    const response = await api.get(`/meta-leads/ads-details/${adId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching ad detail: ${error.response?.data?.message || error.message}`);
  }
};
