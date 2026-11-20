from pathlib import Path
path = Path('src/pages/sales-executive/data-entry-table.jsx')
text = path.read_text(encoding='utf-8')
text = text.replace('import { Building2 } from \'lucide-react\';\n', '')
text = text.replace('import LeadListingFilters from "../../components/lead-listing-filters.jsx";', '''import LeadListingDropdownFilters from '../../components/lead-listing-dropdown-filters.jsx';
import LeadTopFiltersAccordion from '../../components/lead-top-filters-accordion.jsx';
import '../../assets/styles/data-leads-page.css';
import '../../assets/styles/sales-data-filters.css';''')
start = text.index('        {superAdmin && <div className="lead-company-date-toolbar')
end = text.index('\n\n        {canViewUserTabs &&', start)
text = text[:start] + '''        <LeadTopFiltersAccordion company={(companies.data || []).find(company => String(company.id) === String(companyId))?.name} dateRange={dateRange}>
          <div className="lead-company-date-toolbar lead-company-date-toolbar--compact data-leads-ui data-leads-topbar sales-data-filter-toolbar">
            <div className="lead-company-date-toolbar__left">
              {superAdmin && <div className="lead-company-filter">
                <label htmlFor="sales-data-company-filter">Company</label>
                <div className="lead-company-filter__control">
                  <FilterSelect id="sales-data-company-filter" showSearch allowClear placeholder="Filter by company"
                    value={companyId ?? undefined} loading={companies.isFetching} style={{ width: '100%' }}
                    labelRender={({ label }) => <span style={{ fontWeight: 600 }}>{label}</span>}
                    options={(companies.data || []).map(company => ({ value: company.id, label: company.name, email: company.email }))}
                    optionRender={option => <CompanySelectOption option={option} />}
                    onChange={value => {
                      setCompanyId(value ?? null);
                      setStatusFilter('');
                      setSelectedExecutive(null);
                      setSelectedTab('all');
                      setPagination(previous => ({ ...previous, pageIndex: 0 }));
                      setRowSelection({}); setSelectedAssignee(null);
                    }} />
                </div>
                {companies.isError && <div role="alert">Could not load companies. <Button onClick={() => companies.refetch()}>Retry</Button></div>}
              </div>}
              <div className="lead-company-project-slot">
                <LeadListingDropdownFilters
                  disabled={superAdmin && !companyId}
                  showExecutives={canViewUserTabs && (!statusFilter || statusFilter === 'All' || statusFilter === 'assigned')}
                  executives={assigneeFilterOptions}
                  getExecutiveCount={id => assigneeFilterOptions.find(option => String(option.id) === String(id))?.filterCount ?? 0}
                  assigneeTotal={assigneeFilterOptions.reduce((total, option) => total + option.filterCount, 0)}
                  selectedExecutive={selectedExecutive}
                  onExecutiveChange={value => {
                    setSelectedExecutive(value || null);
                    if (value && selectedTab === 'unassigned') {
                      setStatusFilter('');
                      setSelectedTab('all');
                    }
                    setPagination(previous => ({ ...previous, pageIndex: 0 }));
                    setRowSelection({});
                  }}
                  status={statusFilter} onStatusChange={handleScopeTabFilter} statuses={statusChoices}
                  total={tabCounts.all} getStatusCount={key => tabCounts[key] ?? 0}
                />
              </div>
            </div>
            {superAdmin && <div className="lead-filter-toolbar lead-company-date-toolbar__date">
              <LeadDateRangeField hasValue={Boolean(dateRange)} onClear={() => { setDateRange(null); setPagination(previous => ({ ...previous, pageIndex: 0 })); setRowSelection({}); }}>
                <BootstrapDateRangeModal placeholder="Filter by date range" value={dateRange} showModal={showDateModal} setShowModal={setShowDateModal}
                  onDone={range => { setDateRange(range); setShowDateModal(false); setPagination(previous => ({ ...previous, pageIndex: 0 })); setRowSelection({}); }} />
              </LeadDateRangeField>
            </div>}
          </div>
        </LeadTopFiltersAccordion>''' + text[end:]
path.write_text(text, encoding='utf-8')
