import { Select } from '../ui/app-select.jsx';
import React, { useState, useMemo } from 'react';
import Chart from './apex-chart.jsx';

import dayjs from 'dayjs';
import '../../assets/styles/legacy/donut-chart.component.css'; // reuse card styles
import {
  STATUS_OPTIONS,
} from '../../pages/leads/pages/website-leads/website-leads-constants.js';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';

const { Option } = Select;

/**
 * Spline chart that shows **leads over time**.
 *
 * - X-axis: time periods (e.g., Week 1, Week 2, ...)
 * - Y-axis: leads count
 * - Dropdowns: Campaign → Adset → Ad (cascading)
 *
 * If you select:
 *  - Only Campaign → shows campaign's total leads over time.
 *  - Campaign + Adset → shows that adset's leads over time.
 *  - Campaign + Adset + Ad → shows that ad's leads over time.
 *
 * Uses dummy nested data for now.
 */
const CampaignComparisonSplineChart = () => {
  const categories = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];

  // Dummy nested data: campaigns → adsets → ads → leads per week
  const data = useMemo(
    () => ({
      'Campaign A': {
        adsets: {
          'Adset A1': {
            ads: {
              'Ad A1-1': [5, 8, 10, 9, 12, 11],
              'Ad A1-2': [4, 6, 7, 8, 9, 10],
            },
          },
          'Adset A2': {
            ads: {
              'Ad A2-1': [3, 4, 5, 6, 5, 4],
              'Ad A2-2': [2, 3, 4, 4, 5, 6],
            },
          },
        },
      },
      'Campaign B': {
        adsets: {
          'Adset B1': {
            ads: {
              'Ad B1-1': [2, 3, 4, 3, 4, 5],
              'Ad B1-2': [1, 2, 3, 3, 4, 4],
            },
          },
          'Adset B2': {
            ads: {
              'Ad B2-1': [4, 5, 6, 7, 8, 9],
              'Ad B2-2': [3, 4, 5, 5, 6, 7],
            },
          },
        },
      },
      'Campaign C': {
        adsets: {
          'Adset C1': {
            ads: {
              'Ad C1-1': [1, 2, 2, 3, 3, 4],
              'Ad C1-2': [2, 2, 3, 3, 4, 4],
            },
          },
        },
      },
    }),
    []
  );

  const campaignNames = useMemo(() => Object.keys(data), [data]);

  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [showDateModal, setShowDateModal] = useState(false);

  // Primary selection (left side)
  const [selectedCampaign, setSelectedCampaign] = useState(campaignNames[0]);
  const [selectedAdset, setSelectedAdset] = useState('All');
  const [selectedAd, setSelectedAd] = useState('All');

  // Comparison selection (right side)
  const [compareCampaign, setCompareCampaign] = useState(
    campaignNames[1] || campaignNames[0]
  );
  const [compareAdset, setCompareAdset] = useState('All');
  const [compareAd, setCompareAd] = useState('All');

  const adsetNames = useMemo(() => {
    const adsets = data[selectedCampaign]?.adsets || {};
    return ['All', ...Object.keys(adsets)];
  }, [data, selectedCampaign]);

  const adNames = useMemo(() => {
    if (!selectedAdset || selectedAdset === 'All') {
      return ['All'];
    }
    const ads = data[selectedCampaign]?.adsets?.[selectedAdset]?.ads || {};
    return ['All', ...Object.keys(ads)];
  }, [data, selectedCampaign, selectedAdset]);

  const compareAdsetNames = useMemo(() => {
    const adsets = data[compareCampaign]?.adsets || {};
    return ['All', ...Object.keys(adsets)];
  }, [data, compareCampaign]);

  const compareAdNames = useMemo(() => {
    if (!compareAdset || compareAdset === 'All') {
      return ['All'];
    }
    const ads = data[compareCampaign]?.adsets?.[compareAdset]?.ads || {};
    return ['All', ...Object.keys(ads)];
  }, [data, compareCampaign, compareAdset]);

  // Compute leads over time for the current selection(s)
  const series = useMemo(() => {
    const sumArrays = (arrays) => {
      const length = categories.length;
      const result = new Array(length).fill(0);
      arrays.forEach((arr) => {
        for (let i = 0; i < length; i += 1) {
          result[i] += arr[i] ?? 0;
        }
      });
      return result;
    };

    const buildSelectionSeries = (campaignKey, adsetKey, adKey, labelPrefix) => {
      const campaign = data[campaignKey];
      if (!campaign) {
        return null;
      }

      const adsets = campaign.adsets || {};

      // Campaign level: sum all ads in all adsets
      if (!adsetKey || adsetKey === 'All') {
        const allAdArrays = Object.values(adsets).flatMap((adset) =>
          Object.values(adset.ads || {})
        );
        return {
          name: `${labelPrefix}${campaignKey} - Leads`,
          data: sumArrays(allAdArrays),
        };
      }

      const adset = adsets[adsetKey];
      const ads = adset?.ads || {};

      // Adset level: sum all ads in this adset
      if (!adKey || adKey === 'All') {
        const allAdArrays = Object.values(ads);
        return {
          name: `${labelPrefix}${adsetKey} - Leads`,
          data: sumArrays(allAdArrays),
        };
      }

      // Ad level: show just this ad's leads over time
      const adLeads = ads[adKey] || new Array(categories.length).fill(0);
      return {
        name: `${labelPrefix}${adKey} - Leads`,
        data: adLeads,
      };
    };

    const primary = buildSelectionSeries(
      selectedCampaign,
      selectedAdset,
      selectedAd,
      ''
    );

    const comparison = buildSelectionSeries(
      compareCampaign,
      compareAdset,
      compareAd,
      'Compare: '
    );

    // In real data, you would filter by status here before summing.
    // For now we just pass through and adjust labels.
    const filtered = [primary, comparison].filter(Boolean).map((s) => {
      if (!s) return s;
      return {
        ...s,
        name:
          statusFilter && statusFilter !== 'All Statuses'
            ? `${s.name} (${statusFilter})`
            : s.name,
      };
    });

    return filtered;
  }, [
    data,
    selectedCampaign,
    selectedAdset,
    selectedAd,
    compareCampaign,
    compareAdset,
    compareAd,
    categories.length,
    statusFilter,
  ]);

  const options = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: {
      curve: 'smooth', // spline
      width: 3,
    },
    markers: {
      size: 4,
      strokeWidth: 0,
    },
    xaxis: {
      categories,
      labels: {
        style: {
          colors: '#B0B0B0',
          fontSize: '11px',
        },
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
      row: {
        colors: ['#f5f5f5', 'transparent'],
        opacity: 0.5,
      },
    },
    colors: ['#3E6A9F', '#52c41a'],
    tooltip: {
      y: {
        formatter: (val) =>
          typeof val === 'number' && !Number.isNaN(val) ? val : '-',
      },
    },
  };

  return (
    <div className="donut-chart-card">
      <div className="donut-chart-header">
        <h2 className="donut-chart-title">Leads Over Time (Spline)</h2>
        <div
          className="donut-chart-filters"
          style={{ flexDirection: 'column' }}
        >
          {/* Date & Status filters - top row */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
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
              value={statusFilter}
              style={{ minWidth: 200 }}
              onChange={(value) => setStatusFilter(value)}
            >
              <Option value="All Statuses">All Statuses</Option>
              {STATUS_OPTIONS.map((status) => (
                <Option key={status} value={status}>
                  {status}
                </Option>
              ))}
            </Select>
          </div>

          {/* Primary selection */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <Select
              value={selectedCampaign}
              style={{ minWidth: 160 }}
              onChange={(value) => {
                setSelectedCampaign(value);
                setSelectedAdset('All');
                setSelectedAd('All');
              }}
            >
              {campaignNames.map((name) => (
                <Option key={name} value={name}>
                  {name}
                </Option>
              ))}
            </Select>
            <Select
              value={selectedAdset}
              style={{ minWidth: 160 }}
              onChange={(value) => {
                setSelectedAdset(value);
                setSelectedAd('All');
              }}
            >
              {adsetNames.map((name) => (
                <Option key={name} value={name}>
                  {name}
                </Option>
              ))}
            </Select>
            <Select
              value={selectedAd}
              style={{ minWidth: 160 }}
              onChange={(value) => setSelectedAd(value)}
            >
              {adNames.map((name) => (
                <Option key={name} value={name}>
                  {name}
                </Option>
              ))}
            </Select>
          </div>

          {/* Comparison selection */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Select
              value={compareCampaign}
              style={{ minWidth: 160 }}
              onChange={(value) => {
                setCompareCampaign(value);
                setCompareAdset('All');
                setCompareAd('All');
              }}
            >
              {campaignNames.map((name) => (
                <Option key={name} value={name}>
                  {name}
                </Option>
              ))}
            </Select>
            <Select
              value={compareAdset}
              style={{ minWidth: 160 }}
              onChange={(value) => {
                setCompareAdset(value);
                setCompareAd('All');
              }}
            >
              {compareAdsetNames.map((name) => (
                <Option key={name} value={name}>
                  {name}
                </Option>
              ))}
            </Select>
            <Select
              value={compareAd}
              style={{ minWidth: 160 }}
              onChange={(value) => setCompareAd(value)}
            >
              {compareAdNames.map((name) => (
                <Option key={name} value={name}>
                  {name}
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </div>
      <Chart options={options} series={series} type="line" height={380} />
    </div>
  );
};

export default CampaignComparisonSplineChart;


