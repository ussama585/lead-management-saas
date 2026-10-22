import React, { useState, useEffect } from 'react';
import { useMutation } from 'react-query';
import BreadCrumb from '../../components/breadcrumb.component.jsx';
import { Formik, Form, Field } from 'formik';
import { Input, Button, DatePicker, Select, message } from 'antd';
import { createNewProjectValidationSchema } from '../shared/schemas/schema.js';
import '../../assets/styles/legacy/add-potential-client-page.css';
import { createNewProject } from '../shared/services/headhunting.js';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';


const { TextArea } = Input;


export default function AddNewProjectPageForExecutive() {
  const { Option } = Select;
  const navigate = useNavigate();

  const { id: id } = useParams();

  const [creatingNewClient, setCreatingNewClient] = useState(false)


  const { mutate, isLoading, isError, error } = useMutation({
    mutationFn: createNewProject,

    onMutate: () => setCreatingNewClient(true),

    onSettled: () => { setCreatingNewClient(false); navigate(-1); }
  });



  return (
    <>
      <BreadCrumb linkText="Projects" />

      <div className="add-client-container">

        <div className="form-container">

          <h2>Add New Project</h2>

          <div className="form-content">
            <Formik
              initialValues={{
                job_title:"",
                resources_required:"",
                posting_date:"",
                hiring_deadline:"",
                remarks:"",
                followup_date:"",
                last_followup_date:"",
                status:"",
                description: "",
              }}
              validationSchema={createNewProjectValidationSchema}
              onSubmit={(values, { resetForm }) => {
                // console.log("clicked");
                console.log("Form submitted", values, "id", id);
                mutate({companyId: id, values}, {
                  onSuccess: () => {
                    message.success("Project Created Successfully");
                    resetForm(); // ✅ Reset form on success
                  },
                  onError: () => {
                    message.error("Something Went Wrong");
                  }
                });
              }}
            >
              {({ values, setFieldValue, errors, touched }) => (

                <Form layout="vertical">

                  <h3 className="section-heading">Project Details</h3>

                  {/* Three-Column Layout */}
                  <div className="form-section">


                    {/* Company Name */}
                    
                    <div className="form-field">
                      <Field name="job_title">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Job Title<sup>*</sup></label>
                            <Input {...field} placeholder="Enter job title" />
                            {errors.job_title && touched.job_title && (
                              <div className="error-message">{errors.job_title}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field">
                      <Field name="resources_required">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Resources Required<sup>*</sup></label>
                            <Input {...field} placeholder="Enter resources required" />
                            {errors.resources_required && touched.resources_required && (
                              <div className="error-message">{errors.resources_required}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field">
                      <Field name="posting_date">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Posting Date<sup>*</sup></label>
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
                    </div>

                    <div className="form-field">
                      <Field name="hiring_deadline">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Hiring deadline<sup>*</sup></label>
                            <DatePicker
                              value={values.hiring_deadline ? dayjs(values.hiring_deadline) : null}
                              onChange={(date) =>
                                setFieldValue(
                                  "hiring_deadline",
                                  date ? date.toISOString() : null
                                )
                              }
                              placeholder="Select a date"
                            />
                            {errors.hiring_deadline && touched.hiring_deadline && (
                              <div className="error-message">{errors.hiring_deadline}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>

                    
                    <div className="form-field">
                      <Field name="followup_date">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Followup date<sup>*</sup></label>
                            <DatePicker
                              value={values.followup_date ? dayjs(values.followup_date) : null}
                              onChange={(date) =>
                                setFieldValue(
                                  "followup_date",
                                  date ? date.toISOString() : null
                                )
                              }
                              placeholder="Select a date"
                            />
                            {errors.followup_date && touched.followup_date && (
                              <div className="error-message">{errors.followup_date}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>

                    <div className="form-field">
                      <Field name="last_followup_date">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Last Follow Up Date<sup>*</sup></label>
                            <DatePicker
                              value={values.last_followup_date ? dayjs(values.last_followup_date) : null}
                              onChange={(date) =>
                                setFieldValue(
                                  "last_followup_date",
                                  date ? date.toISOString() : null
                                )
                              }
                              placeholder="Select a date"
                            />
                            {errors.last_followup_date && touched.last_followup_date && (
                              <div className="error-message">{errors.last_followup_date}</div>
                            )}
                          </div>
                        )}
                      </Field>
                    </div>

                    </div>


                    <div className="form-section">

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


                    <div className="form-field">
                      <Field name="description">
                        {({ field }) => (
                          <div className="form-item">
                            <label>Description<sup>*</sup></label>
                            <TextArea
                              {...field}
                              placeholder="Enter description"
                              rows={4}
                              style={{ width: '100%' }}
                            />
                            {errors.description && touched.description && (
                              <div className="error-message">{errors.description}</div>
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
