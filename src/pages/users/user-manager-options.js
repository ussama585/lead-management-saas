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
  const byId = managers.find(manager => String(manager.id) === String(id));
  if (byId) return byId.id;
  // Older detail responses contained an account ID. Resolve it only when the
  // returned name uniquely identifies a manager in this company's simple list.
  const byName = typeof selected === 'object' && selected?.name
    ? managers.filter(manager => manager.name === selected.name) : [];
  return byName.length === 1 ? byName[0].id : '';
}

export function withSelectedManager(managers, selected) {
  const options = Array.isArray(managers) ? [...managers] : [];
  if (!selected || typeof selected !== 'object' || selected.id == null) return options;
  const index = options.findIndex(manager => String(manager.id) === String(selected.id));
  if (index < 0) options.unshift(selected);
  else options[index] = { ...options[index], ...selected, name: selected.name || options[index].name };
  return options;
}
