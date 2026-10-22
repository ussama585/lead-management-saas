import React, { useState, useEffect } from 'react';
import BreadCrumb from '../../../components/breadcrumb.component.jsx';
import { Button, Input, Col, Row, Select, DatePicker, message } from 'antd';
import { useFormik } from 'formik';
import { clientHeadhuntingValidationSchema } from '../../shared/schemas/client.js';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

const { Option } = Select;

const INDUSTRY_OPTIONS = [
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
].sort((a, b) => a.label.localeCompare(b.label));

const ACQUIRED_THROUGH_OPTIONS = [
  { label: 'LinkedIn', value: 'LinkedIn' },
  { label: 'Facebook', value: 'Facebook' },
  { label: 'WhatsApp', value: 'WhatsApp' },
  { label: 'Referral', value: 'Referral' },
  { label: 'Other', value: 'Other' },
];

const SUBMIT_BUTTON_STYLE = { marginTop: 24, background: '#3E6A9F', color: '#fff' };

const INITIAL_VALUES = {
  converted_from_lead: '',
  added_by: '',
  industry: 'Technology',
  company_name: 'Sample Company',
  contact_person_name: 'John Doe',
  contact_person_designation: 'Manager',
  email: 'john@samplecompany.com',
  phone_number: '+1234567890',
  remarks: 'Sample remarks',
  followup_date: moment('2024-01-15'),
  acquired_through: 'LinkedIn',
  acquired_through_other: '',
};

function formatPayload(values) {
  return {
    ...values,
    followup_date: values.followup_date ? moment(values.followup_date).format('YYYY-MM-DD') : '',
    phone_number: values.phone_number ? values.phone_number.trim() : '',
  };
}

function hasError(formik, field) {
  return Boolean(formik.errors[field] && formik.touched[field]);
}

export default function EditClient() {
  const navigate = useNavigate();
  const [showAcquiredOther, setShowAcquiredOther] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: INITIAL_VALUES,
    validationSchema: clientHeadhuntingValidationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        // eslint-disable-next-line no-unused-vars -- payload for future updateClient(id, payload)
        const payload = formatPayload(values);
        // TODO: await updateClient(id, payload)
        message.success('Client updated successfully!');
        navigate(-1);
      } catch {
        message.error('Failed to update client');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    setShowAcquiredOther(formik.values.acquired_through === 'Other');
  }, [formik.values.acquired_through]);

  const goBack = () => navigate(-1);

  return (
    <div className="lead-job-page">
      <BreadCrumb goBack={goBack} linkText="Edit Client" />
      <div className="container">
        <div className="job-card">
          <div className="container">
            <div className="row">
              <h1>Edit Client</h1>
            </div>
          </div>
          <div className="container">
            <form onSubmit={formik.handleSubmit}>
              <Row gutter={[10, { xs: 8, sm: 16, md: 24, lg: 32 }]}>
                <Col span={6}>
                  <label className="form-label text-start mt-3 mb-1">Industry*</label>
                  <Select
                    id="industry"
                    mode="tags"
                    value={formik.values.industry ? [formik.values.industry] : []}
                    onChange={(value) => {
                      const newValue = Array.isArray(value) ? value[value.length - 1] : value;
                      formik.setFieldValue('industry', newValue);
                    }}
                    onBlur={formik.handleBlur}
                    className={hasError(formik, 'industry') ? 'antd-input dropdown error-input' : 'antd-input dropdown'}
                    placeholder="Select or type Industry"
                    name="industry"
                    style={{ width: '100%' }}
                    allowClear
                    showSearch
                    options={INDUSTRY_OPTIONS}
                  />
                  {hasError(formik, 'industry') && <div className="text-red">{formik.errors.industry}</div>}
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
                    status={hasError(formik, 'company_name') ? 'error' : ''}
                  />
                  {hasError(formik, 'company_name') && <div className="text-red">{formik.errors.company_name}</div>}
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
                    status={hasError(formik, 'contact_person_name') ? 'error' : ''}
                  />
                  {hasError(formik, 'contact_person_name') && <div className="text-red">{formik.errors.contact_person_name}</div>}
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
                    status={hasError(formik, 'contact_person_designation') ? 'error' : ''}
                  />
                  {hasError(formik, 'contact_person_designation') && <div className="text-red">{formik.errors.contact_person_designation}</div>}
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
                    status={hasError(formik, 'email') ? 'error' : ''}
                  />
                  {hasError(formik, 'email') && <div className="text-red">{formik.errors.email}</div>}
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
                    status={hasError(formik, 'phone_number') ? 'error' : ''}
                  />
                  {hasError(formik, 'phone_number') && <div className="text-red">{formik.errors.phone_number}</div>}
                </Col>

                <Col span={6}>
                  <label className="form-label text-start mt-3 mb-1">Remarks</label>
                  <Input
                    name="remarks"
                    value={formik.values.remarks}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Enter Remarks"
                    className="antd-input styled-input"
                    status={hasError(formik, 'remarks') ? 'error' : ''}
                  />
                  {hasError(formik, 'remarks') && <div className="text-red">{formik.errors.remarks}</div>}
                </Col>

                <Col span={6}>
                  <label className="form-label text-start mt-3 mb-1">Followup Date</label>
                  <DatePicker
                    name="followup_date"
                    value={formik.values.followup_date || null}
                    onChange={(date) => formik.setFieldValue('followup_date', date)}
                    className="antd-input styled-input"
                    style={{ width: '100%' }}
                  />
                </Col>

                <Col span={6}>
                  <label className="form-label text-start mt-3 mb-1">Acquired Through</label>
                  <Select
                    name="acquired_through"
                    value={formik.values.acquired_through || undefined}
                    onChange={(value) => formik.setFieldValue('acquired_through', value)}
                    onBlur={formik.handleBlur}
                    placeholder="Select Acquired Through"
                    className="antd-input dropdown"
                    allowClear
                  >
                    {ACQUIRED_THROUGH_OPTIONS.map((opt) => (
                      <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                    ))}
                  </Select>
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
                      status={hasError(formik, 'acquired_through_other') ? 'error' : ''}
                    />
                    {hasError(formik, 'acquired_through_other') && <div className="text-red">{formik.errors.acquired_through_other}</div>}
                  </Col>
                )}
              </Row>
              <Button
                type="primary"
                htmlType="submit"
                className="custom-button"
                style={SUBMIT_BUTTON_STYLE}
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Update
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
