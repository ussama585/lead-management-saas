import { message } from '../../../../components/ui/notifications.jsx';
import { Select } from '../../../../components/ui/app-select.jsx';
import { Input } from '../../../../components/ui/app-controls.jsx';
import { Button, Spin } from '../../../../components/ui/app-controls.jsx';
import React, { useMemo, useState, useEffect } from 'react';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import { Col, Row, DatePicker, Form } from 'antd';
import { useFormik } from 'formik';
import { clientHeadhuntingValidationSchema } from '../../../shared/schemas/client.js';
import useUserStore from '../../../shared/store/user-store.js';
import { useQuery, useMutation } from 'react-query';
import { createHeadhuntingClient } from '../../../shared/services/headhunting.js';
import { getManangersExecutives, getAssigningUsersListing } from '../../../shared/services/users-service.js';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
const { Option } = Select;

const initialIndustryOptions = [
  { label: "Technology", value: "Technology" },
  { label: "Healthcare", value: "Healthcare" },
  { label: "Finance", value: "Finance" },
  { label: "Education", value: "Education" },
  { label: "Manufacturing", value: "Manufacturing" },
  { label: "Retail", value: "Retail" },
  { label: "Real Estate", value: "Real Estate" },
  { label: "Transportation", value: "Transportation" },
  { label: "Energy", value: "Energy" },
  { label: "Media & Entertainment", value: "Media & Entertainment" },
  { label: "Consulting", value: "Consulting" },
  { label: "Legal", value: "Legal" },
  { label: "Government", value: "Government" },
  { label: "Other", value: "Other" },
];

function sortIndustries(arr) {
  return arr.slice().sort((a, b) => a.label.localeCompare(b.label));
}


  
const statusOptions = [
  { label: 'Active', value: 'Active' },
  { label: 'Potential', value: 'Potential' },
  { label: 'Lost', value: 'Lost' },
];

const acquiredThroughOptions = [
  { label: 'LinkedIn', value: 'LinkedIn' },
  { label: 'Facebook', value: 'Facebook' },
  { label: 'WhatsApp', value: 'WhatsApp' },
  { label: 'Referral', value: 'Referral' },
  { label: 'Other', value: 'Other' },
];

export default function AddNewClientHeadhunting() {
  const user = useUserStore((state) => state.user);
  const [showAcquiredOther, setShowAcquiredOther] = useState(false);
  let navigate = useNavigate();
const goBack = () => {
       
               navigate(-1);
    }
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Fetch executives or managers/executives based on user type
  const { data } = useQuery({
    queryKey: ['executiveList', user?.user_type],
    queryFn: () => user?.user_type === 'admin' 
        ? getManangersExecutives()
        : getAssigningUsersListing('sales_executive'),
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const executivesList = useMemo(() => {
    if (user?.user_type === 'admin') {
      // For admin, data from getManangersExecutives() is directly the array
      const allUsers = data || []; // Data is directly the array
      return allUsers;
    }
    // For sales manager/executive, data from getAssigningUsersListing is directly the array
    return data || [];
  }, [data, user?.user_type]);
  

  const mutation = useMutation(createHeadhuntingClient, {
    onSuccess: () => {
      message.success('Client added successfully!');
      formik.resetForm();
      setIsSubmitting(false);
      navigate(-1);
    },
    onError: (error) => {
      message.error(error?.message || 'Failed to add client');
      setIsSubmitting(false);
    },
  });
  const formik = useFormik({
    initialValues: {
      converted_from_lead: '',
      added_by: '',
      // Default assignment: sales executives/managers assign to themselves by default
      assigned_to: (user?.user_type === 'sales_executive' || user?.user_type === 'sales_manager') ? user?.id : '',
      industry: '',
      company_name: '',
      contact_person_name: '',
      contact_person_designation: '',
      email: '',
      phone_number: '',
     
      remarks: '',
      followup_date: null,
      acquired_through: '',
      acquired_through_other: '',
    },
    validationSchema: clientHeadhuntingValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      setIsSubmitting(true);
      try {
        // Format followup_date to 'YYYY-MM-DD' if present
        const formattedValues = {
          ...values,
          followup_date: values.followup_date ? moment(values.followup_date).format('YYYY-MM-DD') : '',
          phone_number: values.phone_number ? values.phone_number.trim() : '',
          // Ensure assigned_to is a plain ID (number or string), never an object
          assigned_to: values.assigned_to ?? '',
        };
        
        await mutation.mutateAsync(formattedValues);
        // resetForm is called in onSuccess
      } catch (e) {
        // error handled in onError
      }
    },
  });

  useEffect(() => {
    setShowAcquiredOther(formik.values.acquired_through === 'Other');
  }, [formik.values.acquired_through]);

  return (
    <div className="lead-job-page">
      <BreadCrumb goBack={goBack} linkText="Clients" />
      <div className="container">
        <div className="job-card">
          <div className="container">
            <div className="row">
              <h1>Add New Client </h1>
            </div>
          </div>
          <div className="container">
            <form onSubmit={(e) => { formik.setTouched(Object.keys(formik.values).reduce((acc, k) => ({ ...acc, [k]: true }), {})); formik.handleSubmit(e); }}>
              <Row gutter={[10, { xs: 8, sm: 16, md: 24, lg: 32 }]}>  
                
                {/* Industry */}
                <Col span={6}>
                  <label className="form-label text-start mt-3 mb-1">Industry*</label>
                  <Select
                    id="industry"
                    mode="tags"
                    value={formik.values.industry ? [formik.values.industry] : []}
                    onChange={value => {
                      const newValue = Array.isArray(value) ? value[value.length - 1] : value;
                      formik.setFieldValue('industry', newValue);
                    }}
                    onBlur={formik.handleBlur}
                    className={formik.errors.industry && formik.touched.industry ? "antd-input dropdown error-input" : "antd-input dropdown"}
                    placeholder="Select or type Industry"
                    name="industry"
                    style={{ width: '100%' }}
                    allowClear
                    showSearch
                    options={sortIndustries(initialIndustryOptions)}
                  />
                  {formik.errors.industry && formik.touched.industry && (
                    <div className="text-red">{formik.errors.industry}</div>
                  )}
                </Col>
                <Col span={6}>
                  <label className="form-label text-start mt-3 mb-1">Company Name*</label>
                  <Input
                    name="company_name"
                    value={formik.values.company_name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Enter Company Name"
                    className="antd-input styled-input"
                    status={formik.errors.company_name && formik.touched.company_name ? 'error' : ''}
                  />
                  {formik.errors.company_name && formik.touched.company_name && (
                    <div className="text-red">{formik.errors.company_name}</div>
                  )}
                </Col>
                <Col span={6}>
                  <label className="form-label text-start mt-3 mb-1">Contact Person Name*</label>
                  <Input
                    name="contact_person_name"
                    value={formik.values.contact_person_name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Enter Contact Person Name"
                    className="antd-input styled-input"
                    status={formik.errors.contact_person_name && formik.touched.contact_person_name ? 'error' : ''}
                  />
                  {formik.errors.contact_person_name && formik.touched.contact_person_name && (
                    <div className="text-red">{formik.errors.contact_person_name}</div>
                  )}
                </Col>
                <Col span={6}>
                  <label className="form-label text-start mt-3 mb-1">Contact Person Designation*</label>
                  <Input
                    name="contact_person_designation"
                    value={formik.values.contact_person_designation}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Enter Contact Person Designation"
                    className="antd-input styled-input"
                    status={formik.errors.contact_person_designation && formik.touched.contact_person_designation ? 'error' : ''}
                  />
                  {formik.errors.contact_person_designation && formik.touched.contact_person_designation && (
                    <div className="text-red">{formik.errors.contact_person_designation}</div>
                  )}
                </Col>
                <Col span={6}>
                  <label className="form-label text-start mt-3 mb-1">Email*</label>
                  <Input
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Enter Email"
                    className="antd-input styled-input"
                    status={formik.errors.email && formik.touched.email ? 'error' : ''}
                  />
                  {formik.errors.email && formik.touched.email && (
                    <div className="text-red">{formik.errors.email}</div>
                  )}
                </Col>
                <Col span={6}>
                  <label className="form-label text-start mt-3 mb-1">Phone Number*</label>
                  <Input
                    name="phone_number"
                    value={formik.values.phone_number}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Enter Phone Number"
                    className="antd-input styled-input"
                    status={formik.errors.phone_number && formik.touched.phone_number ? 'error' : ''}
                  />
                  {formik.errors.phone_number && formik.touched.phone_number && (
                    <div className="text-red">{formik.errors.phone_number}</div>
                  )}
                </Col>
                
                <Col span={6}>
                  <label className="form-label text-start mt-3 mb-1">Remarks*</label>
                  <Input
                    name="remarks"
                    value={formik.values.remarks}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Enter Remarks"
                    className={formik.errors.remarks && formik.touched.remarks ? "antd-input styled-input error-input" : "antd-input styled-input"}
                    status={formik.errors.remarks && formik.touched.remarks ? 'error' : ''}
                  />
                  {formik.errors.remarks && formik.touched.remarks && (
                    <div className="text-red">{formik.errors.remarks}</div>
                  )}
                </Col>
                {/* Removed Created At Field */}
                <Col span={6}>
                  <label className="form-label text-start mt-3 mb-1">Followup Date*</label>
                  <DatePicker
                    name="followup_date"
                    value={formik.values.followup_date ? formik.values.followup_date : null}
                    onChange={date => { formik.setFieldValue('followup_date', date); formik.setFieldTouched('followup_date', true); }}
                    onBlur={() => formik.setFieldTouched('followup_date', true)}
                    className={formik.errors.followup_date && formik.touched.followup_date ? "antd-input styled-input error-input" : "antd-input styled-input"}
                    style={{ width: '100%' }}
                  />
                  {formik.errors.followup_date && formik.touched.followup_date && (
                    <div className="text-red">{formik.errors.followup_date}</div>
                  )}
                </Col>
                <Col span={6}>
                  <label className="form-label text-start mt-3 mb-1">Acquired Through*</label>
                  <Select
                    name="acquired_through"
                    value={formik.values.acquired_through || undefined}
                    onChange={value => { formik.setFieldValue('acquired_through', value); formik.setFieldTouched('acquired_through', true); }}
                    onBlur={() => formik.setFieldTouched('acquired_through', true)}
                    placeholder="Select Acquired Through"
                    className={formik.errors.acquired_through && formik.touched.acquired_through ? "antd-input dropdown error-input" : "antd-input dropdown"}
                    allowClear
                  >
                    {acquiredThroughOptions.map(opt => (
                      <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                    ))}
                  </Select>
                  {formik.errors.acquired_through && formik.touched.acquired_through && (
                    <div className="text-red">{formik.errors.acquired_through}</div>
                  )}
                </Col>
                {showAcquiredOther && (
                  <Col span={6}>
                    <label className="form-label text-start mt-3 mb-1">Acquired Through (Other)</label>
                    <Input
                      name="acquired_through_other"
                      value={formik.values.acquired_through_other}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Enter Acquired Through Other"
                      className="antd-input styled-input"
                      status={formik.errors.acquired_through_other && formik.touched.acquired_through_other ? 'error' : ''}
                    />
                    {formik.errors.acquired_through_other && formik.touched.acquired_through_other && (
                      <div className="text-red">{formik.errors.acquired_through_other}</div>
                    )}
                  </Col>
                )}
                {(user?.user_type === 'sales_manager' || user?.user_type === 'admin') && (
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <label className="form-label text-start mt-3 mb-1">Assign To*</label>
                    <Select
                      labelInValue
                      value={formik.values.assigned_to ? { value: formik.values.assigned_to, label: (executivesList.find(e => e.id === formik.values.assigned_to)?.name || user?.name) } : undefined}
                      onChange={(option) => {
                        formik.setFieldValue('assigned_to', option ? option.value : '');
                      }}
                      onBlur={() => formik.setFieldTouched('assigned_to', true)}
                      placeholder="Select Assignee"
                      style={{width: '100%'}}
                      className={`antd-input dropdown${formik.errors.assigned_to && formik.touched.assigned_to ? ' error-input' : ''}`}
                      allowClear
                      onClear={() => {
                        formik.setFieldValue('assigned_to', '');
                      }}
                    >
                      {executivesList.map((executive) => (
                        <Option key={executive.id} value={executive.id}>
                          {executive?.name} - {executive?.user_type === 'sales_manager' ? 'Manager' : 'Executive'}
                        </Option>
                      ))}
                      {user?.user_type === 'sales_manager' && (
                        <Option value={user?.id}>
                          {user?.name}
                        </Option>
                      )}
                    </Select>
                    {formik.errors.assigned_to && formik.touched.assigned_to && (
                      <div className="text-red">{formik.errors.assigned_to}</div>
                    )}
                  </Col>
                )}
              </Row>
              <Button
                type="primary"
                htmlType="submit"
                className="custom-button"
                style={{ marginTop: 24, background: '#3E6A9F', color: '#fff' }}
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Save
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
