import api from './api.js';
import useUserStore from '../store/user-store.js';


/**
 * Map /api/sales-executive/list response to a consistent shape for the UI.
 * API returns: { status, count, next, previous, results, current_page, total_pages }
 */
const mapSalesExecutiveListResponse = (data) => {
  if (!data || typeof data !== 'object') {
    return { results: [], count: 0, current_page: 1, total_pages: 0, next: null, previous: null };
  }
  return {
    results: Array.isArray(data.results) ? data.results : [],
    count: typeof data.count === 'number' ? data.count : 0,
    current_page: data.current_page ?? 1,
    total_pages: data.total_pages ?? 0,
    next: data.next ?? null,
    previous: data.previous ?? null,
  };
};

export const getManagersList = async (page = 1, pageSize = 10, sorting = [], search = '') => {
  const queryParams = [`page=${page}`, `size=${pageSize}`];

  if (search) {
    queryParams.push(`search=${search}`);
  }

  if (sorting.length > 0) {
    sorting.forEach(({ id, desc }) => {
      queryParams.push(`sort_by=${id}`);
      queryParams.push(`order=${desc ? "desc" : "asc"}`);
    });
  }

  const endpoint = `/sales-executive/list${queryParams.length > 0 ? `?${queryParams.join('&')}` : ''}`;

  try {
    const response = await api.get(endpoint);
    return mapSalesExecutiveListResponse(response.data);
  } catch (error) {
    throw new Error(`Error fetching managers listing: ${error.message}`);
  }
};

export const getExecutivesList = async (userId, page, pageSize, sorting = [], search = '') => {
  const sortBy = sorting?.[0]?.id || '';
  const sortOrder = sorting?.[0]?.desc ? 'desc' : 'asc';
  const params = new URLSearchParams({
    page,
    size: pageSize,
    sort_by: sortBy,
    sort_order: sortOrder,
    search: search ?? '',
  });
  if (userId != null && userId !== '') {
    params.append('user_id', userId);
  }

  const endpoint = `/sales-executive/list?${params.toString()}`;

  try {
    const response = await api.get(endpoint);
    return mapSalesExecutiveListResponse(response.data);
  } catch (error) {
    throw new Error(`Error fetching executive listing: ${error.message}`);
  }
};

export const getProjectsList = async (userId, status, page = 1, pageSize = 10, sorting, search, isClient = false) => {
  console.log(page, 'pagepage', pageSize)
  const queryParams = [`page=${page}`, `size=${pageSize}`];

  if (userId) {
    queryParams.push(isClient ? `client_id=${userId}` : `user_id=${userId}`);
  }

  if (search) {
    queryParams.push(`search=${encodeURIComponent(search)}`);
  }

  if (sorting.length > 0) {
    sorting.forEach(({ id, desc }) => {
      queryParams.push(`sort_by=${id}`);
      queryParams.push(`order=${desc ? 'desc' : 'asc'}`);
    });
  }

  if (status) {
    queryParams.push(`status=${status}`);
  }

  const endpoint = `/project/list${queryParams.length > 0 ? `?${queryParams.join('&')}` : ''}`;
  console.log(endpoint);
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching project listing: ${error.message}`);
  }
};

export const refetchProjectsData = async () => {
  const endpoint = `/project/populate-projects`;
  try {
    const response = await api.get(endpoint);
    if (response?.status === 200) {
      return response?.data;
    }
  } catch (error) {
    throw new Error(`Error fetching project listing: ${error.message}`);
  }
};


export const getClientProjectsList = async (slug, status, page = 1, pageSize = 10, sorting = [], search = '') => {
  // Initialize query parameters
  const queryParams = [`page=${page}`, `size=${pageSize}`]; // Include page and page size

  // Handle sorting if provided
  if (sorting.length > 0) {
    sorting.forEach(({ id, desc }) => {
      queryParams.push(`sort_by=${id}`);
      queryParams.push(`order=${desc ? 'desc' : 'asc'}`);
    });
  }

  if (search) {
    queryParams.push(`search=${search}`);
  }

  // Add status to query parameters if provided
  if (status) {
    queryParams.push(`status=${status}`);
  }

  // Construct the endpoint with query parameters
  const endpoint = `/project/client-projects/${slug}${queryParams.length > 0 ? `?${queryParams.join('&')}` : ''}`;
  console.log(endpoint); // Debugging: Check the endpoint URL

  try {
    // Make the API request
    const response = await api.get(endpoint);
    return response.data; // Return the data from the API response
  } catch (error) {
    // Handle errors gracefully
    throw new Error(`Error fetching client projects: ${error.message}`);
  }
};


export const getClientsList = async (userId, status, page = 1, pageSize = 10, sorting = [], search = '') => {
  console.log(status, "2nd hit")
  const queryParams = [`page=${page}`, `size=${pageSize}`];

  if (userId) queryParams.push(`user_id=${userId}`);
  if (status) queryParams.push(`status=${status}`);
  if (search) queryParams.push(`search=${encodeURIComponent(search)}`);

  if (sorting.length > 0) {
    sorting.forEach(({ id, desc }) => {
      queryParams.push(`sort_by=${id}`);
      queryParams.push(`order=${desc ? 'desc' : 'asc'}`);
    });
  }


  const endpoint = `/client/list${queryParams.length > 0 ? `?${queryParams.join('&')}` : ''}`;
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching client listing: ${error.message}`);
  }
};

export const refetchClientsData = async () => {
  const endpoint = `/client/populate-companies`;
  console.log(endpoint);
  try {
    const response = await api.get(endpoint);
    if (response?.status === 200) {
      return response?.data;
    }
  } catch (error) {
    throw new Error(`Error fetching client listing: ${error.message}`);
  }
};



export const getStats = async () => {

  try {
    const userType = useUserStore.getState()?.user?.user_type;
    const endpoint = userType === 'sales_manager' ? '/sales-manager/stats' : '/admin-stats/';
    const response = await api.get(endpoint);

    return response.data;
  }

  catch (error) {

    console.error('Error fetching stats:', error);
    throw error;
  }
};


export const getStatsBySlug = async (slug) => {

  try {

    const response = await api.get(`/stats/${slug}`);

    return response.data;
  }

  catch (error) {

    console.error(`Error fetching stats of slug ${slug}:`, error);
    throw error;
  }
};


export const getClientStats = async (category = "week", userId) => {
  try {

    const params = new URLSearchParams({ filter: category });
    if (userId) params.append("user_id", userId);

    const endpoint = `/client-stats?${params.toString()}`;

    const response = await api.get(endpoint);

    const { clients } = response.data; // Destructure clients object from response
    return {
      dates: clients.dates,  // Keeping track of dates
      stats: {
        active: clients.active,
        potential: clients.potential,
        unassigned: clients.unassigned,
        dormant: clients.dormant,
        lost: clients.lost
      }
    };
  } catch (error) {
    console.error('Error fetching client stats:', error);
    throw error;
  }
};


export const getProjectStats = async (category = "week", userId) => {
  try {
    // Construct the query parameters with a conditional for userId
    const params = new URLSearchParams({ filter: category });
    if (userId) params.append("user_id", userId);

    const endpoint = `/project-stats?${params.toString()}`;

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



export const getManagerStats = async (category = "week") => {
  try {
    const response = await api.get(`/sales-manager-stats?filter=${category}`);

    const { managers } = response.data; // Destructure projects object from response

    return {
      dates: managers.dates,  // Keeping track of dates
      managers: managers.managers
    };
  } catch (error) {
    console.error('Error fetching manager stats:', error);
    throw error;
  }
};


export const getExecutiveStats = async (category = "week") => {
  try {
    const response = await api.get(`/sales-executive-stats?filter=${category}`);

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



export const getManagerDetails = async (slug) => {


  try {

    const response = await api.get(`/sales-manager/detail/${slug}`);
    console.log(response.data);
    return response.data;

  }

  catch (error) {
    throw new Error(`Error fetching sales Manager details: ${error.message}`);
  }
};


export const getExecutiveDetails = async (slug) => {


  try {

    const response = await api.get(`/sales-executive/detail/${slug}`);
    console.log(response.data);
    return response.data;

  }

  catch (error) {
    throw new Error(`Error fetching sales Executive details: ${error.message}`);
  }
};


export const getClientDetails = async (id) => {


  try {

    const response = await api.get(`/client/detail/${id}`);
    console.log(response.data);
    return response.data;

  }

  catch (error) {
    throw new Error(`Error fetching client details: ${error.message}`);
  }
};



export const getProjectDetails = async (slug) => {


  try {

    const response = await api.get(`/project/detail/${slug}`);
    console.log(response.data);
    return response.data;

  }

  catch (error) {
    throw new Error(`Error fetching project details: ${error.message}`);
  }
};


export const getClientCount = async () => {


  try {

    const response = await api.get(`/client/all-client-count`);
    console.log(response.data);
    return response.data;

  }

  catch (error) {
    throw new Error(`Error fetching client count: ${error.message}`);
  }
};



export const getProjectCount = async () => {


  try {

    const response = await api.get(`/project/all-project-count`);
    console.log(response.data);
    return response.data;

  }

  catch (error) {
    throw new Error(`Error fetching project count: ${error.message}`);
  }
};


export const getClientProjectCount = async (slug) => {


  try {

    const response = await api.get(`/project/client-projects-count/${slug}`);
    console.log(response.data);
    return response.data;

  }

  catch (error) {
    throw new Error(`Error fetching client project count: ${error.message}`);
  }
};



export const getTargetDetailsByDate = async (id, start_date, end_date) => {


  try {

    const params = new URLSearchParams({
      start_date,
      end_date,
    });

    const response = await api.get(`/target/list/${id}?${params.toString()}`);
    console.log(response.data);
    return response.data;

  }

  catch (error) {
    throw new Error(`Error fetching target details: ${error.message}`);
  }
};

export const getTargetDetails = async (id) => {


  try {

    const response = await api.get(`/target/list/${id}`);
    console.log(response.data);
    return response.data;

  }

  catch (error) {
    throw new Error(`Error fetching target details: ${error.message}`);
  }
};


// export const createNewTarget = async (values) => {
//   try {

//     // Create a new FormData object
//     const formData = new FormData();

//     // Append Formik values to the FormData object
//     formData.append('user', values.id);
//     formData.append('applications_received', values.applications_received);
//     formData.append('companies_reached', values.companies_approached);
//     formData.append('companies_registered', values.companies_signups);
//     formData.append('candidates_received', values.candidates_received);
//     formData.append('candidates_registered', values.candidates_registered);
//     formData.append('hired', values.hirings);
//     formData.append('job_posted', values.job_posts); 


//     // Send the FormData as the request body
//     const response = await api.post(`/target/create`, formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data', // Indicating FormData
//       },
//     });

//     return response.data;
//   } catch (error) {

//     throw error.response?.data || { message: 'Something went wrong' };
//   }
// };


export const getTargetListing = async (start_date, end_date) => {
  try {

    const params = new URLSearchParams({
      start_date,
      end_date,
    });

    // Make the API call with query params
    const response = await api.get(`/target/all-users?${params.toString()}`);
    console.log(response.data);

    return response.data;
  }
  catch (error) {
    throw new Error(`Error fetching target listing: ${error.message}`);
  }
};


export const getAllUsers = async () => {
  try {

    // Make the API call with query params
    const response = await api.get(`/accounts/all-users`);
    console.log(response.data);

    return response.data;
  }
  catch (error) {
    throw new Error(`Error fetching all users: ${error.message}`);
  }
};


export const createNewTarget = async (data) => {
  try {
    // Destructure the data to get user and targets
    const { user, targets } = data;

    // Make the API call with the request payload (data)
    const response = await api.post(`/target/create-target`, {
      user,
      targets
    });

    console.log(response.data);

    return response.data;
  }
  catch (error) {
    throw new Error(`Error creating targets: ${error.message}`);
  }
};


export const updateTarget = async (data) => {
  try {
    // Destructure the data to get user and targets
    const { user, targets } = data;

    // Make the API call with the request payload (data)
    const response = await api.post(`/target/create-target`, {
      user,
      targets
    });


    return response.data;
  }
  catch (error) {
    throw new Error(`Error updating targets: ${error.message}`);
  }
};


export const getTargetForUser = async (id, start_date, end_date) => {
  try {

    const params = new URLSearchParams({
      start_date,
      end_date,
    });

    // Make the API call with query params
    const response = await api.get(`/target/retrieve-target/${id}?${params.toString()}`);
 

    return response.data;
  }
  catch (error) {
    throw new Error(`Error fetching target for user ${id}: ${error.message}`);
  }
};



export const getJobDetail = async (id) => {
  try {


    const response = await api.get(`/project/detail/${id}`);

    return response.data;
  }
  catch (error) {
    throw new Error(`Error fetching job detail for user ${id}: ${error.message}`);
  }
};

export const submitTargetData = async (data) => {
  try {
    const response = await api.post(`/target/achieve-target`, data);
  
    return response.data;
  } catch (error) {
    throw new Error(`Error submitting target data: ${error.message}`);
  }
};

export const getRecruitmentExecutiveStats = async () => {
  const endpoint = `/recruitment_executive/stats`;
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching recruitment executive stats: ${error.message}`);
  }
};

export const getRecruitmentManagerStats = async () => {
  const endpoint = `/recruitment_manager/stats`;


  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching recruitment manager stats: ${error.message}`);
  }
};

export const getProjectManagerStats = async () => {
  const endpoint = `/project_manager/stats`;
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching project manager stats: ${error.message}`);
  }
};

