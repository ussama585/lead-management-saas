import React from 'react';
import { useQuery } from 'react-query';
import { Alert } from 'antd';
import { Activity, ArrowRight, CalendarDays, FileText, History, Layers3 } from 'lucide-react';
import { Modal } from './ui/app-modal.jsx';
import { Button, Spin } from './ui/app-controls.jsx';
import api from '../pages/shared/services/api.js';
import useUserStore from '../pages/shared/store/user-store.js';
import formatDateUniversal from '../pages/shared/utils/formatDate.js';

export async function getActivityDetail(changeId) {
  if (!changeId) throw new Error('An activity change ID is required.');
  const { data } = await api.get(`/activity/detail/${encodeURIComponent(changeId)}`);
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not load activity details.');
  if (!data?.data || typeof data.data !== 'object' || !data.data.change_id) throw new Error('Could not read activity details.');
  return data.data;
}

const display = value => value == null || value === '' ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value);

export default function ActivityDetailModal({ changeId, onClose }) {
  const { user } = useUserStore();
  const detail = useQuery(['activityDetail', user?.id, user?.user_type, changeId], () => getActivityDetail(changeId), {
    enabled: Boolean(changeId), refetchOnWindowFocus: false,
  });
  const activity = detail.data;
  const fields = Array.isArray(activity?.fields) ? activity.fields : [];
  const initials = (activity?.changed_by_name || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  return <Modal title={<span className="flex items-center gap-3 pr-8"><span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Activity size={20} /></span><span>Activity details<span className="mt-0.5 block text-xs font-normal text-muted-foreground">A complete record of this change</span></span></span>}
    open={Boolean(changeId)} onCancel={onClose} width={900}
    footer={<div className="flex w-full items-center justify-between gap-3 border-t pt-4"><span className="flex items-center gap-2 text-xs text-muted-foreground"><History size={14} />Activity audit trail</span><Button type="primary" onClick={onClose}>Done</Button></div>}>
    {detail.isLoading ? <div className="py-6 text-center"><Spin /></div> : detail.isError
      ? <Alert type="error" showIcon message={detail.error?.response?.data?.message || detail.error?.message || 'Could not load activity details.'}
        action={<Button onClick={() => detail.refetch()} loading={detail.isFetching}>Retry</Button>} />
      : activity && <div className="grid gap-5 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"><Layers3 size={13} />{display(activity.model_name)}</span>
          <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">Record #{display(activity.object_id)}</span>
        </div>
        <div className="grid gap-4 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-100">{initials}</span>
            <div className="min-w-0"><p className="mb-1 text-xs text-muted-foreground">Changed by</p><p className="break-words text-sm font-semibold">{display(activity.changed_by_name)}</p><p className="mt-0.5 break-all text-xs text-muted-foreground">{display(activity.changed_by_email)}</p></div>
          </div>
          <div className="flex items-center gap-3 sm:justify-self-end">
            <CalendarDays size={18} className="shrink-0 text-muted-foreground" />
            <div><p className="mb-1 text-xs text-muted-foreground">Date & time</p><p className="text-sm font-medium">{activity.changed_at ? formatDateUniversal(activity.changed_at, true) : '—'}</p></div>
          </div>
        </div>
        <section className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><FileText size={16} className="text-blue-600 dark:text-blue-300" />Summary</h3>
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground/80">{display(activity.summary)}</p>
        </section>
        <section aria-label="Field changes">
          <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">Field changes</h3><span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{fields.length} {fields.length === 1 ? 'field' : 'fields'}</span></div>
          <div className="overflow-hidden rounded-xl border">
            {fields.length ? fields.map((field, index) => <div key={index} className="border-b p-4 last:border-b-0">
              <h4 className="mb-3 text-sm font-medium">{display(field.field_name)}</h4>
              <div className="grid min-w-0 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
                <div className="min-w-0 rounded-lg border bg-muted/35 p-3"><p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Previous value</p><p className="whitespace-pre-wrap break-words text-sm leading-6">{display(field.old_value)}</p></div>
                <ArrowRight size={16} className="mx-auto my-1 rotate-90 self-center text-muted-foreground sm:mx-1 sm:rotate-0" aria-hidden="true" />
                <div className="min-w-0 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900 dark:bg-emerald-950/30"><p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">New value</p><p className="whitespace-pre-wrap break-words text-sm leading-6">{display(field.new_value)}</p></div>
              </div>
            </div>) : <p className="p-6 text-center text-sm text-muted-foreground">No field changes recorded.</p>}
          </div>
        </section>
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground"><span>Change ID</span><span className="break-all font-mono">{activity.change_id}</span></div>
      </div>}
  </Modal>;
}
