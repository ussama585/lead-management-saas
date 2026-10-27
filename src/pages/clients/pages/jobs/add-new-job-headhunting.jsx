import { message } from '../../../../components/ui/notifications.jsx';
import React, { useState, useEffect } from 'react';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import JobForm from '../../../../components/job-form.component.jsx';
import "../../../../assets/styles/legacy/leads.generated.css";

import { commonJobFormSchema } from '../../../shared/schemas/job.js';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { createHeadhuntingJob } from '../../../shared/services/headhunting.js';
import { buildJobFormSubmitPayload } from '../../../shared/utils/job-utils.js';

const getApiErrorMessage = (error, fallback = 'Failed to create job') => {
    const data = error?.response?.data || error;
    if (!data) return fallback;

    if (typeof data === 'string' && data.trim()) return data;
    if (typeof data?.message === 'string' && data.message.trim()) return data.message;

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
        return data.errors.filter(Boolean).join(', ');
    }

    if (data?.errors && typeof data.errors === 'object') {
        const joinedErrors = Object.values(data.errors)
            .flat()
            .filter(Boolean)
            .join(', ');
        if (joinedErrors) return joinedErrors;
    }

    if (typeof error?.message === 'string' && error.message.trim()) return error.message;
    return fallback;
};

const HeadhuntingJobPage = () => {
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('projectId');
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'New Lead Job | Search O Pal';
    }, []);

 

    // Initial values for the form
    const initialValues = {
            project: projectId,
        job_title: null,
        number_of_vacancies: null,
        job_type: null,
        employment_type: null,
        department: [],
        location_country: null,
        location_city: null,
        job_description: null,
        job_requirements: null,
        job_responsibilities: null,
        key_skills_required: null,
        min_experience: null,
        max_experience: null,
        educational_qualification: null,
        other_benefits: null,
        currency: null,
        min_salary: null,
        max_salary: null,
        payment_term: null,
        languages_required: [],
        gender_preference: null,
        nationality_preference: [],
        notes: null,
        cv_submission_deadline: null,
        expected_joining_date: null,
        working_hours: null,
        timezone: "(UTC+05:00) Ekaterinburg, Islamabad, Karachi, Tashkent",
        working_days: null,
        working_days_from: null,
        working_days_to: null,
        remarks: null,
        degree_level: null,
        job_shift: null,
        hours_per_week: null,
        contract_length: null,
        contract_period: null,
        degrees: [],
        skills: [],
    };

    // Handle form submission
    const handleSubmit = (values) => {
        // Project validation (required for jobs)
        if (!values.project) {
            // Note: JobForm will handle this validation via schema, but we can add additional check here
            return; // BLOCK SUBMIT - schema will show error
        }

            // Salary validation
            const min = Number(values.min_salary);
            const max = Number(values.max_salary);
            if (!isNaN(min) && !isNaN(max) && min !== 0 && max !== 0 && min > max) {
                setSalaryError('Minimum salary must be less than or equal to maximum salary');
                return; // BLOCK SUBMIT
            } else {
                setSalaryError('');
            }

            // Experience validation
            const minExp = Number(values.min_experience);
            const maxExp = Number(values.max_experience);
            if (!isNaN(minExp) && !isNaN(maxExp) && minExp > maxExp) {
                setExperienceError('Minimum experience must be less than or equal to maximum experience');
                return; // BLOCK SUBMIT
            } else {
                setExperienceError('');
            }

            const processedValues = buildJobFormSubmitPayload(values, {
                remarksFallback: 'Job created via headhunting module',
            });

            createJobMutation.mutate(processedValues);
    };

    const goBack = () => {
        navigate(-1);
    }

    const [salaryError, setSalaryError] = useState('');
    const [experienceError, setExperienceError] = useState('');

    const createJobMutation = useMutation(createHeadhuntingJob, {
        onSuccess: () => {
            message.destroy('lead-job-toast');
            message.success({ content: "Job created successfully", key: 'lead-job-toast' });
            // Invalidate queries to refetch job listing in project-listing-page.jsx
            if (projectId) {
                queryClient.invalidateQueries(['projectJobCounts', projectId]);
                queryClient.invalidateQueries(['projectJobs', projectId]);
            }
            goBack();
        },
        onError: (error) => {

            message.destroy('lead-job-toast');
            message.error({
                content: getApiErrorMessage(error, 'Failed to create job'),
                key: 'lead-job-toast',
            });
        },
    });

    return (
        <div className='lead-job-page'>
            <style>
                {`
                    .black-text-datepicker .ant-picker-input > input {
                        color: #000000 !important;
                    }
                    .black-text-datepicker .ant-picker-input > input::placeholder {
                        color: #000000 !important;
                    }
                `}
            </style>
            <BreadCrumb goBack={goBack} linkText="Job" />

            <div className="job-card">
                <JobForm
                    initialValues={initialValues}
                    validationSchema={commonJobFormSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize={true}
                    experienceError={experienceError}
                    salaryError={salaryError}
                    dateOnly={true}
                    submitButtonText="Save"
                    submitButtonLoading={createJobMutation.isLoading}
                />
            </div>
        </div>
    );
}

export default HeadhuntingJobPage;

