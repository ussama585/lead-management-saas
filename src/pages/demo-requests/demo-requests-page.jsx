import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Pencil, Trash2 } from 'lucide-react';
import NewTableComponent from '../../components/tables/new-table.jsx';
import api from '../shared/services/api.js';
import useUserStore from '../shared/store/user-store.js';
import BreadCrumb from '../../components/breadcrumb.component.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Avatar, AvatarFallback } from '../../components/ui/avatar.jsx';
import { isSuperAdmin } from '../auth/role-access.js';
import { formatDateUniversal } from '../shared/utils/formatDate.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog.jsx';
import { message } from '../../components/ui/notifications.jsx';
import DemoRequestEditDialog from './demo-request-edit-dialog.jsx';

function assertDemoSuccess(data) {
  if (data?.success === false || data?.status === false) {
    const error = new Error(typeof data.errors === 'string' ? data.errors : data.message || 'Could not save demo request.');
    error.response = { data };
    throw error;
  }
  return data;
}

export async function getDemoRequestDetail(id) {
  const { data } = await api.get(`/demo/request-detail/${encodeURIComponent(id)}`);
  assertDemoSuccess(data);
  if (data?.data?.id == null) throw new Error('Could not read demo request details.');
  return data.data;
}

export async function updateDemoRequest(id, values) {
  const payload = Object.fromEntries(['name', 'email', 'phone', 'agency_name', 'team_size', 'message', 'status']
    .filter(key => Object.hasOwn(values, key)).map(key => [key, values[key]]));
  const { data } = await api.patch(`/demo/request-detail/${encodeURIComponent(id)}`, payload);
  return assertDemoSuccess(data);
}

export async function deleteDemoRequest(id) {
  const { data } = await api.delete(`/demo/request-detail/${encodeURIComponent(id)}`);
  return assertDemoSuccess(data);
}

export async function getDemoRequests({ search = '', status = '', sortBy = 'created_at', order = 'desc', page = 1, size = 10 } = {}) {
  const { data } = await api.get('/demo/request-list', {
    params: { page, size, ...(search.trim() ? { search: search.trim() } : {}), ...(status.trim() ? { status: status.trim() } : {}), sort_by: sortBy, order },
  });
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not load demo requests.');
  if (!Array.isArray(data?.results) || typeof data.count !== 'number') throw new Error('Could not read demo requests.');
  return data;
}

const fields = [
  ['name', 'Name'], ['email', 'Email'], ['phone', 'Phone'],
  ['agency_name', 'Agency Name'], ['team_size', 'Team Size'], ['message', 'Message'],
  ['status', 'Status'], ['created_at', 'Created At'],
];

export default function DemoRequestsPage() {
  const user = useUserStore(state => state.user);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState([{ id: 'created_at', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [columnVisibility, setColumnVisibility] = useState({});
  const [editRequestId, setEditRequestId] = useState(null);
  const [deleteRequest, setDeleteRequest] = useState(null);
  const queryClient = useQueryClient();

  const listing = useQuery(['demoRequests', user?.id, user?.user_type, search, sorting, pagination],
    () => getDemoRequests({ search, sortBy: sorting[0]?.id || 'created_at',
      order: sorting[0]?.desc === false ? 'asc' : 'desc', page: pagination.pageIndex + 1, size: pagination.pageSize }),
    { enabled: isSuperAdmin(user?.user_type), keepPreviousData: true, refetchOnWindowFocus: false });
  const data = listing.data;
  const refresh = () => queryClient.invalidateQueries(['demoRequests']);
  const removal = useMutation(deleteDemoRequest, {
    onSuccess: async result => {
      message.success(result?.message || 'Demo request deleted successfully.');
      setDeleteRequest(null);
      if (data?.results.length === 1 && pagination.pageIndex > 0) setPagination(previous => ({ ...previous, pageIndex: previous.pageIndex - 1 }));
      await refresh();
    },
    onError: error => message.error(typeof error.response?.data?.errors === 'string' ? error.response.data.errors : error.response?.data?.message || error.message || 'Could not delete demo request.'),
  });

  const resetPage = () => setPagination(previous => ({ ...previous, pageIndex: 0 }));

  const columns = useMemo(() => [{
    header: '#',
    id: 'row_number',
    enableSorting: false,
    enableColumnFilter: false,
    enableColumnActions: false,
    Cell: ({ row }) => <span>{pagination.pageIndex * pagination.pageSize + row.index + 1}</span>,
  }, ...fields.map(([key, label]) => ({
    header: label,
    accessorKey: key,
    enableColumnFilter: false,
    Cell: ({ cell, row }) => key === 'name' ? <div className="flex items-center gap-3">
      <Avatar className="size-10 shrink-0" aria-hidden="true">
        <AvatarFallback className="bg-primary text-primary-foreground">{Array.from(String(row.original.name || '').trim())[0]?.toUpperCase() || '?'}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="font-medium">{row.original.name || '-'}</div>
        <div data-table-secondary className="text-xs text-muted-foreground">{row.original.email || '-'}</div>
      </div>
    </div> : <span style={key === 'message' ? { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' } : undefined}>{key === 'created_at'
      ? cell.getValue() ? formatDateUniversal(cell.getValue(), true) : '-'
      : cell.getValue() == null || cell.getValue() === '' ? '-' : String(cell.getValue())}</span>,
  })), {
    header: 'Actions', id: 'actions', enableSorting: false, enableColumnFilter: false, enableColumnActions: false,
    Cell: ({ row }) => <div className="flex items-center gap-2">
      <Button type="button" variant="ghost" size="icon" title="Edit demo request" aria-label="Edit demo request" onClick={() => setEditRequestId(row.original.id)}><Pencil className="size-4" /></Button>
      <Button type="button" variant="ghost" size="icon" className="text-destructive" title="Delete demo request" aria-label="Delete demo request" onClick={() => setDeleteRequest(row.original)}><Trash2 className="size-4" /></Button>
    </div>,
  }], [pagination.pageIndex, pagination.pageSize]);

  return <>
    <div className="listing-page-content">
      {listing.isError && <div role="alert" className="mb-4 flex items-center gap-3 rounded-md border border-destructive p-4 text-destructive">
        <span>{listing.error?.message || 'Could not load demo requests.'}</span>
        <Button variant="outline" onClick={() => listing.refetch()}>Retry</Button>
      </div>}
      <div className="table-container">
        <NewTableComponent
          enableGlobalFilter={true}
          heading={`Demo Request (${data?.count ?? 0})`}
          columns={columns}
          data={data?.results || []}
          totalCount={data?.count || 0}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={next => { setSorting(next); resetPage(); }}
          globalFilter={search}
          onGlobalFilterChange={value => { setSearch(value || ''); resetPage(); }}
          isLoading={listing.isLoading || listing.isFetching}
          enableRowSelection={false}
          getRowId={row => String(row.id)}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
        />
      </div>
      {editRequestId != null && <DemoRequestEditDialog key={editRequestId} requestId={editRequestId} userId={user?.id}
        fetchDetail={getDemoRequestDetail} updateDetail={updateDemoRequest} onClose={() => setEditRequestId(null)} onSaved={refresh} />}
      <Dialog open={deleteRequest != null} onOpenChange={open => { if (!open && !removal.isLoading) setDeleteRequest(null); }}>
        <DialogContent showCloseButton={!removal.isLoading}>
          <DialogHeader>
            <DialogTitle>Delete Demo Request</DialogTitle>
            <DialogDescription>Delete the demo request from {deleteRequest?.name || 'this person'}? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={removal.isLoading} onClick={() => setDeleteRequest(null)}>Cancel</Button>
            <Button variant="destructive" disabled={removal.isLoading} onClick={() => { if (deleteRequest) removal.mutate(deleteRequest.id); }}>{removal.isLoading ? 'Deleting...' : 'Delete'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </>;
}
