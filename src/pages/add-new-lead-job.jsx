import React, { useMemo, useState } from 'react';
import BreadCrumb from '../components/breadcrumb.component.jsx';
import JobForm from '../components/job-form.component.jsx';
import "../assets/styles/legacy/leads.generated.css";
import { useLocation } from 'react-router-dom';

import { useMutation, useQueryClient } from 'react-query';
import { message } from 'antd';
import { commonJobFormSchema } from './shared/schemas/job.js';

import { useParams, useNavigate } from 'react-router-dom';

import api from './shared/services/api.js';
import useUserStore from './shared/store/user-store.js';
import { getRolePath } from './auth/role-home.js';

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


const NewLeadJobPage = () => {
    const queryClient = useQueryClient();
    const location = useLocation();
    const isDataLeads = location.pathname.includes('/data-leads');
    const { id } = useParams()
    const isMetaLead = location.pathname.includes('/meta-leads/');
    document.title = 'New Lead Job | Search O Pal'
    const isDataLead = location.pathname.includes('/data-leads');
    const vacancyOptions = Array.from({ length: 100 }, (_, i) => ({
        label: i + 1,
        value: i + 1,
    })).concat({ label: "100+", value: 101 });

    const onSubmit = (values) => {
       let { languages_required, department, nationality_preference, ...finalPayload } = values;

        // Use different field names based on lead type
        if (isMetaLead) {
            finalPayload.meta_lead = id;
        }
        else if (isDataLead) {
            finalPayload.data_lead = id;
        }

        else {
            finalPayload.lead_generation_request = id;
        }

        // Helper function to clean array values and convert to string
        const cleanArrayToString = (value) => {
            // Handle null/undefined
            if (value === null || value === undefined) {
                return '';
            }
            
            // If not an array, return as string
            if (!Array.isArray(value)) {
                return String(value);
            }
            
            // If empty array, return empty string
            if (value.length === 0) {
                return '';
            }
            
            // Clean each value by removing surrounding quotes (including escaped quotes) and trim
            const cleaned = value
                .map(item => {
                    if (typeof item === 'string') {
                        // Remove all types of quotes: regular quotes, escaped quotes, and trim
                        let cleaned = item.trim();
                        // Remove surrounding quotes (handles both "value" and \"value\")
                        cleaned = cleaned.replace(/^["']+|["']+$/g, '');
                        // Remove escaped quotes
                        cleaned = cleaned.replace(/\\"/g, '');
                        cleaned = cleaned.replace(/\\'/g, '');
                        return cleaned.trim();
                    }
                    return String(item).trim();
                })
                .filter(item => item && item.length > 0) // Remove empty strings
                .join(", ");
            
            // Always return a string, never an array
            return cleaned || '';
        };

        // Convert array fields to strings for submission - ensure they are strings, not arrays
        finalPayload.languages_required = cleanArrayToString(languages_required);
        finalPayload.department = cleanArrayToString(department);
        finalPayload.nationality_preference = cleanArrayToString(nationality_preference);
        
        // Debug: Log to ensure conversion worked
        console.log('Converted values:', {
            languages_required: finalPayload.languages_required,
            department: finalPayload.department,
            nationality_preference: finalPayload.nationality_preference
        });

        return createJobMutation.mutateAsync(finalPayload).catch(() => { /* Error is displayed by the mutation. */ });
    };

    const initialValues = {
            job_title: null,
            years_of_experience: null,
            number_of_vacancies: null,
            job_type: null,
            employment_type: null,
        department: [],
            job_description: null,
            job_responsibilities: null,
            job_requirements: null,
             min_experience: null,  
        max_experience: null,
            key_skills_required: null,
            educational_qualification: null,
            currency: null,
            other_benefits: null,
        languages_required: [],
            gender_preference: null,
        nationality_preference: [],
            notes: null,
            min_salary: null,
            max_salary: null,
            payment_term: null,
            location_city: null,
            location_country: null,
            // New fields
            working_hours: null,
            working_days_from: null,
            working_days_to: null,
            working_days: null,
            timezone: "(UTC+05:00) Ekaterinburg, Islamabad, Karachi, Tashkent",
            cv_submission_deadline: null,
            expected_joining_date: null,
    };


    let navigate = useNavigate()

    const { user } = useUserStore()
    const goBack = () => {
        if (isDataLead) {
            navigate(`/data-lead/${id}`);
            return;
        }

        const baseRoute = isMetaLead ? 'meta-leads' : 'leads';

        navigate(getRolePath(user?.user_type, `/${baseRoute}/${id}`));
    };


    const sendUpdate = (payload) => {
        if (!isDataLeads && !isMetaLead) return createWebsiteLeadJob(payload);
        const endpoint = isDataLeads
            ? 'data-leads/create-job'
            : isMetaLead
                ? 'meta-leads/create-job'
                : 'lead-generation/create-job';

        return api.post(endpoint, payload);
    };

    const createJobMutation = useMutation(sendUpdate, {
        onSuccess: async () => {
            await queryClient.invalidateQueries([`leadjobs-${id}`]);
            await queryClient.invalidateQueries(['websiteLeadDetail']);
            message.destroy('lead-job-toast');
            message.success({
                content: `Job created successfully`,
                key: 'lead-job-toast'
            });
            goBack();
        },
        onError: (error) => {
            message.destroy('lead-job-toast');
            const errorMessage = isMetaLead
                ? error?.message
                : error?.response?.data?.message;
            message.error({
                content: errorMessage || error?.message || "Failed to create job",
                key: 'lead-job-toast'
            });
        },
    });


    return (
        <div className='lead-job-page'>
            <BreadCrumb goBack={goBack} linkText="Job" />

            
                <JobForm
                    manualLocation={!isMetaLead && !isDataLeads}
                    initialValues={initialValues}
                    validationSchema={commonJobFormSchema}
                    onSubmit={onSubmit}
                    submitButtonText="Save"
                    submitButtonLoading={createJobMutation.isLoading}
                    vacancyOptions={vacancyOptions}
                />
            
        </div>
    );
}


export default NewLeadJobPage;



