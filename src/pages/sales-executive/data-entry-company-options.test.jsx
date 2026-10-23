import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../shared/services/api.js';
import { createDataEntry, listCompanies, readCompanyList } from './add-update-lead.jsx';
import { dataEntryCreateSchema } from './schemas/data-entry-create-schema.js';

vi.mock('../shared/services/api.js', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../shared/store/user-store.js', () => ({ default: () => ({ user: {} }) }));

const companies = [{ id: 1, name: 'SearchOpal' }, { id: 2, name: 'Simcoe IT' }];
beforeEach(() => vi.clearAllMocks());

describe('data entry company dropdown', () => {
  it.each([companies, { results: companies }, { data: companies }, { data: { results: companies } }])('reads company names and IDs from supported list responses', payload => {
    expect(readCompanyList(payload)).toEqual(companies);
  });
  it('normalizes string IDs so selected values match the options', () => {
    expect(readCompanyList([{ id: '2', name: ' Simcoe IT ' }])).toEqual([{ id: 2, name: 'Simcoe IT' }]);
  });
  it('uses the confirmed simple-list endpoint', async () => {
    api.get.mockResolvedValue({ data: companies });
    expect(await listCompanies()).toEqual(companies);
    expect(api.get).toHaveBeenCalledWith('/accounts/simple-users-list');
  });
  it('reports failed and unreadable responses', () => {
    expect(() => readCompanyList({ status: false, message: 'Forbidden' })).toThrow('Forbidden');
    expect(() => readCompanyList({})).toThrow('Could not read');
  });
});

describe('company selection by role', () => {
  it.each(['super_admin', 'admin'])('includes the company ID for %s', async role => {
    api.post.mockResolvedValue({ data: { success: true } });
    await createDataEntry({ company: '2', status: 'Pending' }, role);
    expect(api.post).toHaveBeenCalledWith('/data-entry/create', expect.objectContaining({ company: 2 }));
    await expect(dataEntryCreateSchema(true).fields.company.validate(null)).rejects.toThrow('Company is required');
  });
  it.each(['company_admin', 'sales_manager', 'sales_executive', 'data_entry_executive'])('omits company even if a value exists for %s', async role => {
    api.post.mockResolvedValue({ data: { success: true } });
    await createDataEntry({ company: 2, status: 'Pending' }, role);
    expect(api.post.mock.calls[0][1]).not.toHaveProperty('company');
    await expect(dataEntryCreateSchema(false).fields.company.validate(null)).resolves.toBeNull();
  });
});
