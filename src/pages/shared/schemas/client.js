import * as Yup from 'yup';
import moment from 'moment';
import { internationalPhoneYup } from './schema.js';

// Client Schema
export const clientHeadhuntingValidationSchema = Yup.object({
  converted_from_lead: Yup.string().notRequired(), // Auto Generated, One To One
  added_by: Yup.string().notRequired(), // Optional, Foreign Key
  assigned_to: Yup.string().required('Assignee is required'),
  industry: Yup.string().required('Industry is required'), // Mandatory, Text
  company_name: Yup.string().required('Company name is required'), // Mandatory, Text
  contact_person_name: Yup.string().required('Contact person name is required'), // Mandatory, Text
  contact_person_designation: Yup.string().required('Contact person designation is required'), // Mandatory, Text
  email: Yup.string().email('Invalid email').required(),
  phone_number: internationalPhoneYup().required(),
  promo_code: Yup.string().notRequired(), // Optional, Text
  remarks: Yup.string().required('Remarks is required'),
  created_at: Yup.date().notRequired(), // Optional, DateTime
  followup_date: Yup.mixed()
    .nullable()
    .required('Followup date is required')
    .test('is-valid-date', 'Use format YYYY-MM-DD', function(value) {
      if (value == null || value === '') return false;
      if (typeof value?.format === 'function') return moment(value).isValid();
      return moment(value).isValid();
    }),
  acquired_through: Yup.string().required('Acquired through is required'),
});

/** Sales executive: edit headhunting client — company name and contact designation only */
export const headhuntingClientSalesExecutiveLimitedSchema = Yup.object({
  company_name: Yup.string().trim().required('Company name is required'),
  contact_person_designation: Yup.string().trim().required('Contact person designation is required'),
});

// Client Schema
export const headhuntingClientValidationSchema = Yup.object({
  company_name: Yup.string().required('Company name is required'),
  contact_person_name: Yup.string().required('Contact person name is required'),
  contact_person_designation: Yup.string().notRequired(),
  email: Yup.string().email('Invalid email format').required('Email is required'),
  phone_number: Yup.string().notRequired(),

  status: Yup.string().notRequired(),
  remarks: Yup.string().notRequired(),
});
