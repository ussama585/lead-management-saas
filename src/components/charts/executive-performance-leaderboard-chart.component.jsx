import React, { useState } from 'react';
import { Avatar, Table } from 'antd';
import { User as UserOutlined, Crown as CrownOutlined, Star as StarOutlined } from 'lucide-react';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/executive-performance-leaderboard-chart.component.css';

/**
 * Overall Executive Performance Leaderboard (Top Performer)
 * Team Leaderboard design - consolidated ranking by project closures, client ownership, revenue & risk
 */
const ExecutivePerformanceLeaderboardChart = ({
  title = 'Overall Executive Performance Leaderboard',
  subtitle = 'Ranking by highest revenue generated',
  data = [],
  isLoading = false,
  emptyMessage = 'No data to display',
  dateRange,
  onDateRangeChange,
}) => {
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [internalDateRange, setInternalDateRange] = useState(dateRange ?? [dayjs().startOf('month'), dayjs().endOf('month')]);
  const activeDateRange = dateRange ?? internalDateRange;
  const handleDateRangeDone = (range) => {
    setInternalDateRange(range);
    onDateRangeChange?.(range);
  };

  const formatCurrency = (val) => {
    const num = Math.round(Number(val ?? 0));
    return `Rs ${num.toLocaleString()}`;
  };
  const lastUpdate = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const ordinal = (n) => {
    const num = Number(n);
    if (Number.isNaN(num)) return String(n);
    const s = num % 10;
    const t = num % 100;
    if (s === 1 && t !== 11) return `${num}st`;
    if (s === 2 && t !== 12) return `${num}nd`;
    if (s === 3 && t !== 13) return `${num}rd`;
    return `${num}th`;
  };

  const RankBadge = ({ rank }) => {
    if (rank === 1) {
      return (
        <span className="leaderboard-rank-badge leaderboard-rank-1st">
          <CrownOutlined size="1em" className="app-icon" /> 1st
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="leaderboard-rank-badge leaderboard-rank-2nd">
          <StarOutlined size="1em" className="app-icon" /> 2nd
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="leaderboard-rank-badge leaderboard-rank-3rd">
          <StarOutlined size="1em" className="app-icon" /> 3rd
        </span>
      );
    }
    return <span className="leaderboard-rank-num">{ordinal(rank)}</span>;
  };

  const getRowClassName = (record) => {
    const rank = record.rank || 0;
    if (rank === 1) return 'leaderboard-row-1st';
    if (rank === 2) return 'leaderboard-row-2nd';
    if (rank === 3) return 'leaderboard-row-3rd';
    return '';
  };

  const columns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 100,
      render: (_, record) => <RankBadge rank={record.rank} />,
    },
    {
      title: 'Name',
      dataIndex: 'assigned_to_name',
      key: 'name',
      render: (name, record) => (
        <div className="leaderboard-name-cell">
          <Avatar
            size={40}
            icon={<UserOutlined size="1em" className="app-icon" />}
            src={record.avatar}
            className="leaderboard-avatar"
          />
          <span>{name || 'Unassigned'}</span>
        </div>
      ),
    },
    {
      title: 'Contract Amount',
      dataIndex: 'contract_amount',
      key: 'contract_amount',
      align: 'right',
      render: (val) => formatCurrency(val),
    },
    {
      title: 'Revenue (mobilization amount)',
      dataIndex: 'revenue_amount',
      key: 'revenue_amount',
      align: 'right',
      render: (val) => formatCurrency(val),
    },
    {
      title: 'Pending Payment',
      dataIndex: 'pending_payment',
      key: 'pending_payment',
      align: 'right',
      render: (val) => formatCurrency(val),
    },
  ];

  const hasData = data && data.length > 0;

  return (
    <div className="executive-performance-leaderboard-chart-container">
      <div className="executive-performance-leaderboard-chart-header">
        <div className="leaderboard-title-section">
          
          <div>
            <h2 className="executive-performance-leaderboard-chart-title">
              {title}
            </h2>
            <p className="executive-performance-leaderboard-chart-subtitle">
              {subtitle}
            </p>
          </div>
        </div>
        <div className="executive-performance-leaderboard-chart-dropdown">
          <BootstrapDateRangeModal
            value={activeDateRange}
            onChange={onDateRangeChange}
            showModal={showDateRangeModal}
            setShowModal={setShowDateRangeModal}
            onDone={handleDateRangeDone}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="executive-performance-leaderboard-chart-loading">
          Loading...
        </div>
      ) : !hasData ? (
        <div className="executive-performance-leaderboard-chart-empty">
          {emptyMessage}
        </div>
      ) : (
        <>
          <div className="executive-performance-leaderboard-table-wrapper">
            <Table
              columns={columns}
              dataSource={data.map((item, idx) => ({
                ...item,
                key: item.assigned_to_id ?? idx,
                rank: item.rank ?? idx + 1,
              }))}
              pagination={false}
              showHeader={true}
              rowClassName={(record) => getRowClassName(record)}
              className="executive-performance-leaderboard-table"
            />
          </div>
          <div className="leaderboard-footer">
            Updated daily • Last update: Today at {lastUpdate}
          </div>
        </>
      )}
    </div>
  );
};

export default ExecutivePerformanceLeaderboardChart;
