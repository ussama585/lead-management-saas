import * as Yup from 'yup';
import { salesDataValidationSchema } from '../../shared/schemas/sales-data.js';

const id = () => Yup.number().transform((value, raw) => raw === '' || raw == null ? null : value)
  .nullable().typeError('Enter a valid ID').integer('Use a whole number').positive('Use a positive ID');

export const dataEntryCreateSchema = (superAdmin = false) => salesDataValidationSchema.shape({
  company: superAdmin ? id().required('Company is required') : Yup.mixed().nullable().notRequired(),
  status: Yup.string().trim().required('Status is required'),
});
