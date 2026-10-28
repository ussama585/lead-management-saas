import * as Yup from 'yup';

export const dataLeadEditFields = ['contact_person_name', 'company_name', 'phone_number', 'contact_person_designation', 'email'];

export function dataLeadEditSchema() {
  return dataLeadSchema(false).pick(dataLeadEditFields);
}

export function dataLeadSchema(superAdmin = false) {
  return Yup.object({
    company: superAdmin ? Yup.number().typeError('Choose a company.').integer().positive().required('Choose a company.') : Yup.mixed().nullable(),
    industry: Yup.string().trim().required('Enter the industry.'),
    company_name: Yup.string().trim().required('Enter the company name.'),
    contact_person_name: Yup.string().trim().required('Enter the contact name.'),
    contact_person_designation: Yup.string().trim(),
    email: Yup.string().trim().email('Enter a valid email address.'),
    phone_number: Yup.string().trim().required('Enter the phone number.'),
    status: Yup.string().trim().required('Enter or select a status.'),
    remarks: Yup.string(),
    project_size: Yup.string().trim(),
    assigned_to: Yup.number().transform((value, original) => original === '' || original == null ? null : value).nullable().integer('Use a valid user ID.').positive('Use a valid user ID.'),
    contract_currency: Yup.string().trim(),
    contract_price: Yup.number().transform((value, original) => original === '' || original == null ? null : value).nullable().min(0, 'Price cannot be negative.'),
    is_accepting_response: Yup.boolean(),
    followup_date: Yup.string().nullable().test('date', 'Use a valid date.', value => !value || /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value),
  });
}
