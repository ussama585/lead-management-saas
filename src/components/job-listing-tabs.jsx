import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs.jsx';
import NewTableComponent from './tables/new-table.jsx';

const deletedColumns = [
  { header: 'ID', accessorKey: 'id', size: 80 },
  { header: 'Job Title', accessorKey: 'job_title' },
  { header: 'Deleted At', accessorKey: 'deleted_at' },
];
const emptyJobs = [];

export default function JobListingTabs({ children }) {
  const [tab, setTab] = useState('active');
  const [deletedSorting, setDeletedSorting] = useState([]);
  return <Tabs value={tab} onValueChange={setTab} className="w-full min-w-0">
    <TabsList aria-label="Job listings" className="mb-3">
      <TabsTrigger value="active">Active Jobs</TabsTrigger>
      <TabsTrigger value="deleted">Deleted Jobs</TabsTrigger>
    </TabsList>
    <TabsContent value="active" forceMount hidden={tab !== 'active'}>{children}</TabsContent>
    <TabsContent value="deleted">
      <p className="mb-3 text-sm text-muted-foreground">Deleted jobs are not available yet.</p>
      <NewTableComponent heading="Deleted Jobs" columns={deletedColumns} data={emptyJobs} totalCount={0}
        sorting={deletedSorting} onSortingChange={setDeletedSorting}
        enableRowSelection={false} enableGlobalFilter={false} enablePagination={false} />
    </TabsContent>
  </Tabs>;
}
