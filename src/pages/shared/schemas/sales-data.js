import * as Yup from 'yup';
import { internationalPhoneYup } from './schema.js';

export const salesDataValidationSchema = Yup.object().shape({
  representative_name: Yup.string().transform(value => (value ? String(value).trim() : '')),
  designation: Yup.string().transform(value => (value ? String(value).trim() : '')),
  company_name: Yup.string().transform(value => (value ? String(value).trim() : '')).required('Company Name is required'),
  industry_sector: Yup.string().transform(value => (value ? String(value).trim() : '')),
  phone: internationalPhoneYup()
    .transform((value, originalValue) => {
      if (typeof originalValue === 'number') {
        return String(originalValue.toFixed(0));
      }
      if (typeof originalValue === 'string' && originalValue.includes('e')) {
        const parsed = Number(originalValue);
        if (!isNaN(parsed)) {
          return String(parsed.toFixed(0));
        }
      }
      return value;
    })
    .test('phone-or-email', 'Either phone or email is required', function (value) {
      const { email } = this.parent;
      const hasPhone = value && value.trim().length > 0;
      const hasEmail = email && email.trim().length > 0;
      return hasPhone || hasEmail;
    }),

  email: Yup.string()
    .transform(value => (value ? String(value).trim() : ''))
    .matches(
      /^[^\s@]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/,
      'Email must be a valid email address'
    )
    .test('email-or-phone', 'Either phone or email is required', function(value) {
      const { phone } = this.parent;
      const hasPhone = phone && phone.trim().length > 0;
      const hasEmail = value && value.trim().length > 0;
      return hasPhone || hasEmail;
    }),
  city: Yup.string().transform(value => (value ? String(value).trim() : '')).notRequired(),
  country: Yup.string().transform(value => (value ? String(value).trim() : '')).notRequired(),
  company_address: Yup.string().transform(value => (value ? String(value).trim() : '')),
 company_website: Yup.string()
  .transform(value => (value ? String(value).trim() : ''))
  .test(
    'is-valid-url',
    'invalid url',
    value => {
      // Allow empty value (optional field)
      if (!value) return true;
      return /^https?:\/\//.test(value);
    }
  ),
 company_social_link: Yup.string()
  .transform(value => (value ? String(value).trim() : ''))
  .test(
    'is-valid-url',
    'invalid url',
    value => {
      // Allow empty value (optional field)
      if (!value) return true;
      return /^https?:\/\//.test(value);
    }
  ),
  acquired_through: Yup.string().transform(value => (value ? String(value).trim() : '')).notRequired(),
});