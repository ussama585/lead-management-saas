import api from './api.js';
import axios from 'axios';
import moment from 'moment';


export const getClientCount = async (sales_manager = '', sales_executive = '', recruitment_manager = '', recruitment_executive = '', recruiter = '') => {
    try {
      const params = new URLSearchParams();
      if (sales_manager) params.append('sales_manager', sales_manager);
      if (sales_executive) params.append('sales_executive', sales_executive);
      if (recruitment_manager) params.append('recruitment_manager', recruitment_manager);
      if (recruitment_executive) params.append('recruitment_executive', recruitment_executive);
      if (recruiter) params.append('recruiter', recruiter);
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get(`/headhunting/client-list-count${query}`);
      return response.data;
    }
    catch (error) {
      throw new Error(`Error fetching client count: ${error.message}`);
    }
};

/** GET api/headhunting/client-stats - managers with nested executives and counts (legacy) */
export const getHeadhuntingClientStats = async () => {
  try {
    const response = await api.get(`/headhunting/client-stats`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching headhunting client stats: ${error.message}`);
  }
};

/** GET api/headhunting/client-stats-level1 - Sales Managers row */
export const getHeadhuntingClientStatsLevel1 = async () => {
  try {
    const response = await api.get(`/headhunting/client-stats-level1`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching client stats level1: ${error.message}`);
  }
};

/** GET api/headhunting/client-stats-level2 - Sales Executives row
 *  Query params (per API): tab = All | SalesManager | Others | Unassigned; id = manager id when filtering by a specific manager.
 *  Send tab only (no id) for All, Others, Unassigned.
 */
export const getHeadhuntingClientStatsLevel2 = async (tab = 'All', id = '') => {
  try {
    const params = new URLSearchParams();
    params.append('tab', tab);
    if (id) params.append('id', id);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/headhunting/client-stats-level2${query}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching client stats level2: ${error.message}`);
  }
};

/** GET api/headhunting/client-stats-level3 - Recruitment Managers row
 *  Query params: tab = All | SalesManager | Others | Unassigned; id = sales executive id when filtering.
 */
export const getHeadhuntingClientStatsLevel3 = async (tab = 'All', id = '') => {
  try {
    const params = new URLSearchParams();
    params.append('tab', tab);
    if (id) params.append('id', id);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/headhunting/client-stats-level3${query}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching client stats level3: ${error.message}`);
  }
};

/** GET api/headhunting/client-stats-level4 - Recruitment Executives row
 *  Query params: tab = All | SalesManager | Others | Unassigned; id = recruitment manager id when filtering.
 */
export const getHeadhuntingClientStatsLevel4 = async (tab = 'All', id = '') => {
  try {
    const params = new URLSearchParams();
    params.append('tab', tab);
    if (id) params.append('id', id);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/headhunting/client-stats-level4${query}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching client stats level4: ${error.message}`);
  }
};

/** GET api/headhunting/all-job-list-count - job counts by status */
export const getAllJobListCount = async (sales_manager = '', sales_executive = '') => {
  try {
    const params = new URLSearchParams();
    if (sales_manager) params.append('sales_manager', sales_manager);
    if (sales_executive) params.append('sales_executive', sales_executive);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/headhunting/all-job-list-count${query}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching job list count: ${error.message}`);
  }
};

/** GET api/headhunting/all-job-list - paginated list of all jobs */
export const getAllJobList = async (page = 1, pageSize = 10, sorting = [], search = '', status = '', sales_manager = '', sales_executive = '') => {
  const sortBy = sorting?.[0]?.id || '';
  const sortOrder = sorting?.[0]?.desc ? 'desc' : 'asc';
  const queryParams = [
    `page=${encodeURIComponent(page)}`,
    `size=${encodeURIComponent(pageSize)}`,
    `sort_by=${encodeURIComponent(sortBy)}`,
    `order=${encodeURIComponent(sortOrder)}`,
  ];
  if (search && String(search).trim()) {
    queryParams.push(`search=${encodeURIComponent(search.trim())}`);
  }
  if (status) {
    queryParams.push(`status=${encodeURIComponent(status)}`);
  }
  if (sales_manager) queryParams.push(`sales_manager=${encodeURIComponent(sales_manager)}`);
  if (sales_executive) queryParams.push(`sales_executive=${encodeURIComponent(sales_executive)}`);
  const endpoint = `/headhunting/all-job-list?${queryParams.join('&')}`;
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching job list: ${error.message}`);
  }
};

export const getAssigningUserList = async () => {
  try {
    const endpoint = `/data-entry/assigning-user-list`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching assigning user list: ${error.message}`);
  }
};

export const createSaasJob = async (jobId, payload) => {
  try {
    const response = await api.post(`/headhunting/saas/create-job/${jobId}`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response?.data;
  } catch (error) {
    throw error.response?.data || { message: error?.message || 'Failed to create SaaS job' };
  }
};

export const createSaasClient = async (clientId, { city, country }) => {
  try {
    const formData = new FormData();
    formData.append('city', city || '');
    formData.append('country', country || '');

    const response = await api.post(`/headhunting/saas/create-client/${clientId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response?.data;
  } catch (error) {
    throw error.response?.data || { message: error?.message || 'Failed to create SaaS client' };
  }
};

export const getSaasJobApplications = async (jobId, page = 1, pageSize = 10, sorting = []) => {
  try {
    const sortBy = sorting?.[0]?.id || '';
    const sortOrder = sorting?.[0]?.desc ? 'desc' : 'asc';
    const params = { page, size: pageSize };
    if (sortBy) {
      params.sort_by = sortBy;
      params.order = sortOrder;
    }
    const response = await api.get(`/headhunting/saas/jobs-applications/${jobId}`, {
      params,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error?.message || 'Failed to fetch SaaS job applications' };
  }
};

export const getSaasApplicantCv = async (email) => {
  try {
    const response = await api.get(
      `/headhunting/applicant-cv/${encodeURIComponent(email)}`
    );
    const data = response.data;
    if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
      return data.data;
    }
    return data;
  } catch (error) {
    throw error.response?.data || { message: error?.message || 'Failed to fetch applicant CV' };
  }
};

export const getSaasApplicantProfile = async (applicationId) => {
  try {
    const response = await api.get(`/headhunting/saas/applicant-profile/${applicationId}`);
    const data = response.data;
    if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
      return data.data;
    }
    return data;
  } catch (error) {
    throw error.response?.data || { message: error?.message || 'Failed to fetch applicant profile' };
  }
};

export const shiftCvPoolToPublic = async ({ job_id, email }) => {
  try {
    const response = await api.post('/headhunting/shift-cvpool-to-public', {
      job_id,
      email,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error?.message || 'Failed to shift to Public CV' };
  }
};

export const shiftSaasApplicationToPublicCv = async ({ job_id, email }) => {
  try {
    const response = await api.post('/headhunting/saas/shift-to-public-cv', {
      job_id,
      email,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error?.message || 'Failed to shift to Public CV' };
  }
};

const normalizeListResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

/** GET api/headhunting/user-active-projects — active projects for current recruiter */
export const getUserActiveProjects = async () => {
  try {
    const response = await api.get('/headhunting/user-active-projects');
    return normalizeListResponse(response.data);
  } catch (error) {
    throw error.response?.data || { message: error?.message || 'Failed to fetch active projects' };
  }
};

/** GET api/headhunting/user-active-jobs/:projectId — active jobs for a project */
export const getUserActiveJobsByProject = async (projectId) => {
  try {
    const response = await api.get(`/headhunting/user-active-jobs/${projectId}`);
    return normalizeListResponse(response.data);
  } catch (error) {
    throw error.response?.data || { message: error?.message || 'Failed to fetch active jobs' };
  }
};

 export const createHeadhuntingClient = async (values) => {
    try {
      const payload = {
        industry: values.industry || '',
        company_name: values.company_name || '',
        contact_person_name: values.contact_person_name || '',
        contact_person_designation: values.contact_person_designation || '',
        email: values.email || '',
        phone_number: values.phone_number || '',
        remarks: values.remarks || '',
        followup_date: values.followup_date || '',
        acquired_through: values.acquired_through || '',
        acquired_through_other: values.acquired_through_other || '',
        // Backend expects a simple ID; cast to string to be safe
        assigned_to: values.assigned_to ? String(values.assigned_to) : '',
      };

      const response = await api.post(`/headhunting/create-client`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response?.data;
    } catch (error) {
      throw error.response?.data || { message: error.response?.data };
    }
  };
  

export const getClientsList = async (slug, status, page = 1, pageSize = 10, sorting = [], search = '', sales_manager = '', sales_executive = '', recruitment_manager = '', recruitment_executive = '', recruiter = '') => {
  const sortBy = sorting?.[0]?.id || ''; // column key
  const sortOrder = sorting?.[0]?.desc ? 'desc' : 'asc'; // direction

  const queryParams = [
    `page=${encodeURIComponent(page)}`,
    `size=${encodeURIComponent(pageSize)}`,
    `sort_by=${encodeURIComponent(sortBy)}`,
    `order=${encodeURIComponent(sortOrder)}`,
  ];

  if (search) {
    queryParams.push(`search=${encodeURIComponent(search)}`);
  }

  if (status !== undefined && status !== null && status !== '') {
    queryParams.push(`status=${encodeURIComponent(status)}`);
  }

  if (sales_manager) {
    queryParams.push(`sales_manager=${encodeURIComponent(sales_manager)}`);
  }
  if (sales_executive) {
    queryParams.push(`sales_executive=${encodeURIComponent(sales_executive)}`);
  }
  if (recruitment_manager) {
    queryParams.push(`recruitment_manager=${encodeURIComponent(recruitment_manager)}`);
  }
  if (recruitment_executive) {
    queryParams.push(`recruitment_executive=${encodeURIComponent(recruitment_executive)}`);
  }
  if (recruiter) {
    queryParams.push(`recruiter=${encodeURIComponent(recruiter)}`);
  }

  const endpoint = `/headhunting/client-list?${queryParams.join('&')}`;

  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching client listing for Slug: ${slug}: ${error.message}`);
  }
};

  export const createNewClient = async (values) => {
    try {
      const formatDate = (date) => {
            return date ? moment(date).format('YYYY-MM-DD') : null;
      };
      // Create a new FormData object
      const formData = new FormData();
      // Append Formik values to the FormData object
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
      formData.append('acquired_through_other', values.acquired_through_other);
      // formData.append('posting_date', values.posting_date ? formatDate(values.posting_date) : ""); // Formatted with moment.js
  
  
      // Send the FormData as the request body
      const response = await api.post(`/headhunting/client-list`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Indicating FormData
        },
      });
      return response?.data;
    } catch (error) {
      throw error.response?.data || { message: error.response?.data };
    }
  };
  
  export const getClientDetails = async (id) => {
    try {
      const endpoint = `/headhunting/update-client/${id}`;  
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      // console.error('Error fetching potential client details:', error);
      throw error;
    }
  };
  
  export const editClient = async ({ id, values }) => {
      try {
        const formatDate = (date) => {
          return date ? moment(date).format('YYYY-MM-DD') : null;
      };
      // Create a new FormData object
      const formData = new FormData();
      // Append Formik values to the FormData object
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
      formData.append('acquired_through_other', values.acquired_through_other);
      // formData.append('posting_date', values.posting_date ? formatDate(values.posting_date) : ""); // Formatted with moment.js


      // Send the FormData as the request body
      const response = await api.patch(`/headhunting/update-client/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Indicating FormData
        },
      });

      return response?.data;
    } catch (error) {
      throw error.response?.data || { message: error.response?.data };
    }
  };
  
  export const statusChangeMutationFunc = async ({ id, status }) => {
    try {
      const formData = new FormData();
      formData.append('status', status);
      const response = await api.patch(`/headhunting/update-client/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Something went wrong' };
    }
  };

  export const getClientProjectCount = async (id) => {
    try {
      const response = await api.get(`/headhunting/client-project-list-count/${id}`);
      return response.data;  
    }
    catch (error) {
      throw new Error(`Error fetching client project count: ${error.message}`);
    }
  };

  /** GET api/headhunting/client-history-track/:clientId - returns array of { status, updated_at } */
  export const getClientHistoryTrack = async (clientId) => {
    try {
      const response = await api.get(`/headhunting/client-history-track/${clientId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching client history track: ${error.message}`);
    }
  };

  /** GET api/headhunting/project-history-track/:projectId - returns array of { status, updated_at } */
  export const getProjectHistoryTrack = async (projectId) => {
    try {
      const response = await api.get(`/headhunting/project-history-track/${projectId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching project history track: ${error.message}`);
    }
  };

  /** GET api/headhunting/job-history-track/:jobId - returns array of { status, updated_at } */
  export const getJobHistoryTrack = async (jobId) => {
    try {
      const response = await api.get(`/headhunting/job-history-track/${jobId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching job history track: ${error.message}`);
    }
  };

  /** GET api/headhunting/job-resume-history-track/:resumeId - returns array of { status, updated_at } */
  export const getJobResumeHistoryTrack = async (resumeId) => {
    try {
      const response = await api.get(`/headhunting/job-resume-history-track/${resumeId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching job resume history track: ${error.message}`);
    }
  };

  export const getClientProjectsList = async (id, status, page = 1, pageSize = 10, sorting = [], search = '') => {
    const queryParams = [
      `page=${encodeURIComponent(page)}`,
      `size=${encodeURIComponent(pageSize)}`,
    ];
  
    if (sorting.length > 0) {
      sorting.forEach(({ id: sortId, desc }) => {
        queryParams.push(`sort_by=${encodeURIComponent(sortId)}`);
        queryParams.push(`order=${encodeURIComponent(desc ? 'desc' : 'asc')}`);
      });
    }
  
    if (search) {
      queryParams.push(`search=${encodeURIComponent(search)}`);
    }
  
    if (status) {
      queryParams.push(`status=${encodeURIComponent(status)}`);
    }
  
    const endpoint = `/headhunting/client-project-list/${id}${queryParams.length > 0 ? `?${queryParams.join('&')}` : ''}`;
  
    try {
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching client projects: ${error.message}`);
    }
  };

  export const updateStatus = async({value,id}) => {
    // change api for project editing
      const response = await api.patch(`/headhunting/update-project/${id}`,{
        status: value
      });
      return response.data
  };

export const updateProjectStatus = async (id, payload) => {
  try {
    const response = await api.patch(`/headhunting/update-project/${id}`, payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Something went wrong' };
  }
};

// POST api/headhunting/project-manager-remark/:projectId
export const addProjectManagerRemark = async (projectId, projectManagerRemarks = '') => {
  try {
    const formData = new FormData();
    formData.append('project_manager_remarks', projectManagerRemarks ?? '');
    const response = await api.post(
      `/headhunting/project-manager-remark/${projectId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

// GET api/headhunting/project-remarks-list/:projectId
export const getProjectRemarksList = async (projectId) => {
  try {
    const response = await api.get(`/headhunting/project-remarks-list/${projectId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

// POST api/headhunting/add-project-remarks/:projectId
export const addProjectRemark = async (projectId, projectManagerRemarks = '') => {
  try {
    const payload = { project_manager_remarks: projectManagerRemarks ?? '' };
    const response = await api.post(`/headhunting/add-project-remarks/${projectId}`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

// GET api/headhunting/project-remarks/:remarkId
export const getProjectRemarkById = async (remarkId) => {
  try {
    const response = await api.get(`/headhunting/project-remarks/${remarkId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

// PATCH api/headhunting/project-remarks/:remarkId
export const updateProjectRemarkById = async (remarkId, projectManagerRemarks = '') => {
  try {
    const formData = new FormData();
    formData.append('project_manager_remarks', projectManagerRemarks ?? '');
    const response = await api.patch(`/headhunting/project-remarks/${remarkId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

// DELETE api/headhunting/project-remarks/:remarkId
export const deleteProjectRemarkById = async (remarkId) => {
  try {
    const response = await api.delete(`/headhunting/project-remarks/${remarkId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};
  
  export const createNewProject = async ({ companyId, values }) => {
    try {
      const formatDate = (date) => {
            return date ? moment(date).format('YYYY-MM-DD') : null;
      };
      // Create a new FormData object
      const formData = new FormData();


      // Append Formik values to the FormData object
      formData.append('job_title', values.job_title);
      formData.append('resources_required', values.resources_required);
      formData.append('posting_date', values.posting_date ? formatDate(values.posting_date) : "");
      formData.append('hiring_deadline', values.hiring_deadline ? formatDate(values.hiring_deadline) : "");
      formData.append('remarks', values.remarks);
      formData.append('followup_date', values.followup_date ? formatDate(values.followup_date) : "");
      formData.append('last_followup_date', values.last_followup_date ? formatDate(values.last_followup_date) : "");
      // formData.append('status', values.status);
      formData.append('description', values.description);
      formData.append('client', companyId);
  
      // Send the FormData as the request body
      const response = await api.post(`/headhunting/project-list`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Indicating FormData
        },
      });

      return response.data;
    } catch (error) {
  
      throw error.response?.data || { message: 'Something went wrong' };
    }
  };


  export const editProject = async ({ id, values }) => {
    try {
      const formatDate = (date) => {
            return date ? moment(date).format('YYYY-MM-DD') : null;
      };
      // Create a new FormData object
      const formData = new FormData();


      // Append Formik values to the FormData object
      formData.append('job_title', values.job_title);
      formData.append('resources_required', values.resources_required);
      formData.append('posting_date', values.posting_date ? formatDate(values.posting_date) : "");
      formData.append('hiring_deadline', values.hiring_deadline ? formatDate(values.hiring_deadline) : "");
      formData.append('remarks', values.remarks);
      formData.append('followup_date', values.followup_date ? formatDate(values.followup_date) : "");
      formData.append('last_followup_date', values.last_followup_date ? formatDate(values.last_followup_date) : "");
      // formData.append('status', values.status);
      // formData.append('created_at', values.created_at ? formatDate(values.created_at) : "");
      formData.append('description', values.description);
  
      // Send the FormData as the request body
      const response = await api.patch(`/headhunting/update-project/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Indicating FormData
        },
      });
  
      return response.data;
    } catch (error) {
  
      throw error.response?.data || { message: 'Something went wrong' };
    }
  };



  //getProjectDetails
  export const getProjectDetails = async (id) => {
    try {
      const endpoint = `/headhunting/update-project/${id}`;  
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      // console.error('Error fetching potential client details:', error);
      throw error;
    }
  };


  export const getAllProjectsList = async (status, page = 1, pageSize = 10, sorting = [], search = '') => {
    const queryParams = [
      `page=${encodeURIComponent(page)}`,
      `size=${encodeURIComponent(pageSize)}`,
    ];
  
    if (sorting.length > 0) {
      sorting.forEach(({ id: sortId, desc }) => {
        queryParams.push(`sort_by=${encodeURIComponent(sortId)}`);
        queryParams.push(`order=${encodeURIComponent(desc ? 'desc' : 'asc')}`);
      });
    }
  
    if (search) {
      queryParams.push(`search=${encodeURIComponent(search)}`);
    }
  
    if (status) {
      queryParams.push(`status=${encodeURIComponent(status)}`);
    }
  
    const endpoint = `/headhunting/project-list${queryParams.length > 0 ? `?${queryParams.join('&')}` : ''}`;
  
    try {
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching client projects: ${error.message}`);
    }
  };


  export const getAllProjectsCount = async () => {
    try {
      const response = await api.get(`/headhunting/project-list-count`);
      return response.data;  
    }
    catch (error) {
      throw new Error(`Error fetching client count: ${error.message}`);
    }
  };


  export const getClientsListOfExecutive = async (id, status, page = 1, pageSize = 10, sorting = [], search = '', sales_manager = '', sales_executive = '', recruitment_manager = '', recruitment_executive = '', recruiter = '') => {
    const sortBy = sorting?.[0]?.id || '';         // column key
    const sortOrder = sorting?.[0]?.desc ? 'desc' : 'asc'; // direction
    const params = new URLSearchParams({
      page,
      size: pageSize,
      sort_by: sortBy,
      order: sortOrder,
      search,
      status,
    });
    if (sales_manager) params.append('sales_manager', sales_manager);
    if (sales_executive) params.append('sales_executive', sales_executive);
    if (recruitment_manager) params.append('recruitment_manager', recruitment_manager);
    if (recruitment_executive) params.append('recruitment_executive', recruitment_executive);
    if (recruiter) params.append('recruiter', recruiter);

    const endpoint = `/headhunting/client-list?${params.toString()}`;

    try {
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching client listing for id: ${id}: ${error.message}`);
    }
  };


  export const getAllProjectsListOfExecutive = async (id, status, page = 1, pageSize = 10, sorting = [], search = '') => {
    const queryParams = [
      `page=${encodeURIComponent(page)}`,
      `size=${encodeURIComponent(pageSize)}`,
    ];
  
    if (sorting.length > 0) {
      sorting.forEach(({ id: sortId, desc }) => {
        queryParams.push(`sort_by=${encodeURIComponent(sortId)}`);
        queryParams.push(`order=${encodeURIComponent(desc ? 'desc' : 'asc')}`);
      });
    }
  
    if (search) {
      queryParams.push(`search=${encodeURIComponent(search)}`);
    }
  
    if (status) {
      queryParams.push(`status=${encodeURIComponent(status)}`);
    }
  
    if (id) {
      queryParams.push(`id=${encodeURIComponent(id)}`);
    }
  
    const endpoint = `/headhunting/project-list${queryParams.length > 0 ? `?${queryParams.join('&')}` : ''}`;
  
    try {
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching client projects: ${error.message}`);
    }
  };

  export const getClientCountForExecutive = async (id, sales_manager = '', sales_executive = '', recruitment_manager = '', recruitment_executive = '', recruiter = '') => {
    try {
      const params = new URLSearchParams();
      if (id) params.append('id', id);
      if (sales_manager) params.append('sales_manager', sales_manager);
      if (sales_executive) params.append('sales_executive', sales_executive);
      if (recruitment_manager) params.append('recruitment_manager', recruitment_manager);
      if (recruitment_executive) params.append('recruitment_executive', recruitment_executive);
      if (recruiter) params.append('recruiter', recruiter);
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get(`/headhunting/client-list-count${query}`);
      return response.data;
    }
    catch (error) {
      throw new Error(`Error fetching client count: ${error.message}`);
    }
};


export const getClientProjectCountForExecutive = async (id) => {
  try {
    const response = await api.get(`/headhunting/project-list-count?id=${id}`);
    return response.data;  
  }
  catch (error) {
    throw new Error(`Error fetching client project count: ${error.message}`);
  }
};

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

    const endpoint = `/headhunting/user-list?${queryParams.toString()}`;

    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const getUserCount = async () => {
  try {
    const response = await api.get(`/headhunting/user-list-count`);
    return response.data;
  }
  catch (error) {
    throw new Error(`Error fetching user details: ${error.message}`);
  }
};



// Sales Calling APIs

export const getCallingCount = async (id = null, callsFilter) => {
  try {
    const endpoint = id
                      ? `/sales-call/list-count?id=${id}`
                      : callsFilter 
                        ? `/sales-call/list-count?order_by=${callsFilter}`
                        : `/sales-call/list-count`;

    const response = await api.get(endpoint);  
    return response.data;  
  }
  catch (error) {
    throw new Error(`Error fetching sales call list count: ${error.message}`);
  }
};

export const getCallingList = async ({ page = 1, pageSize = 10, sorting = [], search = '', listType,  userId, callsFilter }) => {
  const sortBy = sorting?.[0]?.id || '';
  const sortOrder = sorting?.[0]?.desc ? 'desc' : 'asc';
  const params = new URLSearchParams({
    id: userId || '',
    page: page,
    size: pageSize,
    sort_by: sortBy,
    order: sortOrder,
    search: search,
    status: listType,
    order_by: callsFilter || '',
  });
  const endpoint = `/sales-call/list?${params.toString()}`;
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching calling list: ${error.message}`);
  }
};

export const updateCallingClientStatus = async({value,id}) => {
    const response = await api.patch(`/sales-call/update/${id}`,{
      status: value
    });
    return response.data
};

export const createNewCallRecord = async ({id = null, values}) => {
  try {
    const formatDate = (date) => {
          return date ? moment(date).format('YYYY-MM-DD') : null;
    };
    // Create a new FormData object
    const formData = new FormData();
    // Append Formik values to the FormData object
      // formData.append('representative_name', values.representative_name);
      // formData.append('company_name', values.company_name);
      // formData.append('company_category', values.company_category);
      // formData.append('industry', values.industry);
      // formData.append('city', values.city);
      // formData.append('country', values.country);
      // formData.append('email', values.email);
      // formData.append('phone', values.phone);
      // formData.append('status', values.status);
      // // formData.append('designation', values.designation);
      // formData.append('remarks', values.remarks);
      // formData.append('lead_source', values.lead_source);
      // formData.append('lead_source_other', values.lead_source_other);
      // formData.append('contact_date', values.contact_date ? formatDate(values.contact_date) : "");
      // formData.append('followup_date', values.followup_date ? formatDate(values.followup_date) : "");


      formData.append('representative_name', values.representative_name || '');
      formData.append('representative_email', values.representative_email || '');
      formData.append('representative_phone', values.representative_phone || '');
      formData.append('representative_designation', values.representative_designation || '');
      formData.append('entity_type', values.entity_type || '');
      formData.append('company_name', values.company_name || '');
      formData.append('industry', values.industry || '');
      formData.append('company_email', values.company_email || '');
      formData.append('company_phone', values.company_phone || '');
      formData.append('city', values.city || '');
      formData.append('country', values.country || '');
      formData.append('website', values.website || '');
      formData.append('linkedin', values.linkedin || '');
      formData.append('status', values.status || '');
      formData.append('acquired_through', values.acquired_through || '');
      formData.append('acquired_through_other', values.acquired_through_other || '');

      if (!id) {
        formData.append('data_entry_date', values.data_entry_date ? formatDate(values.data_entry_date) : "");
      }
      
      formData.append('followup_date', values.followup_date ? formatDate(values.followup_date) : "");
      formData.append('next_followup_date', values.next_followup_date ? formatDate(values.next_followup_date) : "");
      formData.append('remarks', values.remarks || '');

    const endpoint = id
      ? `/sales-call/update/${id}`
      : `/sales-call/add`;

    const method = id ? 'patch' : 'post';

    const response = await api[method](endpoint, formData);
    return response?.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const getCallRecordDetails = async (id) => {
  try {
    const endpoint = `/sales-call/update/${id}`;  
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const convertLeads = async ({id, towards}) => {
  try {
    const endpoint = `/sales-call/convert-to-${towards}/${id}`;  
    const response = await api.post(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const uploadCSVFileData = async (data) => {
  try {
    if (!data || data.length < 2) throw new Error("No data to upload");

    const headers = data[0];
    const rows = data.slice(1);

    // Transform rows into array of objects
    const formattedData = rows.map((row) => {
      const paddedRow = [...row];
      const rowObject = {};
      headers.forEach((header, index) => {
        rowObject[header] = paddedRow[index] ?? '';
      });

      return rowObject;
    });
    const endpoint = `/sales-call/bulk-add`;
    const response = await api.post(endpoint, formattedData);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export const updateHeadhuntingClient = async (id, values) => {
  try {
    const formData = new FormData();
    // Append all values to formData
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value);
    });
    const response = await api.patch(`/headhunting/update-client/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const updateHeadhuntingClientJSON = async (id, values) => {
  try {
    const response = await api.patch(`/headhunting/update-client/${id}`, values, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};




export const getClientProjectsListById = async (clientId) => {
  try {
    const response = await api.get(`/headhunting/client-project-list/${clientId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching projects for client ${clientId}: ${error.message}`);
  }
};

export const getClientProjectCountById = async (clientId) => {
  try {
    const response = await api.get(`/headhunting/client-project-list-count/${clientId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching project count for client ${clientId}: ${error.message}`);
  }
};

export const createHeadhuntingJob = async (values) => {
  try {
    // Format date fields to ISO string if they exist
    const formatDate = (date) => date ? moment(date).toISOString(true) : undefined;
    const payload = {
      ...values,
      cv_submission_deadline: values.cv_submission_deadline ? formatDate(values.cv_submission_deadline) : undefined,
      expected_joining_date: values.expected_joining_date ? formatDate(values.expected_joining_date) : undefined,
    };

    const response = await api.post(`/headhunting/create-job`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response?.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const createHeadhuntingProject = async (values) => {
  try {
    const formData = new FormData();
    
    // Append all values to formData
    Object.entries(values).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });
    
    const response = await api.post(`/headhunting/create-project`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const createHeadhuntingBatch = async (values) => {
  try {
    const formData = new FormData();
    
    // Append job ID
    formData.append('job', values.job);

    // Append CV submission deadline
    if (values.cv_submission_deadline) {
      formData.append('cv_submission_deadline', values.cv_submission_deadline);
    }

    // Append resume files (multiple files)
    if (values.resumes && Array.isArray(values.resumes)) {
      values.resumes.forEach((file) => {
        formData.append('resumes', file);
      });
    }

    const response = await api.post(
      `/headhunting/create-batch`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || "Something went wrong" };
  }
};


export const getJobResumeBatchList = async (jobId, page = 1, pageSize = 10) => {
  try {
    const response = await api.get(`/headhunting/job-resume-batch-list/${jobId}`, {
      params: { page, size: pageSize },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

/** GET api/headhunting/job-batches-list/:jobId - returns array of { id, batch_name } */
export const getJobBatchesList = async (jobId) => {
  try {
    const response = await api.get(`/headhunting/job-batches-list/${jobId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching job batches list: ${error.message}`);
  }
};

/** POST api/headhunting/shift-public-resume-to-batch - form-data: public_resume_id, batch_id; returns { message } */
export const shiftPublicResumeToBatch = async (publicResumeId, batchId) => {
  try {
    const formData = new FormData();
    formData.append('public_resume_id', publicResumeId);
    formData.append('batch_id', batchId);
    const response = await api.post(
      `/headhunting/shift-public-resume-to-batch`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const updateResumeStatus = async (resumeId, status) => {
  try {
    const response = await api.patch(`/headhunting/update-resume/${resumeId}`, {
      status: status
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const updateResumeStatusFormData = async (resumeId, statusOrFormData) => {
  try {
    // Support both simple status string and a pre-built FormData
    let payload;

    if (statusOrFormData instanceof FormData) {
      // Caller already prepared complete FormData (e.g. status + remarks)
      payload = statusOrFormData;
    } else {
      // Backwards-compatible: caller passed just a status string
      const formData = new FormData();
      formData.append('status', statusOrFormData);
      payload = formData;
    }

    const response = await api.patch(
      `/headhunting/update-resume-status/${resumeId}`,
      payload,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const updateBatchName = async (batchId, batchName) => {
  try {
    const response = await api.patch(`/headhunting/update-batch/${batchId}`, {
      batch_name: batchName
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const updateBatchResumeName = async (id, name) => {
  try {
    const response = await api.patch(`/headhunting/batch-resume_name/${id}`, { name });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const updatePublicResumeName = async (id, name) => {
  try {
    const response = await api.patch(`/headhunting/public-resume_name/${id}`, { name });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const addResumesToBatch = async (batchId, resumes) => {
  try {
    const formData = new FormData();
    
    // Append resume files (multiple files)
    if (resumes && Array.isArray(resumes)) {
      resumes.forEach((file) => {
        formData.append('resumes', file);
      });
    }
    
    const response = await api.post(`/headhunting/add-resumes-to-batch/${batchId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const deleteBatch = async (batchId) => {
  try {
    const response = await api.delete(`/headhunting/delete-batch/${batchId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const deleteResume = async (resumeId) => {
  try {
    const response = await api.delete(`/headhunting/delete-resume/${resumeId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

// DELETE api/headhunting/delete-batch-resume - form-data: job_resume_id; moves resume back to Public list
export const deleteBatchResume = async (jobResumeId) => {
  try {
    const formData = new FormData();
    formData.append('job_resume_id', jobResumeId);

    const response = await api.delete(
      `/headhunting/delete-batch-resume`,
      {
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const getProjectJobList = async (projectId, status = null, page = 1, pageSize = 10, sorting = [], search = '') => {
  try {
    const params = new URLSearchParams({
      page,
      size: pageSize,
    });
    
    // Add status parameter if provided
    if (status) {
      params.append('status', status);
    }
    
    // Add sorting parameters if provided
    if (sorting && sorting.length > 0) {
      const sortField = sorting[0].id;
      const sortDirection = sorting[0].desc ? 'desc' : 'asc';
      params.append('sort_by', sortField);
      params.append('order', sortDirection);
    }
    
    // Add search parameter if provided
    if (search) {
      params.append('search', search);
    }
    
    const endpoint = `/headhunting/project-job-list/${projectId}?${params.toString()}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const getClientJobListByProject = async (projectId) => {
  try {
    const endpoint = `/headhunting/client-job-list-by-project/${projectId}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const getProjectJobListCount = async (projectId) => {
  try {
    const endpoint = `/headhunting/project-job-list-count/${projectId}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

// Get all jobs for a client by client ID
export const getClientJobList = async (clientId) => {
  try {
    const endpoint = `/headhunting/client-job-list/${clientId}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const getClientProjectListCount = async (clientId) => {
  try {
    const endpoint = `/headhunting/client-project-list-count/${clientId}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const getJobDetails = async (jobId) => {
  try {
    const endpoint = `/headhunting/update-job/${jobId}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const updateJob = async (jobId, values) => {
  try {
    // Format date fields to ISO string if they exist
    const formatDate = (date) => date ? moment(date).toISOString(true) : undefined;
    
    const payload = {
      ...values,
      cv_submission_deadline: values.cv_submission_deadline ? formatDate(values.cv_submission_deadline) : undefined,
      expected_joining_date: values.expected_joining_date ? formatDate(values.expected_joining_date) : undefined,
    };

    const response = await api.patch(`/headhunting/update-job/${jobId}`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response?.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

// POST api/headhunting/job-recruiter-remarks/:jobId
export const addRecruiterRemarkToJob = async (jobId, recruiterRemarks = '') => {
  try {
    const formData = new FormData();
    formData.append('recruiter_remarks', recruiterRemarks ?? '');
    const response = await api.post(
      `/headhunting/job-recruiter-remarks/${jobId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const addResumes = async (jobResumeBatchId, resumes) => {
  try {
    const formData = new FormData();
    
    // Append job_resume_batch ID
    formData.append('job_resume_batch', jobResumeBatchId);
    
    // Append resume files (multiple files)
    if (resumes && Array.isArray(resumes)) {
      resumes.forEach((file) => {
        formData.append('resumes', file);
      });
    }
    
    const response = await api.post(`/headhunting/add-resume`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const assignRecruiter = async (clientId, recruiterId) => {
  try {
    const formData = new FormData();
    formData.append('client_id', clientId);
    formData.append('recruiter_id', recruiterId);
    
    const response = await api.post(`/headhunting/assign-recruiter`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const getAssignRecruiterList = async () => {
  try {
    const response = await api.get(`/headhunting/assign-recruiter-list`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};


export const getProjectInformation = async (projectId) => {
  try {
    const endpoint = `/headhunting/update-project/${projectId}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const updateMetaLeadStatus = async (leadId, data = {}) => {
  try {
    const {
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
    } = data;

    const formData = new FormData();
    if (status) formData.append('status', status);
    if (remarks !== undefined && remarks !== null && remarks !== '') {
      formData.append('remarks', remarks);
    }
    if (proposal) {
      formData.append('proposal', proposal);
    }

    const appendIfDefined = (key, value) => {
      if (value === undefined || value === null) return;
      if (typeof value === 'string' && value.trim() === '') return;
      formData.append(key, value);
    };

    appendIfDefined('contract_currency', contract_currency);
    appendIfDefined('contract_subtotal_amount', contract_subtotal_amount);
    appendIfDefined('discount_amount', discount_amount);
    appendIfDefined('discount_percentage', discount_percentage);
    appendIfDefined('contract_price', contract_price);
    appendIfDefined('total_contract_amount', total_contract_amount);
    appendIfDefined('pricing_type', pricing_type);
    appendIfDefined('job_count', job_count);
    appendIfDefined('total_vacancies', total_vacancies);

    if (Array.isArray(selected_job_ids) && selected_job_ids.length > 0) {
      formData.append('selected_job_ids', selected_job_ids.join(','));
    }

    const endpoint = `/meta-leads/update-status/${leadId}`;
    const response = await api.patch(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const getAssignedProjectManagers = async () => {
  try {
    const response = await api.get('/headhunting/assigned-projects-recruitment-managers');
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching assigned project recruitment managers: ${error.message}`);
  }
};

export const getAssignedProjectRecruiters = async (recruitmentManagerId = '', approval = '') => {
  try {
    const query = new URLSearchParams();
    if (recruitmentManagerId) query.set('manager_id', recruitmentManagerId);
    if (approval) query.set('approval', approval);
    const queryString = query.toString();
    const response = await api.get(`/headhunting/assigned-projects-recruiters${queryString ? `?${queryString}` : ''}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching assigned project recruiters: ${error.message}`);
  }
};

export const getAssignedClientsRecruiters = async () => {
  try {
    const response = await api.get('/headhunting/assigned-clients-recruiters');
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching assigned clients recruiters: ${error.message}`);
  }
};

export const getAssignedProjects = async (page = 1, pageSize = 10, sorting = [], search = '', status = '', recruitmentManagerId = '', recruiterId = '', approvalStatus = '') => {
  try {
    const sortBy = sorting?.[0]?.id || '';
    const sortOrder = sorting?.[0]?.desc ? 'desc' : 'asc';

    const queryParams = [
      `page=${encodeURIComponent(page)}`,
      `size=${encodeURIComponent(pageSize)}`,
      `sort_by=${encodeURIComponent(sortBy)}`,
      `order=${encodeURIComponent(sortOrder)}`,
      `search=${encodeURIComponent(search)}`,
    ];

    if (status) {
      queryParams.push(`status=${encodeURIComponent(status)}`);
    }
    if (recruitmentManagerId) {
      queryParams.push(`recruitment_manager=${encodeURIComponent(recruitmentManagerId)}`);
    }
    if (recruiterId) {
      queryParams.push(`recruiter=${encodeURIComponent(recruiterId)}`);
    }
    if (approvalStatus) {
      queryParams.push(`approval_status=${encodeURIComponent(approvalStatus)}`);
    }

    const endpoint = `/headhunting/assigned-projects${queryParams.length > 0 ? `?${queryParams.join('&')}` : ''}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching assigned projects: ${error.message}`);
  }
};

export const getAssignedProjectsCount = async (status = '', recruitmentManagerId = '', recruiterId = '', approvalStatus = '') => {
  try {
    const queryParams = [];
    if (status) {
      queryParams.push(`status=${encodeURIComponent(status)}`);
    }
    if (recruitmentManagerId) {
      queryParams.push(`recruitment_manager=${encodeURIComponent(recruitmentManagerId)}`);
    }
    if (recruiterId) {
      queryParams.push(`recruiter=${encodeURIComponent(recruiterId)}`);
    }
    if (approvalStatus) {
      queryParams.push(`approval_status=${encodeURIComponent(approvalStatus)}`);
    }

    const endpoint = `/headhunting/assigned-projects-count${queryParams.length > 0 ? `?${queryParams.join('&')}` : ''}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching assigned projects count: ${error.message}`);
  }
};

export const getProjectApprovalCounts = async () => {
  try {
    const response = await api.get(`/headhunting/project-approval-counts`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching project approval counts: ${error.message}`);
  }
};

export const getProjectApprovalDetails = async (projectId) => {
  try {
    const response = await api.get(`/headhunting/projects-approval-details/${projectId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Something went wrong' };
  }
};

export const updateProjectApprovalStatus = async (projectId, approvalStatus, reason = '', field = 'recruitment_manager') => {
  try {
    const approvalKey = field === 'recruiter' ? 'recruiter_approval' : 'recruitment_manager_approval';
    const reasonKey = field === 'recruiter' ? 'recruiter_reason' : 'recruitment_manager_reason';
    const formData = new FormData();
    formData.append(approvalKey, approvalStatus);
    if (reason) formData.append(reasonKey, reason);
    const response = await api.patch(`/headhunting/assigned-projects-approval/${projectId}`, formData);
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || 'Failed to update approval status');
  }
};

// Toggle the "Review" (is_reviewed) flag on a project
export const updateProjectReviewedStatus = async (projectId, isReviewed) => {
  try {
    const formData = new FormData();
    formData.append('is_reviewed', isReviewed);
    const response = await api.patch(`/headhunting/update-review/${projectId}`, formData);
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || 'Failed to update review status');
  }
};

// Admin-only: independently set RM and/or Recruiter approval status (with reasons) on a project
export const updateProjectApprovalStatusAdmin = async (projectId, payload) => {
  try {
    const response = await api.patch(`/headhunting/assigned-projects-approval/${projectId}`, payload);
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || 'Failed to update approval status');
  }
};

// Recruitment executive stats (for manager overview cards)
export const getRecruitmentExecutiveStats = async () => {
  try {
    const response = await api.get(`/headhunting/recruitment-executive-stats`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching recruitment executive stats: ${error.message}`);
  }
};

// Project Proposal APIs
export const getProjectProposal = async (proposalId) => {
  try {
    const response = await api.get(`/headhunting/project-proposal/${proposalId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch project proposal' };
  }
};

export const updateProjectProposal = async (proposalId, data) => {
  try {
    const response = await api.patch(`/headhunting/project-proposal/${proposalId}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update project proposal' };
  }
};


export const updateJobScreeningForm = async (jobId, screeningFormId) => {
  try {
    const endpoint = `/headhunting/update-screening-form/${jobId}`;

    const formData = new FormData();
    formData.append('screening_form', screeningFormId);

    const response = await api.patch(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error(`Error updating screening form for job ${jobId}:`, error);
    throw error;
  }
};

export const getAvailableScreenings = async () => {
  try {
    const endpoint = `/screening/available`;

    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching available screenings:', error);
    throw error;
  }
};


export const getJobScreeningResponses = async (jobId, email = '', resumeId = '') => {
  try {
    const params = new URLSearchParams({
      job_id: jobId,
      email: email ?? '',
      resume_id: resumeId ?? '',
    });

    const endpoint = `/headhunting/job-screening-response?${params.toString()}`;

    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error fetching screening responses for job ${jobId}:`, error);
    throw error;
  }
};

export const getJobScreeningResponsesByPath = async (jobId, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.sort_by != null) queryParams.append('sort_by', params.sort_by);
    if (params.order != null) queryParams.append('order', params.order);
    if (params.page != null) queryParams.append('page', params.page);
    if (params.size != null) queryParams.append('size', params.size);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const endpoint = `/headhunting/job-screening-responses/${jobId}${query}`;

    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error fetching screening responses for job ${jobId}:`, error);
    throw error;
  }
};

export const getJobBatchScreeningResponsesByPath = async (jobId, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.sort_by != null) queryParams.append('sort_by', params.sort_by);
    if (params.order != null) queryParams.append('order', params.order);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const endpoint = `/headhunting/job-batch-screening-responses/${jobId}${query}`;

    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error fetching batch screening responses for job ${jobId}:`, error);
    throw error;
  }
};


export const generateScreeningFormLink = async (jobId, resumeInstanceId, email = '', resumeId = '') => {
  try {
    const endpoint = `/headhunting/generate-screening-link/${jobId}`;

    const formData = new FormData();
    formData.append('id', resumeInstanceId);
    formData.append('email', email ?? '');
    formData.append('resume_id', resumeId ?? '');

    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error(`Error generating screening link for job ${jobId}, resume instance ${resumeInstanceId}:`, error);
    throw error;
  }
};

export const getPublicResumeList = async (jobId, page = 1, pageSize = 10) => {
  try {
    const endpoint = `/headhunting/public-resume-list/${jobId}`;

    const response = await api.get(endpoint, {
      params: { page, size: pageSize },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching public resume list for job ${jobId}:`, error);
    throw error;
  }
};

export const updateJobSettings = async (jobId, values) => {
  try {
    // Format date fields to ISO string if they exist
    const formatDate = (date) => date ? moment(date).toISOString(true) : undefined;

    const payload = {
      ...values,
      ...(values.cv_submission_deadline && { cv_submission_deadline: formatDate(values.cv_submission_deadline) }),
      ...(values.expected_joining_date && { expected_joining_date: formatDate(values.expected_joining_date) }),
    };

    const response = await api.patch(`/headhunting/update-job/${jobId}`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response?.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

/** POST api/headhunting/public-resume-share/:jobId — record that the job’s public CV upload link was shared */
export const postJobPublicResumeShare = async (jobId) => {
  try {
    const response = await api.post(
      `/headhunting/public-resume-share/${jobId}`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const publicResumeShare = async (resumeId, data = {}) => {
  try {
    const formData = new FormData();

    // Append any data fields that need to be sent
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });

    const response = await api.patch(
      `/headhunting/public-resume-share/${resumeId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

// Job Resume Share - PATCH request
export const jobResumeShare = async (batchId, data = {}) => {
  try {
    const formData = new FormData();

    // Append any data fields that need to be sent
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });

    const response = await api.patch(
      `/headhunting/job-resume-share/${batchId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

// POST api/headhunting/add-public-resume - add one or more resumes directly to Public CV list for a job
export const addPublicResume = async (jobId, resumes) => {
  try {
    const formData = new FormData();
    formData.append('job_id', jobId);

    if (resumes && Array.isArray(resumes)) {
      resumes.forEach((file) => {
        formData.append('resumes', file);
      });
    }

    const response = await api.post(
      `/headhunting/add-public-resume`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const getJobResumeCount = async (jobId) => {
  try {
    const endpoint = `/headhunting/job-resume-count/${jobId}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching job resume count: ${error.message}`);
  }
};

export const deleteHeadhuntingJob = async (jobId, reason) => {
  try {
    const response = await api.delete(`/headhunting/delete-job/${jobId}`, {
      data: { delete_reason: reason }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const deleteHeadhuntingClient = async (clientId, reason) => {
  try {
    const response = await api.delete(`/headhunting/delete-client/${clientId}`, {
      data: { delete_reason: reason }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

export const deleteHeadhuntingProject = async (projectId, reason) => {
  try {
    const response = await api.delete(`/headhunting/delete-project/${projectId}`, {
      data: { delete_reason: reason }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.response?.data };
  }
};

const normalizeSortForDeletedLists = (sorting = [], allowedSortFields = [], fieldMap = {}) => {
  const requestedSortBy = sorting?.[0]?.id || '';
  const mappedSortBy = fieldMap?.[requestedSortBy] || requestedSortBy;
  const sortBy = allowedSortFields.includes(mappedSortBy) ? mappedSortBy : '';
  const sortOrder = sorting?.[0]?.desc ? 'desc' : 'asc';
  return { sortBy, sortOrder };
};

export const getDeletedClientsList = async (
  page = 1,
  pageSize = 10,
  sorting = [],
  search = ''
) => {
  try {
    const requestedSortBy = sorting?.[0]?.id || '';
    const sortByMap = {
      industry: 'company_category',
      added_by_name: 'added_by',
    };
    const sortBy = sortByMap[requestedSortBy] || requestedSortBy;
    const sortOrder = sorting?.[0]?.desc ? 'desc' : 'asc';
    const params = new URLSearchParams({
      page: String(page),
      size: String(pageSize),
      sort_by: sortBy,
      order: sortOrder,
    });
    if (search && String(search).trim()) {
      params.append('search', String(search).trim());
    }
    const response = await api.get(`/headhunting/delete-client-list?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to fetch deleted clients' };
  }
};

export const getDeletedAssignedProjectsList = async (
  page = 1,
  pageSize = 10,
  sorting = [],
  search = ''
) => {
  try {
    const requestedSortBy = sorting?.[0]?.id || '';
    const sortByMap = {
      recruiter_name: 'recruiter_name',
      recruiter: 'recruiter_name',
      recruitment_manager_name: 'recruitment_manager_name',
      recruitment_manager: 'recruitment_manager_name',
    };
    const sortBy = sortByMap[requestedSortBy] || requestedSortBy;
    const sortOrder = sorting?.[0]?.desc ? 'desc' : 'asc';
    const params = new URLSearchParams({
      page: String(page),
      size: String(pageSize),
      sort_by: sortBy,
      order: sortOrder,
    });
    if (search && String(search).trim()) {
      params.append('search', String(search).trim());
    }
    const response = await api.get(`/headhunting/delete-assigned-projects?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to fetch deleted projects' };
  }
};

export const getProjectJobRemarksMatrix = async (projectId) => {
  try {
    const response = await api.get(`/headhunting/assigned-project-jobs/${projectId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to fetch PM job remarks matrix' };
  }
};

export const getAllDeletedJobList = async (
  page = 1,
  pageSize = 10,
  sorting = [],
  search = ''
) => {
  try {
    const sortBy = sorting?.[0]?.id || '';
    const sortOrder = sorting?.[0]?.desc ? 'desc' : 'asc';
    const params = new URLSearchParams({
      page: String(page),
      size: String(pageSize),
      sort_by: sortBy,
      order: sortOrder,
    });
    if (search && String(search).trim()) {
      params.append('search', String(search).trim());
    }
    const response = await api.get(`/headhunting/all-delete-job-list?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to fetch deleted jobs' };
  }
};


export const updateScreeningResponse = async (responseId, answers) => {
  try {
    const response = await api.patch(`/headhunting/screening-response-update/${responseId}`, { answers });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to update screening response' };
  }
};

/** GET api/headhunting/job-deliverables?filter=upcoming|previous&page=&size=&search=&recruiter=&start_date=&end_date= - job deliverables list */
export const getJobDeliverables = async (
  filter = 'upcoming',
  page = 1,
  pageSize = 10,
  sorting = [],
  search = '',
  recruiter = '',
  startDate = '',
  endDate = ''
) => {
  try {
    const params = new URLSearchParams();
    if (filter) params.append('filter', filter);
    params.append('page', page);
    params.append('size', pageSize);
    const sortBy = sorting?.[0]?.id;
    if (sortBy) {
      params.append('sort_by', sortBy);
      params.append('order', sorting[0].desc ? 'desc' : 'asc');
    }
    if (search && String(search).trim()) {
      params.append('search', search.trim());
    }
    if (recruiter) {
      params.append('recruiter', recruiter);
    }
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const response = await api.get(`/headhunting/job-deliverables?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to fetch job deliverables' };
  }
};

/** GET api/headhunting/job-deliverables-count - { upcoming, previous } counts */
export const getJobDeliverablesCount = async () => {
  try {
    const response = await api.get('/headhunting/job-deliverables-count');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to fetch job deliverables count' };
  }
};

/** GET api/headhunting/deliverable-assign-count?filter=upcoming|previous - per-recruiter deliverable counts */
export const getDeliverableAssignCount = async (filter = 'upcoming') => {
  try {
    const params = new URLSearchParams();
    if (filter) params.append('filter', filter);
    const response = await api.get(`/headhunting/deliverable-assign-count?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to fetch deliverable assign count' };
  }
};

/** GET api/headhunting/project-payment-count - counts of project payments by approval status: { all, pending, approved, rejected } */
export const getProjectPaymentCount = async () => {
  try {
    const response = await api.get('/headhunting/project-payment-count');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to fetch project payment count' };
  }
};

/** GET api/headhunting/project-payment-list - overall paginated list of all project payments, filterable by status (Pending/Approved/Rejected) */
export const getOverallProjectPaymentList = async (status = '', page = 1, pageSize = 10) => {
  try {
    const response = await api.get('/headhunting/project-payment-list', {
      params: {
        page,
        size: pageSize,
        ...(status ? { status } : {}),
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to fetch project payments' };
  }
};

/** PATCH api/headhunting/project-payment-status/{id} - update a payment's approval status (Pending/Approved/Rejected), optionally with a rejection reason */
export const updateProjectPaymentStatus = async (id, status, reason = '') => {
  try {
    const formData = new FormData();
    formData.append('status', status);
    if (reason) {
      formData.append('reason', reason);
    }

    const response = await api.patch(`/headhunting/project-payment-status/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to update payment status' };
  }
};

/** GET api/headhunting/project-payment-list/{project_id} - paginated list of payments for a project */
export const getProjectPaymentList = async (projectId, page = 1, pageSize = 10) => {
  try {
    const response = await api.get(`/headhunting/project-payment-list/${projectId}`, {
      params: { page, size: pageSize },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to fetch project payments' };
  }
};

/** POST api/headhunting/project-payment-create - create a new payment record (invoice/payment_proof are files) */
export const createProjectPayment = async (values) => {
  try {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });

    const response = await api.post('/headhunting/create-project-payment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to create project payment' };
  }
};

/** GET api/headhunting/job-description-request-list - paginated list of job description requests, filterable by status (Pending/Approved/Rejected) */
export const getJobDescriptionRequestList = async (approvalStatus = '', page = 1, pageSize = 10) => {
  try {
    const response = await api.get('/headhunting/job-description-request-list', {
      params: {
        page,
        size: pageSize,
        ...(approvalStatus ? { approval_status: approvalStatus } : {}),
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to fetch job description requests' };
  }
};

/** GET api/headhunting/job-description-count - counts of job description requests by status: { Pending, Approved, Rejected } */
export const getJobDescriptionRequestCount = async () => {
  try {
    const response = await api.get('/headhunting/job-description-count');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to fetch job description request count' };
  }
};

/** GET api/headhunting/job-description-view/:id - single job description request's description and file */
export const getJobDescriptionRequestView = async (id) => {
  try {
    const response = await api.get(`/headhunting/job-description-view/${id}`);
    return response.data?.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to fetch job description' };
  }
};

const SIDEBAR_STATS_ENDPOINT_BY_ROLE = {
  admin: '/admin-sidebar-stats',
  recruitment_manager: '/recruiter-manager-sidebar-stats',
};

/** GET api/admin-sidebar-stats or api/recruiter-manager-sidebar-stats - sidebar badge counts, e.g. { pending_job_description_count } */
export const getSidebarStats = async (userType) => {
  const endpoint = SIDEBAR_STATS_ENDPOINT_BY_ROLE[userType];
  if (!endpoint) return {};
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to fetch sidebar stats' };
  }
};

/** PATCH api/headhunting/update-review/:id - mark a job description request as reviewed */
export const updateJobDescriptionReview = async (id) => {
  try {
    const formData = new FormData();
    formData.append('is_reviewed', 'true');
    const response = await api.patch(`/headhunting/update-review/${id}`, formData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to update review status' };
  }
};

/** POST api/headhunting/job-description-request - create a new job description request (file, description) */
export const createJobDescriptionRequest = async (values) => {
  try {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });

    const response = await api.post('/headhunting/job-description-request', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to create job description request' };
  }
};

/** PATCH api/headhunting/update-job-description/{id} - partially update a job description request (description/status/reason/is_read/accepted_by/file) */
export const updateJobDescriptionRequest = async (id, values) => {
  try {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });

    const response = await api.patch(`/headhunting/update-job-description/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to update job description request' };
  }
};

/** PATCH api/headhunting/project-payment-update/{id} - partially update a payment record (any subset of fields) */
export const updateProjectPayment = async (id, values) => {
  try {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });

    const response = await api.patch(`/headhunting/project-payment-update/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to update project payment' };
  }
};

/** GET api/headhunting/recruiter-screening-form - fetch the recruiter screening questionnaire (questions) for a job/candidate */
export const getRecruiterScreeningForm = async (jobId, email, resumeId) => {
  try {
    const params = new URLSearchParams();
    if (jobId != null) params.append('job_id', jobId);
    if (email) params.append('email', email);
    if (resumeId != null && resumeId !== '') params.append('resume_id', resumeId);
    const response = await api.get(`/headhunting/recruiter-screening-form?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to fetch recruiter screening form' };
  }
};

/**
 * POST api/headhunting/recruiter-submit-form - submit recruiter's answers for the screening questionnaire
 * Sent as multipart/form-data with indexed fields: answers[i][question_id] + answers[i][value] (or answers[i][file]
 * for file_upload questions). `answers` is an array of { question_id, value, file }; `file` (a File object) is used
 * for file_upload questions, `value` for everything else (checkboxes' value should already be a JSON-stringified array).
 */
export const submitRecruiterScreeningForm = async ({ jobId, email, resumeId, answers }) => {
  try {
    const formData = new FormData();
    formData.append('job_id', jobId);
    formData.append('email', email);
    if (resumeId != null && resumeId !== '') formData.append('resume_id', resumeId);

    (answers || []).forEach(({ question_id, value, file }, index) => {
      formData.append(`answers[${index}][question_id]`, question_id);
      if (file instanceof File) {
        formData.append(`answers[${index}][file]`, file);
      } else {
        formData.append(`answers[${index}][value]`, value ?? '');
      }
    });

    const response = await api.post('/headhunting/recruiter-submit-form', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message || 'Failed to submit recruiter screening form' };
  }
};
