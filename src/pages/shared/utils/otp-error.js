function errorText(value) {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(errorText).filter(Boolean).join(' ');
  if (value && typeof value === 'object') return Object.values(value).map(errorText).filter(Boolean).join(' ');
  return '';
}

export function otpErrorMessage(error) {
  const body = error?.response?.data;
  return errorText(body?.message) || errorText(body?.detail) || errorText(body?.errors)
    || errorText(body?.error) || errorText(body) || error?.message || '';
}
