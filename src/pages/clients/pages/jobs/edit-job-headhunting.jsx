import { message } from '../../../../components/ui/notifications.jsx';
import { Button } from '../../../../components/ui/app-controls.jsx';
import React, { useEffect, useRef, useState } from 'react';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import JobForm from '../../../../components/job-form.component.jsx';

import { CircularProgress } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { editJobHeadhuntingValidationSchema } from '../../../shared/schemas/job.js';
import { useMutation, useQuery } from 'react-query';
import { updateJob, getJobDetails } from '../../../shared/services/headhunting.js';
import { buildJobFormSubmitPayload, normalizeJobDegrees, normalizeJobSkills } from '../../../shared/utils/job-utils.js';
import moment from 'moment';


export default function EditJobHeadhunting() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const goBack = () => {
    navigate(-1);
  };

  const isSubmitRef = useRef(false);
  const [changedFields, setChangedFields] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [salaryError, setSalaryError] = useState('');
  const [experienceError, setExperienceError] = useState('');

  // Fetch job details
  const { data: jobData, isLoading: jobLoading, error: jobError } = useQuery(
    ['jobDetails', id],
    () => getJobDetails(id),
    {
      enabled: !!id,
      refetchOnWindowFocus: false,
    }
  );

  const updateJobMutation = useMutation(
    async (values) => {
    
      const response = await updateJob(id, values);
      return response;
    },
    {
      onSuccess: (response) => {
        if (isSubmitRef.current) {
          message.destroy('job-toast');
          message.success({ content: response?.message || "Job updated successfully", key: 'job-toast' });
          navigate(-1);
        }
      },
      onError: (error) => {
        message.destroy('job-toast');
        message.error({ content: error?.message || "Failed to update job", key: 'job-toast' });
      },
      onSettled: () => {
        isSubmitRef.current = false;
      }
    }
  );

  const handleAutoSave = async (event, key, value) => {
    
    // Don't proceed if jobData is not loaded yet
    if (!jobData) {
      return;
    }
    
    let payloadValue = value;
    
    // Convert array fields to string if they're arrays
    if ((key === 'languages_required' || key === 'department' || key === 'nationality_preference') && Array.isArray(value)) {
      payloadValue = value.join(", ");
    }
    
    // Handle salary fields with validation
    if (key === 'min_salary' || key === 'max_salary') {
      const numericValue = Number(payloadValue);
      
      // Only proceed if the value is valid and different from original
      if (!isNaN(numericValue) && numericValue > 0 && numericValue !== jobData[key]) {
        const payload = { [key]: numericValue };
        isSubmitRef.current = false;
        updateJobMutation.mutate(payload, {
          onSuccess: () => {
            const fieldName = key === "min_salary" ? "Minimum salary" : "Maximum salary";
            message.destroy('autosave-toast');
            message.success({ content: `${fieldName} updated successfully!`, key: 'autosave-toast' });
          },
          onError: (error) => {
            const fieldName = key === "min_salary" ? "minimum salary" : "maximum salary";
            message.destroy('autosave-toast');
            message.error({ content: error?.response?.data?.message || `Failed to update ${fieldName}`, key: 'autosave-toast' });
          }
        });
      }
    } 
    // Handle other fields
    else if (payloadValue !== jobData[key] && payloadValue !== null) {
      const payload = { [key]: payloadValue };
      isSubmitRef.current = false;
      updateJobMutation.mutate(payload, {
        onSuccess: () => {
          // Convert field name to user-friendly format
          const fieldName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          message.destroy('autosave-toast');
          message.success({ content: `${fieldName} updated successfully!`, key: 'autosave-toast' });
        },
        onError: (error) => {
          const fieldName = key.replace(/_/g, ' ').toLowerCase();
          message.destroy('autosave-toast');
          message.error({ content: error?.response?.data?.message || `Failed to update ${fieldName}`, key: 'autosave-toast' });
        }
      });
    }
  };

  // Initial values for the form
  const [formInitialValues, setFormInitialValues] = useState({
    job_title: null,
    number_of_vacancies: null,
    job_type: null,
    employment_type: null,
    department: [],
    location_country: null,
    location_city: null,
    address: null,
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
    timezone: null,
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
  });

  // Handle form submission
  const handleSubmit = (values) => {
    setSubmitAttempted(true);
    // Experience validation
    const minExp = Number(values.min_experience);
    const maxExp = Number(values.max_experience);
    if (!isNaN(minExp) && !isNaN(maxExp) && minExp > maxExp) {
      setExperienceError('Minimum experience must be less than or equal to maximum experience');
      return; // BLOCK SUBMIT
    } else {
      setExperienceError('');
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
    
    // Convert array fields to strings for submission
    const submitValues = buildJobFormSubmitPayload(values);
  
    isSubmitRef.current = true;
    updateJobMutation.mutate(submitValues);
  };

  // Update form values when job data is loaded
  useEffect(() => {
    if (jobData) {
   
      
      // Parse working days string to extract from and to values
      let workingDaysFrom = null;
      let workingDaysTo = null;
      
      if (jobData.working_days) {
        const workingDaysParts = jobData.working_days.split(' - ');
        if (workingDaysParts.length === 2) {
          const fromValue = workingDaysParts[0].trim();
          const toValue = workingDaysParts[1].trim();
          workingDaysFrom = fromValue || null;
          workingDaysTo = toValue || null;
        }
      }
      
      // Parse comma-separated strings to arrays for tag fields
      const parseToArray = (str) => {
        if (!str) return [];
        if (Array.isArray(str)) return str;
        return str.split(',').map(item => item.trim()).filter(item => item);
      };
      
      setFormInitialValues({
        job_title: jobData.job_title || null,
        number_of_vacancies: jobData.number_of_vacancies || null,
        job_type: jobData.job_type || null,
        employment_type: jobData.employment_type || null,
        department: parseToArray(jobData.department),
        location_country: jobData.location_country || null,
        location_city: jobData.location_city || null,
        address: jobData.address || null,
        job_description: jobData.job_description || null,
        job_requirements: jobData.job_requirements || null,
        job_responsibilities: jobData.job_responsibilities || null,
        key_skills_required: jobData.key_skills_required || null,
        min_experience: jobData.min_experience || null,
        max_experience: jobData.max_experience || null,
        educational_qualification: jobData.educational_qualification || null,
        other_benefits: jobData.other_benefits || null,
        currency: jobData.currency || null,
        min_salary: jobData.min_salary || null,
        max_salary: jobData.max_salary || null,
        payment_term: jobData.payment_term || null,
        languages_required: parseToArray(jobData.languages_required),
        gender_preference: jobData.gender_preference || null,
        nationality_preference: parseToArray(jobData.nationality_preference),
        notes: jobData.notes || null,
        cv_submission_deadline: jobData.cv_submission_deadline ? moment(jobData.cv_submission_deadline).isValid() ? moment(jobData.cv_submission_deadline) : null : null,
        expected_joining_date: jobData.expected_joining_date ? moment(jobData.expected_joining_date).isValid() ? moment(jobData.expected_joining_date) : null : null,
        working_hours: jobData.working_hours || null,
        timezone: jobData.timezone || null,
        working_days: jobData.working_days || null,
        working_days_from: workingDaysFrom || null,
        working_days_to: workingDaysTo || null,
        remarks: jobData.remarks || null,
        degree_level: jobData.degree_level || null,
        job_shift: jobData.job_shift || null,
        hours_per_week: jobData.hours_per_week ?? null,
        contract_length: jobData.contract_length != null ? String(jobData.contract_length) : null,
        contract_period: jobData.contract_period || null,
        degrees: normalizeJobDegrees(jobData.degrees),
        skills: normalizeJobSkills(jobData.skills),
      });
    }
  }, [jobData]);

  // Show loading state
  if (jobLoading) {
    return (
      <div className="lead-job-page">
        <BreadCrumb goBack={goBack} linkText="Edit Job (Headhunting)" />
        <div className="job-card">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <CircularProgress />
            <p>Loading job details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (jobError) {
    return (
      <div className="lead-job-page">
        <BreadCrumb goBack={goBack} linkText="Edit Job (Headhunting)" />
        <div className="job-card">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p style={{ color: 'red' }}>Error loading job details: {jobError.message}</p>
            <Button onClick={goBack}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="lead-job-page">
      <BreadCrumb goBack={goBack} linkText="Edit Job (Headhunting)" />
      <div className="job-card">
        <JobForm
          initialValues={formInitialValues}
          validationSchema={editJobHeadhuntingValidationSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
          experienceError={experienceError}
          salaryError={salaryError}
          onFieldBlur={handleAutoSave}
          submitButtonText="Update"
          submitButtonLoading={updateJobMutation.isLoading}
          isEditMode
        />
      </div>
    </div>
  );
} 
