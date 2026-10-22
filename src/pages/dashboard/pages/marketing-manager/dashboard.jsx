import React, { useState } from 'react';
import { Tabs } from 'antd';
import '../../../../assets/styles/legacy/admin-dashboard-page.css';
import DonutChartWithFilters from '../../../../components/charts/donut-chart.component.jsx';
import CampaignLeadsChart from '../../../../components/charts/campaign-leads-chart.component.jsx';
import RadialProgressChart from '../../../../components/charts/radial-progress-chart.component.jsx';
import CampaignComparisonBarChart from '../../../../components/charts/campaign-comparison-bar-chart.component.jsx';
import DuplicateUniqueLeadsChart from '../../../../components/charts/duplicate-unique-leads-chart.component.jsx';
import CampaignPerformanceChart from '../../../../components/charts/campaign-performance-chart.component.jsx';
import WebsiteLeadsResourcesChart from '../../../../components/charts/website-resources-ratio-chart.component.jsx';
import WebsiteTotalVsPotentialChart from '../../../../components/charts/website-total-vs-potential-chart.component.jsx';
import ExecutiveConversionChart from '../../../../components/charts/executive-conversion-chart.component.jsx';

const ROW = { display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 };
const COL = { flex: '1 1 380px', minWidth: 320, display: 'flex' };

const MarketingManager = () => {
  const [activeLeadTab, setActiveLeadTab] = useState('meta-leads');

  const metaLeadsContent = (
    <>
      <div style={ROW}>
        <div style={COL}><DonutChartWithFilters /></div>
        <div style={COL}><RadialProgressChart /></div>
      </div>
      <div style={{ marginBottom: 16 }}><CampaignPerformanceChart /></div>
      <div style={{ marginBottom: 16 }}><CampaignLeadsChart /></div>
      <div style={{ marginBottom: 16 }}><CampaignComparisonBarChart /></div>
      <div style={{ marginBottom: 16 }}><DuplicateUniqueLeadsChart /></div>
    </>
  );

  const websiteLeadsContent = (
    <>
      <div style={ROW}>
        <div style={COL}><DonutChartWithFilters leadType="website" /></div>
        <div style={COL}><RadialProgressChart leadType="website" /></div>
      </div>
      <div style={{ marginBottom: 16 }}><DuplicateUniqueLeadsChart leadType="website" /></div>
      <div style={{ marginBottom: 16 }}><WebsiteLeadsResourcesChart /></div>
      <div style={{ marginBottom: 16 }}><WebsiteTotalVsPotentialChart /></div>
      <div style={{ marginBottom: 16 }}><ExecutiveConversionChart /></div>
    </>
  );

  const dataLeadsContent = (
    <>
      <div style={ROW}>
        <div style={COL}><DonutChartWithFilters leadType="data" /></div>
        <div style={COL}><RadialProgressChart leadType="data" /></div>
      </div>
      <div style={{ marginBottom: 16 }}><DuplicateUniqueLeadsChart leadType="data" /></div>
    </>
  );

  const leadTabItems = [
    { key: 'meta-leads', label: 'Meta Leads', children: metaLeadsContent },
    { key: 'website-leads', label: 'Website Leads', children: websiteLeadsContent },
    { key: 'data-leads', label: 'Data Leads', children: dataLeadsContent },
  ];

  return (
    <div className="dashboard-container marketing-dashboard-page">
      <Tabs
        activeKey={activeLeadTab}
        onChange={setActiveLeadTab}
        type="card"
        items={leadTabItems}
        style={{ marginBottom: '16px' }}
        tabBarStyle={{
          background: 'white',
          borderBottom: '1px solid #f0f0f0',
        }}
      />
    </div>
  );
};

export default MarketingManager;
