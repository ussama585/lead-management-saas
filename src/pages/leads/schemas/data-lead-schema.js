import * as Yup from 'yup';

export const dataLeadEditFields = ['contact_person_name', 'company_name', 'phone_number', 'contact_person_designation', 'email', 'contract_currency', 'industry'];

export function dataLeadEditSchema() {
  return dataLeadSchema(false).pick(dataLeadEditFields);
}

export function dataLeadSchema(superAdmin = false) {
  return Yup.object({
    company: superAdmin ? Yup.number().typeError('Choose a company.').integer().positive().required('Choose a company.') : Yup.mixed().nullable(),
    industry: Yup.string().trim().required('Enter the industry.'),
    company_name: Yup.string().trim().required('Enter the company name.'),
    contact_person_name: Yup.string().trim().required('Enter the contact name.'),
    contact_person_designation: Yup.string().trim().required('Enter the designation.'),
    email: Yup.string().trim().email('Enter a valid email address.').required('Enter the email address.'),
    phone_number: Yup.string().trim().required('Enter the phone number.'),
    project_size: Yup.string().trim(),
    assigned_to: Yup.number().transform((value, original) => original === '' || original == null ? null : value).nullable().integer('Use a valid user ID.').positive('Use a valid user ID.'),
    contract_currency: Yup.string().trim(),
    contract_price: Yup.number().transform((value, original) => original === '' || original == null ? null : value).nullable().min(0, 'Price cannot be negative.'),
  });
}
