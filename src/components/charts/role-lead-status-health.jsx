import React, { useState } from 'react';
import dayjs from 'dayjs';
import { useQuery } from 'react-query';
import useUserStore from '../../pages/shared/store/user-store.js';
import { getLeadsStatusHealth } from '../../pages/shared/services/admin-graphs.js';
import ProjectStatusHealthHorizontalChart from './project-status-health-horizontal-chart.component.jsx';
import { Button } from '../ui/button.jsx';

export default function RoleLeadStatusHealth() {
  const { user } = useUserStore();
  const [dates, setDates] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const query = useQuery(['roleLeadStatusHealth', user?.id, user?.user_type, dates], () => getLeadsStatusHealth({
    userType: user?.user_type,
    startDate: dates?.[0]?.format('YYYY-MM-DDTHH:mm:ss'),
    endDate: dates?.[1]?.format('YYYY-MM-DDTHH:mm:ss'),
  }), { enabled: ['company_admin', 'sales_manager', 'sales_executive'].includes(user?.user_type), refetchOnWindowFocus: false });
  return <div className="chart-container">
    {query.isError ? <div role="alert" className="p-4"><p>{query.error.message}</p><Button variant="outline" onClick={() => query.refetch()}>Retry</Button></div> :
      <ProjectStatusHealthHorizontalChart title="Leads Status Health" subtitle="Meta, Data and Website leads" data={query.data || []}
        isLoading={query.isLoading} dateRange={dates} onDateRangeChange={setDates} emptyMessage="No lead status data to display" />}
  </div>;
}
