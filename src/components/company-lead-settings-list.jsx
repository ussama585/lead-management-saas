import CompanySelect from './company-select.jsx';
import { ProjectSizeManager } from './project-size-settings.jsx';
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Alert } from 'antd';
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
  const companyControl = <CompanySelect id={`settings-company-${type}`}
        options={companies.data || []} value={companyId ?? undefined} loading={companies.isFetching}
        onChange={value => setCompanyId(value || null)} />;
  const companyError = companies.isError && <Alert type="error" message="Could not load companies." action={<Button onClick={() => companies.refetch()}>Retry</Button>} />;
  const Manager = statuses ? LeadStatusManager : ProjectSizeManager;
  return <Manager key={companyId || 'none'} user={user} companyId={companyId} companyControl={companyControl} companyError={companyError} />;
}
