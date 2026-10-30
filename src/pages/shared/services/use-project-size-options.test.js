import { it, expect, vi } from 'vitest';
import { projectSizeOptions } from './use-project-size-options.js';
vi.mock('./api.js', () => ({ default: { get: vi.fn() } }));
vi.mock('../store/user-store.js', () => ({ default: () => ({ user: {} }) }));
it('uses project size values for both labels and submitted values', () => {
  expect(projectSizeOptions([{ id: 2, value: '25K' }, { id: 1, value: '50K' }, { id: 3, value: '25K' }, { value: '' }]))
    .toEqual([{ value: '25K', label: '25K' }, { value: '50K', label: '50K' }]);
});
it('keeps empty API options empty', () => {
  expect(projectSizeOptions([])).toEqual([]);
});
