import { describe, it, expect } from 'vitest';
import { dataLeadJobSchema } from './data-lead-job-schema.js';

describe('shared create/edit job skills validation', () => {
  const schema = dataLeadJobSchema.pick(['skills']);
  const skills = count => Array.from({ length: count }, (_, index) => ({ skill_name: `Skill ${index + 1}`, experience: 1, last_used: 0 }));
  it.each([0, 1, 2, 3])('rejects %i skills', async count => {
    await expect(schema.validate({ skills: skills(count) })).rejects.toThrow('Add at least 4 skills');
  });
  it.each([4, 5])('accepts %i valid skills', async count => {
    await expect(schema.validate({ skills: skills(count) })).resolves.toBeDefined();
  });
});
