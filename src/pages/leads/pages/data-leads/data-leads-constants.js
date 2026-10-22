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

export const STATUS_API_KEYS = {
  "Pending Contact": "pending_contact",
  "Potential Client": "potential_client",
  "Company Profile Sent Through Whatsapp": "company_profile_sent_through_whatsapp",
  "Company Profile Sent Through Email": "company_profile_sent_through_email",
  "Company Profile Sent Through Email & Whatsapp":
    "company_profile_sent_through_email_whatsapp",
  "SaaS Client": "saas_client",
  "Follow Up": "follow_up",
  "Job Seeker": "job_seeker",
  "Opportunity Lost": "opportunity_lost",
  "Not Ready to Pay": "not_ready_to_pay",
  "Contacted But No Response - Company Profile Sent Through Whatsapp":
    "contacted_but_no_response_company_profile_sent_through_whatsapp",
  "Contacted But No Response - Company Profile Sent Through Email":
    "contacted_but_no_response_company_profile_sent_through_email",
  "Contacted But No Response - Company Profile Sent Through Email & Whatsapp":
    "contacted_but_no_response_company_profile_sent_through_email_whatsapp",
  "Phone Powered Off - Company Profile Sent Through Whatsapp":
    "phone_powered_off_company_profile_sent_through_whatsapp",
  "Phone Powered Off - Company Profile Sent Through Email":
    "phone_powered_off_company_profile_sent_through_email",
  "Phone Powered Off - Company Profile Sent Through Email & Whatsapp":
    "phone_powered_off_company_profile_sent_through_email_whatsapp",
  "Incorrect Phone Number": "incorrect_phone_number",
  "Duplicate Lead": "duplicate_lead",
  "Irrelevant Lead": "irrelevant_lead",
  Other: "other",
  Unassigned: "unassigned",
};

export const STATUS_COLORS = {
  "Pending Contact": "info",
  "Potential Client": "success",
  "Company Profile Sent Through Whatsapp": "success",
  "Company Profile Sent Through Email": "success",
  "Company Profile Sent Through Email & Whatsapp": "success",
  "SaaS Client": "primary",
  "Follow Up": "warning",
  "Job Seeker": "error",
  "Opportunity Lost": "error",
  "Not Ready to Pay": "error",
  "Contacted But No Response - Company Profile Sent Through Whatsapp": "warning",
  "Contacted But No Response - Company Profile Sent Through Email": "warning",
  "Contacted But No Response - Company Profile Sent Through Email & Whatsapp":
    "warning",
  "Phone Powered Off - Company Profile Sent Through Whatsapp": "warning",
  "Phone Powered Off - Company Profile Sent Through Email": "warning",
  "Phone Powered Off - Company Profile Sent Through Email & Whatsapp":
    "warning",
  "Incorrect Phone Number": "error",
  "Duplicate Lead": "default",
  "Irrelevant Lead": "error",
  Unassigned: "default",
  Other: "default",
};

export const STATUS_TAB_COLORS = {
  "Pending Contact": "#4DA6FF",
  "Potential Client": "#52C41A",
  "Company Profile Sent Through Whatsapp": "#52C41A",
  "Company Profile Sent Through Email": "#52C41A",
  "Company Profile Sent Through Email & Whatsapp": "#52C41A",
  "SaaS Client": "#13C2C2",
  "Follow Up": "#A38858",
  "Job Seeker": "#FF4D4F",
  "Opportunity Lost": "#FF4D4F",
  "Not Ready to Pay": "#FF4D4F",
  "Contacted But No Response - Company Profile Sent Through Whatsapp": "#FFD700",
  "Contacted But No Response - Company Profile Sent Through Email": "#FFD700",
  "Contacted But No Response - Company Profile Sent Through Email & Whatsapp":
    "#FFD700",
  "Phone Powered Off - Company Profile Sent Through Whatsapp": "#FFD700",
  "Phone Powered Off - Company Profile Sent Through Email": "#FFD700",
  "Phone Powered Off - Company Profile Sent Through Email & Whatsapp":
    "#FFD700",
  "Incorrect Phone Number": "#FF4D4F",
  "Duplicate Lead": "#6889D3",
  "Irrelevant Lead": "#FF4D4F",
  Unassigned: "#6C757D",
  Other: "#8C8C8C",
  default: "#3E6A9F",
};

export const STATUSES_REQUIRING_REMARKS = new Set([
  "Potential Client",
  "SaaS Client",
  "Follow Up",
  "Opportunity Lost",
  "Not Ready to Pay",
  "Irrelevant Lead",
]);

export const PROJECT_SIZE_OPTIONS = [
  { label: "Below 25k", value: "Below 25k" },
  { label: "25k - 50k", value: "25k - 50k" },
  { label: "50k - 100k", value: "50k - 100k" },
  { label: "Above 100k", value: "Above 100k" },
];
