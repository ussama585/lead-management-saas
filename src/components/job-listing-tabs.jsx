import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs.jsx';
import NewTableComponent from './tables/new-table.jsx';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { RotateCcw } from 'lucide-react';
import { Button } from './ui/app-controls.jsx';
import { Modal } from './ui/app-modal.jsx';
import { Alert } from 'antd';
import { message } from './ui/notifications.jsx';
import { restoreLeadJob, listDeletedLeadJobs } from '../pages/shared/services/lead-job-lifecycle.js';
import useUserStore from '../pages/shared/store/user-store.js';

const deletedColumns = [
  { header: 'ID', accessorKey: 'id', size: 80 },
  { header: 'Job Title', accessorKey: 'job_title' },
  { header: 'Deleted At', accessorKey: 'deleted_at' },
];
const emptyJobs = [];

export default function JobListingTabs({ children, source, leadId, fetchDeletedJobs, onRestored }) {
  const [tab, setTab] = useState('active');
  const [deletedSorting, setDeletedSorting] = useState([]);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = useState('');
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const canLoad = Boolean(fetchDeletedJobs || (source && leadId));
  const queryKey = ['deletedLeadJobs', user?.id, user?.user_type, source, leadId, pagination, deletedSorting, search];
  const deletedJobs = useQuery(queryKey, () => {
    const params = { leadId, pagination, sorting: deletedSorting, search };
    return fetchDeletedJobs ? fetchDeletedJobs(params) : listDeletedLeadJobs(source, params);
  }, {
    enabled: tab === 'deleted' && canLoad, refetchOnWindowFocus: false,
  });
  const restore = useMutation(job => restoreLeadJob(source, job.id), {
    onSuccess: async () => {
      message.success('Job restored successfully');
      setRestoreTarget(null);
      await queryClient.invalidateQueries(['deletedLeadJobs']);
      await onRestored?.();
    },
  });
  const rows = Array.isArray(deletedJobs.data) ? deletedJobs.data : deletedJobs.data?.results || emptyJobs;
  const columns = [...deletedColumns, { header: 'Delete Reason', accessorKey: 'delete_reason' },
    ...(source ? [{ header: 'Restore', id: 'restore', enableSorting: false,
      Cell: ({ row }) => <Button type="text" title="Restore job" aria-label={`Restore ${row.original.job_title || 'job'}`}
        className="bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800"
        icon={<RotateCcw size={16} />} disabled={restore.isLoading}
        onClick={() => { restore.reset(); setRestoreTarget(row.original); }} />,
    }] : [])];
  return <Tabs value={tab} onValueChange={setTab} className="w-full min-w-0">
    <TabsList aria-label="Job listings" className="mb-3">
      <TabsTrigger value="active">Active Jobs</TabsTrigger>
      <TabsTrigger value="deleted">Deleted Jobs</TabsTrigger>
    </TabsList>
    <TabsContent value="active" forceMount hidden={tab !== 'active'}>{children}</TabsContent>
    <TabsContent value="deleted">
      {!canLoad && <p className="mb-3 text-sm text-muted-foreground">Deleted jobs are not available yet.</p>}
      {deletedJobs.isError && <Alert type="error" message={deletedJobs.error?.message || 'Could not load deleted jobs.'}
        action={<Button onClick={() => deletedJobs.refetch()}>Retry</Button>} />}
      <NewTableComponent heading="Deleted Jobs" columns={columns} data={rows} totalCount={deletedJobs.data?.count ?? rows.length}
        isLoading={deletedJobs.isFetching} pagination={pagination} onPaginationChange={setPagination}
        sorting={deletedSorting} onSortingChange={value => { setDeletedSorting(value); setPagination(previous => ({ ...previous, pageIndex: 0 })); }}
        globalFilter={search} onGlobalFilterChange={value => { setSearch(value); setPagination(previous => ({ ...previous, pageIndex: 0 })); }}
        enableRowSelection={false} enableGlobalFilter={canLoad} enablePagination={canLoad} />
    </TabsContent>
    <Modal title="Restore job" open={Boolean(restoreTarget)} okText="Restore" cancelText="Cancel"
      confirmLoading={restore.isLoading} cancelButtonProps={{ disabled: restore.isLoading }}
      closable={!restore.isLoading} maskClosable={!restore.isLoading} keyboard={!restore.isLoading}
      onCancel={() => { if (!restore.isLoading) setRestoreTarget(null); }}
      onOk={() => { if (restoreTarget && !restore.isLoading) restore.mutate(restoreTarget); }}>
      <p>Are you sure you want to restore <strong>{restoreTarget?.job_title || 'this job'}</strong>?</p>
      {restore.isError && <Alert type="error" message={restore.error?.message || 'Could not restore job.'} />}
    </Modal>
  </Tabs>;
}
