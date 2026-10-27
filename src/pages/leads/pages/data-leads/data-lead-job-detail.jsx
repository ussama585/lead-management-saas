import { Button, Spin } from '../../../../components/ui/app-controls.jsx';
import React from "react";
import BreadCrumb from "../../../../components/breadcrumb.component.jsx";
import "../../../../assets/styles/legacy/leads.generated.css";
import { Alert, Tag, Divider, Row, Col } from 'antd';
import { BookOpen as BookOutlined, Info as InfoCircleOutlined, MapPin as EnvironmentOutlined, DollarSign as DollarOutlined, User as UserOutlined, Zap as ThunderboltOutlined, FileText as FileTextOutlined, LayoutGrid as AppstoreOutlined } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "react-query";
import api from '../../../shared/services/api.js';
import dayjs from "dayjs";
import useUserStore from "../../../shared/store/user-store.js";
import { isSuperAdmin } from '../../../auth/role-access.js';
import { formatSalaryNum } from "../../../shared/utils/formatters.js";

export async function getJobDetails(jobId, leadId) {
  if (leadId != null && leadId !== '') {
    let page = 1;
    const visited = new Set();
    while (!visited.has(page)) {
      visited.add(page);
      const { data } = await api.get(`/data-leads/jobs/${encodeURIComponent(leadId)}`);
      // const { data } = await api.get(`/data-leads/jobs/${encodeURIComponent(leadId)}`, { params: { page, size: 100 } });
      if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not load job details.');
      if (!Array.isArray(data?.results)) throw new Error('Could not read job details.');
      const job = data.results.find(job => String(job.id) === String(jobId));
      if (job) return job;
      if (!data.next) break;
      const nextPage = Number(new URL(data.next, 'https://api.invalid').searchParams.get('page'));
      if (!Number.isInteger(nextPage) || nextPage < 1) break;
      page = nextPage;
    }
    throw new Error('This job was not found for the selected data lead.');
  }
  // Preserve existing links from other modules that only supply the job ID.
  const { data } = await api.get(`/data-leads/update-job/${encodeURIComponent(jobId)}`);
  if (data?.status === false || data?.success === false) throw new Error(data.message || 'Could not load job.');
  const job = data?.data ?? data;
  if (job?.id == null) throw new Error('Could not read job details.');
  return job;
}

const fmt = (date) =>
  date && dayjs(date).isValid() ? dayjs(date).format("MMM DD, YYYY") : "—";

const Field = ({ label, value, span = 6 }) => (
  <Col span={span}>
    <div style={{ marginBottom: 4 }}>
      <label className="form-label text-start mt-3 mb-1">{label}</label>
      <div style={{ padding: "6px 0", color: "#222", fontSize: 14, fontWeight: 500 }}>
        {value ?? "—"}
      </div>
    </div>
  </Col>
);

const Section = ({ title, icon, children }) => (
  <Col span={24}>
    <div className="job-form-section">
      <h3 className="job-form-section__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon && <span style={{ color: "#3e6a9f", fontSize: 16 }}>{icon}</span>}
        {title}
      </h3>
      <Divider className="job-form-section__divider" />
      <Row gutter={[16, 0]}>
        {children}
      </Row>
    </div>
  </Col>
);

const SkillCard = ({ skill }) => (
  <div style={{ border: "1px solid #3e6a9f", borderRadius: 6, padding: "8px 12px", background: "#fff", height: "100%" }}>
    <div style={{ fontWeight: 600, fontSize: 13, color: "#3e6a9f", marginBottom: 5 }}>{skill.skill_name}</div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <Tag style={{ margin: 0, fontSize: 11, background: "#eaf0f8", borderColor: "#3e6a9f", color: "#3e6a9f" }}>{skill.experience} yr{skill.experience !== 1 ? "s" : ""} exp</Tag>
      <Tag style={{ margin: 0, fontSize: 11, background: "#eaf0f8", borderColor: "#3e6a9f", color: "#3e6a9f" }}>
        {skill.last_used === 0 ? "Currently used" : `Last used ${skill.last_used} yr${skill.last_used !== 1 ? "s" : ""} ago`}
      </Tag>
    </div>
  </div>
);

const DataLeadJobDetail = () => {
  const navigate = useNavigate();
  const { jobId, leadId: routeLeadId } = useParams();
  const [searchParams] = useSearchParams();
  const leadId = routeLeadId || searchParams.get('leadId');
  const { user } = useUserStore();
  const isAdmin = isSuperAdmin(user?.user_type);

  const { data: job, isLoading, isError, error, refetch } = useQuery(
    ["dataLeadJobDetail", user?.id, user?.user_type, leadId, jobId],
    () => getJobDetails(jobId, leadId),
    { enabled: Boolean(jobId), refetchOnWindowFocus: false }
  );

  const goBack = () => navigate(-1);

  if (isLoading) {
    return (
      <>
        <BreadCrumb linkText="Job Detail" goBack={goBack} />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <Spin size="large" />
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <BreadCrumb linkText="Job Detail" goBack={goBack} />
        <Alert type="error" showIcon message={error?.message || 'Could not load job details.'} action={<Button onClick={() => refetch()}>Retry</Button>} />
      </>
    );
  }

  const salary =
    job?.min_salary != null && job?.max_salary != null
      ? `${formatSalaryNum(job.min_salary)} – ${formatSalaryNum(job.max_salary)}${job.currency ? ` ${job.currency}` : ""}${job.payment_term ? ` / ${job.payment_term}` : ""}`
      : job?.min_salary != null
      ? `${formatSalaryNum(job.min_salary)}${job.currency ? ` ${job.currency}` : ""}${job.payment_term ? ` / ${job.payment_term}` : ""}`
      : null;

  return (
    <div className="lead-job-page">
      <BreadCrumb goBack={goBack} linkText="Job Detail" />

      <div className="">
        <div className="" style={{ paddingBottom: 60 }}>

          {/* Title & badges */}
          <div className="row" style={{ marginBottom: 16, marginLeft: 16, flexDirection: "column" }}>
            <h1 style={{ marginBottom: 8 }}>{job?.job_title || "Job Detail"}</h1>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {job?.status && <Tag style={job.status === "Active" ? { background: "#eaf0f8", borderColor: "#3e6a9f", color: "#3e6a9f" } : {}}>{job.status}</Tag>}
              {job?.job_type && <Tag>{job.job_type}</Tag>}
              {job?.employment_type && <Tag>{job.employment_type}</Tag>}
              {job?.department && <Tag>{job.department}</Tag>}
            </div>
          </div>

          <Row gutter={[10, 10]}>

            {/* Basic Info */}
            <Section title="Basic Info" icon={<InfoCircleOutlined size="1em" className="app-icon" />}>
              <Field label="Job ID" value={jobId} />
              <Field label="Job Portal Job" value={
                <Tag style={{ margin: 0, ...(job?.is_job_create ? { background: "#eaf0f8", borderColor: "#3e6a9f", color: "#3e6a9f" } : { color: "red", borderColor: "red" }) }}>
                  {job?.is_job_create ? "Created" : "Not Created"}
                </Tag>
              } />
              <Field label="Status" value={
                job?.status
                  ? <Tag style={{ margin: 0, ...(job.status === "Active" ? { background: "#eaf0f8", borderColor: "#3e6a9f", color: "#3e6a9f" } : {}) }}>{job.status}</Tag>
                  : null
              } />
              <Field label="Posted On" value={fmt(job?.created_at)} />
              <Field label="Vacancies" value={job?.number_of_vacancies} />
              <Field label="CVs to Provide" value={job?.cvs_to_be_provided} />
              <Field label="CV Submission Deadline" value={fmt(job?.cv_submission_deadline)} />
              <Field label="Expected Joining Date" value={fmt(job?.expected_joining_date)} />
              {job?.remarks && <Field label="Remarks" value={job.remarks} span={24} />}
            </Section>

            {/* Location & Schedule */}
            <Section title="Location & Schedule" icon={<EnvironmentOutlined size="1em" className="app-icon" />}>
              <Field label="Country" value={job?.location_country} />
              <Field label="City" value={job?.location_city} />
              {job?.address && <Field label="Address" value={job.address} span={12} />}
              <Field label="Timezone" value={job?.timezone} span={12} />
              <Field label="Working Days" value={job?.working_days} />
              <Field label="Working Hours" value={job?.working_hours ? `${job.working_hours} hrs/day` : null} />
              <Field label="Hours per Week" value={job?.hours_per_week ? `${job.hours_per_week} hrs` : null} />
              <Field label="Job Shift" value={job?.job_shift} />
            </Section>

            {/* Compensation */}
            <Section title="Salary & Compensation" icon={<DollarOutlined size="1em" className="app-icon" />}>
              {salary && (
                <Col span={24}>
                  <div style={{ marginBottom: 12, fontWeight: 700, fontSize: 15, color: "#389e0d" }}>{salary}</div>
                </Col>
              )}
              <Field label="Salary Type" value={job?.salary_type} />
              <Field label="Currency" value={job?.currency} />
              <Field label="Min Salary" value={job?.min_salary != null ? formatSalaryNum(job.min_salary) : null} />
              <Field label="Max Salary" value={job?.max_salary != null ? formatSalaryNum(job.max_salary) : null} />
              <Field label="Payment Term" value={job?.payment_term} />
              <Field label="Contract Length" value={[job?.contract_length, job?.contract_period].filter(Boolean).join(" ") || null} />
              {job?.contract_salary_type && <Field label="Contract Salary Type" value={job.contract_salary_type} />}
              {job?.charges_per_resource != null && <Field label="Charges / Resource" value={job.charges_per_resource} />}
              {job?.discount_per_resource != null && <Field label="Discount / Resource" value={job.discount_per_resource} />}
              {job?.contract_subtotal_amount != null && <Field label="Contract Sub Total" value={job.contract_subtotal_amount} />}
              {job?.discount_amount != null && <Field label="Discount Amount" value={job.discount_amount} />}
              {job?.contract_price != null && <Field label="Contract Price" value={job.contract_price} />}
              {job?.other_benefits && <Field label="Other Benefits" value={job.other_benefits} span={24} />}
            </Section>

            {/* Candidate Requirements */}
            <Section title="Candidate Requirements" icon={<UserOutlined size="1em" className="app-icon" />}>
              <Field label="Min Experience" value={job?.min_experience != null ? `${job.min_experience} yrs` : null} />
              <Field label="Max Experience" value={job?.max_experience != null ? `${job.max_experience} yrs` : null} />
              <Field label="Gender Preference" value={job?.gender_preference} />
              <Field label="Nationality Preference" value={job?.nationality_preference} span={12} />
              <Field label="Languages Required" value={job?.languages_required} />
              <Field label="Educational Qualification" value={job?.educational_qualification} />
              <Field label="Degree Level" value={job?.degree_level} />
              {job?.degrees?.length > 0 && (
                <Col span={24}>
                  <label className="form-label text-start mt-3 mb-1">Required Degrees</label>
                  <div style={{ paddingTop: 4, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {job.degrees.map((d) => (
                      <Tag key={d.id} icon={<BookOutlined size="1em" className="app-icon" />} color="blue">{d.degree_name}</Tag>
                    ))}
                  </div>
                </Col>
              )}
            </Section>

            {/* Skills */}
            {job?.skills?.length > 0 && (
              <Section title="Required Skills" icon={<ThunderboltOutlined size="1em" className="app-icon" />}>
                {job.skills.map((s) => (
                  <Col key={s.id} xs={24} sm={12} md={8} lg={6}>
                    <div style={{ marginTop: 4 }}>
                      <SkillCard skill={s} />
                    </div>
                  </Col>
                ))}
              </Section>
            )}

            {/* Job Details */}
            <Section title="Job Details" icon={<FileTextOutlined size="1em" className="app-icon" />}>
              <Col span={24}>
                <label className="form-label text-start mt-3 mb-1">Description</label>
                <div style={{ whiteSpace: "pre-line", fontSize: 14, color: "#333", paddingTop: 4 }}>{job?.job_description || "—"}</div>
              </Col>
              <Col span={24}>
                <label className="form-label text-start mt-3 mb-1">Responsibilities</label>
                <div style={{ whiteSpace: "pre-line", fontSize: 14, color: "#333", paddingTop: 4 }}>{job?.job_responsibilities || "—"}</div>
              </Col>
              <Col span={24}>
                <label className="form-label text-start mt-3 mb-1">Requirements</label>
                <div style={{ whiteSpace: "pre-line", fontSize: 14, color: "#333", paddingTop: 4 }}>{job?.job_requirements || "—"}</div>
              </Col>
              {job?.key_skills_required && (
                <Col span={24}>
                  <label className="form-label text-start mt-3 mb-1">Key Skills</label>
                  <div style={{ whiteSpace: "pre-line", fontSize: 14, color: "#333", paddingTop: 4 }}>{job.key_skills_required}</div>
                </Col>
              )}
              {job?.notes && (
                <Col span={24}>
                  <label className="form-label text-start mt-3 mb-1">Notes</label>
                  <div style={{ whiteSpace: "pre-line", fontSize: 14, color: "#333", paddingTop: 4 }}>{job.notes}</div>
                </Col>
              )}
            </Section>

            {/* Additional Info */}
            {isAdmin && <Section title="Additional Info" icon={<AppstoreOutlined size="1em" className="app-icon" />}>
              <Field label="Is Job Created (Portal)" value={<Tag style={{ margin: 0, ...(job?.is_job_create ? { background: "#eaf0f8", borderColor: "#3e6a9f", color: "#3e6a9f" } : {}) }}>{job?.is_job_create ? "Yes" : "No"}</Tag>} />
              <Field label="Accepting Public CVs" value={<Tag style={{ margin: 0, ...(job?.is_accepting_public_resumes ? { background: "#eaf0f8", borderColor: "#3e6a9f", color: "#3e6a9f" } : { color: "red", borderColor: "red" }) }}>{job?.is_accepting_public_resumes ? "Yes" : "No"}</Tag>} />
              <Field label="Accepting Responses" value={<Tag style={{ margin: 0, ...(job?.is_accepting_responses ? { background: "#eaf0f8", borderColor: "#3e6a9f", color: "#3e6a9f" } : { color: "red", borderColor: "red" }) }}>{job?.is_accepting_responses ? "Yes" : "No"}</Tag>} />
              <Field label="Show Salary to Public" value={<Tag style={{ margin: 0, ...(job?.show_salary_to_public ? { background: "#eaf0f8", borderColor: "#3e6a9f", color: "#3e6a9f" } : {}) }}>{job?.show_salary_to_public ? "Yes" : "No"}</Tag>} />
              <Field label="Is Active" value={<Tag style={{ margin: 0, ...(job?.is_active ? { background: "#eaf0f8", borderColor: "#3e6a9f", color: "#3e6a9f" } : { color: "red", borderColor: "red" }) }}>{job?.is_active ? "Yes" : "No"}</Tag>} />
              <Field label="Public Link Shared" value={<Tag style={{ margin: 0, ...(job?.is_public_link_shared ? { background: "#eaf0f8", borderColor: "#3e6a9f", color: "#3e6a9f" } : {}) }}>{job?.is_public_link_shared ? "Yes" : "No"}</Tag>} />
              <Field label="Public CV Impressions" value={job?.public_cv_impression} />
              <Field label="Screening Impressions" value={job?.screening_form_impression} />
              {job?.followup_date && <Field label="Follow-up Date" value={fmt(job.followup_date)} />}
              {job?.last_followup_date && <Field label="Last Follow-up Date" value={fmt(job.last_followup_date)} />}
              {job?.delete_reason && <Field label="Delete Reason" value={job.delete_reason} />}
              <Field label="Project ID" value={job?.project} />
            </Section>}

          </Row>
        </div>
      </div>
    </div>
  );
};

export default DataLeadJobDetail;

