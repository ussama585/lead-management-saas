export const selectedManagerId = manager => manager && typeof manager === 'object' ? manager.id ?? '' : manager ?? '';

export function managerFromUser(user) {
  if (user && Object.hasOwn(user, 'manager_id')) {
    return user.manager_id == null ? null : { id: user.manager_id, name: user.manager_name || '' };
  }
  return user?.manager ?? null;
}

export function managerIdFromOptions(managers, user) {
  const selected = managerFromUser(user);
  const id = selectedManagerId(selected);
  if (!Array.isArray(managers)) return '';
  const byId = managers.find(manager => manager.user_id != null && String(manager.user_id) === String(id));
  return byId?.user_id ?? '';
}

export function withSelectedManager(managers, selected) {
  const options = Array.isArray(managers) ? [...managers] : [];
  if (!selected || typeof selected !== 'object' || selected.id == null) return options;
  const index = options.findIndex(manager => String(manager.id) === String(selected.id));
  if (index < 0) options.unshift(selected);
  else options[index] = { ...options[index], ...selected, name: selected.name || options[index].name };
  return options;
}
