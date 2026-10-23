import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api.js';
import { createLeadStatus, deleteLeadStatus, getLeadStatus, leadStatusError, listLeadStatuses, updateLeadStatus } from './lead-status-service.js';
import { canManageLeadStatuses } from '../../auth/role-access.js';

vi.mock('./api.js', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());

describe('lead status API contract', () => {
  it('reads the simple list response', async () => {
    api.get.mockResolvedValue({ data: [{ id: 1, name: 'Active' }] });
    expect(await listLeadStatuses()).toEqual([{ id: 1, name: 'Active' }]);
    expect(api.get).toHaveBeenCalledWith('/company-admin/lead-status-list');
  });
  it('reads detail data from the response envelope', async () => {
    api.get.mockResolvedValue({ data: { success: true, data: { id: 1, name: 'Active', company: 1 } } });
    expect(await getLeadStatus(1)).toMatchObject({ id: 1, name: 'Active', company: 1 });
    expect(api.get).toHaveBeenCalledWith('/company-admin/lead-status/1');
  });
  it('creates with a JSON name body', async () => {
    api.post.mockResolvedValue({ data: { success: true, message: 'Created' } });
    await createLeadStatus(' Active ');
    expect(api.post).toHaveBeenCalledWith('/company-admin/lead-status-create', { name: 'Active' });
  });
  it('updates through PATCH on the detail endpoint', async () => {
    api.patch.mockResolvedValue({ data: { success: true } });
    await updateLeadStatus(1, ' Activated ');
    expect(api.patch).toHaveBeenCalledWith('/company-admin/lead-status/1', { name: 'Activated' });
  });
  it('deletes through the same detail endpoint, including an empty 204 response', async () => {
    api.delete.mockResolvedValue({ data: '' });
    await deleteLeadStatus(1);
    expect(api.delete).toHaveBeenCalledWith('/company-admin/lead-status/1');
  });
  it.each([
    ['post', () => createLeadStatus('Active')],
    ['patch', () => updateLeadStatus(1, 'Active')],
    ['delete', () => deleteLeadStatus(1)],
  ])('rejects unsuccessful %s responses', async (method, action) => {
    api[method].mockResolvedValue({ data: { success: false, message: 'Request denied' } });
    await expect(action()).rejects.toThrow('Request denied');
  });
  it('does not misrepresent invalid list responses as an empty list', async () => {
    api.get.mockResolvedValue({ data: { success: false, message: 'Not allowed' } });
    await expect(listLeadStatuses()).rejects.toThrow('Not allowed');
    api.get.mockResolvedValue({ data: {} });
    await expect(listLeadStatuses()).rejects.toThrow('Could not read');
  });
  it.each([
    ['get', () => getLeadStatus(1)],
    ['post', () => createLeadStatus('Active')],
    ['patch', () => updateLeadStatus(1, 'Active')],
    ['delete', () => deleteLeadStatus(1)],
  ])('rejects status:false from %s', async (method, action) => {
    api[method].mockResolvedValue({ data: { status: false, message: 'Request denied' } });
    await expect(action()).rejects.toThrow('Request denied');
  });
  it('shows field validation and API errors', () => {
    expect(leadStatusError({ response: { data: { name: ['This name already exists.'] } } })).toBe('This name already exists.');
    expect(leadStatusError({ response: { data: { message: 'Not permitted' } } })).toBe('Not permitted');
  });
});

describe('lead settings privileges', () => {
  it.each(['company_admin'])('permits %s', role => {
    expect(canManageLeadStatuses(role)).toBe(true);
  });
  it.each(['admin', 'super_admin', 'sales_manager', 'sales_executive', 'data_entry_executive', undefined, 'unknown'])('denies %s', role => {
    expect(canManageLeadStatuses(role)).toBe(false);
  });
});
