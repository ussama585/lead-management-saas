import api from './shared/services/api.js';
import LeadJobForm from './leads/pages/shared/lead-job-form.jsx';

export async function createWebsiteLeadJob(payload) {
    const { years_of_experience, working_days_from, working_days_to, ...body } = payload;
    body.lead_generation_request = Number(payload.lead_generation_request);
    if (!Number.isInteger(body.lead_generation_request) || body.lead_generation_request < 1) throw new Error('A valid website lead is required.');
    for (const key of ['number_of_vacancies', 'min_experience', 'max_experience', 'min_salary', 'max_salary']) {
        if (body[key] != null && body[key] !== '') body[key] = Number(body[key]);
    }
    body.degrees = (body.degrees || []).map(({ degree_name }) => ({ degree_name }));
    body.skills = (body.skills || []).map(({ skill_name, experience, last_used }) => ({ skill_name, experience: Number(experience ?? 0), last_used: Number(last_used ?? 0) }));
    const { data } = await api.post('/lead-generation/create-job', body);
    if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not create job.');
    return data;
}


export default LeadJobForm;
