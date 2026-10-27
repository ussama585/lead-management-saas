import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { Button, Input, Spin } from './app-controls.jsx';
import { selectOptions } from './app-select.jsx';

describe('shadcn migration controls', () => {
  it('preserves explicit submit buttons and disables pending actions', () => {
    const markup = renderToStaticMarkup(<Button type="primary" htmlType="submit" loading>Save</Button>);
    expect(markup).toContain('type="submit"');
    expect(markup).toContain('disabled');
    expect(markup).toContain('aria-busy="true"');
  });
  it('preserves link navigation', () => {
    expect(renderToStaticMarkup(<Button href="/super-admin/leads">Leads</Button>)).toContain('href="/super-admin/leads"');
  });
  it('renders input values, errors and password types', () => {
    const markup = renderToStaticMarkup(<Input name="email" value="test@example.com" status="error" readOnly />);
    expect(markup).toContain('value="test@example.com"');
    expect(markup).toContain('aria-invalid="true"');
    expect(renderToStaticMarkup(<Input.Password value="secret" readOnly />)).toContain('type="password"');
  });
  it('renders multi-line values', () => {
    expect(renderToStaticMarkup(<Input.TextArea value="Remarks" readOnly rows={5} />)).toContain('rows="5"');
  });
  it('keeps content available when loading finishes', () => {
    const markup = renderToStaticMarkup(<Spin spinning={false}>Ready</Spin>);
    expect(markup).toContain('Ready');
    expect(markup).not.toContain('role="status"');
  });
  it('preserves numeric option IDs and custom labels', () => {
    const records = selectOptions(null, <option value={21} label="Manager">Manager detail</option>);
    expect(records).toMatchObject([{ value: 21, label: 'Manager' }]);
    expect(selectOptions([{ label: 'Team', options: [{ value: 6, label: 'Sales' }] }])).toEqual([{ value: 6, label: 'Sales' }]);
  });
});
