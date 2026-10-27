import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, Col, Row, Select, Divider, DatePicker, Modal, Form } from 'antd';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import dayjs from 'dayjs';
import moment from 'moment';
import { formatCurrency, formatSalaryNum } from '../pages/shared/utils/formatters.js';
import {
  countriesNames,
  citiesNames,
  currencyOptions,
  paymentTermOptions,
} from '../pages/shared/utils/countries.js';
import {
  languageOptions,
  nationalityOptions,
  departmentOptions,
  degreeNameOptions,
  timezoneOptions,
  workingDaysOptions,
  jobTypeOptions,
  employmentTypeOptions,
  genderOptions,
  getVacancyOptions,
} from '../pages/shared/utils/job-form-options.js';
import { isDegreeNameRequiredForLevel, isRemoteEmploymentType } from '../pages/shared/schemas/job.js';
import '../assets/styles/legacy/common.css';
import '../assets/styles/legacy/job-form.component.css';

// ─── Static Options ───────────────────────────────────────────────────────────

const degreeLevelOptions = [
  { value: 'Middle School',              label: 'Middle School' },
  { value: 'High School',               label: 'High School' },
  { value: 'Intermediate In Progress',  label: 'Intermediate In Progress' },
  { value: 'Intermediate',              label: 'Intermediate' },
  { value: "Bachelor's In Progress",    label: "Bachelor's In Progress" },
  { value: "Bachelor's",               label: "Bachelor's" },
  { value: "Master's In Progress",      label: "Master's In Progress" },
  { value: "Master's",                 label: "Master's" },
  { value: 'Doctorate In Progress',     label: 'Doctorate In Progress' },
  { value: 'Doctorate',                label: 'Doctorate' },
];


const skillNameOptions = [
  'Python', 'Django', 'React JS', 'Node.js', 'PostgreSQL',
  'MySQL', 'AWS', 'Docker', 'Git', 'Github', 'TypeScript',
  'JavaScript', 'REST APIs', 'GraphQL', 'Redis', 'Celery',
  'FastAPI', 'Flask', 'MongoDB', 'Kubernetes',
];

const SKILL_EXPERIENCE_OPTIONS = [
  { value: '0', label: 'Less than 1 Year' },
  { value: '1', label: '1 Year' },
  { value: '2', label: '2 Years' },
  { value: '3', label: '3 Years' },
  { value: '4', label: '4 Years' },
  { value: '5', label: '5 Years' },
  { value: '6', label: '6 Years' },
  { value: '7', label: '7 Years' },
  { value: '8', label: '8 Years' },
  { value: '9', label: '9 Years' },
  { value: '10', label: '10 Years' },
  { value: '11', label: 'More than 10 Years' },
];

const addSkillFormSchema = Yup.object({
  experience: Yup.string().required('Experience is required'),
});

const getSkillDisplayName = (skill) => skill?.name ?? skill?.skill_name ?? '';

const getSkillExperienceLabel = (value) =>
  SKILL_EXPERIENCE_OPTIONS.find((opt) => opt.value === String(value))?.label ?? value ?? '-';

const hasReadOnlyFieldValue = (value) => {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  return true;
};

const buildSkillPayload = (skillMeta, formValues) => ({
  ...(skillMeta?.id != null ? { id: skillMeta.id } : {}),
  skill_name: skillMeta?.name,
  experience: formValues.experience,
});

const AddSkillToJobModal = ({ open, skill, onClose, onSave }) => {
  const skillFormik = useFormik({
    initialValues: { experience: '' },
    validationSchema: addSkillFormSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      if (!skill?.name) return;
      onSave(buildSkillPayload(skill, values));
    },
  });

  useEffect(() => {
    if (!open) return;
    if (skill?.experience != null && skill?.experience !== '') {
      skillFormik.setValues({
        experience: String(skill.experience),
      });
    } else {
      skillFormik.resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, skill?.name, skill?.experience]);

  const handleClose = () => {
    skillFormik.resetForm();
    onClose();
  };

  const handleDone = () => {
    skillFormik.setTouched({ experience: true });
    skillFormik.handleSubmit();
  };

  return (
    <Modal
      title={<span className="job-form__modal-title">Add Skill</span>}
      open={open}
      onCancel={handleClose}
      centered
      destroyOnClose
      maskClosable={false}
      zIndex={1100}
      width={420}
      footer={[
        <Button key="cancel" htmlType="button" onClick={handleClose}>
          Cancel
        </Button>,
        <Button
          key="done"
          type="primary"
          htmlType="button"
          className="custom-button job-form__modal-done-btn"
          onClick={handleDone}
        >
          Done
        </Button>,
      ]}
    >
      <Form layout="vertical" onFinish={skillFormik.handleSubmit}>
        <p className="job-form__skill-label">
          Skill:{' '}
          <strong className="job-form__skill-name">
            {skill?.name}
          </strong>
        </p>

        <Form.Item
          label={<span className="job-form__experience-label">Experience</span>}
          validateStatus={skillFormik.touched.experience && skillFormik.errors.experience ? 'error' : ''}
          help={skillFormik.touched.experience && skillFormik.errors.experience}
          className="job-form__experience-form-item"
        >
          <Select
            className="antd-input dropdown"
            placeholder="Select"
            options={SKILL_EXPERIENCE_OPTIONS}
            value={skillFormik.values.experience || undefined}
            onChange={(value) => skillFormik.setFieldValue('experience', value)}
            onBlur={() => skillFormik.setFieldTouched('experience', true)}
            getPopupContainer={() => document.body}
            popupMatchSelectWidth
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const contractPeriodOptions = [
  { value: 'Day(s)',   label: 'Day(s)' },
  { value: 'Week(s)',  label: 'Week(s)' },
  { value: 'Month(s)', label: 'Month(s)' },
];

const normalizeJobTypeKey = (jobType) => {
  if (!jobType) return null;
  const normalized = String(jobType).toLowerCase().trim();
  if (normalized.includes('full')) return 'full-time';
  if (normalized.includes('part')) return 'part-time';
  if (normalized.includes('contract')) return 'contract';
  if (normalized.includes('intern') || normalized.includes('temp')) return 'internship';
  return normalized;
};

const MIN_SKILLS_REQUIRED = 4;
const JOB_FORM_ROW_GUTTER = [10, 12];

const FormSection = ({ title, children }) => (
  <Col span={24}>
    <div className="job-form-section">
      <h3 className="job-form-section__title">{title}</h3>
      <Divider className="job-form-section__divider" />
      <Row gutter={JOB_FORM_ROW_GUTTER}>{children}</Row>
    </div>
  </Col>
);

const FormSectionHalf = ({ title, children }) => (
  <div className="job-form-section">
    <h3 className="job-form-section__title">{title}</h3>
    <Divider className="job-form-section__divider" />
    <Row gutter={JOB_FORM_ROW_GUTTER}>{children}</Row>
  </div>
);

// ─── Default Values ───────────────────────────────────────────────────────────

const getDefaultInitialValues = () => ({
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
  timezone: "(UTC+05:00) Ekaterinburg, Islamabad, Karachi, Tashkent",
  working_days: null,
  working_days_from: null,
  working_days_to: null,
  // New fields
  degree_level: null,
  job_shift: null,
  hours_per_week: null,
  contract_length: null,
  contract_period: null,
  degrees: [],
  skills: [],
});

// ─── Component ────────────────────────────────────────────────────────────────

const JobForm = ({
  initialValues,
  validationSchema,
  onSubmit,
  enableReinitialize = true,
  experienceError: externalExperienceError = '',
  salaryError: externalSalaryError = '',
  onFieldBlur,
  submitButtonText = 'Save',
  submitButtonLoading = false,
  vacancyOptions,
  showValidationErrors = true,
  onFormikReady,
  dateOnly = false,
  manualLocation = false,
  allowPastDates = false,
  readOnlyMode = false,
  hideSubmitButton = false,
  isEditMode = false,
}) => {
  const [experienceError, setExperienceError] = useState(externalExperienceError);
  const [salaryError, setSalaryError]         = useState(externalSalaryError);

  // Skill modal state
  const [skillModal, setSkillModal] = useState({ open: false, skill: null });
  const [skillSearch, setSkillSearch] = useState('');

  const formik = useFormik({
    initialValues: { ...getDefaultInitialValues(), ...(initialValues || {}) },
    enableReinitialize,
    validationSchema,
    onSubmit: (values, helpers) => {
      const minExp = Number(values.min_experience);
      const maxExp = Number(values.max_experience);
      if (!isNaN(minExp) && !isNaN(maxExp) && minExp > maxExp) {
        setExperienceError('Minimum experience must be less than or equal to maximum experience');
        return;
      } else {
        setExperienceError('');
      }

      const min = Number(values.min_salary);
      const max = Number(values.max_salary);
      if (!isNaN(min) && !isNaN(max) && min !== 0 && max !== 0 && min > max) {
        setSalaryError('Minimum salary must be less than or equal to maximum salary');
        return;
      } else {
        setSalaryError('');
      }

      const typeKey = normalizeJobTypeKey(values.job_type);
      if (typeKey === 'part-time' && (values.hours_per_week == null || values.hours_per_week === '')) {
        helpers.setFieldError('hours_per_week', 'Hours per week is required for part-time jobs');
        helpers.setFieldTouched('hours_per_week', true, false);
        return;
      }
      if (typeKey === 'contract') {
        if (!values.contract_period) {
          helpers.setFieldError('contract_period', 'Please select contract period');
          helpers.setFieldTouched('contract_period', true, false);
          return;
        }
        if (values.contract_length == null || values.contract_length === '') {
          helpers.setFieldError('contract_length', 'Contract length is required');
          helpers.setFieldTouched('contract_length', true, false);
          return;
        }
      }

      if (onSubmit) onSubmit(values);
    },
  });

  useEffect(() => { if (onFormikReady) onFormikReady(formik); }, [formik, onFormikReady]);
  useEffect(() => { if (externalExperienceError !== undefined) setExperienceError(externalExperienceError); }, [externalExperienceError]);
  useEffect(() => { if (externalSalaryError !== undefined) setSalaryError(externalSalaryError); }, [externalSalaryError]);

  useEffect(() => {
    if (!isEditMode) return;
    const mappedAddress = initialValues?.address;
    if (mappedAddress == null || mappedAddress === formik.values.address) return;
    formik.setFieldValue('address', mappedAddress);
  }, [isEditMode, initialValues?.address]);

  const isFormDisabled = readOnlyMode;

  const getOnBlur = (fieldName) => {
    if (onFieldBlur) {
      return (event) => {
        formik.handleBlur(event);
        onFieldBlur(event, fieldName, formik.values[fieldName]);
      };
    }
    return formik.handleBlur;
  };

  const getSelectBlur = (fieldName) => () => {
    formik.setFieldTouched(fieldName, true);
    if (onFieldBlur) onFieldBlur(null, fieldName, formik.values[fieldName]);
  };

  const handleDateChange = (fieldName, value) => {
    const isoValue = value ? dayjs(value).startOf('day').toISOString() : null;
    formik.setFieldValue(fieldName, isoValue);
    if (onFieldBlur) onFieldBlur(null, fieldName, isoValue);
  };

  // ─── Skill Handlers ──────────────────────────────────────────────────────────

  const handleSkillSelect = (skillName) => {
    const trimmed = String(skillName || '').trim();
    if (!trimmed) return;

    const alreadyAdded = (formik.values.skills || []).some(
      (skill) => getSkillDisplayName(skill).toLowerCase() === trimmed.toLowerCase()
    );
    if (alreadyAdded) {
      setSkillSearch('');
      return;
    }

    setSkillSearch('');
    setSkillModal({
      open: true,
      skill: { id: null, name: trimmed },
    });
  };

  const availableSkillOptions = useMemo(() => {
    const addedSkills = new Set((formik.values.skills || []).map(getSkillDisplayName));
    const options = skillNameOptions
      .filter((name) => !addedSkills.has(name))
      .map((name) => ({ label: name, value: name }));

    const trimmedSearch = skillSearch.trim();
    if (!trimmedSearch) return options;

    const existsInList = skillNameOptions.some(
      (name) => name.toLowerCase() === trimmedSearch.toLowerCase()
    );
    const existsInAdded = [...addedSkills].some(
      (name) => name.toLowerCase() === trimmedSearch.toLowerCase()
    );

    if (!existsInList && !existsInAdded) {
      options.unshift({ label: `Add "${trimmedSearch}"`, value: trimmedSearch });
    }

    return options;
  }, [formik.values.skills, skillSearch]);

  const handleSkillEdit = (skill) => {
    setSkillModal({
      open: true,
      skill: {
        id: skill?.id ?? null,
        name: getSkillDisplayName(skill),
        experience: skill?.experience,
      },
    });
  };

  const closeSkillModal = () => {
    setSkillModal({ open: false, skill: null });
  };

  const handleSkillSave = (skillPayload) => {
    const existing = formik.values.skills || [];
    const skillName = getSkillDisplayName(skillPayload);
    const idx = existing.findIndex((s) => getSkillDisplayName(s) === skillName);
    const updated =
      idx >= 0
        ? existing.map((s, i) => (i === idx ? skillPayload : s))
        : [...existing, skillPayload];
    formik.setFieldValue('skills', updated);
    formik.setFieldTouched('skills', true);
    closeSkillModal();
  };

  const handleSkillRemove = (skillName) => {
    formik.setFieldValue(
      'skills',
      (formik.values.skills || []).filter((s) => getSkillDisplayName(s) !== skillName)
    );
    formik.setFieldTouched('skills', true);
  };

  const handleDegreesChange = (degreeNames) => {
    const names = Array.isArray(degreeNames) ? degreeNames : [];
    formik.setFieldValue(
      'degrees',
      names
        .map((name) => String(name || '').trim())
        .filter(Boolean)
        .map((degree_name) => ({ degree_name }))
    );
    formik.setFieldTouched('degrees', true);
  };

  const jobTypeKey = normalizeJobTypeKey(formik.values.job_type);
  const showHoursPerWeek = jobTypeKey === 'part-time';
  const showContractFields = jobTypeKey === 'contract';
  const degreeNameRequired = isDegreeNameRequiredForLevel(formik.values.degree_level);
  const showAddressField = !isRemoteEmploymentType(formik.values.employment_type);
  const mappedAddress =
    formik.values.address ?? (isEditMode ? initialValues?.address : null) ?? '';

  const handleEmploymentTypeChange = (value) => {
    formik.setFieldValue('employment_type', value);
    if (isRemoteEmploymentType(value) && !isEditMode) {
      formik.setFieldValue('address', null);
    }
    setTimeout(() => formik.validateField('address'), 0);
  };

  const handleJobTypeChange = (value) => {
    formik.setFieldValue('job_type', value);
    const key = normalizeJobTypeKey(value);
    if (key === 'full-time' || key === 'internship' || !key) {
      formik.setFieldValue('hours_per_week', null);
      formik.setFieldValue('contract_length', null);
      formik.setFieldValue('contract_period', null);
    } else if (key === 'part-time') {
      formik.setFieldValue('contract_length', null);
      formik.setFieldValue('contract_period', null);
    } else if (key === 'contract') {
      formik.setFieldValue('hours_per_week', null);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
    <form
      className="job-form"
      onSubmit={(event) => {
        if (readOnlyMode) { event.preventDefault(); return; }
        formik.handleSubmit(event);
      }}
    >
      <fieldset className="job-form__fieldset">
        <Row gutter={JOB_FORM_ROW_GUTTER}>

          <FormSection title="Basic Job Info">
          <Col span={6}>
            <label htmlFor="job_title" className="form-label text-start mt-3 mb-1">Job Title*</label>
            <Input
              disabled={isFormDisabled}
              id="job_title" name="job_title" type="text"
              value={formik.values.job_title}
              onChange={formik.handleChange}
              onBlur={getOnBlur('job_title')}
              placeholder="Job Title"
              className="antd-input styled-input"
              allowClear
              status={formik.errors.job_title && formik.touched.job_title ? 'error' : ''}
            />
            {formik.errors.job_title && formik.touched.job_title && <div className="text-red">{formik.errors.job_title}</div>}
          </Col>

          <Col span={6}>
            <label htmlFor="number_of_vacancies" className="form-label text-start mt-3 mb-1">No. of Vacancies*</label>
            <Select
              disabled={isFormDisabled}
              className="antd-input dropdown"
              placeholder="Number of Vacancies"
              value={formik.values.number_of_vacancies || undefined}
              options={vacancyOptions || getVacancyOptions()}
              onChange={(value) => formik.setFieldValue('number_of_vacancies', value)}
              allowClear
              status={formik.errors.number_of_vacancies && formik.touched.number_of_vacancies ? 'error' : ''}
              onBlur={getSelectBlur('number_of_vacancies')}
            />
            {formik.errors.number_of_vacancies && formik.touched.number_of_vacancies && <div className="text-red">{formik.errors.number_of_vacancies}</div>}
          </Col>

          <Col span={6}>
            <label htmlFor="languages_required" className="form-label text-start mt-3 mb-1">Language Required</label>
            <Select
              disabled={isFormDisabled}
              className="antd-input dropdown"
              placeholder="Select or enter languages"
              options={languageOptions}
              showSearch mode="tags"
              value={Array.isArray(formik.values.languages_required) ? formik.values.languages_required : (formik.values.languages_required ? [formik.values.languages_required] : [])}
              onChange={(value) => { formik.setFieldValue('languages_required', value); formik.setFieldTouched('languages_required', true); }}
              allowClear tokenSeparators={[',']}
              status={formik.errors.languages_required && formik.touched.languages_required ? 'error' : ''}
              onBlur={getSelectBlur('languages_required')}
            />
            {formik.errors.languages_required && formik.touched.languages_required && <div className="text-red">{formik.errors.languages_required}</div>}
          </Col>

          <Col span={6}>
            <label htmlFor="gender" className="form-label text-start mt-3 mb-1">Gender Preference*</label>
            <Select
              disabled={isFormDisabled}
              className="antd-input dropdown"
              placeholder="Select Gender Preference"
              options={genderOptions}
              value={formik.values.gender_preference}
              onChange={(value) => formik.setFieldValue('gender_preference', value)}
              allowClear
              status={formik.errors.gender_preference && formik.touched.gender_preference ? 'error' : ''}
              onBlur={getSelectBlur('gender_preference')}
            />
            {formik.errors.gender_preference && formik.touched.gender_preference && <div className="text-red">{formik.errors.gender_preference}</div>}
          </Col>

          <Col span={6}>
            <label htmlFor="nationality_preference" className="form-label text-start mt-3 mb-1">Nationality Preference</label>
            <Select
              disabled={isFormDisabled}
              className="antd-input dropdown"
              placeholder="Select or enter nationalities"
              options={nationalityOptions}
              showSearch mode="tags"
              value={Array.isArray(formik.values.nationality_preference) ? formik.values.nationality_preference : (formik.values.nationality_preference ? [formik.values.nationality_preference] : [])}
              onChange={(value) => formik.setFieldValue('nationality_preference', value)}
              allowClear tokenSeparators={[',']}
              onBlur={getSelectBlur('nationality_preference')}
            />
          </Col>

          <Col span={6}>
            <label htmlFor="department" className="form-label text-start mt-3 mb-1">Department</label>
            <Select
              disabled={isFormDisabled}
              className="antd-input dropdown"
              placeholder="Select or enter departments"
              options={departmentOptions}
              showSearch mode="tags"
              value={Array.isArray(formik.values.department) ? formik.values.department : (formik.values.department ? [formik.values.department] : [])}
              onChange={(value) => formik.setFieldValue('department', value)}
              allowClear tokenSeparators={[',']}
              onBlur={getSelectBlur('department')}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <label htmlFor="working_hours" className="form-label text-start mt-3 mb-1">Working Hours</label>
            <Input
              disabled={isFormDisabled}
              id="working_hours" name="working_hours"
              value={formik.values.working_hours}
              onChange={formik.handleChange}
              placeholder="Working Hours"
              className="antd-input styled-input"
              allowClear onBlur={getOnBlur('working_hours')}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <label htmlFor="cv_submission_deadline" className="form-label text-start mt-3 mb-1">CV Submission Deadline</label>
            <DatePicker
              disabled={isFormDisabled}
              id="cv_submission_deadline" name="cv_submission_deadline"
              showTime={dateOnly ? false : { format: 'hh:mm A', use12Hours: true }}
              format="DD/MM/YYYY"
              placeholder="CV Submission Deadline"
              value={formik.values.cv_submission_deadline ? dayjs(formik.values.cv_submission_deadline) : null}
              onChange={(value) => handleDateChange('cv_submission_deadline', value)}
              className="job-form__full-width"
              disabledDate={allowPastDates ? undefined : (current) => current && current < moment().startOf('day')}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <label htmlFor="expected_joining_date" className="form-label text-start mt-3 mb-1">Expected Joining Date</label>
            <DatePicker
              disabled={isFormDisabled}
              id="expected_joining_date" name="expected_joining_date"
              showTime={dateOnly ? false : { format: 'hh:mm A', use12Hours: true }}
              format="DD/MM/YYYY"
              placeholder="Expected Joining Date"
              value={formik.values.expected_joining_date ? dayjs(formik.values.expected_joining_date) : null}
              onChange={(value) => handleDateChange('expected_joining_date', value)}
              className="job-form__full-width"
              disabledDate={allowPastDates ? undefined : (current) => current && current < moment().startOf('day')}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <label htmlFor="timezone" className="form-label text-start mt-3 mb-1">Timezone</label>
            <Select
              disabled={isFormDisabled}
              className="antd-input dropdown"
              placeholder="Select Timezone"
              options={timezoneOptions}
              value={formik.values.timezone}
              onChange={(value) => formik.setFieldValue('timezone', value)}
              allowClear onBlur={getSelectBlur('timezone')}
            />
          </Col>

          <Col span={24}>
            <label htmlFor="working_days" className="form-label text-start mt-3 mb-1">Working Days</label>
            <div className="job-form__working-days-row">
              <Select
                disabled={isFormDisabled}
                className="antd-input dropdown job-form__working-days-select"
                placeholder="From"
                options={workingDaysOptions}
                value={formik.values.working_days_from || undefined}
                onChange={(value) => {
                  formik.setFieldValue('working_days_from', value);
                  if (value && formik.values.working_days_to) {
                    const str = `${value} - ${formik.values.working_days_to}`;
                    formik.setFieldValue('working_days', str);
                    if (onFieldBlur) onFieldBlur(null, 'working_days', str);
                  }
                }}
                allowClear
              />
              <span className="job-form__working-days-separator">to</span>
              <Select
                disabled={isFormDisabled}
                className="antd-input dropdown job-form__working-days-select"
                placeholder="To"
                options={workingDaysOptions}
                value={formik.values.working_days_to || undefined}
                onChange={(value) => {
                  formik.setFieldValue('working_days_to', value);
                  if (value && formik.values.working_days_from) {
                    const str = `${formik.values.working_days_from} - ${value}`;
                    formik.setFieldValue('working_days', str);
                    if (onFieldBlur) onFieldBlur(null, 'working_days', str);
                  }
                }}
                allowClear
              />
            </div>
            {formik.values.working_days && (
              <div className="job-form__working-days-selected">
                Selected: {formik.values.working_days}
              </div>
            )}
          </Col>

          {/* ── Experience ── */}
          <Col span={6}>
            <label htmlFor="min_experience" className="form-label text-start mt-3 mb-1">Min Experience (Years)*</label>
            <Input
              disabled={isFormDisabled}
              id="min_experience" name="min_experience" type="number"
              value={formik.values.min_experience}
              onChange={formik.handleChange}
              onBlur={(event) => {
                formik.handleBlur(event);
                if (onFieldBlur) onFieldBlur(event, 'min_experience', formik.values.min_experience);
              }}
              placeholder="Min Experience"
              className="antd-input styled-input"
              min={0} allowClear
              status={(formik.errors.min_experience && formik.touched.min_experience) || experienceError ? 'error' : ''}
            />
            {formik.errors.min_experience && formik.touched.min_experience && <div className="text-red">{formik.errors.min_experience}</div>}
            {experienceError && <div className="text-red">{experienceError}</div>}
          </Col>

          <Col span={6}>
            <label htmlFor="max_experience" className="form-label text-start mt-3 mb-1">Max Experience (Years)*</label>
            <Input
              disabled={isFormDisabled}
              id="max_experience" name="max_experience" type="number"
              value={formik.values.max_experience}
              onChange={formik.handleChange}
              onBlur={(event) => {
                formik.handleBlur(event);
                if (onFieldBlur) onFieldBlur(event, 'max_experience', formik.values.max_experience);
              }}
              placeholder="Max Experience"
              className="antd-input styled-input"
              min={0} allowClear
              status={(formik.errors.max_experience && formik.touched.max_experience) || experienceError ? 'error' : ''}
            />
            {formik.errors.max_experience && formik.touched.max_experience && <div className="text-red">{formik.errors.max_experience}</div>}
            {experienceError && <div className="text-red">{experienceError}</div>}
          </Col>
          </FormSection>

          <FormSection title="Job Location">
          <Col span={12}>
            <label htmlFor="employment_type" className="form-label text-start mt-3 mb-1">Employment Type*</label>
            <Select
              disabled={isFormDisabled}
              className="antd-input dropdown"
              placeholder="Select Employment Type"
              options={employmentTypeOptions}
              value={formik.values.employment_type}
              onChange={handleEmploymentTypeChange}
              allowClear
              status={formik.errors.employment_type && formik.touched.employment_type ? 'error' : ''}
              onBlur={getSelectBlur('employment_type')}
            />
            {formik.errors.employment_type && formik.touched.employment_type && (
              <div className="text-red">{formik.errors.employment_type}</div>
            )}
          </Col>

          <Col span={6}>
            <label htmlFor="location_city" className="form-label text-start mt-3 mb-1">City*</label>
            {manualLocation ? <Input
              id="location_city"
              name="location_city"
              disabled={isFormDisabled}
              className="antd-input"
              placeholder="Enter city"
              value={formik.values.location_city || ''}
              onChange={formik.handleChange}
              onBlur={getSelectBlur('location_city')}
              status={formik.errors.location_city && formik.touched.location_city ? 'error' : ''}
            /> : (
            <Select
              disabled={isFormDisabled}
              className="antd-input dropdown"
              placeholder="Select City"
              options={citiesNames}
              showSearch
              value={formik.values.location_city}
              onChange={(value) => formik.setFieldValue('location_city', value)}
              allowClear
              status={formik.errors.location_city && formik.touched.location_city ? 'error' : ''}
              onBlur={getSelectBlur('location_city')}
            />
            )}
            {formik.errors.location_city && formik.touched.location_city && <div className="text-red">{formik.errors.location_city}</div>}
          </Col>

          <Col span={6}>
            <label htmlFor="location_country" className="form-label text-start mt-3 mb-1">Country*</label>
            {manualLocation ? <Input
              id="location_country"
              name="location_country"
              disabled={isFormDisabled}
              className="antd-input"
              placeholder="Enter country"
              value={formik.values.location_country || ''}
              onChange={formik.handleChange}
              onBlur={getSelectBlur('location_country')}
              status={formik.errors.location_country && formik.touched.location_country ? 'error' : ''}
            /> : (
            <Select
              disabled={isFormDisabled}
              className="antd-input dropdown"
              placeholder="Select Country"
              options={countriesNames}
              value={formik.values.location_country}
              showSearch
              allowClear
              onChange={(value) => formik.setFieldValue('location_country', value)}
              onBlur={getSelectBlur('location_country')}
              status={formik.errors.location_country && formik.touched.location_country ? 'error' : ''}
            />
            )}
            {formik.errors.location_country && formik.touched.location_country && (
              <div className="text-red">{formik.errors.location_country}</div>
            )}
          </Col>

          {showAddressField && (
            <Col span={12}>
              <label htmlFor="address" className="form-label text-start mt-3 mb-1">Address*</label>
              <Input
                disabled={isFormDisabled}
                id="address"
                name="address"
                value={mappedAddress}
                onChange={formik.handleChange}
                onBlur={getOnBlur('address')}
                placeholder="Enter address where candidate will work"
                className="antd-input styled-input"
                allowClear
                status={formik.errors.address && formik.touched.address ? 'error' : ''}
              />
              {formik.errors.address && formik.touched.address && (
                <div className="text-red">{formik.errors.address}</div>
              )}
            </Col>
          )}
          </FormSection>

          <Col span={24}>
            <Row gutter={JOB_FORM_ROW_GUTTER}>
              <Col xs={24} lg={12}>
                <FormSectionHalf title="Education">
                  <Col span={24}>
                    <label className="form-label text-start mt-3 mb-1">Degree Level</label>
                    <Select
                      disabled={isFormDisabled}
                      className="antd-input dropdown"
                      placeholder="Select Degree Level"
                      options={degreeLevelOptions}
                      value={formik.values.degree_level}
                      onChange={(value) => {
                        formik.setFieldValue('degree_level', value);
                        formik.setFieldTouched('degree_level', true);
                        setTimeout(() => formik.validateField('degrees'), 0);
                      }}
                      allowClear
                      status={formik.errors.degree_level && formik.touched.degree_level ? 'error' : ''}
                      onBlur={getSelectBlur('degree_level')}
                    />
                    {formik.errors.degree_level && formik.touched.degree_level && (
                      <div className="text-red">{formik.errors.degree_level}</div>
                    )}
                  </Col>

                  <Col span={24}>
                    <label className="form-label text-start mt-3 mb-1">
                      Degree Name(s){degreeNameRequired ? '*' : ''}
                    </label>
                    <Select
                      disabled={isFormDisabled}
                      className="antd-input dropdown job-form__full-width"
                      placeholder="Select or type degree names"
                      showSearch
                      mode="tags"
                      tokenSeparators={[',']}
                      value={(formik.values.degrees || []).map((d) => d.degree_name)}
                      options={degreeNameOptions}
                      onChange={handleDegreesChange}
                      filterOption={(input, opt) => opt.label.toLowerCase().includes(input.toLowerCase())}
                      status={formik.errors.degrees && formik.touched.degrees ? 'error' : ''}
                      onBlur={getSelectBlur('degrees')}
                    />
                    <div className="job-form-section__hint">Please type/select one degree name at a time</div>
                    {degreeNameRequired && formik.errors.degrees && formik.touched.degrees && (
                      <div className="text-red">
                        {typeof formik.errors.degrees === 'string'
                          ? formik.errors.degrees
                          : 'At least one degree name is required'}
                      </div>
                    )}
                  </Col>

                  {isEditMode && hasReadOnlyFieldValue(formik.values.educational_qualification) && (
                    <Col span={24}>
                      <label htmlFor="educational_qualification" className="form-label text-start mt-3 mb-1 job-form-field--disabled">
                        Education
                      </label>
                      <Input
                        id="educational_qualification"
                        name="educational_qualification"
                        value={formik.values.educational_qualification ?? ''}
                        placeholder="—"
                        className="antd-input styled-input"
                        disabled
                        readOnly
                      />
                    </Col>
                  )}
                </FormSectionHalf>
              </Col>

              <Col xs={24} lg={12}>
                <FormSectionHalf title="Job Nature">
                  <Col span={24}>
                    <label htmlFor="job_type" className="form-label text-start mt-3 mb-1">Job Type*</label>
                    <Select
                      disabled={isFormDisabled}
                      className="antd-input dropdown"
                      placeholder="Select Job Type"
                      options={jobTypeOptions}
                      value={formik.values.job_type}
                      onChange={handleJobTypeChange}
                      allowClear
                      status={formik.errors.job_type && formik.touched.job_type ? 'error' : ''}
                      onBlur={getSelectBlur('job_type')}
                    />
                    {formik.errors.job_type && formik.touched.job_type && <div className="text-red">{formik.errors.job_type}</div>}
                  </Col>

                  {showHoursPerWeek && (
                  <Col span={24}>
                    <label className="form-label text-start mt-3 mb-1">
                      Hours Per Week*
                    </label>
                    <Input
                      disabled={isFormDisabled}
                      name="hours_per_week"
                      value={formik.values.hours_per_week ?? ''}
                      onChange={formik.handleChange}
                      placeholder="10, 20-40, etc."
                      className="antd-input styled-input"
                      allowClear
                      status={formik.errors.hours_per_week && formik.touched.hours_per_week ? 'error' : ''}
                      onBlur={getOnBlur('hours_per_week')}
                    />
                    {formik.errors.hours_per_week && formik.touched.hours_per_week && (
                      <div className="text-red">{formik.errors.hours_per_week}</div>
                    )}
                  </Col>
                  )}

                  {showContractFields && (
                  <Col span={24}>
                    <label className="form-label text-start mt-3 mb-1">
                      Contract Period*
                    </label>
                    <Select
                      disabled={isFormDisabled}
                      className="antd-input dropdown"
                      placeholder="Select"
                      options={contractPeriodOptions}
                      value={formik.values.contract_period}
                      onChange={(value) => formik.setFieldValue('contract_period', value)}
                      allowClear
                      status={formik.errors.contract_period && formik.touched.contract_period ? 'error' : ''}
                      onBlur={getSelectBlur('contract_period')}
                    />
                    {formik.errors.contract_period && formik.touched.contract_period && (
                      <div className="text-red">{formik.errors.contract_period}</div>
                    )}
                  </Col>
                  )}

                  {showContractFields && (
                  <Col span={24}>
                    <label className="form-label text-start mt-3 mb-1">
                      Contract Length*
                    </label>
                    <Input
                      disabled={isFormDisabled}
                      name="contract_length"
                      value={formik.values.contract_length ?? ''}
                      onChange={formik.handleChange}
                      placeholder="10, 20-40, etc."
                      className="antd-input styled-input"
                      allowClear
                      status={formik.errors.contract_length && formik.touched.contract_length ? 'error' : ''}
                      onBlur={getOnBlur('contract_length')}
                    />
                    {formik.errors.contract_length && formik.touched.contract_length && (
                      <div className="text-red">{formik.errors.contract_length}</div>
                    )}
                  </Col>
                  )}

                  {isEditMode && hasReadOnlyFieldValue(formik.values.job_shift) && (
                    <Col span={24}>
                      <label htmlFor="job_shift" className="form-label text-start mt-3 mb-1 job-form-field--disabled">
                        Job Shift
                      </label>
                      <Input
                        id="job_shift"
                        name="job_shift"
                        value={formik.values.job_shift ?? ''}
                        placeholder="—"
                        className="antd-input styled-input"
                        disabled
                        readOnly
                      />
                    </Col>
                  )}
                </FormSectionHalf>
              </Col>
            </Row>
          </Col>

          <FormSection title="Required Skills">
          <Col span={24}>
            <label className="form-label text-start mt-3 mb-1">Required Skills*</label>
            <Select
              disabled={isFormDisabled}
              className="antd-input dropdown job-form__full-width"
              placeholder="Search or type a skill name"
              showSearch
              value={null}
              searchValue={skillSearch}
              onSearch={setSkillSearch}
              options={availableSkillOptions}
              onChange={handleSkillSelect}
              filterOption={(input, opt) =>
                String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              onInputKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                const trimmed = skillSearch.trim();
                if (!trimmed) return;
                event.preventDefault();
                handleSkillSelect(trimmed);
              }}
              status={formik.errors.skills && formik.touched.skills ? 'error' : ''}
              onBlur={() => formik.setFieldTouched('skills', true)}
            />
            <div className="job-form-section__hint">
              Search existing skills or type a custom skill, then press Enter or select Add
            </div>
            <div
              className="job-form__skills-count"
              style={{ '--skills-count-fg': (formik.values.skills || []).length < MIN_SKILLS_REQUIRED ? '#ff4d4f' : '#3E6A9F' }}
            >
              {(formik.values.skills || []).length} / {MIN_SKILLS_REQUIRED} skills required
            </div>
            {formik.errors.skills && formik.touched.skills && (
              <div className="text-red">
                {typeof formik.errors.skills === 'string'
                  ? formik.errors.skills
                  : 'At least 4 skills are required'}
              </div>
            )}
          </Col>

          {(formik.values.skills || []).length > 0 && (
            <Col span={24}>
              <div className="job-form__skill-chips">
                {(formik.values.skills || []).map((skill) => {
                  const skillName = getSkillDisplayName(skill);
                  return (
                  <div
                    key={skillName}
                    className="job-form__skill-chip"
                  >
                    <div
                      className="job-form__skill-chip-name"
                      style={{ '--skill-chip-name-pr': readOnlyMode ? '0px' : '36px' }}
                    >{skillName}</div>
                    <div className="job-form__skill-chip-experience">{getSkillExperienceLabel(skill.experience)}</div>
                    {!readOnlyMode && (
                      <div className="job-form__skill-chip-actions">
                        <span className="job-form__skill-chip-edit" onClick={() => handleSkillEdit(skill)}>✏️</span>
                        <span className="job-form__skill-chip-remove" onClick={() => handleSkillRemove(skillName)}>✕</span>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </Col>
          )}

          {isEditMode && hasReadOnlyFieldValue(formik.values.key_skills_required) && (
            <Col span={24}>
              <label htmlFor="key_skills_required" className="form-label text-start mt-3 mb-1 job-form-field--disabled">
                Key Skills
              </label>
              <Input.TextArea
                id="key_skills_required"
                name="key_skills_required"
                value={formik.values.key_skills_required ?? ''}
                placeholder="—"
                rows={4}
                className="antd-input styled-input"
                disabled
                readOnly
              />
            </Col>
          )}
          </FormSection>

          <FormSection title="Salary & Compensation">
          <Col span={6}>
            <label htmlFor="currency" className="form-label text-start mt-3 mb-1">Currency*</label>
            <Select
              disabled={isFormDisabled}
              className="antd-input dropdown"
              placeholder="Select Currency"
              options={currencyOptions}
              value={formik.values.currency}
              onChange={(value) => formik.setFieldValue('currency', value)}
              allowClear
              status={formik.errors.currency && formik.touched.currency ? 'error' : ''}
              onBlur={getSelectBlur('currency')}
            />
            {formik.errors.currency && formik.touched.currency && <div className="text-red">{formik.errors.currency}</div>}
          </Col>

          <Col span={6}>
            <label htmlFor="min_salary" className="form-label text-start mt-3 mb-1">Minimum Salary*</label>
            <Input
              disabled={isFormDisabled}
              id="min_salary" name="min_salary" type="number"
              value={formik.values.min_salary}
              onChange={formik.handleChange} onBlur={getOnBlur('min_salary')}
              placeholder="Minimum Salary"
              className="antd-input styled-input"
              min={0} allowClear
              status={(formik.errors.min_salary && formik.touched.min_salary) || salaryError ? 'error' : ''}
            />
            {formik.errors.min_salary && formik.touched.min_salary && <div className="text-red">{formik.errors.min_salary}</div>}
            {salaryError && <div className="text-red">{salaryError}</div>}
          </Col>

          <Col span={6}>
            <label htmlFor="max_salary" className="form-label text-start mt-3 mb-1">Maximum Salary*</label>
            <Input
              disabled={isFormDisabled}
              id="max_salary" name="max_salary" type="number"
              value={formik.values.max_salary}
              onChange={formik.handleChange} onBlur={getOnBlur('max_salary')}
              placeholder="Maximum Salary"
              className="antd-input styled-input"
              min={0} allowClear
              status={(formik.errors.max_salary && formik.touched.max_salary) || salaryError ? 'error' : ''}
            />
            {formik.errors.max_salary && formik.touched.max_salary && <div className="text-red">{formik.errors.max_salary}</div>}
            {salaryError && <div className="text-red">{salaryError}</div>}
          </Col>

          <Col span={6}>
            <label htmlFor="payment_term" className="form-label text-start mt-3 mb-1">Payment Terms*</label>
            <Select
              disabled={isFormDisabled}
              className="antd-input dropdown"
              placeholder="Select Payment Term"
              options={paymentTermOptions}
              value={formik.values.payment_term}
              showSearch
              onChange={(value) => formik.setFieldValue('payment_term', value)}
              allowClear
              status={formik.errors.payment_term && formik.touched.payment_term ? 'error' : ''}
              onBlur={getSelectBlur('payment_term')}
            />
            {formik.errors.payment_term && formik.touched.payment_term && <div className="text-red">{formik.errors.payment_term}</div>}
          </Col>

          {formik.values.min_salary && (
            <Col span={24}>
              <p className="job-form__salary-preview">
                {formik.values.currency ? formatCurrency(formik.values.currency) : ''}{' '}
                {formatSalaryNum(formik.values.min_salary)}
                {formik.values.max_salary && ` - ${formatSalaryNum(formik.values.max_salary)}`}{' '}
                {formik.values.payment_term}
              </p>
            </Col>
          )}
          </FormSection>

          <FormSection title="Job Details">
          <Col span={24}>
            <label htmlFor="job_description" className="form-label text-start mt-3 mb-1">Job Description*</label>
            <Input.TextArea disabled={isFormDisabled} id="job_description" name="job_description" value={formik.values.job_description} onChange={formik.handleChange} placeholder="Job Description" rows={6} className="antd-input styled-input" status={formik.errors.job_description && formik.touched.job_description ? 'error' : ''} onBlur={getOnBlur('job_description')} />
            {formik.errors.job_description && formik.touched.job_description && <div className="text-red">{formik.errors.job_description}</div>}
          </Col>

          <Col span={24}>
            <label htmlFor="job_responsibilities" className="form-label text-start mt-3 mb-1">Responsibilities</label>
            <Input.TextArea disabled={isFormDisabled} id="job_responsibilities" name="job_responsibilities" value={formik.values.job_responsibilities} onChange={formik.handleChange} placeholder="Job Responsibilities" rows={6} className="antd-input styled-input" status={formik.errors.job_responsibilities && formik.touched.job_responsibilities ? 'error' : ''} onBlur={getOnBlur('job_responsibilities')} />
            {formik.errors.job_responsibilities && formik.touched.job_responsibilities && <div className="text-red">{formik.errors.job_responsibilities}</div>}
          </Col>

          <Col span={24}>
            <label htmlFor="job_requirements" className="form-label text-start mt-3 mb-1">Requirements</label>
            <Input.TextArea disabled={isFormDisabled} id="job_requirements" name="job_requirements" value={formik.values.job_requirements} onChange={formik.handleChange} placeholder="Job Requirements" rows={6} className="antd-input styled-input" status={formik.errors.job_requirements && formik.touched.job_requirements ? 'error' : ''} onBlur={getOnBlur('job_requirements')} />
            {formik.errors.job_requirements && formik.touched.job_requirements && <div className="text-red">{formik.errors.job_requirements}</div>}
          </Col>

        

          <Col span={24}>
            <label htmlFor="other_benefits" className="form-label text-start mt-3 mb-1">Other Benefits</label>
            <Input.TextArea disabled={isFormDisabled} id="other_benefits" name="other_benefits" value={formik.values.other_benefits} onChange={formik.handleChange} placeholder="Other Benefits" rows={6} className="antd-input styled-input" status={formik.errors.other_benefits && formik.touched.other_benefits ? 'error' : ''} onBlur={getOnBlur('other_benefits')} />
            {formik.errors.other_benefits && formik.touched.other_benefits && <div className="text-red">{formik.errors.other_benefits}</div>}
          </Col>

          <Col span={24}>
            <label htmlFor="notes" className="form-label text-start mt-3 mb-1">Notes</label>
            <Input.TextArea disabled={isFormDisabled} id="notes" name="notes" value={formik.values.notes} onChange={formik.handleChange} placeholder="Notes" rows={6} className="antd-input styled-input" onBlur={getOnBlur('notes')} />
          </Col>
          </FormSection>

        </Row>
      </fieldset>

      {showValidationErrors && Object.keys(formik.errors).length > 0 && (
        <p className="text-red job-form__validation-summary">
          Please fix all errors
        </p>
      )}

      {!hideSubmitButton && (
        <Button
          type="primary" htmlType="submit"
          className={`custom-button job-form__submit-btn${readOnlyMode ? ' job-form__submit-btn--readonly' : ''}`}
          loading={!readOnlyMode && submitButtonLoading}
          disabled={readOnlyMode}
          style={{ '--submit-btn-mt': showValidationErrors && Object.keys(formik.errors).length > 0 ? '0px' : '16px' }}
        >
          {readOnlyMode ? 'Read Only' : submitButtonText}
        </Button>
      )}
    </form>

    <AddSkillToJobModal
      open={skillModal.open}
      skill={skillModal.skill}
      onClose={closeSkillModal}
      onSave={handleSkillSave}
    />
    </>
  );
};

export default JobForm;
