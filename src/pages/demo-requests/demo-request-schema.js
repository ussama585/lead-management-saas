import * as Yup from 'yup';

export const demoRequestSchema = Yup.object({
  name: Yup.string().trim().required('Name is required'),
  email: Yup.string().trim().email('Enter a valid email address').required('Email is required'),
  phone: Yup.string().trim().required('Phone is required'),
  agency_name: Yup.string().trim(),
  team_size: Yup.string().trim(),
  message: Yup.string(),
  status: Yup.string().trim().required('Status is required'),
});
