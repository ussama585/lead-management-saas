import React, { useEffect, useState } from 'react';
import InputField from '../../components/input-field.component.jsx';
import { Form, Row, Col, Select, Button, Spin } from 'antd';
import { LoaderCircle as LoadingOutlined } from 'lucide-react';
import { Formik, Field, Form as FormikForm, ErrorMessage } from 'formik';
import { salesDataValidationSchema } from '../shared/schemas/sales-data.js';
import '../../assets/styles/legacy/create-user.css';
import '../../assets/styles/legacy/leads.generated.css';
import '../../assets/styles/legacy/select-black-text.css';
import BreadCrumb from '../../components/breadcrumb.component.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from 'react-query';
import { getDataEntryById, updateDataEntryById } from '../shared/services/data-entry-service.js';
import { message } from 'antd';
import { citiesNames, countriesNames } from '../shared/utils/countries.js';
import { useFormik } from 'formik';
import useUserStore from '../shared/store/user-store.js';
import { getRolePath } from '../auth/role-home.js';

const industryOptions = [
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

const initialState = {
  representative_name: '',
  designation: '',
  company_name: '',
  industry_sector: '',
  phone: '',
  email: '',
  city: null,
  country: null,
  company_address: '',
  company_website: '',
  company_social_link: '',
  acquired_through: null,
};

const EditDataEntry = () => {
  const requiredMark = <span style={{ color: '#3E6A9F', marginLeft: 2 }}>*</span>;
  const navigate = useNavigate();
  const user = useUserStore(state => state.user);
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState(initialState);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getDataEntryById(id);
        setInitialValues({
          ...initialState,
          ...data,
          city: data.city || null,
          country: data.country || null,
        });
      } catch (err) {
        message.error(err?.message || 'Failed to fetch data entry');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    // eslint-disable-next-line
  }, [id]);

  const { mutate: updateLead, isLoading } = useMutation(
    ({ id, values }) => updateDataEntryById(id, values),
    {
      onSuccess: (data) => {
        message.success(data?.message || 'Data updated successfully');
        navigate(getRolePath(user?.user_type, '/data-entry-table'), { replace: true });
      },
      onError: (error) => {
        message.error(error?.message || 'Failed to update data entry');
      },
    }
  );

  const formik = useFormik({
    initialValues: initialValues,
    enableReinitialize: true,
    validationSchema: salesDataValidationSchema,
    onSubmit: (values) => {
      const payload = {
        ...values,
        company_social_link: values.company_social_link,
      };
      updateLead({ id, values: payload });
    },
  });

  const handleAutoSave = async (event, key, value) => {
  if (id) {
    if (event) {
      formik.handleBlur(event);
    }

    // Only save if value is different from original
    if (value !== initialValues[key] && value !== null && value !== undefined) {
      const payload = {
        [key]: value,
        phone: formik.values.phone,  // always include phone
        email: formik.values.email,  // always include email
      };

      updateLead({ id, values: payload });
    }
  }
};


  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: 80 }}><Spin indicator={<LoadingOutlined size="1em" className="app-icon app-icon-spin"  />} size="large" /></div>;
  }

  return (
    <>
      <BreadCrumb linkText="Edit Sales Data" goBack={() => navigate(-1)} />
      <div className="container ">
        <div style={{ marginTop: 24, maxWidth: 1200, marginLeft: 'auto', marginRight: 'auto' }}>
          <h2 style={{
            margin: '0 0 32px 0',
            textAlign: 'left',
            color: '#3E6A9F',
            fontSize: '28px',
            fontWeight: '600'
          }}>Edit Sales Data</h2>
          <Formik
            enableReinitialize
            initialValues={initialValues}
            validationSchema={salesDataValidationSchema}
            onSubmit={(values, { resetForm }) => {
              const payload = {
                ...values,
                company_social_link: values.company_social_link,
              };
              updateLead({ id, values: payload });
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
                      <Field 
                        name="representative_name" 
                        as={InputField} 
                        placeholder="Enter representative name" 
                        className="antd-input styled-input"
                        onBlur={(event) => handleAutoSave(event, 'representative_name', formik.values.representative_name)}
                      />
                      <ErrorMessage name="representative_name" component="div" className="form-error" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <label htmlFor="designation" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Designation
                    </label>
                    <Form.Item name="designation" style={{ marginBottom: 0 }}>
                      <Field 
                        name="designation" 
                        as={InputField} 
                        placeholder="Enter designation" 
                        className="antd-input styled-input"
                        onBlur={(event) => handleAutoSave(event, 'designation', formik.values.designation)}
                      />
                      <ErrorMessage name="designation" component="div" className="form-error" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <label htmlFor="company_name" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Company Name {requiredMark}
                    </label>
                    <Form.Item name="company_name" style={{ marginBottom: 0 }}>
                      <Field 
                        name="company_name" 
                        as={InputField} 
                        placeholder="Enter company name" 
                        className="antd-input styled-input"
                        onBlur={(event) => handleAutoSave(event, 'company_name', formik.values.company_name)}
                      />
                      <ErrorMessage name="company_name" component="div" className="form-error" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={8}>
                    <label htmlFor="industry_sector" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Industry/Sector
                    </label>
                    <Form.Item name="industry_sector" style={{ marginBottom: 0 }}>
                      <Field name="industry_sector">
                        {({ field, form }) => (
                          <Select
                            mode="multiple"
                            value={field.value ? field.value.split(',').filter(Boolean) : []}
                            onChange={value => {
                              form.setFieldValue('industry_sector', value.join(','));
                              handleAutoSave(null, 'industry_sector', value.join(','));
                            }}
                            options={industryOptions}
                            placeholder="Select or type industry/sector"
                            style={{ width: '100%', color: '#000000' }}
                            showSearch
                          />
                        )}
                      </Field>
                      <ErrorMessage name="industry_sector" component="div" className="form-error" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <label htmlFor="phone" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Phone {requiredMark}
                    </label>
                    <Form.Item name="phone" style={{ marginBottom: 0 }}>
                      <Field 
                        name="phone" 
                        as={InputField} 
                        placeholder="Enter phone" 
                        className="antd-input styled-input"
                        onBlur={(event) => handleAutoSave(event, 'phone', formik.values.phone)}
                      />
                      <ErrorMessage name="phone" component="div" className="form-error" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <label htmlFor="email" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Email {requiredMark}
                    </label>
                    <Form.Item name="email" style={{ marginBottom: 0 }}>
                      <Field 
                        name="email" 
                        as={InputField} 
                        placeholder="Enter email" 
                        className="antd-input styled-input"
                        onBlur={(event) => handleAutoSave(event, 'email', formik.values.email)}
                      />
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
                            onChange={value => {
                              const stringValue = typeof value === 'object' ? value?.value || '' : value || '';
                              form.setFieldValue('city', stringValue);
                              handleAutoSave(null, 'city', stringValue);
                            }}
                            options={citiesNames}
                            placeholder='Select city'
                            style={{ width: '100%', color: '#000000' }}
                            showSearch
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
                            onChange={value => {
                              const stringValue = typeof value === 'object' ? value?.value || '' : value || '';
                              form.setFieldValue('country', stringValue);
                              handleAutoSave(null, 'country', stringValue);
                            }}
                            options={countriesNames}
                            placeholder='Select country'
                            style={{ width: '100%', color: '#000000' }}
                            showSearch
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
                      <Field name="company_website" as={InputField} placeholder="URL should start from https:// or http://" className="antd-input styled-input" />
                      <ErrorMessage name="company_website" component="div" className="form-error" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={8}>
                    <label htmlFor="company_social_link" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Company Social Media Link
                    </label>
                    <Form.Item name="company_social_link" style={{ marginBottom: 0 }}>
                      <Field name="company_social_link" as={InputField} placeholder="URL should start from https:// or http://" className="antd-input styled-input" />
                      <ErrorMessage name="company_social_link" component="div" className="form-error" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <label htmlFor="company_address" className="form-label text-start mt-3 mb-1" style={{ color: '#3E6A9F', fontWeight: 500 }}>
                      Company Address
                    </label>
                    <Form.Item name="company_address" style={{ marginBottom: 0 }}>
                      <Field name="company_address" as={InputField} placeholder="Enter company address" className="antd-input styled-input" />
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
                            onChange={value => {
                              const stringValue = typeof value === 'object' ? value?.value || '' : value || '';
                              form.setFieldValue('acquired_through', stringValue);
                              handleAutoSave(null, 'acquired_through', stringValue);
                            }}
                            placeholder='Select how data was acquired'
                            style={{ width: '100%', color: '#000000' }}
                            showSearch
                          >
                            <Select.Option value="" disabled>Select how data was acquired</Select.Option>
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
                <div style={{ textAlign: 'left', marginTop: '16px' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    className="custom-button"
                    loading={isLoading}
                    style={{ minWidth: 120, height: '40px', fontSize: '14px', fontWeight: '500', borderRadius: '6px' }}
                  >
                    Update
                  </Button>
                </div>
              </FormikForm>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
};

export default EditDataEntry; 
