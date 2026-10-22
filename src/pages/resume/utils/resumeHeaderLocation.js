const safeArray = (v) => (Array.isArray(v) ? v : []);

function cityLocationLabel(item) {
  if (item == null) return '';
  if (typeof item === 'string') return item.trim();
  if (typeof item === 'object') {
    const byKey = item.key ?? item.city_key;
    if (byKey != null && String(byKey).trim() !== '') return String(byKey).trim();
    return String(item.title ?? item.name ?? '').trim();
  }
  return '';
}

function countryLocationLabel(item) {
  if (item == null) return '';
  if (typeof item === 'string') return item.trim();
  if (typeof item === 'object') {
    const byKey = item.key ?? item.country_key;
    if (byKey != null && String(byKey).trim() !== '') return String(byKey).trim();
    return String(item.title ?? item.name ?? '').trim();
  }
  return '';
}

/** Single street/address line only (not cities/countries arrays). */
export function buildResumeHeaderAddressOnly(details) {
  return String(details?.address ?? '').trim();
}

/** Label arrays for header meta rows (prefer key / city_key / country_key, then title/name). */
export function getCitiesAndCountriesForHeader(details) {
  const cities = safeArray(details?.cities).map(cityLocationLabel).filter(Boolean);
  const countries = safeArray(details?.countries).map(countryLocationLabel).filter(Boolean);
  return { cities, countries };
}
