import ManualLocationInput from '../../../../components/manual-location-input.jsx';
import { message } from '../../../../components/ui/notifications.jsx';
import { Select } from '../../../../components/ui/app-select.jsx';
import { Input } from '../../../../components/ui/app-controls.jsx';
import { Button, Spin } from '../../../../components/ui/app-controls.jsx';
import React, { useMemo } from "react";
import BreadCrumb from "../../../../components/breadcrumb.component.jsx";
import "../../../../assets/styles/legacy/leads.generated.css";
import { DatePicker, Col, Row, Divider, Typography, Space } from 'antd';
import dayjs from "dayjs";
import { useFormik } from "formik";
import { addLeadJobSchema } from "../../../shared/schemas/schema.js";
import {
  nationalityOptions,
  currencyOptions,
  paymentTermOptions,
  languagesOptions,
} from "../../../shared/utils/countries.js";
import { timezoneOptions } from "../../../shared/utils/job-form-options.js";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { formatCurrency, formatSalaryNum } from "../../../shared/utils/formatters.js";
import moment from "moment";
import {
  getDataLeadJob,
  updateDataLeadJob,
  patchDataLeadJob,
} from "../../../shared/services/data-leads-service.js";



const workingDaysOptions = [
  { label: "Monday", value: "Monday" },
  { label: "Tuesday", value: "Tuesday" },
  { label: "Wednesday", value: "Wednesday" },
  { label: "Thursday", value: "Thursday" },
  { label: "Friday", value: "Friday" },
  { label: "Saturday", value: "Saturday" },
  { label: "Sunday", value: "Sunday" },
];

const JOB_STATUS_OPTIONS = [
  "Pending Contact",
  "Potential Client",
  "Company Profile Sent Whatsapp",
  "Company Profile Sent Email",
  "Company Profile Sent Email & Whatsapp",
  "SaaS Client",
  "Follow Up",
  "Job Seeker",
  "Opportunity Lost",
  "Not Ready to Pay",
  "Contacted But No Response - Company Profile Sent Through Whatsapp",
  "Contacted But No Response - Company Profile Sent Through Email",
  "Contacted But No Response - Company Profile Sent Through Email & Whatsapp",
  "Phone Powered Off - Company Profile Sent Through Whatsapp",
  "Phone Powered Off - Company Profile Sent Through Email",
  "Phone Powered Off - Company Profile Sent Through Email & Whatsapp",
  "Incorrect Phone Number",
  "Duplicate Lead",
  "Irrelevant Lead",
  "Unassigned",
  "Other",
];

const getExperienceString = (job) => {
  if (!job) return null;
  const min = job.min_experience;
  const max = job.max_experience;
  if (min !== null && min !== undefined) {
    if (max && Number(max) > 0) {
      return `${min}-${max}`;
    }
    return `${min}`;
  }
  return null;
};

const parseLanguages = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value;
  }
  return value
    .split(",")
    .map((lang) => lang.trim())
    .filter(Boolean);
};

const parseWorkingDays = (value) => {
  if (!value) {
    return { from: null, to: null, range: null };
  }
  const parts = value.split("-").map((item) => item.trim());
  if (parts.length === 2) {
    return {
      from: parts[0] || null,
      to: parts[1] || null,
      range: value,
    };
  }
  return { from: null, to: null, range: value };
};

const DataLeadEditJob = () => {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  document.title = "Edit Data Lead Job | Search O Pal";

  const {
    data: jobDetails,
    isLoading: isJobLoading,
    isFetching: isJobFetching,
  } = useQuery(["dataLeadJob", jobId], () => getDataLeadJob(jobId), {
    enabled: Boolean(jobId),
    refetchOnWindowFocus: false,
  });

  const workingDays = useMemo(
    () => parseWorkingDays(jobDetails?.working_days),
    [jobDetails],
  );

  const initialValues = useMemo(
    () => ({
      job_title: jobDetails?.job_title ?? null,
      years_of_experience: getExperienceString(jobDetails),
      number_of_vacancies: jobDetails?.number_of_vacancies ?? null,
      job_type: jobDetails?.job_type ?? null,
      employment_type: jobDetails?.employment_type ?? null,
      department: jobDetails?.department ?? null,
      job_description: jobDetails?.job_description ?? null,
      job_responsibilities: jobDetails?.job_responsibilities ?? null,
      job_requirements: jobDetails?.job_requirements ?? null,
      key_skills_required: jobDetails?.key_skills_required ?? null,
      educational_qualification: jobDetails?.educational_qualification ?? null,
      currency: jobDetails?.currency ?? null,
      other_benefits: jobDetails?.other_benefits ?? null,
      languages_required: parseLanguages(jobDetails?.languages_required),
      gender_preference: jobDetails?.gender_preference ?? null,
      nationality_preference: jobDetails?.nationality_preference ?? null,
      notes: jobDetails?.notes ?? null,
      min_salary: jobDetails?.min_salary ?? null,
      max_salary: jobDetails?.max_salary ?? null,
      payment_term: jobDetails?.payment_term ?? null,
      location_city: jobDetails?.location_city ?? null,
      location_country: jobDetails?.location_country ?? null,
      working_hours: jobDetails?.working_hours ?? null,
      working_days_from: workingDays.from,
      working_days_to: workingDays.to,
      working_days: workingDays.range,
      timezone: jobDetails?.timezone ?? null,
      cv_submission_deadline: jobDetails?.cv_submission_deadline ?? null,
      expected_joining_date: jobDetails?.expected_joining_date ?? null,
    }),
    [jobDetails, workingDays],
  );

  const goBack = () => {
    navigate("/data-leads");
  };

  const onSubmit = (values) => {
    const experience = values.years_of_experience;
    let max_experience;
    let min_experience;
    if (experience?.includes("-")) {
      const [min, max] = experience.split("-").map(Number);
      if (!isNaN(min) && !isNaN(max) && min <= max) {
        min_experience = min;
        max_experience = max;
      }
    } else if (experience) {
      const exp = Number(experience);
      if (!isNaN(exp)) {
        min_experience = exp;
        max_experience = 0;
      }
    }

    let { years_of_experience, languages_required, ...finalPayload } = values;
    finalPayload = {
      ...finalPayload,
      min_experience,
      max_experience,
      lead_generation_request: jobDetails?.lead_generation_request,
    };

    if (Array.isArray(languages_required)) {
      finalPayload.languages_required = languages_required.join(", ");
    } else {
      finalPayload.languages_required = languages_required || null;
    }

    updateJobMutation.mutate(finalPayload);
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema: addLeadJobSchema,
    onSubmit,
  });

  const updateJobMutation = useMutation(
    (payload) => updateDataLeadJob(jobId, payload),
    {
      onSuccess: () => {
        message.destroy("data-lead-job-edit");
        message.success({
          content: "Job updated successfully",
          key: "data-lead-job-edit",
        });
        queryClient.invalidateQueries(["dataLeadJob", jobId]);
        goBack();
      },
      onError: (error) => {
        message.destroy("data-lead-job-edit");
        message.error({
          content: error?.response?.data?.message || "Failed to update job",
          key: "data-lead-job-edit",
        });
      },
    },
  );

  const patchJobMutation = useMutation(
    (partialPayload) => patchDataLeadJob(jobId, partialPayload),
    {
      onSuccess: () => {
        message.destroy("data-lead-job-status");
        message.success({
          content: "Status updated",
          key: "data-lead-job-status",
        });
        queryClient.invalidateQueries(["dataLeadJob", jobId]);
      },
      onError: (error) => {
        message.destroy("data-lead-job-status");
        message.error({
          content: error?.response?.data?.message || "Failed to update status",
          key: "data-lead-job-status",
        });
      },
    },
  );

  const handleStatusPatch = (value) => {
    if (!value) return;
    patchJobMutation.mutate({ status: value });
  };

  if (!jobId) {
    return (
      <div className="lead-job-page">
        <BreadCrumb goBack={goBack} linkText="Job" />
        <div className="container">
          <Typography.Text type="danger">
            Invalid job identifier. Please navigate from the Data Leads table.
          </Typography.Text>
        </div>
      </div>
    );
  }

  return (
    <div className="lead-job-page">
      <BreadCrumb goBack={goBack} linkText="Edit Job" />

      <div className="container">
        <div className="job-card">
          <div className="container">
            <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
              <h1>{formik.values.job_title ? formik.values.job_title : "Edit Job"}</h1>
              <Space direction="vertical" size="small" style={{ minWidth: 240 }}>
                <Typography.Text type="secondary">Quick Status Update</Typography.Text>
                <Select
                  className="antd-input dropdown"
                  placeholder="Select Status"
                  value={jobDetails?.status || undefined}
                  options={JOB_STATUS_OPTIONS.map((status) => ({
                    label: status,
                    value: status,
                  }))}
                  loading={patchJobMutation.isLoading || isJobFetching}
                  onChange={handleStatusPatch}
                  allowClear
                />
              </Space>
            </div>
          </div>

          <div className="container">
            {(isJobLoading || !jobDetails) ? (
              <div style={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Spin tip="Loading job details..." />
              </div>
            ) : (
              <form onSubmit={formik.handleSubmit}>
                <Row gutter={[10, { xs: 8, sm: 16, md: 24, lg: 32 }]}>
                  <Col span={6}>
                    <label htmlFor="job_title" className="form-label text-start mt-3 mb-1">
                      Job Title*
                    </label>
                    <Input
                      id="job_title"
                      name="job_title"
                      type="text"
                      value={formik.values.job_title}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Enter Job Title"
                      className="antd-input styled-input"
                      min={1}
                      allowClear
                      status={formik.errors.job_title && formik.touched.job_title ? "error" : ""}
                    />
                    {formik.errors.job_title && formik.touched.job_title && (
                      <div className="text-red">{formik.errors.job_title}</div>
                    )}
                  </Col>

                  <Col span={6}>
                    <label htmlFor="experience" className="form-label text-start mt-3 mb-1">
                      Experience (Years)*
                    </label>
                    <Input
                      id="years_of_experience"
                      name="years_of_experience"
                      type="text"
                      value={formik.values.years_of_experience}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Enter Experience"
                      className="antd-input styled-input"
                      min={1}
                      allowClear
                      status={formik.errors.years_of_experience && formik.touched.years_of_experience ? "error" : ""}
                    />
                    {formik.errors.years_of_experience && formik.touched.years_of_experience && (
                      <div className="text-red">{formik.errors.years_of_experience}</div>
                    )}
                  </Col>

                  <Col span={6}>
                    <label htmlFor="number_of_vacancies" className="form-label text-start mt-3 mb-1">
                      No. of Vacancies*
                    </label>
                    <Select
                      className="antd-input dropdown"
                      placeholder="Select No. of vacancies"
                      value={formik.values.number_of_vacancies}
                      options={Array.from({ length: 100 }, (_, i) => ({
                        label: i + 1,
                        value: i + 1,
                      })).concat({ label: "100+", value: 101 })}
                      onChange={(value) => formik.setFieldValue("number_of_vacancies", value)}
                      name="number_of_vacancies"
                      allowClear
                      status={formik.errors.number_of_vacancies && formik.touched.number_of_vacancies ? "error" : ""}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.number_of_vacancies && formik.touched.number_of_vacancies && (
                      <div className="text-red">{formik.errors.number_of_vacancies}</div>
                    )}
                  </Col>

                  <Col span={6}>
                    <label htmlFor="job_type" className="form-label text-start mt-3 mb-1">
                      Job Type*
                    </label>
                    <Select
                      className="antd-input dropdown"
                      placeholder="Select Job Type"
                      options={[
                        { label: "Full-Time", value: "Full-Time" },
                        { label: "Part-Time", value: "Part-Time" },
                        { label: "Contract", value: "Contract" },
                        { label: "Temporary", value: "Temporary" },
                      ]}
                      value={formik.values.job_type}
                      onChange={(value) => formik.setFieldValue("job_type", value)}
                      allowClear
                      status={formik.errors.job_type && formik.touched.job_type ? "error" : ""}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.job_type && formik.touched.job_type && (
                      <div className="text-red">{formik.errors.job_type}</div>
                    )}
                  </Col>

                  <Col span={6}>
                    <label htmlFor="employment_type" className="form-label text-start mt-3 mb-1">
                      Employment Type*
                    </label>
                    <Select
                      className="antd-input dropdown"
                      placeholder="Select Employment Type"
                      options={[
                        { label: "Office-Based", value: "Office-Based" },
                        { label: "Remote", value: "Remote" },
                        { label: "Hybrid", value: "Hybrid" },
                      ]}
                      value={formik.values.employment_type}
                      onChange={(value) => formik.setFieldValue("employment_type", value)}
                      allowClear
                      status={formik.errors.employment_type && formik.touched.employment_type ? "error" : ""}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.employment_type && formik.touched.employment_type && (
                      <div className="text-red">{formik.errors.employment_type}</div>
                    )}
                  </Col>

                  <Col span={6}>
                    <label htmlFor="educational_qualification" className="form-label text-start mt-3 mb-1">
                      Education*
                    </label>
                    <Input
                      id="educational_qualification"
                      name="educational_qualification"
                      value={formik.values.educational_qualification}
                      onChange={formik.handleChange}
                      placeholder="Enter qualification"
                      className="antd-input styled-input"
                      allowClear
                      onBlur={formik.handleBlur}
                      status={
                        formik.errors.educational_qualification && formik.touched.educational_qualification ? "error" : ""
                      }
                    />
                    {formik.errors.educational_qualification && formik.touched.educational_qualification && (
                      <div className="text-red">{formik.errors.educational_qualification}</div>
                    )}
                  </Col>

                  <Col span={6}>
                    <label htmlFor="languages_required" className="form-label text-start mt-3 mb-1">
                      Language Required
                    </label>
                    <Select
                      className="antd-input dropdown"
                      placeholder="Select Required Language"
                      options={languagesOptions}
                      showSearch
                      mode="multiple"
                      value={formik.values.languages_required}
                      onChange={(value) => {
                        formik.setFieldValue("languages_required", value);
                        formik.setFieldTouched("languages_required", true);
                      }}
                      allowClear
                      status={formik.errors.languages_required && formik.touched.languages_required ? "error" : ""}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.languages_required && formik.touched.languages_required && (
                      <div className="text-red">{formik.errors.languages_required}</div>
                    )}
                  </Col>

                  <Col span={6}>
                    <label htmlFor="gender" className="form-label text-start mt-3 mb-1">
                      Gender Preference*
                    </label>
                    <Select
                      className="antd-input dropdown"
                      placeholder="Select Gender"
                      options={[
                        { label: "Male", value: "Male" },
                        { label: "Female", value: "Female" },
                        { label: "No Preference", value: "No Preference" },
                      ]}
                      value={formik.values.gender_preference}
                      onChange={(value) => formik.setFieldValue("gender_preference", value)}
                      allowClear
                      status={formik.errors.gender_preference && formik.touched.gender_preference ? "error" : ""}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.gender_preference && formik.touched.gender_preference && (
                      <div className="text-red">{formik.errors.gender_preference}</div>
                    )}
                  </Col>

                  <Col span={6}>
                    <label htmlFor="nationality_preference" className="form-label text-start mt-3 mb-1">
                      Nationality Preference
                    </label>
                    <Select
                      className="antd-input dropdown"
                      placeholder="Select Nationality Preference"
                      options={nationalityOptions}
                      value={formik.values.nationality_preference}
                      onChange={(value) => formik.setFieldValue("nationality_preference", value)}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.nationality_preference && formik.touched.nationality_preference && (
                      <div className="text-red">{formik.errors.nationality_preference}</div>
                    )}
                  </Col>

                  <Col span={6}>
                    <label htmlFor="department" className="form-label text-start mt-3 mb-1">
                      Department
                    </label>
                    <Input
                      id="department"
                      name="department"
                      value={formik.values.department}
                      onChange={formik.handleChange}
                      placeholder="Enter department"
                      className="antd-input styled-input"
                      allowClear
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.department && formik.touched.department && (
                      <div className="text-red">{formik.errors.department}</div>
                    )}
                  </Col>

                  <Col xs={24} sm={12} md={8} lg={6}>
                    <label htmlFor="working_hours" className="form-label text-start mt-3 mb-1">
                      Working Hours
                    </label>
                    <Input
                      id="working_hours"
                      name="working_hours"
                      value={formik.values.working_hours}
                      onChange={formik.handleChange}
                      placeholder="e.g. 8 hours/day"
                      className="antd-input styled-input"
                      allowClear
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.working_hours && formik.touched.working_hours && (
                      <div className="text-red">{formik.errors.working_hours}</div>
                    )}
                  </Col>

                  <Col xs={24} sm={12} md={8} lg={6}>
                    <label htmlFor="cv_submission_deadline" className="form-label text-start mt-3 mb-1">
                      CV Submission Deadline
                    </label>
                    <DatePicker
                      id="cv_submission_deadline"
                      name="cv_submission_deadline"
                      showTime={{ format: "hh:mm A", use12Hours: true }}
                      format="DD/MM/YYYY"
                      placeholder="CV Submission Deadline"
                      value={
                        formik.values.cv_submission_deadline
                          ? dayjs(formik.values.cv_submission_deadline)
                          : null
                      }
                      onChange={(value) => {
                        const isoValue = value ? dayjs(value).startOf("day").toISOString() : null;
                        formik.setFieldValue("cv_submission_deadline", isoValue);
                      }}
                      style={{ width: "100%" }}
                    />
                    {formik.errors.cv_submission_deadline && formik.touched.cv_submission_deadline && (
                      <div className="text-red">{formik.errors.cv_submission_deadline}</div>
                    )}
                  </Col>

                  <Col xs={24} sm={12} md={8} lg={6}>
                    <label htmlFor="expected_joining_date" className="form-label text-start mt-3 mb-1">
                      Expected Joining Date
                    </label>
                    <DatePicker
                      id="expected_joining_date"
                      name="expected_joining_date"
                      showTime={{ format: "hh:mm A", use12Hours: true }}
                      format="DD/MM/YYYY"
                      placeholder="Expected Joining Date"
                      value={
                        formik.values.expected_joining_date
                          ? dayjs(formik.values.expected_joining_date)
                          : null
                      }
                      onChange={(value) => {
                        const isoValue = value ? dayjs(value).startOf("day").toISOString() : null;
                        formik.setFieldValue("expected_joining_date", isoValue);
                      }}
                      className=""
                      style={{ width: "100%" }}
                    />
                    {formik.errors.expected_joining_date && formik.touched.expected_joining_date && (
                      <div className="text-red">{formik.errors.expected_joining_date}</div>
                    )}
                  </Col>

                  <Col xs={24} sm={12} md={8} lg={6}>
                    <label htmlFor="timezone" className="form-label text-start mt-3 mb-1">
                      Timezone
                    </label>
                    <Select
                      className="antd-input dropdown"
                      placeholder="Select Timezone"
                      options={timezoneOptions}
                      value={formik.values.timezone}
                      onChange={(value) => formik.setFieldValue("timezone", value)}
                      allowClear
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.timezone && formik.touched.timezone && (
                      <div className="text-red">{formik.errors.timezone}</div>
                    )}
                  </Col>

                  <Col xs={24} sm={12} md={8} lg={12}>
                    <label htmlFor="working_days" className="form-label text-start mt-3 mb-1">
                      Working Days
                    </label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        flexWrap: "nowrap",
                        width: "100%",
                        justifyContent: "flex-start",
                      }}
                    >
                      <Select
                        className="antd-input dropdown"
                        placeholder="From"
                        options={workingDaysOptions}
                        value={formik.values.working_days_from}
                        onChange={(value) => {
                          formik.setFieldValue("working_days_from", value);
                          if (value && formik.values.working_days_to) {
                            const workingDaysString = `${value} - ${formik.values.working_days_to}`;
                            formik.setFieldValue("working_days", workingDaysString);
                          }
                        }}
                        allowClear
                        style={{ flex: "1 1 0", minWidth: 120, maxWidth: 240 }}
                        dropdownStyle={{ minWidth: 120 }}
                      />
                      <span style={{ color: "#666", margin: "0 8px", whiteSpace: "nowrap" }}>to</span>
                      <Select
                        className="antd-input dropdown"
                        placeholder="To"
                        options={workingDaysOptions}
                        value={formik.values.working_days_to}
                        onChange={(value) => {
                          formik.setFieldValue("working_days_to", value);
                          if (value && formik.values.working_days_from) {
                            const workingDaysString = `${formik.values.working_days_from} - ${value}`;
                            formik.setFieldValue("working_days", workingDaysString);
                          }
                        }}
                        allowClear
                        style={{ flex: "1 1 0", minWidth: 120, maxWidth: 240 }}
                        dropdownStyle={{ minWidth: 120 }}
                      />
                    </div>
                    {formik.values.working_days && (
                      <div style={{ marginTop: "4px", fontSize: "12px", color: "#3E6A9F", fontWeight: 500 }}>
                        Selected: {formik.values.working_days}
                      </div>
                    )}
                    {formik.errors.working_days && formik.touched.working_days && (
                      <div className="text-red">{formik.errors.working_days}</div>
                    )}
                  </Col>

                  <Divider plain>
                    <h3 className="my-0 text-primary">Salary</h3>
                  </Divider>

                  <Col span={6}>
                    <label htmlFor="currency" className="form-label text-start mt-3 mb-1">
                      Currency*
                    </label>
                    <Select
                      className="antd-input dropdown"
                      placeholder="Select Currency"
                      options={currencyOptions}
                      value={formik.values.currency}
                      onChange={(value) => formik.setFieldValue("currency", value)}
                      allowClear
                      status={formik.errors.currency && formik.touched.currency ? "error" : ""}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.currency && formik.touched.currency && (
                      <div className="text-red">{formik.errors.currency}</div>
                    )}
                  </Col>

                  <Col span={6}>
                    <label htmlFor="min_salary" className="form-label text-start mt-3 mb-1">
                      Minimum Salary*
                    </label>
                    <Input
                      id="min_salary"
                      name="min_salary"
                      type="number"
                      value={formik.values.min_salary}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Enter minimum salary"
                      className="antd-input styled-input"
                      min={0}
                      allowClear
                      status={formik.errors.min_salary && formik.touched.min_salary ? "error" : ""}
                    />
                    {formik.errors.min_salary && formik.touched.min_salary && (
                      <div className="text-red">{formik.errors.min_salary}</div>
                    )}
                  </Col>

                  <Col span={6}>
                    <label htmlFor="max_salary" className="form-label text-start mt-3 mb-1">
                      Maximum Salary*
                    </label>
                    <Input
                      id="max_salary"
                      name="max_salary"
                      type="number"
                      value={formik.values.max_salary}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Enter maximum salary"
                      className="antd-input styled-input"
                      min={0}
                      allowClear
                      status={formik.errors.max_salary && formik.touched.max_salary ? "error" : ""}
                    />
                    {formik.errors.max_salary && formik.touched.max_salary && (
                      <div className="text-red">{formik.errors.max_salary}</div>
                    )}
                  </Col>

                  <Col span={6}>
                    <label htmlFor="payment_term" className="form-label text-start mt-3 mb-1">
                      Payment Terms*
                    </label>
                    <Select
                      className="antd-input dropdown"
                      placeholder="Select Payment Term"
                      options={paymentTermOptions}
                      value={formik.values.payment_term}
                      showSearch
                      onChange={(value) => formik.setFieldValue("payment_term", value)}
                      allowClear
                      status={formik.errors.payment_term && formik.touched.payment_term ? "error" : ""}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.payment_term && formik.touched.payment_term && (
                      <div className="text-red">{formik.errors.payment_term}</div>
                    )}
                  </Col>

                  {formik.values.min_salary && (
                    <Col span={24}>
                      <p style={{ backgroundColor: "#3e6a9f50", display: "inline", padding: "5px", borderRadius: "5px" }}>
                        {(formik?.values?.currency ? formatCurrency(formik.values.currency) : "")}{" "}
                        {formatSalaryNum(formik.values.min_salary)}{" "}
                        {formik.values.max_salary && `- ${formatSalaryNum(formik.values.max_salary)}`}{" "}
                        {formik.values.payment_term}
                      </p>
                    </Col>
                  )}

                  <Divider plain>
                    <h3 className="my-0 text-primary">Location</h3>
                  </Divider>

                  <Col span={6}>
                    <label htmlFor="location_city" className="form-label text-start mt-3 mb-1">
                      City*
                    </label>
                    <ManualLocationInput
                      className="antd-input dropdown"
                      placeholder="Select City"
                      showSearch
                      value={formik.values.location_city}
                      onChange={(value) => formik.setFieldValue("location_city", value)}
                      allowClear
                      status={formik.errors.location_city && formik.touched.location_city ? "error" : ""}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.location_city && formik.touched.location_city && (
                      <div className="text-red">{formik.errors.location_city}</div>
                    )}
                  </Col>

                  <Col span={6}>
                    <label htmlFor="location_country" className="form-label text-start mt-3 mb-1">
                      Country
                    </label>
                    <ManualLocationInput
                      className="antd-input dropdown"
                      placeholder="Select Country"
                      value={formik.values.location_country}
                      showSearch
                      allowClear
                      onChange={(value) => formik.setFieldValue("location_country", value)}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.location_country && formik.touched.location_country && (
                      <div className="text-red">{formik.errors.location_country}</div>
                    )}
                  </Col>

                  <Divider plain>
                    <h3 className="my-0 text-primary">Job Details</h3>
                  </Divider>

                  <Col span={24}>
                    <label htmlFor="job_description" className="form-label text-start mt-3 mb-1">
                      Job Description*
                    </label>
                    <Input.TextArea
                      id="job_description"
                      name="job_description"
                      value={formik.values.job_description}
                      onChange={formik.handleChange}
                      placeholder="Write the job description"
                      rows={6}
                      className="antd-input styled-input"
                      status={formik.errors.job_description && formik.touched.job_description ? "error" : ""}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.job_description && formik.touched.job_description && (
                      <div className="text-red">{formik.errors.job_description}</div>
                    )}
                  </Col>

                  <Col span={24}>
                    <label htmlFor="job_responsibilities" className="form-label text-start mt-3 mb-1">
                      Responsibilities
                    </label>
                    <Input.TextArea
                      id="job_responsibilities"
                      name="job_responsibilities"
                      value={formik.values.job_responsibilities}
                      onChange={formik.handleChange}
                      placeholder="Write the responsibilities"
                      rows={6}
                      className="antd-input styled-input"
                      status={formik.errors.job_responsibilities && formik.touched.job_responsibilities ? "error" : ""}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.job_responsibilities && formik.touched.job_responsibilities && (
                      <div className="text-red">{formik.errors.job_responsibilities}</div>
                    )}
                  </Col>

                  <Col span={24}>
                    <label htmlFor="job_requirements" className="form-label text-start mt-3 mb-1">
                      Requirements
                    </label>
                    <Input.TextArea
                      id="job_requirements"
                      name="job_requirements"
                      value={formik.values.job_requirements}
                      onChange={formik.handleChange}
                      placeholder="Write the requirements"
                      rows={6}
                      className="antd-input styled-input"
                      status={formik.errors.job_requirements && formik.touched.job_requirements ? "error" : ""}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.job_requirements && formik.touched.job_requirements && (
                      <div className="text-red">{formik.errors.job_requirements}</div>
                    )}
                  </Col>

                  <Col span={24}>
                    <label htmlFor="key_skills_required" className="form-label text-start mt-3 mb-1">
                      Key Skills
                    </label>
                    <Input.TextArea
                      id="key_skills_required"
                      name="key_skills_required"
                      value={formik.values.key_skills_required}
                      onChange={formik.handleChange}
                      placeholder="List required skills"
                      rows={6}
                      className="antd-input styled-input"
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.key_skills_required && formik.touched.key_skills_required && (
                      <div className="text-red">{formik.errors.key_skills_required}</div>
                    )}
                  </Col>

                  <Col span={24}>
                    <label htmlFor="other_benefits" className="form-label text-start mt-3 mb-1">
                      Other Benefits
                    </label>
                    <Input.TextArea
                      id="other_benefits"
                      name="other_benefits"
                      value={formik.values.other_benefits}
                      onChange={formik.handleChange}
                      placeholder="e.g. Medical, Bonus, Transport"
                      rows={6}
                      className="antd-input styled-input"
                      status={formik.errors.other_benefits && formik.touched.other_benefits ? "error" : ""}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.other_benefits && formik.touched.other_benefits && (
                      <div className="text-red">{formik.errors.other_benefits}</div>
                    )}
                  </Col>

                  <Col span={24}>
                    <label htmlFor="notes" className="form-label text-start mt-3 mb-1">
                      Notes
                    </label>
                    <Input.TextArea
                      id="notes"
                      name="notes"
                      value={formik.values.notes}
                      onChange={formik.handleChange}
                      placeholder="Any additional notes"
                      rows={6}
                      className="antd-input styled-input"
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.notes && formik.touched.notes && (
                      <div className="text-red">{formik.errors.notes}</div>
                    )}
                  </Col>
                </Row>
                {Object.keys(formik.errors).length > 0 && (
                  <p className="text-red mt-2">Please fix all errors</p>
                )}

                <Button
                  type="primary"
                  htmlType="submit"
                  className="custom-button"
                  loading={updateJobMutation.isLoading}
                >
                  Save Changes
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataLeadEditJob;
