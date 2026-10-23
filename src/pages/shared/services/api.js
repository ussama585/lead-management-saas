// src/services/api.js
import axios from 'axios';
import { API_URL } from '../utils/api.js';
import useUserStore from '../store/user-store.js';
import { applyCompanyFilter } from '../utils/company-filter.js';

const api = axios.create({
  baseURL: API_URL,
});

export function storeRefreshedTokens(payload) {
  if (payload?.success === false || payload?.status === false) throw new Error(payload.message || 'Could not refresh the session.');
  const tokens = payload?.data ?? payload;
  if (typeof tokens?.access !== 'string' || !tokens.access.trim()) throw new Error('The refresh response did not include a valid access token.');
  if (tokens.refresh != null && (typeof tokens.refresh !== 'string' || !tokens.refresh.trim())) throw new Error('The refresh response included an invalid refresh token.');
  localStorage.setItem('access_token', tokens.access);
  if (tokens.refresh) localStorage.setItem('refresh_token', tokens.refresh);
  return tokens.access;
}

// Debugging Axios Request Interceptor
api.interceptors.request.use(
  (config) => {
    applyCompanyFilter(config, useUserStore.getState().user?.user_type, window.location);
    if (config?.skipAuth) {
      if (config.headers?.set) {
        config.headers.delete('Authorization');
      } else if (config.headers) {
        delete config.headers.Authorization;
      }
      return config;
    }

    const token = localStorage.getItem('access_token');
    const validToken =
      typeof token === 'string' &&
      token.trim() !== '' &&
      token !== 'null' &&
      token !== 'undefined';

    if (validToken) {
      if (config.headers.set) {
        config.headers.set('Authorization', `Bearer ${token.trim()}`);
      } else {
        config.headers['Authorization'] = `Bearer ${token.trim()}`;
      }
    } else if (config.headers?.set) {
      config.headers.delete('Authorization');
    } else if (config.headers) {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    console.error("Request Interceptor Error:", error);
    return Promise.reject(error);
  }
);

// Debugging Axios Response Interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If Unauthorized (401), try refreshing the token
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !originalRequest.skipTokenRefresh && !originalRequest.skipAuth) {

      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken || refreshToken === 'null' || refreshToken === 'undefined') throw new Error('No refresh token is available.');
        const body = new FormData();
        body.append('refresh', refreshToken);
        const response = await axios.post(`${API_URL.replace(/\/$/, '')}/accounts/token/refresh`, body);
        const access = storeRefreshedTokens(response.data);

        // Update the Authorization header and retry the original request
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers['Authorization'] = `Bearer ${access}`;

        return api(originalRequest);
      } catch {

        // Clear tokens and user data
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        // Clear user data in the store
        useUserStore.getState().clearUser();

        console.log("Redirecting to login");
        // window.location.href = '/'; // Redirect to login page
      }
    }

    return Promise.reject(error);
  }
);

export const fetchLeadCounts = async (selectedExecutive = null, selectedStatus = null, dateRange = null) => {
  const params = {};

  if (selectedExecutive) {
    params.assigned_to = selectedExecutive;
  }

  if (selectedStatus) {
    params.status = selectedStatus;
  }

  if (dateRange?.[0]) {
    params.start_date = dateRange[0].format('YYYY-MM-DDTHH:mm:ssZ');
  }

  if (dateRange?.[1]) {
    params.end_date = dateRange[1].format('YYYY-MM-DDTHH:mm:ssZ');
  }

  const response = await api.get('lead-generation/list-count', { params });
  return response.data;
};

export const fetchLeadStats = async () => {
  const response = await api.get('lead-generation/stats');
  return response.data;
};

export default api;



