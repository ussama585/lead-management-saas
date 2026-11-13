import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { expect, it } from 'vitest';

const sourceRoot = fileURLToPath(new URL('../../', import.meta.url));

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : /\.[jt]sx?$/.test(entry.name) && !entry.name.includes('.test.') ? [path] : [];
  });
}

it('keeps table rendering in new-table.jsx across the application', () => {
  const violations = [];
  for (const file of sourceFiles(sourceRoot)) {
    const name = relative(sourceRoot, file).replaceAll('\\', '/');
    if (name === 'components/tables/new-table.jsx') continue;
    const source = readFileSync(file, 'utf8');
    if (/<(?:table|Table|MaterialReactTable|DataGrid)\b/.test(source) || /from\s+['"][^'"]*table\.component\.jsx['"]/.test(source)) {
      violations.push(name);
    }
  }
  expect(violations).toEqual([]);
});
