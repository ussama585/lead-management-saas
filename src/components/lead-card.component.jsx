import React, { useEffect, useState, useMemo } from "react";
import '../assets/styles/legacy/lead-card-component.css';
import '../assets/styles/legacy/common.css';
import { Copy as CopyOutlined, LoaderCircle as LoadingOutlined, Upload as UploadOutlined } from 'lucide-react';
import { Select, message, Switch } from 'antd';

import LeadEditModal from './LeadEditModal.jsx';
import formatDate from "../pages/shared/utils/formatDate.js";
import { formatDateTime } from "../pages/shared/utils/formatDate.js";
import api from "../pages/shared/services/api.js";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { getManangersExecutives, getAssigningUsersListing } from "../pages/shared/services/users-service.js";
import useUserStore from "../pages/shared/store/user-store.js";
import ConfirmationModal from "./confirmation-modal.component.jsx";
import { assignClient } from "../pages/shared/services/users-service.js";
import { updateLeadAcceptingResponse, updateLeadById } from '../pages/shared/services/manager-service.js';
import { updateDataLeadStatus, getDataLeadJobs, getDataLead } from '../pages/shared/services/data-leads-service.js';
import { reassignMetaLead, updateMetaLead } from '../pages/shared/services/metaLeads.js';
import { getConversionToPotential } from '../pages/shared/services/leads.js';
import formatDateUniversal from '../pages/shared/utils/formatDate.js';
import ShowRemarksLead from './show-remarks-lead.jsx';

const STATUS_OPTIONS = [
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
];

const statusColors = {
  "Pending Contact": "#4DA6FF",
  "Potential Client": "#52c41a",
  "Company Profile Sent Whatsapp": "#52c41a",
  "Company Profile Sent Email": "#52c41a",
  "Company Profile Sent Email & Whatsapp": "#52c41a",
  "SaaS Client": "#13c2c2",
  "Follow Up": "#A38858",
  "Job Seeker": "#FF0000",
  "Opportunity Lost": "#FF0000",
  "Not Ready to Pay": "#FF0000",
  "Contacted But No Response - Company Profile Sent Through Whatsapp": "#FFD700",
  "Contacted But No Response - Company Profile Sent Through Email": "#FFD700",
  "Contacted But No Response - Company Profile Sent Through Email & Whatsapp": "#FFD700",
  "Phone Powered Off - Company Profile Sent Through Whatsapp": "#FFD700",
  "Phone Powered Off - Company Profile Sent Through Email": "#FFD700",
  "Phone Powered Off - Company Profile Sent Through Email & Whatsapp": "#FFD700",
  "Incorrect Phone Number": "#FF0000",
  "Duplicate Lead": "#6889D3",
  "Irrelevant Lead": "#FF0000",
};

function getUserTypeLabel(userType) {
  if (userType === 'sales_manager') return 'Sales Manager';
  if (userType === 'sales_executive') return 'Sales Executive';
  return userType ? userType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
}

const STATUSES_REQUIRING_REMARKS = new Set([
  "SaaS Client",
  "Follow Up",
  "Opportunity Lost",
  "Not Ready to Pay",
  "Irrelevant Lead",
]);

const isLeadReadOnly = (lead) =>

  lead?.converted_to_client === true;

const LeadCard = ({ lead, leadType = 'Lead Generated', refetchLeadDetail }) => {
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState(lead?.status);
  const [assignedTo, setAssignedTo] = useState(lead?.assigned_to);
  const [pendingAssignee, setPendingAssignee] = useState(null);
  const [isAcceptingResponse, setIsAcceptingResponse] = useState(lead?.is_accepting_response);
  const [remarksModal, setRemarksModal] = useState({ visible: false, lead: null, forStatusChange: false, newStatus: null });
  const [remarksLoading, setRemarksLoading] = useState(false);
  const [proposalFile, setProposalFile] = useState(null);
  const [jobsList, setJobsList] = useState([]);
  const [jobsLeadId, setJobsLeadId] = useState(null);
  const [editModalFreshLead, setEditModalFreshLead] = useState(null);

  const { user } = useUserStore();
  // Allow admins, sales managers, and the person assigned to the lead to edit
  const isConvertedToClient = isLeadReadOnly(lead);
  const canEdit = !isConvertedToClient && (user?.user_type === 'admin' || user?.user_type === 'sales_manager' || user?.id === lead?.assigned_to);
  const { Option } = Select;
  const queryClient = useQueryClient();

  const isDataLead = leadType === 'Data Lead';
  const isMetaLead = leadType === 'Meta Lead';

  // Fetch jobs for the selected lead when modal opens
  const { isLoading: loadingJobs, data: jobsData, refetch: refetchJobs } = useQuery(
    jobsLeadId ? [`leadjobs-${jobsLeadId}`, leadType] : [],
    async () => {
      if (!jobsLeadId) return [];
      if (isDataLead) {
        const data = await getDataLeadJobs(jobsLeadId, {});
        return data?.results ?? [];
      }
      const res = await api.get(`/lead-generation/jobs/${jobsLeadId}`);
      return res.data?.results || [];
    },
    { enabled: !!jobsLeadId }
  );

  // Sync local state when lead prop updates (e.g. after edit modal refetch)
  useEffect(() => {
    if (lead) {
      setStatus(lead.status);
      setIsAcceptingResponse(lead.is_accepting_response ?? false);
         }
  }, [lead]);

  // When opening remarks modal for a lead, set jobsLeadId and fetch jobs
  useEffect(() => {
    if (remarksModal.visible && remarksModal.lead?.id) {
      setJobsLeadId(remarksModal.lead.id);
      refetchJobs && refetchJobs();
    }
  }, [remarksModal.visible, remarksModal.lead, refetchJobs]);

  useEffect(() => {
    if (jobsData) setJobsList(jobsData);
  }, [jobsData]);

  // Status update mutation (modified to use remarks modal)
  const sendUpdate = (payload) => {
    const selectedJobIdsString = payload.selected_job_ids && Array.isArray(payload.selected_job_ids)
      ? payload.selected_job_ids.join(',')
      : '';
    const requestData = {
      status: payload.status,
      remarks: payload.remarks,
      selected_job_ids: selectedJobIdsString,
      total_vacancies: payload.total_vacancies,
    };
    if (isDataLead) {
      return updateDataLeadStatus(payload.id, requestData);
    }
    return api.patch(`/lead-generation/update/${payload.id}`, requestData);
  };

  const updateStatusMutation = useMutation(sendUpdate, {
    onSuccess: () => {
      message.success("Status updated successfully");
      if (isDataLead) {
        queryClient.invalidateQueries(['dataLeadJobs', lead.id]);
        queryClient.invalidateQueries(['dataLeadDetail', lead.id]);
      } else {
        queryClient.invalidateQueries(`lead-${lead.id}`);
      }
      setRemarksModal({ visible: false, lead: null, forStatusChange: false, newStatus: null });
    },
    onError: () => {
      message.error("Failed to update status");
      setRemarksModal({ visible: false, lead: null, forStatusChange: false, newStatus: null });
    },
  });

  // Assignee update mutation
  const sendAssigneeUpdate = (assignedToId) => {
    if (isDataLead) {
      return api.patch(`data-leads/details/${lead.id}`, { assigned_to: assignedToId });
    }
    if (isMetaLead) {
      return reassignMetaLead(lead.id, assignedToId);
    }
    return assignClient(lead.id, assignedToId);
  };
  const updateAssigneeMutation = useMutation(sendAssigneeUpdate, {
    onSuccess: (response) => {
      setPendingAssignee(null);
      setShowModal(false);
      message.success("Assignee updated successfully");
      if (isDataLead) {
        queryClient.invalidateQueries(['dataLeadJobs', lead.id]);
        queryClient.invalidateQueries(['dataLeadDetail', lead.id]);
      } else if (isMetaLead) {
        queryClient.invalidateQueries(['metaLeadDetail', lead.id]);
        queryClient.invalidateQueries(`metaLeadJobs-${lead.id}`);
      } else {
        queryClient.invalidateQueries(`lead-${lead.id}`);
      }
    },
    onError: (error) => {
      message.error("Failed to update assignee")
      console.error("Assignee update failed:", error);
    },
  });

  // Accepting Response mutation
  const acceptingResponseMutation = useMutation(
    (checked) => {
      if (isDataLead) {
        return api.patch(`data-leads/details/${lead.id}`, { is_accepting_response: checked });
      }
      return updateLeadAcceptingResponse(lead.id, checked);
    },
    {
      onSuccess: () => {
        message.success('Accepting Response updated');
        if (isDataLead) {
          queryClient.invalidateQueries(['dataLeadJobs', lead.id]);
          queryClient.invalidateQueries(['dataLeadDetail', lead.id]);
        } else {
          queryClient.invalidateQueries(`lead-${lead.id}`);
        }
      },
      onError: () => {
        message.error('Failed to update Accepting Response');
      },
    }
  );

  // Fetch executives or managers/executives based on user type (do not call for sales_executive)
  const { data } = useQuery({
    queryKey: ['executiveList', user?.user_type],
    queryFn: () => user?.user_type === 'admin'
        ? getManangersExecutives()
        : getAssigningUsersListing('sales_executive'),
    enabled: user?.user_type !== 'sales_executive',
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const executivesList = useMemo(() => {
    if (user?.user_type === 'admin') {
      // For admin, data from getManangersExecutives() is directly the array
      const allUsers = data || []; // Data is directly the array
      return Array.isArray(allUsers) ? allUsers : [];
    }
    
    // For sales manager, include themselves in the list along with executives
    if (user?.user_type === 'sales_manager') {
      const executives = Array.isArray(data) ? data : [];
      const currentManager = {
        id: user.id,
        name: user.name,
        user_type: user.user_type
      };
      
      // Check if current manager is already in the list to avoid duplicates
      const isManagerAlreadyInList = executives.some(exec => exec.id === user.id);
      
      if (isManagerAlreadyInList) {
        return executives;
      } else {
        return [currentManager, ...executives];
      }
    }
    
    // For sales executive, data from getAssigningUsersListing is directly the array
    return Array.isArray(data) ? data : [];
  }, [data, user?.user_type, user?.id, user?.name]);

  useEffect(() => {
    if (lead?.status) setStatus(lead.status);
    if (typeof lead?.is_accepting_response === 'boolean') setIsAcceptingResponse(lead.is_accepting_response);
  }, [lead]);

  // assigned_to can be numeric id (data/website) or email string (meta/website); website API may send assigned_to_id only
  const assignedToId = (() => {
    const raw = lead?.assigned_to;
    if (raw != null) {
      return typeof raw === 'object' && raw !== null ? raw.id : raw;
    }
    return lead?.assigned_to_id ?? null;
  })();

  useEffect(() => {
    if (assignedToId == null || assignedToId === '') {
      setAssignedTo(null);
      return;
    }
    const exec = executivesList.find((e) => {
      const eId = e.id;
      const eEmail = e.email;
      return String(eId) === String(assignedToId) || (eEmail && eEmail === assignedToId);
    });
    if (exec) {
      setAssignedTo(exec);
    } else {
      // Assignee not in list (e.g. email from meta/website API); show name from lead.assigned_to_name
      setAssignedTo({
        id: assignedToId,
        name: lead?.assigned_to_name || 'Unknown',
        user_type: lead?.assigned_to_type ?? null,
      });
    }
  }, [assignedToId, lead?.assigned_to_name, lead?.assigned_to_type, executivesList]);

  // When user selects a new assignee
  const handleAssigneeChange = (newAssignee) => {
    setPendingAssignee(newAssignee);
    setShowModal(true);
  };

  // In ConfirmationModal's onConfirm
  const handleConfirm = () => {
    updateAssigneeMutation.mutate(pendingAssignee.id);
    setShowModal(false);
  };

  // Handle status change with remarks modal
  const handleStatusChange = async (value) => {
    // Prevent changing status if already Potential Client
    if (lead?.status === 'Potential Client') {
      message.error('Cannot change status of Potential Client');
      return;
    }

    // If converting to Potential Client, verify via API that jobs exist
    let conversionData = null;
    if (value === 'Potential Client') {
      try {
        const jobs = isDataLead
          ? (await getDataLeadJobs(lead.id, {})).results ?? []
          : (await api.get(`/lead-generation/jobs/${lead.id}`)).data?.results || [];
        if (!Array.isArray(jobs) || jobs.length === 0) {
          message.error('At least 1 job must be present to convert lead to Potential Client');
          return;
        }
        setJobsList(jobs);
        setJobsLeadId(lead.id);
      } catch (err) {
        message.error('Failed to verify jobs for this lead');
        return;
      }

      const leadTypeParam = isMetaLead ? 'meta-leads' : isDataLead ? 'data-leads' : undefined;
      try {
        conversionData = await getConversionToPotential(lead.id, leadTypeParam);
      } catch (err) {
        // 404 just means no conversion draft exists yet - that's fine for a new conversion
        conversionData = null;
      }
    }

    // Open remarks modal for status change
    setRemarksModal({
      visible: true,
      lead: { ...lead, conversionData, proposalData: conversionData },
      forStatusChange: true,
      newStatus: value
    });
  };

  // Handle remarks save
  const handleRemarksSave = async (remarks, contractData = {}) => {
    const trimmedRemarks = typeof remarks === 'string' ? remarks.trim() : '';
    const includeRemarks = Boolean(trimmedRemarks);
    
    setRemarksLoading(true);
    try {
      if (remarksModal.forStatusChange) {
        const payload = {
          id: remarksModal.lead.id,
          status: remarksModal.newStatus,
          proposal: proposalFile,
          contract_currency: contractData.contract_currency,
          contract_price: contractData.contract_price,
          total_vacancies: contractData.total_vacancies ?? remarksModal.lead.total_vacancies,
          selected_job_ids: contractData.selected_job_ids || []
        };
        if (includeRemarks) {
          payload.remarks = trimmedRemarks;
        }
        
        if (remarksModal.newStatus === 'Potential Client') {
          if (isDataLead) {
            const formData = new FormData();
            const appendIfDefined = (key, value) => {
              if (value === undefined || value === null) return;
              if (typeof value === 'string' && value.trim() === '') return;
              formData.append(key, value);
            };
            appendIfDefined('status', payload.status);
            appendIfDefined('remarks', payload.remarks);
            if (payload.proposal) formData.append('proposal', payload.proposal);
            appendIfDefined('contract_currency', payload.contract_currency);
            appendIfDefined('contract_price', payload.contract_price);
            appendIfDefined('total_vacancies', payload.total_vacancies);
            if (payload.selected_job_ids?.length) formData.append('selected_job_ids', payload.selected_job_ids.join(','));
            const response = await api.patch(`data-leads/details/${remarksModal.lead.id}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            setProposalFile(null);
            message.success(response?.data?.message || 'Proposal uploaded and status updated successfully');
            setRemarksModal({ visible: false, lead: null, forStatusChange: false, newStatus: null });
            setStatus(remarksModal.newStatus);
            queryClient.invalidateQueries(['dataLeadJobs', lead.id]);
            queryClient.invalidateQueries(['dataLeadDetail', lead.id]);
          } else {
            const response = await updateLeadById(remarksModal.lead.id, payload);
            setProposalFile(null);
            message.success(response?.message || 'Proposal uploaded and status updated successfully');
            setRemarksModal({ visible: false, lead: null, forStatusChange: false, newStatus: null });
            setStatus(remarksModal.newStatus);
            queryClient.invalidateQueries(`lead-${lead.id}`);
          }
        } else {
          await new Promise((resolve, reject) => {
            updateStatusMutation.mutate(
              payload,
              { onSuccess: resolve, onError: reject }
            );
          });
          setStatus(remarksModal.newStatus); // Update local status
        }
      } else {
        const payload = {
              id: remarksModal.lead.id,
              status: remarksModal.lead.status,
              total_vacancies: contractData.total_vacancies ?? remarksModal.lead.total_vacancies,
              selected_job_ids: contractData.selected_job_ids || []
        };
        if (includeRemarks) {
          payload.remarks = trimmedRemarks;
        }

        await new Promise((resolve, reject) => {
          updateStatusMutation.mutate(payload, { onSuccess: resolve, onError: reject });
        });
      }
    } catch (error) {
      if (error?.errors?.remarks && Array.isArray(error.errors.remarks) && error.errors.remarks.length > 0) {
        message.error(error.errors.remarks[0]);
      } else if (error?.message) {
        message.error(error.message);
      } else {
        message.error('Failed to update lead');
      }
    } finally {
      setRemarksLoading(false);
    }
  };

  const isAssignedToCurrentUser = user?.id === lead?.assigned_to;
  
  // Check if lead is assigned to any of the manager's executives
  const isAssignedToExecutive = useMemo(() => {
    if (user?.user_type === 'sales_manager') {
      // Check if lead is assigned to any executive in the executivesList
      return executivesList.some(exec => exec.id === lead?.assigned_to && exec.user_type === 'sales_executive');
    }
    return false;
  }, [user?.user_type, executivesList, lead?.assigned_to]);

  // Status is editable if converted_to_client is false, otherwise not editable
  // When editable, check user permissions
  const canEditStatus = useMemo(() => {
    // If lead is converted to client, no one can edit status
    if (isConvertedToClient) {
      return false;
    }

    // Admin can always edit
    if (user?.user_type === 'admin') {
      return true;
    }

    // Sales managers can edit their own leads and their executives' leads
    if (user?.user_type === 'sales_manager') {
      return isAssignedToCurrentUser || isAssignedToExecutive;
    }

    // Sales executives can edit their own leads
    if (user?.user_type === 'sales_executive') {
      return isAssignedToCurrentUser;
    }

    return false;
  }, [user?.user_type, isAssignedToCurrentUser, isAssignedToExecutive, isConvertedToClient]);

  return (
    <div className="lead-card responsive-lead-card">
      {/* Header Section */}
      <div className="basic-info responsive-basic-info lead-card__basic-info">
        <div className="lead-info responsive-lead-info">
          <div className="avatar responsive-avatar">{lead?.contact_person_name?.charAt(0) || '-'}</div>
          <span className="responsive-lead-name-company">
            <div className="lead-card__name-row">
              <h2 className="lead-card__name-heading">{lead?.contact_person_name || '-'}</h2>
            </div>
            <p className="lead-card__company-name">
              {lead?.company_name || '-'}
            </p>
          </span>
        </div>

        <div className="lead-card__header-actions">
          {canEdit && (
            <LeadEditModal
              lead={lead}
              leadType={leadType}
              user={user}
              trigger="button"
              onBeforeOpen={
                isDataLead && lead?.id
                  ? async () => {
                      const raw = await queryClient.fetchQuery(
                        ['dataLeadDetail', lead.id],
                        () => getDataLead(lead.id)
                      );
                      if (raw) {
                        setEditModalFreshLead({ ...raw, id: raw.id ?? lead.id });
                      }
                    }
                  : undefined
              }
              freshLead={editModalFreshLead}
              onClose={() => setEditModalFreshLead(null)}
              onSubmit={(values) => {
                if (isDataLead) {
                  const dataLeadPayload = {
                    contact_person_name: values.contact_person_name,
                    company_name: values.company_name,
                    phone_number: values.phone_number,
                    contact_person_designation: values.contact_person_designation ?? '',
                    email: values.email,
                  };
                  return updateDataLeadStatus(lead.id, dataLeadPayload);
                }
                if (isMetaLead) {
                  const metaPayload = {
                    full_name: values.contact_person_name,
                    company_name: values.company_name,
                    phone_number: values.phone_number,
                    work_email: values.email,
                    job_title: values.contact_person_designation ?? '',
                  };
                  return updateMetaLead(metaPayload, lead.id);
                }
                return api.patch(`/lead-generation/update/${lead.id}`, values);
              }}
              onSuccess={async () => {
                if (isDataLead) {
                  queryClient.invalidateQueries(['dataLeadJobs', lead.id]);
                  queryClient.invalidateQueries(['dataLeads']);
                  queryClient.invalidateQueries(['dataLeadDetail', lead.id]);
                  if (typeof refetchLeadDetail === 'function') {
                    await refetchLeadDetail();
                  } else {
                    await queryClient.refetchQueries(['dataLeadDetail', lead.id]);
                  }
                  return;
                }
                if (isMetaLead) {
                  queryClient.invalidateQueries(['metaLeads']);
                  queryClient.invalidateQueries(['metaLead', lead.id]);
                  queryClient.invalidateQueries(['metaLeadDetail', lead.id]);
                  if (typeof refetchLeadDetail === 'function') {
                    await refetchLeadDetail();
                  } else {
                    await queryClient.refetchQueries(['metaLeadDetail', lead.id]);
                  }
                  return;
                }
                if (!isDataLead && !isMetaLead) {
                  queryClient.invalidateQueries(`lead-${lead.id}`);
                  await queryClient.refetchQueries(`lead-${lead.id}`);
                }
              }}
              buttonProps={{
                size: "large",
                className: "lead-card__edit-button",
              }}
            />
          )}
          {canEditStatus ? (
            <Select
              value={status || "Select Status"}
              onChange={handleStatusChange}
              placeholder="Select Status"
              className="select-fit-content"
              popupMatchSelectWidth={false}
              options={STATUS_OPTIONS.map((option) => ({
                label: option,
                value: option,
              }))}
            />
          ) : (
            <span
              className="lead-card__status-pill"
              style={{ '--status-pill-fg': statusColors[status] || '#666' }}
            >
              {status || 'No Status'}
            </span>
          )}
        </div>
      </div>

      {/* Details Section: Two Columns */}
      <div className="lead-detail responsive-lead-detail lead-card__detail-row">
        {/* Left Column: Contact Info */}
        <div className="div-1 responsive-div-1 lead-card__contact-info">
          <div className="lead-card__contact-line">
            <span>promo code:{lead?.promo_code ?? '-'}</span>
            <CopyOutlined size="1em"
              
              className={["app-icon", "lead-card__copy-icon"].filter(Boolean).join(' ')}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(lead?.promo_code || "");
                  message.success("Promo code copied to clipboard");
                } catch (error) {
                  message.error("Failed to copy promo code");
                }
              }} style={{ rotate: (180) + 'deg' }}
            />
          </div>
          <div className="lead-card__contact-line">
            <span>{lead?.phone_number ?? '-'}</span>
            <CopyOutlined size="1em"
              
              className={["app-icon", "lead-card__copy-icon"].filter(Boolean).join(' ')}
              onClick={() => {
                navigator.clipboard.writeText(lead?.phone_number);
                message.success('Number copied to clipboard');
              }} style={{ rotate: (180) + 'deg' }}
            />
          </div>
          <div className="lead-card__designation">{lead?.contact_person_designation ?? '-'}</div>
          <div className="lead-card__contact-line">
            <span>{lead?.email ?? '-'}</span>
            <CopyOutlined size="1em"
              
              className={["app-icon", "lead-card__copy-icon"].filter(Boolean).join(' ')}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(lead?.email || "");
                  message.success("Email copied to clipboard");
                } catch (error) {
                  message.error("Failed to copy email");
                }
              }} style={{ rotate: (180) + 'deg' }}
            />
          </div>
          {/* Accepting Response Toggle + Copy Client Response URL (commented out)
          <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0 0 0', gap: 8 }}>
            <span style={{ color: '#3E6A9F', fontWeight: 500 }}>Accepting Response</span>
            <Switch
              checked={isAcceptingResponse}
              loading={acceptingResponseMutation.isLoading}
              onChange={(checked) => acceptingResponseMutation.mutate(checked)}
              checkedChildren="Yes"
              unCheckedChildren="No"
              style={{
                backgroundColor: isAcceptingResponse ? '#3E6A9F' : '#d9d9d9',
                borderColor: isAcceptingResponse ? '#3E6A9F' : '#d9d9d9',
              }}
              trackStyle={{ backgroundColor: '#3E6A9F' }}
              handleStyle={isAcceptingResponse ? { background: '#fdc800', borderColor: '#fdc800' } : {}}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#3E6A9F', fontWeight: 500 }}>Client Response URL</span>
            <span style={{ color: '#3E6A9F', fontWeight: 400, wordBreak: 'break-all' }}>https://www.searchopal.com/lead-generation/{lead?.identifier}</span>
            <CopyOutlined
              style={{ cursor: 'pointer' }}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(`https://www.searchopal.com/lead-generation/${lead?.identifier}`);
                  message.success('Client Response URL copied');
                } catch (error) {
                  message.error('Failed to copy URL');
                }
              }}
            />
          </div>
          */}

        </div>
        {/* Right Column: Meta Info & Assignment */}
        <div className="div-2 responsive-div-2 lead-card__meta-info">
          <div className="lead-card__meta-line">{leadType}</div>
          <div className="lead-card__meta-line">{lead?.created_at ? formatDateUniversal(lead.created_at, true) : '-'}</div>
          <div className="lead-card__assigned-label">Assigned To</div>
          <div className="responsive-assigned-select lead-card__assigned-select-wrap">
            {(user?.user_type === 'sales_manager' || user?.user_type === 'admin') ?
              <Select
                value={assignedTo?.id || undefined}
                placeholder={'Not Assigned'}
                onChange={(selectedId) => {
                  const exec = executivesList.find(e => e.id === selectedId) ?? assignedTo;
                  if (exec) handleAssigneeChange(exec);
                }}
                popupMatchSelectWidth={false}
                className="lead-card__assigned-select-wrap"
                disabled={isConvertedToClient}
                optionLabelProp="label"
              >
                {/* Include current assignee in options if not in executivesList (so dropdown shows assigned_to_name) */}
                {[
                  ...(assignedTo && !executivesList.some(e => String(e.id) === String(assignedTo.id) || (e.email && e.email === assignedTo.id)) ? [assignedTo] : []),
                  ...executivesList,
                ].map((executive) => (
                  <Option key={String(executive.id)} value={executive.id} label={executive?.name}>
                    {executive?.name} - {executive?.user_type === 'sales_manager' ? 'Manager' : 'Executive'}
                  </Option>
                ))}
              </Select>
            :
              <div
                className="grey lead-card__assigned-readonly"
              >
                {assignedTo?.user_type === 'sales_executive'
                  ? 'Sales Executive'
                  : assignedTo?.user_type === 'sales_manager'
                    ? 'Sales Manager'
                    : assignedTo?.name || user?.name}
              </div>
            }
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        showModal={showModal}
        setShowModal={setShowModal}
        mutation={updateAssigneeMutation}
        value={pendingAssignee?.id}
        message={`Are you sure you want to assign this lead to ${pendingAssignee?.name} (${getUserTypeLabel(pendingAssignee?.user_type)}) ?`}
        onConfirm={handleConfirm}
      />

      {/* Remarks Modal */}
      <ShowRemarksLead
        visible={remarksModal.visible}
        onClose={() => { 
          setRemarksModal({ visible: false, lead: null, forStatusChange: false, newStatus: null }); 
          setProposalFile(null); 
        }}
        lead={remarksModal.lead}
        onSave={handleRemarksSave}
        loading={remarksLoading || updateStatusMutation.isLoading}
        showContractFields={remarksModal.forStatusChange && remarksModal.newStatus === 'Potential Client'}
        proposalRequired={remarksModal.forStatusChange && remarksModal.newStatus === 'Potential Client'}
        isProposalAttached={!!proposalFile}
        remarksRequired={
          remarksModal.forStatusChange &&
          STATUSES_REQUIRING_REMARKS.has(remarksModal.newStatus)
        }
        saveButtonText={remarksModal.forStatusChange && remarksModal.newStatus === 'Potential Client' ? 'Convert' : 'Update'}
        extra={remarksModal.forStatusChange && remarksModal.newStatus === 'Potential Client' ? (
          <label className="lead-card__proposal-label">
            <UploadOutlined size="1em" className="app-icon" />
            <span>Attach Proposal PDF</span>
            <input
              type="file"
              accept="application/pdf"
              className="lead-card__proposal-file-input"
              onChange={e => setProposalFile(e.target.files[0])}
            />
            {proposalFile && <span className="lead-card__proposal-file-name">{proposalFile.name}</span>}
          </label>
        ) : null}
        jobsList={jobsList}
        loadingJobsList={loadingJobs}
      />
    </div>
  );
};

export default LeadCard;
