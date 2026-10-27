import { Select } from '../ui/app-select.jsx';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Chart from './apex-chart.jsx';

import { Box, CircularProgress } from '@mui/material';
import { useQuery } from 'react-query';
import dayjs from 'dayjs';
import '../../assets/styles/legacy/donut-chart.component.css'; // reuse card/card-header styles
import { getMetaLeadsCampaignNameList, getMetaLeadsTopPerformingCampaigns } from '../../pages/shared/services/metaLeads.js';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';

const { Option } = Select;

const SELECT_ALL_VALUE = '__SELECT_ALL__';

const CampaignPerformanceChart = () => {
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [showDateModal, setShowDateModal] = useState(false);
  // Applied selection (debounced) used for querying/chart.
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  // Immediate UI selection from dropdown; default to Select All.
  const [uiSelectedCampaigns, setUiSelectedCampaigns] = useState([SELECT_ALL_VALUE]);
  const debounceTimerRef = useRef(null);

  const { data: campaignsListData } = useQuery(
    ['meta-leads-campaign-name-list'],
    () => getMetaLeadsCampaignNameList(),
    { staleTime: 10 * 60 * 1000, cacheTime: 30 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const campaignOptions = useMemo(() => {
    // API shape varies; normalize to array of strings
    if (Array.isArray(campaignsListData)) return campaignsListData.filter(Boolean);
    if (Array.isArray(campaignsListData?.results)) return campaignsListData.results.filter(Boolean);
    if (Array.isArray(campaignsListData?.campaigns)) return campaignsListData.campaigns.filter(Boolean);
    return [];
  }, [campaignsListData]);

  // Debounce dropdown changes before applying (prevents refetch on every click).
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      const hasSelectAll = uiSelectedCampaigns.includes(SELECT_ALL_VALUE);
      const applied = hasSelectAll ? campaignOptions : uiSelectedCampaigns;
      setSelectedCampaigns(applied);
    }, 450);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [uiSelectedCampaigns, campaignOptions]);

  const topParams = useMemo(() => {
    const params = {};

    if (dateRange?.[0] && dateRange?.[1]) {
      params.from = dateRange[0].startOf('day').format('YYYY-MM-DDTHH:mm:ssZ');
      params.to = dateRange[1].endOf('day').format('YYYY-MM-DDTHH:mm:ssZ');
    }

    if (selectedCampaigns.length > 0) {
      params.campaign = selectedCampaigns.join(', ');
    }

    return params;
  }, [dateRange, selectedCampaigns]);

  const hasSelection = selectedCampaigns.length > 0;

  const {
    data: topCampaignsData,
    isLoading,
    isError,
  } = useQuery(
    ['meta-leads-top-performing-campaigns', topParams],
    () => getMetaLeadsTopPerformingCampaigns(topParams),
    { enabled: hasSelection, staleTime: 0, cacheTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const rows = useMemo(() => {
    if (!hasSelection) return [];
    const data = topCampaignsData?.series?.[0]?.data;
    if (!Array.isArray(data)) return [];

    return data
      .map((item) => ({
        name: item?.campaign ?? 'Unknown',
        leads: Number(item?.leads ?? 0),
      }))
      .filter((x) => x.name && Number.isFinite(x.leads));
  }, [topCampaignsData, hasSelection]);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.leads - a.leads),
    [rows]
  );

  const totalLeads = useMemo(
    () => sorted.reduce((sum, c) => sum + c.leads, 0),
    [sorted]
  );

  const categories = sorted.map((c) => c.name);
  const series = [
    {
      name: 'Leads',
      data: sorted.map((c) => c.leads),
    },
  ];

  const options = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
    },
    legend: {
      show: false,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '45%',
        borderRadius: 6,
        distributed: true, // each bar gets its own color
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) =>
        typeof val === 'number' && !Number.isNaN(val) ? val.toFixed(0) : '-',
      style: {
        colors: ['#ffffff'],
        fontSize: '11px',
      },
    },
    xaxis: {
      categories,
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
    grid: {
      borderColor: '#e0e0e0',
    },
    colors: ['#3E6A9F', '#52c41a', '#faad14', '#ff4d4f'],
    tooltip: {
      y: {
        formatter: (value) =>
          typeof value === 'number' && !Number.isNaN(value)
            ? `${value} leads`
            : '-',
      },
    },
  };

  const handleCampaignChange = (value) => {
    const values = Array.isArray(value) ? value : [];
    const hasSelectAll = values.includes(SELECT_ALL_VALUE);
    const currentlyHasSelectAll = uiSelectedCampaigns.includes(SELECT_ALL_VALUE);
    
    // Filter out SELECT_ALL_VALUE to get only individual items
    const individualItems = values.filter(v => v !== SELECT_ALL_VALUE);

    // If "Select All" is currently selected and user clicks an individual item
    // (either by deselecting "Select All" or adding an individual item)
    // Clear "Select All" and allow individual selection
    if (currentlyHasSelectAll && individualItems.length > 0) {
      setUiSelectedCampaigns(individualItems);
      return;
    }

    // If user selects "Select All" (with or without other items)
    // Only keep "Select All" and clear other selections
    if (hasSelectAll) {
      setUiSelectedCampaigns([SELECT_ALL_VALUE]);
      return;
    }

    // Normal individual selection (when "Select All" is not selected)
    setUiSelectedCampaigns(values);
  };

  return (
    <div className="donut-chart-card">
      <div className="donut-chart-header">
        <div>
          <h2 className="donut-chart-title">
            Top Performing Campaigns {hasSelection && !isLoading && totalLeads > 0 ? `(Leads: ${totalLeads})` : ''}
          </h2>
        </div>
        <div className="donut-chart-filters" style={{ alignItems: 'center' }}>
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
          <Select
            mode="multiple"
            value={uiSelectedCampaigns}
            onChange={handleCampaignChange}
            placeholder="Select campaigns"
            style={{ minWidth: 260 }}
            maxTagCount={0} // hide tags inside the dropdown; pills below show selection
            allowClear
          >
            <Option key={SELECT_ALL_VALUE} value={SELECT_ALL_VALUE}>
              Select All
            </Option>
            {campaignOptions.map((name) => (
              <Option key={name} value={name}>
                {name}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      {!hasSelection ? (
        <div style={{ padding: 16 }}>No campaigns selected.</div>
      ) : isLoading ? (
        <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={44} sx={{ color: '#3E6A9F' }} />
        </Box>
      ) : isError ? (
        <div style={{ padding: 16 }}>Failed to load campaigns data.</div>
      ) : (
        <Chart options={options} series={series} type="bar" height={320} />
      )}
    </div>
  );
};

export default CampaignPerformanceChart;


