import React, { useMemo } from 'react';
import { Col, Divider, Row, Spin } from 'antd';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import dayjs from 'dayjs';
import BreadCrumb from '../../../../components/breadcrumb.component.jsx';
import { getLeadJobDetail } from '../../../shared/services/leads.js';
import { getMetaLeadJobById } from '../../../shared/services/metaLeads.js';
import { getDataLeadJob } from '../../../shared/services/data-leads-service.js';
import '../../../../assets/styles/legacy/leads.generated.css';
import { formatSalaryNum } from '../../../shared/utils/formatters.js';

const readList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const LeadJobDetailPage = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [searchParams] = useSearchParams();
  const source = (searchParams.get('source') || 'website').toLowerCase();

  const queryKey = ['leadJobDetail', source, jobId];
  const { data: job, isLoading, isError, error } = useQuery(
    queryKey,
    async () => {
      if (source === 'meta') return getMetaLeadJobById(jobId);
      if (source === 'data') return getDataLeadJob(jobId);
      return getLeadJobDetail(jobId);
    },
    {
      enabled: Boolean(jobId),
      refetchOnWindowFocus: false,
    }
  );

  const languages = useMemo(() => readList(job?.languages_required), [job?.languages_required]);

  if (isLoading) {
    return (
      <>
        <BreadCrumb linkText="Lead Job Detail" goBack={() => navigate(-1)} />
        <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <BreadCrumb linkText="Lead Job Detail" goBack={() => navigate(-1)} />
        <div style={{ padding: 24, color: '#b3261e' }}>
          {error?.message || 'Unable to load lead job detail.'}
        </div>
      </>
    );
  }

  return (
    <div className="lead-job-page">
      <BreadCrumb goBack={() => navigate(-1)} linkText="Lead Job Detail" />
      <div className="container">
        <div className="job-card">
          <div className="container">
            <div className="row">
              <h1>{job?.job_title || 'Job Detail'}</h1>
            </div>
          </div>
          <div className="container">
            <Row gutter={[10, 20]}>
              <Col span={6}><label className="form-label text-start mt-3 mb-1">Job Title</label><div>{job?.job_title || '—'}</div></Col>
              <Col span={6}><label className="form-label text-start mt-3 mb-1">No. of Vacancies</label><div>{job?.number_of_vacancies || '—'}</div></Col>
              <Col span={6}><label className="form-label text-start mt-3 mb-1">Job Type</label><div>{job?.job_type || '—'}</div></Col>
              <Col span={6}><label className="form-label text-start mt-3 mb-1">Employment Type</label><div>{job?.employment_type || '—'}</div></Col>
              <Col span={6}><label className="form-label text-start mt-3 mb-1">Education</label><div>{job?.educational_qualification || '—'}</div></Col>
              <Col span={6}><label className="form-label text-start mt-3 mb-1">Language Required</label><div>{languages.length ? languages.join(', ') : '—'}</div></Col>
              <Col span={6}><label className="form-label text-start mt-3 mb-1">Gender Preference</label><div>{job?.gender_preference || '—'}</div></Col>
              <Col span={6}><label className="form-label text-start mt-3 mb-1">Nationality Preference</label><div>{job?.nationality_preference || '—'}</div></Col>
              <Col span={6}><label className="form-label text-start mt-3 mb-1">Department</label><div>{job?.department || '—'}</div></Col>
              <Col span={6}><label className="form-label text-start mt-3 mb-1">City</label><div>{job?.location_city || '—'}</div></Col>
              <Col span={6}><label className="form-label text-start mt-3 mb-1">Country</label><div>{job?.location_country || '—'}</div></Col>
              <Col span={6}><label className="form-label text-start mt-3 mb-1">Payment Term</label><div>{job?.payment_term || '—'}</div></Col>
              <Col span={6}><label className="form-label text-start mt-3 mb-1">Min Salary</label><div>{job?.min_salary != null ? formatSalaryNum(job.min_salary) : '—'}</div></Col>
              <Col span={6}><label className="form-label text-start mt-3 mb-1">Max Salary</label><div>{job?.max_salary != null ? formatSalaryNum(job.max_salary) : '—'}</div></Col>
              <Col span={6}><label className="form-label text-start mt-3 mb-1">CV Submission Deadline</label><div>{job?.cv_submission_deadline ? dayjs(job.cv_submission_deadline).format('MMM DD, YYYY') : '—'}</div></Col>
              <Col span={6}><label className="form-label text-start mt-3 mb-1">Expected Joining Date</label><div>{job?.expected_joining_date ? dayjs(job.expected_joining_date).format('MMM DD, YYYY') : '—'}</div></Col>
              <Divider plain><h3 className="my-0 text-primary">Job Details</h3></Divider>
              <Col span={24}><label className="form-label text-start mt-3 mb-1">Job Description</label><div style={{ whiteSpace: 'pre-line' }}>{job?.job_description || '—'}</div></Col>
              <Col span={24}><label className="form-label text-start mt-3 mb-1">Responsibilities</label><div style={{ whiteSpace: 'pre-line' }}>{job?.job_responsibilities || '—'}</div></Col>
              <Col span={24}><label className="form-label text-start mt-3 mb-1">Requirements</label><div style={{ whiteSpace: 'pre-line' }}>{job?.job_requirements || '—'}</div></Col>
              <Col span={24}><label className="form-label text-start mt-3 mb-1">Key Skills</label><div style={{ whiteSpace: 'pre-line' }}>{job?.key_skills_required || '—'}</div></Col>
              <Col span={24}><label className="form-label text-start mt-3 mb-1">Other Benefits</label><div style={{ whiteSpace: 'pre-line' }}>{job?.other_benefits || '—'}</div></Col>
              <Col span={24}><label className="form-label text-start mt-3 mb-1">Notes</label><div style={{ whiteSpace: 'pre-line' }}>{job?.notes || '—'}</div></Col>
            </Row>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadJobDetailPage;

