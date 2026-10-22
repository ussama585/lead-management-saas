import * as Yup from 'yup';

export const followUpModalSchema = Yup.object()
  .shape({
    addFollowUp: Yup.boolean(),
    remarks: Yup.string().trim().required('Remarks are required'),
    followUpDate: Yup.date().nullable().when('addFollowUp', {
      is: false,
      then: (schema) => schema.required('Next follow-up is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
  });

