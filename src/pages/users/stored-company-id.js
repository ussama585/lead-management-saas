export function companyIdFromUser(user) {
  const candidates = [user?.company_id, user?.company?.id, user?.company];
  return candidates.find(value => /^[1-9]\d*$/.test(String(value ?? ''))) ?? null;
}

export function storedCompanyId(currentUser) {
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    return companyIdFromUser(storedUser) ?? companyIdFromUser(currentUser);
  } catch {
    return companyIdFromUser(currentUser);
  }
}
