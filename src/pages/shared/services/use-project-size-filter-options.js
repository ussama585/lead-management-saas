import { useEffect, useState } from 'react';

export function mergeProjectSizeValues(previous, configured, rows, selected) {
  return [...new Set([...configured.map(option => option.value), ...previous,
    ...rows.map(row => row.project_size), selected].filter(Boolean))];
}

// Lead results change when filters or pages change; they must not shrink the filter's choices.
export default function useProjectSizeFilterOptions(query, rows, selected) {
  const [saved, setSaved] = useState({ scope: query.scope, values: [] });
  const values = mergeProjectSizeValues(saved.scope === query.scope ? saved.values : [], query.options, rows, selected);
  const serialized = JSON.stringify(values);
  useEffect(() => {
    setSaved(previous => previous.scope === query.scope && JSON.stringify(previous.values) === serialized
      ? previous : { scope: query.scope, values: JSON.parse(serialized) });
  }, [query.scope, serialized]);
  return values.map(value => ({ value, label: value }));
}
