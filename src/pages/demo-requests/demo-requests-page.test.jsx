import { describe, it, expect, vi } from 'vitest';
import api from '../shared/services/api.js';
import { getDemoRequests, getDemoRequestDetail, updateDemoRequest, deleteDemoRequest } from './demo-requests-page.jsx';
import { demoRequestSchema } from './demo-request-schema.js';
import { canAccessRoute, canAccessMenu } from '../auth/role-access.js';

vi.mock('../shared/services/api.js', () => ({ default: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
vi.mock('../shared/store/user-store.js', () => ({ default: () => ({ user_type: 'super_admin' }) }));
vi.mock('../../components/breadcrumb.component.jsx', () => ({ default: () => null }));
vi.mock('../../components/tables/new-table.jsx', () => ({ default: () => null }));

describe('Demo Request listing', () => {
  it('unwraps the detail endpoint response', async () => {
    const detail = { id: 1, name: 'John Smith', status: 'Pending' };
    api.get.mockResolvedValue({ data: { success: true, data: detail } });
    expect(await getDemoRequestDetail(1)).toEqual(detail);
    expect(api.get).toHaveBeenLastCalledWith('/demo/request-detail/1');
  });
  it('patches editable fields without sending IDs or timestamps', async () => {
    api.patch.mockResolvedValue({ data: { success: true, message: 'Updated' } });
    await updateDemoRequest(1, { name: 'John Updated', status: 'Pending', id: 9, updated_at: 'yesterday' });
    expect(api.patch).toHaveBeenLastCalledWith('/demo/request-detail/1', { name: 'John Updated', status: 'Pending' });
  });
  it('deletes the selected request', async () => {
    api.delete.mockResolvedValue({ data: { success: true } });
    await deleteDemoRequest(2);
    expect(api.delete).toHaveBeenLastCalledWith('/demo/request-detail/2');
  });
  it('rejects unsuccessful updates, deletion and malformed details', async () => {
    api.patch.mockResolvedValue({ data: { success: false, errors: 'Email already exists.' } });
    await expect(updateDemoRequest(1, {})).rejects.toThrow('Email already exists.');
    api.delete.mockResolvedValue({ data: { success: false, message: 'Deletion denied.' } });
    await expect(deleteDemoRequest(1)).rejects.toThrow('Deletion denied.');
    api.get.mockResolvedValue({ data: { success: true } });
    await expect(getDemoRequestDetail(1)).rejects.toThrow('Could not read demo request details.');
  });
  it('validates the edit form', async () => {
    await expect(demoRequestSchema.validate({ name: '', email: 'invalid', phone: '', status: '' })).rejects.toThrow();
    await expect(demoRequestSchema.validate({ name: 'John', email: 'john@example.com', phone: '+923001234567', status: 'Pending', message: '' })).resolves.toBeDefined();
  });
  it('loads paginated results using the documented filters', async () => {
    const response = { status: true, count: 2, next: null, previous: null, results: [{ id: 2, name: 'Investor project' }] };
    api.get.mockResolvedValue({ data: response });
    expect(await getDemoRequests({ search: ' john ', status: 'pending', sortBy: 'created_at', order: 'desc', page: 2 })).toEqual(response);
    expect(api.get).toHaveBeenLastCalledWith('/demo/request-list', { params: { search: 'john', status: 'pending', sort_by: 'created_at', order: 'desc', page: 2, size: 10 } });
  });
  it('always sends default pagination and accepts a selected page size', async () => {
    api.get.mockResolvedValue({ data: { status: true, count: 0, results: [] } });
    await getDemoRequests();
    expect(api.get).toHaveBeenLastCalledWith('/demo/request-list', { params: { page: 1, size: 10, sort_by: 'created_at', order: 'desc' } });
    await getDemoRequests({ page: 3, size: 25 });
    expect(api.get).toHaveBeenLastCalledWith('/demo/request-list', { params: { page: 3, size: 25, sort_by: 'created_at', order: 'desc' } });
  });
  it.each([{ status: false, message: 'Forbidden' }, { count: 1 }, { results: [] }])('rejects unsuccessful or malformed responses', async response => {
    api.get.mockResolvedValue({ data: response });
    await expect(getDemoRequests()).rejects.toThrow();
  });
  it.each(['company_admin', 'sales_manager', 'sales_executive', 'data_entry_executive'])('denies direct and sidebar access to %s', role => {
    expect(canAccessRoute(role, ['super_admin'], '/super-admin/demo-requests')).toBe(false);
    expect(canAccessMenu(role, '27')).toBe(false);
  });
  it.each(['super_admin', 'admin'])('permits Super Admin access for %s', role => {
    expect(canAccessRoute(role, ['super_admin'], '/super-admin/demo-requests')).toBe(true);
    expect(canAccessMenu(role, '27')).toBe(true);
  });
});
