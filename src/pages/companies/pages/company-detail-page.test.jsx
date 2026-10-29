import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../shared/services/api.js';
import { getCompanyUsers, getCompanySalesManagers, createCompanyUser, editCompanyUser, requestCompanyUserDelete, confirmCompanyUserDelete } from './company-detail-page.jsx';
import { managerIdFromOptions } from '../../users/user-manager-options.js';
import { companyUserCreateSchema, companyUserEditSchema, companyUserOtpSchema } from '../schemas/company-user-schema.js';

vi.mock('../../shared/services/api.js', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
vi.mock('antd', () => ({ Alert: () => null, Avatar: () => null, Button: () => null, Card: () => null, Descriptions: () => null, Input: () => null, Modal: () => null, Space: () => null, Spin: () => null, Switch: () => null, Table: () => null, Tag: () => null, message: {} }));
vi.mock('../../shared/store/user-store.js', () => ({ default: () => ({ user: null }) }));
vi.mock('../../../components/breadcrumb.component.jsx', () => ({ default: () => null }));
vi.mock('../../../components/settings-delete-modal.jsx', () => ({ default: () => null }));

beforeEach(() => vi.clearAllMocks());
describe('company detail users', () => {
  it('loads company-scoped manager IDs without injecting account IDs into the options', async () => {
    api.get.mockResolvedValue({ data: [{ id: 6, user_id: 21, name: 'Company 4 Manager' }, { id: 8, user_id: 30, name: 'sales manager 1' }] });
    const options = await getCompanySalesManagers(10);
    expect(api.get).toHaveBeenLastCalledWith('/sales-manager/simple-list', { params: { company_id: 10 } });
    expect(managerIdFromOptions(options, { manager_id: 21, manager_name: 'Company 4 Manager' })).toBe(21);
    expect(options.map(option => option.id)).toEqual([6, 8]);
    expect(options.filter(option => option.name === 'Company 4 Manager')).toHaveLength(1);
  });
  const values = { name: 'Ali Ahmed', email: 'ali@example.com', phone: '+923001234567', password: 'secret123', confirmPassword: 'secret123', user_type: 'sales_executive', manager: 2, company_id: 999 };
  it.each(['company_admin', 'sales_manager', 'sales_executive', 'data_entry_executive'])('creates %s against the route company, ignoring any submitted company ID', async user_type => {
    api.post.mockResolvedValue({ data: { success: true } });
    await createCompanyUser(3, { ...values, user_type });
    expect(api.post).toHaveBeenLastCalledWith('/accounts/signup', {
      name: values.name, email: values.email, phone: values.phone, password: values.password, user_type, company_id: 3,
      ...(user_type === 'sales_executive' ? { manager_id: 2 } : {}),
    });
  });
  it('allows data entry executives while rejecting super admins', async () => {
    await expect(companyUserCreateSchema.validate({ ...values, user_type: 'data_entry_executive' })).resolves.toBeTruthy();
    await expect(createCompanyUser(3, { ...values, user_type: 'super_admin' })).rejects.toThrow('valid user type');
  });
  it('uses the user-management edit endpoint and sends only changed editable fields', async () => {
    api.patch.mockResolvedValue({ data: { success: true } });
    await editCompanyUser(8, { ...values, name: 'Updated Name', password: '', manager: 4 }, { ...values, password: '' });
    const [endpoint, body] = api.patch.mock.calls[0];
    expect(endpoint).toBe('/accounts/detail/8');
    expect(Object.fromEntries(body)).toEqual({ name: 'Updated Name', manager_id: '4' });
    await expect(companyUserEditSchema.validate({ ...values, password: '' })).resolves.toBeDefined();
  });
  it('requests an OTP before validating it to delete the selected user', async () => {
    api.delete.mockResolvedValue({ data: { success: true } });
    api.post.mockResolvedValue({ data: { success: true } });
    await requestCompanyUserDelete(8);
    expect(api.delete).toHaveBeenCalledWith('/accounts/detail/8');
    await confirmCompanyUserDelete(8, ' 123456 ');
    const [endpoint, body] = api.post.mock.calls[0];
    expect(endpoint).toBe('/accounts/validate-delete-user/8');
    expect(body.get('otp')).toBe('123456');
    await expect(companyUserOtpSchema.validate({ otp: '' })).rejects.toThrow('OTP');
  });
  it('can clear an existing manager without changing the company or role', async () => {
    api.patch.mockResolvedValue({ data: { success: true } });
    await editCompanyUser(8, { ...values, password: '', manager: '' }, { ...values, password: '' });
    expect(Object.fromEntries(api.patch.mock.calls[0][1])).toEqual({ manager_id: '' });
  });
  it('retains detailed creation failures', async () => {
    api.post.mockResolvedValue({ data: { success: false, message: 'Validation failed.', errors: 'Email already exists.' } });
    await expect(createCompanyUser(3, values)).rejects.toThrow('Email already exists.');
  });
  it('always scopes the users list to the route company', async () => {
    const payload = { count: 1, results: [{ id: 7, name: 'User' }] };
    api.get.mockResolvedValue({ data: payload });
    expect(await getCompanyUsers('2')).toEqual(payload);
    expect(api.get).toHaveBeenCalledWith('/company/users/2', { params: { page: 1, size: 10 } });
  });
  it('keeps company scope while searching, sorting and paging', async () => {
    api.get.mockResolvedValue({ data: { count: 0, results: [] } });
    await getCompanyUsers('3', { page: 2, pageSize: 25, search: ' Alice ', sortBy: 'name', order: 'desc' });
    expect(api.get).toHaveBeenCalledWith('/company/users/3', { params: {
      page: 2, size: 25, search: 'Alice', sort_by: 'name', order: 'desc',
    } });
  });
  it('surfaces API failures and malformed results', async () => {
    api.get.mockResolvedValueOnce({ data: { status: false, message: 'Forbidden' } });
    await expect(getCompanyUsers('2')).rejects.toThrow('Forbidden');
    api.get.mockResolvedValueOnce({ data: {} });
    await expect(getCompanyUsers('2')).rejects.toThrow('Could not read');
  });
});
