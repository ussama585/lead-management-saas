import * as Yup from 'yup';
import { normalizeEmploymentType } from '../utils/job-utils.js';

export const isRemoteEmploymentType = (employmentType) =>
  normalizeEmploymentType(employmentType) === 'Remote';

const DEGREE_LEVELS_WITHOUT_REQUIRED_NAME = new Set([
  'Middle School',
  'High School',
  'Intermediate In Progress',
  'Intermediate',
]);

export const isDegreeNameRequiredForLevel = (degreeLevel) =>
  Boolean(degreeLevel) && !DEGREE_LEVELS_WITHOUT_REQUIRED_NAME.has(degreeLevel);

const degreeSchema = Yup.object({
  degree_name: Yup.string().trim().required('Degree name is required'),
});

const skillSchema = Yup.object({
  skill_name: Yup.string().trim().required('Skill name is required'),
  id: Yup.mixed().nullable(),
  experience: Yup.string().required('Experience is required'),
});

export const numberOfVacanciesSchema = Yup.number()
  .transform((value, originalValue) =>
    originalValue === '' || originalValue == null ? undefined : value
  )
  .typeError('No. of vacancies must be a valid number')
  .required('No. of vacancies is required')
  .integer('No. of vacancies must be a whole number')
  .min(1, 'No. of vacancies must be at least 1');

const jobFormExtendedFields = {
  degree_level: Yup.string().nullable(),
  job_shift: Yup.string().nullable(),
  hours_per_week: Yup.number()
    .typeError('Hours per week must be a number')
    .nullable()
    .transform((value, originalValue) => (originalValue === '' || originalValue == null ? null : value)),
  contract_length: Yup.string()
    .nullable()
    .when('job_type', {
      is: (jobType) => String(jobType || '').toLowerCase().includes('contract'),
      then: (schema) => schema.required('Contract length is required'),
      otherwise: (schema) => schema.nullable(),
    }),
  contract_period: Yup.string()
    .nullable()
    .when('job_type', {
      is: (jobType) => String(jobType || '').toLowerCase().includes('contract'),
      then: (schema) => schema.required('Contract period is required'),
      otherwise: (schema) => schema.nullable(),
    }),
  degrees: Yup.array()
    .of(degreeSchema)
    .nullable()
    .when('degree_level', {
      is: (degreeLevel) => isDegreeNameRequiredForLevel(degreeLevel),
      then: (schema) =>
        schema
          .min(1, 'At least one degree name is required')
          .required('At least one degree name is required'),
      otherwise: (schema) => schema.nullable(),
    }),
  skills: Yup.array()
    .of(skillSchema)
    .min(4, 'At least 4 skills are required')
    .required('At least 4 skills are required'),
};

// Common Job Form Schema - Base schema for all job forms
export const commonJobFormSchema = Yup.object({
  project: Yup.number().typeError('Project must be a number').nullable(),
  job_title: Yup.string().required('Job title is required'),
  number_of_vacancies: numberOfVacanciesSchema,
  job_type: Yup.string().required('Job type is required'),
  employment_type: Yup.string().required('Employment type is required'),
  department: Yup.mixed()
    .transform((value) => {
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      return value || null;
    })
    .nullable(),
  location_country: Yup.string().required('Country is required'),
  location_city: Yup.string().required('City is required'),
  address: Yup.string()
    .trim()
    .nullable()
    .when('employment_type', {
      is: (employmentType) => !isRemoteEmploymentType(employmentType),
      then: (schema) => schema.required('Address is required'),
      otherwise: (schema) => schema.nullable(),
    }),
  job_description: Yup.string().required('Job description is required'),
  job_requirements: Yup.string().nullable(),
  job_responsibilities: Yup.string().nullable(),
  key_skills_required: Yup.string().nullable(),
  min_experience: Yup.number().typeError('Min experience must be a number').required('Min experience is required').min(0, 'Min experience must be at least 0'),
  max_experience: Yup.number().typeError('Max experience must be a number').required('Max experience is required').min(0, 'Max experience must be at least 0'),
  educational_qualification: Yup.string().nullable(),
  other_benefits: Yup.string().nullable(),
  currency: Yup.string().required('Currency is required'),
  min_salary: Yup.number().typeError('Min salary must be a number').required('Min salary is required').min(0, 'Min salary must be at least 0'),
  max_salary: Yup.number().typeError('Max salary must be a number').required('Max salary is required').min(0, 'Max salary must be at least 0'),
  payment_term: Yup.string().required('Payment term is required'),
  languages_required: Yup.mixed()
    .transform((value) => {
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      return value || null;
    })
   .nullable(),
  gender_preference: Yup.string().required('Gender preference is required'),
  nationality_preference: Yup.mixed()
    .transform((value) => {
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      return value || null;
    })
    .nullable(),
  notes: Yup.string().nullable(),
  cv_submission_deadline: Yup.string().nullable(),
  expected_joining_date: Yup.string().nullable(),
  working_hours: Yup.string().nullable(),
  timezone: Yup.string().nullable(),
  working_days: Yup.string().nullable(),
  ...jobFormExtendedFields,
});

// Keep jobHeadhuntingValidationSchema for backward compatibility - extends commonJobFormSchema with required project field
export const jobHeadhuntingValidationSchema = commonJobFormSchema.shape({
  project: Yup.number().typeError('Required').required('Required'),
});

export const editJobHeadhuntingValidationSchema = Yup.object({
  job_title: Yup.string().trim().required('Required'),
  number_of_vacancies: numberOfVacanciesSchema,
  job_type: Yup.string().required('Required'),
  employment_type: Yup.string().required('Required'),
  department: Yup.mixed()
    .transform((value) => {
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      return value || null;
    })
    .nullable(),
  location_country: Yup.string().trim().required('Country is required'),
  location_city: Yup.string().trim().required('City is required'),
  address: Yup.string()
    .trim()
    .nullable()
    .when('employment_type', {
      is: (employmentType) => !isRemoteEmploymentType(employmentType),
      then: (schema) => schema.required('Address is required'),
      otherwise: (schema) => schema.nullable(),
    }),
  job_description: Yup.string().trim().required('Required'),
  job_requirements: Yup.string().nullable(),
  job_responsibilities: Yup.string().nullable(),
  key_skills_required:Yup.string().nullable(),
  min_experience: Yup.number()
    .typeError('Min experience must be a number')
    .required('Min experience is required')
    .min(0, 'Min experience must be at least 0'),
  max_experience: Yup.number()
    .typeError('Max experience must be a number')
    .required('Max experience is required')
    .min(0, 'Max experience must be at least 0')
    .test('max-greater-than-min', 'Max experience must be greater than or equal to min experience', function(value) {
      const { min_experience } = this.parent;
      if (!value || !min_experience) return true;
      return value >= min_experience;
    }),
  educational_qualification: Yup.string().trim().nullable(),
  other_benefits: Yup.string().nullable(),
  currency: Yup.string().required('Required'),
  min_salary: Yup.number()
    .typeError('Min salary must be a number')
    .required('Min salary is required')
    .min(0, 'Min salary must be at least 0'),
  max_salary: Yup.number()
    .typeError('Max salary must be a number')
    .required('Max salary is required')
    .min(0, 'Max salary must be at least 0')
    .test('max-greater-than-min', 'Max salary must be greater than or equal to min salary', function(value) {
      const { min_salary } = this.parent;
      if (!value || !min_salary) return true;
      return value >= min_salary;
    }),
  payment_term: Yup.string().required('Required'),
  languages_required: Yup.mixed()
    .transform((value) => {
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      return value || null;
    })
    .nullable(),
  gender_preference: Yup.string().required('Required'),
  nationality_preference: Yup.mixed()
    .transform((value) => {
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      return value || null;
    })
    .nullable(),
  notes: Yup.string().nullable(),
  cv_submission_deadline: Yup.date()
    .nullable(),
  expected_joining_date: Yup.date()
    .nullable(),
  working_hours: Yup.string().trim().nullable(),
  timezone: Yup.string().nullable(),
  working_days: Yup.string().nullable(),
  working_days_from: Yup.string().nullable(),
  working_days_to: Yup.string().nullable(),
  remarks: Yup.string().trim().nullable(),
  ...jobFormExtendedFields,
});
