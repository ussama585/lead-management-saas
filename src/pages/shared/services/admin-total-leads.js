import { dashboardEndpoint } from './dashboard-endpoint.js';
import api from './api.js';

export const getSuperAdminTotalLeadsReceived = async ({ startDate, endDate, period = 'month', companyId, userType } = {}) => {
  const { data } = await api.get(dashboardEndpoint('total-lead-received', userType), {
    params: {
      ...(companyId ? { company_id: companyId } : {}),
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
      period,
    },
  });
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not load total leads received.');
  if (!Number.isFinite(data?.totalCount) || !Array.isArray(data?.timeSeriesData)) throw new Error('Could not read total leads received.');
  return data;
};


export const getTotalLeadsReceived = async ({
  startDate,
  endDate,
  period,
  leadType,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);
  if (period) query.append('period', period);
  if (leadType) query.append('lead_type', leadType);

  const endpoint = `/total-lead-received${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    return response?.data ?? { totalCount: 0, timeSeriesData: [] };
  } catch (error) {
    throw new Error(`Error fetching total leads received: ${error.message}`);
  }
};

export const getTotalLeadsConverted = async ({
  startDate,
  endDate,
  leadType,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);
  if (leadType) query.append('lead_type', leadType);

  const endpoint = `/total-lead-convert${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    // API returns { data: [{ period, count }] }
    return response?.data?.data ?? [];
  } catch (error) {
    throw new Error(`Error fetching total leads converted: ${error.message}`);
  }
};

export const getOverallLeadConversionRate = async ({
  startDate,
  endDate,
  leadType,
} = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);
  if (leadType) query.append('lead_type', leadType);

  const endpoint = `/overall-lead-rate${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    // API returns { totalLeads, convertedLeads, conversionRate }
    return response?.data ?? { totalLeads: 0, convertedLeads: 0, conversionRate: 0 };
  } catch (error) {
    throw new Error(`Error fetching overall lead conversion rate: ${error.message}`);
  }
};

/**
 * Active project client – time series for chart (x = dates, y = count).
 * API: GET api/headhunting/active-project-client?start_date=&end_date=&executive_id=
 * Returns: { data: [{ date, projects_count, clients_count }] }
 * Mapped to [{ date, activated_clients, activated_projects }] for the chart.
 */
export const getClientsAndProjectsActivatedPerDay = async ({ startDate, endDate, executiveId } = {}) => {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);
  if (executiveId && executiveId !== 'All') query.append('executive_id', executiveId);

  const endpoint = `/headhunting/active-project-client${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await api.get(endpoint);
    const raw = response?.data;
    const list = Array.isArray(raw) ? raw : raw?.data && Array.isArray(raw.data) ? raw.data : [];
    return list.map((item) => ({
      date: item.date,
      activated_clients: item.clients_count ?? item.activated_clients ?? item.clients ?? 0,
      activated_projects: item.projects_count ?? item.activated_projects ?? item.projects ?? 0,
    }));
  } catch (error) {
    throw new Error(`Error fetching active project client: ${error.message}`);
  }
};



