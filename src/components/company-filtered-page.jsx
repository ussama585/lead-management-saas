import React, { useEffect, useMemo } from 'react';
import { Alert, Select } from 'antd';
import { QueryClient, QueryClientProvider, useIsMutating, useQuery, useQueryClient } from 'react-query';
import { useLocation, useSearchParams } from 'react-router-dom';
import api from '../pages/shared/services/api.js';
import useUserStore from '../pages/shared/store/user-store.js';
import { companyFilterSection, selectedCompany } from '../pages/shared/utils/company-filter.js';

async function getCompanies() {
  const { data } = await api.get('/company/simple-list');
  if (!Array.isArray(data)) throw new Error('Could not load companies.');
  return data.map(({ id, name }) => ({ value: String(id), label: name }));
}

function FilterContents({ children, options, loading, error, retry, companyId, onChange }) {
  const mutating = useIsMutating();
  return <>
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <label htmlFor="overview-company-filter" className="text-sm font-medium">Company</label>
      <Select id="overview-company-filter" aria-label="Company" placeholder="All companies"
        style={{ width: 280, maxWidth: '100%' }} showSearch allowClear optionFilterProp="label"
        options={options} loading={loading} disabled={mutating > 0} value={companyId ?? undefined}
        onChange={onChange} />
      {error && <Alert type="error" message="Could not load companies." action={<button onClick={retry}>Retry</button>} />}
    </div>
    {children}
  </>;
}

function ScopedPage({ children, section, user }) {
  const [search, setSearch] = useSearchParams();
  const companyId = selectedCompany(search.toString());
  const parentClient = useQueryClient();
  const { data: options = [], isLoading, isError, refetch } = useQuery(
    ['overviewCompanies', user.id], getCompanies, { staleTime: 300000 },
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
    <FilterContents options={options} loading={isLoading} error={isError} retry={refetch}
      companyId={companyId} onChange={onChange}>{children}</FilterContents>
  </QueryClientProvider>;
}

export default function CompanyFilteredPage({ children }) {
  const { user } = useUserStore();
  const { pathname } = useLocation();
  const section = companyFilterSection(user?.user_type, pathname);
  return section ? <ScopedPage section={section} user={user}>{children}</ScopedPage> : children;
}
