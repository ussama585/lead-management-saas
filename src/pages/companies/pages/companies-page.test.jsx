import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../shared/services/api.js';
import { companyError, companyFieldErrors, createCompany, listCompanies, getCompanyDetails, updateCompany, deleteCompany } from './companies-page.jsx';
import { companySchema } from '../schemas/company-schema.js';
import { canAccessMenu, canAccessRoute } from '../../auth/role-access.js';

vi.mock('../../shared/services/api.js', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
vi.mock('antd', () => ({ Alert: () => null, Avatar: () => null, Button: () => null, Card: () => null, Descriptions: () => null, Input: () => null, Modal: () => null, Space: () => null, Spin: () => null, Switch: () => null, Table: () => null, Tag: () => null, message: {} }));
vi.mock('../../shared/store/user-store.js', () => ({ default: () => ({ user: null }) }));
vi.mock('../../../components/breadcrumb.component.jsx', () => ({ default: () => null }));
vi.mock('../../../components/settings-delete-modal.jsx', () => ({ default: () => null }));
beforeEach(() => vi.clearAllMocks());

describe('companies API', () => {
  it('reads the paginated company list', async () => {
    const payload = { status: true, count: 3, next: null, previous: null, results: [{ id: 3, name: 'Company', is_active: true }] };
    api.get.mockResolvedValue({ data: payload });
    expect(await listCompanies()).toEqual(payload);
    expect(api.get).toHaveBeenCalledWith('/company/list', { params: { page: 1, size: 10 } });
  });
  it('sends pagination, search and sorting', async () => {
    api.get.mockResolvedValue({ data: { results: [], count: 0 } });
    await listCompanies({ page: 2, pageSize: 25, search: ' company ', sortBy: 'name', order: 'desc' });
    expect(api.get).toHaveBeenCalledWith('/company/list', { params: { page: 2, size: 25, search: 'company', sort_by: 'name', order: 'desc' } });
  });
  it('creates with the documented JSON fields and preserves inactive state', async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    await createCompany({ name: ' Sample ', email: 'info@example.test', phone: '123', website: 'https://example.test', address: 'Office', country: 'Pakistan', city: 'Karachi', is_active: false });
    expect(api.post).toHaveBeenCalledWith('/company/create', {
      name: 'Sample', email: 'info@example.test', phone: '123', website: 'https://example.test', address: 'Office', country: 'Pakistan', city: 'Karachi', is_active: false,
    });
  });
  it('rejects API failures and invalid list responses', async () => {
    api.get.mockResolvedValue({ data: { status: false, message: 'Forbidden' } });
    await expect(listCompanies()).rejects.toThrow('Forbidden');
    api.get.mockResolvedValue({ data: {} });
    await expect(listCompanies()).rejects.toThrow('Could not read');
    api.post.mockResolvedValue({ data: { success: false, message: 'Duplicate company' } });
    await expect(createCompany({ name: 'Company' })).rejects.toThrow('Duplicate company');
  });
  it('formats backend field errors', () => {
    expect(companyError({ response: { data: { success: false, message: 'Validation failed.', errors: 'Email: company with this email already exists.' } } })).toBe('Email: company with this email already exists.');
    expect(companyError({ response: { data: { email: ['Already exists.'] } } })).toBe('email: Already exists.');
    expect(companyError({ response: { data: { errors: { name: ['Required.'] } } } })).toBe('name: Required.');
  });
  it('preserves duplicate-email details in unsuccessful create responses', async () => {
    api.post.mockResolvedValue({ data: { success: false, message: 'Validation failed.', errors: 'Email: company with this email already exists.' } });
    await expect(createCompany({ name: 'Company', email: 'duplicate@example.com' })).rejects.toThrow('Email: company with this email already exists.');
  });
});

describe('companies permissions', () => {
  it.each(['admin', 'super_admin'])('allows %s', role => {
    expect(canAccessMenu(role, '26')).toBe(true);
    expect(canAccessRoute(role, ['super_admin'], '/super-admin/companies')).toBe(true);
  });
  it.each(['company_admin', 'sales_manager', 'sales_executive', 'data_entry_executive', undefined])('denies %s', role => {
    expect(canAccessMenu(role, '26')).toBe(false);
    expect(canAccessRoute(role, ['super_admin'], '/super-admin/companies')).toBe(false);
  });
});


describe('company details and mutations', () => {
  it('reads the company from the detail envelope', async () => {
    api.get.mockResolvedValue({ data: { success: true, data: { id: 1, name: 'Company', is_active: false } } });
    expect(await getCompanyDetails(1)).toEqual({ id: 1, name: 'Company', is_active: false });
    expect(api.get).toHaveBeenCalledWith('/company/detail/1');
  });
  it('patches form fields and preserves inactive state', async () => {
    api.patch.mockResolvedValue({ data: { success: true } });
    await updateCompany(1, { name: ' Updated ', email: 'info@example.test', is_active: false });
    expect(api.patch).toHaveBeenCalledWith('/company/detail/1', expect.objectContaining({ name: 'Updated', email: 'info@example.test', is_active: false }));
  });
  it('deletes using the same detail endpoint and accepts an empty response', async () => {
    api.delete.mockResolvedValue({ data: '' });
    await deleteCompany(1);
    expect(api.delete).toHaveBeenCalledWith('/company/detail/1');
  });
  it('keeps unsuccessful edits and deletes as errors', async () => {
    api.patch.mockResolvedValue({ data: { success: false, message: 'Update denied' } });
    await expect(updateCompany(1, {})).rejects.toThrow('Update denied');
    api.delete.mockResolvedValue({ data: { success: false, message: 'Delete denied' } });
    await expect(deleteCompany(1)).rejects.toThrow('Delete denied');
  });
  it('rejects malformed detail responses', async () => {
    api.get.mockResolvedValue({ data: { success: true } });
    await expect(getCompanyDetails(1)).rejects.toThrow('Could not read company details');
  });
  it('maps backend errors only to known Formik fields', () => {
    expect(companyFieldErrors({ response: { data: { errors: { name: ['Required'], email: ['Already used'], detail: 'Ignored' } } } })).toEqual({ name: 'Required', email: 'Already used' });
  });
});

describe('company form schema', () => {
  const valid = { name: 'Company', email: 'info@example.test', is_active: true };
  it('accepts optional empty fields', async () => {
    await expect(companySchema.validate(valid)).resolves.toMatchObject(valid);
  });
  it('requires company name and valid email', async () => {
    await expect(companySchema.validate({ ...valid, name: '   ' })).rejects.toThrow('company name');
    await expect(companySchema.validate({ ...valid, email: 'invalid' })).rejects.toThrow('valid email');
  });
  it('allows full http/https URLs and rejects unsafe or incomplete websites', async () => {
    await expect(companySchema.validate({ ...valid, website: 'https://example.com' })).resolves.toBeTruthy();
    await expect(companySchema.validate({ ...valid, website: '' })).resolves.toBeTruthy();
    await expect(companySchema.validate({ ...valid, website: 'example.com' })).rejects.toThrow('full URL');
    await expect(companySchema.validate({ ...valid, website: 'javascript:alert(1)' })).rejects.toThrow('full URL');
  });
});
