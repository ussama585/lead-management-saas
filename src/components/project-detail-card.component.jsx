import { message } from './ui/notifications.jsx';
import { Modal } from './ui/app-modal.jsx';
import { Select } from './ui/app-select.jsx';
import { Input } from './ui/app-controls.jsx';
import { Spin, Button, Tooltip } from './ui/app-controls.jsx';
import React, { useState, useEffect } from 'react';

import { LoaderCircle as LoadingOutlined, Pencil as EditOutlined, MessageCircle as CommentOutlined, Info as InfoCircleOutlined } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import { formatDateUniversal } from '../pages/shared/utils/formatDate.js';
import {
  getProjectInformation,
  updateProjectStatus,
  getProjectJobList,
  getAssignRecruiterList,
} from '../pages/shared/services/headhunting.js';
import '../assets/styles/legacy/lead-card-component.css';
import '../assets/styles/legacy/common.css';
import '../assets/styles/legacy/project-detail-card.component.css';
import useUserStore from "../pages/shared/store/user-store.js";
import HeadhuntingActivateProjectContent from './headhunting-activate-project-content.jsx';
import ClientDetailCard from './client-detail-card.component.jsx';
import { formatPrice } from '../pages/shared/utils/priceFormater.js';
const statusColors = {
  'Pending': '#faad14', // Orange
  'Active': '#52c41a', // Green
  'Completed': '#1890ff', // Blue
  'Terminated': '#ff4d4f', // Red
  'Potential Client': '#faad14', // Orange
  'Lost': '#ff4d4f', // Red
  'Inactive': '#8c8c8c', // Gray
  'In Pipeline': '#1890ff', // Blue
};

const approvalColors = {
  'Approved': '#52c41a', // Green
  'Rejected': '#ff4d4f', // Red
  'Pending': '#faad14', // Orange
};

const ProjectDetailCard = ({
  projectData,
  jobCounts,
  onStatusChange,
  currentUser,
  projectId,
  clientData,
  wrapInGrid = true,
  fetchProject = true,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [remarksModalVisible, setRemarksModalVisible] = useState(false);
  const [remarksValue, setRemarksValue] = useState('');
  const [savingRemarks, setSavingRemarks] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [jobsList, setJobsList] = useState([]);
  const [loadingJobsList, setLoadingJobsList] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState([]);
  const [jobDeadlines, setJobDeadlines] = useState({});
  const [jobSelectionError, setJobSelectionError] = useState('');
  const [recruiterOptions, setRecruiterOptions] = useState([]);
  const [assigningRecruiter, setAssigningRecruiter] = useState(false);
  const [activeRecruiterId, setActiveRecruiterId] = useState(undefined);
  const [projectSubmissionDeadline, setProjectSubmissionDeadline] = useState(null);
    const { user } = useUserStore();
  // Fetch detailed project information if projectId is provided
  const {
    data: detailedProjectData,
    isLoading: projectLoading,
    isFetching: projectFetching,
    error: projectError,
  } = useQuery(
    ['projectInformation', projectId],
    () => getProjectInformation(projectId),
    {
      enabled: fetchProject && !!projectId,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2, // Retry failed requests up to 2 times
      retryDelay: 1000, // Wait 1 second between retries
    }
  );

  // Fetch client details if clientId is available
  const clientId =
    detailedProjectData?.client ||
    projectData?.client ||
    projectData?.client_id ||
    projectData?.clientId;

  // Use detailed project data if available, otherwise fall back to passed projectData
  const finalProjectData = detailedProjectData || projectData;

  // Local status state so dropdown updates immediately on change
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    if (finalProjectData) {
      setSelectedStatus(
        finalProjectData.status ?? finalProjectData.project_status ?? 'Active',
      );
    }
  }, [finalProjectData?.status, finalProjectData?.project_status]);

  // Helpers for Active modal (jobs + recruiter)
  const setDeadlineForJob = (jobId, dateObj) => {
    setJobDeadlines((prev) => ({ ...prev, [jobId]: dateObj || undefined }));
  };

  const formatDeadlineWithOffset = (dateObj) => {
    if (!dateObj) return '';
    const d = new Date(dateObj);
    const pad = (n, w = 2) => String(n).padStart(w, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const idToUse = finalProjectData?.id || projectId;
    const alreadyHasRecruitmentManager =
      finalProjectData?.recruitment_manager !== null &&
      finalProjectData?.recruitment_manager !== undefined;
    // Only fetch jobs+recruiters when opening the Active modal for first-time activation
    if (!statusModalVisible || !idToUse || pendingStatus !== 'Active' || alreadyHasRecruitmentManager) return;

    const loadJobsAndRecruiters = async () => {
      try {
        setLoadingJobsList(true);
        setSelectedJobIds([]);
        setJobDeadlines({});
        setProjectSubmissionDeadline(null);
        setJobSelectionError('');
        const jobsRes = await getProjectJobList(idToUse, null, 1, 50, [], '');
        const list = Array.isArray(jobsRes?.results)
          ? jobsRes.results
          : Array.isArray(jobsRes)
          ? jobsRes
          : [];
        const mapped = list
          .filter((j) => j && j.id && j.job_title)
          .map((j) => ({
            id: j.id,
            job_title: j.job_title,
            number_of_vacancies: j.number_of_vacancies,
          }));
        setJobsList(mapped);
        // Auto-select all jobs
        setSelectedJobIds(mapped.map((j) => j.id));
      } catch {
        setJobsList([]);
      } finally {
        setLoadingJobsList(false);
      }

      // Fetch recruiter list
      try {
        setAssigningRecruiter(true);
        const data = await getAssignRecruiterList();
        if (Array.isArray(data)) {
          setRecruiterOptions(
            data.map((r) => ({ label: r.name, value: Number(r.id) })),
          );
        }
      } catch {
        setRecruiterOptions([]);
      } finally {
        setAssigningRecruiter(false);
      }
    };

    loadJobsAndRecruiters();
  }, [statusModalVisible, pendingStatus, finalProjectData?.recruitment_manager, finalProjectData?.id, projectId]);

  // Show loading spinner while fetching project details (only if query is enabled)
  const shouldShowLoading = (fetchProject && !!projectId) && (projectLoading || projectFetching);

  if (shouldShowLoading) {
    return (
      <div className="lead-card responsive-lead-card detail-card detail-card--centered">
        <Spin indicator={<LoadingOutlined size="1em" className={["app-icon app-icon-spin", "detail-card__spinner"].filter(Boolean).join(' ')}  />} />
      </div>
    );
  }

  // If query is enabled but no data and not loading, return null (but this should rarely happen)
  if (fetchProject && !!projectId && !finalProjectData && !projectLoading) return null;

  // If projectData is passed as prop, use it even if query didn't run
  if (!finalProjectData && !projectData && !fetchProject) return null;

  // Show error state if API call failed
  if (projectError && !projectData) {
    return (
      <div className="lead-card responsive-lead-card detail-card detail-card--error">
        <p className="detail-card__error-text">Failed to load project details</p>
      </div>
    );
  }

const projectStatusColors = {
  'Pending': '#faad14', // Orange
  'Active': '#52c41a', // Green
  'Delayed': '#ff7a45', // Dark Orange
  'Completed': '#1890ff', // Blue
  'Completed - Payment Pending': '#fa8c16', // Orange
  'Completed - Defaulter': '#ff4d4f', // Red
  'Terminated By Client': '#13c2c2', // Cyan
  'Terminated By Client + Refunded': '#722ed1', // Purple
  'Terminated By Search O Pal': '#2f54eb', // Blue
  'Terminated By Search O Pal + Refunded': '#531dab', // Dark Purple
};

  // Status options for project
  const statusOptions = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Active', value: 'Active' },
  { label: 'Delayed', value: 'Delayed' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Completed - Payment Pending', value: 'Completed - Payment Pending' },
  { label: 'Completed - Defaulter', value: 'Completed - Defaulter' },
  { label: 'Terminated By Client', value: 'Terminated By Client' },
  { label: 'Terminated By Client + Refunded', value: 'Terminated By Client + Refunded' },
  { label: 'Terminated By Search O Pal', value: 'Terminated By Search O Pal' },
  { label: 'Terminated By Search O Pal + Refunded', value: 'Terminated By Search O Pal + Refunded' },
];



  const totalJobs = finalProjectData?.job_count || 0;
  const currencyShort =
    finalProjectData?.contract_currency
      ? (finalProjectData.contract_currency.match(/\(([^)]+)\)/)?.[1] ||
        finalProjectData.contract_currency)
      : "";
  // Normalize names for reliable comparison
  // Prefer value from detailed API response, then fallback to initial projectData, then final merged object
  const assignedToRaw = (
    detailedProjectData?.assigned_to ??
    projectData?.assigned_to ??
    finalProjectData?.assigned_to ??
    ''
  ).toString();
  const assignedToName = assignedToRaw.trim().toLowerCase();
  const currentUserName = (currentUser?.name || '').toString().trim().toLowerCase();

  // DEBUG: compare values for Edit button visibility
 

  const isAdminUser = currentUser?.user_type === 'admin';
  const isSalesManagerUser = currentUser?.user_type === 'sales_manager';
  const isSalesExecutiveUser = currentUser?.user_type === 'sales_executive';
  const isRecruitmentExecutive = currentUser?.user_type === 'recruitment_executive';
  const isRecruitmentManager = currentUser?.user_type === 'recruitment_manager';
  const isRecruitmentUser = isRecruitmentExecutive || isRecruitmentManager;
  const isProjectManagerUser = currentUser?.user_type === 'project_manager';
  // Show Edit button if admin OR the project is assigned to the current user
  const canShowEditButton = !!currentUser && (
    !isProjectManagerUser &&
    (isAdminUser || (!!currentUserName && !!assignedToName && currentUserName === assignedToName))
  );

  // Determine if user can change status:
  // - Sales executives must NEVER change status
  // - Sales managers can change status (for their own + executives' projects)
  // - Admin can always change
  // - Other roles can change only if explicitly assigned (via canShowEditButton)
  const canEditStatus = !!currentUser &&
    !isSalesExecutiveUser &&
    !isProjectManagerUser &&
    (isAdminUser || isSalesManagerUser || canShowEditButton);

  // Check if project already has a recruitment manager assigned
  const hasRecruitmentManager =
    finalProjectData?.recruitment_manager !== null &&
    finalProjectData?.recruitment_manager !== undefined;

  // Job Portal actions (e.g. Create Job Portal Client) require both approvals to be Approved
  const isProjectApprovalPending =
    (finalProjectData?.recruitment_manager_approval ?? 'Pending') !== 'Approved' ||
    (finalProjectData?.recruiter_approval ?? 'Pending') !== 'Approved';

  const invalidateProjectQueries = (id) => {
    if (!id) return;
    queryClient.invalidateQueries(['projectInformation', id]);
    queryClient.invalidateQueries(['projectInfo', id]);
    queryClient.invalidateQueries(['projectDetails', id]);
    queryClient.invalidateQueries(['projectJobs', id]);
    queryClient.invalidateQueries(['projectJobCounts', id]);
  };

  const handleStatusChange = async (newStatus) => {
    const idToUse = finalProjectData?.id || projectId;
    if (!idToUse) return;

    try {
      setStatusUpdating(true);
      let payload = { status: newStatus };

      // Only require recruiter + job selection when FIRST activating (no recruitment manager yet)
      if (newStatus === 'Active' && !hasRecruitmentManager) {
        // Validate project submission deadline
        if (!projectSubmissionDeadline) {
          message.error('Please select project submission deadline');
          setStatusUpdating(false);
          return;
        }

        const missingRecruiter = !activeRecruiterId;
        if (missingRecruiter) {
          message.error('Please select a recruiter');
          setStatusUpdating(false);
          return;
        }

        if (!selectedJobIds || selectedJobIds.length === 0) {
          setJobSelectionError('Please select at least one job');
          setStatusUpdating(false);
          return;
        }

        const missingDeadline = selectedJobIds.some((id) => !jobDeadlines[id]);
        if (missingDeadline) {
          setJobSelectionError(
            'Please add submission deadline for all selected jobs',
          );
          setStatusUpdating(false);
          return;
        }

        const missingCVs = selectedJobIds.some(
          (id) => !jobDeadlines[`${id}_cvs`],
        );
        if (missingCVs) {
          setJobSelectionError(
            'Please select CVs to be provided for all selected jobs',
          );
          setStatusUpdating(false);
          return;
        }

        const selectedJobs = selectedJobIds.map((id) => ({
          id,
          cv_submission_deadline: formatDeadlineWithOffset(jobDeadlines[id]),
          cvs_to_be_provided: jobDeadlines[`${id}_cvs`],
        }));

        payload = {
          ...payload,
          selected_jobs: selectedJobs,
          recruiter_id: activeRecruiterId,
          project_completion_deadline: formatDeadlineWithOffset(projectSubmissionDeadline),
        };
      }

      await updateProjectStatus(idToUse, payload);
      message.success('Project status updated successfully');

      if (onStatusChange) {
        onStatusChange(idToUse, newStatus);
      }

      // Refetch project information from API so status is guaranteed up to date
      const freshProjectInfo = await getProjectInformation(idToUse);
      if (freshProjectInfo) {
        queryClient.setQueryData(['projectInformation', idToUse], freshProjectInfo);
        queryClient.setQueryData(['projectInfo', idToUse], freshProjectInfo);
      }

      // Refetch related project queries so UI stays in sync
      invalidateProjectQueries(idToUse);
    } catch (error) {
      message.error(error?.message || 'Failed to update project status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const clientProjectCards = (
    <>
      <ClientDetailCard clientId={clientId} clientData={clientData} isProjectApprovalPending={isProjectApprovalPending} />

      <div className="lead-card responsive-lead-card detail-card">
        <div className="detail-card__header">
          <h3 className="detail-card__title">
            Project Information
          </h3>

           {/* Project Status Controls */}
           <div className="flex-row flex-wrap gap-8">
             {/* Edit button: allowed for admin or assigned user (including executives) */}
             {canShowEditButton && (
               <Button
                 icon={<EditOutlined size="1em" className="app-icon" />}
                 onClick={() => navigate(`/edit-project-headhunting/${finalProjectData?.id || projectId}`)}
                 className="btn-brand-outline"
                 size="small"
               >
                 Edit
               </Button>
             )}

             {/* Status control: editable for admin & sales_manager & assigned non-exec users; read-only for executives */}
             {canEditStatus ? (
               <Select
                 value={selectedStatus || 'Active'}
                 placeholder="Select Status"
                 className="select-fit-content"
                 popupMatchSelectWidth={false}
                 options={statusOptions}
                 loading={statusUpdating}
                 onChange={(value) => {
                   // For Active status:
                   // - If NO recruitment manager yet → show jobs/recruiter modal (first activation)
                   // - If recruitment manager already exists → simple confirmation (no jobs modal)
                   if (value === 'Active' && !hasRecruitmentManager) {
                     setPendingStatus(value);
                     setStatusModalVisible(true);
                  } else if (value === 'Active' && hasRecruitmentManager) {
                    // Active with recruitment manager - show confirmation modal
                    setPendingStatus(value);
                    setStatusModalVisible(true);
                   } else {
                    // Non-Active status changes - show confirmation modal
                    setPendingStatus(value);
                    setStatusModalVisible(true);
                   }
                 }}
               />
             ) : (
               <span
                 className="status-pill"
                 style={{
                   '--status-pill-fg':
                     projectStatusColors[
                       finalProjectData?.status ??
                       finalProjectData?.project_status ??
                       'Active'
                     ] || '#666',
                 }}
               >
                 {finalProjectData?.status ??
                   finalProjectData?.project_status ??
                   '-'}
               </span>
             )}
           </div>
        </div>

        <div className="detail-card__body--roomy">
          {/* 1. Project Name */}
           <div className="detail-card__row detail-card__row--wrap">
            <span className="detail-card__label">Project Name:</span>
            <span className="detail-card__value detail-card__value--strong">
              {finalProjectData?.project_name || finalProjectData?.job_title || 'N/A'}
            </span>
          </div>

          {/* 2–5. Financials - hidden for recruitment manager & recruitment executive */}
          {!isRecruitmentUser && !isProjectManagerUser && (
            <>
          {/* 2. Contract Sub total */}
           <div className="detail-card__row detail-card__row--wrap">
            <span className="detail-card__label">Contract Sub Total:</span>
            <span className="detail-card__value detail-card__value--strong">
  {formatPrice(
    finalProjectData?.contract_subtotal_amount,
    currencyShort
  )}
</span>
          </div>

          {/* 3. Discount Amount (Discount Percentage) */}
       <div className="detail-card__row">
  <span className="detail-card__label">Discount Amount (Discount %):</span>
  <span className="detail-card__value detail-card__value--strong">
    {formatPrice(finalProjectData?.discount_amount, currencyShort)}
    {finalProjectData?.discount_percentage != null &&
      ` (${finalProjectData.discount_percentage}%)`}
  </span>
</div>

          {/* 4. Contract Amount */}
          <div className="detail-card__row">
            <span className="detail-card__label">Contract Amount:</span>
           <span className="detail-card__value detail-card__value--strong">
  {formatPrice(
    finalProjectData?.contract_price,
    currencyShort
  )}
</span>
          </div>

          {/* 5. Pricing Type */}
          <div className="detail-card__row">
            <span className="detail-card__label">Pricing Type:</span>
            <span className="detail-card__value detail-card__value--strong">
              {finalProjectData?.pricing_type || '-'}
            </span>
          </div>
            </>
          )}

          {/* 6. Project Created */}
          <div className="detail-card__row">
            <span className="detail-card__label">Project Created:</span>
            <span className="detail-card__value">
              {finalProjectData?.project_created_at
                ? formatDateUniversal(finalProjectData.project_created_at, true)
                : finalProjectData?.created_at
                ? formatDateUniversal(finalProjectData.created_at, true)
                : '-'}
            </span>
          </div>

          {/* 6a. Project Submission Deadline */}
            <div className="detail-card__row">
            <span className="detail-card__label">Project completion Deadline:</span>
              <span className="detail-card__value">
              {finalProjectData?.project_completion_deadline
                ? formatDateUniversal(finalProjectData.project_completion_deadline, false)
                : '-'}
              </span>
            </div>

            <div className="detail-card__row">
            <span className="detail-card__label">Recruiter Name:</span>
            <span className="detail-card__value detail-card__value--strong">
              {finalProjectData?.recruiter_name || '-'}
            </span>
          </div>

            <div className="detail-card__row">
            <span className="detail-card__label">Recruiter manager Name:</span>
            <span className="detail-card__value detail-card__value--strong">
              {finalProjectData?.recruitment_manager_name || '-'}
            </span>
          </div>

          {/* RM Approval */}
          <div className="detail-card__row">
            <span className="detail-card__label">RM Approval:</span>
            <span className="project-detail-card__approval-group">
              <span className="project-detail-card__approval-value" style={{ '--approval-fg': approvalColors[finalProjectData?.recruitment_manager_approval] || '#3E6A9F' }}>
                {finalProjectData?.recruitment_manager_approval || 'Pending'}
              </span>
              {finalProjectData?.recruitment_manager_approval === 'Rejected' && (
                <Tooltip title={finalProjectData?.recruitment_manager_reason || 'No reason provided'}>
                  <InfoCircleOutlined size="1em" className={["app-icon", "inline-icon-info"].filter(Boolean).join(' ')} />
                </Tooltip>
              )}
            </span>
          </div>

          {/* Recruiter Approval */}
          <div className="detail-card__row">
            <span className="detail-card__label">Recruiter Approval:</span>
            <span className="project-detail-card__approval-group">
              <span className="project-detail-card__approval-value" style={{ '--approval-fg': approvalColors[finalProjectData?.recruiter_approval] || '#3E6A9F' }}>
                {finalProjectData?.recruiter_approval || 'Pending'}
              </span>
              {finalProjectData?.recruiter_approval === 'Rejected' && (
                <Tooltip title={finalProjectData?.recruiter_reason || 'No reason provided'}>
                  <InfoCircleOutlined size="1em" className={["app-icon", "inline-icon-info"].filter(Boolean).join(' ')} />
                </Tooltip>
              )}
            </span>
          </div>


          {/* 7. Sales person remarks (icon opens modal; read-only for recruitment team & project manager) */}
          <div className="detail-card__row">
  <span className="detail-card__label">Sales Person Remarks:</span>

  <CommentOutlined size="1em"
    className={["app-icon", "project-detail-card__remarks-icon"].filter(Boolean).join(' ')}
    style={{ '--remarks-icon-fg': finalProjectData?.remarks ? '#3E6A9F' : '#ccc' }}
    onClick={() => {
                 setRemarksValue(finalProjectData?.remarks || '');
      setRemarksModalVisible(true);
    }}
  />
</div>

        </div>
      </div>
    </>
  );

  return (
    <>
    {wrapInGrid ? (
      <div className="detail-card-grid">
        {clientProjectCards}
      </div>
    ) : (
      clientProjectCards
    )}

      {/* Status Change Confirmation Modal */}
      {statusModalVisible && !!pendingStatus && (
        <Modal
          title="Change Project Status"
          open={statusModalVisible}
          onCancel={() => {
            setStatusModalVisible(false);
            setPendingStatus(null);
          }}
          okText="Yes"
          cancelText="No"
          confirmLoading={statusUpdating}
          okButtonProps={{ className: 'btn-brand' }}
          centered
          onOk={async () => {
            if (!pendingStatus) return;
            await handleStatusChange(pendingStatus);
            setSelectedStatus(pendingStatus);
            setStatusModalVisible(false);
            setPendingStatus(null);
          }}
        >
          {/* Show ActivateProjectContent only for Active status without recruitment manager */}
          {pendingStatus === 'Active' && !hasRecruitmentManager ? (
            <>
              <HeadhuntingActivateProjectContent
                jobsList={jobsList}
                loadingJobsList={loadingJobsList}
                selectedJobIds={selectedJobIds}
                jobDeadlines={jobDeadlines}
                jobSelectionError={jobSelectionError}
                onToggleJob={(jobId, checked) => {
                  setJobSelectionError('');
                  if (checked) {
                    setSelectedJobIds((prev) => [...prev, jobId]);
                  } else {
                    setSelectedJobIds((prev) => prev.filter((id) => id !== jobId));
                    setDeadlineForJob(jobId, undefined);
                  }
                }}
                onDeadlineChange={(jobId, date) => setDeadlineForJob(jobId, date)}
                onCvsChange={(jobId, value) =>
                  setJobDeadlines((prev) => ({
                    ...prev,
                    [`${jobId}_cvs`]: value,
                  }))
                }
                recruiterOptions={recruiterOptions}
                assigningRecruiter={assigningRecruiter}
                recruiterId={activeRecruiterId}
                onRecruiterChange={(value) => setActiveRecruiterId(value)}
                projectSubmissionDeadline={projectSubmissionDeadline}
                onProjectSubmissionDeadlineChange={(date) => setProjectSubmissionDeadline(date)}
              />
              <p className="mt-16">
                Are you sure you want to update status to <strong>{pendingStatus}</strong>?
              </p>
            </>
          ) : (
            // Simple confirmation for non-Active status or Active with recruitment manager
            <p className="mt-0">
              Are you sure you want to update status to{" "}
              <strong>{pendingStatus}</strong>?
            </p>
          )}
        </Modal>
      )}

      <Modal
        title="Sales Person Remarks"
        open={remarksModalVisible}
        onCancel={() => setRemarksModalVisible(false)}
        footer={
    user?.user_type === "recruitment_manager" ||
    user?.user_type === "recruitment_executive" ||
    user?.user_type === "project_manager"
      ? null //
      : [
          <Button key="cancel" onClick={() => setRemarksModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={savingRemarks}
            className="btn-brand"
            onClick={async () => {
              if (!finalProjectData?.id && !projectId) {
                setRemarksModalVisible(false);
                return;
              }
              try {
                setSavingRemarks(true);
                const idToUse = finalProjectData?.id || projectId;
                const response = await updateProjectStatus(idToUse, { remarks: remarksValue || '' });
                message.success(response?.message);
                setRemarksModalVisible(false);
                invalidateProjectQueries(idToUse);
              } catch (error) {
                message.error(error?.message || 'Failed to update remarks');
              } finally {
                setSavingRemarks(false);
              }
            }}
          >
            Save
          </Button>
        ]}
        centered
      >
        <Input.TextArea
  rows={4}
  value={remarksValue}
  onChange={(e) => setRemarksValue(e.target.value)}
  readOnly={
    user?.user_type === "recruitment_manager" ||
    user?.user_type === "recruitment_executive" ||
    user?.user_type === "project_manager"
  }
/>
      </Modal>
  </>
  );
};

export default ProjectDetailCard;