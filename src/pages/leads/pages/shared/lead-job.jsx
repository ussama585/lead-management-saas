import { message } from '../../../../components/ui/notifications.jsx';
import { Button } from '../../../../components/ui/app-controls.jsx';
import React, { useMemo, useState, useEffect, useRef } from "react";
import BreadCrumb from "../../../../components/breadcrumb.component.jsx";
import JobForm from "../../../../components/job-form.component.jsx";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {
  createDataLeadJob,
} from "../../../shared/services/data-leads-service.js";
import "../../../../assets/styles/legacy/leads.generated.css";


import { commonJobFormSchema } from "../../../shared/schemas/job.js";
import {
  getMetaLeadJobById,
  createMetaLeadJob,
  updateMetaLeadJobById,
  getMetaLeadDetail,
} from "../../../shared/services/metaLeads.js";
import {
  getDataLeadJob,
  updateDataLeadJob,
  getDataLead,
} from "../../../shared/services/data-leads-service.js";
import api from "../../../shared/services/api.js";

import { useQuery, useMutation, useQueryClient } from "react-query";
import { formatCurrency } from "../../../shared/utils/formatters.js";
import {
  buildJobFormSubmitPayload,
  mapApiJobToFormInitialValues,
  normalizeEmploymentType,
} from "../../../shared/utils/job-utils.js";
import useUserStore from "../../../shared/store/user-store.js";
import { getRolePath } from '../../../auth/role-home.js';


const LeadJobPage = () => {
  const { id, leadId, jobId } = useParams();
  const leadIdentifier = id || leadId;

  const pendingRequests = useRef(new Set());
  const navigate = useNavigate();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  document.title = "Job | Search O Pal";

  // Determine if this is a new job or editing existing
  const isNewJob = jobId === "new";
  
const initialJobValuesRef = useRef(null);

  // Add this after useParams()
const location = useLocation();
const isMetaLead = location.pathname.includes('/meta-leads');
const isDataLead = location.pathname.includes('/data-leads');
const isRegularLead = !isMetaLead && !isDataLead;
const isLeadReadOnly = (lead) =>
 

  lead?.converted_to_client === "true";
  // Get base route based on user role
  const getBaseRoute = () => {
    switch (user?.user_type) {
      case "admin":
        return "/admin/leads";
      case "sales_manager":
        return "/sales-manager/leads";
      case "sales_executive":
        return "/sales-executive/leads";
      default:
        return "/leads";
    }
  };

  const goBack = () => {
  if (isRegularLead) {
    navigate(getRolePath(user?.user_type, `/leads/${leadIdentifier}`));
    return;
  }
  if (isMetaLead) {
    navigate(getRolePath(user?.user_type, `/meta-leads/${leadIdentifier}`));
  } else if (isDataLead) {
    navigate(`/data-lead/${leadIdentifier}`);
  } else {
    navigate(getRolePath(user?.user_type, `/leads/${leadIdentifier}`));
  }
};

  const vacancyOptions = Array.from({ length: 100 }, (_, i) => ({
    label: i + 1,
    value: i + 1,
  })).concat({ label: "100+", value: 101 });

  const jobTypeOptions = [
    { label: "Full-Time", value: "Full-Time" },
    { label: "Part-Time", value: "Part-Time" },
    { label: "Contract", value: "Contract" },
    { label: "Temporary", value: "Temporary" },
  ];

  const employmentTypeOptions = [
    { label: "Office-Based", value: "Office-Based" },
    { label: "Remote", value: "Remote" },
    { label: "Hybrid", value: "Hybrid" },
  ];

  const genderOptions = [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "No Preference", value: "No Preference" },
  ];

  // Fetch job data if editing existing job
  // Fetch job data if editing existing job
// Fetch job data if editing existing job
const { isLoading, data, isError, error } = useQuery(
  [`job-${isMetaLead ? 'meta' : isDataLead ? 'data' : 'regular'}-${jobId}`],
  async () => {
    if (isMetaLead) {
      return await getMetaLeadJobById(jobId);
    } else if (isDataLead) {
      return await getDataLeadJob(jobId);
    } else {
      const response = await api.get(`/lead-generation/job/${jobId}`);
      return response.data;
    }
  },
  { 
    enabled: !!jobId && !isNewJob,
    refetchOnWindowFocus: false,
  }
);

// All APIs now return consistent data structure
const job = data ?? {};

const { data: leadDetailData } = useQuery(
  [`lead-detail-readonly-${leadIdentifier}`],
  async () => {
    if (isMetaLead) {
      return await getMetaLeadDetail(leadIdentifier);
    }
    if (isDataLead) {
      return await getDataLead(leadIdentifier);
    }
    const response = await api.get(`/lead-generation/update/${leadIdentifier}`);
    return response.data;
  },
  {
    enabled: !!leadIdentifier,
    refetchOnWindowFocus: false,
  }
);

const isReadOnlyPage = isLeadReadOnly(leadDetailData);

  // Create new job mutation
 const createJobMutation = useMutation(
  (values) => {
    if (isMetaLead) {
      return createMetaLeadJob({ ...values, lead_id: leadIdentifier });
    } else if (isDataLead) {
      return createDataLeadJob({ ...values, lead_generation_request: leadIdentifier });
    } else {
      return api.post(`/lead-generation/job/create`, { ...values, lead_id: leadIdentifier });
    }
  },
  {
    onSuccess: () => {
      message.success("Job created successfully");
      // Invalidate jobs query for regular leads to refetch job listing
      if (isRegularLead && leadIdentifier) {
        queryClient.invalidateQueries([`leadjobs-${leadIdentifier}`]);
      }
      goBack();
    },
    onError: (error) => {
      message.error(error?.response?.data?.message || error?.message || "Failed to create job");
    },
  }
);

  const isSubmitRef = useRef(false);
  const autosaveTimerRef = useRef(null);

  // Update job mutation
  const updateJobMutation = useMutation(
  (values) => {
    if (isMetaLead) {
      return updateMetaLeadJobById(jobId, values);
    } else if (isDataLead) {
      return updateDataLeadJob(jobId, values);
    } else {
      return api.patch(`/lead-generation/job/${jobId}`, values);
    }
  },
  {
    onSuccess: () => {
      // Invalidate jobs query for regular leads to refetch job listing
      if (isRegularLead && leadIdentifier) {
        queryClient.invalidateQueries([`leadjobs-${leadIdentifier}`]);
      }
      if (isSubmitRef.current) {
        message.success("Job updated successfully");
        goBack();
      }
    },
    onError: (error) => {
      // Autosave handlers show their own keyed toast; only show here on explicit submit
      if (!isSubmitRef.current) return;
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to update job";
      message.error({ content: errorMsg, key: 'job-update-toast' });
    },
  }
);
  const [experienceError, setExperienceError] = useState("");
  const [changedFields, setChangedFields] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [salaryError, setSalaryError] = useState("");
  const [formInitialValues, setFormInitialValues] = useState({
    number_of_vacancies: null,
    job_title: null,
    job_type: null,
    employment_type: null,
    department: [],
    job_description: null,
    job_responsibilities: null,
    job_requirements: null,
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
    address: null,
    cv_submission_deadline: null,
    expected_joining_date: null,
    working_hours: null,
    timezone: null,
    working_days: null,
    working_days_from: null,
    working_days_to: null,
    min_experience: null,
    max_experience: null,
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
    if (isReadOnlyPage) {
      message.warning("This lead is read-only.");
      return;
    }
    clearTimeout(autosaveTimerRef.current);
    setSubmitAttempted(true);
    // Salary validation
    const min = Number(values.min_salary);
    const max = Number(values.max_salary);
    if (!isNaN(min) && !isNaN(max) && min !== 0 && max !== 0 && min > max) {
      setSalaryError(
        "Minimum salary must be less than or equal to maximum salary"
      );
      return; // BLOCK SUBMIT
    } else {
      setSalaryError("");
    }

    const minExp = Number(values.min_experience);
    const maxExp = Number(values.max_experience);
    if (!isNaN(minExp) && !isNaN(maxExp) && minExp > maxExp) {
      setExperienceError('Minimum experience must be less than or equal to maximum experience');
      return; // BLOCK SUBMIT
    } else {
      setExperienceError('');
    }
    const submitValues = buildJobFormSubmitPayload(values);
    if (isNewJob) {
      const filteredValues = Object.fromEntries(
        Object.entries(submitValues).filter(([key, value]) => {
          if (key === "other_benefits") {
            return value !== null && value.trim() !== "";
          }
          if (key === "working_days_from" || key === "working_days_to") {
            return false;
          }
          return value !== null;
        })
      );
      createJobMutation.mutate(filteredValues);
    } else {
      const originalPayload = buildJobFormSubmitPayload(
        initialJobValuesRef.current || {}
      );
      const changedFields = {};
      Object.keys(submitValues).forEach((key) => {
        if (key === "working_days_from" || key === "working_days_to") return;

        const currentValue = submitValues[key];
        const originalValue = originalPayload[key];

        if (key === "other_benefits") {
          if (
            currentValue &&
            currentValue.trim() !== "" &&
            currentValue !== originalValue
          ) {
            changedFields[key] = currentValue;
          }
          return;
        }
        if (key === "employment_type") {
          const normalizedCurrentValue = normalizeEmploymentType(currentValue);
          const normalizedOriginalValue = normalizeEmploymentType(originalValue);
          if (
            normalizedCurrentValue !== normalizedOriginalValue &&
            currentValue !== null
          ) {
            changedFields[key] = currentValue;
          }
          return;
        }
        if (
          JSON.stringify(currentValue) !== JSON.stringify(originalValue) &&
          currentValue !== null
        ) {
          changedFields[key] = currentValue;
        }
      });

      if (Object.keys(changedFields).length > 0) {
        isSubmitRef.current = true;
        updateJobMutation.mutate(changedFields, {
          onSettled: () => {
            isSubmitRef.current = false;
          },
        });
      } else {
        message.info("No changes detected");
      }
    }
  };

  // Update form initial values when job data loads
  useEffect(() => {
    if (!job?.id) return;

    const mapped = mapApiJobToFormInitialValues(job);
    if (!mapped) return;

    setFormInitialValues(mapped);

    if (!isNewJob && !initialJobValuesRef.current) {
      initialJobValuesRef.current = mapped;
    }
  }, [job, isNewJob]);

 const handleAutoSave = async (event, key, value) => {
  if (isReadOnlyPage) return;
  if (!isNewJob) {
    // formik.handleBlur is now handled internally by JobForm
    let payloadValue = value;
    
    // Create a unique request key to prevent duplicate calls
    const requestKey = `${key}-${payloadValue}`;
    
    // Skip if the same request is already pending
    if (pendingRequests.current.has(requestKey)) {
      return;
    }

    // Convert array fields to string if they're arrays
    if ((key === "languages_required" || key === "department" || key === "nationality_preference") && Array.isArray(value)) {
      payloadValue = value.join(", ");
    }

    // Handle employment_type normalization
    if (key === "employment_type") {
      const normalizedValue = normalizeEmploymentType(payloadValue);
      const normalizedOriginalValue = normalizeEmploymentType(job[key]);
      if (
        normalizedValue !== normalizedOriginalValue &&
        payloadValue !== null
      ) {
        const payload = { [key]: payloadValue };
        isSubmitRef.current = false;
        
        // Add request to pending set
        pendingRequests.current.add(requestKey);
        
        updateJobMutation.mutate(payload, {
          onSuccess: () => {
            message.destroy('autosave-toast');
            message.success({ content: "updated successfully!", key: 'autosave-toast' });
            // Invalidate jobs query for regular leads to refetch job listing
            if (isRegularLead && leadIdentifier) {
              queryClient.invalidateQueries([`leadjobs-${leadIdentifier}`]);
            }
            // Remove from pending requests
            pendingRequests.current.delete(requestKey);
          },
          onError: (error) => {
            message.destroy('autosave-toast');
            message.error({ content: error?.response?.data?.message || "Failed to update employment type", key: 'autosave-toast' });
            // Remove from pending requests
            pendingRequests.current.delete(requestKey);
          }
        });
      }
    }
    // Handle salary fields with validation
    else if (key === "min_salary" || key === "max_salary") {
      const numericValue = Number(payloadValue);

      // Only proceed if the value is valid and different from original
      if (
        !isNaN(numericValue) &&
        numericValue > 0 &&
        numericValue !== job[key]
      ) {
        const payload = { [key]: numericValue };
        isSubmitRef.current = false;
        
        // Add request to pending set
        pendingRequests.current.add(requestKey);
        
        updateJobMutation.mutate(payload, {
          onSuccess: () => {
            const fieldName = key === "min_salary" ? "Minimum salary" : "Maximum salary";
            message.destroy('autosave-toast');
            message.success({ content: `${fieldName} updated successfully!`, key: 'autosave-toast' });
            // Invalidate jobs query for regular leads to refetch job listing
            if (isRegularLead && leadIdentifier) {
              queryClient.invalidateQueries([`leadjobs-${leadIdentifier}`]);
            }
            // Remove from pending requests
            pendingRequests.current.delete(requestKey);
          },
          onError: (error) => {
            const fieldName = key === "min_salary" ? "minimum salary" : "maximum salary";
            message.destroy('autosave-toast');
            message.error({ content: error?.response?.data?.message || `Failed to update ${fieldName}`, key: 'autosave-toast' });
            // Remove from pending requests
            pendingRequests.current.delete(requestKey);
          }
        });
      }
    }
    // Handle other fields
    else if (payloadValue !== job[key] && payloadValue !== null) {
      const payload = { [key]: payloadValue };
      isSubmitRef.current = false;
      
      // Add request to pending set
      pendingRequests.current.add(requestKey);
      
      updateJobMutation.mutate(payload, {
        onSuccess: () => {
          // Convert field name to user-friendly format
          const fieldName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          message.destroy('autosave-toast');
          message.success({ content: `${fieldName} updated successfully!`, key: 'autosave-toast' });
          // Invalidate jobs query for regular leads to refetch job listing
          if (isRegularLead && leadIdentifier) {
            queryClient.invalidateQueries([`leadjobs-${leadIdentifier}`]);
          }
          // Remove from pending requests
          pendingRequests.current.delete(requestKey);
        },
        onError: (error) => {
          const fieldName = key.replace(/_/g, ' ').toLowerCase();
          message.destroy('autosave-toast');
          message.error({ content: error?.response?.data?.message || `Failed to update ${fieldName}`, key: 'autosave-toast' });
          // Remove from pending requests
          pendingRequests.current.delete(requestKey);
        }
      });
    }
  }
};

  // Wrapper for onFieldBlur — debounced so Update click can cancel pending autosave
  const handleFieldBlur = (event, key, value) => {
    if (isNewJob) return;
    clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      if (!isSubmitRef.current) {
        handleAutoSave(event, key, value);
      }
    }, 150);
  };

 

  // DEBUG: Log Formik state for validation troubleshooting

  return (
    <div className="lead-job-page">
      <BreadCrumb
        goBack={goBack}
        linkText={isNewJob ? "Add New Job" : "Edit Job"}
      />

     
        <JobForm
          manualLocation={isRegularLead}
          initialValues={formInitialValues}
          validationSchema={commonJobFormSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
          experienceError={experienceError}
          salaryError={salaryError}
          onFieldBlur={handleFieldBlur}
          submitButtonText={isNewJob ? "Create" : "Update"}
          submitButtonLoading={createJobMutation.isLoading || updateJobMutation.isLoading}
          vacancyOptions={vacancyOptions}
          readOnlyMode={isReadOnlyPage}
          isEditMode={!isNewJob}
        />
      </div>
    
  );
};

export default LeadJobPage;

