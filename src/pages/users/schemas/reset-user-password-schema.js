import * as Yup from 'yup';

export const resetUserPasswordSchema = Yup.object({
  new_password: Yup.string().min(8, 'Use at least 8 characters.').required('Enter a new password.'),
  confirm_password: Yup.string().oneOf([Yup.ref('new_password')], 'Passwords must match.').required('Confirm your new password.'),
});

export const resetSuperAdminPasswordSchema = resetUserPasswordSchema.shape({
  old_password: Yup.string().required('Enter the current password.'),
});
