import React, { Suspense } from 'react';
import { ShowRemarksLead } from './LazyModals.jsx';

const DEFAULT_CURRENCY = 'Pakistani Rupee (PKR)';

function buildLeadDataFromProposal(proposalData, clientData, clientName) {
  const jobs = proposalData.jobs || [];
  return {
    id: proposalData.id,
    proposal_id: proposalData.id,
    company_name: proposalData.company_name || clientName,
    contact_person_name: proposalData.contact_person_name || clientData?.contact_person_name || '',
    contact_person_designation: proposalData.contact_person_designation || clientData?.contact_person_designation || '',
    email: proposalData.email || clientData?.email || '',
    phone_number: proposalData.phone_number || clientData?.phone_number || '',
    contract_currency: proposalData.contract_currency || DEFAULT_CURRENCY,
    contract_subtotal_amount: proposalData.contract_subtotal_amount || '',
    discount_amount: proposalData.discount_amount || '',
    discount_percentage: proposalData.discount_percentage || '',
    contract_price: proposalData.contract_price || '',
    total_contract_amount: proposalData.contract_price || '',
    pricing_type: proposalData.pricing_type || '',
    proposal_date: proposalData.proposal_date || '',
    proposal_city: proposalData.proposal_city || '',
    replacement_guarantee_duration: proposalData.replacement_guarantee_duration || '',
    turnaround_time: proposalData.turnaround_time || '',
    mobilization_charges: proposalData.mobilization_charges ?? null,
    remarks: proposalData.remarks || '',
    jobs,
    available_jobs: jobs,
    selected_jobs: jobs.map((job) => job.id) || [],
    total_vacancies: jobs.reduce((sum, job) => sum + (job.number_of_vacancies || 0), 0) || 0,
    job_count: jobs.length || 0,
  };
}

function buildLeadDataFromProject(project, clientData, clientName) {
  return {
    id: project.id,
    proposal_id: project.id,
    company_name: clientName,
    contact_person_name: clientData?.contact_person_name || '',
    contact_person_designation: clientData?.contact_person_designation || '',
    email: clientData?.email || '',
    phone_number: clientData?.phone_number || '',
    contract_currency: project.contract_currency || DEFAULT_CURRENCY,
    contract_subtotal_amount: project.contract_subtotal_amount || project.contract_price || '',
    discount_amount: project.discount_amount || '',
    discount_percentage: project.discount_percentage || '',
    contract_price: project.contract_price || '',
    total_contract_amount: project.contract_price || '',
    pricing_type: project.pricing_type || '',
    total_vacancies: project.total_vacancies || '',
    job_count: project.job_count || '',
    remarks: project.remarks || '',
    selected_jobs: project.selected_jobs || [],
  };
}

function getLeadData(project, proposalData, clientData, clientName) {
  if (proposalData) {
    return buildLeadDataFromProposal(proposalData, clientData, clientName);
  }
  return buildLeadDataFromProject(project, clientData, clientName);
}

const ProposalUpdateModal = ({
  visible,
  loading,
  project,
  proposalData,
  clientData,
  clientName,
  onClose,
  onSave,
}) => {
  if (!project || loading) return null;

  const leadData = getLeadData(project, proposalData, clientData, clientName);

  return (
    <Suspense fallback={null}>
      <ShowRemarksLead
        visible={visible}
        onClose={onClose}
        lead={leadData}
        onSave={onSave}
        loading={loading}
        showContractFields={true}
        remarksRequired={true}
        proposalRequired={false}
        isProposalAttached={true}
        saveButtonText="Update Proposal"
        modalTitle="Update Proposal"
        remarksLabel="Remarks"
      />
    </Suspense>
  );
};

export default ProposalUpdateModal;
