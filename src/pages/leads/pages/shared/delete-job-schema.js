import * as Yup from 'yup';

export const deleteJobSchema = Yup.object({
  remarks: Yup.string().trim().required('Please add remarks before deleting this job.'),
});
