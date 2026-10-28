import React from 'react';
import { Input } from './ui/input.jsx';

export default function ManualLocationField({ name, value, onChange }) {
  return <Input name={name} value={value ?? ''} placeholder="Enter city"
    onChange={event => onChange(name, event.target.value)} />;
}
