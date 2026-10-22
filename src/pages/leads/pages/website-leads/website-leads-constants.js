export const STATUS_OPTIONS = [
  "Pending Contact",
  "Potential Client",
  "Company Profile Sent Through Whatsapp",
  "Company Profile Sent Through Email",
  "Company Profile Sent Through Email & Whatsapp",
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

export const toStatusKey = (status) =>
  status
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

export const statusColors = {
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
  "Unassigned": "#6B7C96",
};

export const STATUSES_REQUIRING_REMARKS = new Set([
  "SaaS Client",
  "Follow Up",
  "Opportunity Lost",
  "Not Ready to Pay",
  "Irrelevant Lead",
]);

// Project size options
export const PROJECT_SIZE_OPTIONS = [
  { label: 'Below 25k', value: 'Below 25k' },
  { label: '25k - 50k', value: '25k - 50k' },
  { label: '50k - 100k', value: '50k - 100k' },
  { label: 'Above 100k', value: 'Above 100k' }
];

// Old statuses configuration - using API keys from response
export const OLD_STATUSES = [
  { apiKey: 'active_client', label: 'Active Client' },
  { apiKey: 'completed', label: 'Completed' },
  { apiKey: 'terminated', label: 'Terminated' },
  { apiKey: 'contacted_but_no_response', label: 'Contacted But No Response' },
  { apiKey: 'company_profile_sent', label: 'Company Profile Sent' },
  { apiKey: 'not_interested', label: 'Not Interested' },
  { apiKey: 'phone_powered_off', label: 'Phone Powered Off' },
  { apiKey: 'converted_client', label: 'Converted Client' },
];
