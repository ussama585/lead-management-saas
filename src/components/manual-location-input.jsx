import React, { useEffect, useState } from 'react';
import { Input } from './ui/app-controls.jsx';

// Retain the string-valued callback used by the former location selects.
export default function ManualLocationInput({ value, onChange, onBlur, commitOnBlur = false,
  options, showSearch, optionFilterProp, popupMatchSelectWidth, allowClear, loading,
  filterOption, mode, ...props }) {
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => { setDraft(value ?? ''); }, [value]);
  return <Input {...props} type="text" value={commitOnBlur ? draft : value ?? ''}
    placeholder={typeof props.placeholder === 'string' ? props.placeholder.replace(/^Select(?: or type)?/i, 'Enter') : props.placeholder}
    onChange={event => { setDraft(event.target.value); if (!commitOnBlur) onChange?.(event.target.value); }}
    onBlur={event => {
      if (commitOnBlur && draft !== (value ?? '')) onChange?.(draft);
      onBlur?.(event);
    }} onKeyDown={event => {
      props.onKeyDown?.(event);
      if (commitOnBlur && event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); }
    }} />;
}

export function ManualLocationListInput({ value = [], onChange, ...props }) {
  const [draft, setDraft] = useState(value.join(', '));
  useEffect(() => { setDraft(value.join(', ')); }, [value]);
  const commit = () => onChange([...new Set(draft.split(',').map(item => item.trim()).filter(Boolean))]);
  return <Input {...props} value={draft} type="text" onChange={event => {
    setDraft(event.target.value);
    if (!event.target.value) onChange([]);
  }} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); commit(); } }} />;
}
