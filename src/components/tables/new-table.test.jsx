import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import NewTableComponent from './new-table.jsx';

it('renders an empty deleted jobs table without a supplied sorting state', () => {
  const html = renderToStaticMarkup(<NewTableComponent heading="Deleted Jobs"
    columns={[{ header: 'Job Title', accessorKey: 'job_title' }]} data={[]} totalCount={0}
    enableRowSelection={false} enableGlobalFilter={false} enablePagination={false} />);
  expect(html).toContain('Deleted Jobs');
  expect(html).toContain('Job Title');
});
