import api from './api.js';

const toQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });
  const result = query.toString();
  return result ? `?${result}` : '';
};

// GET /api/screening/global-forms
export const getGlobalFormsList = async (params = {}) => {
  try {
    const query = toQueryString(params);
    const response = await api.get(`/screening/global-forms${query}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching global forms list: ${error.message}`);
  }
};

// GET /api/screening/global-forms-questions?form_id={id}
export const getGlobalFormQuestionDetails = async (formId) => {
  try {
    const query = toQueryString({ form_id: formId });
    const response = await api.get(`/screening/global-forms-questions${query}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching global form question details: ${error.message}`);
  }
};

// PATCH /api/screening/update-publish/{id}
export const updateGlobalFormPublish = async (formId, payload = {}) => {
  try {
    const response = await api.patch(`/screening/update-publish/${formId}`, payload);
    return response.data;
  } catch (error) {
    throw new Error(`Error updating global form publish state: ${error.message}`);
  }
};

// GET /api/screening/list
export const getScreeningList = async (params = {}) => {
  try {
    const query = toQueryString(params);
    const response = await api.get(`/screening/list${query}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching screening list: ${error.message}`);
  }
};
