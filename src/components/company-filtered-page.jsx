import { Select } from './ui/app-select.jsx';
import React, { useEffect, useMemo, useState } from 'react';
import { LeadDateFilterSlot, LeadProjectFilterSlot } from './lead-date-filter-slot.jsx';
import { Alert } from 'antd';
import { QueryClient, QueryClientProvider, useIsMutating, useQuery, useQueryClient } from 'react-query';
import { useLocation, useSearchParams } from 'react-router-dom';
import api from '../pages/shared/services/api.js';
import useUserStore from '../pages/shared/store/user-store.js';
import { companyFilterSection, selectedCompany } from '../pages/shared/utils/company-filter.js';
import CompanySelectOption from './company-select-option.jsx';
import { Building2 } from 'lucide-react';

export async function getCompanies() {
  const { data } = await api.get('/company/simple-list');
  if (!Array.isArray(data)) throw new Error(data?.message || 'Could not load companies.');
  return data.map(({ id, name, email }) => ({ value: String(id), label: name, email }));
}

function FilterContents({ children, options, loading, error, retry, companyId, onChange }) {
  const mutating = useIsMutating();
  const { pathname } = useLocation();
  const leadListing = /\/(?:leads|data-leads|meta-leads)\/?$/.test(pathname);
  const [dateSlot, setDateSlot] = useState(null);
  const [projectSlot, setProjectSlot] = useState(null);
  return <LeadDateFilterSlot.Provider value={leadListing ? dateSlot : null}>
    <LeadProjectFilterSlot.Provider value={leadListing ? projectSlot : null}>
    <div className={leadListing ? 'lead-company-date-toolbar lead-company-date-toolbar--compact' : undefined}>
    <div className={leadListing ? 'lead-company-date-toolbar__left' : undefined} style={leadListing ? undefined : { display: 'contents' }}>
    <div className={leadListing ? 'lead-company-filter' : 'mb-4 flex flex-wrap items-center gap-2'}>
      <label htmlFor="overview-company-filter" className="text-sm font-medium">Company</label>
      <div className={leadListing ? 'lead-company-filter__control' : undefined} style={leadListing ? undefined : { display: 'contents' }}>
      {leadListing && <Building2 size={20} className="shrink-0" aria-hidden="true" />}
      <Select id="overview-company-filter" aria-label="Company" placeholder="All companies"
        style={{ width: 280, maxWidth: '100%' }} showSearch allowClear optionFilterProp="label"
        virtual={false} optionRender={option => <CompanySelectOption option={option} />}
        labelRender={({ label }) => <span style={{ fontWeight: 600 }}>{label}</span>}
        options={options} loading={loading} disabled={mutating > 0} value={companyId ?? undefined}
        onChange={onChange} />
      </div>
      {error && <Alert type="error" message="Could not load companies." action={<button onClick={retry}>Retry</button>} />}
    </div>
    {leadListing && <div ref={setProjectSlot} className="lead-company-project-slot" />}
    </div>
    {leadListing && <div ref={setDateSlot} className="lead-filter-toolbar lead-company-date-toolbar__date" />}
    </div>
    {children}
    </LeadProjectFilterSlot.Provider>
  </LeadDateFilterSlot.Provider>;
}

function ScopedPage({ children, section, user }) {
  const [search, setSearch] = useSearchParams();
  const companyId = selectedCompany(search.toString());
  const parentClient = useQueryClient();
  const { data: options = [], isFetching, isError, refetch } = useQuery(
    ['overviewCompanies', user.id], getCompanies, { staleTime: 300000, refetchOnWindowFocus: false },
  );
  // Each scope owns its cache and page state. In-flight results cannot populate another company.
  const client = useMemo(() => new QueryClient({ defaultOptions: parentClient.getDefaultOptions() }),
    [parentClient, user.id, section, companyId]);
  useEffect(() => () => { client.cancelQueries(); client.clear(); }, [client]);
  const onChange = (id) => {
    const storageKey = { leads: 'leads-page', 'data-leads': 'data-leads-page', 'meta-leads': 'meta-leads-page' }[section];
    if (storageKey) {
      try {
        const key = `tableState_${storageKey}`;
        const saved = JSON.parse(sessionStorage.getItem(key) || '{}');
        sessionStorage.setItem(key, JSON.stringify({ ...saved, pageIndex: 0 }));
      } catch { /* A blocked session store must not prevent filtering. */ }
    }
    const next = new URLSearchParams(search);
    if (id) next.set('company_id', id); else next.delete('company_id');
    next.set('page', '0');
    setSearch(next, { replace: true });
  };
  return <QueryClientProvider client={client} key={`${user.id}:${section}:${companyId ?? 'all'}`}>
    <FilterContents options={options} loading={isFetching} error={isError} retry={refetch}
      companyId={companyId} onChange={onChange}>{children}</FilterContents>
  </QueryClientProvider>;
}

export default function CompanyFilteredPage({ children }) {
  const { user } = useUserStore();
  const { pathname } = useLocation();
  const section = companyFilterSection(user?.user_type, pathname);
  return section ? <ScopedPage section={section} user={user}>{children}</ScopedPage> : children;
}
