import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api.js';
import { getSalesDataAssigneeFilters } from './data-entry-service.js';

vi.mock('./api.js', () => ({ default: { get: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());

describe('Sales Data assignee filters', () => {
  it.each([true, false])('passes assigned=%s without dropping false', async assigned => {
    api.get.mockResolvedValue({ data: [] });
    await getSalesDataAssigneeFilters({ assigned });
    expect(api.get).toHaveBeenCalledWith('/data-leads/stats', { params: { assigned } });
  });
  it('passes a selected lead status', async () => {
    api.get.mockResolvedValue({ data: [] });
    await getSalesDataAssigneeFilters({ status: 'Activated' });
    expect(api.get).toHaveBeenCalledWith('/data-leads/stats', { params: { status: 'Activated' } });
  });
  it.each([true, false])('scopes the company parameter for Super Admin=%s', async superAdmin => {
    const rows = [{ id: 8, name: 'Executive', data_leads_assigned: 2 }];
    api.get.mockResolvedValue({ data: rows });
    expect(await getSalesDataAssigneeFilters({ superAdmin, companyId: 1, startDate: '2026-10-01', endDate: '2026-11-03' })).toEqual(rows);
    expect(api.get).toHaveBeenCalledWith(superAdmin ? '/data-entry/stats' : '/data-leads/stats', {
      params: { ...(superAdmin ? { company_id: 1 } : {}), start_date: '2026-10-01', end_date: '2026-11-03' },
    });
  });
  it('omits unset filters and accepts an empty list', async () => {
    api.get.mockResolvedValue({ data: [] });
    expect(await getSalesDataAssigneeFilters()).toEqual([]);
    expect(api.get).toHaveBeenCalledWith('/data-leads/stats', { params: {} });
  });
  it('reports API failure instead of treating it as an empty list', async () => {
    api.get.mockResolvedValue({ data: { status: false, message: 'Forbidden' } });
    await expect(getSalesDataAssigneeFilters()).rejects.toThrow('Forbidden');
  });
});
