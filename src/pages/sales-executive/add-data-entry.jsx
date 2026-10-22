import React from 'react';
import InputField from '../../components/input-field.component.jsx';
import { Form, Row, Col, Select } from 'antd';
import { Formik, Field, Form as FormikForm, ErrorMessage } from 'formik';
import { salesDataValidationSchema } from '../shared/schemas/sales-data.js';
import '../../assets/styles/legacy/create-user.css';
import '../../assets/styles/legacy/leads.generated.css';
import BreadCrumb from '../../components/breadcrumb.component.jsx';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { createDataEntry } from '../shared/services/data-entry-service.js';
import { message } from 'antd';
import { citiesNames, countriesNames } from '../shared/utils/countries.js';

const initialState = {
  representative_name: '',
  designation: '',
  company_name: '',
  industry_sector: '',
  phone: '',
  email: '',
  city: '',
  country: '',
  company_address: '',
  company_website: '',
  company_social_link: '',
  acquired_through: '',
};

const AddDataEntry = () => {
  const requiredMark = <span style={{ color: '#3E6A9F', marginLeft: 2 }}>*</span>;
  const navigate = useNavigate();

  const { mutate: createLead, isLoading } = useMutation(createDataEntry, {
    onSuccess: (data) => {
      message.success(data?.message || 'Lead added successfully');
      navigate(-1); // Go back to leads list or dashboard
    },
    onError: (error) => {
      message.error(error?.message || 'Failed to add lead');
    },
  });

  return (
      <>
      <BreadCrumb linkText="Data Entry"  />
    <div className="container " >
      <div style={{ marginTop: 24, maxWidth: 1200, marginLeft: 'auto', marginRight: 'auto' }}>
        <h2 style={{ 
          margin: '0 0 32px 0', 
          textAlign: 'left',
          color: '#3E6A9F',
          fontSize: '28px',
          fontWeight: '600'
        }}>Add Data Entry</h2>
        <Formik
          initialValues={initialState}
          validationSchema={salesDataValidationSchema}
          onSubmit={(values, { resetForm }) => {
            const payload = {
              ...values,
              industry_sector: values.industry_sector,
              company_social_link: values.company_social_link,
            };
            createLead(payload);
          }}
        >
          {({ handleSubmit }) => (
            <FormikForm onSubmit={handleSubmit}>
              <Row gutter={[24, 24]}>
                <Col xs={24} sm={8}>
                  <label htmlFor="representative_name" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    Representative Name 
                  </label>
                  <Form.Item name="representative_name" style={{ marginBottom: 0 }}>
                    <Field name="representative_name" as={InputField} placeholder="Enter representative name" className="styled-input" />
                    <ErrorMessage name="representative_name" component="div" className="form-error" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <label htmlFor="designation" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    Designation
                  </label>
                  <Form.Item name="designation" style={{ marginBottom: 0 }}>
                    <Field name="designation" as={InputField} placeholder="Enter designation" className="styled-input" />
                    <ErrorMessage name="designation" component="div" className="form-error" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <label htmlFor="company_name" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    Company Name {requiredMark}
                  </label>
                  <Form.Item name="company_name" style={{ marginBottom: 0 }}>
                    <Field name="company_name" as={InputField} placeholder="Enter company name" className="styled-input" />
                    <ErrorMessage name="company_name" component="div" className="form-error" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <label htmlFor="industry_sector" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    Industry/Sector
                  </label>
                  <Form.Item name="industry_sector" style={{ marginBottom: 0 }}>
                    <Field name="industry_sector" as={InputField} placeholder="Enter industry/sector" className="styled-input" />
                    <ErrorMessage name="industry_sector" component="div" className="form-error" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <label htmlFor="phone" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    Phone {requiredMark}
                  </label>
                  <Form.Item name="phone" style={{ marginBottom: 0 }}>
                    <Field name="phone" as={InputField} placeholder="Enter phone" className="styled-input" />
                    <ErrorMessage name="phone" component="div" className="form-error" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <label htmlFor="email" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    Email {requiredMark}
                  </label>
                  <Form.Item name="email" style={{ marginBottom: 0 }}>
                    <Field name="email" as={InputField} placeholder="Enter email" className="styled-input" />
                    <ErrorMessage name="email" component="div" className="form-error" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <label htmlFor="city" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    City 
                  </label>
                  <Form.Item name="city" style={{ marginBottom: 0 }}>
                    <Field name="city">
                      {({ field, form }) => (
                        <Select
                          {...field}
                          value={field.value}
                          onChange={value => form.setFieldValue('city', value)}
                          options={citiesNames}
                          showSearch
                          placeholder="Select City"
                          allowClear
                        />
                      )}
                    </Field>
                    <ErrorMessage name="city" component="div" className="form-error" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <label htmlFor="country" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    Country 
                  </label>
                  <Form.Item name="country" style={{ marginBottom: 0 }}>
                    <Field name="country">
                      {({ field, form }) => (
                        <Select
                          {...field}
                          value={field.value}
                          onChange={value => form.setFieldValue('country', value)}
                          options={countriesNames}
                          showSearch
                          placeholder="Select Country"
                          allowClear
                        />
                      )}
                    </Field>
                    <ErrorMessage name="country" component="div" className="form-error" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <label htmlFor="company_website" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    Company Website
                  </label>
                  <Form.Item name="company_website" style={{ marginBottom: 0 }}>
                    <Field name="company_website" as={InputField} placeholder="Enter company website" className="styled-input" />
                    <ErrorMessage name="company_website" component="div" className="form-error" />
        </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <label htmlFor="company_social_link" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    Company Social Media Link
                  </label>
                  <Form.Item name="company_social_link" style={{ marginBottom: 0 }}>
                    <Field name="company_social_link" as={InputField} placeholder="Enter social media link" className="styled-input" />
                    <ErrorMessage name="company_social_link" component="div" className="form-error" />
        </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <label htmlFor="company_address" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    Company Address
                  </label>
                  <Form.Item name="company_address" style={{ marginBottom: 0 }}>
                    <Field name="company_address" as={InputField} placeholder="Enter company address" className="styled-input" />
                    <ErrorMessage name="company_address" component="div" className="form-error" />
        </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <label htmlFor="acquired_through" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                    Data Acquired Through
                  </label>
                  <Form.Item name="acquired_through" style={{ marginBottom: 0 }}>
                    <Field name="acquired_through">
                      {({ field, form }) => (
                        <Select
                          {...field}
                          value={field.value}
                          onChange={value => form.setFieldValue('acquired_through', value)}
                          placeholder="Acquired Through"
                        >
                          <Select.Option value="" disabled>Acquired Through</Select.Option>
                          <Select.Option value="LinkedIn">LinkedIn</Select.Option>
                          <Select.Option value="Facebook">Facebook</Select.Option>
                          <Select.Option value="WhatsApp">Whatsapp</Select.Option>
                          <Select.Option value="Referral">Referral</Select.Option>
                          <Select.Option value="Other">Other</Select.Option>
                        </Select>
                      )}
                    </Field>
                    <ErrorMessage name="acquired_through" component="div" className="form-error" />
                  </Form.Item>
                </Col>
              </Row>
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button 
                  type="submit" 
                  className='custom-button' 
                  style={{ 
                    minWidth: 120,
                    height: '40px',
                    fontSize: '14px',
                    fontWeight: '500',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </FormikForm>
          )}
        </Formik>
      </div>
    </div>
    </>
  );
};

export default AddDataEntry; 
