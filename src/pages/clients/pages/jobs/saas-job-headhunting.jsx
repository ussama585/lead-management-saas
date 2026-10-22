import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Spin, message, Modal, List } from 'antd';
import { CircleAlert as ExclamationCircleOutlined } from 'lucide-react';
import { Pencil as EditOutlined, Save as SaveOutlined, X as CloseOutlined } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import { getJobDetails, createSaasJob, updateJob } from '../../../shared/services/headhunting.js';
import { buildJobFormSubmitPayload, normalizeJobDegrees, normalizeJobSkills, normalizeEmploymentType } from '../../../shared/utils/job-utils.js';
import moment from 'moment';
import useUserStore from '../../../shared/store/user-store.js';
import JobForm from '../../../../components/job-form.component.jsx';
import '../../../../assets/styles/legacy/table-client-actions.css';

const normalizeJobDetailsResponse = (data) => {
  if (!data) return null;
  if (data.job && typeof data.job === 'object') return data.job;
  if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) return data.data;
  return data;
};

const parseToArray = (str) => {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  return str.split(',').map((item) => item.trim()).filter((item) => item);
};

const mapShiftToSaas = (shift) => {
  if (!shift) return 'day-shift';
  const normalized = String(shift).toLowerCase().trim().replace(/\s+/g, '-');
  if (normalized.includes('night')) return 'night-shift';
  if (normalized.includes('evening')) return 'evening-shift';
  if (normalized.includes('day')) return 'day-shift';
  return normalized;
};

const parseSkillNames = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value).split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
};

const formatApiErrorMessage = (err) => {
  const details = err?.details?.errors ?? err?.errors;
  if (details && typeof details === 'object') {
    const messages = Object.entries(details).flatMap(([field, value]) => {
      if (Array.isArray(value)) return value.map((item) => `${field}: ${item}`);
      if (value && typeof value === 'object') {
        const nested = Object.values(value).flat().filter(Boolean);
        return nested.map((item) => `${field}: ${item}`);
      }
      return [`${field}: ${value}`];
    });
    if (messages.length > 0) return messages.join(' ');
  }
  return (
    err?.message ||
    err?.details?.message ||
    (typeof err === 'string' ? err : 'Failed to create SaaS job')
  );
};


const buildSaasJobPayload = (saasForm, degrees) => {
  // degrees comes from formInitialValues.degrees — already normalized
  const newDegrees = degrees?.length
    ? degrees.map((d) => d.degree_name).filter(Boolean)
    : parseSkillNames(saasForm.new_degrees); // fallback to old string field

  const skillNames = parseSkillNames(saasForm.skills);
  const experience = String(saasForm.skill_experience ?? '0');

  return {
    new_degrees: newDegrees,
    skills: skillNames.map((name) => ({
      id: name,
      name,
      existing_skill: false,
      experience,
      last_used: '0',
    })),
    shift: saasForm.shift || 'day-shift',
  };
};

export default function SaasJobHeadhuntingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);
  const { jobId } = useParams();

  const goBack = () => navigate(-1);

  useEffect(() => {
    document.title = 'SaaS Job | Search O Pal';
  }, []);

  const {
    data: jobData,
    isLoading: loadingJob,
    isError,
    error,
  } = useQuery(
    ['jobDetails', jobId],
    async () => normalizeJobDetailsResponse(await getJobDetails(jobId)),
    { enabled: !!jobId, refetchOnWindowFocus: false }
  );

  const formInitialValues = useMemo(() => {
    if (!jobData) return null;

    let workingDaysFrom = null;
    let workingDaysTo = null;
    if (jobData.working_days) {
      const parts = jobData.working_days.split(' - ');
      if (parts.length === 2) {
        workingDaysFrom = parts[0].trim() || null;
        workingDaysTo = parts[1].trim() || null;
      }
    }

    return {
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
      cv_submission_deadline: jobData.cv_submission_deadline
        ? moment(jobData.cv_submission_deadline).isValid()
          ? moment(jobData.cv_submission_deadline)
          : null
        : null,
      expected_joining_date: jobData.expected_joining_date
        ? moment(jobData.expected_joining_date).isValid()
          ? moment(jobData.expected_joining_date)
          : null
        : null,
      working_hours: jobData.working_hours || null,
      timezone: jobData.timezone || null,
      working_days: jobData.working_days || null,
      working_days_from: workingDaysFrom,
      working_days_to: workingDaysTo,
      remarks: jobData.remarks || null,
      degree_level: jobData.degree_level || null,
      job_shift: jobData.job_shift || null,
      hours_per_week: jobData.hours_per_week ?? null,
      contract_length: jobData.contract_length != null ? String(jobData.contract_length) : null,
      contract_period: jobData.contract_period || null,
      degrees: normalizeJobDegrees(jobData.degrees),
      skills: normalizeJobSkills(jobData.skills),
    };
  }, [jobData]);

  // saasForm holds only the three fields the create payload needs
  const [saasForm, setSaasForm] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const formikRef = useRef(null);

 useEffect(() => {
  if (!jobData || !formInitialValues) return;

  // Prefer structured degrees array, fall back to flat string fields
  const degreesFromArray = (formInitialValues.degrees || [])
    .map((d) => d.degree_name)
    .filter(Boolean)
    .join(', ');

  const skillsFromArray = (formInitialValues.skills || [])
    .map((s) => s?.name ?? s?.skill_name ?? '')
    .filter(Boolean)
    .join(', ');

  setSaasForm({
    new_degrees: degreesFromArray ||
      (() => {
        if (Array.isArray(jobData.new_degrees) && jobData.new_degrees.length > 0) {
          return jobData.new_degrees
            .map((item) => (typeof item === 'string' ? item : item?.name ?? String(item)))
            .filter(Boolean)
            .join(', ');
        }
        return jobData.notes || formInitialValues.notes || '';
      })(),
    skills: skillsFromArray || jobData.key_skills_required || formInitialValues.key_skills_required || '',
    shift: mapShiftToSaas(jobData?.shift ?? jobData?.timezone),
    skill_experience: String(jobData?.min_experience ?? formInitialValues.min_experience ?? '0'),
  });
}, [jobData, formInitialValues]);

  const updateJobMutation = useMutation(
    (values) => updateJob(jobId, values),
    {
      onSuccess: (response) => {
        message.success(response?.message || 'Job updated successfully');
        queryClient.invalidateQueries(['jobDetails', jobId]);
        setIsEditing(false);
      },
      onError: (err) => {
        message.error(err?.message || 'Failed to update job');
      },
    }
  );

  const handleSave = () => {
    if (formikRef.current) {
      formikRef.current.submitForm();
    }
  };

  const handleEditSubmit = (values) => {
    const payload = buildJobFormSubmitPayload(values);
    updateJobMutation.mutate(payload);
  };

  const isAdmin = user?.user_type === 'admin';
  // read-only when admin OR the saas job was already created
  const isReadOnly = isAdmin || jobData?.is_job_create === true;

  const createSaasJobMutation = useMutation(
    ({ jobId: sourceJobId, payload }) => createSaasJob(sourceJobId, payload),
    {
      onSuccess: (response) => {
        message.success(response?.message || 'SaaS job created successfully');
        const projectId = jobData?.project ?? jobData?.project_id ?? jobData?.projectId ?? null;
        if (projectId) {
          queryClient.invalidateQueries(['projectJobCounts', String(projectId)]);
          queryClient.invalidateQueries(['projectJobs', String(projectId)]);
        }
        goBack();
      },
      onError: (err) => {
        message.error(formatApiErrorMessage(err));
      },
    }
  );

const DEGREE_LEVELS_WITHOUT_REQUIRED_NAME = new Set([
  'Middle School', 'High School', 'Intermediate In Progress', 'Intermediate',
]);

const getMissingFields = (data) => {
  const missing = [];
  const isEmpty = (v) => v === null || v === undefined || v === '';

  if (isEmpty(data?.job_title))           missing.push('Job Title');
  if (isEmpty(data?.number_of_vacancies) || Number(data?.number_of_vacancies) < 1)
                                          missing.push('Number of Vacancies (min 1)');
  if (isEmpty(data?.job_type))            missing.push('Job Type');
  if (isEmpty(data?.employment_type))     missing.push('Employment Type');
  if (isEmpty(data?.location_country))    missing.push('Country');
  if (isEmpty(data?.location_city))       missing.push('City');

  // Address required for non-remote
  const isRemote = normalizeEmploymentType(data?.employment_type) === 'Remote';
  if (!isRemote && isEmpty(data?.address)) missing.push('Address (required for non-remote jobs)');

  if (isEmpty(data?.job_description))     missing.push('Job Description');
  if (isEmpty(data?.min_experience) && data?.min_experience !== 0)
                                          missing.push('Min Experience');
  if (isEmpty(data?.max_experience) && data?.max_experience !== 0)
                                          missing.push('Max Experience');
  if (isEmpty(data?.currency))            missing.push('Currency');
  if (isEmpty(data?.min_salary))          missing.push('Min Salary');
  if (isEmpty(data?.max_salary))          missing.push('Max Salary');
  if (isEmpty(data?.payment_term))        missing.push('Payment Term');
  if (isEmpty(data?.gender_preference))   missing.push('Gender Preference');

  // Skills — at least 4 required
  const skills = Array.isArray(data?.skills) ? data.skills : normalizeJobSkills(data?.skills);
  if (!skills || skills.length < 4)
    missing.push(`Skills (at least 4 required, currently ${skills?.length ?? 0})`);

  // Degrees — required unless degree_level is a school-level
  const degreeLevel = data?.degree_level;
  const degreeNameRequired = degreeLevel && !DEGREE_LEVELS_WITHOUT_REQUIRED_NAME.has(degreeLevel);
  if (degreeNameRequired) {
    const degrees = Array.isArray(data?.degrees) ? data.degrees : normalizeJobDegrees(data?.degrees);
    if (!degrees || degrees.length === 0)
      missing.push('Degree Name (required for the selected degree level)');
  }

  // Contract fields — required when job_type includes "contract"
  const isContract = String(data?.job_type || '').toLowerCase().includes('contract');
  if (isContract) {
    if (isEmpty(data?.contract_length))  missing.push('Contract Length');
    if (isEmpty(data?.contract_period))  missing.push('Contract Period');
  }

  return missing;
};

const handleCreateSaasJob = () => {
  if (!jobId) return;

  const missing = getMissingFields(jobData);
  if (missing.length > 0) {
    Modal.confirm({
      title: 'Required fields missing',
      icon: <ExclamationCircleOutlined size="1em" className="app-icon" style={{ color: '#faad14' }} />,
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>
            Please fill in the following required fields before creating a Job Portal Job:
          </p>
          <List
            size="small"
            dataSource={missing}
            renderItem={(item) => (
              <List.Item style={{ padding: '4px 0', color: '#ff4d4f' }}>
                • {item}
              </List.Item>
            )}
          />
        </div>
      ),
      okText: 'Edit Job',
      cancelText: 'Close',
      onOk: () => setIsEditing(true),
      okButtonProps: { style: { background: '#3E6A9F', borderColor: '#3E6A9F' } },
    });
    return;
  }

  createSaasJobMutation.mutate({ jobId, payload: {} });
};
  const canAccessSaasJob =
    user?.user_type === 'sales_manager' ||
    user?.user_type === 'sales_executive' ||
    user?.user_type === 'admin' ||
    user?.user_type === 'recruitment_manager' ||
    user?.user_type === 'recruitment_executive';

  if (!canAccessSaasJob) {
    return (
      <div className="lead-job-page">
        <BreadCrumb goBack={goBack} linkText="Jobs" />
        <div className="container">
          <div className="job-card" style={{ padding: 24 }}>
            You are not allowed to view SaaS jobs.
          </div>
        </div>
      </div>
    );
  }

  if (loadingJob) {
    return (
      <div className="lead-job-page">
        <BreadCrumb goBack={goBack} linkText="SaaS Job" />
        <div className="job-card">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <p>Loading job details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    const errorMessage =
      error?.message ||
      error?.details?.message ||
      (typeof error === 'string' ? error : 'Failed to load job details.');
    return (
      <div className="lead-job-page">
        <BreadCrumb goBack={goBack} linkText="SaaS Job" />
        <div className="job-card">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p style={{ color: 'red' }}>{errorMessage}</p>
            <Button onClick={goBack}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!formInitialValues || !saasForm) return null;

  return (
    <div className="lead-job-page">
      <BreadCrumb goBack={goBack} linkText="Job Portal Job" />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <JobForm
          initialValues={formInitialValues}
          enableReinitialize={true}
          readOnlyMode={!isEditing}
          hideSubmitButton={true}
          showValidationErrors={isEditing}
          allowPastDates={true}
          isEditMode={true}
          onSubmit={isEditing ? handleEditSubmit : undefined}
          onFormikReady={(formik) => { formikRef.current = formik; }}
          submitButtonLoading={updateJobMutation.isLoading}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 16px 24px' }}>
          {isEditing ? (
            <>
              <Button
                icon={<CloseOutlined size="1em" className="app-icon" />}
                onClick={() => setIsEditing(false)}
                disabled={updateJobMutation.isLoading}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined size="1em" className="app-icon" />}
                onClick={handleSave}
                loading={updateJobMutation.isLoading}
                style={{ background: '#3E6A9F', borderColor: '#3E6A9F' }}
              >
                Save
              </Button>
            </>
          ) : (
            <>
              <Button
                icon={<EditOutlined size="1em" className="app-icon" />}
                onClick={() => setIsEditing(true)}
                style={{ borderColor: '#3E6A9F', color: '#3E6A9F' }}
              >
                Edit Job
              </Button>
              {!isReadOnly && (
                <Button
                  type="primary"
                  onClick={handleCreateSaasJob}
                  loading={createSaasJobMutation.isLoading}
                  style={{ background: '#3E6A9F', borderColor: '#3E6A9F' }}
                >
                  Create Job Portal
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}