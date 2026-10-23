import * as Yup from 'yup';

export const followUpDurationSchema = Yup.object({
  duration_minutes: Yup.number().typeError('Enter a valid number of minutes')
    .nullable().required('Enter a duration in minutes')
    .integer('Use whole minutes').min(1, 'Use between 1 and 1440 minutes')
    .max(1440, 'Use between 1 and 1440 minutes'),
});
