import { afterEach, expect, it, vi } from 'vitest';
import { leadFilterParams, readLeadFilterParams } from './lead-filter-query.js';
import { loadTableState } from './persistTableState.js';

afterEach(() => vi.unstubAllGlobals());

it('restores all website and data lead filters from the URL', () => {
  const state = { status: 'Company Profile Sent Email', selectedExecutive: '17', projectSizeFilter: 'Large',
    duplicateCheck: 'duplicate', search: 'Acme & Co', pageIndex: 3, pageSize: 25,
    sorting: [{ id: 'created_at', desc: true }], hearAboutUs: ['Google, Search', 'Meta'],
    dateRange: ['2026-11-01T00:00:00.000Z', '2026-11-05T23:59:59.000Z'] };
  const params = leadFilterParams('company_id=9', state);
  expect(params.get('company_id')).toBe('9');
  expect(readLeadFilterParams(new URLSearchParams(params.toString()), {})).toMatchObject(state);
});

it('restores Meta campaign, adset, ad, history and multi-value filters', () => {
  const state = { selectedCampaign: 'Campaign A', selectedAdset: { adset_name: 'Set A', count: 2 },
    selectedAd: { ad_name: 'Ad 1' }, selectedHistoryStatuses: ['Follow Up', 'Potential Client'],
    historyStartDate: '2026-11-01T00:00:00Z', historyEndDate: '2026-11-05T00:00:00Z',
    formNamesFilter: ['Form, A', 'Form B'], excludeKeywords: ['spam', 'test'], selectedExecId: 19 };
  expect(readLeadFilterParams(leadFilterParams('', state), {})).toMatchObject(state);
});

it.each(['leads-page', 'data-leads-page', 'meta-leads-page', 'meta-leads-marketing-manager'])('URL snapshot overrides stale session filters for %s', route => {
  vi.stubGlobal('sessionStorage', { getItem: () => JSON.stringify({ status: 'Old', statusFilter: 'Old',
    projectSizeFilter: 'Old', selectedCampaign: 'Old', timestamp: Date.now() }) });
  const params = leadFilterParams('company_id=9&project_size=Old&campaign=Old', { search: 'New', pageIndex: 0, pageSize: 10 });
  const state = loadTableState(route, params);
  expect(state.search).toBe('New');
  expect(state.projectSizeFilter).toBeUndefined();
  expect(state.selectedCampaign).toBeUndefined();
  expect(state.statusFilter).toBeUndefined();
  expect(params.has('project_size')).toBe(false);
});

it('ignores malformed dates, pagination and ad objects', () => {
  const state = readLeadFilterParams(new URLSearchParams('date_start=bad&page=-1&pageSize=0&ad=bad'), { pageIndex: 0, pageSize: 10 });
  expect(state).toMatchObject({ pageIndex: 0, pageSize: 10, dateRange: [null, null], selectedAd: null });
});
