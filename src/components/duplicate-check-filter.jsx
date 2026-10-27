import { Select } from './ui/app-select.jsx';
import React, { useMemo } from 'react';


/**
 * Duplicate Check Filter
 *
 * - By default: All
 * - Options: Duplicate / Not Duplicate
 *
 * Value semantics:
 * - "all"          => no filter (omit param)
 * - "duplicate"    => is_duplicate=true
 * - "not_duplicate"=> is_duplicate=false
 */
export default function DuplicateCheckFilter({
  value = 'all',
  onChange,
  style,
  disabled = false,
  label = 'Duplicate:',
  minWidth = 200,
}) {
  const normalizedValue = value || 'all';

  const options = useMemo(
    () => [
      { label: 'All', value: 'all' },
      { label: 'Duplicate', value: 'duplicate' },
      { label: 'Not Duplicate', value: 'not_duplicate' },
    ],
    [],
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontWeight: '500', fontSize: '14px' }}>{label}</span>
      <Select
        value={normalizedValue}
        onChange={(next) => onChange?.(next)}
        style={{ width: 'fit-content', minWidth, ...style }}
        disabled={disabled}
        popupMatchSelectWidth={false}
        options={options}
      />
    </div>
  );
}

