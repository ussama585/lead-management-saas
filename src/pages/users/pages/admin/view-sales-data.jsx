import { Modal } from '../../../../components/ui/app-modal.jsx';
import { Spin, Button } from '../../../../components/ui/app-controls.jsx';
import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';

import { LoaderCircle as LoadingOutlined, FileText as FileTextOutlined, Info as InfoCircleOutlined } from 'lucide-react';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import NewTableComponent from '../../../../components/tables/new-table.jsx';
import { getCallingList, getCallingCount } from '../../../shared/services/headhunting.js';
import '../../../../assets/styles/legacy/client-listing-page.css'
import useUserStore from '../../../shared/store/user-store.js';
import { useEffect } from 'react';
import "../../../../assets/styles/legacy/sales-data.generated.css"

function useDebouncedValue(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function ViewSalesLeads() {

  const [sorting, setSorting] = useState([]);
  const debouncedSorting = useDebouncedValue(sorting, 300);

  const queryClient = useQueryClient();

  const [showRemakrsModal, setShowRemakrsModal] = useState(false);
  const [rowRemakrs, setRowRemarks] = useState("");
  const openRemakrsModal = (remarks)=>{
      setShowRemakrsModal(true);
      setRowRemarks(remarks);
  }

  const { user } = useUserStore();
  const { id: id } = useParams();
  const navigate = useNavigate();

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const handlePaginationChange = (newPagination) => {
    // setSorting([]);
    setPagination(newPagination); // Update pagination state in parent
  };

  const [globalFilter, setGlobalFilter] = useState('')

  const handleSortingChange = (newSorting) => {
    setSorting(newSorting);
  };

  const [selectedTab, setSelectedTab] = useState("all");
  const [salesCallingListType, setSalesCallingListType] = useState("");

  // sales calling count query
  const { data: callingCount, isLoading: loadingCallingCount } = useQuery({
    queryKey: ['callingCount', id],
    queryFn: () => getCallingCount(id),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
  
  

  const handleTabClickForSalesCalling = (tabValue) => {

      switch (tabValue) {
        case 'all':
          setSorting([]);
          setPagination({ pageIndex: 0, pageSize: 10 });
          setSelectedTab("all");
          setSalesCallingListType("");
          break;

        case 'pending_contact':
          setSorting([]);
          setPagination({ pageIndex: 0, pageSize: 10 });
          setSelectedTab("pending_contact");
          setSalesCallingListType("Pending Contact");
          break;

        case 'contacted_no_response':
          setSorting([]);
          setPagination({ pageIndex: 0, pageSize: 10 });
          setSelectedTab("contacted_no_response");
          setSalesCallingListType("Contacted But No Response");
          break;

        case 'dead_contacted_no_response':
          setSorting([]);
          setPagination({ pageIndex: 0, pageSize: 10 });
          setSelectedTab("dead_contacted_no_response");
          setSalesCallingListType("Dead Data - Contacted But No Response");
          break;

        case 'dead_contacted_not_interested':
          setSorting([]);
          setPagination({ pageIndex: 0, pageSize: 10 });
          setSelectedTab("dead_contacted_not_interested");
          setSalesCallingListType("Dead Data - Contacted But Not Interested At The Moment");
          break;

        case 'dead_never_contact_again':
          setSorting([]);
          setPagination({ pageIndex: 0, pageSize: 10 });
          setSelectedTab("dead_never_contact_again");
          setSalesCallingListType("Dead Data - Never Contact Again");
          break;

        // case 'potential_client':
        //   setSorting([]);
        //   setPagination({ pageIndex: 0, pageSize: 10 });
        //   setSelectedTab("potential_client");
        //   setSalesCallingListType("Potential Client");
        //   break;

        default:
          break;
      }
  };


  const { data: callingList = {}, isLoading: loadingCallingList, refetch: refetchCallingList } = useQuery({
    queryKey: ['callingList', pagination.pageIndex, pagination.pageSize, debouncedSorting, globalFilter, id, salesCallingListType],
    queryFn: () => getCallingList({ page: pagination.pageIndex + 1, pageSize: pagination.pageSize, sorting: debouncedSorting, search: globalFilter, userId: id, listType: salesCallingListType }),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });


  const transformedData = callingList && callingList.results
    ? callingList.results.map((client) => ({

      id: client.id || "-",
      representative_name: client.representative_name || "-",
      representative_email: client.representative_email || "-",
      representative_phone: client.representative_phone || "-",
      representative_designation: client.representative_designation || "-",
      entity_type: client.entity_type || "-",
      company_name: client.company_name || "-",
      industry: client.industry || "-",
      company_email: client.company_email || "-",
      company_phone: client.company_phone || "-",
      city: client.city || "-",
      country: client.country || "-",
      website: client.website || '-',
      linkedin: client.linkedin || '-',
      status: client.status || '-',
      acquired_through: client.acquired_through || "",
      acquired_through_other: client.acquired_through_other || "",
      data_entry_date: client.data_entry_date
        ? new Date(client.data_entry_date).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric',
        })
        : "-",
      followup_date: client.followup_date
        ? new Date(client.followup_date).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric',
        })
        : "-",
      next_followup_date: client.next_followup_date
        ? new Date(client.next_followup_date).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric',
        })
        : "-",
      remarks: client.remarks || '-',
    }))
    : [];


  const columns = useMemo(() => {
    const baseColumns = [
      {
        header: '#',
        accessorKey: 'id',
        Cell: ({ row }) => <span>{row.index + 1 + pagination.pageIndex * pagination.pageSize}</span>
      },
    ]

      if (selectedTab != 'dead_never_contact_again') {
        baseColumns.push(
          {
            header: 'Follow-Up Date',
            accessorKey: 'followup_date',
            Cell: ({ cell }) => <span>{cell.getValue()}</span>,
          }
        );
      }

     baseColumns.push(
      {
        header: "Status",
        accessorKey: "status",
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: "Remarks",
        accessorKey: "remarks",
        Cell: ({ row }) => {
        const remarksValue = row.original.remarks;
        return remarksValue ? 
            <FileTextOutlined size="1em" className="app-icon" style={{ fontSize: '2rem', cursor: 'pointer', textAlign: "center"}} onClick={() => openRemakrsModal(remarksValue)}/>
            : "-" ;
        },
      },
      {
        header: 'View Detail',
        accessorFn: (row) => row,
        Cell: ({ row }) => {
          return (
            <InfoCircleOutlined size="1em" className="app-icon"
            onClick={() => {
              navigate(`/admin/sales-data-detail/${row.original.id}`)
            }}
            style={{ cursor: 'pointer', color: '#3E6A9F', fontSize: '20px', }}
            />
          );
        },
      },
      {
        header: 'Phone',
        accessorKey: 'representative_phone',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Email',
        accessorKey: 'representative_email',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Representative Name',
        accessorKey: 'representative_name',
        Cell: ({ row }) => <span>{row.original.representative_name}</span>
      },
      {
        header: 'Representative Designation',
        accessorKey: 'representative_designation',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Company Name',
        accessorKey: 'company_name',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Industry / Sector',
        accessorKey: 'industry',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Website URL',
        accessorKey: 'website',
        Cell: ({ cell }) => <span style={{padding: "0px 8px"}}>{cell.getValue()}</span>,
      },
      {
        header: 'LinkedIn Profile',
        accessorKey: 'linkedin',
        Cell: ({ cell }) => <span style={{padding: "0px 8px"}}>{cell.getValue()}</span>,
      },
      {
        header: 'City',
        accessorKey: 'city',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Country',
        accessorKey: 'country',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Acquired Through',
        accessorKey: 'acquired_through',
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
      {
        header: 'Acquired Through Other',
        accessorKey: 'acquired_through_other',
        Cell: ({ cell }) => {
          const acquiredThroughOther = cell.getValue();
          return acquiredThroughOther ? <span>{cell.getValue()}</span> : "-" ;
        }
      },
      {
        header: 'Data Entry Date',
        accessorKey: 'data_entry_date',
        Cell: ({ cell }) => {
          const dataEntryDate = cell.getValue();
          return dataEntryDate ? <span>{cell.getValue()}</span> : "-" ;
        }
      },
    );

    return baseColumns;
  }, [navigate, pagination.pageIndex, pagination.pageSize, selectedTab]);



  useEffect(() => {
    const handler = setTimeout(() => {
      setPagination((prev) => ({ ...prev, pageIndex: 0, pageSize: 10 }));
      setSorting((prev) => ([]));
    }, 500);

    return () => clearTimeout(handler);
  }, [globalFilter]);

  return (
    <>
      <BreadCrumb linkText="Sales Data" />
      <div>

        {/* Tabs Section */}
        <div className="client-tabs-container">

            {loadingCallingCount ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" />
              </div>
            ) : (
              <div className="client-tabs">
                {[
                  { label: 'All', key: 'all' },
                  { label: 'Pending Contact', key: 'pending_contact' },
                  { label: 'Contacted But No Response', key: 'contacted_no_response' },
                  { label: 'Dead Data - Contacted But No Response', key: 'dead_contacted_no_response' },
                  { label: 'Dead Data - Contacted But Not Interested At The Moment', key: 'dead_contacted_not_interested' },
                  { label: 'Dead Data - Never Contact Again', key: 'dead_never_contact_again' },
                  // { label: 'Potential Client', key: 'potential_client' },

                ].map(({ label, key }) => {
                  
                  const count = callingCount[key] || 0; // Default to 0 if the key is not found

                  return (
                    <button
                      key={key}
                      className={`tab ${selectedTab === key ? 'active' : ''}`}
                      style={{border:'1px solid #3E6A9F', backgroundColor: `${selectedTab === key ? '#3E6A9F' : '#eeeeee'}`}}
                      onClick={() => handleTabClickForSalesCalling(key)}
                      disabled={loadingCallingCount}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
              </div>
            )}

          </div>

        
        <div>
          <NewTableComponent
            columns={columns}
            data={transformedData}
            totalCount={callingList?.count || 0}
            heading={salesCallingListType ? salesCallingListType : "All"}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            isLoading={loadingCallingList}
          />
        </div>    

        <Modal
            className="sales-data"
            open={showRemakrsModal}
            onCancel={() => setShowRemakrsModal(false)}
            footer={[
                <Button className='project-button' type='primary' variant='filled' key="ok" onClick={() => setShowRemakrsModal(false)}>
                Ok
                </Button>
            ]}
            centered
            title="Remarks"
            >
            <p style={{ fontSize: '1rem', marginBottom: '12px' }}>
                {showRemakrsModal ? rowRemakrs : ''}
            </p>
        </Modal>

    </div>
    </>
  );
}

