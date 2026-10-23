import api from "./api.js";
import { unwrapApiJobResponse } from "../utils/job-utils.js";

export const getDataLeadsList = async (params = {}) => {
  const response = await api.get("/data-leads/list", { params });
  return response.data;
};

export const getDataLeadsListCount = async (params = {}) => {
  const response = await api.get("/data-leads/list-count", { params });
  return response.data;
};

/** GET data-leads/progress-chart - params: status, start_date?, end_date?. Returns progress percentage for radial chart */
export const getDataLeadsProgressChart = async (params = {}) => {
  const response = await api.get("/data-leads/progress-chart", { params });
  return response.data;
};

/** GET data-leads/duplicate-stats - params: start_date, end_date. Returns { categories: string[], series: [{ name, data }] } */
export const getDataLeadsDuplicateStats = async (params = {}) => {
  const response = await api.get("/data-leads/duplicate-stats", { params });
  return response.data;
};

export const getDataLeadsStats = async (params = {}) => {
  const response = await api.get("/data-leads/stats", { params });
  return response.data;
};

export const createDataLeadJob = async (payload) => {
  const response = await api.post("/data-leads/create-job", payload);
  return response.data;
};

export const getDataLeadJobs = async (dataLeadId, params = {}) => {
  const response = await api.get(`/data-leads/jobs/${dataLeadId}`, {
    params,
  });
  return response.data;
};

export const getDataLeadAllJobs = async (dataLeadId) => {
  const response = await api.get(`/data-leads/all-jobs/${dataLeadId}`);
  return response.data;
};

export const getDataLeadDuplicateLeads = async (leadId) => {
  const response = await api.get(`/data-leads/duplicate-leads/${leadId}`);
  return response.data;
};

export const getDataLead = async (leadId) => {
  const response = await api.get(`/data-leads/details/${leadId}`);
  return response.data?.data ?? response.data;
};

export const getDataLeadJob = async (jobId) => {
  const response = await api.get(`/data-leads/update-job/${jobId}`);
  return unwrapApiJobResponse(response.data) ?? response.data;
};

export const updateDataLeadJob = async (jobId, payload) => {
  const response = await api.patch(`/data-leads/update-job/${jobId}`, payload);
  return response.data;
};

export const updateDataLeadStatus = async (leadId, payload, config = {}) => {
  const response = await api.patch(`/data-leads/details/${leadId}`, payload, config);
  return response.data;
};

export const patchDataLeadJob = async (jobId, payload) => {
  const response = await api.patch(`/data-leads/update-job/${jobId}`, payload);
  return response.data;
};

export const createDataLeadFollowUp = async (leadId, payload) => {
  const response = await api.post(`/follow-up/checkup_duration`, payload);
  // const response = await api.post(`/follow-up/checkup_duration/${leadId}`, payload);
  return response.data;
};

export const getDataLeadFollowUpList = async (params = {}) => {
  const response = await api.get('/data-leads/data-follow-up-list', { params });
  return response.data;
};


