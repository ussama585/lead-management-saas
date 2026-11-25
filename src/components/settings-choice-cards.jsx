import React, { useState } from 'react';
import { Button, Spin } from './ui/app-controls.jsx';
import TableActionMenu, { collectTableActions } from './tables/table-action-menu.jsx';
import '../assets/styles/settings-page.css';

export default function SettingsChoiceCards({ items, kind, loading, renderActions, emptyMessage }) {
  const [page, setPage] = useState(0);
  const lastPage = Math.max(0, Math.ceil(items.length / 10) - 1);
  const currentPage = Math.min(page, lastPage);
  if (loading) return <div role="status" className="py-6 text-center"><Spin /> <span className="text-sm text-muted-foreground">Loading {kind === 'status' ? 'lead statuses' : 'project sizes'}...</span></div>;
  if (!items.length) return <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  return <>
    <ul className="settings-choice-grid" aria-label={kind === 'status' ? 'Lead statuses' : 'Project sizes'}>
      {items.slice(currentPage * 10, (currentPage + 1) * 10).map(item => <li key={item.id} className="settings-choice-card">
        <div className="settings-choice-card__content">
          <div className="min-w-0">
            <h3 className="settings-choice-card__title">{kind === 'status' ? item.name : item.value}</h3>
          </div>
        </div>
        <div className="settings-choice-card__actions"><TableActionMenu actions={collectTableActions(renderActions(item))} /></div>
      </li>)}
    </ul>
    {items.length > 10 && <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
      <span className="text-sm text-muted-foreground">{currentPage * 10 + 1}–{Math.min((currentPage + 1) * 10, items.length)} of {items.length}</span>
      <Button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</Button>
      <Button disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}>Next</Button>
    </div>}
  </>;
}
