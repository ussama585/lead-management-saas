import React, { useState } from 'react';
import { message, Spin, Input, Tooltip, Button } from 'antd';
import { Copy as CopyOutlined, LoaderCircle as LoadingOutlined, Pencil as EditOutlined } from 'lucide-react';
import { useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { getClientDetails } from '../pages/shared/services/client-service.js';
import useUserStore from '../pages/shared/store/user-store.js';
import { statusColors, statusOptions } from '../pages/clients/constants/client-constants.js';
import StatusSelect from '../pages/clients/components/StatusSelect.jsx';
import { useClientStatusMutation } from '../pages/clients/hooks/useClientMutations.js';
import ConfirmationModal from './confirmation-modal.component.jsx';
import CreateSaasClientModal from './create-saas-client-modal.component.jsx';
import '../assets/styles/legacy/lead-card-component.css';
import '../assets/styles/legacy/table-client-actions.css';
import '../assets/styles/legacy/common.css';
import '../assets/styles/legacy/client-detail-card.component.css';

const { TextArea } = Input;
const DEFAULT_STATUS_COLOR = '#8c8c8c';
const SAAS_CREATED_COLOR = '#52c41a';
const SAAS_NOT_CREATED_COLOR = '#ff4d4f';

const getClientStatusColor = (isClientCreate, status) => {
  if (isClientCreate === true) {
    return SAAS_CREATED_COLOR;
  }
  return statusColors[status] ?? DEFAULT_STATUS_COLOR;
};

const SaasStatusPill = ({ isCreated }) => (
  <span
    className="client-table-status-pill"
    style={{ '--status-pill-fg': isCreated ? SAAS_CREATED_COLOR : SAAS_NOT_CREATED_COLOR }}
  >
    {isCreated ? 'Created' : 'Not Created'}
  </span>
);

const ClientDetailCard = ({ clientId, clientData, isProjectApprovalPending = false }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const [statusModal, setStatusModal] = useState({ visible: false, client: null, oldStatus: '', newStatus: '', remarks: '' });
  const [saasModalOpen, setSaasModalOpen] = useState(false);

  const isRecruitmentManager = user?.user_type === 'recruitment_manager';
  const isRecruitmentExecutive = user?.user_type === 'recruitment_executive';

  // Fetch client details if clientId is provided
  const {
    data: clientDetails,
    isLoading: clientLoading,
    isFetching: clientFetching,
    error: clientError
  } = useQuery(
    ['clientDetails', clientId],
    () => getClientDetails(clientId),
    {
      enabled: !!clientId,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: 2,
      retryDelay: 1000,
    }
  );

  // Use passed clientData if available, otherwise use fetched clientDetails
  const finalClientData = clientData || clientDetails;

  // Get client ID for navigation (use prop first, then fallback to data)
  const clientIdForNavigation = clientId || finalClientData?.id;

  // Edit client profile (company, designation, etc.): admin, sales_manager, sales_executive. Status still restricted below.
  const canShowEditButton = !!user && (
    user.user_type === 'admin' ||
    user.user_type === 'sales_manager' ||
    user.user_type === 'sales_executive'
  );
  const canEditStatus =
    !!user && (user.user_type === 'admin' || user.user_type === 'sales_manager');

  const statusMutation = useClientStatusMutation(() => {
    setStatusModal({ visible: false, client: null, oldStatus: '', newStatus: '', remarks: '' });
    queryClient.invalidateQueries(['clientDetails', clientIdForNavigation]);
  });

  const handleStatusChange = (newStatus) => {
    if (newStatus === finalClientData?.status) return;
    setStatusModal({
      visible: true,
      client: finalClientData,
      oldStatus: finalClientData?.status || 'No Status',
      newStatus,
      remarks: '',
    });
  };

  const handleStatusConfirm = () => {
    if (!statusModal.client) return;
    const payload = { id: statusModal.client.id, status: statusModal.newStatus };
    if (statusModal.newStatus === 'Lost') payload.remarks = statusModal.remarks;
    statusMutation.mutate(payload);
  };

  const handleSaasClientSuccess = () => {};

  // Show loading spinner while fetching client details (only if query is enabled)
  const shouldShowLoading = !!clientId && (clientLoading || clientFetching);
  
  if (shouldShowLoading) {
    return (
      <div className="lead-card responsive-lead-card client-detail-card detail-card--centered">
        <Spin indicator={<LoadingOutlined size="1em" className={["app-icon app-icon-spin", "detail-card__spinner"].filter(Boolean).join(' ')}  />} />
      </div>
    );
  }

  // If query is enabled but no data and not loading, return null (but this should rarely happen)
  if (!!clientId && !finalClientData && !clientLoading) return null;

  // If clientData is passed as prop, use it even if query didn't run
  if (!finalClientData && !clientData && !clientId) return null;

  // Show error state if API call failed
  if (clientError && !clientData) {
    return (
      <div className="lead-card responsive-lead-card client-detail-card detail-card--error">
        <p className="detail-card__error-text">Failed to load client details</p>
      </div>
    );
  }

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(`${type} copied to clipboard`);
    } catch (error) {
      message.error(`Failed to copy ${type.toLowerCase()}`);
    }
  };

  const isSaasClientCreated = finalClientData?.is_client_create === true;
  const clientStatusColor = getClientStatusColor(
    finalClientData?.is_client_create,
    finalClientData?.status
  );

  return (
    <div className="lead-card responsive-lead-card client-detail-card">
      {/* Card Header */}
      <div className="detail-card__header">
        <h3 className="detail-card__title">
          Client Information
        </h3>

        {/* Edit client (profile): admin, sales_manager, sales_executive */}
        {canShowEditButton && clientIdForNavigation && (
          <Tooltip title="Edit client">
            <EditOutlined size="1em"
              className={["app-icon", "table-icon-action table-icon-action--edit"].filter(Boolean).join(' ')}
              onClick={() => navigate(`/edit-client-headhunting/${clientIdForNavigation}`)}
              aria-label="Edit client"
            />
          </Tooltip>
        )}
      </div>

      {/* Client Details */}
      <div className="detail-card__body">
        <div className="detail-card__row">
          <span className="detail-card__label">Client Name:</span>
          <span className="detail-card__value detail-card__value--strong">
            {finalClientData?.company_name || 'N/A'}
          </span>
        </div>

        <div className="detail-card__row">
          <span className="detail-card__label">Client Status:</span>
          {canEditStatus ? (
            isSaasClientCreated ? (
              <span
                className="client-saas-status-select-wrap"
                style={{ '--saas-status-color': clientStatusColor }}
              >
                <StatusSelect
                  className="table-client-status-select client-saas-status-select"
                  value={finalClientData?.status}
                  options={statusOptions}
                  onChange={handleStatusChange}
                />
              </span>
            ) : (
              <StatusSelect
                className="table-client-status-select"
                value={finalClientData?.status}
                options={statusOptions}
                onChange={handleStatusChange}
              />
            )
          ) : (
            <span
              className="client-table-status-pill"
              style={{ '--status-pill-fg': clientStatusColor }}
            >
              {finalClientData?.status || 'Unknown'}
            </span>
          )}
        </div>

        <div className="detail-card__row">
          <span className="detail-card__label">Client Email:</span>
          <div className="detail-card__value-group">
            <span className="detail-card__value">
              {finalClientData?.email || 'N/A'}
            </span>
            {finalClientData?.email && (
              <CopyOutlined size="1em"
                className={["app-icon", "table-icon-action table-icon-action--edit"].filter(Boolean).join(' ')}
                onClick={() => copyToClipboard(finalClientData.email, 'Email')}
                aria-label="Copy email"
              />
            )}
          </div>
        </div>

        {finalClientData?.phone_number && (
          <div className="detail-card__row">
            <span className="detail-card__label">Client Phone:</span>
            <div className="detail-card__value-group">
              <span className="detail-card__value">
                {finalClientData.phone_number}
              </span>
              <CopyOutlined size="1em"
                className={["app-icon", "table-icon-action table-icon-action--edit"].filter(Boolean).join(' ')}
                onClick={() => copyToClipboard(finalClientData.phone_number, 'Phone')}
                aria-label="Copy phone"
              />
            </div>
          </div>
        )}

        {finalClientData?.contact_person_name && (
          <div className="detail-card__row">
            <span className="detail-card__label">Contact Person:</span>
            <span className="detail-card__value">
              {finalClientData.contact_person_name}
            </span>
          </div>
        )}

        {finalClientData?.contact_person_designation && (
          <div className="detail-card__row">
            <span className="detail-card__label">Designation:</span>
            <span className="detail-card__value">
              {finalClientData.contact_person_designation}
            </span>
          </div>
        )}

        {finalClientData?.assigned_to_name && (
          <div className="detail-card__row">
            <span className="detail-card__label">Sales Person:</span>
            <span className="detail-card__value">
              {finalClientData.assigned_to_name}
            </span>
          </div>
        )}

        {finalClientData?.city && (
          <div className="detail-card__row">
            <span className="detail-card__label">City:</span>
            <span className="detail-card__value">
              {finalClientData.city}
            </span>
          </div>
        )}

        {finalClientData?.country && (
          <div className="detail-card__row">
            <span className="detail-card__label">Country:</span>
            <span className="detail-card__value">
              {finalClientData.country}
            </span>
          </div>
        )}

        {finalClientData?.industry && (
          <div className="detail-card__row">
            <span className="detail-card__label">Industry:</span>
            <span className="detail-card__value">
              {finalClientData.industry}
            </span>
          </div>
        )}

        {finalClientData?.created_at && (
          <div className="detail-card__row">
            <span className="detail-card__label">Client Created On:</span>
            <span className="detail-card__value">
              {new Date(finalClientData.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}

        <div className="detail-card__row detail-card__row--divider">
            <span className="detail-card__label">Job Portal Client:</span>
            {!isSaasClientCreated && (isRecruitmentManager || isRecruitmentExecutive) && finalClientData?.status === 'Active' ? (
              <Tooltip
                title={
                  isProjectApprovalPending
                    ? 'This project must be approved by both the Recruitment Manager and Recruiter before the Job Portal client can be created.'
                    : ''
                }
              >
                <Button
                  type="primary"
                  disabled={isProjectApprovalPending}
                  onClick={() => setSaasModalOpen(true)}
                  className="client-detail-card__portal-button"
                  style={{ '--portal-button-bg': isProjectApprovalPending ? '#3E6A9F99' : '#3E6A9F' }}
                >
                  Create Job Portal Client
                </Button>
              </Tooltip>
            ) : (
              <SaasStatusPill isCreated={isSaasClientCreated} />
            )}
          </div>
      </div>

      <ConfirmationModal
        showModal={statusModal.visible}
        setShowModal={(visible) => setStatusModal((prev) => ({ ...prev, visible }))}
        oldStatus={statusModal.oldStatus}
        newStatus={statusModal.newStatus}
        details={statusModal.client ? {
          'Company Name': statusModal.client.company_name,
          'Email': statusModal.client.email,
          'Phone': statusModal.client.phone_number,
        } : null}
        message={statusModal.newStatus === 'Lost' ? (
          <div className="client-detail-card__remarks-wrap">
            <span className="client-detail-card__remarks-label">Remarks (optional)</span>
            <TextArea
              value={statusModal.remarks}
              onChange={(e) => setStatusModal((prev) => ({ ...prev, remarks: e.target.value }))}
              rows={3}
              placeholder="Reason for lost"
            />
          </div>
        ) : null}
        onConfirm={handleStatusConfirm}
        isLoading={statusMutation.isLoading}
      />

      <CreateSaasClientModal
        open={saasModalOpen}
        clientId={clientIdForNavigation}
        onClose={() => setSaasModalOpen(false)}
        onSuccess={handleSaasClientSuccess}
      />
    </div>
  );
};

export default ClientDetailCard;
