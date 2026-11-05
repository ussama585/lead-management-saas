import { expect, it } from 'vitest';
import { mergeProjectSizeValues } from './use-project-size-filter-options.js';

it('keeps all known sizes when filtered results contain only the selected size', () => {
  const initial = mergeProjectSizeValues([], [], [{ project_size: 'Small' }, { project_size: 'Medium' }, { project_size: 'Large' }], null);
  expect(mergeProjectSizeValues(initial, [], [{ project_size: 'Medium' }], 'Medium')).toEqual(['Small', 'Medium', 'Large']);
});

it('keeps configured sizes and the selected value with empty results', () => {
  expect(mergeProjectSizeValues(['Legacy'], [{ value: 'Small' }, { value: 'Large' }], [], 'Medium'))
    .toEqual(['Small', 'Large', 'Legacy', 'Medium']);
});

it('deduplicates sizes and excludes blank values', () => {
  expect(mergeProjectSizeValues(['Small'], [{ value: 'Small' }], [{ project_size: 'Small' }, { project_size: null }], 'Small'))
    .toEqual(['Small']);
});
