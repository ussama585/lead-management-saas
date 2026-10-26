import * as Yup from 'yup';
import { createUserValidationSchema, internationalPhoneYup } from '../../shared/schemas/schema.js';

const optionalId = () => Yup.number().transform((value, original) => original === '' || original == null ? null : value)
  .nullable().typeError('Select a valid option').integer().positive();

export function createUserSchema(superAdmin) {
  return createUserValidationSchema.shape({
    name: Yup.string().trim().required('Name is required').min(3, 'Name must be at least 3 characters long'),
    email: Yup.string().trim().required('Email is required').email('Enter a valid email address'),
    phone: internationalPhoneYup().required('Phone number is required'),
    company_id: superAdmin ? optionalId().required('Select a company') : optionalId(),
    manager: optionalId(),
    user_type: Yup.string().oneOf(['company_admin', 'sales_manager', 'sales_executive', 'data_entry_executive']).required('Select a user type'),
  });
}
