import { expect, it } from 'vitest';
import { dataLeadJobSchema, dataLeadJobChoices, requiresDegreeName } from './data-lead-job-schema.js';

it.each(['', ...dataLeadJobChoices.degree_level])('validates degree names for level %s', async degree_level => {
  const validate = degrees => dataLeadJobSchema.validateAt('degrees', { degree_level, degrees });
  if (requiresDegreeName(degree_level)) {
    await expect(validate([])).rejects.toThrow('at least one degree');
    await expect(validate(undefined)).rejects.toThrow('Enter a degree name');
  } else {
    await expect(validate([])).resolves.toEqual([]);
  }
  await expect(validate([{ degree_name: 'Computer Science' }])).resolves.toEqual([{ degree_name: 'Computer Science' }]);
  await expect(validate([{ degree_name: '  ' }])).rejects.toThrow('Enter the degree name');
});
