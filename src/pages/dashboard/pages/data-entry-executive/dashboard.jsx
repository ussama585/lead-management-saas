import React, { useState } from 'react';
import StatsCard from '../../../../components/stats-card.component.jsx';
import { Row, Col, Select } from 'antd';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { getDataEntryExecutiveStats, getDataEntryExecutiveGraphStats } from '../../../shared/services/data-entry-service.js';
import LineChart from '../../../../components/charts/line-chart.component.jsx';

const { Option } = Select;

const DataEntryExecutiveDashboard = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('week'); // default filter

  const { data, isLoading } = useQuery('data-entry-executive-stats', getDataEntryExecutiveStats);

  const { data: graphData, isLoading: loadingGraph } = useQuery(
    ['data-entry-executive-graph-stats', filter],
    () => getDataEntryExecutiveGraphStats({ filter }),
    { keepPreviousData: true }
  );

  const allStat = data?.all;
  const todayStat = data?.today;
  const totalLeads = typeof allStat === 'object' && allStat != null && 'count' in allStat ? allStat.count : allStat ?? 0;
  const leadsToday = typeof todayStat === 'object' && todayStat != null && 'count' in todayStat ? todayStat.count : todayStat ?? 0;
  const totalTrend = typeof allStat === 'object' && allStat != null && 'trend' in allStat ? allStat.trend : undefined;
  const todayTrend = typeof todayStat === 'object' && todayStat != null && 'trend' in todayStat ? todayStat.trend : undefined;

  const chartDates = graphData?.data?.dates || [];
  const chartTotal = graphData?.data?.total || [];
  const chartToday = graphData?.data?.today || [];

  return (
    <>
      <BreadCrumb linkText="Dashboard" />
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Sales Data Executive Dashboard</h2>
          <Select value={filter} onChange={setFilter} style={{ width: 150 }}>
            <Option value="week">Week</Option>
            <Option value="month">Month</Option>
            <Option value="year">Year</Option>
          </Select>
        </div>

        <Row gutter={16} style={{ marginBottom: 32 }}>
          <Col>
            <StatsCard title="Total Data Entered" value={isLoading ? '...' : totalLeads} percentage={totalTrend} borderColor="#3E6A9F" />
          </Col>
          <Col>
            <StatsCard title="Data Entered Today" value={isLoading ? '...' : leadsToday} percentage={todayTrend} borderColor="#27ae60" />
          </Col>
        </Row>

        <div style={{ marginBottom: 32 }}>
          <LineChart
            title="Sales Data Stats"
            data={{ total: chartTotal, today: chartToday }}
            categories={chartDates}
            legendNames={['Total', 'Today']}
            colors={["#3E6A9F", "#27ae60"]}
            initialTimeFrame={filter}
            onTimeFrameChange={setFilter}
          />
        </div>
      </div>
    </>
  );
};

export default DataEntryExecutiveDashboard;
