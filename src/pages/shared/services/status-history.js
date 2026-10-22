import api from './api.js';

const normalizeHistoryResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.history)) return payload.history;
  if (Array.isArray(payload?.records)) return payload.records;
  return [];
};

const withObjectId = (basePath, objectId) =>
  objectId != null && objectId !== '' ? `${basePath}/${objectId}` : basePath;

export const getClientStatusHistory = async (objectId) => {
  try {
    const response = await api.get(withObjectId('/headhunting/client-history', objectId));
    return normalizeHistoryResponse(response.data);
  } catch (error) {
    throw new Error(`Error fetching client status history: ${error.message}`);
  }
};

export const getProjectStatusHistory = async (objectId) => {
  try {
    const response = await api.get(withObjectId('/headhunting/project-history', objectId));
    return normalizeHistoryResponse(response.data);
  } catch (error) {
    throw new Error(`Error fetching project status history: ${error.message}`);
  }
};

export const getJobStatusHistory = async (objectId) => {
  try {
    const response = await api.get(withObjectId('/headhunting/job-history', objectId));
    return normalizeHistoryResponse(response.data);
  } catch (error) {
    throw new Error(`Error fetching job status history: ${error.message}`);
  }
};
