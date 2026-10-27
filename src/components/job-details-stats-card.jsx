import { message } from './ui/notifications.jsx';
import { Modal } from './ui/app-modal.jsx';
import { Select } from './ui/app-select.jsx';
import { Button, Tooltip, Spin } from './ui/app-controls.jsx';
import React, { useState, useEffect } from 'react';
import { Switch, Row, Col, Statistic } from 'antd';
import { MessageCircle as CommentOutlined, ChartColumn as BarChartOutlined, Copy as CopyOutlined } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'react-query';
import formatDateUniversal from '../pages/shared/utils/formatDate.js';
import ShareModal from './ShareModal.jsx';
import { updateJobSettings, getJobResumeCount, postJobPublicResumeShare } from '../pages/shared/services/headhunting.js';
import '../assets/styles/legacy/job-details-stats-card.css';
import '../assets/styles/legacy/table-client-actions.css';

const SAAS_CREATED_COLOR = '#52c41a';
const SAAS_NOT_CREATED_COLOR = '#ff4d4f';

const SaasStatusPill = ({ isCreated }) => (
  <span
    className="client-table-status-pill"
    style={{ '--status-pill-fg': isCreated ? SAAS_CREATED_COLOR : SAAS_NOT_CREATED_COLOR }}
  >
    {isCreated ? 'Created' : 'Not Created'}
  </span>
);

// This component only updates JOB settings, not client settings
// DO NOT use client update APIs in this component
const JobDetailsStatsCard = ({
  batchesData,
  jobId,
  isRecruitmentUser,
  showSaasJobStatus = true,
  isReadOnly = false,
  pendingResumes,
  hiredResumes,
  rejectedResumes,
  availableScreenings,
  screeningsLoading,
  selectedScreeningForm,
  setSelectedScreeningForm,
  handleUpdateScreeningForm,
  handleViewScreeningResponses,
  updateScreeningFormMutation,
  setJobRemarksModal,
  jobActive,
  isProjectApprovalPending = false,
  onSettingsUpdated,
}) => {
  const navigate = useNavigate();

  // Modal state for detailed resume statistics
  const [statsModalVisible, setStatsModalVisible] = useState(false);

  const [publicResumeLink, setPublicResumeLink] = useState('');
  const [shareModal, setShareModal] = useState({
    visible: false,
    loading: false,
    link: null,
    title: '',
    resumeName: '',
  });

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(`${type} copied to clipboard`);
    } catch {
      message.error(`Failed to copy ${String(type).toLowerCase()}`);
    }
  };

  const handleCopyPublicCvLink = async () => {
    if (!jobId) return;
    try {
      await postJobPublicResumeShare(jobId);
    } catch (err) {
      const msg =
        (err && typeof err === 'object' && err.message) ||
        (typeof err === 'string' ? err : null) ||
        'Could not record public link share';
      message.error(msg);
    }
    const link = `https://www.searchopal.com/resume-upload?JobID=${jobId}`;
    setPublicResumeLink(link);
    setShareModal({
      visible: true,
      loading: false,
      link,
      title: 'Public CV Upload',
      resumeName: '',
    });
  };

  // Fetch detailed resume count statistics
  const { data: resumeCountData, isLoading: resumeCountLoading } = useQuery(
    ['jobResumeCount', jobId],
    () => getJobResumeCount(jobId),
    {
      enabled: !!jobId,
      refetchOnWindowFocus: false,
    }
  );

  // Switch states - default to true (on)
  const [isAcceptingPublicResumes, setIsAcceptingPublicResumes] = useState(
    batchesData?.is_accepting_public_resumes
  );
  const [isAcceptingResponses, setIsAcceptingResponses] = useState(
    batchesData?.is_accepting_responses
  );
  const [showSalaryToPublic, setShowSalaryToPublic] = useState(
    batchesData?.show_salary_to_public
  );
  const [isBatchSharing, setIsBatchSharing] = useState(
    batchesData?.is_batch_sharing
  );

  // Sync switch states with batchesData when it loads/changes
  useEffect(() => {
    if (batchesData) {
      setIsAcceptingPublicResumes(batchesData.is_accepting_public_resumes ?? true);
      setIsAcceptingResponses(batchesData.is_accepting_responses ?? true);
      setShowSalaryToPublic(batchesData.show_salary_to_public ?? false);
      setIsBatchSharing(batchesData.is_batch_sharing ?? false);
    }
  }, [batchesData]);

  // Individual loading states for switches
  const [publicResumesLoading, setPublicResumesLoading] = useState(false);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [batchSharingLoading, setBatchSharingLoading] = useState(false);
  const [batchShareModal, setBatchShareModal] = useState({
    visible: false,
    link: null,
    title: '',
  });

  // Mutation for updating job settings
  const updateJobMutation = useMutation(
    ({ jobId, values }) => updateJobSettings(jobId, values),
    {
      onSuccess: () => {
        message.success('Job settings updated successfully');
        // Reset loading states
        setPublicResumesLoading(false);
        setResponsesLoading(false);
        setSalaryLoading(false);
        setBatchSharingLoading(false);
        // Refresh batchesData (e.g. batch_identifier) so dependent UI like the batch copy-link appears immediately
        onSettingsUpdated?.();
      },
      onError: (error, variables) => {
        message.error(error?.message || 'Failed to update job settings');
        // Reset loading states
        setPublicResumesLoading(false);
        setResponsesLoading(false);
        setSalaryLoading(false);
        setBatchSharingLoading(false);
        // Revert only the specific switch that was changed
        if (variables.values.hasOwnProperty('is_accepting_public_resumes')) {
          setIsAcceptingPublicResumes(batchesData?.is_accepting_public_resumes ?? true);
        }
        if (variables.values.hasOwnProperty('is_accepting_responses')) {
          setIsAcceptingResponses(batchesData?.is_accepting_responses ?? true);
        }
        if (variables.values.hasOwnProperty('show_salary_to_public')) {
          setShowSalaryToPublic(batchesData?.show_salary_to_public ?? false);
        }
        if (variables.values.hasOwnProperty('is_batch_sharing')) {
          setIsBatchSharing(batchesData?.is_batch_sharing ?? false);
        }
      },
    }
  );

  // Handler for public resumes switch toggle
  const handlePublicResumesToggle = (checked) => {
    setIsAcceptingPublicResumes(checked);
    updateJobMutation.mutate({
      jobId,
      values: { is_accepting_public_resumes: checked }
    });
  };

  // Handler for responses switch toggle
  const handleResponsesToggle = (checked) => {
    setIsAcceptingResponses(checked);
    updateJobMutation.mutate({
      jobId,
      values: { is_accepting_responses: checked }
    });
  };

  // Handler for show salary to public switch toggle
  const handleShowSalaryToPublicToggle = (checked) => {
    setShowSalaryToPublic(checked);
    updateJobMutation.mutate({
      jobId,
      values: { show_salary_to_public: checked }
    });
  };

  // Handler for batch sharing (hide/show CV batches from main system) switch toggle
  const handleBatchSharingToggle = (checked) => {
    setBatchSharingLoading(true);
    setIsBatchSharing(checked);
    updateJobMutation.mutate({
      jobId,
      values: { is_batch_sharing: checked }
    });
  };

  return (
    <>
      <div className="lead-card responsive-lead-card job-details-stats-card">
        {/* Card Header */}
        <div className="job-details-stats-card__header">
          <h3 className="job-details-stats-card__title">
            Job Details & Statistics
          </h3>
          <Button
            type="primary"
            className="job-details-stats-card__btn-view-job"
            onClick={() =>
              navigate(`/job-detail/${jobId}`)
            }
          >
            View Job
          </Button>
        </div>

        {/* Job Details */}
        <div className="job-details-stats-card__body">
          <div className="job-details-stats-card__row">
            <span className="job-details-stats-card__label">Job Title:</span>
            <span className="job-details-stats-card__value">
              {batchesData?.job_title || '-'}
            </span>
          </div>

          <div className="job-details-stats-card__row">
            <span className="job-details-stats-card__label">Job ID:</span>
            <span className="job-details-stats-card__value job-details-stats-card__value--medium">
              {jobId || '-'}
            </span>
          </div>

          <div className="job-details-stats-card__row">
            <span className="job-details-stats-card__label">Job Status:</span>
            <span className="job-details-stats-card__status-badge">
              {batchesData?.job_status || '-'}
            </span>
          </div>

          <div className="job-details-stats-card__row">
            <span className="job-details-stats-card__label">Posted On:</span>
            <span className="job-details-stats-card__value job-details-stats-card__value--medium">
              {batchesData?.job_created_at ? formatDateUniversal(batchesData.job_created_at, true) : '-'}
            </span>
          </div>

          <div className="job-details-stats-card__row">
            <span className="job-details-stats-card__label">CV Submission Deadline:</span>
            <span className="job-details-stats-card__value job-details-stats-card__value--medium">
              {batchesData?.cv_submission_deadline
                ? formatDateUniversal(batchesData.cv_submission_deadline, false)
                : "-"}
            </span>
          </div>

          <div className="job-details-stats-card__row">
            <span className="job-details-stats-card__label">CVs to be provided:</span>
            <span className="job-details-stats-card__value job-details-stats-card__value--medium">
              {batchesData?.cvs_to_be_provided || '-'}
            </span>
          </div>

          {batchesData?.project_completion_deadline && (
            <div className="job-details-stats-card__row">
              <span className="job-details-stats-card__label">Project Completion Deadline:</span>
              <span className="job-details-stats-card__value job-details-stats-card__value--medium">
                {formatDateUniversal(batchesData.project_completion_deadline, false)}
              </span>
            </div>
          )}

          <div className="job-details-stats-card__row">
            <span className="job-details-stats-card__label">
              {isRecruitmentUser ? 'Recruitment Remarks:' : 'Sales Person Remarks:'}
            </span>
            {isReadOnly ? (
              <span className="job-details-stats-card__remarks-readonly">
                {batchesData?.remarks ? 'View remarks in details' : '-'}
              </span>
            ) : (
              <Tooltip title={batchesData?.remarks ? batchesData.remarks : "Click to add/edit remarks"}>
                <CommentOutlined size="1em"
                  className={["app-icon", batchesData?.remarks
                      ? 'job-details-stats-card__remarks-icon job-details-stats-card__remarks-icon--active'
                      : 'job-details-stats-card__remarks-icon job-details-stats-card__remarks-icon--inactive'].filter(Boolean).join(' ')}
                  onClick={() =>
                    setJobRemarksModal({
                      visible: true,
                      remarks: batchesData?.remarks ?? '',
                    })
                  }
                />
              </Tooltip>
            )}
          </div>

          {showSaasJobStatus && (
            <div className="job-details-stats-card__row">
              <span className="job-details-stats-card__label">Job Portal Job:</span>
              {batchesData?.is_job_create === true ? (
                <SaasStatusPill isCreated={true} />
              ) : isRecruitmentUser ? (
                <Tooltip
                  title={
                    isProjectApprovalPending
                      ? 'This project must be approved by both the Recruitment Manager and Recruiter before the Job Portal job can be created.'
                      : ''
                  }
                >
                  <Button
                    type="primary"
                    disabled={isProjectApprovalPending}
                    onClick={() => navigate(`/saas-job-headhunting/${jobId}`)}
                    className="job-details-stats-card__btn-view-job"
                  >
                    Create Job Portal Job
                  </Button>
                </Tooltip>
              ) : (
                <SaasStatusPill isCreated={false} />
              )}
            </div>
          )}

          {/* Job Settings Switches */}
          {!isReadOnly && (
            <div className="job-details-stats-card__settings-panel">
              <h4 className="job-details-stats-card__settings-title">
                Job Settings
              </h4>

              <div className="job-details-stats-card__settings-row">
                <span className="job-details-stats-card__label">
                  Accept Public CVs:
                </span>
                <Switch
                  checked={isAcceptingPublicResumes}
                  onChange={handlePublicResumesToggle}
                  loading={publicResumesLoading}
                  className={
                    isAcceptingPublicResumes
                      ? 'job-details-stats-card__switch--on'
                      : 'job-details-stats-card__switch--off'
                  }
                />
              </div>

              <div className="job-details-stats-card__settings-row">
                <span className="job-details-stats-card__label">
                  Accept Screening Questionnaire Responses
                </span>
                <Switch
                  checked={isAcceptingResponses}
                  onChange={handleResponsesToggle}
                  loading={responsesLoading}
                  className={
                    isAcceptingResponses
                      ? 'job-details-stats-card__switch--on'
                      : 'job-details-stats-card__switch--off'
                  }
                />
              </div>

              <div className="job-details-stats-card__settings-row">
                <span className="job-details-stats-card__label">
                  Show Salary to Public:
                </span>
                <Switch
                  checked={showSalaryToPublic}
                  onChange={handleShowSalaryToPublicToggle}
                  loading={salaryLoading}
                  className={
                    showSalaryToPublic
                      ? 'job-details-stats-card__switch--on'
                      : 'job-details-stats-card__switch--off'
                  }
                />
              </div>

              <div className="job-details-stats-card__settings-row">
                <span className="job-details-stats-card__label">
                  Share CV Batches:
                </span>
                <Switch
                  checked={isBatchSharing}
                  onChange={handleBatchSharingToggle}
                  loading={batchSharingLoading}
                  className={
                    isBatchSharing
                      ? 'job-details-stats-card__switch--on'
                      : 'job-details-stats-card__switch--off'
                  }
                />
              </div>
              {isBatchSharing && batchesData?.batch_identifier && (
                <div className="job-details-stats-card__settings-row">
                  <span className="job-details-stats-card__label">
                    Batch CVs Link:
                  </span>
                  <Tooltip title="View Link">
                    <CopyOutlined size="1em"
                      className={["app-icon", "job-details-stats-card__link-copy-icon"].filter(Boolean).join(' ')}
                      style={{ fontSize: 18 }}
                      onClick={() =>
                        setBatchShareModal({
                          visible: true,
                          link: `https://www.searchopal.com/batch-cvs/${batchesData.batch_identifier}`,
                          title: batchesData?.job_title || 'Job',
                        })
                      }
                      title="View batch share link"
                    />
                  </Tooltip>
                </div>
              )}
            </div>
          )}


          <div className="job-details-stats-card__cv-stats-panel">
            <div className="job-details-stats-card__cv-stats-header">
              <span className="job-details-stats-card__cv-stats-label">CV Statistics:</span>
              <div className="job-details-stats-card__cv-stats-total-wrap">
                {resumeCountData?.total !== undefined && (
                  <span className="job-details-stats-card__cv-stats-total">
                    Total: {resumeCountData.total}
                  </span>
                )}
                <Button
                  type="link"
                  icon={<BarChartOutlined size="1em" className="app-icon" />}
                  onClick={() => setStatsModalVisible(true)}
                  className="job-details-stats-card__btn-view-all"
                >
                  View All
                </Button>
              </div>
            </div>
          </div>

          {!isReadOnly && jobId && (
            <div className="job-details-stats-card__public-actions">
              <div className="job-details-stats-card__public-actions-inner">
                <Tooltip
                  title={
                    isProjectApprovalPending
                      ? 'This project must be approved by both the Recruitment Manager and Recruiter before the Public CV link can be shared.'
                      : ''
                  }
                >
                  <Button
                    type="primary"
                    disabled={isProjectApprovalPending}
                    onClick={handleCopyPublicCvLink}
                    className="job-details-stats-card__btn-copy-link"
                  >
                    Copy Public CV Link
                  </Button>
                </Tooltip>
                {publicResumeLink ? (
                  <div className="job-details-stats-card__link-preview">
                    <span className="job-details-stats-card__link-preview-text">
                      {publicResumeLink.split('/').pop()}
                    </span>
                    <CopyOutlined size="1em"
                      className={["app-icon", "job-details-stats-card__link-copy-icon"].filter(Boolean).join(' ')}
                      onClick={() => copyToClipboard(publicResumeLink, 'Link')}
                      title="Copy link"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Screening Questionnaire Section - Only for Recruitment Users when job is active and recruiter is assigned */}
          {isRecruitmentUser && jobActive && batchesData?.recruiter && batchesData?.recruiter !== '' && (
            <div className="job-details-stats-card__screening-panel">
              <div className="job-details-stats-card__screening-heading">
                <span className="job-details-stats-card__screening-title">Job Screening Questionnaire:</span>
              </div>
              <div className="job-details-stats-card__screening-body">
                <div className="job-details-stats-card__screening-controls">
                  <Select
                    placeholder="Select screening questionnaire"
                    className="job-details-stats-card__screening-select"
                    value={
                      selectedScreeningForm ||
                      batchesData?.screening_form
                    }
                    onChange={setSelectedScreeningForm}
                    loading={screeningsLoading}
                    allowClear
                  >
                    {availableScreenings?.map((screening) => (
                      <Select.Option key={screening.id} value={screening.id}>
                        {screening.title}
                      </Select.Option>
                    ))}
                  </Select>
                  <Button
                    type="primary"
                    onClick={handleUpdateScreeningForm}
                    loading={updateScreeningFormMutation.isLoading}
                    disabled={!selectedScreeningForm}
                    className="job-details-stats-card__screening-submit"
                  >
                    {batchesData?.screening_form ? 'Update' : 'Add'}
                  </Button>
                </div>


              </div>
            </div>
          )}
        </div>

        <Modal
          title={
            <div className="job-details-stats-card__modal-title">
              <BarChartOutlined size="1em" className={["app-icon", "job-details-stats-card__modal-title-icon"].filter(Boolean).join(' ')} />
              <span>Detailed CV Statistics</span>
            </div>
          }
          open={statsModalVisible}
          onCancel={() => setStatsModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setStatsModalVisible(false)}>
              Close
            </Button>
          ]}
          width={800}
          centered
        >
          {resumeCountLoading ? (
            <div className="job-details-stats-card__modal-loading">
              <Spin size="large" />
            </div>
          ) : resumeCountData ? (
            <div className="job-details-stats-card__modal-body">
              {/* Total Count */}
              <div className="job-details-stats-card__stat-hero">
                <Statistic
                  title="Total Resumes"
                  value={resumeCountData.total || 0}
                />
              </div>

              <Row gutter={[16, 16]}>
                {/* Initial Status */}
                <Col xs={24} sm={12} md={8}>
                  <div className="job-details-stats-card__stat-cell job-details-stats-card__stat-cell--amber">
                    <Statistic
                      title="Pending"
                      value={resumeCountData.pending || 0}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div className="job-details-stats-card__stat-cell job-details-stats-card__stat-cell--blue">
                    <Statistic
                      title="Shortlisted"
                      value={resumeCountData.shortlisted || 0}
                    />
                  </div>
                </Col>

                {/* Interview Status */}
                <Col xs={24} sm={12} md={8}>
                  <div className="job-details-stats-card__stat-cell job-details-stats-card__stat-cell--blue">
                    <Statistic
                      title="Interview Scheduled"
                      value={resumeCountData.interview_scheduled || 0}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div className="job-details-stats-card__stat-cell job-details-stats-card__stat-cell--green">
                    <Statistic
                      title="Interview Conducted"
                      value={resumeCountData.interview_conducted || 0}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div className="job-details-stats-card__stat-cell job-details-stats-card__stat-cell--amber">
                    <Statistic
                      title="Not Conducted (Client)"
                      value={resumeCountData.interview_not_conducted_by_client || 0}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div className="job-details-stats-card__stat-cell job-details-stats-card__stat-cell--peach">
                    <Statistic
                      title="Did Not Appear"
                      value={resumeCountData.candidate_did_not_appear_in_interview || 0}
                    />
                  </div>
                </Col>

                {/* Offer & Joining Status */}
                <Col xs={24} sm={12} md={8}>
                  <div className="job-details-stats-card__stat-cell job-details-stats-card__stat-cell--amber">
                    <Statistic
                      title="On Hold"
                      value={resumeCountData.on_hold || 0}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div className="job-details-stats-card__stat-cell job-details-stats-card__stat-cell--blue">
                    <Statistic
                      title="Offer Made"
                      value={resumeCountData.offer_made || 0}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div className="job-details-stats-card__stat-cell job-details-stats-card__stat-cell--peach">
                    <Statistic
                      title="Offer Rejected"
                      value={resumeCountData.offer_rejected || 0}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div className="job-details-stats-card__stat-cell job-details-stats-card__stat-cell--green">
                    <Statistic
                      title="Joined"
                      value={resumeCountData.joined || 0}
                    />
                  </div>
                </Col>

                {/* Rejected After CV Review */}
                <Col xs={24} sm={12} md={8}>
                  <div className="job-details-stats-card__stat-cell job-details-stats-card__stat-cell--rose job-details-stats-card__stat-cell--rose-red">
                    <Statistic
                      title="Rejected (CV) - Valid Reason"
                      value={resumeCountData.rejected_after_cv_review_with_valid_reason || 0}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div className="job-details-stats-card__stat-cell job-details-stats-card__stat-cell--rose job-details-stats-card__stat-cell--rose-soft">
                    <Statistic
                      title="Rejected (CV) - Invalid Reason"
                      value={resumeCountData.rejected_after_cv_review_with_invalid_reason || 0}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div className="job-details-stats-card__stat-cell job-details-stats-card__stat-cell--rose job-details-stats-card__stat-cell--rose-soft">
                    <Statistic
                      title="Rejected (CV) - No Reason"
                      value={resumeCountData.rejected_after_cv_review_without_reason || 0}
                    />
                  </div>
                </Col>

                {/* Rejected After Interview */}
                <Col xs={24} sm={12} md={8}>
                  <div className="job-details-stats-card__stat-cell job-details-stats-card__stat-cell--rose job-details-stats-card__stat-cell--rose-red">
                    <Statistic
                      title="Rejected (Interview) - Valid Reason"
                      value={resumeCountData.rejected_after_interview_with_valid_reason || 0}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div className="job-details-stats-card__stat-cell job-details-stats-card__stat-cell--rose job-details-stats-card__stat-cell--rose-soft">
                    <Statistic
                      title="Rejected (Interview) - Invalid Reason"
                      value={resumeCountData.rejected_after_interview_with_invalid_reason || 0}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div className="job-details-stats-card__stat-cell job-details-stats-card__stat-cell--rose job-details-stats-card__stat-cell--rose-soft">
                    <Statistic
                      title="Rejected (Interview) - No Reason"
                      value={resumeCountData.rejected_after_interview_without_reason || 0}
                    />
                  </div>
                </Col>

                {/* Post-Joining Status */}
                <Col xs={24} sm={12} md={8}>
                  <div className="job-details-stats-card__stat-cell job-details-stats-card__stat-cell--peach">
                    <Statistic
                      title="Candidate Resigned"
                      value={resumeCountData.candidate_resigned || 0}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div className="job-details-stats-card__stat-cell job-details-stats-card__stat-cell--rose job-details-stats-card__stat-cell--rose-red">
                    <Statistic
                      title="Terminated by Company"
                      value={resumeCountData.terminated_by_company || 0}
                    />
                  </div>
                </Col>
              </Row>
            </div>
          ) : (
            <div className="job-details-stats-card__modal-empty">
              No cv statistics available
            </div>
          )}
        </Modal>

        <ShareModal
          visible={shareModal.visible}
          loading={shareModal.loading}
          link={shareModal.link}
          title={shareModal.title}
          resumeName={shareModal.resumeName}
          onCancel={() =>
            setShareModal({ visible: false, loading: false, link: null, title: '', resumeName: '' })
          }
        />

        <ShareModal
          visible={batchShareModal.visible}
          loading={false}
          link={batchShareModal.link}
          title={batchShareModal.title}
          shareDescription="Share this job's CV batches link"
          scanDescription="Scan QR code to open the batch CVs"
          onCancel={() => setBatchShareModal({ visible: false, link: null, title: '' })}
        />
      </div>
    </>
  );
};

export default JobDetailsStatsCard;
