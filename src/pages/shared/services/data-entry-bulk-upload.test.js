import { beforeEach, expect, it, vi } from 'vitest';
import api from './api.js';
import { bulkUploadDataEntry } from './data-entry-service.js';
import { getAccountCompanyId } from './users-service.js';

vi.mock('./api.js', () => ({ default: { post: vi.fn() } }));
vi.mock('./users-service.js', () => ({ getAccountCompanyId: vi.fn() }));
beforeEach(() => vi.clearAllMocks());

it('uploads the original file and company ID as multipart form data', async () => {
  const file = new File(['phone\n03001234567'], 'sales.csv', { type: 'text/csv' });
  api.post.mockResolvedValue({ data: { success: true, created: 1 } });
  expect(await bulkUploadDataEntry({ file, companyId: 12 })).toEqual({ success: true, created: 1 });
  const [url, body] = api.post.mock.lastCall;
  expect(url).toBe('/data-entry/bulk-upload');
  expect(body).toBeInstanceOf(FormData);
  expect(body.get('company_id')).toBe('12');
  expect(body.get('file').name).toBe('sales.csv');
  expect(await body.get('file').text()).toBe(await file.text());
});

it('preserves API validation errors even on an HTTP success response', async () => {
  const data = { success: false, message: 'No entries were uploaded.', errors: [{ row: 2, phone: 'Already exists' }] };
  api.post.mockResolvedValue({ data });
  await expect(bulkUploadDataEntry({ file: new File([''], 'sales.csv'), companyId: 12 })).rejects.toMatchObject({ response: { data } });
});

it('does not upload without a company ID', async () => {
  getAccountCompanyId.mockRejectedValue(new Error('Your account details do not include a company ID.'));
  await expect(bulkUploadDataEntry({ file: new File([''], 'sales.csv') })).rejects.toThrow('company');
  expect(api.post).not.toHaveBeenCalled();
});

it('looks up the signed-in account company when login data omits it', async () => {
  getAccountCompanyId.mockResolvedValue(7);
  api.post.mockResolvedValue({ data: { success: true } });
  await bulkUploadDataEntry({ file: new File(['phone'], 'sales.csv'), userId: 42 });
  expect(getAccountCompanyId).toHaveBeenCalledWith(42);
  expect(api.post.mock.lastCall[1].get('company_id')).toBe('7');
});
