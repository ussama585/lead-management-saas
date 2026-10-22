import React, { useEffect, useMemo, useState } from 'react';
import Chart from './apex-chart.jsx';
import { Select } from 'antd';
import { Box, CircularProgress } from '@mui/material';
import { useQuery } from 'react-query';
import dayjs from 'dayjs';
import '../../assets/styles/legacy/donut-chart.component.css'; // reuse card styles
import {
  STATUS_OPTIONS,
} from '../../pages/leads/pages/website-leads/website-leads-constants.js';
import {
  getMetaLeadsAdsetListByCampaign,
  getMetaLeadsCampaignComparison,
  getMetaLeadsCampaignNameList,
} from '../../pages/shared/services/metaLeads.js';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';

const { Option } = Select;

/**
 * Campaign Comparison (Snapshot)
 *
 * - X-axis: Statuses
 * - Y-axis: Count
 * - Controls:
 *   - 3 Campaign dropdowns (a campaign can only be selected once)
 *   - 3 Adset dropdowns (one per campaign, cascades from campaign)
 *
 * API backed:
 * GET api/meta-leads/campaign-comparison
 */
const CampaignComparisonBarChart = () => {
  const SELECT_ALL_VALUE = '__SELECT_ALL__';
  const [statusFilter, setStatusFilter] = useState(STATUS_OPTIONS);
  const [uiStatusFilter, setUiStatusFilter] = useState([SELECT_ALL_VALUE]);
  const activeStatuses =
    statusFilter && statusFilter.length > 0 ? statusFilter : STATUS_OPTIONS;

  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [showDateModal, setShowDateModal] = useState(false);

  // Keep UI dropdown value in sync with applied statusFilter
  useEffect(() => {
    const isAllSelected =
      Array.isArray(statusFilter) &&
      statusFilter.length === STATUS_OPTIONS.length &&
      STATUS_OPTIONS.every((s) => statusFilter.includes(s));

    setUiStatusFilter(isAllSelected ? [SELECT_ALL_VALUE] : (statusFilter || []));
  }, [statusFilter]);

  const { data: campaignsListData, isLoading: loadingCampaigns } = useQuery(
    ['meta-leads-campaign-name-list'],
    () => getMetaLeadsCampaignNameList(),
    {
      staleTime: 10 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const campaignNames = useMemo(() => {
    if (Array.isArray(campaignsListData)) return campaignsListData.filter(Boolean);
    if (Array.isArray(campaignsListData?.results)) return campaignsListData.results.filter(Boolean);
    if (Array.isArray(campaignsListData?.campaigns)) return campaignsListData.campaigns.filter(Boolean);
    return [];
  }, [campaignsListData]);

  // Campaign selections (ensure uniqueness via filtering in dropdown options)
  const [campaign1, setCampaign1] = useState('None');
  const [campaign2, setCampaign2] = useState('None');
  const [campaign3, setCampaign3] = useState('None');

  useEffect(() => {
    if (campaignNames.length === 0) return;
    setCampaign1((prev) => (prev !== 'None' ? prev : campaignNames[0]));
    setCampaign2((prev) => (prev !== 'None' ? prev : (campaignNames[1] || campaignNames[0])));
    setCampaign3((prev) => (prev !== 'None' ? prev : (campaignNames[2] || campaignNames[0])));
  }, [campaignNames]);

  // Adset selections per campaign
  const [adset1, setAdset1] = useState('All');
  const [adset2, setAdset2] = useState('All');
  const [adset3, setAdset3] = useState('All');

  const { data: adsets1Data, isLoading: loadingAdsets1 } = useQuery(
    ['meta-leads-adsets-by-campaign', campaign1],
    () => getMetaLeadsAdsetListByCampaign(campaign1),
    { enabled: Boolean(campaign1 && campaign1 !== 'None'), staleTime: 5 * 60 * 1000, cacheTime: 30 * 60 * 1000, refetchOnWindowFocus: false }
  );
  const { data: adsets2Data, isLoading: loadingAdsets2 } = useQuery(
    ['meta-leads-adsets-by-campaign', campaign2],
    () => getMetaLeadsAdsetListByCampaign(campaign2),
    { enabled: Boolean(campaign2 && campaign2 !== 'None'), staleTime: 5 * 60 * 1000, cacheTime: 30 * 60 * 1000, refetchOnWindowFocus: false }
  );
  const { data: adsets3Data, isLoading: loadingAdsets3 } = useQuery(
    ['meta-leads-adsets-by-campaign', campaign3],
    () => getMetaLeadsAdsetListByCampaign(campaign3),
    { enabled: Boolean(campaign3 && campaign3 !== 'None'), staleTime: 5 * 60 * 1000, cacheTime: 30 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const adsetsForCampaign = (campaignName, adsetsData) => {
    if (!campaignName || campaignName === 'None') return ['All'];
    const list = Array.isArray(adsetsData?.adsets) ? adsetsData.adsets : [];
    const names = list.map((x) => x?.adset_name).filter(Boolean);
    return ['All', ...names];
  };

  const comparisonParams = useMemo(() => {
    const params = {};

    const anyCampaign =
      (campaign1 && campaign1 !== 'None') ||
      (campaign2 && campaign2 !== 'None') ||
      (campaign3 && campaign3 !== 'None');
    if (!anyCampaign) return params;

    if (campaign1 && campaign1 !== 'None') {
      params.campaign1 = campaign1;
      params.adset1 = (!adset1 || adset1 === 'All') ? 'all' : adset1;
    }
    if (campaign2 && campaign2 !== 'None') {
      params.campaign2 = campaign2;
      params.adset2 = (!adset2 || adset2 === 'All') ? 'all' : adset2;
    }
    if (campaign3 && campaign3 !== 'None') {
      params.campaign3 = campaign3;
      params.adset3 = (!adset3 || adset3 === 'All') ? 'all' : adset3;
    }

    if (activeStatuses && activeStatuses.length > 0) {
      params.status = activeStatuses.join(',');
    }

    if (dateRange?.[0] && dateRange?.[1]) {
      params.from = dateRange[0].startOf('day').format('YYYY-MM-DDTHH:mm:ssZ');
      params.to = dateRange[1].endOf('day').format('YYYY-MM-DDTHH:mm:ssZ');
    }

    return params;
  }, [campaign1, campaign2, campaign3, adset1, adset2, adset3, activeStatuses, dateRange]);

  const {
    data: comparisonData,
    isLoading: loadingComparison,
    isError: isComparisonError,
  } = useQuery(
    ['meta-leads-campaign-comparison', comparisonParams],
    () => getMetaLeadsCampaignComparison(comparisonParams),
    {
      enabled: Object.keys(comparisonParams).length > 0,
      staleTime: 0,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const toKey = (v) =>
    String(v ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_');

  const alignedCategories = useMemo(() => {
    return (activeStatuses && activeStatuses.length > 0 ? activeStatuses : STATUS_OPTIONS);
  }, [activeStatuses]);

  const series = useMemo(() => {
    const apiStatuses = Array.isArray(comparisonData?.statuses) ? comparisonData.statuses : [];
    const apiKeys = apiStatuses.map(toKey);
    const indexByKey = new Map();
    apiKeys.forEach((k, idx) => {
      if (!indexByKey.has(k)) indexByKey.set(k, idx);
    });

    const rawSeries = Array.isArray(comparisonData?.series) ? comparisonData.series : [];
    if (rawSeries.length === 0) {
      return [{ name: 'Leads', data: Array(alignedCategories.length).fill(0) }];
    }

    return rawSeries.map((s) => {
      const name = s?.name ?? s?.campaignId ?? 'Campaign';
      const data = Array.isArray(s?.data) ? s.data : [];
      const aligned = alignedCategories.map((status) => {
        const idx = indexByKey.get(toKey(status));
        const v = idx === undefined ? 0 : Number(data[idx] ?? 0);
        return Number.isFinite(v) ? v : 0;
      });
      return { name, data: aligned };
    });
  }, [comparisonData, alignedCategories]);

  const handleStatusChange = (values) => {
    const v = Array.isArray(values) ? values : [];
    const hasSelectAll = v.includes(SELECT_ALL_VALUE);
    const currentlyHasSelectAll = uiStatusFilter.includes(SELECT_ALL_VALUE);
    
    // Filter out SELECT_ALL_VALUE to get only individual items
    const individualItems = v.filter(item => item !== SELECT_ALL_VALUE);

    // If "Select All" is currently selected and user clicks an individual item
    // (either by deselecting "Select All" or adding an individual item)
    // Clear "Select All" and allow individual selection
    if (currentlyHasSelectAll && individualItems.length > 0) {
      setUiStatusFilter(individualItems);
      setStatusFilter(individualItems);
      return;
    }

    // If user selects "Select All" (with or without other items)
    // Only keep "Select All" and clear other selections
    if (hasSelectAll || v.length === 0) {
      setUiStatusFilter([SELECT_ALL_VALUE]);
      setStatusFilter(STATUS_OPTIONS);
      return;
    }

    // Normal individual selection (when "Select All" is not selected)
    setUiStatusFilter(v);
    setStatusFilter(v);
  };

  const options = {
    chart: {
      type: 'bar',
      stacked: false,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%', // wider bars
        borderRadius: 6,
        dataLabels: {
          position: 'top', // push labels to the top of each bar
        },
      },
    },
    dataLabels: {
      enabled: true, // show value on top of bar
      formatter: (val) =>
        typeof val === 'number' && !Number.isNaN(val) ? val.toFixed(0) : '-',
      style: {
        colors: ['#595959'],
        fontSize: '11px',
      },
      offsetY: -20, // place labels clearly above the bar
    },
    xaxis: {
      categories: alignedCategories,
      labels: {
        style: {
          colors: '#B0B0B0',
          fontSize: '11px',
        },
        hideOverlappingLabels: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#B0B0B0',
          fontSize: '12px',
        },
      },
    },
    legend: {
      position: 'top',
      labels: {
        colors: '#555',
      },
    },
    grid: {
      borderColor: '#e0e0e0',
      padding: {
        top: 40,    // extra space so labels above bars are visible
        bottom: 200,
      },
    },
    colors: ['#3E6A9F', '#52c41a', '#faad14'],
    tooltip: {
      y: {
        formatter: (val) =>
          typeof val === 'number' && !Number.isNaN(val) ? val : '-',
      },
    },
  };

  return (
    <div className="donut-chart-card" style={{ paddingBottom: 40 }}>
      <h2 className="donut-chart-title" style={{ marginBottom: 16 }}>Campaign Comparison (Snapshot)</h2>

      {/* Full-width filter section: Date + Status on first row */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        gap: 6,
        marginBottom: 6,
        padding: '6px 0',
        borderBottom: '1px solid #f0f0f0',
      }}>
        <div className="donut-chart-filter-group">
          <span className="donut-chart-filter-label">Date range</span>
          <BootstrapDateRangeModal
            value={dateRange}
            showModal={showDateModal}
            setShowModal={setShowDateModal}
            onDone={(range) => {
              setDateRange(range);
              setShowDateModal(false);
            }}
            triggerStyle={{ border: '1px solid #d9d9d9' }}
          />
        </div>
        <div className="donut-chart-filter-group">
          <span className="donut-chart-filter-label">Status</span>
          <Select
            mode="multiple"
            value={uiStatusFilter}
            onChange={handleStatusChange}
            style={{ minWidth: 220 }}
            placeholder="Select statuses"
            maxTagCount={0}
          >
            <Option key={SELECT_ALL_VALUE} value={SELECT_ALL_VALUE}>
              Select All
            </Option>
            {STATUS_OPTIONS.map((status) => (
              <Option key={status} value={status}>
                {status}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      {/* Three campaigns in equal columns - uses full width */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 20,
        maxWidth: '100%',
      }}>
        <div className="donut-chart-filter-group">
          <span className="donut-chart-filter-label">Campaign 1</span>
          <Select
            value={campaign1}
            style={{ width: '100%', minWidth: 0 }}
            onChange={(value) => {
              setCampaign1(value);
              setAdset1('All');
            }}
            loading={loadingCampaigns}
          >
            <Option key="None" value="None">None</Option>
            {campaignNames
              .filter(
                (name) =>
                  name === campaign1 ||
                  (name !== campaign2 && name !== campaign3)
              )
              .map((name) => (
                <Option key={name} value={name}>{name}</Option>
              ))}
          </Select>
          <Select
            value={adset1}
            style={{ width: '100%', minWidth: 0, marginTop: 6 }}
            onChange={(value) => setAdset1(value)}
            loading={loadingAdsets1}
            disabled={!campaign1 || campaign1 === 'None'}
          >
            {adsetsForCampaign(campaign1, adsets1Data).map((name) => (
              <Option key={name} value={name}>{name}</Option>
            ))}
          </Select>
        </div>

        <div className="donut-chart-filter-group">
          <span className="donut-chart-filter-label">Campaign 2</span>
          <Select
            value={campaign2}
            style={{ width: '100%', minWidth: 0 }}
            onChange={(value) => {
              setCampaign2(value);
              setAdset2('All');
            }}
            loading={loadingCampaigns}
          >
            <Option key="None" value="None">None</Option>
            {campaignNames
              .filter(
                (name) =>
                  name === campaign2 ||
                  (name !== campaign1 && name !== campaign3)
              )
              .map((name) => (
                <Option key={name} value={name}>{name}</Option>
              ))}
          </Select>
          <Select
            value={adset2}
            style={{ width: '100%', minWidth: 0, marginTop: 6 }}
            onChange={(value) => setAdset2(value)}
            loading={loadingAdsets2}
            disabled={!campaign2 || campaign2 === 'None'}
          >
            {adsetsForCampaign(campaign2, adsets2Data).map((name) => (
              <Option key={name} value={name}>{name}</Option>
            ))}
          </Select>
        </div>

        <div className="donut-chart-filter-group">
          <span className="donut-chart-filter-label">Campaign 3</span>
          <Select
            value={campaign3}
            style={{ width: '100%', minWidth: 0 }}
            onChange={(value) => {
              setCampaign3(value);
              setAdset3('All');
            }}
            loading={loadingCampaigns}
          >
            <Option key="None" value="None">None</Option>
            {campaignNames
              .filter(
                (name) =>
                  name === campaign3 ||
                  (name !== campaign1 && name !== campaign2)
              )
              .map((name) => (
                <Option key={name} value={name}>{name}</Option>
              ))}
          </Select>
          <Select
            value={adset3}
            style={{ width: '100%', minWidth: 0, marginTop: 6 }}
            onChange={(value) => setAdset3(value)}
            loading={loadingAdsets3}
            disabled={!campaign3 || campaign3 === 'None'}
          >
            {adsetsForCampaign(campaign3, adsets3Data).map((name) => (
              <Option key={name} value={name}>{name}</Option>
            ))}
          </Select>
        </div>
      </div>
      {loadingCampaigns || loadingComparison ? (
        <Box sx={{ height: 710, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={44} sx={{ color: '#3E6A9F' }} />
        </Box>
      ) : isComparisonError ? (
        <div style={{ padding: 16 }}>Failed to load comparison data.</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={710} />
      )}
    </div>
  );
};

export default CampaignComparisonBarChart;


