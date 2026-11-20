import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Button } from './app-controls.jsx';

it('keeps the same button layout when disabled or loading', () => {
  const normal = renderToStaticMarkup(<Button>Delete</Button>);
  const disabled = renderToStaticMarkup(<Button disabled>Delete</Button>);
  const loading = renderToStaticMarkup(<Button loading>Delete</Button>);
  for (const html of [normal, disabled, loading]) {
    expect(html).toContain('button-flight');
    expect(html).toContain('button-flight-icon');
    expect(html).toContain('button-flight-label');
    expect(html).toContain('Delete');
  }
  expect(disabled).toContain('disabled');
  expect(loading).toContain('aria-busy="true"');
  expect(loading).toContain('animate-spin');
});
