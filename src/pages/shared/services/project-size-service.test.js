import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api.js';
import { createProjectSize, deleteProjectSize, getProjectSize, projectSizeError, listProjectSizes, updateProjectSize } from './project-size-service.js';
import { canManageProjectSizes } from '../../auth/role-access.js';

vi.mock('./api.js', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());

describe('project size API contract', () => {
  it('reads the simple list response', async () => {
    api.get.mockResolvedValue({ data: [{ id: 1, value: '25k' }] });
    expect(await listProjectSizes()).toEqual([{ id: 1, value: '25k' }]);
    expect(api.get).toHaveBeenCalledWith('/company-admin/project-size-list');
  });
  it('reads detail data from the response envelope', async () => {
    api.get.mockResolvedValue({ data: { success: true, data: { id: 1, value: '25k', company: 1 } } });
    expect(await getProjectSize(1)).toMatchObject({ id: 1, value: '25k', company: 1 });
    expect(api.get).toHaveBeenCalledWith('/company-admin/project-size/1');
  });
  it('creates with a JSON value body', async () => {
    api.post.mockResolvedValue({ data: { success: true, message: 'Created' } });
    await createProjectSize(' 25k ');
    expect(api.post).toHaveBeenCalledWith('/company-admin/project-size-create', { value: '25k' });
  });
  it('updates through PATCH on the detail endpoint', async () => {
    api.patch.mockResolvedValue({ data: { success: true } });
    await updateProjectSize(1, ' 50k ');
    expect(api.patch).toHaveBeenCalledWith('/company-admin/project-size/1', { value: '50k' });
  });
  it('deletes through the same detail endpoint, including an empty 204 response', async () => {
    api.delete.mockResolvedValue({ data: '' });
    await deleteProjectSize(1);
    expect(api.delete).toHaveBeenCalledWith('/company-admin/project-size/1');
  });
  it.each([
    ['post', () => createProjectSize('25k')],
    ['patch', () => updateProjectSize(1, '25k')],
    ['delete', () => deleteProjectSize(1)],
  ])('rejects unsuccessful %s responses', async (method, action) => {
    api[method].mockResolvedValue({ data: { success: false, message: 'Request denied' } });
    await expect(action()).rejects.toThrow('Request denied');
  });
  it('does not misrepresent invalid list responses as an empty list', async () => {
    api.get.mockResolvedValue({ data: { success: false, message: 'Not allowed' } });
    await expect(listProjectSizes()).rejects.toThrow('Not allowed');
    api.get.mockResolvedValue({ data: {} });
    await expect(listProjectSizes()).rejects.toThrow('Could not read');
  });
  it('shows field validation and API errors', () => {
    expect(projectSizeError({ response: { data: { value: ['This value already exists.'] } } })).toBe('This value already exists.');
    expect(projectSizeError({ response: { data: { message: 'Not permitted' } } })).toBe('Not permitted');
  });
});

describe('project size settings privileges', () => {
  it.each(['company_admin'])('permits %s', role => {
    expect(canManageProjectSizes(role)).toBe(true);
  });
  it.each(['admin', 'super_admin', 'sales_manager', 'sales_executive', 'data_entry_executive', undefined, 'unknown'])('denies %s', role => {
    expect(canManageProjectSizes(role)).toBe(false);
  });
});
