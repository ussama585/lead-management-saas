export function fieldPlaceholder(props, action = 'Enter') {
  if (typeof props.placeholder === 'string' && props.placeholder.trim()) return props.placeholder;
  if (props.placeholder != null && typeof props.placeholder !== 'string') return props.placeholder;
  const label = props['aria-label'] || props.label || props.name;
  const text = typeof label === 'string' ? label.replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_.\[\]-]+/g, ' ').replace(/\b\d+\b/g, '').replace(/\s+/g, ' ').trim().toLowerCase() : '';
  return text ? `${action} ${text}` : action === 'Select' ? 'Select an option' : 'Enter a value';
}
