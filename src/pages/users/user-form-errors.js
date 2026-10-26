const fieldAliases = { manager_id: 'manager', company: 'company_id', confirm_password: 'confirmPassword' };
const fields = ['name', 'email', 'phone', 'password', 'confirmPassword', 'user_type', 'company_id', 'manager'];
const errorMessages = value => {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(errorMessages).filter(Boolean).join(' ');
  if (value && typeof value === 'object') return Object.values(value).map(errorMessages).filter(Boolean).join(' ');
  return '';
};
export function userFieldErrors(error) {
  const body = error?.response?.data;
  const details = body?.errors ?? body;
  if (!details || typeof details !== 'object' || Array.isArray(details)) return {};
  return Object.fromEntries(Object.entries(details).map(([key, value]) => [fieldAliases[key] || key, errorMessages(value)])
    .filter(([key, value]) => fields.includes(key) && typeof value === 'string'));
}
export function userFormError(error) {
  const body = error?.response?.data;
  if (typeof body === 'string' && !/<[a-z][\s\S]*>/i.test(body) && body.trim()) return body;
  const details = errorMessages(body?.errors);
  if (details) return details;
  const fieldMessages = Object.values(userFieldErrors(error));
  if (fieldMessages.length) return fieldMessages.join(' ');
  return errorMessages(body?.non_field_errors) || errorMessages(body?.detail) || errorMessages(body?.message) || error?.message || 'Could not save user. Please try again.';
}
export function assertUserSuccess(data) {
  if (data?.success === false || data?.status === false) {
    const error = new Error(userFormError({ response: { data } }));
    error.response = { data };
    throw error;
  }
  return data;
}
export function applyUserErrors(error, helpers) {
  const errors = userFieldErrors(error);
  helpers.setErrors(errors);
  helpers.setTouched(Object.fromEntries(Object.keys(errors).map(key => [key, true])), false);
  helpers.setStatus(userFormError(error));
}
