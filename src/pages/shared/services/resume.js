import api from './api.js';

/**

 */
export const getParsedCVs = async (filters = {}, page = 1, pageSize = 10, sortBy = '', order = 'asc') => {
  try {
    const params = new URLSearchParams();
    
    // Add pagination parameters
    params.append('page', page.toString());
    params.append('size', pageSize.toString());
    
    // Add sorting parameters if provided
    if (sortBy) {
      params.append('sort_by', sortBy);
      params.append('order', order);
    }
    
    // Add filter parameters if provided
    if (filters.general) {
      params.append('general', filters.general);
    }
    if (filters.skills && filters.skills.length > 0) {
      // Handle skills filtering with Any/All options
      if (filters.skillsMode === 'any') {
        params.append('skills_any', filters.skills.join(','));
      } else {
        params.append('skills_all', filters.skills.join(','));
      }
    }
    if (filters.designation && filters.designation.length > 0) {
      const withExperience = new Set(
        (Array.isArray(filters.designationsExperience) ? filters.designationsExperience : [])
          .filter((item) => item && item.designation)
          .map((item) => String(item.designation).toLowerCase())
      );
      const designationOnly = filters.designation.filter(
        (d) => !withExperience.has(String(d).toLowerCase())
      );
      if (designationOnly.length > 0) {
        const key = filters.designationsMode === 'all' ? 'designations_all' : 'designations_any';
        params.append(key, designationOnly.join(','));
      }
    }
    if (filters.city && filters.city.length > 0) {
      params.append('city', filters.city.join(','));
    }
    if (filters.country && filters.country.length > 0) {
      params.append('country', filters.country.join(','));
    }
    if (filters.category && filters.category.length > 0) {
      params.append('category', filters.category.join(','));
    }
    if (filters.company && filters.company.length > 0) {
      params.append('company', filters.company.join(','));
    }
    // Gender filter - skip when 'Both' (no filter); normalize to lowercase for API
    if (filters.gender && filters.gender !== 'Both') {
      params.append('gender', String(filters.gender).toLowerCase());
    }
    if (filters.language && filters.language.length > 0) {
      params.append('language', filters.language.join(','));
    }
    if (filters.university && filters.university.length > 0) {
      params.append('university', filters.university.join(','));
    }
    // Experience filters
    if (filters.overallExperience) {
      params.append('overall_experience', String(filters.overallExperience));
      // Experience type: 'exact', 'up_to', 'at_least'
      if (filters.overallExperienceMode) {
        params.append('overall_experience_type', String(filters.overallExperienceMode));
      }
    }
    if (Array.isArray(filters.skillsExperience) && filters.skillsExperience.length > 0) {
      const validItems = filters.skillsExperience.filter(
        (item) => item && item.skill && item.years !== undefined && item.years !== ''
      );

      if (validItems.length > 0) {
        // One append pair per row so commas inside a skill name cannot desync skill/year lists,
        // and frameworks that read repeated query keys as lists receive a stable shape.
        validItems.forEach((item) => {
          params.append('skills_experience', String(item.skill));
          params.append('skills_experience_years', String(item.years));
        });
      }
    }
    if (Array.isArray(filters.designationsExperience) && filters.designationsExperience.length > 0) {
      const validItems = filters.designationsExperience.filter(
        (item) => item && item.designation && item.years !== undefined && item.years !== ''
      );

      if (validItems.length > 0) {
        validItems.forEach((item) => {
          params.append('designation_experience', String(item.designation));
          params.append('designation_experience_years', String(item.years));
        });
      }
    }
    // Search type filter
    if (filters.searchType) {
      params.append('search_type', filters.searchType);
    }
    
    const response = await api.get(`/resumes/parsed-cvs?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching parsed CVs:', error);
    throw error;
  }
};

/**
 * Get a single parsed CV by ID
 * @param {number} id - CV ID
 * @returns {Promise<Object>} API response with CV details
 */
export const getParsedCVById = async (id) => {
  try {
    const response = await api.get(`/resumes/parsed-cvs/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching parsed CV by ID:', error);
    throw error;
  }
};

/**
 * Get detailed resume information by ID
 * @param {number} id - Resume ID
 * @returns {Promise<Object>} API response with detailed resume data including education and work experience
 */
export const getResumeDetail = async (id) => {
  try {
    const response = await api.get(`/resumes/detail/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching resume details:', error);
    throw error;
  }
};

/**
 * Candidate profile details (use `candidate_details_id` from parsed CV list).
 * @param {number|string} id - candidate_details_id
 */
export const getCandidateProfileDetails = async (id) => {
  try {
    const response = await api.get(`/resumes/candidate-profile-details/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching candidate profile details:', error);
    throw error;
  }
};

/** Id for candidate-profile-details API from a parsed CV list row. */
export const resolveCandidateDetailsId = (row) => {
  const id = row?.candidate_details_id;
  if (id == null || id === '') return null;
  return id;
};

const buildPaginatedListParams = (page, pageSize, { search = '', sortBy = '', order = 'asc' } = {}) => {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('size', String(pageSize));
  const q = String(search ?? '').trim();
  if (q) {
    params.append('search', q);
  }
  if (sortBy) {
    params.append('sort_by', sortBy);
    params.append('order', order);
  }
  return params.toString();
};

/** Uploaded resume candidates (candidate-resume-list). */
export const getCandidateResumeList = async (
  page = 1,
  pageSize = 10,
  search = '',
  sortBy = '',
  order = 'asc'
) => {
  try {
    const qs = buildPaginatedListParams(page, pageSize, { search, sortBy, order });
    const response = await api.get(`/resumes/candidate-resume-list?${qs}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching candidate resume list:', error);
    throw error;
  }
};

/** Profile-sourced candidates (candidate-profile-list). */
export const getCandidateProfileList = async (
  page = 1,
  pageSize = 10,
  search = '',
  sortBy = '',
  order = 'asc'
) => {
  try {
    const qs = buildPaginatedListParams(page, pageSize, { search, sortBy, order });
    const response = await api.get(`/resumes/candidate-profile-list?${qs}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching candidate profile list:', error);
    throw error;
  }
};

/**
 * Profile-sourced CV detail (same response shape as getResumeDetail)
 * @param {number} id - Profile / row ID
 */
export const getResumeProfileDetail = async (id) => {
  try {
    const response = await api.get(`/resumes/profile-detail/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching profile CV details:', error);
    throw error;
  }
};

/**
 * Profile row with an uploaded linked resume (same detail shape as getResumeDetail / profile-detail).
 * @param {number|string} profileId - Parsed CV / profile row id
 * @param {number|string} resumeId - Linked resume id from list `resume_id`
 */
export const getProfileResumeDetail = async (profileId, resumeId) => {
  try {
    const response = await api.get(`/resumes/profile-resume/${profileId}/${resumeId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching profile-linked resume details:', error);
    throw error;
  }
};

/**
 * Get resume usage information by resume ID
 * @param {number} id - Resume ID
 * @returns {Promise<Array>} Array of usage records
 */
export const getResumeUsage = async (id) => {
  try {
    const response = await api.get(`/resumes/resume-usage/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching resume usage:', error);
    throw error;
  }
};

/**
 * Get list of skills for dropdown
 * @returns {Promise<Array>} Array of skill strings
 */
export const getSkillsList = async (search = '') => {
  try {
    const params = new URLSearchParams();
    const term = String(search || '').trim();
    if (term) {
      params.append('search', term);
    }
    const response = await api.get(`/resumes/skill-list${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching skills list:', error);
    throw error;
  }
};

/**
 * Get list of cities for dropdown
 * @returns {Promise<Array>} Array of city strings
 */
export const getCitiesList = async (search = '') => {
  try {
    const params = new URLSearchParams();
    const term = String(search || '').trim();
    if (term) {
      params.append('search', term);
    }
    const response = await api.get(`/resumes/city-list${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cities list:', error);
    throw error;
  }
};

/**
 * Get list of designations for dropdown
 * @returns {Promise<Array>} Array of designation strings
 */
export const getDesignationsList = async (search = '') => {
  try {
    const params = new URLSearchParams();
    const term = String(search || '').trim();
    if (term) {
      params.append('search', term);
    }
    const response = await api.get(`/resumes/designation-list${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching designations list:', error);
    throw error;
  }
};

/**
 * Get list of countries for dropdown
 * @returns {Promise<Array>} Array of country strings
 */
export const getCountriesList = async (search = '') => {
  try {
    const params = new URLSearchParams();
    const term = String(search || '').trim();
    if (term) {
      params.append('search', term);
    }
    const response = await api.get(`/resumes/country-list${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching countries list:', error);
    throw error;
  }
};

/**
 * Get list of universities for dropdown
 * @returns {Promise<Array>} Array of university strings
 */
export const getUniversitiesList = async (search = '') => {
  try {
    const params = new URLSearchParams();
    const term = String(search || '').trim();
    if (term) {
      params.append('search', term);
    }
    const response = await api.get(`/resumes/university-list${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching universities list:', error);
    throw error;
  }
};

/**
 * Get list of companies for dropdown
 * @returns {Promise<Array>} Array of company strings
 */
export const getCompaniesList = async (search = '') => {
  try {
    const params = new URLSearchParams();
    const term = String(search || '').trim();
    if (term) {
      params.append('search', term);
    }
    const response = await api.get(`/resumes/company-list${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching companies list:', error);
    throw error;
  }
};

/**
 * Get list of languages for dropdown
 * @returns {Promise<Array>} Array of language strings
 */
export const getLanguagesList = async (search = '') => {
  try {
    const params = new URLSearchParams();
    const term = String(search || '').trim();
    if (term) {
      params.append('search', term);
    }
    const response = await api.get(`/resumes/language-list${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching languages list:', error);
    throw error;
  }
};

/**
 * Mark resumes as unprocessed
 * @param {number[]|string} ids - Array of resume IDs or comma separated string
 * @returns {Promise<Object>} API response
 */
export const markResumesUnprocessed = async (ids) => {
  try {
    const formData = new FormData();
    const serializedIds = Array.isArray(ids) ? ids.join(',') : ids;
    formData.append('ids', serializedIds);
    const response = await api.post('/resumes/mark-unprocessed', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error marking resumes unprocessed:', error);
    throw error;
  }
};