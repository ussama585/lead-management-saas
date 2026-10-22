import React, { useEffect } from 'react';
import { canAccessRoute } from './pages/auth/role-access.js';
import { getRoleHome, getRolePath, USER_TYPES } from './pages/auth/role-home.js';
import './assets/styles/app.css';
import './assets/styles/legacy/global.generated.css'
// import "bootstrap/dist/css/bootstrap.css";
// import "bootstrap/dist/js/bootstrap.js";
import MarketingManager from './pages/dashboard/pages/marketing-manager/dashboard.jsx';
import MainStatsPage from './pages/dashboard/pages/marketing-manager/main-stats.jsx';
import LoginPage from './pages/auth/pages/login-page.jsx';
import SuperAdminLoginPage from './pages/auth/pages/super-admin-login-page.jsx';
import ForgotPasswordPage from './pages/auth/pages/forgot-password-page.jsx';
import AdminDashboard, { DashboardTabsSection } from './pages/dashboard/pages/admin/dashboard.jsx';
import AuditHistoryListPage from './pages/dashboard/pages/admin/audit-history-list.jsx';
import AdminSettingsPage from './pages/dashboard/pages/admin/admin-settings-page.jsx';
import ManagerDashboard from './pages/dashboard/pages/dashboard-page.jsx';
import ExecutiveDashboard from './pages/dashboard/pages/sales-executive/dashboard.jsx';
import UserManagement from './pages/users/pages/user-management-page.jsx';
import CompaniesPage from './pages/companies/pages/companies-page.jsx';
import CreateUser from './pages/users/pages/create-user-page.jsx';
import EditUser from './pages/users/pages/edit-user-page.jsx';
import SalesManagerListing from './pages/users/pages/managers/sales-manager-listing-page.jsx';
import SalesManagerDetail from './pages/users/pages/managers/sales-manager-detail-page.jsx';
import SalesExecutiveListing from './pages/users/pages/executives/sales-executive-listing-page.jsx';
import SalesExecutiveDetail from './pages/users/pages/executives/sales-executive-detail-page.jsx';
import ProjectDetail from './pages/users/pages/projects/project-detail-page.jsx';
import ProjectDetailForExecutive from './pages/sales-executive/project-detail-page.jsx';
import ProjectListing from './pages/clients/pages/projects/project-listing.jsx';
import JobDescriptionRequestPage from './pages/job-description-requests/pages/job-description-request-page.jsx';
import ProjectListingForExecutive from './pages/sales-executive/project-listing-page.jsx';
import SaasJobHeadhuntingPage from './pages/clients/pages/jobs/saas-job-headhunting.jsx';
import ProjectApplicationForExecutive from './pages/sales-executive/project-application-page.jsx';
import TargetDetail from './pages/users/pages/targets/target-detail-page.jsx';
import AdminTargetListing from './pages/users/pages/targets/target-listing-page.jsx';
import TargetListingForExecutive from './pages/sales-executive/target-listing-page.jsx';
import NotFoundPage from './pages/auth/pages/not-found-page.jsx'
import SuperAdminLayout from './layouts/app-layout-super-admin.jsx';
import CompanyAdminLayout from './layouts/app-layout-company-admin.jsx';
import SalesManagerLayout from './layouts/app-layout-sales-manager.jsx';
import SalesExecutiveLayout from './layouts/app-layout-sales-executive.jsx';
import RoleRoutes from './layouts/role-routes.jsx';
import AppLayoutDataEntryExecutive from './layouts/app-layout-data-entry-executive.jsx';

import HeadhuntingForAdmin from './pages/clients/pages/clients/headhunting-client.jsx';
import DeletedClientsPage from './pages/clients/pages/clients/deleted-clients.jsx';
import DeletedProjectsPage from './pages/clients/pages/projects/deleted-projects.jsx';
import JobsPage from './pages/jobs/jobs-page.jsx';
import DeletedJobsPage from './pages/jobs/deleted-jobs.jsx';

// import Headhunting from './pages/sales-manager/headhunting-client.jsx';
// import AddNewClientPage from './pages/sales-manager/add-new-client-for-headhunting.jsx';
// import HeadhuntingClientDetail from './pages/sales-manager/headhunting-client-detail-page.jsx';

import HeadhuntingForExecutive from './pages/sales-executive/headhunting-client.jsx';
import AddNewClientPageForExecutive from './pages/sales-executive/add-new-client-for-headhunting.jsx';
import HeadhuntingClientDetailForExecutive from './pages/sales-executive/headhunting-client-detail-page.jsx';
import AddNewProjectPageForExecutive from './pages/sales-executive/add-new-project-for-headhunting.jsx';
import AddNewDataForExecutive from './pages/sales-executive/add-new-data.jsx';

import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import useUserStore from './pages/shared/store/user-store.js';
// import HeadhuntingOfExecutive from './pages/sales-manager/headhunting-client-of-executive.jsx';
// import SalesLeadsForAdmin from './pages/admin/sales-data.jsx';
import ViewSalesLeads from './pages/users/pages/admin/view-sales-data.jsx';
import ResetPasswordPage from './pages/auth/pages/reset-password.jsx';
import SalesDataDetailPageForExecutive from './pages/sales-executive/sales-data-detail-page.jsx';

import LeadsPage from './pages/leads/pages/website-leads/website-leads.jsx';
import LeadDetailPage from './pages/leads/pages/shared/lead-detail.jsx';
import LeadJobPage from './pages/leads/pages/shared/lead-job.jsx';
import LeadJobDetailPage from './pages/leads/pages/shared/lead-job-detail.jsx';
import NewLeadJobPage from './pages/add-new-lead-job.jsx';
import AddNewLead from './pages/leads/pages/shared/add-new-lead.jsx';

import DataEntryExecutiveDashboard from './pages/dashboard/pages/data-entry-executive/dashboard.jsx';
import AddUpdateLead from './pages/sales-executive/add-update-lead.jsx';
import LeadsTable from './pages/sales-executive/leads-table.jsx';
import AddDataEntry from './pages/sales-executive/add-data-entry.jsx';
import DataEntryTable from './pages/sales-executive/data-entry-table.jsx';
import EditDataEntry from './pages/sales-executive/edit-data-entry.jsx';

import RecruitmentManagerDashboard from './pages/dashboard/pages/recruitment-manager/dashboard.jsx';
import RecruitementExecutiveDashboard from './pages/dashboard/pages/recruitment-executive/dashboard.jsx';
import ProjectManagerDashboard from './pages/dashboard/pages/project-manager/dashboard.jsx';
import ProjectManagerFollowUp from './pages/dashboard/pages/project-manager/follow-up.jsx';
import CommonLeadsFollowUp from './pages/dashboard/pages/shared/common-leads-follow-up.jsx';

import { AccountantDashboard, AccountantInvoices } from './pages/dashboard/pages/accountant/index.js';

import ClientHeadhunting from './pages/clients/pages/clients/client-headhunting.jsx';
import JobHeadhunting from './pages/clients/pages/jobs/job-headhunting.jsx';
import AddNewJobHeadhunting from './pages/clients/pages/jobs/add-new-job-headhunting.jsx';
import AddNewClientHeadhunting from './pages/clients/pages/clients/add-new-client-headhunting.jsx';
import AddNewProjectHeadhunting from './pages/clients/pages/projects/add-new-project-headhunting.jsx';
import EditClient from './pages/clients/pages/edit-client.jsx';
import EditProjectHeadhunting from './pages/clients/pages/projects/edit-project-headhunting.jsx';
import ProjectPayments from './pages/clients/pages/projects/project-payments-page.jsx';
import EditJobHeadhunting from './pages/clients/pages/jobs/edit-job-headhunting.jsx';
import EditClientHeadhunting from './pages/clients/pages/clients/edit-client-headhunting.jsx';
import MetaLeads from './pages/leads/pages/meta-leads/meta-leads.jsx';
import MetaLeadDetail from './pages/leads/pages/meta-leads/meta-lead.jsx';
import MetaSpendingList from './pages/leads/pages/meta-spending/meta-spending-list.jsx';
import MetaSpendingDetail from './pages/leads/pages/meta-spending/meta-spending-detail.jsx';
import MetaSpendingAdsets from './pages/leads/pages/meta-spending/meta-spending-adsets.jsx';
import MetaSpendingAds from './pages/leads/pages/meta-spending/meta-spending-ads.jsx';
import MetaSpendingAdInsights from './pages/leads/pages/meta-spending/meta-spending-ad-insights.jsx';
import MetaSpendingCampaignDetail from './pages/leads/pages/meta-spending/meta-spending-campaign-detail.jsx';
import MetaSpendingAdsetDetail from './pages/leads/pages/meta-spending/meta-spending-adset-detail.jsx';
import MetaSpendingAdDetail from './pages/leads/pages/meta-spending/meta-spending-ad-detail.jsx';
import MetaSpendingAdInsightDetail from './pages/leads/pages/meta-spending/meta-spending-ad-insight-detail.jsx';
import DataLeads from './pages/leads/pages/data-leads/data-leads.jsx';
import DataLead from './pages/leads/pages/data-leads/data-lead.jsx';
import DataLeadJobDetail from './pages/leads/pages/data-leads/data-lead-job-detail.jsx';
import Resume from './pages/resume/pages/Resume.jsx';
import ResumeUpload from './pages/resume/pages/resume-upload.jsx';
import CvListing from './pages/resume/pages/CvListing.jsx';
import ProfileListing from './pages/resume/pages/ProfileListing.jsx';
import AssignedProjectsPage from './pages/recruitment-executive/project-page.jsx';
import RecruitmentProjectListing from './pages/recruitment-executive/recruitment-project-listing.jsx';
import GoogleForm from './pages/screening-form/pages/google-form.jsx';
import AddGoogleForm from './pages/screening-form/pages/add-google-form.jsx';
import EditGoogleForm from './pages/screening-form/pages/edit-google-form.jsx';
import ScreenListing from './pages/screening-form/pages/screen-listing.jsx';
import AvailableQuestionnairesPage from './pages/screening-form/pages/available-questionnaires-page.jsx';
import ResponseAnalysis from './pages/screening-form/pages/response-analysis.jsx';
import DeliverablesPage from './pages/deliverables/pages/deliverables-page.jsx';

function ProtectedRoute({ element, allowedRoles }) {
  const { user } = useUserStore();
  const { pathname, search, hash } = useLocation();
  if (!user?.user_type || !getRoleHome(user.user_type)) return <Navigate to="/" replace />;
  if (!canAccessRoute(user.user_type, allowedRoles, pathname)) {
    return <div role="alert" className="p-6"><h1>Access denied</h1><p>Your role does not have permission to open this page.</p><a href={getRoleHome(user.user_type)}>Return to your dashboard</a></div>;
  }
  const target = getRolePath(user.user_type, pathname);
  if (target !== pathname) return <Navigate to={`${target}${search}${hash}`} replace />;
  return element;
}



const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to the top of the page
  }, [pathname]); // Trigger on pathname change

  return null; // This component doesn't render anything
};



function App() {
  const { user } = useUserStore();

  const location = useLocation();

  // Exclude layout for login page
  const isLoginPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/super-admin/login' || location.pathname === '/forgot-password' || location.pathname === '/reset-password';
  

  const getLayout = (element) => {
    if (!user?.user_type || !getRoleHome(user.user_type)) return element;
    
    const layouts = {
      admin: SuperAdminLayout,
      super_admin: SuperAdminLayout,
      company_admin: CompanyAdminLayout,
      sales_manager: SalesManagerLayout,
      sales_executive: SalesExecutiveLayout,
      data_entry_executive: AppLayoutDataEntryExecutive,
    };
    const Layout = layouts[user.user_type];
    return Layout ? <Layout>{element}</Layout> : element;
  };

  return (
    <>
      {!isLoginPage ? (
        getLayout(
          <>
          <ScrollToTop />
          {/* Routes wrapped with the layout */}
          <RoleRoutes role={user?.user_type}>
            {/* Admin Routes */}
            <Route path="/settings" element={<ProtectedRoute element={<AdminSettingsPage />} allowedRoles={USER_TYPES} />} />
            <Route path="/super-admin/companies" element={<ProtectedRoute element={<CompaniesPage />} allowedRoles={['super_admin']} />} />
            <Route path="/super-admin" element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={['super_admin']} />}>
              <Route index element={<DashboardTabsSection />} />
            </Route>
            <Route path="/company-admin" element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={['company_admin']} />}>
              <Route index element={<DashboardTabsSection />} />
            </Route>
            <Route path="/admin" element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={['admin']} />}>
              <Route index element={<DashboardTabsSection />} />
            </Route>
            <Route path="/admin/user-management" element={<ProtectedRoute element={<UserManagement />} allowedRoles={['admin']} />} />
            <Route path="/admin/create-user" element={<ProtectedRoute element={<CreateUser />} allowedRoles={['admin']} />} />
            <Route path="/admin/edit-user/:id" element={<ProtectedRoute element={<EditUser />} allowedRoles={['admin']} />} />
            <Route path="/admin/sales-manager-listing" element={<ProtectedRoute element={<SalesManagerListing />} allowedRoles={['admin']} />} />
            <Route path="/admin/sales-manager-detail/:id/:slug" element={<ProtectedRoute element={<SalesManagerDetail />} allowedRoles={['admin']} />} />
            <Route path="/admin/sales-executive-listing" element={<ProtectedRoute element={<SalesExecutiveListing />} allowedRoles={['admin']} />} />
            <Route path="/sales-manager/sales-executive-listing" element={<ProtectedRoute element={<SalesExecutiveListing />} allowedRoles={['sales_manager']} />} />
            <Route path="/admin/sales-executive-detail/:id/:slug" element={<ProtectedRoute element={<SalesExecutiveDetail />} allowedRoles={['admin']} />} />
            <Route path="/project-listing-page/:clientId" element={<ProtectedRoute element={<ProjectListing />} allowedRoles={['admin', 'recruitment_manager', 'recruitment_executive','sales_manager','sales_executive','project_manager']} />} />
            <Route path="/saas-job-headhunting/:jobId" element={<ProtectedRoute element={<SaasJobHeadhuntingPage />} allowedRoles={['sales_manager', 'sales_executive', 'admin', 'recruitment_manager', 'recruitment_executive']} />} />
            <Route path="/admin/project-detail/:id/:slug" element={<ProtectedRoute element={<ProjectDetail />} allowedRoles={['admin']} />} />
            <Route path="/admin/target-listing" element={<ProtectedRoute element={<AdminTargetListing />} allowedRoles={['admin']} />} />
            <Route path="/admin/target-detail/:id" element={<ProtectedRoute element={<TargetDetail />} allowedRoles={['admin']} />} />
            <Route path="/admin/project-listing" element={<ProtectedRoute element={<AssignedProjectsPage />} allowedRoles={['admin']} />} />
            <Route path="/admin/project-listing/:clientId" element={<ProtectedRoute element={<RecruitmentProjectListing />} allowedRoles={['admin']} />} />
            <Route path="/headhunting-client" element={<ProtectedRoute element={<HeadhuntingForAdmin />} allowedRoles={['admin', 'recruitment_manager', 'recruitment_executive','sales_manager','sales_executive','project_manager']} />} />
            <Route path="/admin/deleted-clients" element={<ProtectedRoute element={<DeletedClientsPage />} allowedRoles={['admin']} />} />
            <Route path="/admin/deleted-projects" element={<ProtectedRoute element={<DeletedProjectsPage />} allowedRoles={['admin']} />} />
            <Route path="/admin/jobs" element={<ProtectedRoute element={<JobsPage />} allowedRoles={['admin']} />} />
            <Route path="/admin/deleted-jobs" element={<ProtectedRoute element={<DeletedJobsPage />} allowedRoles={['admin']} />} />
            <Route path="/admin/audit-history-list" element={<ProtectedRoute element={<AuditHistoryListPage />} allowedRoles={['admin']} />} />
            <Route path="/admin/settings" element={<ProtectedRoute element={<AdminSettingsPage />} allowedRoles={['admin']} />} />
            <Route path="/admin/deliverables" element={<ProtectedRoute element={<DeliverablesPage />} allowedRoles={['admin']} />} />
            <Route path="/recruitment-manager/deliverables" element={<ProtectedRoute element={<DeliverablesPage />} allowedRoles={['recruitment_manager']} />} />
            <Route path="/recruitment-executive/deliverables" element={<ProtectedRoute element={<DeliverablesPage />} allowedRoles={['recruitment_executive']} />} />

            <Route path="/admin/view-sales-data/:id/:name" element={<ProtectedRoute element={<ViewSalesLeads />} allowedRoles={['admin']} />} />
            <Route path="/admin/sales-data-detail/:id?" element={<ProtectedRoute element={<SalesDataDetailPageForExecutive />} allowedRoles={['admin']} />} />
            <Route path="/admin/leads" element={<ProtectedRoute element={<LeadsPage />} allowedRoles={['admin']} />} />
            <Route path="/admin/leads/:id" element={<ProtectedRoute element={<LeadDetailPage />} allowedRoles={['admin']} />} />
            <Route path="/admin/leads/:id/job/:jobId" element={<ProtectedRoute element={<LeadJobPage />} allowedRoles={['admin']} />} />
            <Route path="/admin/meta-leads/:id/job/:jobId" element={<ProtectedRoute element={<LeadJobPage/>} allowedRoles={['admin']} />} />
            <Route path="/admin/lead-job-detail/:jobId" element={<ProtectedRoute element={<LeadJobDetailPage />} allowedRoles={['admin']} />} />
            <Route path="/admin/leads/:id/new-job" element={<ProtectedRoute element={<NewLeadJobPage />} allowedRoles={['admin']} />} />
            <Route path="/admin/meta-leads/:id/new-job" element={<ProtectedRoute element={<NewLeadJobPage />} allowedRoles={['admin']} />} />
            <Route path="/admin/add-new-lead" element={<ProtectedRoute element={<AddNewLead />} allowedRoles={['admin']} />} />
            <Route path="/admin/meta-leads" element={<ProtectedRoute element={<MetaLeads/>} allowedRoles={['admin']} />} />
            <Route path="/admin/meta-leads/:id" element={<ProtectedRoute element={<MetaLeadDetail />} allowedRoles={['admin']} />} />
            <Route path="/admin/meta-spending" element={<ProtectedRoute element={<MetaSpendingList />} allowedRoles={['admin']} />} />
            <Route path="/admin/meta-spending/:id" element={<ProtectedRoute element={<MetaSpendingDetail />} allowedRoles={['admin']} />} />
            <Route path="/admin/meta-spending-adsets" element={<ProtectedRoute element={<MetaSpendingAdsets />} allowedRoles={['admin']} />} />
            <Route path="/admin/meta-spending-ads" element={<ProtectedRoute element={<MetaSpendingAds />} allowedRoles={['admin']} />} />
            <Route path="/admin/meta-spending-ad-insights" element={<ProtectedRoute element={<MetaSpendingAdInsights />} allowedRoles={['admin']} />} />
            <Route path="/admin/meta-spending-campaign-detail" element={<ProtectedRoute element={<MetaSpendingCampaignDetail />} allowedRoles={['admin']} />} />
            <Route path="/admin/meta-spending-adset-detail" element={<ProtectedRoute element={<MetaSpendingAdsetDetail />} allowedRoles={['admin']} />} />
            <Route path="/admin/meta-spending-ad-detail" element={<ProtectedRoute element={<MetaSpendingAdDetail />} allowedRoles={['admin']} />} />
            <Route path="/admin/meta-spending-ad-insight-detail" element={<ProtectedRoute element={<MetaSpendingAdInsightDetail />} allowedRoles={['admin']} />} />
            <Route path="/admin/resumes" element={<ProtectedRoute element={<Resume />} allowedRoles={['admin']} />} />
            <Route path="/admin/data-entry-table" element={<ProtectedRoute element={<DataEntryTable />} allowedRoles={['admin']} />} />
            <Route path="/data-entry/edit/:id" element={<ProtectedRoute element={<EditDataEntry />} allowedRoles={['admin', 'sales_manager', 'data_entry_executive']} />} />


            <Route path="/sales-manager" element={<ProtectedRoute element={<ManagerDashboard />} allowedRoles={['sales_manager']} />} />
            <Route path="/sales-manager/resume-upload" element={<ProtectedRoute element={<ResumeUpload />} allowedRoles={['admin']} />} />
            <Route
              path="/resume-upload"
              element={
                <ProtectedRoute
                  element={<ResumeUpload />}
                  allowedRoles={['admin', 'recruitment_manager', 'recruitment_executive']}
                />
              }
            />
            <Route
              path="/cv-listing"
              element={
                <ProtectedRoute
                  element={<CvListing />}
                  allowedRoles={['admin', 'recruitment_manager', 'recruitment_executive']}
                />
              }
            />
            <Route
              path="/profile-listing"
              element={
                <ProtectedRoute
                  element={<ProfileListing />}
                  allowedRoles={['admin', 'recruitment_manager', 'recruitment_executive']}
                />
              }
            />
            <Route path="/candidate-listings" element={<Navigate to="/cv-listing" replace />} />
            {/* <Route path="/sales-manager/headhunting-client" element={<ProtectedRoute element={<Headhunting />} allowedRoles={['sales_manager']} />} /> */}
            {/* <Route path="/sales-manager/headhunting-clients/add-new-client" element={<ProtectedRoute element={<AddNewClientPage />} allowedRoles={['sales_manager']} />} /> */}
            {/* <Route path="/sales-manager/headhunting-clients/client-detail/:id" element={<ProtectedRoute element={<HeadhuntingClientDetail />} allowedRoles={['sales_manager']} />} /> */}
            {/* <Route path="/sales-manager/headhunting/headhunting-client-of-executive/:id/:slug" element={<ProtectedRoute element={<HeadhuntingOfExecutive />} allowedRoles={['sales_manager']} />} /> */}
            <Route path="/sales-manager/set-data/:id?" element={<ProtectedRoute element={<AddNewDataForExecutive />} allowedRoles={['sales_manager']} />} />
            <Route path="/sales-manager/sales-data-detail-page/:id?" element={<ProtectedRoute element={<SalesDataDetailPageForExecutive />} allowedRoles={['sales_manager']} />} />


            <Route path="/sales-manager/leads" element={<ProtectedRoute element={<LeadsPage />} allowedRoles={['sales_manager']} />} />
            <Route path="/sales-manager/new-lead" element={<ProtectedRoute element={<AddNewLead />} allowedRoles={['sales_manager']} />} />
            <Route path="/sales-manager/leads/:id" element={<ProtectedRoute element={<LeadDetailPage />} allowedRoles={['sales_manager']} />} />
            <Route path="/sales-manager/leads/:id/job/:jobId" element={<ProtectedRoute element={<LeadJobPage />} allowedRoles={['sales_manager']} />} />
            <Route path="/sales-manager/leads/:id/new-job" element={<ProtectedRoute element={<NewLeadJobPage />} allowedRoles={['sales_manager']} />} />
            <Route path="/sales-manager/meta-leads/:id/job/:jobId" element={<ProtectedRoute element={<LeadJobPage />} allowedRoles={['sales_manager']} />} />
            <Route path="/sales-manager/meta-leads/:id/new-job" element={<ProtectedRoute element={<NewLeadJobPage />} allowedRoles={['sales_manager']} />} />
            <Route path="/sales-manager/add-new-lead" element={<ProtectedRoute element={<AddNewLead />} allowedRoles={['sales_manager']} />} />
            <Route path="/sales-manager/meta-leads" element={<ProtectedRoute element={<MetaLeads />} allowedRoles={['sales_manager']} />} />
            <Route path="/sales-manager/meta-leads/:id" element={<ProtectedRoute element={<MetaLeadDetail />} allowedRoles={['sales_manager']} />} />
            <Route path="/data-leads" element={<ProtectedRoute element={<DataLeads />} allowedRoles={['admin','sales_manager','sales_executive','marketing_manager','recruitment_manager','recruitment_executive','accountant','data_entry_executive']} />} />
            <Route path="/data-lead/:id" element={<ProtectedRoute element={<DataLead />} allowedRoles={['admin','sales_manager','sales_executive','marketing_manager','recruitment_manager','recruitment_executive','accountant','data_entry_executive']} />} />
            <Route path="/data-leads/create-job/:id" element={<ProtectedRoute element={<NewLeadJobPage />} allowedRoles={['admin','sales_manager','sales_executive','marketing_manager','recruitment_manager','recruitment_executive','accountant','data_entry_executive']} />} />
            <Route path="/data-leads/:leadId/edit/:jobId" element={<ProtectedRoute element={<LeadJobPage />} allowedRoles={['admin','sales_manager','sales_executive','marketing_manager','recruitment_manager','recruitment_executive','accountant','data_entry_executive']} />} />
            <Route path="/job-detail/:jobId" element={<ProtectedRoute element={<DataLeadJobDetail />} allowedRoles={['admin','sales_manager','sales_executive','marketing_manager','recruitment_manager','recruitment_executive','accountant','data_entry_executive','project_manager']} />} />

             <Route path="/sales-executive/meta-leads" element={<ProtectedRoute element={<MetaLeads/>} allowedRoles={['sales_executive']} />} />
            <Route path="/sales-executive/meta-leads/:id" element={<ProtectedRoute element={<MetaLeadDetail />} allowedRoles={['sales_executive']} />} />
           
            <Route path="/sales-executive" element={<ProtectedRoute element={<ExecutiveDashboard />} allowedRoles={['sales_executive']} />} />
            <Route path="/sales-executive/target-listing" element={<ProtectedRoute element={<TargetListingForExecutive />} allowedRoles={['sales_executive']} />} />
            <Route path="/sales-executive/project-listing" element={<ProtectedRoute element={<ProjectListingForExecutive />} allowedRoles={['sales_executive']} />} />
            <Route path="/sales-executive/project-detail/:id/:slug" element={<ProtectedRoute element={<ProjectDetailForExecutive />} allowedRoles={['sales_executive']} />} />
            <Route path="/sales-executive/project-application/:id" element={<ProtectedRoute element={<ProjectApplicationForExecutive />} allowedRoles={['sales_executive']} />} />
            <Route path="/sales-executive/target-listing" element={<ProtectedRoute element={<TargetListingForExecutive />} allowedRoles={['sales_executive']} />} />
            {/* client and project routes */}
            <Route path="/sales-executive/headhunting-client" element={<ProtectedRoute element={<HeadhuntingForExecutive />} allowedRoles={['sales_executive']} />} />
            <Route path="/sales-executive/headhunting-clients/add-new-client" element={<ProtectedRoute element={<AddNewClientPageForExecutive />} allowedRoles={['sales_executive']} />} />
            <Route path="/sales-executive/headhunting-clients/client-detail/:id" element={<ProtectedRoute element={<HeadhuntingClientDetailForExecutive />} allowedRoles={['sales_executive']} />} />
            <Route path="/sales-executive/headhunting-clients/add-new-project/:id" element={<ProtectedRoute element={<AddNewProjectPageForExecutive />} allowedRoles={['sales_executive']} />} />
            {/* old sales data routes*/}
            {/* <Route path="/sales-executive/sales-leads" element={<ProtectedRoute element={<SalesCallingForExecutive />} allowedRoles={['sales_executive']} />} />
            <Route path="/sales-executive/sales-leads/add-new-record/:id?" element={<ProtectedRoute element={<AddNewCallingRecordForExecutive />} allowedRoles={['sales_executive']} />} /> */}
            {/* new sales data routes*/}
            <Route path="/sales-executive/set-data/:id?" element={<ProtectedRoute element={<AddNewDataForExecutive />} allowedRoles={['sales_executive']} />} />
            <Route path="/sales-executive/sales-data-detail-page/:id?" element={<ProtectedRoute element={<SalesDataDetailPageForExecutive />} allowedRoles={['sales_executive']} />} />
            

            {/* leads */}
            <Route path="/sales-executive/leads" element={<ProtectedRoute element={<LeadsPage />} allowedRoles={['sales_executive']} />} />
            <Route path="/sales-executive/leads/:id" element={<ProtectedRoute element={<LeadDetailPage />} allowedRoles={['sales_executive']} />} />
            <Route path="/sales-executive/new-lead" element={<ProtectedRoute element={<AddNewLead />} allowedRoles={['sales_executive']} />} />
            <Route path="/sales-executive/leads/:id/job/:jobId" element={<ProtectedRoute element={<LeadJobPage />} allowedRoles={['sales_executive']} />} />
             <Route path="/sales-executive/meta-leads/:id/job/:jobId" element={<ProtectedRoute element={<LeadJobPage />} allowedRoles={['sales_executive']} />} />
            <Route path="/sales-executive/leads/:id/new-job" element={<ProtectedRoute element={<NewLeadJobPage />} allowedRoles={['sales_executive']} />} />
            <Route path="/sales-executive/meta-leads/:id/new-job" element={<ProtectedRoute element={<NewLeadJobPage />} allowedRoles={['sales_executive']} />} />
            <Route path="/sales-executive/add-new-lead" element={<ProtectedRoute element={<AddNewLead />} allowedRoles={['sales_executive']} />} />

            <Route path="/data-entry-executive" element={<ProtectedRoute element={<DataEntryExecutiveDashboard />} allowedRoles={['data_entry_executive']} />} />
              <Route path="/data-entry-executive/add-update-lead" element={<ProtectedRoute element={<AddUpdateLead />} allowedRoles={['data_entry_executive']} />} />
              <Route path="/data-entry-executive/leads-table" element={<ProtectedRoute element={<LeadsTable />} allowedRoles={['data_entry_executive']} />} />
            <Route path="/data-entry-table" element={<ProtectedRoute element={<DataEntryTable />} allowedRoles={['sales_executive', 'sales_manager']} />} />
            <Route path="/job-description-request" element={<ProtectedRoute element={<JobDescriptionRequestPage />} allowedRoles={['sales_executive', 'sales_manager', 'recruitment_manager', 'admin']} />} />
            <Route path="/add-data-entry" element={<ProtectedRoute element={<AddDataEntry />} allowedRoles={['sales_executive', 'sales_manager']} />} />
            <Route path="/data-entry/edit/:id" element={<ProtectedRoute element={<EditDataEntry />} allowedRoles={['admin', 'sales_manager', 'data_entry_executive']} />} />

            <Route path="/recruitment-manager" element={<ProtectedRoute element={<RecruitmentManagerDashboard />} allowedRoles={['recruitment_manager']} />} />
            <Route path="/recruitment-manager/resumes" element={<ProtectedRoute element={<Resume />} allowedRoles={['recruitment_manager']} />} />
            <Route path="/recruitment-manager/google-form" element={<ProtectedRoute element={<GoogleForm />} allowedRoles={['recruitment_manager']} />} />
            <Route path="/recruitment-manager/add-google-form" element={<ProtectedRoute element={<AddGoogleForm />} allowedRoles={['recruitment_manager']} />} />
            <Route path="/recruitment-manager/edit-google-form/:id" element={<ProtectedRoute element={<EditGoogleForm />} allowedRoles={['recruitment_manager']} />} />
            <Route path="/admin/screening-forms" element={<ProtectedRoute element={<ScreenListing />} allowedRoles={['admin']} />} />
            <Route path="/admin/available-questionnaires" element={<ProtectedRoute element={<AvailableQuestionnairesPage />} allowedRoles={['admin']} />} />
            <Route path="/admin/response-analysis/:jobId?" element={<ProtectedRoute element={<ResponseAnalysis />} allowedRoles={['admin']} />} />
            <Route path="/admin/google-form" element={<ProtectedRoute element={<GoogleForm />} allowedRoles={['admin']} />} />
            <Route path="/admin/add-google-form" element={<ProtectedRoute element={<AddGoogleForm />} allowedRoles={['admin']} />} />
            <Route path="/admin/edit-google-form/:id" element={<ProtectedRoute element={<EditGoogleForm />} allowedRoles={['admin']} />} />
            <Route path="/recruitment-manager/screening-forms" element={<ProtectedRoute element={<ScreenListing />} allowedRoles={['recruitment_manager']} />} />
            <Route path="/recruitment-manager/available-questionnaires" element={<ProtectedRoute element={<AvailableQuestionnairesPage />} allowedRoles={['recruitment_manager']} />} />
            <Route path="/recruitment-manager/response-analysis/:jobId?" element={<ProtectedRoute element={<ResponseAnalysis />} allowedRoles={['recruitment_manager']} />} />
            <Route path="/recruitment-executive" element={<ProtectedRoute element={<RecruitementExecutiveDashboard />} allowedRoles={['recruitment_executive']} />} />
            <Route path="/recruitment-executive/resumes" element={<ProtectedRoute element={<Resume />} allowedRoles={['recruitment_executive']} />} />
            <Route path="/recruitment-executive/google-form" element={<ProtectedRoute element={<GoogleForm />} allowedRoles={['recruitment_executive']} />} />
            <Route path="/recruitment-executive/add-google-form" element={<ProtectedRoute element={<AddGoogleForm />} allowedRoles={['recruitment_executive']} />} />
            <Route path="/recruitment-executive/edit-google-form/:id" element={<ProtectedRoute element={<EditGoogleForm />} allowedRoles={['recruitment_executive']} />} />
            <Route path="/recruitment-executive/screening-forms" element={<ProtectedRoute element={<ScreenListing />} allowedRoles={['recruitment_executive']} />} />
            <Route path="/recruitment-executive/available-questionnaires" element={<ProtectedRoute element={<AvailableQuestionnairesPage />} allowedRoles={['recruitment_executive']} />} />
            <Route path="/recruitment-executive/response-analysis/:jobId?" element={<ProtectedRoute element={<ResponseAnalysis />} allowedRoles={['recruitment_executive']} />} />
            <Route path="/recruitment/projects" element={<ProtectedRoute element={<AssignedProjectsPage />} allowedRoles={['admin', 'recruitment_manager', 'recruitment_executive', 'project_manager']} />} />
            <Route path="/recruitment/project-listing-page/:clientId" element={<ProtectedRoute element={<RecruitmentProjectListing />} allowedRoles={['admin', 'recruitment_manager', 'recruitment_executive']} />} />
            <Route path="/accountant" element={<ProtectedRoute element={<AccountantDashboard />} allowedRoles={['accountant','admin']} />} />
            <Route path="/accountant/invoices" element={<ProtectedRoute element={<AccountantInvoices />} allowedRoles={['accountant','admin']} />} />

            {/* Project Manager (read-only) */}
            <Route path="/project-manager" element={<ProtectedRoute element={<ProjectManagerDashboard />} allowedRoles={['project_manager']} />} />
            <Route path="/project-manager/projects" element={<Navigate to="/recruitment/projects" replace />} />
            <Route path="/project-manager/project-listing-page/:clientId" element={<ProtectedRoute element={<RecruitmentProjectListing />} allowedRoles={['project_manager', 'admin', 'recruitment_manager', 'recruitment_executive']} />} />
            <Route path="/project-manager/job-headhunting/:jobId" element={<ProtectedRoute element={<JobHeadhunting />} allowedRoles={['project_manager', 'admin', 'recruitment_manager', 'recruitment_executive']} />} />
            <Route path="/project-manager/follow-up" element={<ProtectedRoute element={<ProjectManagerFollowUp />} allowedRoles={['project_manager']} />} />
            <Route path="/admin/follow-up" element={<ProtectedRoute element={<CommonLeadsFollowUp />} allowedRoles={['admin']} />} />
            <Route path="/sales-manager/follow-up" element={<ProtectedRoute element={<CommonLeadsFollowUp />} allowedRoles={['sales_manager']} />} />
            <Route path="/sales-executive/follow-up" element={<ProtectedRoute element={<CommonLeadsFollowUp />} allowedRoles={['sales_executive']} />} />

            <Route path="/marketing-manager/dashboard" element={<ProtectedRoute element={<MarketingManager/>} allowedRoles={['marketing_manager']}/> } />
            <Route path="/marketing-manager/main-stats" element={<ProtectedRoute element={<MainStatsPage/>} allowedRoles={['marketing_manager', 'admin']}/> } />
            <Route path="/admin/main-stats" element={<ProtectedRoute element={<MainStatsPage/>} allowedRoles={['admin']}/> } />
                <Route path="/marketing_manager/meta-leads" element={<ProtectedRoute element={<MetaLeads />} allowedRoles={['marketing_manager']} />} />
                <Route path="/marketing_manager/leads" element={<ProtectedRoute element={<LeadsPage />} allowedRoles={['marketing_manager']} />} />
                <Route path="/marketing_manager/meta-spending" element={<ProtectedRoute element={<MetaSpendingList />} allowedRoles={['marketing_manager']} />} />
                <Route path="/marketing_manager/meta-spending/:id" element={<ProtectedRoute element={<MetaSpendingDetail />} allowedRoles={['marketing_manager']} />} />
                <Route path="/marketing_manager/meta-spending-adsets" element={<ProtectedRoute element={<MetaSpendingAdsets />} allowedRoles={['marketing_manager']} />} />
                <Route path="/marketing_manager/meta-spending-ads" element={<ProtectedRoute element={<MetaSpendingAds />} allowedRoles={['marketing_manager']} />} />
                <Route path="/marketing_manager/meta-spending-ad-insights" element={<ProtectedRoute element={<MetaSpendingAdInsights />} allowedRoles={['marketing_manager']} />} />
                <Route path="/marketing_manager/meta-spending-campaign-detail" element={<ProtectedRoute element={<MetaSpendingCampaignDetail />} allowedRoles={['marketing_manager']} />} />
                <Route path="/marketing_manager/meta-spending-adset-detail" element={<ProtectedRoute element={<MetaSpendingAdsetDetail />} allowedRoles={['marketing_manager']} />} />
                <Route path="/marketing_manager/meta-spending-ad-detail" element={<ProtectedRoute element={<MetaSpendingAdDetail />} allowedRoles={['marketing_manager']} />} />
                <Route path="/marketing_manager/meta-spending-ad-insight-detail" element={<ProtectedRoute element={<MetaSpendingAdInsightDetail />} allowedRoles={['marketing_manager']} />} />

            <Route path="/client-head-hunting/:clientId" element={<ProtectedRoute element={<ClientHeadhunting />} allowedRoles={['admin', 'recruitment_manager', 'recruitment_executive','sales_executive', 'sales_manager','project_manager']} />} />
            <Route path="/job-headhunting/:jobId" element={<ProtectedRoute element={<JobHeadhunting />} allowedRoles={['admin', 'recruitment_manager', 'recruitment_executive','sales_executive', 'sales_manager','project_manager']} />} />
            <Route path="/recruitment/job-headhunting/:jobId" element={<ProtectedRoute element={<JobHeadhunting />} allowedRoles={['admin', 'recruitment_manager', 'recruitment_executive','project_manager']} />} />
            <Route path="/add-new-job-headhunting" element={<ProtectedRoute element={<AddNewJobHeadhunting />} allowedRoles={['admin','sales_executive', 'sales_manager']} />} />
            <Route path="/add-new-client-headhunting" element={<ProtectedRoute element={<AddNewClientHeadhunting />} allowedRoles={['admin','sales_executive', 'sales_manager']} />} />
            <Route path="/add-new-project-headhunting" element={<ProtectedRoute element={<AddNewProjectHeadhunting />} allowedRoles={['admin','sales_executive', 'sales_manager']} />} />
            <Route path="/sales-manager/edit-client/:id" element={<ProtectedRoute element={<EditClient />} allowedRoles={['admin', 'recruitment_manager', 'recruitment_executive','sales_executive', 'sales_manager']} />} />
            <Route path="/edit-project-headhunting/:id" element={<ProtectedRoute element={<EditProjectHeadhunting />} allowedRoles={['admin', 'recruitment_manager', 'recruitment_executive','sales_executive', 'sales_manager']} />} />
            <Route path="/project-payments/:projectId" element={<ProtectedRoute element={<ProjectPayments />} allowedRoles={['admin', 'recruitment_manager', 'recruitment_executive', 'sales_manager', 'sales_executive', 'project_manager']} />} />
            <Route path="/edit-job-headhunting/:id" element={<ProtectedRoute element={<EditJobHeadhunting />} allowedRoles={['admin','sales_executive', 'sales_manager', 'recruitment_manager', 'recruitment_executive']} />} />
            <Route path="/edit-client-headhunting/:id" element={<ProtectedRoute element={<EditClientHeadhunting />} allowedRoles={['admin','sales_executive', 'sales_manager']} />} />

            {/* Fallback 404 route */}
            <Route path="*" element={<NotFoundPage />} />
            
            
          </RoleRoutes>
          </>
        )
      ) : (
        // Routes without layout (for login)
        <Routes>

          {/* Fallback 404 route for public routes */}
          <Route path="*" element={<NotFoundPage />} />

          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      )}
    </>
  );
}

// AppWrapper to enable `useLocation` hook in `App`
function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;

