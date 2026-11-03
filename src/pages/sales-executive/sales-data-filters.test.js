import { expect, it } from 'vitest';
import { changeSalesDataStatus, salesDataFilterParams } from './sales-data-filters.js';

it('preserves the status when selecting or clearing an assignee', () => {
  expect(salesDataFilterParams('Pending Contact', 8, 'all')).toEqual({ status: 'Pending Contact', assigned_to: 8 });
  expect(salesDataFilterParams('Pending Contact', null, 'all')).toEqual({ status: 'Pending Contact' });
});
it('preserves the assignee when changing or clearing status', () => {
  const changed = changeSalesDataStatus('Pending Contact', 'Contacted');
  expect(salesDataFilterParams(changed.status, 8, changed.tab)).toEqual({ status: 'Contacted', assigned_to: 8 });
  const cleared = changeSalesDataStatus('Contacted', previous => previous === 'Contacted' ? '' : 'Contacted');
  expect(salesDataFilterParams(cleared.status, 8, cleared.tab)).toEqual({ assigned_to: 8 });
});
it('applies both filters restored from the URL without adding assigned=true', () => {
  const url = new URLSearchParams('status=Pending+Contact&execId=8&tab=all');
  expect(salesDataFilterParams(url.get('status'), Number(url.get('execId')), url.get('tab'))).toEqual({ status: 'Pending Contact', assigned_to: 8 });
});
it('keeps explicit assignment scopes separate from status API parameters', () => {
  expect(salesDataFilterParams('unassigned', null, 'unassigned')).toEqual({ assigned: false });
  expect(salesDataFilterParams('', 8, 'assigned')).toEqual({ assigned_to: 8 });
});
