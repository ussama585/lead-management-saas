function errorText(value) {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(errorText).filter(Boolean).join(' ');
  if (value && typeof value === 'object') return Object.values(value).map(errorText).filter(Boolean).join(' ');
  return '';
}

export function salesDataError(error, fallback = 'Could not save sales data.') {
  const body = error?.response?.data ?? (error instanceof Error ? null : error);
  return errorText(body?.errors) || errorText(body?.message) || errorText(body?.detail)
    || errorText(body?.error) || errorText(body) || error?.message || fallback;
}
