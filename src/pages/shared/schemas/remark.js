import * as Yup from 'yup';

export const ShowRemarkSchema = Yup.object().shape({
  pricingType: Yup.string()
  .required('Pricing type is required'),
  contractCurrency: Yup.string().required('Contract currency is required'),
  subTotalAmount: Yup.string().required('Sub-total contract amount is required'),
  discountAmount: Yup.string().notRequired(),
  discountPercentage: Yup.string().notRequired(),
  totalContractAmount: Yup.string().required('Total contract amount is required'),
  vacancies: Yup.string().required('Total vacancies are required'),
  jobCount: Yup.string().required('Job count is required'),
});
