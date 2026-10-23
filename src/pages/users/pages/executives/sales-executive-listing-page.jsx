import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Spin } from 'antd';
import { LoaderCircle as LoadingOutlined } from 'lucide-react';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import SkeletonLoader from '../../../../components/skeleton-loader.component.jsx';
import StatsCard from '../../../../components/stats-card.component.jsx';
import LineChart from '../../../../components/charts/line-chart.component.jsx';
import { getStats, getExecutivesList, getExecutiveStats } from '../../../shared/services/stats-service.js';
import TableComponent from '../../../../components/tables/table.component.jsx';
import SalesExecutivesIcon from '../../../../assets/images/stat-card-icons/sales-executives.svg';
import ProfileImagePlaceholder from '../../../../assets/images/user-card-icons/user-placeholder.svg';
import '../../../../assets/styles/legacy/sales-executive-listing-page.css';
import '../../../../assets/styles/legacy/table-client-actions.css';

export default function SalesExecutiveListing() {

  const navigate = useNavigate();

  const [pagination, setPagination] = useState({
    pageIndex: 0, // Start at page 0
    pageSize: 10, // Default rows per page
  });


  const handlePaginationChange = (newPagination) => {

    // setSorting([]);
    setPagination(newPagination); // Update pagination state
  };
  const [globalFilter, setGlobalFilter] = useState('')

  const [sorting, setSorting] = useState([]);

  const [selectedTimeFrameForExecutivesData, setSelectedTimeFrameForExecutivesData] = useState('week');

  const { data: metricsData, isLoading: loadingStats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: getStats,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });


  const {
    data: executiveStats,
    isLoading: loadingExecutiveStats,
  } = useQuery({
    queryKey: ['executiveStats', selectedTimeFrameForExecutivesData],
    queryFn: () => getExecutiveStats(selectedTimeFrameForExecutivesData),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });



  // Fetch Executive listing with pagination
  const { data: executivesList = {}, isLoading: loadingExecutiveList } = useQuery({
    queryKey: ['ExecutivesList', pagination.pageIndex, pagination.pageSize, sorting, globalFilter],
    queryFn: () => getExecutivesList(undefined, pagination.pageIndex + 1, pagination.pageSize, sorting, globalFilter),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });


  const metrics = metricsData
    ? [
      {
        title: 'Sales Executives',
        icon: SalesExecutivesIcon,
        count: metricsData?.sales_executive_stats?.count || 0,
        color: '#3E6A9F',

      },
    ]
    : [];

  const columns = useMemo(
    () => [
      {
        header: '#',
        accessorKey: 'id',
        Cell: ({ row }) => <span>{row.index + 1 + pagination.pageIndex * pagination.pageSize}</span>,
      },
      {
        header: 'Name',
        accessorFn: (row) => row,
        Cell: ({ cell }) => {
          const row = cell.getValue();
          return (
            <div style={{ display: 'flex', alignItems: 'center', textAlign: 'left' }}>
              <img
                src={row.profile_pic || ProfileImagePlaceholder}
                alt="Profile"
                style={{ width: 40, height: 40, flexShrink: 0, objectFit: 'cover', borderRadius: '50%', marginRight: '10px' }}
              />
              <span className="link-style" onClick={() => navigate(`/admin/sales-executive-detail/${row.user}/${row.slug}`)} >{row.name}</span>
            </div>
          );
        },
      },
      {
        header: 'Clients',
        accessorKey: 'clients',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Potential Clients',
        accessorKey: 'potential_clients',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Dormant Clients',
        accessorKey: 'dormant_clients',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Active Projects',
        accessorKey: 'active_projects',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Completed Projects',
        accessorKey: 'completed_projects',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Opportunities Lost',
        accessorKey: 'opportunities_lost',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Terminated Projects',
        accessorKey: 'terminated_projects',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
    ],
    [navigate]
  );


  const handleTimeFrameFromExecutivesStats = (value) => {
    setSelectedTimeFrameForExecutivesData(value);
  };


  const transformedData = executivesList?.results
    ? executivesList.results.map((executive) => ({
      id: executive?.id ?? "-",
      user: executive?.user ?? "-",
      slug: executive?.slug ?? "-",
      name: executive?.name ?? "-",
      profile_pic: executive?.profile_pic ?? "-",
      clients: executive?.clients?.total ?? "-",
      total_projects: executive?.projects?.total ?? "-",
      active_projects: executive?.projects?.active ?? "-",
      completed_projects: executive?.projects?.completed ?? "-",
      terminated_projects: executive?.projects?.terminated ?? "-",
      potential_clients: executive?.clients?.potential ?? "-",
      dormant_clients: executive?.clients?.dormant ?? "-",
      opportunities_lost: executive?.clients?.lost ?? "-",
    }))
    : [];

  // Structure the data to match LineChart requirements
  const chartData = {
    executives: executiveStats?.executives || [] // Here we directly map the Executives array
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 500);

    return () => clearTimeout(handler);
  }, [globalFilter]);

  return (
    <>
      <BreadCrumb linkText="Sales Executives" />
      <div className="container">


        {loadingStats ? (
          <div className="sop-branded-spin-wrap" style={{ minHeight: 140, padding: '32px 24px' }}>
            <Spin
              size="large"
              indicator={<LoadingOutlined size="1em" className={["app-icon app-icon-spin", "sop-branded-spin-icon"].filter(Boolean).join(' ')}  aria-hidden />}
            />
            <p className="sop-branded-spin-text">Loading metrics...</p>
          </div>
        ) : (
          <div className="metrics-grid">
            {metrics.length > 0 ? (
              metrics.map((metric, index) => (
                <div key={index} className="metric-card">
                  <StatsCard
                    title={metric.title}
                    value={metric.count}

                    icon={<img src={metric.icon} alt={metric.title} style={{ width: '48px', height: '48px' }} />}
                    borderColor={metric.color}
                  />
                </div>
              ))
            ) : (
              <p>Nothing to show</p>
            )}
          </div>
        )}

        <div className="chart-container">
          {loadingExecutiveStats ? (
            <SkeletonLoader type="chart-plain" />
          ) : (
            <LineChart
              title="Stats"
              data={chartData}
              categories={executiveStats?.dates || []} // Updated to match expected structure
              selectedTimeframe={selectedTimeFrameForExecutivesData}
              onTimeFrameChange={handleTimeFrameFromExecutivesStats}
              legendNames={['Executives']}
              colors={['#3E6A9F']}
            />
          )}
        </div>

        <div className="table-container">
          {loadingExecutiveList ? (
            <div className="sop-branded-spin-wrap">
              <Spin
                size="large"
                indicator={<LoadingOutlined size="1em" className={["app-icon app-icon-spin", "sop-branded-spin-icon"].filter(Boolean).join(' ')}  aria-hidden />}
              />
              <p className="sop-branded-spin-text">Loading sales executives...</p>
            </div>
          ) : (
            <TableComponent
              columns={columns}
              data={transformedData}
              totalCount={executivesList.count || 0}
              heading={"Listing"}
              pagination={pagination} // Pass pagination state to child
              onPaginationChange={setPagination}
              sorting={sorting}
              onSortingChange={setSorting}
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
            />
          )}
        </div>


      </div>
    </>
  );
}
