import { message } from '../../components/ui/notifications.jsx';
import { Select } from '../../components/ui/app-select.jsx';
import { Input } from '../../components/ui/app-controls.jsx';
import { Button } from '../../components/ui/app-controls.jsx';
import React, { useState, useEffect } from 'react';
import { useMutation } from 'react-query';
import BreadCrumb from '../../components/breadcrumb.component.jsx';
import { Formik, Form, Field } from 'formik';
import { DatePicker } from 'antd';
import { createNewClientValidationSchema } from '../shared/schemas/schema.js';
import '../../assets/styles/legacy/add-potential-client-page.css';
import { createNewClient } from '../shared/services/headhunting.js';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import CountryAutoSelect from '../../components/select-country.jsx';
import CityAutoSelect from '../../components/select-city.jsx';



const { TextArea } = Input;


export default function AddNewClientPageForExecutive() {
  const { Option } = Select;
  const navigate = useNavigate();

  const [creatingNewClient, setCreatingNewClient] = useState(false)


  const { mutate, isLoading, isError, error } = useMutation({
    mutationFn: createNewClient,

    onMutate: () => setCreatingNewClient(true),

    onSettled: () => { setCreatingNewClient(false); navigate(-1); }
  });



  return (
    <>
      <BreadCrumb linkText="Clients" />

      <div className="add-client-container">

        <div className="form-container">

          <h2>Add New Client</h2>

          <div className="form-content">
            <Formik
              initialValues={{
                representative_name: "",
                representative_phone: "",
                representative_email: "",
                name: '',
                designation: '',
                phone: '',
                email: '',
                website: '',
                linkedin: '',
                facebook: '',
                city: '',
                country: '',
                remarks: '',
                acquired_through: '',
                acquired_through_other: '',
                posting_date: "",
              }}
              validationSchema={createNewClientValidationSchema}
              onSubmit={(values, { resetForm }) => {
                mutate(values, {
                  onSuccess: () => {
                    message.success("Potential Client Created Successfully");
                    resetForm(); // ✅ Reset form on success
                  },
                  onError: (res) => {
                    message.error(res.message ? res.message : "something went wrong");
                  }
                });
              }}
            >
              {({ values, setFieldValue, errors, touched }) => (

                <Form layout="vertical">

                  <h3 className="section-heading">Company Details</h3>

                  {/* Three-Column Layout */}
                  <div className="form-section">


                    {/* Company Name */}

                    <div className="form-field">
                      <Field name="name">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Company Name<sup>*</sup></label>
                            <Input {...field} placeholder="Enter company name" />
                            {errors.name && touched.name && (
                              <div className="error-message">{errors.name}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>


                    <div className="form-field">
                      <Field name="email">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Company Email<sup>*</sup></label>
                            <Input {...field} placeholder="Enter company email" />
                            {errors.email && touched.email && (
                              <div className="error-message">{errors.email}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field">
                      <Field name="phone">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Company Phone<sup>*</sup></label>
                            <Input {...field} placeholder="Enter company phone" />
                            {errors.phone && touched.phone && (
                              <div className="error-message">{errors.phone}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>


                  </div>


                  <h3 className="section-heading">Contact Person Info</h3>

                  <div className="form-section">

                    <div className="form-field">
                      <Field name="representative_name">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Name</label>
                            <Input {...field} placeholder="Enter representative name" />
                            {errors.representative_name && touched.representative_name && (
                              <div className="error-message">{errors.representative_name}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field">
                      <Field name="designation">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Designation</label>
                            <Input {...field} placeholder="Enter designation" />
                            {errors.designation && touched.designation && (
                              <div className="error-message">{errors.designation}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field">
                      <Field name="representative_phone">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Phone</label>
                            <Input {...field} placeholder="Enter phone" />
                            {errors.representative_phone && touched.representative_phone && (
                              <div className="error-message">{errors.representative_phone}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field margin-top">
                      <Field name="representative_email">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Email</label>
                            <Input {...field} placeholder="Enter email" />
                            {errors.representative_email && touched.representative_email && (
                              <div className="error-message">{errors.representative_email}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>

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

                    <div className="form-field margin-top">
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

                      {/* <Field name="city">
                        {({ field }) => (
                          <div className="form-item">
                            <label>City</label>
                            <Input {...field} placeholder="Enter city" />
                            {errors.city && touched.city && (
                              <div className="error-message">{errors.city}</div>
                            )}
                          </div>
                        )}
                      </Field> */}
                    </div>

                  </div>


                  <h3 className="section-heading">Additional Info</h3>
                  <div className="form-section">



                    <div className="form-field">
                      <Field name="acquired_through">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Acquired Through<sup>*</sup></label>
                            <Select
                              value={field.value}
                              onChange={(value) => {
                                setFieldValue("acquired_through", value);
                                if (value !== "Other") {
                                  setFieldValue("acquired_through_other", "");
                                }
                              }}
                              onBlur={() => {}}
                              placeholder="Acquired Through"
                            >
                              <Option value="" disabled>
                                Acquired Through
                              </Option>
                              <Option value="LinkedIn">LinkedIn</Option>
                              <Option value="WhatsApp">Whatsapp</Option>
                              <Option value="Facebook">Facebook</Option>
                              <Option value="Referral">Referral</Option>
                              <Option value="Other">Other</Option>
                            </Select>
                            {errors.acquired_through && touched.acquired_through && (
                              <div className="error-message">{errors.acquired_through}</div>
                            )}

                            {field.value === "Other" && (
                              <Field name="acquired_through_other">
                                {({ field }) => (
                                  <div className="form-field" style={{marginTop:"12px",}}>
                                    <div className="form-item">
                                      <label>Acquired through other<sup>*</sup></label>
                                      <TextArea
                                        {...field}
                                        placeholder="Enter your resource"
                                        rows={1}
                                        style={{ width: '100%' }}
                                      />
                                      {errors.acquired_through_other && touched.acquired_through_other && (
                                        <div className="error-message">{errors.acquired_through_other}</div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Field>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>

                    {/* <div className="form-field">
                      <Field name="posting_date">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Job Posting Date<sup>*</sup></label>
                            <DatePicker
                              value={values.posting_date ? dayjs(values.posting_date) : null}
                              onChange={(date) =>
                                setFieldValue(
                                  "posting_date",
                                  date ? date.toISOString() : null
                                )
                              }
                              placeholder="Select a date"
                            />
                            {errors.posting_date && touched.posting_date && (
                              <div className="error-message">{errors.posting_date}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div> */}

                    <div className="form-field">
                      <Field name="remarks">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Remarks<sup>*</sup></label>
                            <TextArea
                              {...field}
                              placeholder="Enter remarks"
                              rows={4}
                              style={{ width: '100%' }}
                            />
                            {errors.remarks && touched.remarks && (
                              <div className="error-message">{errors.remarks}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>


                  </div>


                  <div className="form-submit">
                    <Button type="primary" htmlType="submit" style={{ marginBottom: '20px' }} loading={creatingNewClient} >
                      Add
                    </Button>
                  </div>

                </Form>
              )}
            </Formik>

          </div>

        </div>

      </div>
    </>
  );
}
