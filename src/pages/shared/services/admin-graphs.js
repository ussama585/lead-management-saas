import api from './api.js';
import { MAIN_SYSTEM_BASE_URL } from '../utils/api.js';

const normalizeBaseUrl = (url) => String(url || '').replace(/\/+$/, '');

export const getExecutiveClosingMaximumProjects = async ({
  startDate,
  endDate,
  status,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);
  if (status && status !== 'All') query.append('status', status);

  const endpoint = `/headhunting/closing-maximum-projects${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    return response?.data?.data ?? [];
  } catch (error) {
    throw new Error(`Error fetching executive closing maximum projects: ${error.message}`);
  }
};

export const getExecutiveProjectsStatusOverview = async ({
  startDate,
  endDate,
  executiveId,
  type,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);
  if (executiveId != null && executiveId !== '') query.append('executive_id', executiveId);
  if (type) query.append('type', String(type).toLowerCase()); // projects, jobs

  const endpoint = `/headhunting/projects-status-overview${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    return response?.data?.data ?? [];
  } catch (error) {
    throw new Error(`Error fetching executive projects status overview: ${error.message}`);
  }
};

export const getRecruiterProjectInvolvement = async ({
  startDate,
  endDate,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  const endpoint = `/headhunting/recruiter-project-Involvement${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    return response?.data?.data ?? [];
  } catch (error) {
    throw new Error(`Error fetching recruiter project involvement: ${error.message}`);
  }
};

export const getRecruiterStatusBreakdown = async ({
  startDate,
  endDate,
  status,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);
  const statusList = Array.isArray(status) ? status : status ? [status] : [];
  if (statusList.length > 0) {
    query.append('status', statusList.join(','));
  }

  const endpoint = `/headhunting/recruiter-status-breakdown${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    return response?.data?.data ?? [];
  } catch (error) {
    throw new Error(`Error fetching recruiter status breakdown: ${error.message}`);
  }
};

export const getOverallExecutivePerformance = async ({
  startDate,
  endDate,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  const endpoint = `/headhunting/performance-overall${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    return response?.data?.data ?? [];
  } catch (error) {
    throw new Error(`Error fetching overall executive performance: ${error.message}`);
  }
};

export const getExecutiveRiskExposure = async ({
  startDate,
  endDate,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  const endpoint = `/headhunting/risk-exposure${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    return response?.data?.data ?? [];
  } catch (error) {
    throw new Error(`Error fetching executive risk exposure: ${error.message}`);
  }
};

export const getExecutiveClientOwnership = async ({
  startDate,
  endDate,
  status,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);
  const statusList = Array.isArray(status) ? status : status ? [status] : [];
  if (statusList.length > 0) {
    query.append('status', statusList.join(','));
  }

  const endpoint = `/headhunting/client-ownership${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    return response?.data?.data ?? [];
  } catch (error) {
    throw new Error(`Error fetching executive client ownership: ${error.message}`);
  }
};

export const getExecutiveMostCostlyProjects = async ({
  startDate,
  endDate,
  status,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);
  const statusList = Array.isArray(status) ? status : status ? [status] : [];
  if (statusList.length > 0 && !statusList.includes('All')) {
    query.append('status', statusList.join(','));
  }

  const endpoint = `/headhunting/most-costly-projects${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    return response?.data?.data ?? [];
  } catch (error) {
    throw new Error(`Error fetching executive most costly projects: ${error.message}`);
  }
};

export const getLeadsDistributionStatusBreakdown = async ({
  startDate,
  endDate,
  status,
  leadType,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);
  if (status && status !== 'All') query.append('status', status);
  if (leadType) query.append('lead_type', leadType);

  const endpoint = `/lead-distribution-status${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    // API returns { data: { Meta: [...], Data: [...], Website: [...] } }
    return response?.data?.data ?? {};
  } catch (error) {
    throw new Error(`Error fetching leads distribution & status breakdown: ${error.message}`);
  }
};

export const getRecruiterRiskExposure = async ({
  startDate,
  endDate,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  const endpoint = `/headhunting/recruiter-risk-exposure${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    return response?.data?.data ?? [];
  } catch (error) {
    throw new Error(`Error fetching recruiter risk exposure: ${error.message}`);
  }
};

export const getProjectContractAmounts = async ({
  startDate,
  endDate,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  const endpoint = `/project-contract-amounts${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    return response?.data?.data ?? {};
  } catch (error) {
    throw new Error(`Error fetching project contract amounts: ${error.message}`);
  }
};

export const getAverageJobProject = async ({
  startDate,
  endDate,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  const endpoint = `/average-job-project${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    const raw = response?.data?.data ?? response?.data ?? {};
    return raw;
  } catch (error) {
    throw new Error(`Error fetching average job project: ${error.message}`);
  }
};

export const getExecutiveMobilisationAmounts = async ({
  startDate,
  endDate,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  const endpoint = `/leads-mobilisation-amounts${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    // API returns { data: { Meta: [...], Data: [...], Website: [...] } }
    return response?.data?.data ?? {};
  } catch (error) {
    throw new Error(`Error fetching executive mobilisation amounts: ${error.message}`);
  }
};

export const getProjectsByStatusPerExecutive = async ({
  startDate,
  endDate,
  executiveId,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);
  if (executiveId && executiveId !== 'All') query.append('executive_id', executiveId);

  const endpoint = `/project-per-executive${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    return response?.data?.data ?? response?.data ?? {};
  } catch (error) {
    throw new Error(`Error fetching projects by status per executive: ${error.message}`);
  }
};

export const getSystemLeadFunnel = async ({
  startDate,
  endDate,
  leadType,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);
  if (leadType) query.append('lead_type', leadType);

  const endpoint = `/system-lead-funnel${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    return response?.data?.data ?? {};
  } catch (error) {
    throw new Error(`Error fetching system lead funnel: ${error.message}`);
  }
};

export const getLeadStatusDistribution = async ({
  startDate,
  endDate,
  leadType,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);
  if (leadType) query.append('lead_type', leadType);

  const endpoint = `/lead-status-distribute${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    // API returns { data: [{ status, count }] }
    return response?.data?.data ?? [];
  } catch (error) {
    throw new Error(`Error fetching lead status distribution: ${error.message}`);
  }
};

export const getProjectStatusHealth = async ({
  startDate,
  endDate,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  const endpoint = `/project-status-health${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    // API returns { data: [{ status, count }] } or array at top level
    const raw = response?.data;
    const list = Array.isArray(raw) ? raw : raw?.data;
    return Array.isArray(list) ? list : [];
  } catch (error) {
    throw new Error(`Error fetching project status health: ${error.message}`);
  }
};

export const getRecruiterResumeSubmissionVolume = async ({
  startDate,
  endDate,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  const endpoint = `/headhunting/recruiter-resume-submission${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    // API returns { status: true, data: [{ recruiter_id, recruiter_name, resume_count }] }
    return response?.data?.data ?? [];
  } catch (error) {
    throw new Error(`Error fetching recruiter resume submission volume: ${error.message}`);
  }
};

export const getLeadsStatusHealth = async ({
  startDate,
  endDate,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  const endpoint = `/leads-status-health${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    // API returns { data: [{ status, count }] }
    const raw = response?.data;
    const list = Array.isArray(raw) ? raw : raw?.data;
    return Array.isArray(list) ? list : [];
  } catch (error) {
    throw new Error(`Error fetching leads status health: ${error.message}`);
  }
};

export const getRecruiterStats = async ({
  startDate,
  endDate,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  const endpoint = `/headhunting/recruiter-stats${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    // Supports both plain array response and wrapped { data: [...] } shape.
    const raw = response?.data;
    const list = Array.isArray(raw) ? raw : raw?.data;
    return Array.isArray(list) ? list : [];
  } catch (error) {
    throw new Error(`Error fetching recruiter stats: ${error.message}`);
  }
};

export const getJobResumeHiredStats = async ({ startDate, endDate } = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);
  const endpoint = `/headhunting/job_resume_hired_stats${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    const raw = response?.data ?? {};
    return {
      totalJoined: Number(raw?.total_joined) || 0,
      stats: Array.isArray(raw?.stats) ? raw.stats : [],
    };
  } catch (error) {
    throw new Error(`Error fetching job resume hired stats: ${error.message}`);
  }
};

export const getAccountsNewUserCount = async () => {
  try {
    const response = await api.get(
      `${normalizeBaseUrl(MAIN_SYSTEM_BASE_URL)}/api/accounts/new-user-count`,
      { skipAuth: true }
    );
    const raw = response?.data;
    return raw?.data ?? raw ?? {};
  } catch (error) {
    throw new Error(`Error fetching new user count: ${error.message}`);
  }
};

export const getAccountsNewUserGraph = async ({
  period = '7_days',
  startDate,
  endDate,
} = {}) => {
  const query = new URLSearchParams();
  if (period) query.append('period', period);
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  const endpoint = `${normalizeBaseUrl(MAIN_SYSTEM_BASE_URL)}/api/accounts/new-user-graph${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint, { skipAuth: true });
    const raw = response?.data;
    return raw?.data ?? raw ?? {};
  } catch (error) {
    throw new Error(`Error fetching new user graph: ${error.message}`);
  }
};

export const getAccountsAllUsers = async () => {
  try {
    const response = await api.get('/overall-users');
    const raw = response?.data;
    if (Array.isArray(raw?.data)) return raw.data;
    return Array.isArray(raw) ? raw : [];
  } catch (error) {
    throw new Error(`Error fetching all users: ${error.message}`);
  }
};

export const getHistoryModelNames = async () => {
  try {
    const response = await api.get('/history-model-names');
    const raw = response?.data;
    if (Array.isArray(raw?.data)) return raw.data;
    return Array.isArray(raw) ? raw : [];
  } catch (error) {
    throw new Error(`Error fetching history model names: ${error.message}`);
  }
};

export const getAuditHistoryList = async ({
  page = 1,
  size = 10,
  sortBy = 'changed_at',
  order = 'desc',
  search,
  modelName,
  changedBy,
  startDate,
  endDate,
} = {}) => {
  const query = new URLSearchParams();
  query.append('page', String(page));
  query.append('size', String(size));
  if (sortBy) query.append('sort_by', sortBy);
  if (order) {
    // Keep multiple order keys for backend compatibility across endpoints.
    query.append('order', order);
    query.append('sort_order', order);
    if (sortBy) query.append('ordering', order === 'desc' ? `-${sortBy}` : sortBy);
  }
  if (search && String(search).trim()) query.append('search', String(search).trim());
  if (modelName && String(modelName).trim()) query.append('model_name', String(modelName).trim());
  const changedByList = Array.isArray(changedBy) ? changedBy : changedBy ? [changedBy] : [];
  if (changedByList.length > 0) {
    query.append('changed_by', changedByList.map((v) => String(v).trim()).filter(Boolean).join(','));
  }
  if (startDate) query.append('start_date', String(startDate));
  if (endDate) query.append('end_date', String(endDate));

  const endpoint = `/audit-history-list${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    const payload = response?.data ?? {};
    return {
      status: payload?.status ?? true,
      count: Number(payload?.count) || 0,
      next: payload?.next ?? null,
      previous: payload?.previous ?? null,
      results: Array.isArray(payload?.results) ? payload.results : [],
    };
  } catch (error) {
    throw new Error(`Error fetching user activity list: ${error.message}`);
  }
};
