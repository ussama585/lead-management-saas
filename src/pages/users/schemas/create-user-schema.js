import * as Yup from 'yup';
import { createUserValidationSchema } from '../../shared/schemas/schema.js';

const optionalId = () => Yup.number().transform((value, original) => original === '' || original == null ? null : value)
  .nullable().typeError('Select a valid option').integer().positive();

export function createUserSchema(superAdmin) {
  return createUserValidationSchema.shape({
    company_id: superAdmin ? optionalId().required('Select a company') : optionalId(),
    manager: optionalId(),
    user_type: Yup.string().oneOf(['sales_manager', 'sales_executive', 'data_entry_executive']).required('Select a user type'),
  });
}
