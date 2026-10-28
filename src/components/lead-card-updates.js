import api from '../pages/shared/services/api.js';

export async function updateLeadCardFields(leadType, id, values) {
  const dataLead = leadType === 'Data Lead';
  let payload = values;
  if (!dataLead) {
    payload = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null) payload.append(key, value);
    });
  }
  const { data } = await api.patch(dataLead ? `/data-leads/details/${id}` : `/lead-generation/update/${id}`, payload);
  if (data?.success === false || data?.status === false) throw new Error(data.message || 'Could not update lead.');
  return data;
}
