import { message } from '../../../../components/ui/notifications.jsx';
import { Select } from '../../../../components/ui/app-select.jsx';
import { Input } from '../../../../components/ui/app-controls.jsx';
import { Button } from '../../../../components/ui/app-controls.jsx';
import React, { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { Formik, Form } from 'formik';
import { Row, Col, DatePicker } from 'antd';
import { LoaderCircle as LoadingOutlined } from 'lucide-react';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import { getClientDetails, updateHeadhuntingClientJSON } from '../../../shared/services/headhunting.js';
import { getManangersExecutives, getAssigningUsersListing } from '../../../shared/services/users-service.js';
import {
  clientHeadhuntingValidationSchema,
  headhuntingClientSalesExecutiveLimitedSchema,
} from '../../../shared/schemas/client.js';
import useUserStore from '../../../shared/store/user-store.js';
import dayjs from 'dayjs';
import '../../../../assets/styles/legacy/input-field.css';

const { TextArea } = Input;
const { Option } = Select;

const ACQUIRED_THROUGH_OPTIONS = [
  { label: 'LinkedIn', value: 'LinkedIn' },
  { label: 'Facebook', value: 'Facebook' },
  { label: 'WhatsApp', value: 'WhatsApp' },
  { label: 'Referral', value: 'Referral' },
  { label: 'Other', value: 'Other' },
];

const initialIndustryOptions = [
  { label: 'Technology', value: 'Technology' },
  { label: 'Healthcare', value: 'Healthcare' },
  { label: 'Finance', value: 'Finance' },
  { label: 'Education', value: 'Education' },
  { label: 'Manufacturing', value: 'Manufacturing' },
  { label: 'Retail', value: 'Retail' },
  { label: 'Real Estate', value: 'Real Estate' },
  { label: 'Transportation', value: 'Transportation' },
  { label: 'Energy', value: 'Energy' },
  { label: 'Media & Entertainment', value: 'Media & Entertainment' },
  { label: 'Consulting', value: 'Consulting' },
  { label: 'Legal', value: 'Legal' },
  { label: 'Government', value: 'Government' },
  { label: 'Other', value: 'Other' },
];

function sortIndustries(arr) {
  return arr.slice().sort((a, b) => a.label.localeCompare(b.label));
}



export default function EditClientHeadhunting() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isSubmitRef = useRef(false);
  const { user } = useUserStore();
  const isAdmin = user?.user_type === 'admin';
  const isSalesManager = user?.user_type === 'sales_manager';
  const isSalesExecutive = user?.user_type === 'sales_executive';
  const canEditFullClient = isAdmin || isSalesManager;
  /** Admin / manager: all fields; sales executive: all except email + phone */
  const canEditAllExceptContact = canEditFullClient || isSalesExecutive;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goBack = () => {
    navigate(-1);
  };

  // Fetch executives list for Assign To dropdown
  const { data: executivesData } = useQuery({
    queryKey: ['executiveList', user?.user_type],
    queryFn: () => user?.user_type === 'admin'
      ? getManangersExecutives()
      : getAssigningUsersListing('sales_executive'),
    enabled: isAdmin || isSalesManager,
    staleTime: 0,
  });

  const executivesList = useMemo(() => {
    if (user?.user_type === 'admin') {
      const allUsers = executivesData || [];
      return allUsers;
    }
    return executivesData || [];
  }, [executivesData, user?.user_type]);

  // Fetch client details
  const { data: clientData, isLoading: clientLoading, error: clientError } = useQuery(
    ['clientDetails', id],
    () => getClientDetails(id),
    {
      enabled: !!id,
      staleTime: 0,
      cacheTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );

  const updateClientMutation = useMutation(
    async (values) => {
      console.log('Updating client with values:', values);
      const response = await updateHeadhuntingClientJSON(id, values);
      return response;
    },
    {
      onSuccess: (response) => {
        if (isSubmitRef.current) {
          message.success('Client updated successfully');
          navigate(-1);
        }
      },
      onError: (error) => {
        console.error('Error updating client:', error);
        if (isSubmitRef.current) {
          message.error(error.message || 'Failed to update client');
        }
      },
      onSettled: () => {
        isSubmitRef.current = false;
      },
    }
  );

  const handleAutoSave = async (event, key, value, formikValues) => {
    if (!clientData) {
      return;
    }
    const mayAutoSaveField =
      canEditFullClient ||
      (isSalesExecutive && key !== 'email' && key !== 'phone_number');
    if (!mayAutoSaveField) {
      return;
    }
    
    // Prepare the full payload from current formik values
    const fullPayload = {
      ...formikValues,
      followup_date: formikValues.followup_date && dayjs(formikValues.followup_date).isValid()
        ? dayjs(formikValues.followup_date).format('YYYY-MM-DD')
        : null,
      phone_number: formikValues.phone_number ? formikValues.phone_number.trim() : '',
    };

    // Handle different field types
    let payloadValue = value;
    if (value === '') {
      payloadValue = null;
    }
    
    // Update the specific field in the payload to ensure it has the latest value from the event
    fullPayload[key] = payloadValue;
    
    // Special handling for followup_date in the localized check
    const originalValue = key === 'followup_date' 
      ? (clientData[key] ? dayjs(clientData[key]).format('YYYY-MM-DD') : null)
      : clientData[key];
    
    const newValue = key === 'followup_date'
      ? (payloadValue ? dayjs(payloadValue).format('YYYY-MM-DD') : null)
      : payloadValue;

    // Only save if the value is different from original and not undefined
    if (newValue !== originalValue && newValue !== undefined) {
      isSubmitRef.current = false;
      if (isSalesExecutive) {
        const executivePayload = {
          company_name: (fullPayload.company_name || '').trim(),
          contact_person_name: (fullPayload.contact_person_name || '').trim(),
          contact_person_designation: (fullPayload.contact_person_designation || '').trim(),
          industry: fullPayload.industry || '',
          remarks: fullPayload.remarks || '',
          followup_date: fullPayload.followup_date,
          acquired_through: fullPayload.acquired_through || '',
          acquired_through_other: fullPayload.acquired_through_other || '',
        };
        updateClientMutation.mutate(executivePayload);
      } else {
        updateClientMutation.mutate(fullPayload);
      }
    }
  };

  if (clientLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <LoadingOutlined size="1em" className="app-icon app-icon-spin" style={{ fontSize: 24 }}  />
      </div>
    );
  }

  if (clientError) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h3>Error loading client details</h3>
        <p>{clientError.message}</p>
        <Button onClick={goBack}>Go Back</Button>
      </div>
    );
  }

  const initialValues = {
    converted_from_lead: clientData?.converted_from_lead || '',
    added_by: clientData?.added_by || '',
    assigned_to: clientData?.assigned_to || '',
    industry: clientData?.industry || '',
    company_name: clientData?.company_name || '',
    contact_person_name: clientData?.contact_person_name || '',
    contact_person_designation: clientData?.contact_person_designation || '',
    email: clientData?.email || '',
    phone_number: clientData?.phone_number || '',
    remarks: clientData?.remarks || '',
    followup_date: clientData?.followup_date ? (dayjs(clientData.followup_date).isValid() ? dayjs(clientData.followup_date) : null) : null,
    acquired_through: clientData?.acquired_through || '',
    acquired_through_other: clientData?.acquired_through_other || '',
  };

  return (
    <>
      <BreadCrumb goBack={goBack} linkText="Edit" />
      
      <div className="container">
        <div className="form-container">
          <h2 className="form-title">Edit Client</h2>
          
          <Formik
            initialValues={initialValues}
            enableReinitialize
            validationSchema={
              isSalesExecutive
                ? headhuntingClientSalesExecutiveLimitedSchema
                : clientHeadhuntingValidationSchema
            }
            onSubmit={async (values) => {
              console.log('Form values on submit:', values);
              
              if (!values.company_name.trim()) {
                message.error('Company name is required');
                return;
              }
              
              if (!isSalesExecutive && !values.email.trim()) {
                message.error('Email is required');
                return;
              }
              
              isSubmitRef.current = true;
              setIsSubmitting(true);
              const payload = isSalesExecutive
                ? {
                    company_name: values.company_name.trim(),
                    contact_person_name: values.contact_person_name.trim(),
                    contact_person_designation:
                      values.contact_person_designation.trim(),
                    industry: values.industry || '',
                    remarks: values.remarks || '',
                    followup_date: values.followup_date && dayjs(values.followup_date).isValid()
                      ? dayjs(values.followup_date).format('YYYY-MM-DD')
                      : null,
                    acquired_through: values.acquired_through || '',
                    acquired_through_other: values.acquired_through_other || '',
                  }
                : {
                    ...values,
                    followup_date: values.followup_date && dayjs(values.followup_date).isValid()
                      ? dayjs(values.followup_date).format('YYYY-MM-DD')
                      : null,
                    phone_number: values.phone_number ? values.phone_number.trim() : '',
                  };
              updateClientMutation.mutate(payload, {
                onSettled: () => {
                  setIsSubmitting(false);
                },
              });
            }}
          >
            {({ values, errors, touched, handleChange, handleBlur, setFieldValue, setFieldTouched }) => {
              // sync showAcquiredOther with current form value
              const acquiredOther = values.acquired_through === 'Other';
              return (
              <Form>
                <Row gutter={[16, 24]}>
                  {/* 1. Company Name */}
                  <Col xs={24} sm={12} lg={8}>
                    <label htmlFor="company_name" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Company Name*
                    </label>
                    <Input
                      name="company_name"
                      value={values.company_name}
                      onChange={handleChange}
                      onBlur={(event) => {
                        handleBlur(event);
                        handleAutoSave(event, 'company_name', values.company_name, values);
                      }}
                      disabled={!canEditAllExceptContact}
                      placeholder="Company Name"
                      className="antd-input styled-input custom-input"
                      style={{ border: '1px solid #3E6A9F', borderRadius: '6px' }}
                      status={errors.company_name && touched.company_name ? 'error' : ''}
                    />
                    {errors.company_name && touched.company_name && (
                      <div className="text-red">{errors.company_name}</div>
                    )}
                  </Col>

                  {/* 2. Contact Person Name */}
                  <Col xs={24} sm={12} lg={8}>
                    <label htmlFor="contact_person_name" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Contact Person Name*
                    </label>
                    <Input
                      name="contact_person_name"
                      value={values.contact_person_name}
                      onChange={handleChange}
                      onBlur={(event) => handleAutoSave(event, 'contact_person_name', values.contact_person_name, values)}
                      disabled={!canEditAllExceptContact}
                      placeholder="Contact Person Name"
                      className="antd-input styled-input custom-input"
                      style={{ border: '1px solid #3E6A9F', borderRadius: '6px' }}
                      status={errors.contact_person_name && touched.contact_person_name ? 'error' : ''}
                    />
                    {errors.contact_person_name && touched.contact_person_name && (
                      <div className="text-red">{errors.contact_person_name}</div>
                    )}
                  </Col>

                  {/* 3. Designation */}
                  <Col xs={24} sm={12} lg={8}>
                    <label htmlFor="contact_person_designation" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Contact Person Designation*
                    </label>
                    <Input
                      name="contact_person_designation"
                      value={values.contact_person_designation}
                      onChange={handleChange}
                      onBlur={(event) => handleAutoSave(event, 'contact_person_designation', values.contact_person_designation, values)}
                      disabled={!canEditAllExceptContact}
                      placeholder="Contact Person Designation"
                      className="antd-input styled-input custom-input"
                      style={{ border: '1px solid #3E6A9F', borderRadius: '6px' }}
                      status={errors.contact_person_designation && touched.contact_person_designation ? 'error' : ''}
                    />
                    {errors.contact_person_designation && touched.contact_person_designation && (
                      <div className="text-red">{errors.contact_person_designation}</div>
                    )}
                  </Col>

                  {/* 4. Email */}
                  <Col xs={24} sm={12} lg={8}>
                    <label htmlFor="email" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Email*
                    </label>
                    <Input
                      name="email"
                      type="email"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={(event) => handleAutoSave(event, 'email', values.email, values)}
                      disabled={!canEditFullClient}
                      placeholder="Email"
                      className="antd-input styled-input custom-input"
                      style={{ border: '1px solid #3E6A9F', borderRadius: '6px' }}
                      status={errors.email && touched.email ? 'error' : ''}
                    />
                    {errors.email && touched.email && (
                      <div className="text-red">{errors.email}</div>
                    )}
                  </Col>

                  {/* 5. Phone */}
                  <Col xs={24} sm={12} lg={8}>
                    <label htmlFor="phone_number" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Phone Number*
                    </label>
                    <Input
                      name="phone_number"
                      value={values.phone_number}
                      onChange={handleChange}
                      onBlur={(event) => handleAutoSave(event, 'phone_number', values.phone_number, values)}
                      disabled={!canEditFullClient}
                      placeholder="Phone Number"
                      className="antd-input styled-input custom-input"
                      style={{ border: '1px solid #3E6A9F', borderRadius: '6px' }}
                      status={errors.phone_number && touched.phone_number ? 'error' : ''}
                    />
                    {errors.phone_number && touched.phone_number && (
                      <div className="text-red">{errors.phone_number}</div>
                    )}
                  </Col>

                  {/* 6. Industry */}
                  <Col xs={24} sm={12} lg={8}>
                    <label className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Industry*
                    </label>
                    <Select
                      id="industry"
                      mode="tags"
                      value={values.industry ? [values.industry] : []}
                      onChange={(value) => {
                        const newValue = Array.isArray(value) ? value[value.length - 1] : value;
                        setFieldValue('industry', newValue);
                      }}
                      onBlur={(event) => handleAutoSave(event, 'industry', values.industry, values)}
                      disabled={!canEditAllExceptContact}
                      className={errors.industry && touched.industry ? 'antd-input dropdown error-input' : 'antd-input dropdown'}
                      placeholder="Select or type Industry"
                      name="industry"
                      style={{ width: '100%' }}
                      allowClear
                      showSearch
                      options={sortIndustries(initialIndustryOptions)}
                    />
                    {errors.industry && touched.industry && (
                      <div className="text-red">{errors.industry}</div>
                    )}
                  </Col>

                  {/* 7. Remarks */}
                  <Col xs={24} sm={24} md={24} lg={24}>
                    <label htmlFor="remarks" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Remarks
                    </label>
                    <TextArea
                      name="remarks"
                      value={values.remarks}
                      onChange={handleChange}
                      onBlur={(event) => handleAutoSave(event, 'remarks', values.remarks, values)}
                      disabled={!canEditAllExceptContact}
                      placeholder="Remarks"
                      rows={3}
                      className="antd-input styled-input custom-input"
                      style={{ border: '1px solid #3E6A9F', borderRadius: '6px' }}
                      status={errors.remarks && touched.remarks ? 'error' : ''}
                    />
                    {errors.remarks && touched.remarks && (
                      <div className="text-red">{errors.remarks}</div>
                    )}
                  </Col>

                  {/* Followup Date */}
                  <Col xs={24} sm={12} lg={8}>
                    <label className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Followup Date
                    </label>
                    <DatePicker
                      name="followup_date"
                      value={values.followup_date && dayjs(values.followup_date).isValid() ? dayjs(values.followup_date) : null}
                      onChange={(date) => {
                        setFieldValue('followup_date', date);
                        handleAutoSave(null, 'followup_date', date ? date.format('YYYY-MM-DD') : null, values);
                      }}
                      format="DD/MM/YYYY"
                      disabled={!canEditAllExceptContact}
                      className={errors.followup_date && touched.followup_date ? 'antd-input styled-input error-input' : 'antd-input styled-input'}
                      style={{ width: '100%' }}
                    />
                    {errors.followup_date && touched.followup_date && (
                      <div className="text-red">{errors.followup_date}</div>
                    )}
                  </Col>

                  {/* Acquired Through */}
                  <Col xs={24} sm={12} lg={8}>
                    <label className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Acquired Through*
                    </label>
                    <Select
                      name="acquired_through"
                      value={values.acquired_through || undefined}
                      onChange={(value) => {
                        setFieldValue('acquired_through', value);
                        handleAutoSave(null, 'acquired_through', value, values);
                      }}
                      onBlur={() => setFieldTouched('acquired_through', true)}
                      disabled={!canEditAllExceptContact}
                      placeholder="Select Acquired Through"
                      className={`antd-input dropdown${errors.acquired_through && touched.acquired_through ? ' error-input' : ''}`}
                      style={{ width: '100%' }}
                      allowClear
                      onClear={() => setFieldValue('acquired_through', '')}
                    >
                      {ACQUIRED_THROUGH_OPTIONS.map((opt) => (
                        <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                      ))}
                    </Select>
                    {errors.acquired_through && touched.acquired_through && (
                      <div className="text-red">{errors.acquired_through}</div>
                    )}
                  </Col>

                  {/* Acquired Through Other */}
                  {acquiredOther && (
                    <Col xs={24} sm={12} lg={8}>
                      <label className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                        Acquired Through (Other)
                      </label>
                      <Input
                        name="acquired_through_other"
                        value={values.acquired_through_other}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={!canEditAllExceptContact}
                        placeholder="Enter Acquired Through Other"
                        className="antd-input styled-input custom-input"
                        style={{ border: '1px solid #3E6A9F', borderRadius: '6px' }}
                        status={errors.acquired_through_other && touched.acquired_through_other ? 'error' : ''}
                      />
                      {errors.acquired_through_other && touched.acquired_through_other && (
                        <div className="text-red">{errors.acquired_through_other}</div>
                      )}
                    </Col>
                  )}

                  {/* Assign To (managers and admins only) */}
                  {(isAdmin || isSalesManager) && (
                    <Col xs={24} sm={12} lg={8}>
                      <label className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                        Assign To*
                      </label>
                      <Select
                        labelInValue
                        value={values.assigned_to ? { value: values.assigned_to, label: (executivesList.find(e => e.id === values.assigned_to)?.name || values.assigned_to) } : undefined}
                        onChange={(option) => {
                          const val = option?.value || '';
                          setFieldValue('assigned_to', val);
                          handleAutoSave(null, 'assigned_to', val, values);
                        }}
                        onBlur={() => setFieldTouched('assigned_to', true)}
                        disabled={!canEditFullClient}
                        placeholder="Select Assignee"
                        style={{ width: '100%' }}
                        className={`antd-input dropdown${errors.assigned_to && touched.assigned_to ? ' error-input' : ''}`}
                        allowClear
                        onClear={() => setFieldValue('assigned_to', '')}
                      >
                        {executivesList.map((executive) => (
                          <Option key={executive.id} value={executive.id}>
                            {executive?.name} - {executive?.user_type === 'sales_manager' ? 'Manager' : 'Executive'}
                          </Option>
                        ))}
                        {isSalesManager && (
                          <Option value={user?.id}>{user?.name}</Option>
                        )}
                      </Select>
                      {errors.assigned_to && touched.assigned_to && (
                        <div className="text-red">{errors.assigned_to}</div>
                      )}
                    </Col>
                  )}
                </Row>

                <Button
                  type="primary"
                  htmlType="submit"
                  className="custom-button"
                  style={{ marginTop: 24, background: '#3E6A9F', color: '#fff' }}
                  loading={updateClientMutation.isLoading || isSubmitting}
                  disabled={!canEditAllExceptContact}
                >
                  Update
                </Button>
              </Form>
              );
            }}
          </Formik>
        </div>
      </div>
    </>
  );
} 
