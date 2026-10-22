// src/schemas/loginSchema.js
import * as Yup from 'yup';
import moment from 'moment';

const validTLDs = [
  'com', 'org', 'biz', 'io', 'net', 'tech', 'jobs', 'ai', 'co', 'uk', 'in', 'global', 'dev', 'work', 'solutions', 'team', 'careers', 'company'
];

export const loginValidationSchema = Yup.object({
  email: Yup.string().trim()
    .matches(
      /^[^\s@]+@[^\s@]+\.[a-zA-Z]+(?:\.[a-zA-Z]+)*$/,
      'Email must be a valid email address'
    )
    .test('tld', 'Email TLD must be valid', value => {
      if (!value) return false;
      const tld = value.split('.').pop();
      return validTLDs.includes(tld.toLowerCase());
    })
    .required('Email is Required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
});


export const createUserValidationSchema = Yup.object({
  name: Yup.string().trim()
   
    .min(3, 'Name must be at least 3 characters long')
    .required("Required"),
  email: Yup.string().trim()
    .matches(
      /^[^\s@]+@[^\s@]+\.[a-zA-Z]+(?:\.[a-zA-Z]+)*$/,
      'Email must be a valid email address'
    )
    .test('tld', 'Email TLD must be valid', value => {
      if (!value) return false;
      const tld = value.split('.').pop();
      return validTLDs.includes(tld.toLowerCase());
    })
    .required('Required'),
  phone: internationalPhoneYup().required('Required'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters long'),
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password'), null], 'Passwords must match'),
  user_type: Yup.string().required('User type is required'),
});


export const editUserValidationSchema = Yup.object({
  name: Yup.string().trim()
    .min(3, 'Name must be at least 3 characters long')
    .notRequired(),

  email: Yup.string().trim()
    .matches(
      /^[^\s@]+@[^\s@]+\.[a-zA-Z]+(?:\.[a-zA-Z]+)*$/,
      'Email must be a valid email address'
    )
    .test('tld', 'Email TLD must be valid', value => {
      if (!value) return false;
      const tld = value.split('.').pop();
      return validTLDs.includes(tld.toLowerCase());
    })
    .notRequired(),

 phone: internationalPhoneYup().notRequired(),

  current_password: Yup.string()
    .min(6, 'Password must be at least 6 characters long')
    .notRequired(),

  new_password: Yup.string()
    .min(6, 'New password must be at least 6 characters long')
    .when('current_password', {
      is: (currentPassword) => !!currentPassword && currentPassword.trim() !== '', // Checks if current_password is filled
      then: (schema) => schema
        .notOneOf([Yup.ref('current_password')], 'New password cannot be the same as the current password')
        .required('New password is required when changing the password'), // Ensures new_password is required if current_password is provided
      otherwise: (schema) => schema.notRequired(), // If current_password is empty, make new_password not required
    }),

  user_type: Yup.string().notRequired(),
  // manager: Yup.string().notRequired(),
});


export const createPotentialClientValidationSchema = Yup.object({
  name: Yup.string().trim()
    .matches(/^[A-Za-z.\s]+$/, 'Name can only contain letters and spaces')
    .min(3, 'Name must be at least 3 characters long')
    .required("Required"),

  email: Yup.string().trim()
    .matches(
      /^[^\s@]+@[^\s@]+\.[a-zA-Z]+(?:\.[a-zA-Z]+)*$/,
      'Email must be a valid email address'
    )
    .test('tld', 'Email TLD must be valid', value => {
      if (!value) return false;
      const tld = value.split('.').pop();
      return validTLDs.includes(tld.toLowerCase());
    })
    .required('Required'),

  phone: internationalPhoneYup().notRequired(),

  remarks: Yup.string().trim().required('Required'),
  acquired_through: Yup.string().trim().required('Required'),

  job_title: Yup.string().trim()
    .matches(/^[A-Za-z.\s]+$/, 'Only contain letters and spaces')
    .min(3, 'Name must be at least 3 characters long'), // Optional

  resources_required: Yup.string().trim()
    .matches(/^[1-9][0-9]*$/, 'Must be a positive number greater than 0'),

  posting_date: Yup.date().nullable(), // Optional
  hiring_deadline: Yup.date()
    .nullable()
    .test(
      'is-greater',
      'Hiring deadline must be greater than the posting date',
      function (value) {
        const { posting_date } = this.parent;
        return !posting_date || !value || value > posting_date; // Allow nulls or valid comparison
      }
    ), // Optional
  representative_name: Yup.string().trim()
    .matches(/^[A-Za-z.\s]+$/, 'Name can only contain letters and spaces')
    .min(3, 'Name must be at least 3 characters long'),

  representative_email: Yup.string().trim()
    .matches(
      /^[^\s@]+@[^\s@]+\.[a-zA-Z]+(?:\.[a-zA-Z]+)*$/,
      'Email must be a valid email address'
    ),

  representative_phone: internationalPhoneYup().notRequired(),

  designation: Yup.string().trim()
    .matches(/^[A-Za-z\s]+$/, 'Only contain letters and spaces'),

  website: Yup.string().trim()
    .matches(
      /^(https?:\/\/)?(www\.)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/,
      'Invalid URL'
    )
    .test(
      'custom-url-check',
      'Invalid URL',
      function (value) {
        const { path, createError } = this;
        if (!value) return true;

        const domainPattern = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

        let domainPart = value;
        domainPart = domainPart.replace(/^https?:\/\//, '');
        domainPart = domainPart.split(/[/?#]/)[0];

        if (domainPart.startsWith('www.')) {
          const afterWWW = domainPart.slice(4);
          if (!domainPattern.test(afterWWW)) {
            return createError({ path, message: 'Invalid URL' });
          }
        }

        return true;
      }
    ),

  city: Yup.string().trim()
    .matches(/^[A-Za-z\s]+$/, 'Only contain letters and spaces'),

  country: Yup.string().trim()
    .matches(/^[A-Za-z\s]+$/, 'Only contain letters and spaces'),
  
  linkedin: Yup.string().trim()
    .matches(
      /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company|school|groups|events|showcase)\/[a-zA-Z0-9-_%]+\/?$/,
      'Invalid LinkedIn URL'
    ),
  facebook: Yup.string().trim()
  .matches(
    /^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9.\-_%]+\/?$/,
    'Invalid Facebook URL'
  ), // Optional
});


export const createNewClientValidationSchema = Yup.object({
  name: Yup.string().trim()
    .matches(/^[A-Za-z.\s]+$/, 'Name can only contain letters and spaces')
    .min(3, 'Name must be at least 3 characters long')
    .required("Required"),

  email: Yup.string().trim()
    .matches(
      /^[^\s@]+@[^\s@]+\.[a-zA-Z]+(?:\.[a-zA-Z]+)*$/,
      'Email must be a valid email address'
    )
    .test('tld', 'Email TLD must be valid', value => {
      if (!value) return false;
      const tld = value.split('.').pop();
      return validTLDs.includes(tld.toLowerCase());
    })
    .required('Required'),

  phone: internationalPhoneYup().notRequired(),

  remarks: Yup.string().trim().required('Required'),

  acquired_through: Yup.string().trim().required('Required'),

  acquired_through_other: Yup.string().when('acquired_through', {
    is: 'Other',
    then: schema =>
      schema
        .transform(value => value?.trim())
        .matches(/^[A-Za-z\s]+$/, 'Only contain letters and spaces')
        .required('Required'),
    otherwise: schema => schema.notRequired(),
  }),

  // posting_date: Yup.date()
  //   .nullable()
  //   .required('Required')
  //   .min(new Date(new Date().setHours(0, 0, 0, 0)), 'Date cannot be in the past'),

  representative_name: Yup.string().trim()
    .matches(/^[A-Za-z.\s]+$/, 'Name can only contain letters and spaces')
    .min(3, 'Name must be at least 3 characters long'),

  representative_email: Yup.string().trim()
    .matches(
      /^[^\s@]+@[^\s@]+\.[a-zA-Z]+(?:\.[a-zA-Z]+)*$/,
      'Email must be a valid email address'
    ),

  representative_phone: internationalPhoneYup().notRequired(),

  designation: Yup.string().trim()
    .matches(/^[A-Za-z\s]+$/, 'Only contain letters and spaces'),

  website: Yup.string().trim()
    .matches(
      /^(https?:\/\/)?(www\.)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/,
      'Invalid URL'
    )
    .test(
      'custom-url-check',
      'Invalid URL',
      function (value) {
        const { path, createError } = this;
        if (!value) return true;

        const domainPattern = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

        let domainPart = value;
        domainPart = domainPart.replace(/^https?:\/\//, '');
        domainPart = domainPart.split(/[/?#]/)[0];

        if (domainPart.startsWith('www.')) {
          const afterWWW = domainPart.slice(4);
          if (!domainPattern.test(afterWWW)) {
            return createError({ path, message: 'Invalid URL' });
          }
        }

        return true;
      }
    ),

  city: Yup.string().trim()
    .matches(/^[A-Za-z\s]+$/, 'Only contain letters and spaces'),

  country: Yup.string().trim()
    .matches(/^[A-Za-z\s]+$/, 'Only contain letters and spaces'),
  
  linkedin: Yup.string().trim()
    .matches(
      /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company|school|groups|events|showcase)\/[a-zA-Z0-9-_%]+\/?$/,
      'Invalid LinkedIn URL'
    ),

  facebook: Yup.string().trim()
  .matches(
    /^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9.\-_%]+\/?$/,
    'Invalid Facebook URL'
  ),
});

    
export const createNewProjectValidationSchema = Yup.object({
  job_title: Yup.string().trim()
    .matches(/^[A-Za-z.\s]+$/, 'Only contain letters and spaces')
    .min(3, 'Name must be at least 3 characters long')
    .required("Required"),

  resources_required: Yup.string().trim()
    .matches(/^[1-9][0-9]*$/, 'Must be a positive number greater than 0')
    .required('Required'),

  posting_date: Yup.date()
    .nullable()
    .required('Required')
    .min(new Date(new Date().setHours(0, 0, 0, 0)), 'Date cannot be in the past'),

  hiring_deadline: Yup.date()
    .nullable()
    .required('Required')
    .min(new Date(new Date().setHours(0, 0, 0, 0)), 'Date cannot be in the past'),

  remarks: Yup.string().trim().required('Required'),

  // followup_date: Yup.date()
  //   .nullable()
  //   .required('Required')
  //   .min(new Date(new Date().setHours(0, 0, 0, 0)), 'Date cannot be in the past'),

  // last_followup_date: Yup.date()
  //   .nullable()
  //   .required('Required')
  //   .min(new Date(new Date().setHours(0, 0, 0, 0)), 'Date cannot be in the past'),

  followup_date: Yup.date().nullable().required('Required')
  .min(new Date(new Date().setHours(0, 0, 0, 0)), 'Date cannot be in the past')
  .test(
    'is-after-last-followup',
    'Follow-up date must be after last follow-up date',
    function (value) {
      const { last_followup_date } = this.parent;
      if (!value || !last_followup_date) return true; // Don't fail if either is empty
      return new Date(value) > new Date(last_followup_date); // Must be greater
    }
  ),

  last_followup_date: Yup.date().nullable().required('Required'),
  // .min(new Date(new Date().setHours(0, 0, 0, 0)), 'Date cannot be in the past'),

  description: Yup.string().trim().required('Required'),
});


export const targetValidationSchema = Yup.object({
  companies_approached: Yup.number()
    .typeError('Please enter a valid number')
    .integer('Please enter a valid integer')
    .required('Please enter the target'),

  companies_signups: Yup.number()
    .typeError('Please enter a valid number')
    .integer('Please enter a valid integer')
    .required('Please enter the target'),

  applications_received: Yup.number()
    .typeError('Please enter a valid number')
    .integer('Please enter a valid integer')
    .required('Please enter the target'),

  job_posts: Yup.number()
    .typeError('Please enter a valid number')
    .integer('Please enter a valid integer')
    .required('Please enter the target'),

  hirings: Yup.number()
    .typeError('Please enter a valid number')
    .integer('Please enter a valid integer')
    .required('Please enter the target'),

  candidates_reached: Yup.number()
    .typeError('Please enter a valid number')
    .integer('Please enter a valid integer')
    .required('Please enter the target'),

  candidates_registered: Yup.number()
    .typeError('Please enter a valid number')
    .integer('Please enter a valid integer')
    .required('Please enter the target'),
});


export const newTargetValidationSchema = Yup.object({
  rows: Yup.array().of(
    Yup.object({
      date: Yup.string().required("Date is required"), // Date is required
      values: Yup.array()
        .of(
          Yup.mixed()
            .test(
              "empty-or-positive-integer",
              "Value must be a positive integer greater than 0 or empty",
              (value) =>
                value === "" || // Allow empty strings
                value === null || // Allow null values
                value === undefined ||
                (Number.isInteger(value) && value >= 0) // Ensure it's a positive integer
            )
        )

    })
  ),
});

export const targetSchema = Yup.object({
  date: Yup.string().nullable().required('Date is required'),
  candidates_reached: Yup.string().required('Candidates reached is required'),
});


export const resetPasswordSchema = Yup.object({
  password: Yup.string().min(8).required("Required"),
  password_again: Yup.string().oneOf([Yup.ref('password'), null], "Passwords must match").required("Required"),
});


export const setDataValidationSchema = Yup.object({
  representative_name: Yup.string().trim()
    .matches(/^[A-Za-z.\s]+$/, 'Name can only contain letters and spaces')
    .min(3, 'Name must be at least 3 characters long')
    .required("Required"),

  representative_email: Yup.string().trim()
    .matches(
      /^[^\s@]+@[^\s@]+\.[a-zA-Z]+(?:\.[a-zA-Z]+)*$/,
      'Email must be a valid email address'
    )
    .required('Required'),

  representative_phone: internationalPhoneYup().notRequired(),

  representative_designation: Yup.string().trim()
    .matches(/^[A-Za-z\s]+$/, 'Only contain letters and spaces'),


  // entity_type: Yup.string()
  //   .oneOf(['Company', 'Freelancer'], 'Please select a valid option')
  //   .required('This field is required'),
    // .transform(value => (typeof value === 'string' ? value.trim() : value))
    // .test('required', 'required', value => value !== undefined && value !== null && value !== '')
    // .test('no-empty-after-trim', 'Invalid input', value => value && value.trim() !== ''),

  entity_type: Yup.string().trim().required("Required"),


  // entity_type: Yup.string()
  //   .transform(value => value?.trim())
  //   .required('required')
  //   .test('no-empty-after-trim', 'Invalid input', value => value && value.trim() !== ''),

  company_name: Yup.string().when('entity_type', {
    is: 'Company',
    then: schema =>
      schema
        .transform(value => value?.trim())
        .matches(/^[A-Za-z.\s]+$/, 'Name can only contain letters and spaces')
        .min(3, 'Name must be at least 3 characters long')
        .required('Required'),
        // .test('no-empty-after-trim', 'Invalid input', value => value && value.trim() !== ''),
    otherwise: schema => schema.notRequired(),
  }),

  industry: Yup.string().trim()
    .matches(/^[A-Za-z\s]+$/, 'Only contain letters and spaces'),
    // .test('no-empty-after-trim', 'Invalid input', value => value && value.trim() !== ''),

  company_email: Yup.string().trim()
    .matches(
      /^[^\s@]+@[^\s@]+\.[a-zA-Z]+(?:\.[a-zA-Z]+)*$/,
      'Email must be a valid email address'
    ),

  company_phone: internationalPhoneYup().notRequired(),


  city: Yup.string().trim()
    .matches(/^[A-Za-z\s]+$/, 'Only contain letters and spaces')
    .required("Required"),

  country: Yup.string().trim()
    .matches(/^[A-Za-z\s]+$/, 'Only contain letters and spaces')
    .required("Required"),

  website: Yup.string().trim()
    .matches(
      /^(https?:\/\/)?(www\.)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/,
      'Invalid URL'
    )
    .test(
      'custom-url-check',
      'Invalid URL',
      function (value) {
        const { path, createError } = this;
        if (!value) return true;

        const domainPattern = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

        let domainPart = value;
        domainPart = domainPart.replace(/^https?:\/\//, '');
        domainPart = domainPart.split(/[/?#]/)[0];

        if (domainPart.startsWith('www.')) {
          const afterWWW = domainPart.slice(4);
          if (!domainPattern.test(afterWWW)) {
            return createError({ path, message: 'Invalid URL' });
          }
        }

        return true;
      }
    ),


  linkedin: Yup.string().trim()
    .matches(
      /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company|school|groups|events|showcase)\/[a-zA-Z0-9-_%]+\/?$/,
      'Invalid LinkedIn URL'
    ),
    // .test('no-empty-after-trim', 'Invalid input', value => value && value.trim() !== ''),

  status: Yup.string().trim().required('Required'),
    // .test('no-empty-after-trim', 'Invalid input', value => value && value.trim() !== ''),
  
  acquired_through: Yup.string().trim().required('Data Acquired Through is required'),

  acquired_through_other: Yup.string().when('acquired_through', {
    is: 'Other',
    then: schema =>
      schema
        .transform(value => value?.trim())
        .matches(/^[A-Za-z\s]+$/, 'Only contain letters and spaces')
        .required('Required'),
        // .test('no-empty-after-trim', 'Invalid input', value => value && value.trim() !== ''),
    otherwise: schema => schema.notRequired(),
  }),

  data_entry_date: Yup.date().nullable(),
    // .required('Required')
    // .min(new Date(new Date().setHours(0, 0, 0, 0)), 'Date cannot be in the past'),

  followup_date: Yup.date().nullable().required('Required')
    .min(new Date(new Date().setHours(0, 0, 0, 0)), 'Set current or future date'),

  next_followup_date: Yup.date().nullable()
    .min(new Date(new Date().setHours(0, 0, 0, 0)), 'Date cannot be in the past')
    .test(
      'is-after-followup-date',
      'next follow-up date must be after follow-up date',
      function (value) {
        const { followup_date } = this.parent;
        if (!value || !followup_date) return true; // Don't fail if either is empty
        return new Date(value) > new Date(followup_date); // Must be greater
      }
    ),    

  remarks: Yup.string().trim().required('Required'),
    // .matches(/^[A-Za-z\s]+$/, "Only contain letters and spaces")
    // .test('no-empty-after-trim', 'Invalid input', value => value && value.trim() !== ''),  
});



export const leadJobSchema = Yup.object().shape({
  

  number_of_vacancies: Yup.number()
    .typeError('No. of vacancies must be a number')
    .required('Required')
    .positive('Must be a positive number')
    .integer('Must be an integer'),

  job_type: Yup.string().required('Required'),
  employment_type: Yup.string().required('Required'),
  department: Yup.string().nullable(),

  location_country: Yup.string().nullable(),
  location_city: Yup.string().required(),

  job_description: Yup.string().required('Required'),
  job_responsibilities: Yup.string().nullable(),
  job_requirements: Yup.string().nullable(),
  key_skills_required: Yup.string().nullable(),

  years_of_experience: Yup
    .string()
    .required("Please enter experience")
    .matches(
      /^\d+(-\d+)?$/,
      "Experience must be a number or range (e.g. 2 or 2-4)"
    )
    .test("valid-range", "Start of range should be less than or equal to end", (value) => {
      if (!value) return true;
      if (!value.includes("-")) return true;

      const [start, end] = value.split("-").map(Number);
      return start <= end;
    })
    .test("no-negative", "Experience cannot be negative", (value) => {
      if (!value) return true;
      if (!value.includes("-")) {
        return Number(value) >= 0;
      }
      const [start, end] = value.split("-").map(Number);
      return start >= 0 && end >= 0;
    }),

  educational_qualification: Yup.string().required('Required'),
  other_benefits: Yup.string(),
  languages_required: Yup.mixed().nullable(),
  gender_preference: Yup.string().required('Required'),
  nationality_preference: Yup.string().nullable(),
  notes: Yup.string().nullable(),

  currency: Yup.string().required('Required'),
  min_salary: Yup.string()
    .required('Required')
    .test('min-less-than-max', 'Minimum salary must be less than maximum salary', function (value) {
      const { max_salary } = this.parent;
      const min = parseInt(value?.replace(/,/g, ''), 10);
      const max = parseInt(max_salary?.replace(/,/g, ''), 10);
      if (!min || !max) return true; // Skip validation if one is empty
      return min < max;
    }),
  max_salary: Yup.string()
    .required('Required')
    .test('max-greater-than-min', 'Maximum salary must be greater than or equal to minimum salary', function (value) {
      const { min_salary } = this.parent;
      const min = parseInt(min_salary?.replace(/,/g, ''), 10);
      const max = parseInt(value?.replace(/,/g, ''), 10);
      if (!min || !max) return true;
      return max >= min;
    }),
  
  payment_term: Yup.string().required('Required'),
  
  department: Yup.string().nullable(),
  
  // New fields validation
  working_hours: Yup.string()
    .nullable()
    .matches(/^\d*$/, 'Please enter a valid number'),
  
  working_days: Yup.string().nullable(),
  timezone: Yup.string().nullable(),
  cv_submission_deadline: Yup.string().nullable(),
  expected_joining_date: Yup.string().nullable(),
  
});

export const addLeadJobSchema = Yup.object().shape({
  min_experience: Yup.number().typeError('Min experience must be a number').required('Min experience is required').min(0, 'Min experience must be at least 0'),
  max_experience: Yup.number().typeError('Max experience must be a number').required('Max experience is required').min(0, 'Max experience must be at least 0'),
 

  number_of_vacancies: Yup.number()
    .typeError('No. of vacancies must be a number')
    .required('Required')
    .positive('Must be a positive number')
    .integer('Must be an integer'),

  job_title: Yup.string()
    .typeError('Must be a string')
    .required('Required'),
  job_type: Yup.string().required('Required'),
  employment_type: Yup.string().required('Required'),
  department: Yup.string().nullable(),

  location_country: Yup.string().nullable(),
  location_city: Yup.string().required('Required'),
  job_description: Yup.string().required('Required'),

  key_skills_required: Yup.string().nullable(),
  
  // years_of_experience: Yup
  //   .string()
  //   .required("Required")
  //   .matches(
  //     /^\d+(-\d+)?$/,
  //     "Experience must be a number or range (e.g. 2 or 2-4)"
  //   )
  //   .test("valid-range", "Start of range should be less than or equal to end", (value) => {
  //     if (!value) return true;
  //     if (!value.includes("-")) return true;

  //     const [start, end] = value.split("-").map(Number);
  //     return start <= end;
  //   })
  //   .test("no-negative", "Experience cannot be negative", (value) => {
  //     if (!value) return true;
  //     if (!value.includes("-")) {
  //       return Number(value) >= 0;
  //     }
  //     const [start, end] = value.split("-").map(Number);
  //     return start >= 0 && end >= 0;
  //   }),

  educational_qualification: Yup.string().required('Required'),
  other_benefits: Yup.string().nullable(),
  languages_required: Yup.mixed().nullable(),
  gender_preference: Yup.string().required('Required'),
  nationality_preference: Yup.string().nullable(),
  notes: Yup.string().nullable(),

  currency: Yup.string().required('Required'),
  min_salary: Yup.string()
    .required('Required')
    .test('min-less-than-max', 'Minimum salary must be less than maximum salary', function (value) {
      const { max_salary } = this.parent;
      const min = parseInt(value?.replace(/,/g, ''), 10);
      const max = parseInt(max_salary?.replace(/,/g, ''), 10);
      if (!min || !max) return true; // Skip validation if one is empty
      return min < max;
    }),
  max_salary: Yup.string()
    .required('Required')
    .test('max-greater-than-min', 'Maximum salary must be greater than or equal to minimum salary', function (value) {
      const { min_salary } = this.parent;
      const min = parseInt(min_salary?.replace(/,/g, ''), 10);
      const max = parseInt(value?.replace(/,/g, ''), 10);
      if (!min || !max) return true;
      return max >= min;
    }),
  
  payment_term: Yup.string().required('Required'),
  
  department: Yup.string().nullable(),
  
  // New fields validation
  working_hours: Yup.number()
  .nullable()
  .typeError('Please enter a valid number')
  .positive('Working hours must be greater than 0'),

  
  working_days: Yup.string().nullable(),
  timezone: Yup.string().nullable(),
  cv_submission_deadline: Yup.string().nullable(),
  expected_joining_date: Yup.string().nullable(),
  
});


export const newLeadSchema = Yup.object({
 contact_person_name: Yup.string()
    .trim()
  
    .required('Your Name is Required'),

  company_name: Yup.string()
    .trim()
    
    .required('Company Name is Required'),

  contact_person_designation: Yup.string()
    .trim()
    .matches(/^[a-zA-Z\s]+$/, 'Designation must contain only letters')
    .required('Designation is Required'),
  email: Yup.string().trim()
  .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/, 'Invalid email format')
  
    .required('Email is Required'),
    
  phone_number: internationalPhoneYup().required('Phone number is required'),

  industry: Yup.string()
    .trim()
    .matches(/^[A-Za-z.\s]+$/, 'Industry must contain only letters')
    .min(3, 'Industry must be at least 3 characters long')
    .notRequired(),

  // jobs validation removed
});


// --- International Phone Number Validation ---
// Accepts E.164-style numbers: optional + followed by 7–15 digits
// Also accepts numbers starting with 0 (local format), allowing spaces/dashes stripped
export function internationalPhoneYup() {
  return Yup.string()
    .transform((value) => {
      if (!value) return value;
      // Strip all non-digit characters except leading +
      const s = String(value).trim();
      return s.startsWith('+') ? '+' + s.slice(1).replace(/\D/g, '') : s.replace(/\D/g, '');
    })
    .test('international-phone', 'Invalid phone number.', function (value) {
      if (!value) return true;
      // Allow optional + prefix followed by 7–15 digits
      return /^\+?\d{7,15}$/.test(value);
    });
}






// Common job form validation schema - used by both add-new-lead-job and add-new-job-headhunting


