import { Spin } from '../../../../components/ui/app-controls.jsx';
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';

import { LoaderCircle as LoadingOutlined } from 'lucide-react';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import SkeletonLoader from '../../../../components/skeleton-loader.component.jsx';
import StatsCard from '../../../../components/stats-card.component.jsx';
import LineChart from '../../../../components/charts/line-chart.component.jsx';
import { getStats, getManagersList, getManagerStats } from '../../../shared/services/stats-service.js';
import TableComponent from '../../../../components/tables/table.component.jsx';
import SalesManagersIcon from '../../../../assets/images/stat-card-icons/sales-managers.svg';
import '../../../../assets/styles/legacy/sales-manager-listing-page.css';
import '../../../../assets/styles/legacy/table-client-actions.css';
import useUserStore from '../../../shared/store/user-store.js';


export default function SalesManagerListing() {
    const navigate = useNavigate();

    const { id } = useUserStore();


    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    const [globalFilter, setGlobalFilter] = useState('')
    const [sorting, setSorting] = useState([]);

    const [selectedTimeFrameForManagersData, setSelectedTimeFrameForManagersData] = useState('week');

    const { data: metricsData, isLoading: loadingStats } = useQuery({
        queryKey: ['adminStats'],
        queryFn: getStats,
        staleTime: 0,
        cacheTime: 0,
        refetchOnMount: true,
        refetchOnWindowFocus: true
    });


    const {
        data: managerStats,
        isLoading: loadingManagerStats,
    } = useQuery({
        queryKey: ['managerStats', selectedTimeFrameForManagersData],
        queryFn: () => getManagerStats(selectedTimeFrameForManagersData),
        staleTime: 0,
        cacheTime: 0,
        refetchOnMount: true,
        refetchOnWindowFocus: true
    });



    // Fetch manager listing with pagination
    const { data: managersList = {}, isLoading: loadingManagerList } = useQuery({
        queryKey: ['managersList', pagination.pageIndex, pagination.pageSize, sorting, globalFilter],
        queryFn: () => getManagersList(pagination.pageIndex + 1, pagination.pageSize, sorting, globalFilter),
        // enabled: !!pagination.pageIndex,
        staleTime: 0,
        cacheTime: 0,
        refetchOnMount: true,
        refetchOnWindowFocus: true
    });


    const metrics = metricsData
        ? [
            {
                title: 'Sales Managers',
                icon: SalesManagersIcon,
                count: metricsData.sales_manager_stats.count,
                color: '#FF6666',

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
                        <div style={{ display: 'flex', alignItems: 'center', textAlign: 'left' }} onClick={() => navigate(`/admin/sales-executive-detail/${row.user}/${row.slug}`)}>
                            <span className="link-style" >{row.name}</span>
                        </div>
                    );
                },
            },
            {
                header: 'Executives',
                accessorKey: 'executives',
                Cell: ({ cell }) => <span>{cell.getValue()}</span>,
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

    const handleTimeFrameFromManagersStats = (value) => {
        setSelectedTimeFrameForManagersData(value);
    };


    // Map /api/sales-executive/list results to table row shape
    const transformedData = managersList.results
        ? managersList.results.map((item) => ({
            id: item?.id ?? "-",
            user: item?.user ?? "-",
            slug: item?.slug ?? "-",
            name: item?.name ?? "-",
            executives: item?.executives ?? "-",
            clients: item?.clients?.total ?? "-",
            total_projects: item?.projects?.total ?? "-",
            active_projects: item?.projects?.active ?? "-",
            completed_projects: item?.projects?.completed ?? "-",
            terminated_projects: item?.projects?.terminated ?? "-",
            potential_clients: item?.clients?.potential ?? "-",
            dormant_clients: item?.clients?.dormant ?? "-",
            opportunities_lost: item?.clients?.lost ?? "-",
        }))
        : [];





    // Structure the data to match LineChart requirements
    const chartData = {
        managers: managerStats?.managers || [] // Here we directly map the managers array
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }, 500);

        return () => clearTimeout(handler);
    }, [globalFilter]);

    return (
        <>
            <BreadCrumb linkText="Sales Managers" />

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
                    {loadingManagerStats ? (
                        <SkeletonLoader type="chart-plain" />
                    ) : (
                        <LineChart
                            title="Stats"
                            data={chartData}
                            categories={managerStats?.dates || []} // Updated to match expected structure
                            selectedTimeframe={selectedTimeFrameForManagersData}
                            onTimeFrameChange={handleTimeFrameFromManagersStats}
                            legendNames={['Managers']}
                            colors={['#ff0000']}
                        />
                    )}
                </div>

                <div className="table-container">
                    {loadingManagerList ? (
                        <div className="sop-branded-spin-wrap">
                            <Spin
                                size="large"
                                indicator={<LoadingOutlined size="1em" className={["app-icon app-icon-spin", "sop-branded-spin-icon"].filter(Boolean).join(' ')}  aria-hidden />}
                            />
                            <p className="sop-branded-spin-text">Loading sales managers...</p>
                        </div>
                    ) : (
                        <TableComponent
                            columns={columns}
                            data={transformedData}
                            totalCount={managersList.count || 0}
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
