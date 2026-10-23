import React, { useMemo, useState } from 'react';
import { Avatar, Table } from 'antd';
import { Crown as CrownOutlined, Star as StarOutlined, User as UserOutlined } from 'lucide-react';
import dayjs from 'dayjs';
import BootstrapDateRangeModal from '../bootstrap-date-range-modal.component.jsx';
import '../../assets/styles/legacy/recruiter-performance-leaderboard-chart.component.css';

const RankBadge = ({ rank }) => {
  if (rank === 1) return <span className="recruiter-rank-badge recruiter-rank-1"><CrownOutlined size="1em" className="app-icon" /> 1st</span>;
  if (rank === 2) return <span className="recruiter-rank-badge recruiter-rank-2"><StarOutlined size="1em" className="app-icon" /> 2nd</span>;
  if (rank === 3) return <span className="recruiter-rank-badge recruiter-rank-3"><StarOutlined size="1em" className="app-icon" /> 3rd</span>;
  return <span className="recruiter-rank-num">{rank}</span>;
};

const RecruiterPerformanceLeaderboardChart = ({
  title = 'Recruiter Performance',
  subtitle = 'Ranking by highest recruiter activity',
  data = [],
  isLoading = false,
  emptyMessage = 'No recruiter performance data to display',
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

  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const asNum = (v) => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
  };

  const columns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 90,
      render: (rank) => <RankBadge rank={rank} />,
    },
    {
      title: 'Name',
      dataIndex: 'recruiter_name',
      key: 'recruiter_name',
      render: (name) => (
        <div className="recruiter-name-cell">
          <Avatar size={40} icon={<UserOutlined size="1em" className="app-icon" />} className="recruiter-avatar" />
          <span>{name || 'Unassigned'}</span>
        </div>
      ),
    },
    {
      title: 'Total jobs',
      dataIndex: 'total_jobs',
      key: 'total_jobs',
      align: 'right',
      render: (v) => asNum(v).toLocaleString(),
    },
    {
      title: 'Public link shared',
      dataIndex: 'public_link_shared',
      key: 'public_link_shared',
      align: 'right',
      render: (v) => asNum(v).toLocaleString(),
    },
    {
      title: 'CV impressions',
      dataIndex: 'cv_impressions',
      key: 'cv_impressions',
      align: 'right',
      render: (v) => asNum(v).toLocaleString(),
    },
    {
      title: 'Screening impressions',
      dataIndex: 'screening_impressions',
      key: 'screening_impressions',
      align: 'right',
      render: (v) => asNum(v).toLocaleString(),
    },
    {
      title: 'Total form responses',
      dataIndex: 'total_form_responses',
      key: 'total_form_responses',
      align: 'right',
      render: (v) => asNum(v).toLocaleString(),
    },
  ];

  const hasData = rows.length > 0;

  return (
    <div className="recruiter-performance-card">
      <div className="recruiter-performance-header">
        <div>
          <h2 className="recruiter-performance-title">{title}</h2>
          <p className="recruiter-performance-subtitle">{subtitle}</p>
        </div>
        <BootstrapDateRangeModal
          value={activeDateRange}
          onChange={onDateRangeChange}
          showModal={showDateRangeModal}
          setShowModal={setShowDateRangeModal}
          onDone={handleDateRangeDone}
        />
      </div>

      {isLoading ? (
        <div className="recruiter-performance-empty">Loading...</div>
      ) : !hasData ? (
        <div className="recruiter-performance-empty">{emptyMessage}</div>
      ) : (
        <div className="recruiter-performance-table-wrap">
          <Table
            columns={columns}
            dataSource={rows}
            pagination={false}
            showHeader
            rowClassName={(record) => {
              if (record.rank === 1) return 'recruiter-row-1';
              if (record.rank === 2) return 'recruiter-row-2';
              if (record.rank === 3) return 'recruiter-row-3';
              return '';
            }}
            className="recruiter-performance-table"
          />
        </div>
      )}
    </div>
  );
};

export default RecruiterPerformanceLeaderboardChart;
