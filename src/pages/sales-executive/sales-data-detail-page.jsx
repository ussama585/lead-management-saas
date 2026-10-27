import { Button } from '../../components/ui/app-controls.jsx';
import React from 'react';
import { useQuery } from 'react-query';
import BreadCrumb from '../../components/breadcrumb.component.jsx';
import { Typography, Skeleton } from 'antd';
import '../../assets/styles/legacy/add-potential-client-page.css';
import { getDataEntryById } from '../shared/services/data-entry-service.js';
import { useParams, useNavigate } from 'react-router-dom';
import useUserStore from '../shared/store/user-store.js';
import "../../assets/styles/legacy/sales-data.generated.css";

const { Text } = Typography;

export default function SalesDataDetailPageForExecutive() {

  const { user } = useUserStore();

  const { id } = useParams();
  const navigate = useNavigate();

  // sales data detail (data-entry/update-data/:id)
  const { data: salesDataDetails, isLoading: loadingSalesDataDetails } = useQuery({
    queryKey: ['salesDataDetails', id],
    queryFn: () => getDataEntryById(id),
    staleTime: 0,
    cacheTime: 0,
    enabled: !!id,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return (
    <>
      <BreadCrumb
        linkText="Sales Data"
        goBack={() => navigate('/admin/data-entry-table')}
      />
      <div className="sales-data">

      <div className="add-client-container" style={{ justifyContent: 'flex-start' }}>

        <div className="form-container">       

          <div className="form-content">

          { id && loadingSalesDataDetails ? (
            <Skeleton active paragraph={{ rows: 8 }} />
            ) : salesDataDetails && Object.keys(salesDataDetails).length > 0 ? (
              <>
                <h3 className="section-heading">Representative Information</h3>
                  <div className="form-section form-section-mg-bottom">

                    <div className="form-field">
                      <div className="form-item">
                        <label>Name</label>
                        <Text>{salesDataDetails?.representative_name || salesDataDetails?.name || "-"}</Text>
                      </div>
                    </div>

                    <div className="form-field">
                      <div className="form-item">
                        <label>Email</label>
                        <Text>{salesDataDetails?.representative_email || salesDataDetails?.email || "-"}</Text>
                      </div>
                    </div>

                    <div className="form-field">
                      <div className="form-item">
                        <label>Phone</label>
                        <Text>{salesDataDetails?.representative_phone || salesDataDetails?.phone || "-"}</Text>
                      </div>
                    </div>

                    <div className="form-field">
                      <div className="form-item">
                        <label>Designation</label>
                        <Text>{salesDataDetails?.representative_designation || salesDataDetails?.designation || "-"}</Text>
                      </div>
                    </div>

                  </div>

                  <h3 className="section-heading">Company Information</h3>
                  <div className="form-section form-section-mg-bottom">

                    <div className="form-field">
                      <div className="form-item">
                        <label>Entity Type</label>
                        <Text>{salesDataDetails?.entity_type || "-"}</Text>
                      </div>
                    </div>

                    <div className="form-field">
                      <div className="form-item">
                        <label>Name</label>
                        <Text>{salesDataDetails?.company_name || "-"}</Text>
                      </div>
                    </div>

                    <div className="form-field">
                      <div className="form-item">
                        <label>Email</label>
                        <Text>{salesDataDetails?.company_email || salesDataDetails?.email || "-"}</Text>
                      </div>
                    </div>

                    <div className="form-field">
                      <div className="form-item">
                        <label>Phone</label>
                        <Text>{salesDataDetails?.company_phone || salesDataDetails?.phone || "-"}</Text>
                      </div>
                    </div>

                    <div className="form-field">
                      <div className="form-item">
                        <label>City</label>
                        <Text>{salesDataDetails?.city || "-"}</Text>
                      </div>
                    </div>

                    <div className="form-field">
                      <div className="form-item">
                        <label>Country</label>
                        <Text>{salesDataDetails?.country || "-"}</Text>
                      </div>
                    </div>

                    <div className="form-field">
                      <div className="form-item">
                        <label>Industry</label>
                        <Text>{salesDataDetails?.industry || salesDataDetails?.industry_sector || "-"}</Text>
                      </div>
                    </div>

                    <div className="form-field">
                      <div className="form-item">
                        <label>Website</label>
                        <Text>{salesDataDetails?.website || salesDataDetails?.company_website || "-"}</Text>
                      </div>
                    </div>

                    <div className="form-field">
                      <div className="form-item">
                        <label>LinkedIn</label>
                        <Text>{salesDataDetails?.linkedin || salesDataDetails?.company_social_link || "-"}</Text>
                      </div>
                    </div>

                  </div>

                  <h3 className="section-heading">Additional Information</h3>
                  <div className="form-section">

                    <div className="form-field">
                      <div className="form-item">
                        <label>Status</label>
                        <Text>{salesDataDetails?.status || "-"}</Text>
                      </div>
                    </div>

                    <div className="form-field">
                      <div className="form-item">
                        <label>Acquired Through</label>
                        <Text>{salesDataDetails?.acquired_through || "-"}</Text>
                      </div>
                    </div>

                    <div className="form-field">
                      <div className="form-item">
                        <label>Acquired Through Other</label>
                        <Text>{salesDataDetails?.acquired_through_other || "-"}</Text>
                      </div>
                    </div>

                    <div className="form-field">
                      <div className="form-item">
                        <label>Data Entry Date</label>
                        <Text>{ salesDataDetails?.data_entry_date
                        ? new Date(salesDataDetails.data_entry_date).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'numeric',
                            year: 'numeric',
                          })
                        : "-"}</Text>
                      </div>
                    </div>

                    <div className="form-field">
                      <div className="form-item">
                        <label>Follow Up Date</label>
                        <Text>{ salesDataDetails?.followup_date
                        ? new Date(salesDataDetails?.followup_date).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'numeric',
                            year: 'numeric',
                          })
                        : "-"}</Text>
                      </div>
                    </div>

                    <div className="form-field">
                      <div className="form-item">
                        <label>Next Follow Up Date</label>
                        <Text>{ salesDataDetails?.next_followup_date
                        ? new Date(salesDataDetails?.next_followup_date).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'numeric',
                            year: 'numeric',
                          })
                        : "-"}</Text>
                      </div>
                    </div>

                  </div>

                  <div className="form-field" style={{marginTop:"10px"}}>
                    <div className="form-item">
                      <label>Remarks</label>
                      <Text style={{width:"100%"}}>{salesDataDetails?.remarks || "-"}</Text>
                    </div>
                  </div>

                  <div className="form-submit">
                    <div style={{display:'flex', alignItems:'center', justifyContent:'start', gap:'16px'}}>
                      {
                        user.user_type !== 'admin' ?  
                        
                          <Button className='project-button' type='primary' variant='filled' key="edit" onClick={() => {
                            user?.user_type === 'sales_executive' ? navigate(`/sales-executive/set-data/${id}`) :
                            navigate(`/sales-manager/set-data/${id}`)
                          }}>
                            Edit
                          </Button>
                        : <>
                        </>
                      }

                    </div>
                  </div>

                    
              </>
            ) : <div>
              No Data Found
            </div>
          }
        </div>
      </div>
    </div>

    {/* <div style={{display:'flex', alignItems:'center', justifyContent:'start', gap:'16px'}}>

      {
        user.user_type !== 'admin' ?  
        
          <Button className='project-button' type='primary' variant='filled' key="edit" onClick={() => {
            user?.user_type === 'sales_executive' ? navigate(`/sales-executive/set-data/${id}`) :
            navigate(`/sales-manager/set-data/${id}`)
          }}>
            Edit
          </Button>
        : <>
        </>
      }

      <Button key="close" onClick={() => navigate(-1)}>
        Close
      </Button>

    </div> */}
    </div>
    </>
  );
}

