import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import LeadListingFilters from './lead-listing-filters.jsx';

it('renders expanded accessible cards with API names, counts and selected filters', () => {
  const html = renderToStaticMarkup(<LeadListingFilters executives={[{ id: 8, name: 'Ahmed', user_type: 'sales_executive' }]}
    selectedExecutive={8} onExecutiveChange={vi.fn()} getExecutiveCount={() => 3}
    statusFilter="Activated" setStatusFilter={vi.fn()} statusChoices={[{ label: 'Activated', value: 'Activated', apiKey: 'activated' }]}
    getTotalCount={() => 9} getStatusCount={() => 4} />);
  expect(html).toContain('Assignee Filters');
  expect(html).toContain('Status Filters');
  expect(html.match(/aria-expanded="true"/g)).toHaveLength(2);
  expect(html.match(/aria-pressed="true"/g)).toHaveLength(2);
  expect(html).toContain('Ahmed');
  expect(html).toContain('Executive');
  expect(html).toContain('(3)');
  expect(html).toContain('All (9)');
});
it('preserves role-based hiding of assignee filters', () => {
  const html = renderToStaticMarkup(<LeadListingFilters showExecutives={false} statusChoices={[]} getTotalCount={() => 0} getStatusCount={() => 0} setStatusFilter={vi.fn()} />);
  expect(html).not.toContain('Assignee Filters');
  expect(html).toContain('Status Filters');
});
