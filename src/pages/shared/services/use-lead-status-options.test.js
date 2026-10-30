import { expect, it, vi } from 'vitest';
import { leadStatusNames } from './use-lead-status-options.js';
vi.mock('../store/user-store.js', () => ({ default: () => ({ user: {} }) }));
vi.mock('./api.js', () => ({ default: { get: vi.fn() } }));

it('uses API names as values, removes duplicates and ignores empty names', () => {
  expect(leadStatusNames([{ id: 1, name: 'Activated' }, { id: 2, name: 'New Statuses' }, { id: 3, name: ' Activated ' }, { id: 4, name: '' }]))
    .toEqual(['Activated', 'New Statuses']);
});
it('does not fall back to hardcoded statuses for an empty list', () => {
  expect(leadStatusNames([])).toEqual([]);
});
