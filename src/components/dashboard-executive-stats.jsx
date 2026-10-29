import React from 'react';
import { useQuery } from 'react-query';
import useUserStore from '../pages/shared/store/user-store.js';
import { getDashboardExecutiveStats } from '../pages/shared/services/dashboard-executive-stats.js';
import StatsCard from './stats-card.component.jsx';
import { Button } from './ui/button.jsx';
import { Avatar, AvatarFallback } from './ui/avatar.jsx';

export default function DashboardExecutiveStats() {
  const { user } = useUserStore();
  const query = useQuery(['dashboardExecutiveStats', user?.id, user?.user_type], getDashboardExecutiveStats, {
    enabled: user?.user_type === 'sales_manager', refetchOnWindowFocus: false,
  });
  return <section className="my-4 space-y-4" aria-label="Sales executive stats">
    {query.isLoading ? <p role="status">Loading executive stats...</p> : query.isError ?
      <div role="alert"><p>{query.error.message}</p><Button variant="outline" onClick={() => query.refetch()}>Retry</Button></div> : query.data && <>
        <div className="admin-stat-cards-grid"><StatsCard title="Sales Executives" value={query.data.total_executives} /></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.executives.map(executive => <div key={executive.id} className="flex min-w-0 items-center gap-3 rounded-md border p-4">
            <Avatar><AvatarFallback>{executive.name?.trim().charAt(0).toUpperCase() || '?'}</AvatarFallback></Avatar>
            <div className="min-w-0"><p className="font-medium">{executive.name || 'Not available'}</p><p className="break-all text-xs text-muted-foreground">{executive.email || 'Not available'}</p></div>
          </div>)}
        </div>
      </>}
  </section>;
}
