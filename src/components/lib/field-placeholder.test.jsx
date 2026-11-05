import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { fieldPlaceholder } from './field-placeholder.js';
import { Input } from '../ui/input.jsx';
import { Textarea } from '../ui/textarea.jsx';
import { Select } from '../ui/app-select.jsx';

it('keeps existing placeholders and derives missing ones from field names', () => {
  expect(fieldPlaceholder({ placeholder: 'name@example.com', name: 'email' })).toBe('name@example.com');
  expect(fieldPlaceholder({ name: 'contact_person_name' })).toBe('Enter contact person name');
  expect(fieldPlaceholder({ name: 'userType' }, 'Select')).toBe('Select user type');
  expect(fieldPlaceholder({ placeholder: '' }, 'Select')).toBe('Select an option');
});
it('renders fallback placeholders on shared fields', () => {
  expect(renderToStaticMarkup(<Input name="email" />)).toContain('placeholder="Enter email"');
  expect(renderToStaticMarkup(<Textarea name="remarks" />)).toContain('placeholder="Enter remarks"');
  expect(renderToStaticMarkup(<Select name="company" />)).toContain('Select company');
});
it.each([
  ['Select industry', ''],
  ['Select project size', ''],
  ['Select industry', []],
])('shows %s for an empty selection', (placeholder, value) => {
  const html = renderToStaticMarkup(<Select value={value} mode={Array.isArray(value) ? 'multiple' : undefined}
    placeholder={placeholder} options={[{ value: 'Technology', label: 'Technology' }]} />);
  expect(html).toContain(`>${placeholder}</span>`);
});
it('does not add placeholders to file uploads or checkboxes', () => {
  expect(renderToStaticMarkup(<Input type="file" />)).not.toContain('placeholder=');
  expect(renderToStaticMarkup(<Input type="checkbox" />)).not.toContain('placeholder=');
});
