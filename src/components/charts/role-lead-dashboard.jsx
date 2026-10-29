import { dashboardEndpoint } from '../../pages/shared/services/dashboard-endpoint.js';
import React, { useState } from 'react';
import dayjs from 'dayjs';
import { useQuery } from 'react-query';
import useUserStore from '../../pages/shared/store/user-store.js';
import { getSuperAdminLeadStatusDistribution, getSuperAdminMobilisationAmounts } from '../../pages/shared/services/admin-graphs.js';
import { getSuperAdminTotalLeadsReceived } from '../../pages/shared/services/admin-total-leads.js';
import { getSuperAdminStats, dashboardStatCards } from '../../pages/dashboard/pages/admin/super-admin-stats.jsx';
import StatsCard from '../stats-card.component.jsx';
import LeadStatusDistributionChart from './lead-status-distribution-chart.component.jsx';
import TotalLeadsReceivedChart from './total-leads-received-chart.component.jsx';
import ExecutiveMobilisationAmountsChart from './executive-mobilisation-amounts-chart.component.jsx';
import { Button } from '../ui/button.jsx';
import { Select } from '../ui/app-select.jsx';

function Result({ query, children }) {
  return query.isError ? <div role="alert" className="p-4"><p>{query.error.message}</p><Button variant="outline" onClick={() => query.refetch()}>Retry</Button></div> : children;
}

export default function RoleLeadDashboard({ statsOnly = false }) {
  const { user } = useUserStore();
  const initialDates = () => [dayjs().startOf('month'), dayjs().endOf('month')];
  const [totalDates, setTotalDates] = useState(initialDates);
  const [distributionDates, setDistributionDates] = useState(initialDates);
  const [amountDates, setAmountDates] = useState(initialDates);
  const [period, setPeriod] = useState('month');
  const [source, setSource] = useState('Meta');
  const [statsScope, setStatsScope] = useState('My Stats');
  const isManager = user?.user_type === 'sales_manager';
  const key = [user?.id, user?.user_type];
  const enabled = ['company_admin', 'sales_manager', 'sales_executive'].includes(user?.user_type);
  const dates = range => ({ startDate: range?.[0]?.format('YYYY-MM-DDTHH:mm:ss'), endDate: range?.[1]?.format('YYYY-MM-DDTHH:mm:ss') });
  const stats = useQuery(['roleAccountLeadStats', ...key, isManager ? statsScope : null], () => getSuperAdminStats(
    dashboardEndpoint(isManager ? 'stats' : 'lead-stats', user?.user_type), isManager ? { order_by: statsScope } : undefined,
  ), { enabled });
  const total = useQuery(['roleAccountTotalLeads', ...key, totalDates, period], () => getSuperAdminTotalLeadsReceived({ ...dates(totalDates), period, userType: user?.user_type }), { enabled: enabled && !statsOnly });
  const distribution = useQuery(['roleAccountLeadDistribution', ...key, distributionDates, source], () => getSuperAdminLeadStatusDistribution({ ...dates(distributionDates), leadType: source, userType: user?.user_type }), { enabled: enabled && !statsOnly });
  const amounts = useQuery(['roleAccountMobilisation', ...key, amountDates], () => getSuperAdminMobilisationAmounts({ ...dates(amountDates), userType: user?.user_type }), { enabled: enabled && !statsOnly });
  const aggregated = new Map();
  ['Meta', 'Data', 'Website'].forEach(type => (amounts.data?.[type] || []).forEach(row => {
    const id = row.assigned_to_id ?? row.assigned_to_name;
    const previous = aggregated.get(id);
    aggregated.set(id, { ...row, mobilisation_amount: (previous?.mobilisation_amount || 0) + (Number(row.mobilisation_amount) || 0) });
  }));
  return <section className="space-y-4">
    {isManager && <div className="flex items-center gap-3"><label htmlFor="manager-lead-stats-scope">Lead statistics</label>
      <Select id="manager-lead-stats-scope" value={statsScope} onChange={setStatsScope} options={['My Stats', 'Executive Stats'].map(value => ({ value, label: value }))} />
    </div>}
    <Result query={stats}><div className="admin-stat-cards-grid">
      {stats.isLoading ? <p role="status">Loading lead statistics...</p> : dashboardStatCards(stats.data, { data_leads: ['Data Leads'], meta_leads: ['Meta Leads'], web_leads: ['Website Leads'], website_leads_stats: ['Website Leads'], data_leads_stats: ['Data Leads'], meta_leads_stats: ['Meta Leads'] }).map(card => <StatsCard key={card.key} title={card.title} value={card.count} percentage={card.trend} />)}
    </div></Result>
    {!statsOnly && <>
      <Result query={total}><TotalLeadsReceivedChart totalCount={total.data?.totalCount || 0} timeSeriesData={total.data?.timeSeriesData || []} selectedPeriod={period} onPeriodChange={setPeriod} showSourceFilter={false} dateRange={totalDates} onDateRangeChange={setTotalDates} isLoading={total.isLoading} /></Result>
      <Result query={distribution}><LeadStatusDistributionChart data={distribution.data || []} selectedSource={source} onSourceChange={setSource} dateRange={distributionDates} onDateRangeChange={setDistributionDates} isLoading={distribution.isLoading} /></Result>
      <Result query={amounts}><ExecutiveMobilisationAmountsChart data={[...aggregated.values()]} dateRange={amountDates} onDateRangeChange={setAmountDates} isLoading={amounts.isLoading} /></Result>
    </>}
  </section>;
}
