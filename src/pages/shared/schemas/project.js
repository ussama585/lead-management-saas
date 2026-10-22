import * as Yup from 'yup';

// Project Schema
export const projectHeadhuntingValidationSchema = Yup.object({
  client: Yup.string().required('Client is required'), // Mandatory, Foreign Key
  proposal: Yup.mixed()
    .required('Proposal PDF is required')
    .test('fileType', 'Only PDF files are allowed', (value) => {
      if (!value) return false;
      if (typeof value === 'string') return value.endsWith('.pdf');
      if (value instanceof File) return value.type === 'application/pdf';
      return false;
    }),
  contract_currency: Yup.string().notRequired(), // Optional, Text
  // Allow decimal contract price; validation that it is positive is enough
  contract_price: Yup.number()
    .typeError('Must be a valid number')
    .positive('Must be a positive number')
    .notRequired(),
  // Discount fields are optional and may be empty
  discount_amount: Yup.number().nullable().notRequired(),
  discount_percentage: Yup.number().nullable().notRequired(),
  // created_at: Yup.date().notRequired(), // Removed as per requirements
});

// Edit Project Schema (without client field)
export const editProjectHeadhuntingValidationSchema = Yup.object({
  project_name: Yup.string().required('Project name is required'), // Mandatory, Text
  project_completion_deadline: Yup.date()
    .nullable()
    .required('Project completion deadline is required'),
  proposal: Yup.mixed()
    .nullable()
    .test('fileType', 'Only PDF files are allowed', value => {
      if (!value) return true; // Allow null/undefined values
      if (typeof value === 'string') return value.endsWith('.pdf');
      if (value instanceof File) return value.type === 'application/pdf';
      return false;
    }), // Optional, File (pdf)
  contract_currency: Yup.string().notRequired(), // Optional, Text
  // Allow comma-formatted input without throwing a type error; parsing handled in component
  contract_price: Yup.string().notRequired(),
  // Discount fields are optional and may be empty
  discount_amount: Yup.string().nullable().notRequired(),
  discount_percentage: Yup.string().nullable().notRequired(),
});
