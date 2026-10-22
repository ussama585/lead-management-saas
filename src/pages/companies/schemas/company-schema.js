import * as Yup from 'yup';

export const companySchema = Yup.object({
  name: Yup.string().trim().required('Enter the company name.'),
  email: Yup.string().trim().email('Enter a valid email address.').required('Enter an email address.'),
  phone: Yup.string().trim(),
  website: Yup.string().trim().test('website', 'Enter a full URL, such as https://example.com.', value => {
    if (!value) return true;
    try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
  }),
  address: Yup.string().trim(),
  country: Yup.string().trim(),
  city: Yup.string().trim(),
  is_active: Yup.boolean().required(),
});
