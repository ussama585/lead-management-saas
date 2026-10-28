import React from 'react';
import { useQuery } from 'react-query';
import { Building2, Users, UserCog, UserPlus, UserStar, Database, Globe, Webhook } from 'lucide-react';
import api from '../../../shared/services/api.js';
import StatsCard from '../../../../components/stats-card.component.jsx';
import { Button } from '../../../../components/ui/button.jsx';

export async function getSuperAdminStats(endpoint) {
  const { data } = await api.get(endpoint);
  if (!data || typeof data !== 'object' || Array.isArray(data) || data.success === false || data.status === false) {
    throw new Error(data?.message || 'Could not load dashboard stats.');
  }
  return data;
}

const hrLabels = {
  company_stats: ['Companies', Building2], user_stats: ['Total Users', Users],
  company_admin_stats: ['Company Admins', UserCog], sales_manager_stats: ['Sales Managers', UserPlus],
  sales_executive_stats: ['Sales Executives', UserStar], data_entry_executive_stats: ['Data Entry Executives', Database],
  data_entry_executive: ['Data Entry Executives', Database],
};
const leadLabels = { data_leads: ['Data Leads', Database], meta_leads: ['Meta Leads', Webhook], web_leads: ['Website Leads', Globe] };

export function dashboardStatCards(data, labels) {
  return Object.entries(data || {}).filter(([, value]) => value && typeof value === 'object' && Number.isFinite(Number(value.count)) && value.count != null)
    .map(([key, value]) => ({ key, title: labels[key]?.[0] || key.replace(/_stats$/, '').replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()),
      Icon: labels[key]?.[1] || Users, count: Number(value.count), trend: value.trend }));
}

function StatsSection({ title, endpoint, queryKey, labels, userId }) {
  const query = useQuery([queryKey, userId], () => getSuperAdminStats(endpoint), { refetchOnWindowFocus: false, staleTime: 60000 });
  const cards = dashboardStatCards(query.data, labels);
  return <section className="mb-6" aria-label={title}>
    <h2 className="admin-dashboard-section-heading">{title}</h2>
    {query.isLoading ? <div className="admin-stat-cards-grid" role="status" aria-label={`Loading ${title} stats`}>
      {[0, 1, 2].map(key => <div key={key} className="h-32 animate-pulse rounded-lg bg-muted" />)}
    </div> : query.isError ? <div role="alert" className="flex items-center gap-3 rounded-md border p-4 text-destructive">
      <span>{query.error?.message || `Could not load ${title} stats.`}</span><Button variant="outline" onClick={() => query.refetch()}>Retry</Button>
    </div> : cards.length ? <div className="admin-stat-cards-grid">
      {cards.map(({ key, title: cardTitle, Icon, count, trend }) => <StatsCard key={key} title={cardTitle} value={count} percentage={trend} icon={<Icon className="size-8" />} />)}
    </div> : <p className="text-muted-foreground">No statistics available.</p>}
  </section>;
}

export default function SuperAdminStats({ userId }) {
  return <>
    <StatsSection title="HR Management" endpoint="/accounts/stats" queryKey="superAdminUserStats" labels={hrLabels} userId={userId} />
    <StatsSection title="Leads" endpoint="/accounts/lead-stats" queryKey="superAdminLeadStats" labels={leadLabels} userId={userId} />
  </>;
}
