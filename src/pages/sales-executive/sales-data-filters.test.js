import { expect, it } from 'vitest';
import { changeSalesDataStatus, salesDataFilterParams } from './sales-data-filters.js';

it('requests assigned records with assigned=true', () => {
  const next = changeSalesDataStatus('', 'assigned');
  expect(salesDataFilterParams(next.status, next.tab)).toEqual({ assigned: true });
});
it('requests unassigned records with assigned=false', () => {
  const next = changeSalesDataStatus('', 'unassigned');
  expect(salesDataFilterParams(next.status, next.tab)).toEqual({ assigned: false });
});
it('omits assignment scope for All', () => {
  const next = changeSalesDataStatus('assigned', '');
  expect(salesDataFilterParams(next.status, next.tab)).toEqual({});
});
it('preserves ordinary status filters', () => {
  const next = changeSalesDataStatus('', 'Contacted');
  expect(salesDataFilterParams(next.status, next.tab)).toEqual({ status: 'Contacted' });
});
