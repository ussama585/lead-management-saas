import { message } from '../../components/ui/notifications.jsx';
import { Select } from '../../components/ui/app-select.jsx';
import { Input } from '../../components/ui/app-controls.jsx';
import { Button } from '../../components/ui/app-controls.jsx';
import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'react-query';
import BreadCrumb from '../../components/breadcrumb.component.jsx';
import { Formik, Form, Field } from 'formik';
import { DatePicker, Skeleton } from 'antd';
import { setDataValidationSchema } from '../shared/schemas/schema.js';
import '../../assets/styles/legacy/add-potential-client-page.css';
import { createNewCallRecord, getCallRecordDetails } from '../shared/services/headhunting.js';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import CountryAutoSelect from '../../components/select-country.jsx';
import CityAutoSelect from '../../components/select-city.jsx';
import IndustryAutoSelect from '../../components/select-industry.jsx';
import "../../assets/styles/legacy/sales-data.generated.css";



const { TextArea } = Input;
const { Option } = Select;


export default function AddNewDataForExecutive() {

  const { id: id } = useParams();
  const timeoutRef = useRef();

  const [showOthers, setShowOthers] = useState(false);

  const [entityType, setEntityType] = useState('Select an entity');
  const handleChange = (value) => {
    setEntityType(value);
  };

  // sales calling detail
  const { data: callRecordDetails, isLoading: loadingCallRecordDetails } = useQuery({
    queryKey: ['callRecordDetails'],
    queryFn: () => getCallRecordDetails(id),
    staleTime: 0,
    cacheTime: 0,
    enabled: !!id,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });


  const { Option } = Select;
  const navigate = useNavigate();

  const [creatingNewCallRecord, setCreatingNewCallRecord] = useState(false)


  const { mutate, isLoading, isError, error } = useMutation({
    
    mutationFn: createNewCallRecord,

    onMutate: () => setCreatingNewCallRecord(true),

    onSettled: () => { setCreatingNewCallRecord(false); },

  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <BreadCrumb linkText="Sales Data" />
      <div className="sales-data">
      <div className="add-client-container">

        <div className="form-container">

        {
          id ? <h2 style={{color:'#3E6A9F'}}>Update Data</h2> : <h2 style={{color:'#3E6A9F'}}>Add New Data</h2>
        }
       

          <div className="form-content">

          { id && loadingCallRecordDetails ? (
            <Skeleton active paragraph={{ rows: 8 }} />
            ) : callRecordDetails && Object.keys(callRecordDetails).length > 0 ? (
            <Formik
              initialValues={{
                representative_name: callRecordDetails?.representative_name || '',
                representative_email: callRecordDetails?.representative_email || '',
                representative_phone: callRecordDetails?.representative_phone || '',
                representative_designation: callRecordDetails?.representative_designation || '',
                entity_type: callRecordDetails?.entity_type || '',
                company_name: callRecordDetails?.company_name || '',
                industry: callRecordDetails?.industry || '',
                company_email: callRecordDetails?.company_email || '',
                company_phone: callRecordDetails?.company_phone || '',                
                city: callRecordDetails?.city || '',
                country: callRecordDetails?.country || '',
                website: callRecordDetails?.website || '',
                linkedin: callRecordDetails?.linkedin || '',
                status: callRecordDetails?.status || '',
                acquired_through: callRecordDetails?.acquired_through || '',
                acquired_through_other: callRecordDetails?.acquired_through_other || '',
                data_entry_date: callRecordDetails?.data_entry_date || '',
                followup_date: callRecordDetails?.followup_date || '',
                next_followup_date: callRecordDetails?.next_followup_date || '',
                remarks: callRecordDetails?.remarks || '',
              }}
              validationSchema={setDataValidationSchema}
              onSubmit={(values, { resetForm }) => {
                mutate({id, values}, {
                  onSuccess: () => {
                    message.success("Data Updated Successfully");
                    resetForm();
                    timeoutRef.current = setTimeout(() => {
                      navigate(-1);
                    }, 1000);
                  },
                  onError: (res) => {
                    message.error(res.message ? res.message : "something went wrong");
                  }
                });
              }}
            >
              {({ values, setFieldValue, errors, touched }) => (

                <Form layout="vertical">


                <h3 className="section-heading">Representative Information</h3>
                  <div className="form-section form-section-mg-bottom">

                    <div className="form-field">
                      <Field name="representative_name">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Name<sup>*</sup></label>
                            <Input {...field} placeholder="Enter name" />
                            {errors.representative_name && touched.representative_name && (
                              <div className="error-message">{errors.representative_name}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field">
                      <Field name="representative_email">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Email<sup>*</sup></label>
                            <Input {...field} placeholder="Enter email" />
                            {errors.representative_email && touched.representative_email && (
                              <div className="error-message">{errors.representative_email}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field">
                      <Field name="representative_phone">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Phone<sup>*</sup></label>
                            <Input {...field} placeholder="Enter phone" />
                            {errors.representative_phone && touched.representative_phone && (
                              <div className="error-message">{errors.representative_phone}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field">
                      <Field name="representative_designation">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Designation</label>
                            <Input {...field} placeholder="Enter designation" />
                            {errors.representative_designation && touched.representative_designation && (
                              <div className="error-message">{errors.representative_designation}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>
      
                  </div>



                  <h3 className="section-heading">Company Information</h3>
                  <div className="form-section form-section-mg-bottom">


                  <div className="form-field">
                      <Field name="entity_type">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Entity Type<sup>*</sup></label>
                            <Select
                              {...field}
                              value={field.value}
                              onChange={(value) => {
                                setFieldValue("entity_type", value);
                                handleChange(value);
                              }}
                              placeholder="Select an entity type"
                            >
                              <Option value="" disabled>
                                Entity Type
                              </Option>

                              <Option value="Company">Company</Option>
                              <Option value="Freelancer">Freelancer</Option>
                            </Select>
                            {errors.entity_type && touched.entity_type && (
                              <div className="error-message">{errors.entity_type}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>

                  {
                    entityType === 'Company' && 
                      <>

                        <div className="form-field">
                          <Field name="company_name">
                            {({ field }) => (
                              <div className="form-item">
                                <label>Company Name<sup>*</sup></label>
                                <Input {...field} placeholder="Enter name" />
                                {errors.company_name && touched.company_name && (
                                  <div className="error-message">{errors.company_name}</div>
                                )}
                              </div>
                            )}
                          </Field>
                        </div>

                        <div className="form-field margin-top">
                          <div className="form-item">
                            <label>Industry</label>
                              <IndustryAutoSelect 
                                name='industry'
                                value={values.industry}
                                onChange={setFieldValue}
                              />
                              {errors.industry && touched.industry && (
                                <div className="error-message">{errors.industry}</div>
                              )}
                          </div>
                        </div>


                        <div className="form-field">
                          <Field name="company_email">
                            {({ field }) => (
                              <div className="form-item">
                                <label>Company Email</label>
                                <Input {...field} placeholder="Enter email" />
                                {errors.company_email && touched.company_email && (
                                  <div className="error-message">{errors.company_email}</div>
                                )}
                              </div>
                            )}
                          </Field>
                        </div>


                        <div className="form-field">
                          <Field name="company_phone">
                            {({ field }) => (
                              <div className="form-item">
                                <label>Company Phone</label>
                                <Input {...field} placeholder="Enter phone" />
                                {errors.company_phone && touched.company_phone && (
                                  <div className="error-message">{errors.company_phone}</div>
                                )}
                              </div>
                            )}
                          </Field>
                        </div>
    
                      </>
                  }

                      <>
                        
    
                        {/* <div className="form-field margin-top">
                          <Field name="facebook">
                            {({ field }) => (
                              <div className="form-item">
                                <label>Facebook Profile</label>
                                <Input {...field} placeholder="Enter facebook profile" />
                                {errors.facebook && touched.facebook && (
                                  <div className="error-message">{errors.facebook}</div>
                                )}
                              </div>
                            )}
                          </Field>
                        </div>                         */}

                        <div className="form-field margin-top">
                          <div className="form-item">
                            <label>City<sup>*</sup></label>
                              <CityAutoSelect 
                                name='city'
                                value={values.city}
                                onChange={setFieldValue}
                              />
                              {errors.city && touched.city && (
                                <div className="error-message">{errors.city}</div>
                              )}
                          </div>
                        </div>

                        <div className="form-field margin-top">
                          <div className="form-item">
                            <label>Country<sup>*</sup></label>
                              <CountryAutoSelect 
                                name='country'
                                value={values.country}
                                onChange={setFieldValue}
                              />
                              {errors.country && touched.country && (
                                <div className="error-message">{errors.country}</div>
                              )}
                          </div>
                        </div> 

                        {
                          entityType === 'Company' && 
                            <>
                              <div className="form-field margin-top">
                                <Field name="website">
                                  {({ field }) => (
                                    <div className="form-item">
                                      <label>Website URL</label>
                                      <Input {...field} placeholder="Enter website URL" />
                                      {errors.website && touched.website && (
                                        <div className="error-message">{errors.website}</div>
                                      )}
                                    </div>
                                  )}
                                </Field>
                              </div>
                            </>
                        }

                        <div className="form-field margin-top">
                          <Field name="linkedin">
                            {({ field }) => (
                              <div className="form-item">
                                <label>LinkedIn Profile</label>
                                <Input {...field} placeholder="Enter linkedIn profile" />
                                {errors.linkedin && touched.linkedin && (
                                  <div className="error-message">{errors.linkedin}</div>
                                )}
                              </div>
                            )}
                          </Field>
                        </div>
                      </>
                  </div>



                  <h3 className="section-heading">Additional Information</h3>
                  <div className="form-section">

                  <div className="form-field">
                    <Field name="status">
                      {({ field }) => (
                        <div className="form-item">
                          <label>Status<sup>*</sup></label>
                          <Select
                            {...field}
                            value={field.value || "Select status"}
                            onChange={(value) => {
                              setFieldValue("status", value);
                            }}
                          >
                            <Option value="Pending Contact">Pending Contact</Option>
                            <Option value="Contacted But No Response">Contacted But No Response</Option>
                            <Option value="Dead Data - Contacted But No Response">Dead Data - Contacted But No Response</Option>
                            <Option value="Dead Data - Contacted But Not Interested At The Moment">Dead Data - Contacted But Not Interested At The Moment</Option>
                            <Option value="Dead Data - Never Contact Again">Dead Data - Never Contact Again</Option>
                            {/* <Option value="Potential Client">Potential Client</Option> */}
                          </Select>
                          {errors.status && touched.status && (
                            <div className="error-message">{errors.status}</div>
                          )}
                        </div>
                      )}
                    </Field>
                  </div>

                  <div className="form-field">
                      <Field name="acquired_through">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Acquired Through<sup>*</sup></label>
                            <Select
                              {...field}
                              value={field.value}
                              onChange={(value) => {
                                setFieldValue("acquired_through", value);
                                setShowOthers(value === "Other");
                              }}
                              placeholder="Acquired Through"
                            >
                              <Option value="" disabled>
                                Acquired Through
                              </Option>

                              <Option value="LinkedIn">LinkedIn</Option>
                              <Option value="Facebook">Facebook</Option>
                              <Option value="WhatsApp">Whatsapp</Option>
                              <Option value="Referral">Referral</Option>
                              <Option value="Other">Other</Option>
                            </Select>
                            {errors.acquired_through && touched.acquired_through && (
                              <div className="error-message">{errors.acquired_through}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>

                    {
                      showOthers &&
                      <>
                        <div className="form-field">
                        <Field name="acquired_through_other">
                          {({ field }) => (
                            <div className="form-field">
                              <div className="form-item">
                                <label>Acquired Through Other<sup>*</sup></label>
                                <Input
                                  {...field}
                                  placeholder="Enter your resource"
                                />
                                {errors.acquired_through_other && touched.acquired_through_other && (
                                  <div className="error-message">{errors.acquired_through_other}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </Field>
                        </div>
                      </>
                    }


                  {/* <div className="form-field">
                    <Field name="data_entry_date">
                      {({ field }) => (
                        <div className="form-item">
                          <label>Data Entry Date<sup>*</sup></label>
                          <Input
                            {...field}
                            value={dayjs().format('DD-MM-YYYY')}
                            disabled
                          />
                          {errors.data_entry_date && touched.data_entry_date && (
                            <div className="error-message">{errors.data_entry_date}</div>
                          )}
                        </div>
                      )}
                    </Field>
                  </div>
 */}


                  <div className="form-field">
                      <Field name="followup_date">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Follow-Up Date<sup>*</sup></label>
                            <DatePicker
                              value={values.followup_date ? dayjs(values.followup_date) : ''}
                              onChange={(date) =>
                                setFieldValue(
                                  "followup_date",
                                  date ? date.toISOString() : null
                                )
                              }
                              placeholder="Select a date"
                              format="DD-MM-YYYY"
                            />
                            {errors.followup_date && touched.followup_date && (
                              <div className="error-message">{errors.followup_date}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field">
                      <Field name="next_followup_date">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Next Follow-Up Date</label>
                            <DatePicker
                              value={values.next_followup_date ? dayjs(values.next_followup_date) : ''}
                              onChange={(date) =>
                                setFieldValue(
                                  "next_followup_date",
                                  date ? date.toISOString() : null
                                )
                              }
                              placeholder="Select a date"
                              format="DD-MM-YYYY"
                            />
                            {errors.next_followup_date && touched.next_followup_date && (
                              <div className="error-message">{errors.next_followup_date}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>                    

                  </div>

                  <div style={{marginTop:'16px'}}>
                    <Field name="remarks">
                      {({ field }) => (
                        <div className="form-item">
                          <label>Remarks<sup>*</sup></label>
                          <TextArea
                            {...field}
                            placeholder="Enter remarks"
                            rows={4}
                          />
                          {errors.remarks && touched.remarks && (
                            <div className="error-message">{errors.remarks}</div>
                          )}
                        </div>
                      )}
                    </Field>
                  </div>

                  <div className="form-submit">
                    <Button className="project-button" type="primary" variant='filled' htmlType="submit" style={{ marginBottom: '20px' }} loading={creatingNewCallRecord} >
                      Update
                    </Button>
                  </div>

                </Form>
              )}
            </Formik>
            ) : (
            <Formik
              initialValues={{
                representative_name: "",
                representative_email: "",
                representative_phone: "",
                representative_designation: "",
                entity_type: "",
                company_name: "",
                industry: "",
                company_email: "",
                company_phone: "",                
                city: "",
                country: "",
                website: "",
                linkedin: "",
                status: "",
                acquired_through: "",
                acquired_through_other: "",
                data_entry_date: dayjs().format('YYYY-MM-DD'),
                followup_date: "",
                next_followup_date: "",
                remarks: "",
              }}
              validationSchema={setDataValidationSchema}
              onSubmit={(values, { resetForm }) => {
                mutate({values}, {
                  onSuccess: () => {
                    message.success("Data Added Successfully");
                    resetForm();
                    timeoutRef.current = setTimeout(() => {
                      navigate(-1);
                    }, 1000);
                  },
                  onError: (res) => {
                    message.error(res.message ? res.message : "something went wrong");
                  }
                });
              }}
            >
              {({ values, setFieldValue, errors, touched }) => (

                <Form layout="vertical">


                <h3 className="section-heading">Representative Information</h3>
                  <div className="form-section form-section-mg-bottom">

                    <div className="form-field">
                      <Field name="representative_name">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Name<sup>*</sup></label>
                            <Input {...field} placeholder="Enter name" />
                            {errors.representative_name && touched.representative_name && (
                              <div className="error-message">{errors.representative_name}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field">
                      <Field name="representative_email">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Email<sup>*</sup></label>
                            <Input {...field} placeholder="Enter email" />
                            {errors.representative_email && touched.representative_email && (
                              <div className="error-message">{errors.representative_email}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field">
                      <Field name="representative_phone">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Phone<sup>*</sup></label>
                            <Input {...field} placeholder="Enter phone" />
                            {errors.representative_phone && touched.representative_phone && (
                              <div className="error-message">{errors.representative_phone}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field">
                      <Field name="representative_designation">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Designation</label>
                            <Input {...field} placeholder="Enter designation" />
                            {errors.representative_designation && touched.representative_designation && (
                              <div className="error-message">{errors.representative_designation}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>
      
                  </div>


                  <h3 className="section-heading">Company Information</h3>
                  <div className="form-section form-section-mg-bottom">

                  <div className="form-field">
                      <Field name="entity_type">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Entity Type<sup>*</sup></label>
                            <Select
                              {...field}
                              value={field.value}
                              onChange={(value) => {
                                setFieldValue("entity_type", value);
                                handleChange(value);
                              }}
                              placeholder="Select an entity type"
                            >
                              <Option value="" disabled>
                                Entity Type
                              </Option>

                              <Option value="Company">Company</Option>
                              <Option value="Freelancer">Freelancer</Option>
                            </Select>
                            {errors.entity_type && touched.entity_type && (
                              <div className="error-message">{errors.entity_type}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>
                  {
                    entityType === 'Company' && 
                      <>

                        <div className="form-field">
                          <Field name="company_name">
                            {({ field }) => (
                              <div className="form-item">
                                <label>Company Name<sup>*</sup></label>
                                <Input {...field} placeholder="Enter name" />
                                {errors.company_name && touched.company_name && (
                                  <div className="error-message">{errors.company_name}</div>
                                )}
                              </div>
                            )}
                          </Field>
                        </div>

                        <div className="form-field margin-top">
                          <div className="form-item">
                            <label>Industry</label>
                              <IndustryAutoSelect 
                                name='industry'
                                value={values.industry}
                                onChange={setFieldValue}
                              />
                              {errors.industry && touched.industry && (
                                <div className="error-message">{errors.industry}</div>
                              )}
                          </div>
                        </div>


                        <div className="form-field">
                          <Field name="company_email">
                            {({ field }) => (
                              <div className="form-item">
                                <label>Company Email</label>
                                <Input {...field} placeholder="Enter email" />
                                {errors.company_email && touched.company_email && (
                                  <div className="error-message">{errors.company_email}</div>
                                )}
                              </div>
                            )}
                          </Field>
                        </div>


                        <div className="form-field">
                          <Field name="company_phone">
                            {({ field }) => (
                              <div className="form-item">
                                <label>Company Phone</label>
                                <Input {...field} placeholder="Enter phone" />
                                {errors.company_phone && touched.company_phone && (
                                  <div className="error-message">{errors.company_phone}</div>
                                )}
                              </div>
                            )}
                          </Field>
                        </div>
    
                      </>
                  }

                      <>
                        <div className="form-field margin-top">
                          <div className="form-item">
                            <label>City<sup>*</sup></label>
                              <CityAutoSelect 
                                name='city'
                                value={values.city}
                                onChange={setFieldValue}
                              />
                              {errors.city && touched.city && (
                                <div className="error-message">{errors.city}</div>
                              )}
                          </div>
                        </div>

                        <div className="form-field margin-top">
                          <div className="form-item">
                            <label>Country<sup>*</sup></label>
                              <CountryAutoSelect 
                                name='country'
                                value={values.country}
                                onChange={setFieldValue}
                              />
                              {errors.country && touched.country && (
                                <div className="error-message">{errors.country}</div>
                              )}
                          </div>
                        </div> 

                        {
                          entityType === 'Company' && 
                            <>
                              <div className="form-field margin-top">
                                <Field name="website">
                                  {({ field }) => (
                                    <div className="form-item">
                                      <label>Website URL</label>
                                      <Input {...field} placeholder="Enter website URL" />
                                      {errors.website && touched.website && (
                                        <div className="error-message">{errors.website}</div>
                                      )}
                                    </div>
                                  )}
                                </Field>
                              </div>
                            </>
                        }

                        <div className="form-field margin-top">
                          <Field name="linkedin">
                            {({ field }) => (
                              <div className="form-item">
                                <label>LinkedIn Profile</label>
                                <Input {...field} placeholder="Enter linkedIn profile" />
                                {errors.linkedin && touched.linkedin && (
                                  <div className="error-message">{errors.linkedin}</div>
                                )}
                              </div>
                            )}
                          </Field>
                        </div>
                      </>
                  </div>


                  

                  <h3 className="section-heading">Additional Information</h3>
                  <div className="form-section" style={{marginBottom:'16px'}}>

                  <div className="form-field">
                    <Field name="status">
                      {({ field }) => (
                        <div className="form-item">
                          <label>Status<sup>*</sup></label>
                          <Select
                            {...field}
                            value={field.value || "Select status"}
                            onChange={(value) => {
                              setFieldValue("status", value);
                            }}
                          >
                            <Option value="Pending Contact">Pending Contact</Option>
                            <Option value="Contacted But No Response">Contacted But No Response</Option>
                            <Option value="Dead Data - Contacted But No Response">Dead Data - Contacted But No Response</Option>
                            <Option value="Dead Data - Contacted But Not Interested At The Moment">Dead Data - Contacted But Not Interested At The Moment</Option>
                            <Option value="Dead Data - Never Contact Again">Dead Data - Never Contact Again</Option>
                            {/* <Option value="Potential Client">Potential Client</Option> */}
                          </Select>
                          {errors.status && touched.status && (
                            <div className="error-message">{errors.status}</div>
                          )}
                        </div>
                      )}
                    </Field>
                  </div>

                  <div className="form-field">
                      <Field name="acquired_through">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Acquired Through<sup>*</sup></label>
                            <Select
                              {...field}
                              value={field.value}
                              onChange={(value) => {
                                setFieldValue("acquired_through", value);
                                setShowOthers(value === "Other");
                              }}
                              placeholder="Acquired Through"
                            >
                              <Option value="" disabled>
                                Acquired Through
                              </Option>

                              <Option value="LinkedIn">LinkedIn</Option>
                              <Option value="Facebook">Facebook</Option>
                              <Option value="WhatsApp">Whatsapp</Option>
                              <Option value="Referral">Referral</Option>
                              <Option value="Other">Other</Option>
                            </Select>
                            {errors.acquired_through && touched.acquired_through && (
                              <div className="error-message">{errors.acquired_through}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>

                    {
                      showOthers &&
                      <>
                        <div className="form-field">
                        <Field name="acquired_through_other">
                          {({ field }) => (
                            <div className="form-field">
                              <div className="form-item">
                                <label>Acquired Through Other<sup>*</sup></label>
                                <Input
                                  {...field}
                                  placeholder="Enter your resource"
                                />
                                {errors.acquired_through_other && touched.acquired_through_other && (
                                  <div className="error-message">{errors.acquired_through_other}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </Field>
                        </div>
                      </>
                    }


                  <div className="form-field">
                    <Field name="data_entry_date">
                      {({ field }) => (
                        <div className="form-item">
                          <label>Data Entry Date<sup>*</sup></label>
                          <Input
                            {...field}
                            value={dayjs().format('DD-MM-YYYY')}
                            readOnly
                            style={{color: '#3E6A9F'}}
                          />
                          {errors.data_entry_date && touched.data_entry_date && (
                            <div className="error-message">{errors.data_entry_date}</div>
                          )}
                        </div>
                      )}
                    </Field>
                  </div>



                  <div className="form-field">
                      <Field name="followup_date">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Follow-Up Date<sup>*</sup></label>
                            <DatePicker
                              value={values.followup_date ? dayjs(values.followup_date) : ''}
                              onChange={(date) =>
                                setFieldValue(
                                  "followup_date",
                                  date ? date.toISOString() : null
                                )
                              }
                              placeholder="Select a date"
                              format="DD-MM-YYYY"
                            />
                            {errors.followup_date && touched.followup_date && (
                              <div className="error-message">{errors.followup_date}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>
                  </div>

                  <div>
                    <Field name="remarks">
                      {({ field }) => (
                        <div className="form-item">
                          <label>Remarks<sup>*</sup></label>
                          <TextArea
                            {...field}
                            placeholder="Enter remarks"
                            rows={4}
                          />
                          {errors.remarks && touched.remarks && (
                            <div className="error-message">{errors.remarks}</div>
                          )}
                        </div>
                      )}
                    </Field>
                  </div>


                  <div className="form-submit">
                    <Button className="project-button" type="primary" variant='filled' htmlType="submit" style={{ marginBottom: '20px' }} loading={creatingNewCallRecord} >
                      Add
                    </Button>
                  </div>

                </Form>
              )}
            </Formik>
            )
          } 

          </div>

        </div>

      </div>
      </div>
    </>
  );
}

