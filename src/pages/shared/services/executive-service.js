import api from './api.js';
import { MAIN_SYSTEM_BASE_URL } from '../utils/api.js';
import axios from 'axios';
import moment from 'moment';

const normalizeBaseUrl = (url) => String(url || '').replace(/\/+$/, '');

export const createPotentialClient = async (values) => {
  try {

    const formatDate = (date) => {
      return date ? moment(date).format('YYYY-MM-DD') : null;
    };
    // Create a new FormData object
    const formData = new FormData();

    console.log("posting date: ", values.posting_date);
    console.log("hiring deadline: ", values.hiring_deadline);

    // Append Formik values to the FormData object
    formData.append('job_title', values.job_title);
    formData.append('resources_required', values.resources_required);
    formData.append('posting_date', values.posting_date ? formatDate(values.posting_date) : ""); // Formatted with moment.js
    formData.append('hiring_deadline', values.hiring_deadline ? formatDate(values.hiring_deadline) : "");
    formData.append('representative_name', values.representative_name);
    formData.append('representative_phone', values.representative_phone);
    formData.append('representative_email', values.representative_email);
    formData.append('name', values.name);
    formData.append('designation', values.designation);
    formData.append('phone', values.phone);
    formData.append('email', values.email);
    formData.append('website', values.website);
    formData.append('linkedin', values.linkedin);
    formData.append('facebook', values.facebook);
    formData.append('city', values.city);
    formData.append('country', values.country);
    formData.append('remarks', values.remarks);
    formData.append('acquired_through', values.acquired_through);


    // Send the FormData as the request body
    const response = await api.post(`/client/potential`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Indicating FormData
      },
    });

    return response.data;
  } catch (error) {

    throw error.response?.data || { message: 'Something went wrong' };
  }
};


export const editPotentialClient = async ({ id, values }) => {
  try {


    const formatDate = (date) => {
      return date ? moment(date).format('YYYY-MM-DD') : null;
    };
    // Create a new FormData object
    const formData = new FormData();

    // Append Formik values to the FormData object
    formData.append('job_title', values.job_title);
    formData.append('resources_required', values.resources_required);
    formData.append('posting_date', values.posting_date ? formatDate(values.posting_date) : ""); // Formatted with moment.js
    formData.append('hiring_deadline', values.hiring_deadline ? formatDate(values.hiring_deadline) : "");
    formData.append('representative_name', values.representative_name);
    formData.append('representative_phone', values.representative_phone);
    formData.append('representative_email', values.representative_email);
    formData.append('name', values.name);
    formData.append('designation', values.designation);
    formData.append('phone', values.phone);
    formData.append('email', values.email);
    formData.append('website', values.website);
    formData.append('linkedin', values.linkedin);
    formData.append('facebook', values.facebook);
    formData.append('city', values.city);
    formData.append('country', values.country);
    formData.append('remarks', values.remarks);
    formData.append('acquired_through', values.acquired_through);


    // Send the FormData as the request body
    const response = await api.patch(`/client/potential/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Indicating FormData
      },
    });

    return response.data;
  } catch (error) {

    throw error.response?.data || { message: 'Something went wrong' };
  }
};



export const getStats = async (userId, isClient = false) => {
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

    // Construct the endpoint with query parameters
    const endpoint = `/sales-executive/stats?${params.toString()}`;

    // Fetch the data from the API
    const response = await api.get(endpoint);

    // Return the response data
    return response.data;
  } catch (error) {
    console.error('Error fetching executive stats:', error);
    throw error;
  }
};


export const getClientStats = async (category = "week", userId, isClient = false) => {
  try {
    // Initialize query parameters
    const params = new URLSearchParams();

    // Add the category as it's always required
    params.append('filter', category);

    // Add the userId if it's provided
    if (userId) {

      if (isClient == true) {
        params.append('client_id', userId);
      }
      else {

        params.append('user_id', userId);
      }

    }

    // Construct the endpoint with query parameters
    const endpoint = `/sales-executive/client-stats?${params.toString()}`;

    // Fetch the data from the API
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



export const getProjectStats = async (category = "week", userId) => {
  try {
    // Construct the query parameters with a conditional for userId
    const params = new URLSearchParams({ filter: category });
    if (userId) params.append("user_id", userId);

    const endpoint = `/sales-executive/project-stats?${params.toString()}`;

    const response = await api.get(endpoint);

    const { projects } = response.data; // Destructure projects object from response
    return {
      dates: projects.dates,  // Keeping track of dates
      stats: {
        active: projects.active,
        completed: projects.completed,
        unassigned: projects.unassigned,
        terminated: projects.terminated,
      }
    };
  } catch (error) {
    console.error('Error fetching project stats:', error);
    throw error;
  }
};


/**
 * Fetch executive closing leaderboard: projects with status = Completed (or specific completed sub-status)
 * grouped by assigned_to. For sales performance ranking.
 * @param {string} status - One of: 'Completed', 'Completed - Payment Pending', 'Completed - Defaulter', or 'All' for all completed
 * @returns {Promise<{leaderboard: Array<{assigned_to_name: string, assigned_to_id: number, project_count: number}>}>}
 */
export const getExecutiveClosingLeaderboard = async (status = 'Completed') => {
  try {
    const params = new URLSearchParams();
    if (status && status !== 'All') {
      params.append('status', status);
    }
    const path = `sales-executive/completed-projects-leaderboard${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(path);
    return response.data;
  } catch (error) {
    console.error('Error fetching executive closing leaderboard:', error);
    throw error;
  }
};


export const getProjectsList = async (slug, status, page = 1, pageSize = 10, sorting = [], search = '', isClient = false) => {
  console.log(sorting, "sortingsorting")
  const sortBy = sorting?.[0]?.id || '';         // column key
  const sortOrder = sorting?.[0]?.desc ? 'desc' : 'asc'; // direction
  const params = new URLSearchParams({
    status,
    page,
    size: pageSize,
    sort_by: sortBy,
    sort_order: sortOrder,
    search,
    isClient
  });

  const endpoint = `/project/user-projects/${slug}?${params.toString()}`;

  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching project listing: ${error.message}`);
  }
};



export const getClientsList = async (slug, status, page = 1, pageSize = 10, sorting = [], search = '') => {
  const sortBy = sorting?.[0]?.id || '';         // column key
  const sortOrder = sorting?.[0]?.desc ? 'desc' : 'asc'; // direction
  const params = new URLSearchParams({
    page,
    size: pageSize,
    sort_by: sortBy,
    sort_order: sortOrder,
    search,
    status,
  });

  console.log(status, 'statusstatus')
  const endpoint = `/client/user-clients/${slug}?${params.toString()}`;

  console.log("Endpoint: ", endpoint);
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching client listing for Slug: ${slug}: ${error.message}`);
  }
};


export const getProjectCount = async (slug) => {


  try {

    const response = await api.get(`/project/user-projects-count/${slug}`);
    console.log(response.data);
    return response.data;

  }

  catch (error) {
    throw new Error(`Error fetching project count: ${error.message}`);
  }
};


export const getProjectDetails = async (slug) => {


  try {

    const baseUrl = normalizeBaseUrl(MAIN_SYSTEM_BASE_URL);
    const response = await axios.get(`${baseUrl}/api/jobs/job-detail-info/${slug}`);
    console.log(response.data);
    return response.data;

  }

  catch (error) {
    throw new Error(`Error fetching project detail: ${error.message}`);
  }
};



export const getClientCount = async (slug) => {


  try {

    const response = await api.get(`/client/user-clients-count/${slug}`);

    return response.data;

  }

  catch (error) {
    throw new Error(`Error fetching client count: ${error.message}`);
  }
};


export const getProjectApplications = async (id,
  category,
  page = 1,
  size = 10,
  sorting = [],
  search = '') => {
  try {
    const queryParams = new URLSearchParams();

    // Pagination
    queryParams.append('page', page);
    queryParams.append('size', size);

    // Search
    if (search) {
      queryParams.append('search', search);
    }

    // Sorting
    if (sorting?.length > 0) {
      sorting.forEach(({ id: sortBy, desc }) => {
        queryParams.append('sort_by', sortBy);
        queryParams.append('order', desc ? 'desc' : 'asc');
      });
    }

    // Filtering
    if (category) {
      queryParams.append('filter', category);
    }

    // Construct the full URL with query parameters
    const baseUrl = normalizeBaseUrl(MAIN_SYSTEM_BASE_URL);
    const url = `${baseUrl}/api/sales/job-applications/${id}?${queryParams.toString()}`;

    // Make the API call
    const response = await axios.get(url);

    // Log and return the response data
    console.log(response.data);
    return response.data;
  } catch (error) {
    // Handle and throw error
    throw new Error(`Error fetching project applications: ${error.message}`);
  }
};




export const getProjectApplicationCount = async (id) => {


  try {

    const baseUrl = normalizeBaseUrl(MAIN_SYSTEM_BASE_URL);
    const response = await axios.get(`${baseUrl}/api/sales/job-applications-category/${id}`);
    console.log(response.data);
    return response.data;

  }

  catch (error) {
    throw new Error(`Error fetching project application count: ${error.message}`);
  }
};
