import LeadTopFiltersAccordion from './lead-top-filters-accordion.jsx';
import { createPortal } from 'react-dom';
import { ActivityCompanyFilterSlot } from './activity-company-filter-slot.js';
import { Select } from './ui/app-select.jsx';
import React, { useEffect, useMemo, useState } from 'react';
import { LeadDateFilterSlot, LeadProjectFilterSlot, LeadTopActionsSlot } from './lead-date-filter-slot.jsx';
import { Alert } from 'antd';
import { QueryClient, QueryClientProvider, useIsMutating, useQuery, useQueryClient } from 'react-query';
import { useLocation, useSearchParams } from 'react-router-dom';
import api from '../pages/shared/services/api.js';
import useUserStore from '../pages/shared/store/user-store.js';
import { companyFilterSection, selectedCompany } from '../pages/shared/utils/company-filter.js';
import CompanySelectOption from './company-select-option.jsx';
import '../assets/styles/listing-filter-controls.css';

export async function getCompanies() {
  const { data } = await api.get('/company/simple-list');
  if (!Array.isArray(data)) throw new Error(data?.message || 'Could not load companies.');
  return data.map(({ id, name, email }) => ({ value: String(id), label: name, email }));
}

function FilterContents({ children, options, loading, error, retry, companyId, onChange }) {
  const mutating = useIsMutating();
  const { pathname, search } = useLocation();
  const filterParams = new URLSearchParams(search);
  const leadListing = /\/(?:leads|data-leads|meta-leads|follow-up|user-management)\/?$/.test(pathname);
  const [dateSlot, setDateSlot] = useState(null);
  const [projectSlot, setProjectSlot] = useState(null);
  const [topActionsSlot, setTopActionsSlot] = useState(null);
  const [activityCompanySlot, setActivityCompanySlot] = useState(null);
  const activityPage = /\/audit-history-list\/?$/.test(pathname);
  const companyControl = <div className={`lead-company-filter${activityPage ? ' company-filter-full-width' : !leadListing ? ' company-filter-standalone' : ''}`}>
      <label htmlFor="overview-company-filter">Company</label>
      <div className="lead-company-filter__control">
      <Select id="overview-company-filter" aria-label="Company" placeholder="Filter by company"
        style={{ width: '100%', maxWidth: '100%' }} showSearch allowClear optionFilterProp="label"
        virtual={false} optionRender={option => <CompanySelectOption option={option} />}
        labelRender={({ label }) => <span style={{ fontWeight: 600 }}>{label}</span>}
        options={options} loading={loading} disabled={mutating > 0} value={companyId ?? undefined}
        onChange={onChange} />
      </div>
      {error && <Alert type="error" message="Could not load companies." action={<button onClick={retry}>Retry</button>} />}
    </div>;
  return <ActivityCompanyFilterSlot.Provider value={activityPage ? setActivityCompanySlot : null}>
    {activityPage && activityCompanySlot && createPortal(companyControl, activityCompanySlot)}
    <LeadDateFilterSlot.Provider value={leadListing ? dateSlot : null}>
    <LeadProjectFilterSlot.Provider value={leadListing ? projectSlot : null}>
    <LeadTopActionsSlot.Provider value={leadListing ? topActionsSlot : null}>
    {leadListing && <div ref={setTopActionsSlot} />}
{!activityPage && <LeadTopFiltersAccordion enabled={/\/(?:leads|data-leads|meta-leads|user-management)\/?$/.test(pathname)}
      company={options.find(option => String(option.value) === String(companyId))?.label}
      projectSize={filterParams.get('project_size')}
      dateRange={[filterParams.get('date_start'), filterParams.get('date_end')]}>
    <div className={leadListing ? `lead-company-date-toolbar lead-company-date-toolbar--compact${/\/(?:leads|data-leads|meta-leads|user-management)\/?$/.test(pathname) ? ' data-leads-ui data-leads-topbar' : ''}` : undefined}>
    <div className={leadListing ? 'lead-company-date-toolbar__left' : undefined} style={leadListing ? undefined : { display: 'contents' }}>
    {companyControl}
    {leadListing && <div ref={setProjectSlot} className="lead-company-project-slot" />}
    </div>
    {leadListing && <div ref={setDateSlot} className="lead-filter-toolbar lead-company-date-toolbar__date" />}
    </div></LeadTopFiltersAccordion>}
    {children}
    </LeadTopActionsSlot.Provider>
    </LeadProjectFilterSlot.Provider>
  </LeadDateFilterSlot.Provider>
  </ActivityCompanyFilterSlot.Provider>;
}

function ScopedPage({ children, section, user }) {
  const [search, setSearch] = useSearchParams();
  const companyId = selectedCompany(search.toString());
  useEffect(() => {
    try {
      if (companyId) sessionStorage.setItem('assignmentCompanyId', companyId);
      else if (search.has('company_id')) sessionStorage.removeItem('assignmentCompanyId');
    } catch { /* Storage may be unavailable. */ }
  }, [companyId, search]);
  const defaultToFirstCompany = ['dashboard', 'user-management', 'leads', 'meta-leads', 'data-leads', 'follow-up', 'audit-history-list'].includes(section);
  const [companyDefaultReady, setCompanyDefaultReady] = useState(!defaultToFirstCompany || Boolean(companyId));
  const parentClient = useQueryClient();
  const { data: options = [], isFetching, isError, refetch } = useQuery(
    ['overviewCompanies', user.id], getCompanies, { staleTime: 300000, refetchOnWindowFocus: false },
  );
  useEffect(() => {
    if (companyDefaultReady || isFetching || isError) return;
    if (!companyId && options.length) {
      const next = new URLSearchParams(search);
      next.set('company_id', options[0].value);
      next.set('page', '0');
      setSearch(next, { replace: true });
      return;
    }
    setCompanyDefaultReady(true);
  }, [companyDefaultReady, isFetching, isError, companyId, options, search, setSearch]);
  // Each scope owns its cache and page state. In-flight results cannot populate another company.
  const client = useMemo(() => new QueryClient({ defaultOptions: parentClient.getDefaultOptions() }),
    [parentClient, user.id, section, companyId]);
  useEffect(() => () => { client.cancelQueries(); client.clear(); }, [client]);
  const onChange = (id) => {
    try {
      if (id) sessionStorage.setItem('assignmentCompanyId', String(id));
      else sessionStorage.removeItem('assignmentCompanyId');
    } catch { /* Storage may be unavailable. */ }
    const storageKey = { leads: 'leads-page', 'data-leads': 'data-leads-page', 'meta-leads': 'meta-leads-page' }[section];
    if (storageKey) {
      try {
        const key = `tableState_${storageKey}`;
        sessionStorage.removeItem(key);
      } catch { /* A blocked session store must not prevent filtering. */ }
    }
    // Lead filters belong to the selected company. Start with a complete
    // empty snapshot so neither URL filters nor saved table state carry across.
    const next = new URLSearchParams(storageKey ? undefined : search);
    if (storageKey) {
      next.set('filters', '1');
      // Explicitly clear both assignee representations and the status selection
      // when the lead pages initialize their role-specific filter state.
      next.set('status', '');
      next.set('executive', '');
      next.set('execId', '');
    }
    if (id) next.set('company_id', id); else next.delete('company_id');
    next.set('page', '0');
    setSearch(next, { replace: true });
  };
  return <QueryClientProvider client={client} key={`${user.id}:${section}:${companyId ?? 'all'}`}>
    <FilterContents options={options} loading={isFetching} error={isError} retry={refetch}
      companyId={companyId} onChange={onChange}>{companyDefaultReady ? children : null}</FilterContents>
  </QueryClientProvider>;
}

export default function CompanyFilteredPage({ children, dashboardCompanyScope = false, userManagementCompanyScope = false }) {
  const { user } = useUserStore();
  const { pathname } = useLocation();
  const section = companyFilterSection(user?.user_type, pathname);
  // Dashboard company filtering lives below the top-level statistics tabs.
  if (section === 'dashboard' && !dashboardCompanyScope) return children;
  if (section === 'user-management' && !userManagementCompanyScope) return children;
  return section ? <ScopedPage key={`${user.id}:${section}`} section={section} user={user}>{children}</ScopedPage> : children;
}
