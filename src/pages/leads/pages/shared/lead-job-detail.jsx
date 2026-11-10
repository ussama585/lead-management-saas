import React from 'react';
import { useSearchParams } from 'react-router-dom';
import DataLeadJobDetail from '../data-leads/data-lead-job-detail.jsx';

export default function LeadJobDetailPage() {
  const [searchParams] = useSearchParams();
  const source = (searchParams.get('source') || 'website').toLowerCase();
  const jobSource = ['website', 'meta', 'data'].includes(source) ? source : 'website';
  return <DataLeadJobDetail jobSource={jobSource} />;
}
