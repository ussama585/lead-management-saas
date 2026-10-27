import { Select } from '../ui/app-select.jsx';
import React, { useEffect, useMemo, useState } from 'react';
import Chart from './apex-chart.jsx';

import { Box, CircularProgress } from '@mui/material';
import { useQuery } from 'react-query';
import dayjs from 'dayjs';
import '../../assets/styles/legacy/donut-chart.component.css'; // reuse card styles
import {
  STATUS_OPTIONS,
} from '../../pages/leads/pages/website-leads/website-leads-constants.js';
import {
  getMetaLeadsAdsetListByCampaign,
  getMetaLeadsAdsListByAdset,
  getMetaLeadsCampaignLeads,
  getMetaLeadsCampaignNameList,
} from '../../pages/shared/services/metaLeads.js';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';

const { Option } = Select;

/**
 * Campaign leads chart powered by Meta Leads APIs.
 * API: GET api/meta-leads/campaign-leads
 * Params: campaign, adset, from, to, status (optional)
 */
const CampaignLeadsChart = () => {
  const SELECT_ALL_VALUE = '__SELECT_ALL__';
  const [statusFilter, setStatusFilter] = useState(STATUS_OPTIONS);
  const [uiStatusFilter, setUiStatusFilter] = useState([SELECT_ALL_VALUE]);
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedAdset, setSelectedAdset] = useState('All');
  const [selectedAd, setSelectedAd] = useState('All');
  const [selectedCampaign, setSelectedCampaign] = useState(null);

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

  useEffect(() => {
    if (!selectedCampaign && campaignNames.length > 0) {
      setSelectedCampaign(campaignNames[0]);
    }
  }, [campaignNames, selectedCampaign]);

  const {
    data: adsetsByCampaign,
    isLoading: loadingAdsets,
  } = useQuery(
    ['meta-leads-adsets-by-campaign', selectedCampaign],
    () => getMetaLeadsAdsetListByCampaign(selectedCampaign),
    {
      enabled: Boolean(selectedCampaign),
      staleTime: 5 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const adsetNames = useMemo(() => {
    const list = Array.isArray(adsetsByCampaign?.adsets) ? adsetsByCampaign.adsets : [];
    const names = list.map((x) => x?.adset_name).filter(Boolean);
    return ['All', ...names];
  }, [adsetsByCampaign]);

  const {
    data: adsByAdset,
    isLoading: loadingAds,
  } = useQuery(
    ['meta-leads-ads-by-adset', selectedCampaign, selectedAdset],
    () => {
      const adsetNameForAPI = selectedAdset && selectedAdset !== 'All' ? selectedAdset : 'Unnamed';
      return getMetaLeadsAdsListByAdset(adsetNameForAPI, selectedCampaign);
    },
    {
      enabled: Boolean(selectedCampaign) && Boolean(selectedAdset) && selectedAdset !== 'All',
      staleTime: 5 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const adNames = useMemo(() => {
    const list = Array.isArray(adsByAdset?.ads) ? adsByAdset.ads : [];
    const names = list.map((x) => x?.ad_name).filter(Boolean);
    return ['All', ...names];
  }, [adsByAdset]);

  const campaignLeadsParams = useMemo(() => {
    const params = {};

    if (selectedCampaign) params.campaign = selectedCampaign;
    if (selectedAdset && selectedAdset !== 'All') params.adset = selectedAdset;
    if (selectedAd && selectedAd !== 'All') {
      // backend may support either key; include both to be safe
      params.ad = selectedAd;
      params.ad_name = selectedAd;
    }

    // Date range uses from/to with full datetime + timezone
    if (dateRange?.[0] && dateRange?.[1]) {
      params.from = dateRange[0].startOf('day').format('YYYY-MM-DDTHH:mm:ssZ');
      params.to = dateRange[1].endOf('day').format('YYYY-MM-DDTHH:mm:ssZ');
    }

    // Only send status when user filters (otherwise backend can return full distribution)
    const activeStatuses =
      Array.isArray(statusFilter) && statusFilter.length > 0
        ? statusFilter
        : STATUS_OPTIONS;
    const isAllSelected =
      activeStatuses.length === STATUS_OPTIONS.length &&
      STATUS_OPTIONS.every((s) => activeStatuses.includes(s));
    if (!isAllSelected) {
      params.status = activeStatuses.join(', ');
    }

    return params;
  }, [selectedCampaign, selectedAdset, selectedAd, dateRange, statusFilter]);

  const {
    data: campaignLeadsData,
    isLoading: loadingChart,
    isError: isChartError,
  } = useQuery(
    ['meta-leads-campaign-leads', campaignLeadsParams],
    () => getMetaLeadsCampaignLeads(campaignLeadsParams),
    {
      enabled: Boolean(selectedCampaign),
      staleTime: 0,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const normalizeLabel = (v) => {
    if (typeof v === 'string') {
      const trimmed = v.trim();
      return trimmed ? trimmed : 'Not Set';
    }
    return v == null ? 'Not Set' : String(v);
  };

  const wrapLabel = (value, maxLen = 26) => {
    const s = normalizeLabel(value);
    if (!s || s.length <= maxLen) return s;

    // Prefer breaking on " - " to keep status readable
    const dashIdx = s.indexOf(' - ');
    if (dashIdx > 0 && dashIdx < maxLen + 8) {
      return `${s.slice(0, dashIdx)}\n${s.slice(dashIdx + 3)}`;
    }

    // Otherwise break at nearest space
    const spaceIdx = s.lastIndexOf(' ', maxLen);
    if (spaceIdx > 0) {
      return `${s.slice(0, spaceIdx)}\n${s.slice(spaceIdx + 1)}`;
    }

    return `${s.slice(0, maxLen)}\n${s.slice(maxLen)}`;
  };

  // Always use selected statuses (or all statuses) on x-axis,
  // and map API data onto those statuses (fill missing with 0).
  const categories = useMemo(() => {
    const active =
      Array.isArray(statusFilter) && statusFilter.length > 0 ? statusFilter : STATUS_OPTIONS;
    return active.map(normalizeLabel);
  }, [statusFilter]);

  const series = useMemo(() => {
    const apiStatuses = Array.isArray(campaignLeadsData?.statuses)
      ? campaignLeadsData.statuses.map(normalizeLabel)
      : [];

    const indexByStatus = new Map();
    apiStatuses.forEach((s, idx) => {
      if (!indexByStatus.has(s)) indexByStatus.set(s, idx);
    });

    const rawSeries = Array.isArray(campaignLeadsData?.series) ? campaignLeadsData.series : [];
    const normalizedSeries = rawSeries.map((s) => ({
      name: s?.name ?? 'Leads',
      data: Array.isArray(s?.data) ? s.data : [],
    }));

    const base = normalizedSeries.length > 0 ? normalizedSeries : [{ name: 'Leads', data: [] }];

    return base.map((s) => {
      const aligned = categories.map((status) => {
        const idx = indexByStatus.get(status);
        const v = idx === undefined ? 0 : Number(s.data?.[idx] ?? 0);
        return Number.isFinite(v) ? v : 0;
      });
      return { ...s, data: aligned };
    });
  }, [campaignLeadsData, categories]);

  const totalLeads = useMemo(() => {
    if (!series?.length) return 0;
    return series.reduce((sum, s) => sum + (Array.isArray(s.data) ? s.data.reduce((a, b) => a + (Number(b) || 0), 0) : 0), 0);
  }, [series]);

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

  // Keep UI dropdown value in sync with applied statusFilter
  useEffect(() => {
    const isAllSelected =
      Array.isArray(statusFilter) &&
      statusFilter.length === STATUS_OPTIONS.length &&
      STATUS_OPTIONS.every((s) => statusFilter.includes(s));

    setUiStatusFilter(isAllSelected ? [SELECT_ALL_VALUE] : (statusFilter || []));
  }, [statusFilter]);

  const options = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 6,
        distributed: true, // colorful bars per category
      },
    },
    xaxis: {
      categories,
      labels: {
        show: true,
        rotate: -45,
        rotateAlways: true,
        hideOverlappingLabels: false,
        trim: false,
        style: {
          colors: '#B0B0B0',
          fontSize: '11px',
        },
        formatter: (val) => wrapLabel(val),
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
    dataLabels: {
      enabled: true,
      formatter: (val) => (typeof val === 'number' ? val.toFixed(0) : val),
    },
    legend: {
      show: false, // hide legend / colored label row
    },
    colors: ['#3E6A9F', '#52c41a', '#faad14', '#ff4d4f', '#13c2c2', '#722ed1'],
    grid: {
      borderColor: '#e0e0e0',
      padding: {
        top: 40,    // extra space so labels above bars are visible
        bottom: 200,
      },
    },
    tooltip: {
      y: {
        formatter: (value) => `${value} leads`,
      },
    },
  };

  return (
    <div className="donut-chart-card">
      <h2 className="donut-chart-title" style={{ marginBottom: 16 }}>
        Meta Campaign Leads {selectedCampaign && !loadingChart && !isChartError && totalLeads > 0 ? `(Leads: ${totalLeads})` : ''}
      </h2>

      {/* Top row: Date range + Status */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          gap: 6,
          marginBottom: 6,
          padding: '6px 0',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
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
            maxTagCount={0} // behave like Top Performing Campaigns: hide colored tags in input
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

      {/* Second row: Campaign / Adset / Ad in equal columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 20,
          maxWidth: '100%',
          marginBottom: 8,
        }}
      >
        {/* Campaign dropdown */}
        <div className="donut-chart-filter-group">
          <span className="donut-chart-filter-label">Campaign</span>
          <Select
            value={selectedCampaign || undefined}
            onChange={(value) => {
              setSelectedCampaign(value);
              setSelectedAdset('All');
              setSelectedAd('All');
            }}
            style={{ width: '100%', minWidth: 0 }}
            loading={loadingCampaigns}
          >
            {campaignNames.map((name) => (
              <Option key={name} value={name}>
                {name}
              </Option>
            ))}
          </Select>
        </div>

        {/* Adset dropdown (cascades from campaign) */}
        <div className="donut-chart-filter-group">
          <span className="donut-chart-filter-label">Adset</span>
          <Select
            value={selectedAdset}
            onChange={(value) => {
              setSelectedAdset(value);
              setSelectedAd('All');
            }}
            style={{ width: '100%', minWidth: 0 }}
            loading={loadingAdsets}
            disabled={!selectedCampaign}
          >
            {adsetNames.map((name) => (
              <Option key={name} value={name}>
                {name}
              </Option>
            ))}
          </Select>
        </div>

        {/* Ad dropdown (cascades from adset) */}
        <div className="donut-chart-filter-group">
          <span className="donut-chart-filter-label">Ad</span>
          <Select
            value={selectedAd}
            onChange={(value) => setSelectedAd(value)}
            style={{ width: '100%', minWidth: 0 }}
            loading={loadingAds}
            disabled={!selectedCampaign || !selectedAdset || selectedAdset === 'All'}
          >
            {adNames.map((name) => (
              <Option key={name} value={name}>
                {name}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      {loadingCampaigns || !selectedCampaign || loadingChart ? (
        <Box sx={{ height: 710, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={44} sx={{ color: '#3E6A9F' }} />
        </Box>
      ) : isChartError ? (
        <div style={{ padding: 16 }}>Failed to load campaign leads data.</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={710} />
      )}
    </div>
  );
};

export default CampaignLeadsChart;


