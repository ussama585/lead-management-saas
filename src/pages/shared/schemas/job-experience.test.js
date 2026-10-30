import { describe, it, expect } from 'vitest';
import { commonJobFormSchema, editJobHeadhuntingValidationSchema, EXPERIENCE_RANGE_ERROR } from './job.js';
import { dataLeadJobSchema } from '../../leads/schemas/data-lead-job-schema.js';

describe('Data Lead create/edit dropdown experience validation', () => {
  const schema = dataLeadJobSchema.pick(['min_experience', 'max_experience']);
  it.each([
    { min_experience: 6, max_experience: 5 },
    { min_experience: 2, max_experience: 1 },
    { min_experience: 2, max_experience: 0 },
    { min_experience: '', max_experience: 5 },
    { min_experience: 2, max_experience: 12 },
  ])('blocks an invalid selection %j', async values => {
    await expect(schema.validate(values)).rejects.toThrow();
  });
  it.each([
    { min_experience: 0, max_experience: 0 },
    { min_experience: 3, max_experience: 3 },
    { min_experience: '2', max_experience: '5' },
  ])('accepts a valid selection %j', async values => {
    await expect(schema.validate(values)).resolves.toBeDefined();
  });
});

describe.each([
  ['create/common job form', commonJobFormSchema],
  ['edit job form', editJobHeadhuntingValidationSchema],
])('%s experience validation', (_name, fullSchema) => {
  const schema = fullSchema.pick(['min_experience', 'max_experience']);
  const original = { min_experience: 2, max_experience: 5 };

  it.each([
    { ...original, min_experience: '6' },
    { ...original, max_experience: '1' },
    { min_experience: '9', max_experience: '8' },
    { min_experience: '2', max_experience: '0' },
  ])('rejects an invalid pair, including a change to only one field: %j', async values => {
    const error = await schema.validate(values, { abortEarly: false }).catch(error => error);
    expect(error.inner.map(item => item.path)).toEqual(expect.arrayContaining(['min_experience', 'max_experience']));
    expect(error.errors).toContain(EXPERIENCE_RANGE_ERROR);
  });

  it.each([
    original, { ...original, min_experience: '4' }, { ...original, max_experience: '6' },
    { min_experience: '0', max_experience: '0' }, { min_experience: 3, max_experience: 3 },
  ])('accepts valid or corrected pairs: %j', async values => {
    await expect(schema.validate(values)).resolves.toBeDefined();
  });

  it('does not skip required or numeric validation', async () => {
    await expect(schema.validate({ min_experience: '', max_experience: 5 })).rejects.toThrow();
    await expect(schema.validate({ min_experience: 'invalid', max_experience: 5 })).rejects.toThrow();
    await expect(schema.validate({ min_experience: -1, max_experience: 5 })).rejects.toThrow();
    await expect(schema.validate({ min_experience: 2, max_experience: 12 })).rejects.toThrow();
    await expect(schema.validate({ min_experience: 2.5, max_experience: 5 })).rejects.toThrow();
  });
});
