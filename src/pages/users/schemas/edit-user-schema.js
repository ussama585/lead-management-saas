import * as Yup from 'yup';
import { internationalPhoneYup } from '../../shared/schemas/schema.js';

export const editUserSchema = Yup.object({
  name: Yup.string().trim().required('Name is required').min(3, 'Name must be at least 3 characters long'),
  email: Yup.string().trim().required('Email is required').email('Enter a valid email address'),
  phone: internationalPhoneYup().required('Phone number is required'),
  password: Yup.string().transform(value => value === '' ? undefined : value).min(6, 'Password must be at least 6 characters long'),
  manager: Yup.number().transform((value, original) => original === '' || original == null ? null : value).nullable().typeError('Select a valid manager').integer('Select a valid manager').positive('Select a valid manager'),
});
