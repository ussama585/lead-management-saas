import api from './api.js';
import { API_URL, MAIN_SYSTEM_BASE_URL } from '../utils/api.js';
import axios from 'axios';

const normalizeBaseUrl = (url) => String(url || '').replace(/\/+$/, '');
const MAIN_SYSTEM_PUBLIC_API_BASE = MAIN_SYSTEM_BASE_URL;



export const getStats = async (userId, isClient = false, filter) => {
  try {
    // Initialize query parameters
    const params = new URLSearchParams();

    // Add the `userId` only if it is provided
    if (userId) {
      if (isClient == true) {
        params.append('client_id', userId);
      }

      else {

        params.append('user_id', userId);
      }
    }

    params.append('order_by', filter);

    // Construct the endpoint with query parameters
    const endpoint = `/sales-manager/stats?${params.toString()}`;

    const response = await api.get(endpoint);

    // Return the response data
    return response.data;
  } catch (error) {
    console.error('Error fetching manager stats:', error);
    throw error;
  }
};



export const getClientStats = async (category = "week", userId, filter) => {
  try {
    // Initialize query parameters
    const params = new URLSearchParams();

    // Add the category as it's always required
    params.append('filter', category);

    // Add the userId if it's provided
    if (userId) {
      params.append('user_id', userId);
    }

    if (filter) {
      params.append('order_by', filter);
    }

    // Construct the endpoint with query parameters
    const endpoint = `/sales-manager/client-stats?${params.toString()}`;

    const response = await api.get(endpoint);

    // Destructure the response
    const { clients } = response.data;
    return {
      dates: clients.dates,  // Keeping track of dates
      stats: {
        active: clients.active,
        potential: clients.potential,
        dormant: clients.dormant,
        unassigned: clients.unassigned,
        opportunities_lost: clients.lost,
      },
    };
  } catch (error) {
    console.error('Error fetching client stats for executive:', error);
    throw error;
  }
};



export const getProjectStats = async (category = "week", userId, filter) => {
  try {
    // Initialize query parameters with the required category filter
    const params = new URLSearchParams({ filter: category });

    // Add the userId to the query parameters if provided
    if (userId) {
      params.append('user_id', userId);
    }

    if (filter) {
      params.append('order_by', filter);
    }

    // Construct the endpoint with the query parameters
    const endpoint = `/sales-manager/project-stats?${params.toString()}`;

    // Fetch the data from the API
    const response = await api.get(endpoint);

    // Destructure the response to get project stats
    const { projects } = response.data;
    return {
      dates: projects.dates,  // Keeping track of dates
      stats: {
        active: projects.active,
        completed: projects.completed,
        terminated: projects.terminated,
        unassigned: projects.unassigned
      },
    };
  } catch (error) {
    console.error('Error fetching project stats:', error);
    throw error;
  }
};



export const getExecutiveStats = async (category = "week", userId) => {
  try {
    // Initialize query parameters with the required category filter
    const params = new URLSearchParams({ filter: category });

    // Add the userId to the query parameters if provided
    if (userId) {
      params.append('user_id', userId);
    }

    // Construct the endpoint with the query parameters
    const endpoint = `/sales-manager/executive-stats?${params.toString()}`;

    // Fetch the data from the API
    const response = await api.get(endpoint);

    // Destructure the response to get project stats
    const { executives } = response.data;

    return {
      dates: executives.dates,
      executives: executives.executives
    };

  } catch (error) {
    console.error('Error fetching executive stats:', error);
    throw error;
  }
};



export const getExecutivesList = async (userId, page = 1, pageSize = 10, sorting = [], search = '', isClient = false) => {
  // Use URLSearchParams for proper .append() and encoding
  const queryParams = new URLSearchParams();

  queryParams.append('page', page);
  queryParams.append('size', pageSize);

  if (userId) {
    queryParams.append(isClient ? 'client_id' : 'user_id', userId);
  }

  if (sorting.length > 0) {
    sorting.forEach(({ id, desc }) => {
      queryParams.append('sort_by', id);
      queryParams.append('order', desc ? 'desc' : 'asc');
    });
  }

  if (search) {
    queryParams.append('search', search);
  }

  const endpoint = `/sales-executive/list?${queryParams.toString()}`;
  console.log("endpoint:", endpoint);

  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching executive listing: ${error.message}`);
  }
};



// Update lead by ID with form-data (assigned_to, status, remarks, proposal, contract details)
export const updateLeadById = async (
  id,
  {
    assigned_to,
    status,
    remarks,
    proposal,
    contract_currency,
    contract_subtotal_amount,
    discount_amount,
    discount_percentage,
    contract_price,
    total_contract_amount,
    pricing_type,
    job_count,
    total_vacancies,
    selected_job_ids,
  } = {}
) => {
  try {
    console.log('selected_job_ids:', selected_job_ids);

    console.log('updateLeadById - proposal parameter:', proposal); // Debug log
    const formData = new FormData();

    const appendIfDefined = (key, value) => {
      if (value === undefined || value === null) return;
      if (typeof value === 'string' && value.trim() === '') return;
      formData.append(key, value);
    };

    appendIfDefined('assigned_to', assigned_to);
    appendIfDefined('status', status);
    appendIfDefined('remarks', remarks);
    // Only append proposal if it's explicitly provided and truthy
    // This prevents passing proposal to conversion API which doesn't accept it
    if (proposal) {
      console.log('Appending proposal to FormData');
      formData.append('proposal', proposal);
    } else {
      console.log('NOT appending proposal to FormData (proposal is:', proposal, ')');
    }
    appendIfDefined('contract_currency', contract_currency);
    appendIfDefined('contract_subtotal_amount', contract_subtotal_amount);
    appendIfDefined('discount_amount', discount_amount);
    appendIfDefined('discount_percentage', discount_percentage);
    appendIfDefined('contract_price', contract_price);
    appendIfDefined('total_contract_amount', total_contract_amount);
    appendIfDefined('pricing_type', pricing_type);
    appendIfDefined('job_count', job_count);
    appendIfDefined('total_vacancies', total_vacancies);

    if (selected_job_ids && Array.isArray(selected_job_ids)) {
      const joined = selected_job_ids.join(',');
      if (joined) {
        formData.append('selected_job_ids', joined);
        console.log('selected_job_ids as comma-separated:', joined);
      }
    }

    const response = await api.patch(`/lead-generation/update/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Something went wrong' };
  }
};



// Get proposal URL for a lead
export const getProposalUrl = async (proposalFileName) => {
  try {
    if (!proposalFileName) return null;

    // If already an absolute URL, return as is
    if (proposalFileName.startsWith('http://') || proposalFileName.startsWith('https://')) {
      return proposalFileName;
    }

    // Otherwise, treat as filename and prepend base URL
    const fileName = proposalFileName.includes('/') ? proposalFileName.split('/').pop() : proposalFileName;
    return `${API_URL}media/lead_generation/proposals/${fileName}`;
  } catch (error) {
    console.error('Error constructing proposal URL:', error);
    throw error;
  }
};



// Update is_accepting_response for a lead
export const updateLeadAcceptingResponse = async (id, is_accepting_response) => {
  try {
    const response = await api.patch(`/lead-generation/update/${id}`, { is_accepting_response });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Something went wrong' };
  }
};

// Candidate signup vs profile completion stats
export const getCandidateSignupStats = async ({ start_date, end_date } = {}) => {
  try {
    const params = new URLSearchParams();
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);

    const endpoint = `${normalizeBaseUrl(MAIN_SYSTEM_PUBLIC_API_BASE)}/api/candidate-signup-stats${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(endpoint, { skipAuth: true });
    const raw = response?.data;
    return raw?.data ?? raw ?? [];
  } catch (error) {
    console.error('Error fetching candidate signup stats:', error);
    throw error;
  }
};

// Candidate designation + experience listing (paginated/filterable)
export const getCandidateDesignationExperienceList = async ({
  designation,
  min_experience,
  max_experience,
  start_date,
  end_date,
  page = 1,
  size = 10,
  sorting = [],
} = {}) => {
  try {
    const params = new URLSearchParams();
    if (designation) params.append('designations', designation);
    if (min_experience !== undefined && min_experience !== null && min_experience !== '') {
      params.append('min_experience', String(min_experience));
    }
    if (max_experience !== undefined && max_experience !== null && max_experience !== '') {
      params.append('max_experience', String(max_experience));
    }
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);
    params.append('page', String(page));
    params.append('size', String(size));
    if (sorting.length > 0) {
      params.append('sort_by', sorting[0].id);
      params.append('order', sorting[0].desc ? 'desc' : 'asc');
    }

    const endpoint = `${normalizeBaseUrl(MAIN_SYSTEM_PUBLIC_API_BASE)}/api/candidate-analysis${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(endpoint, { skipAuth: true });
    const raw = response?.data;
    return raw?.data ?? raw ?? {};
  } catch (error) {
    console.error('Error fetching candidate designation experience list:', error);
    throw error;
  }
};

// Jobs analysis (paginated/filterable)
export const getJobAnalysisList = async ({
  search,
  industries,
  locations,
  positions,
  start_date,
  end_date,
  page = 1,
  size = 10,
  sorting = [],
} = {}) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (industries) params.append('industries', industries);
    if (locations) params.append('locations', locations);
    if (positions !== undefined && positions !== null && positions !== '') {
      params.append('positions', String(positions));
    }
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);
    params.append('page', String(page));
    params.append('size', String(size));
    if (sorting.length > 0) {
      params.append('sort_by', sorting[0].id);
      params.append('order', sorting[0].desc ? 'desc' : 'asc');
    }

    const endpoint = `${normalizeBaseUrl(MAIN_SYSTEM_PUBLIC_API_BASE)}/api/job-analysis${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(endpoint, { skipAuth: true });
    return response?.data ?? {};
  } catch (error) {
    console.error('Error fetching job analysis list:', error);
    throw error;
  }
};

// Company analysis (paginated/filterable)
export const getCompanyAnalysisList = async ({
  type,
  email_verified,
  hear_about_us,
  start_date,
  end_date,
  page = 1,
  size = 10,
  sorting = [],
} = {}) => {
  try {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (email_verified !== undefined && email_verified !== null && email_verified !== '') {
      params.append('email_verified', String(email_verified));
    }
    if (hear_about_us) params.append('hear_about_us', hear_about_us);
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);
    params.append('page', String(page));
    params.append('size', String(size));
    if (sorting.length > 0) {
      params.append('sort_by', sorting[0].id);
      params.append('order', sorting[0].desc ? 'desc' : 'asc');
    }

    const endpoint = `${normalizeBaseUrl(MAIN_SYSTEM_PUBLIC_API_BASE)}/api/company-analysis${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(endpoint, { skipAuth: true });
    return response?.data ?? {};
  } catch (error) {
    console.error('Error fetching company analysis list:', error);
    throw error;
  }
};

// Company job analysis (paginated/filterable)
export const getCompanyJobAnalysisList = async ({
  search,
  has_jobs,
  start_date,
  end_date,
  page = 1,
  size = 10,
  sorting = [],
} = {}) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (has_jobs !== undefined && has_jobs !== null && has_jobs !== '') {
      params.append('has_jobs', String(has_jobs));
    }
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);
    params.append('page', String(page));
    params.append('size', String(size));
    if (sorting.length > 0) {
      params.append('sort_by', sorting[0].id);
      params.append('order', sorting[0].desc ? 'desc' : 'asc');
    }

    const endpoint = `${normalizeBaseUrl(MAIN_SYSTEM_PUBLIC_API_BASE)}/api/company-job-analysis${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(endpoint, { skipAuth: true });
    return response?.data ?? {};
  } catch (error) {
    console.error('Error fetching company job analysis list:', error);
    throw error;
  }
};

// Company signup types (bar graph)
export const getCompanySignupTypes = async ({ start_date, end_date } = {}) => {
  try {
    const params = new URLSearchParams();
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);

    const endpoint = `${normalizeBaseUrl(MAIN_SYSTEM_PUBLIC_API_BASE)}/api/company-signup-types${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(endpoint, { skipAuth: true });
    const raw = response?.data;
    return raw?.data ?? raw ?? [];
  } catch (error) {
    console.error('Error fetching company signup types:', error);
    throw error;
  }
};

export const getCandidateDesignationOptions = async () => {
  try {
    const endpoint = `${normalizeBaseUrl(MAIN_SYSTEM_PUBLIC_API_BASE)}/api/candidate-analysis`;
    const response = await axios.get(endpoint);
    const raw = response?.data;

    const unique = (list = []) =>
      [...new Set(list.map((item) => String(item ?? '').trim()).filter(Boolean))];

    if (Array.isArray(raw)) return unique(raw);
    if (Array.isArray(raw?.designations)) return unique(raw.designations);
    if (Array.isArray(raw?.data?.designations)) return unique(raw.data.designations);

    const rows = Array.isArray(raw?.results)
      ? raw.results
      : Array.isArray(raw?.data?.results)
        ? raw.data.results
        : Array.isArray(raw?.data)
          ? raw.data
          : [];

    if (!rows.length) return [];

    const designations = rows
      .map((row) => row?.designation ?? row?.candidate_designation ?? row?.title ?? row?.name)
      .filter(Boolean);

    return unique(designations);
  } catch (error) {
    console.error('Error fetching candidate designation options:', error);
    return [];
  }
};

export const getCompanyTypeOptions = async () => {
  try {
    const endpoint = `${normalizeBaseUrl(MAIN_SYSTEM_PUBLIC_API_BASE)}/api/company-types`;
    const response = await axios.get(endpoint);
    const raw = response?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    return [];
  } catch (error) {
    console.error('Error fetching company type options:', error);
    return [];
  }
};

export const getCompanyHearAboutUsOptions = async () => {
  try {
    const endpoint = `${normalizeBaseUrl(MAIN_SYSTEM_PUBLIC_API_BASE)}/api/company-hear-about-us`;
    const response = await axios.get(endpoint);
    const raw = response?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    return [];
  } catch (error) {
    console.error('Error fetching company hear-about-us options:', error);
    return [];
  }
};

export const getJobIndustryOptions = async () => {
  try {
    const endpoint = `${normalizeBaseUrl(MAIN_SYSTEM_PUBLIC_API_BASE)}/api/job-industries`;
    const response = await axios.get(endpoint);
    const raw = response?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    return [];
  } catch (error) {
    console.error('Error fetching job industries options:', error);
    return [];
  }
};

export const getJobLocationOptions = async () => {
  try {
    const endpoint = `${normalizeBaseUrl(MAIN_SYSTEM_PUBLIC_API_BASE)}/api/job-locations`;
    const response = await axios.get(endpoint);
    const raw = response?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    return [];
  } catch (error) {
    console.error('Error fetching job locations options:', error);
    return [];
  }
};

export const getJobPositionOptions = async () => {
  try {
    const endpoint = `${normalizeBaseUrl(MAIN_SYSTEM_PUBLIC_API_BASE)}/api/job-positions`;
    const response = await axios.get(endpoint);
    const raw = response?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    return [];
  } catch (error) {
    console.error('Error fetching job positions options:', error);
    return [];
  }
};




