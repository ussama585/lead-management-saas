import * as Yup from 'yup';
import dayjs from 'dayjs';
import { timezoneOptions } from '../../shared/utils/job-form-options.js';
import { currencyOptions } from '../../shared/utils/countries.js';

export const dataLeadJobChoices = {
  job_type: ['Full-Time', 'Part-Time', 'Contract', 'Temporary', 'Internship'],
  employment_type: ['Office-Based', 'Remote', 'Hybrid'],
  gender_preference: ['Male', 'Female', 'No Preference'],
  payment_term: ['Per Hour', 'Per Month', 'Per Year'],
  degree_level: ['Middle School', 'High School', 'Intermediate', 'Intermediate In Progress', "Bachelor's", "Bachelor's In Progress", "Master's", "Master's In Progress", 'Doctorate', 'Doctorate In Progress'],
  contract_period: ['Day(s)', 'Week(s)', 'Month(s)'],
  currency: currencyOptions.map(option => option.value),
  timezone: timezoneOptions.map(option => option.value),
  min_experience: Array.from({ length: 12 }, (_, index) => index),
  max_experience: Array.from({ length: 12 }, (_, index) => index),
};
const number = () => Yup.number().transform((value, raw) => raw === '' || raw == null ? null : value).nullable().typeError('Enter a valid number');
const experience = () => number().integer().min(0).max(11).required('Select experience');
const date = () => Yup.string().test('datetime', 'Enter a valid date and time', value => !value || !Number.isNaN(Date.parse(value)));
export const requiresDegreeName = level => ["Bachelor's", "Bachelor's In Progress", "Master's", "Master's In Progress", 'Doctorate', 'Doctorate In Progress'].includes(level);
export const earliestCvDeadline = () => dayjs().format('YYYY-MM-DD') + 'T00:00';

export const dataLeadJobSchema = Yup.object({
  ...Object.fromEntries(Object.entries(dataLeadJobChoices).filter(([key]) => !key.includes('experience')).map(([key, choices]) => [key, Yup.string().oneOf(['', ...choices], 'Select a valid option')])),
  data_lead: number().integer().positive().required('A data lead is required'),
  job_title: Yup.string().trim().required('Enter the job title'),
  number_of_vacancies: number().integer().min(1).required('Enter the number of vacancies'),
  job_type: Yup.string().oneOf(dataLeadJobChoices.job_type).required('Select job type'),
  employment_type: Yup.string().oneOf(dataLeadJobChoices.employment_type).required('Select employment type'),
  location_country: Yup.string().trim().required('Enter the country'),
  location_city: Yup.string().trim().required('Enter the city'),
  job_description: Yup.string().trim().required('Enter the job description'),
  min_experience: experience(),
  max_experience: experience().test('experience-range', 'Maximum experience must be at least minimum experience', function(value) { return value == null || this.parent.min_experience == null || value >= this.parent.min_experience; }),
  min_salary: number().min(0),
  working_hours: Yup.string().nullable().test('no-letters', 'Working hours cannot contain letters', value => !value || !/\p{L}/u.test(value)),
  max_salary: number().min(0).test('salary-range', 'Maximum salary must be at least minimum salary', function(value) { return value == null || this.parent.min_salary == null || value >= this.parent.min_salary; }),
  hours_per_week: Yup.string().nullable().when('job_type', { is: 'Part-Time', then: schema => schema.trim().required('Enter hours per week') }),
  contract_length: Yup.string().nullable().when('job_type', { is: 'Contract', then: schema => schema.trim().required('Enter contract length') }),
  contract_period: Yup.string().nullable().oneOf(['', ...dataLeadJobChoices.contract_period]).when('job_type', { is: 'Contract', then: schema => schema.required('Select contract period') }),
  cv_submission_deadline: date().test('not-past-date', 'CV submission deadline cannot be in the past', value =>
    !value || value.slice(0, 10) >= earliestCvDeadline().slice(0, 10)),
  expected_joining_date: date().test('not-past-date', 'Expected joining date cannot be in the past', value =>
    !value || value.slice(0, 10) >= earliestCvDeadline().slice(0, 10)),
  degrees: Yup.array().of(Yup.object({ degree_name: Yup.string().trim().required('Enter the degree name') }))
    .when('degree_level', { is: requiresDegreeName, then: schema => schema.min(1, "Enter at least one degree name for Bachelor's level or higher").required('Enter a degree name') }),
  skills: Yup.array().of(Yup.object({ skill_name: Yup.string().trim().required('Enter the skill name'), experience: experience(),
    last_used: number().integer().min(0).max(5).required('Select last used') })).min(4, 'Add at least 4 skills'),
});
