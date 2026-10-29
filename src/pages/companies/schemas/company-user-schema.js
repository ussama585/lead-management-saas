import * as Yup from 'yup';
import { createUserSchema } from '../../users/schemas/create-user-schema.js';
import { editUserSchema } from '../../users/schemas/edit-user-schema.js';

export const companyUserRoles = ['company_admin', 'sales_manager', 'sales_executive', 'data_entry_executive'];
export const companyUserCreateSchema = createUserSchema(true).shape({
  user_type: Yup.string().oneOf(companyUserRoles, 'Select a valid user type').required('Select a user type'),
});
export const companyUserEditSchema = editUserSchema;
export const companyUserOtpSchema = Yup.object({ otp: Yup.string().trim().required('Enter the deletion OTP') });
