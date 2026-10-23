import * as Yup from 'yup';
import { timezoneOptions } from '../../shared/utils/job-form-options.js';

export const dataLeadJobChoices = {
  job_type: ['Full-Time', 'Part-Time', 'Contract', 'Temporary', 'Internship'],
  employment_type: ['Office-Based', 'Remote', 'Hybrid'],
  gender_preference: ['Male', 'Female', 'No Preference'],
  payment_term: ['Per Hour', 'Per Month', 'Per Year'],
  degree_level: ['Middle School', 'High School', 'Intermediate', 'Intermediate In Progress', "Bachelor's", "Bachelor's In Progress", "Master's", "Master's In Progress", 'Doctorate', 'Doctorate In Progress'],
  contract_period: ['Day(s)', 'Week(s)', 'Month(s)'],
  currency: ['Pakistani Rupee (PKR)', 'US Dollar (USD)', 'Saudi Riyal (SAR)', 'Australian Dollar (AUD)', 'Bangladeshi Taka (BDT)', 'British Pound (GBP)', 'Canadian Dollar (CAD)', 'Chinese Yuan (CNY)', 'Egyptian Pound (EGP)', 'Euro (EUR)', 'Indian Rupee (INR)', 'Japanese Yen (JPY)', 'Malaysian Ringgit (MYR)', 'Nigerian Naira (NGN)', 'Russian Ruble (RUB)', 'Singapore Dollar (SGD)', 'South African Rand (ZAR)', 'Swiss Franc (CHF)', 'Turkish Lira (TRY)', 'UAE Dirham (AED)'],
  timezone: timezoneOptions.map(option => option.value),
  min_experience: Array.from({ length: 12 }, (_, index) => index),
  max_experience: Array.from({ length: 12 }, (_, index) => index),
};
const number = () => Yup.number().transform((value, raw) => raw === '' || raw == null ? null : value).nullable().typeError('Enter a valid number');
const experience = () => number().integer().min(0).max(11).required('Select experience');
const date = () => Yup.string().test('datetime', 'Enter a valid date and time', value => !value || !Number.isNaN(Date.parse(value)));

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
  max_salary: number().min(0).test('salary-range', 'Maximum salary must be at least minimum salary', function(value) { return value == null || this.parent.min_salary == null || value >= this.parent.min_salary; }),
  hours_per_week: number().min(1).max(168).when('job_type', { is: 'Part-Time', then: schema => schema.required('Enter hours per week') }),
  contract_length: Yup.string().when('job_type', { is: 'Contract', then: schema => schema.trim().required('Enter contract length') }),
  contract_period: Yup.string().oneOf(['', ...dataLeadJobChoices.contract_period]).when('job_type', { is: 'Contract', then: schema => schema.required('Select contract period') }),
  cv_submission_deadline: date(), expected_joining_date: date(),
  degrees: Yup.array().of(Yup.object({ degree_name: Yup.string().trim().required('Enter the degree name') })),
  skills: Yup.array().of(Yup.object({ skill_name: Yup.string().trim().required('Enter the skill name'), experience: experience(),
    last_used: number().integer().min(0).max(5).required('Select last used') })).min(1, 'Add at least one skill'),
});
