import CompanySelectOption from './company-select-option.jsx';
import { ProjectSizeManager } from './project-size-settings.jsx';
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Alert, Card } from 'antd';
import { Select } from './ui/app-select.jsx';
import { Button } from './ui/app-controls.jsx';
import { getCompanies } from './company-filtered-page.jsx';
import useUserStore from '../pages/shared/store/user-store.js';
import { LeadStatusManager } from './lead-status-settings.jsx';

export default function CompanyLeadSettingsList({ type }) {
  const { user } = useUserStore();
  const [selectedCompanyId, setCompanyId] = useState(undefined);
  const companies = useQuery(['overviewCompanies', user?.id], getCompanies, { staleTime: 300000, refetchOnWindowFocus: false });
  const companyId = selectedCompanyId === undefined ? companies.data?.[0]?.value ?? null : selectedCompanyId;
  const statuses = type === 'leads';
  return <Card title={statuses ? 'Lead statuses' : 'Project sizes'}>
    <div className="mb-4">
      <label htmlFor={`settings-company-${type}`} className="mb-2 block text-sm font-medium">Company</label>
      <Select id={`settings-company-${type}`} style={{ width: 280, maxWidth: '100%' }} showSearch allowClear
        optionRender={option => <CompanySelectOption option={option} />}
        placeholder="Select company" options={companies.data || []} value={companyId ?? undefined} loading={companies.isFetching}
        onChange={value => setCompanyId(value || null)} />
    </div>
    {companies.isError && <Alert type="error" message="Could not load companies." action={<Button onClick={() => companies.refetch()}>Retry</Button>} />}
    {statuses ? <LeadStatusManager key={companyId || 'none'} user={user} companyId={companyId} /> : <ProjectSizeManager key={companyId || 'none'} user={user} companyId={companyId} />}
  </Card>;
}
