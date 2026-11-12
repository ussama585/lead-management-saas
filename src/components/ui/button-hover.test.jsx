import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Pencil } from 'lucide-react';
import { Button } from './button.jsx';
import { Button as AppButton } from './app-controls.jsx';

it('adds an icon and keeps an action button label in the accessible content', () => {
  const html = renderToStaticMarkup(<Button>Save changes</Button>);
  expect(html).toContain('button-flight-label');
  expect(html).toContain('Save changes');
  expect(html.match(/<svg/g)).toHaveLength(1);
});
it('reuses existing icons through the application button adapter', () => {
  const html = renderToStaticMarkup(<AppButton icon={<Pencil />}>Edit lead</AppButton>);
  expect(html.match(/<svg/g)).toHaveLength(1);
  expect(html).toContain('button-flight-label');
});
it('leaves filters, dropdowns, icon buttons and loading buttons unchanged', () => {
  for (const button of [<Button aria-pressed={false}>All</Button>, <Button data-slot="select-trigger">Select</Button>,
    <Button aria-expanded={false}>Filters</Button>, <AppButton loading>Saving</AppButton>, <Button size="icon"><Pencil /></Button>]) {
    expect(renderToStaticMarkup(button)).not.toContain('button-flight-label');
  }
});
