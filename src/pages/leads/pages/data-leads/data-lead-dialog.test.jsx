import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../../../shared/services/api.js';
import { dataLeadPayload, getDataLeadDetails, saveDataLead } from './data-lead-dialog.jsx';
import { dataLeadSchema } from '../../schemas/data-lead-schema.js';

vi.mock('../../../shared/services/api.js', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
vi.mock('../../../shared/store/user-store.js', () => ({ default: () => ({ user: null }) }));
vi.mock('antd', () => ({ Alert: () => null, AutoComplete: () => null, Button: () => null, Descriptions: () => null, Input: () => null, InputNumber: () => null, Modal: () => null, Select: () => null, Spin: () => null, Switch: () => null, message: {} }));
beforeEach(() => vi.clearAllMocks());
const sample = { company: 3, industry: 'Information Technology', company_name: 'ABC Solutions', contact_person_name: 'Ali Khan', contact_person_designation: 'Project Manager', email: 'ali@example.com', phone_number: '+923001243867', status: 'Activated', remarks: 'Interested', project_size: '25k', assigned_to: 1, contract_currency: 'PKR', contract_price: 5000, is_accepting_response: true, followup_date: '2026-10-25' };

describe('data lead API contract', () => {
  it('creates a JSON lead with all documented fields for super admins', async () => {
    api.post.mockResolvedValue({ data: { success: true, message: 'Lead created successfully.' } });
    await saveDataLead({ values: sample, superAdmin: true });
    expect(api.post).toHaveBeenCalledWith('/data-leads/create', sample);
  });
  it('omits company for other roles even if present in form values', async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    await saveDataLead({ values: sample, superAdmin: false });
    expect(api.post.mock.calls[0][1]).not.toHaveProperty('company');
  });
  it('reads the details response envelope', async () => {
    api.get.mockResolvedValue({ data: { success: true, data: { id: 1, ...sample } } });
    expect(await getDataLeadDetails(1)).toEqual({ id: 1, ...sample });
    expect(api.get).toHaveBeenCalledWith('/data-leads/details/1');
  });
  it('patches the same details endpoint', async () => {
    api.patch.mockResolvedValue({ data: { success: true } });
    await saveDataLead({ id: 1, values: sample, superAdmin: true });
    expect(api.patch).toHaveBeenCalledWith('/data-leads/details/1', sample);
  });
  it('normalizes numeric and empty fields without losing false values', () => {
    const payload = dataLeadPayload({ ...sample, assigned_to: '', contract_price: '0', is_accepting_response: false, followup_date: '' }, false);
    expect(payload).toMatchObject({ assigned_to: null, contract_price: 0, is_accepting_response: false, followup_date: null });
  });
  it('rejects API failures and malformed details', async () => {
    api.post.mockResolvedValue({ data: { success: false, message: 'Invalid lead' } });
    await expect(saveDataLead({ values: sample })).rejects.toThrow('Invalid lead');
    api.get.mockResolvedValue({ data: { success: true } });
    await expect(getDataLeadDetails(1)).rejects.toThrow('Could not read');
  });
});

describe('data lead validation', () => {
  it('requires company selection for super admins only', async () => {
    await expect(dataLeadSchema(true).validate(sample)).resolves.toBeTruthy();
    await expect(dataLeadSchema(true).validate({ ...sample, company: undefined })).rejects.toThrow('company');
    await expect(dataLeadSchema(false).validate({ ...sample, company: undefined })).resolves.toBeTruthy();
  });
  it('validates contact email, price and calendar date', async () => {
    await expect(dataLeadSchema(false).validate({ ...sample, email: 'invalid' })).rejects.toThrow('email');
    await expect(dataLeadSchema(false).validate({ ...sample, contract_price: -1 })).rejects.toThrow('negative');
    await expect(dataLeadSchema(false).validate({ ...sample, followup_date: '2026-02-31' })).rejects.toThrow('date');
  });
});
