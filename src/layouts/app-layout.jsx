import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import AdminShell from './admin-shell.jsx';
import useUserStore from '../pages/shared/store/user-store.js';
import { getRoleHome, getRolePath } from '../pages/auth/role-home.js';
import { getLayoutRole, canAccessMenu, isSuperAdmin } from '../pages/auth/role-access.js';
import { getProjectPaymentCount, getSidebarStats } from '../pages/shared/services/headhunting.js';
import {
  LayoutDashboard as DashboardOutlined, UserPlus,
  UserStar, User as UserOutlined,
  FolderOpen as FolderOpenOutlined, Settings as SettingOutlined,
  Target as AimOutlined, ChartNoAxesCombined as LineChartOutlined,
  Globe as GlobalOutlined, FolderKanban as ProjectOutlined,
  Database as DatabaseOutlined, Calendar as CalendarOutlined,
  ClipboardCheck as CarryOutOutlined, ChartBar as AuditOutlined,
  FileSearch as FileSearchOutlined, SlidersHorizontal as SlidersOutlined,
  DollarSign as DollarOutlined, FileCheck as FileDoneOutlined,
  FileText as FileTextOutlined, Building2,
} from 'lucide-react';

export default function AppLayout({ children, role }) {
  const { user: storedUser } = useUserStore();
  const signedInUser = { ...storedUser, user_type: role || storedUser?.user_type };
  const user = { ...signedInUser, user_type: getLayoutRole(signedInUser?.user_type) };
  const routerNavigate = useNavigate();
  const navigate = path => routerNavigate(getRolePath(signedInUser?.user_type, path));
  const location = useLocation();

  // Temporarily disabled: /headhunting/project-payment-count is 404ing on this backend
  const isInvoiceBadgeEnabled = false;

  const { data: invoiceCount = 0 } = useQuery(
    ['sidebarInvoiceCount', user?.id, user?.user_type],
    async () => {
      const counts = await getProjectPaymentCount();
      return Number(counts?.pending ?? 0);
    },
    {
      enabled: isInvoiceBadgeEnabled,
      refetchOnWindowFocus: true,
      refetchInterval: 60 * 1000,
      staleTime: 30 * 1000,
    }
  );

  const isJdRequestBadgeEnabled = canAccessMenu(signedInUser?.user_type, '25') &&
    (user?.user_type === 'recruitment_manager' || user?.user_type === 'admin');

  const { data: pendingJdRequestCount = 0 } = useQuery(
    ['sidebarPendingJdRequestCount', user?.id, user?.user_type],
    async () => {
      const stats = await getSidebarStats(user?.user_type);
      return Number(stats?.pending_job_description_count ?? 0);
    },
    {
      enabled: isJdRequestBadgeEnabled,
      refetchOnWindowFocus: true,
      refetchInterval: 60 * 1000,
      staleTime: 30 * 1000,
    }
  );


  const getMenuKeyFromPath = (path) => {
    if (/^\/(super-admin|admin)\/companies(?:\/|$)/.test(path)) return '26';
    if (
      path === '/admin' || path === '/super-admin' || path === '/company-admin' ||
      path === '/manager' ||
      path === '/executive' ||
      path === '/marketing-manager/dashboard' ||
      path === '/project-manager'
    ) return '1';
    if (
      path.includes('/user-management') ||
      path.includes('/target-detail') ||
      path.includes('/edit-user') || // Added for edit user
      path.includes('/create-user')   // Added for create user
      
    ) return '2';
    if (path.includes('/sales-manager-listing') || path.includes('/sales-manager-detail')) return '3';
    if (path.includes('/sales-executive-listing') || path.includes('/sales-executive-detail')) return '4';
    if (
      /\/project-listing(\/|$)/.test(path) ||
      /\/project-detail(\/|$)/.test(path) ||
      /\/project-application(\/|$)/.test(path) ||
      path.includes('/admin/deleted-projects')
    ) return '6';
    if (path.includes('/target-listing')) return '7';
    if (path.includes('/admin/jobs') || path.includes('/admin/deleted-jobs')) return '18';
    if (path.includes('/marketing-manager/main-stats') || path.includes('/admin/main-stats')) return '19';
    if (path.includes('/admin/audit-history-list')) return '20';
    if (path === '/settings' || path.includes('/admin/settings')) return '21';
    if (path.includes('/deliverables')) return '23';
    // Follow-up for project manager, sales manager and sales executive
    if (
      path.includes('/admin/follow-up') ||
      path.includes('/project-manager/follow-up') ||
      path.includes('/sales-manager/follow-up') ||
      path.includes('/sales-executive/follow-up')
    ) return '17';
    // Assigned Projects (check this first to take priority over general client/project routes)
    if (
      path.includes('/recruitment/projects') ||
      path.includes('/recruitment/project-listing-page') ||
      path.includes('/recruitment/job-headhunting') ||
      path.includes('/project-manager/projects') ||
      path.includes('/project-manager/project-listing-page') ||
      path.includes('/project-manager/job-headhunting') ||
      path.includes('/response-analysis')
    ) return '13';
    if (path.includes('/accountant/invoices')) return '24';
    if (path.includes('/job-description-request')) return '25';
    // Client and Project routes
    if (
      /^\/(admin|sales-manager|sales-executive)?\/?headhunting-client/.test(path) ||
      path.includes('/admin/deleted-clients') ||
      path.includes('/admin/client-head-hunting') ||
      path.includes('/client-head-hunting') ||
      path.includes('/project-listing-page') ||
      path.includes('/add-new-client-headhunting') ||
      path.includes('/add-new-job-headhunting') ||
        path.includes('/edit-project-headhunting') ||
      path.includes('/add-new-project-headhunting') ||
      path.includes('/job-headhunting') ||
      path.includes('/edit-client-headhunting')
    ) return '8';
    // Meta Leads
    if (path.includes('/meta-leads')) return '9';
    if (path.includes('/sales-executive/meta-leads')) return '9';
     if (path.includes('/marketing-manager/meta-leads')) return '9';
     if (path.includes('/marketing_manager/meta-leads')) return '9';
    if (path.includes('/meta-spending')) return '22';
    if (path.includes('/data-leads') || /\/data-lead(\/|$)/.test(path)) return '15';
    // Resumes
    if (
      path.includes('/resumes') ||
      path.includes('/resume-upload') ||
      path.includes('/cv-listing') ||
      path.includes('/profile-listing') ||
      path.includes('/candidate-listings')
    ) {
      return '14';
    }
    // Screening Questionnaire
    if (path.includes('/google-form') || path.includes('/screening-forms') || path.includes('/available-questionnaires') || path.includes('/edit-google-form') || path.includes('/add-google-form') || path.includes('/admin/screening-forms')) return '16';
    // Sales Data
    if (
      path.includes('/sales-data') ||
      path.includes('/set-data') ||
      path.includes('/view-sales-data')
    ) return '11';
    // Leads
    if (/\/leads(\/|$)/.test(path) || path.includes('/add-new-lead')) return '10';
    if (path === '/data-entry-table' || path === '/admin/data-entry-table') return '11';
    if (path === '/add-data-entry') return '12';
    return '1'; // default
  };


  const selectedKey = getMenuKeyFromPath(location.pathname.replace(/^\/(super-admin|company-admin)(?=\/|$)/, '/admin'));
  const userTypeMapping = {
    admin: 'admin',
    sales_executive: 'sales-executive',
    sales_manager: 'sales-manager',
    recruitment_manager: 'recruitment-manager',
    recruitment_executive: 'recruitment-executive',
    accountant: 'accountant', // Added accountant
    marketing_manager: 'marketing_manager',
    project_manager: 'project-manager',
  };

  const handleMenuClick = ({ key }) => {
    if (!menuItems.some(item => item.key === key)) return;
    switch (key) {
      case '26':
        if (isSuperAdmin(signedInUser?.user_type)) navigate('/super-admin/companies');
        break;
      case '1':
        if (user.user_type === 'accountant') {
          navigate('/accountant');

        }else if (user.user_type === 'marketing_manager') {
          navigate('/marketing-manager/dashboard'); }
        else if (user.user_type === 'project_manager') {
          navigate('/project-manager');
        }
        else {
          navigate(getRoleHome(signedInUser?.user_type));
        }
        break;
      case '2':
        if (user.user_type === 'admin') {
          navigate(`/${userTypeMapping[user.user_type]}/user-management`);
        }
        break;
      case '3':
        if (user.user_type === 'admin') {
          navigate(`/${userTypeMapping[user.user_type]}/sales-manager-listing`);
        }
        break;
      case '4':
        if (user.user_type === 'admin') {
          navigate('/admin/sales-executive-listing');
        } else if (user.user_type === 'sales_manager') {
          navigate('/sales-manager/sales-executive-listing');
        }
        break;
      case '6':
        navigate(`/${userTypeMapping[user.user_type]}/project-listing`);
        break;
      case '7':
        navigate(`/${userTypeMapping[user.user_type]}/target-listing`);
        break;
      case '8':
        navigate('/headhunting-client');
        break;
      case '25':
        navigate('/job-description-request');
        break;
      case '9':
        navigate(`/${userTypeMapping[user.user_type]}/meta-leads`);
        break;
      case '10':
        if (user.user_type === 'marketing_manager') {
          navigate('/marketing_manager/leads');
        } else {
          navigate(`/${userTypeMapping[user.user_type]}/leads`);
        }
        break;
      case '15':
        navigate('/data-leads');
        break;
      case '11':
        if (user.user_type === 'admin') {
          navigate('/admin/data-entry-table');
        } else if (user.user_type === 'sales_executive' || user.user_type === 'sales_manager') {
          navigate('/data-entry-table');
        }
        break;
      case '12':
        if (user.user_type === 'sales_executive' || user.user_type === 'sales_manager') {
          navigate('/add-data-entry');
        }
        break;
      case '13':
        if (user.user_type === 'recruitment_manager' || user.user_type === 'recruitment_executive') {
          navigate('/recruitment/projects');
        } else if (user.user_type === 'project_manager') {
          navigate('/project-manager/projects');
        }
        break;
      case '24':
        if (user.user_type === 'accountant' || user.user_type === 'admin') {
          navigate('/accountant/invoices');
        }
        break;
      case '14':
        if (user.user_type === 'admin') {
          navigate('/admin/resumes');
        } else if (user.user_type === 'recruitment_manager') {
          navigate('/recruitment-manager/resumes');
        } else if (user.user_type === 'recruitment_executive') {
          navigate('/recruitment-executive/resumes');
        }
        break;
      case '16':
        if (user.user_type === 'admin') {
          navigate('/admin/screening-forms');
        } else if (user.user_type === 'recruitment_manager') {
          navigate('/recruitment-manager/screening-forms');
        } else if (user.user_type === 'recruitment_executive') {
          navigate('/recruitment-executive/screening-forms');
        }
        break;
      case '17':
        if (user.user_type === 'admin') {
          navigate('/admin/follow-up');
        } else if (user.user_type === 'project_manager') {
          navigate('/project-manager/follow-up');
        } else if (user.user_type === 'sales_manager') {
          navigate('/sales-manager/follow-up');
        } else if (user.user_type === 'sales_executive') {
          navigate('/sales-executive/follow-up');
        }
        break;
      case '18':
        if (user.user_type === 'admin') {
          navigate('/admin/jobs');
        }
        break;
      case '19':
        if (user.user_type === 'marketing_manager') {
          navigate('/marketing-manager/main-stats');
        } else if (user.user_type === 'admin') {
          navigate('/admin/main-stats');
        }
        break;
      case '20':
        if (user.user_type === 'admin') {
          navigate('/admin/audit-history-list');
        }
        break;
      case '21':
        if (user.user_type === 'admin') {
          navigate('/admin/settings');
        }
        break;
      case '22':
        if (user.user_type === 'admin' || user.user_type === 'marketing_manager') {
          navigate(`/${userTypeMapping[user.user_type]}/meta-spending`);
        }
        break;
      case '23':
        if (
          user.user_type === 'admin' ||
          user.user_type === 'recruitment_manager' ||
          user.user_type === 'recruitment_executive'
        ) {
          navigate(`/${userTypeMapping[user.user_type]}/deliverables`);
        }
        break;
      default:
        break;
    }
  };


  const getIconStyle = () => ({ className: '' });
  const baseMenu =
    user.user_type === 'project_manager'
      ? [
          { key: '1', icon: <DashboardOutlined className={getIconStyle('1').className} />, label: 'Dashboard' },
          { key: '8', icon: <UserOutlined className={getIconStyle('8').className} />, label: 'Clients' },
          { key: '13', icon: <ProjectOutlined className={getIconStyle('13').className} />, label: 'Projects' },
          { key: '17', icon: <CalendarOutlined className={getIconStyle('17').className} />, label: 'Follow-up' },
        ]
      : [
          { key: '1', icon: <DashboardOutlined className={getIconStyle('1').className} />, label: 'Dashboard' },
          ...(user.user_type === 'marketing_manager' || user.user_type === 'admin'
            ? [
                {
                  key: '19',
                  icon: <AuditOutlined className={getIconStyle('19').className} />,
                  label: 'Main Stats',
                },
              ]
            : []),
          ...(user.user_type === 'admin' ? [{ key: '6', icon: <ProjectOutlined className={getIconStyle('6').className} />, label: 'Projects' }] : []),
          ...(user.user_type === 'sales_executive' || user.user_type === 'sales_manager' || user.user_type === 'recruitment_manager' || user.user_type === 'admin' ? [{ key: '25', icon: <FileTextOutlined className={getIconStyle('25').className} />, label: 'JD Request' }] : []),
          ...( user.user_type !== 'marketing_manager' && user.user_type !== 'recruitment_manager' && user.user_type !== 'recruitment_executive' && user.user_type !== 'accountant' ? [{ key: '8', icon: <UserOutlined className={getIconStyle('8').className} />, label: 'Clients' }]:[]),
          ...(user.user_type === 'admin' ? [{ key: '18', icon: <CarryOutOutlined className={getIconStyle('18').className} />, label: 'Jobs' }] : []),
          ...(user.user_type === 'admin'
            ? [{ key: '20', icon: <FileSearchOutlined className={getIconStyle('20').className} />, label: 'User Activity' }]
            : []),
          ...(user.user_type !== 'recruitment_manager' && user.user_type !== 'recruitment_executive' && user.user_type !== 'accountant'
            ? [
                { key: '10', icon: <LineChartOutlined className={getIconStyle('10').className} />, label: 'Website Leads' },
                { key: '15', icon: <DatabaseOutlined className={getIconStyle('15').className} />, label: 'Data Leads' },
              ]
            : []),
          ...(user.user_type === 'admin' || user.user_type === 'sales_manager' || user.user_type === 'sales_executive' || user.user_type === 'marketing_manager' ? [
            { key: '9', icon: <GlobalOutlined className={getIconStyle('9').className} />, label: 'Meta Leads' },
          ] : []),
          ...(user.user_type === 'admin' || user.user_type === 'marketing_manager'
            ? [{ key: '22', icon: <DollarOutlined className={getIconStyle('22').className} />, label: 'Meta Spending' }]
            : []),
          ...(user.user_type === 'admin' || user.user_type === 'sales_manager' || user.user_type === 'sales_executive' ? [
            { key: '17', icon: <CalendarOutlined className={getIconStyle('17').className} />, label: 'Follow-up' },
          ] : []),
          ...(user.user_type === 'recruitment_manager' || user.user_type === 'recruitment_executive' ? [
            { key: '13', icon: <ProjectOutlined className={getIconStyle('13').className} />, label: 'Projects' },
          ] : []),
          ...(user.user_type === 'admin' || user.user_type === 'sales_manager' ? [
            { key: '11', icon: <FolderOpenOutlined className={getIconStyle('11').className} />, label: 'Sales Data' },
          ] : []),
          ...(user.user_type === 'accountant' || user.user_type === 'admin' ? [
            { key: '24', icon: <FolderOpenOutlined className={getIconStyle('24').className} />, label: 'Invoices' },
          ] : []),
        ];

  const roleMenuMap = {
    admin: [
      { key: '2', icon: <SettingOutlined className={getIconStyle('2').className} />, label: 'User Management' },
      // { key: '3', icon: <UserPlus className={getIconStyle('3').className} />, label: 'Sales Managers' },
      // { key: '4', icon: <UserStar className={getIconStyle('4').className} />, label: 'Sales Executives' },
      ...(isSuperAdmin(signedInUser?.user_type) ? [{ key: '26', icon: <Building2 />, label: 'Companies' }] : []),
      { key: '14', icon: <FolderOpenOutlined className={getIconStyle('14').className} />, label: 'CV Pool' },
      { key: '16', icon: <AimOutlined className={getIconStyle('16').className} />, label: 'Questionnaires' },
      { key: '23', icon: <FileDoneOutlined className={getIconStyle('23').className} />, label: 'Deliverables' },
      {
        key: '21',
        icon: <SlidersOutlined className={getIconStyle('21').className} />,
        label: 'Settings',
      },
    ],
    sales_manager: [
      { key: '4', icon: <UserStar className={getIconStyle('4').className} />, label: 'Sales Executives' },
    ],
    sales_executive: [
    ],
    recruitment_manager: [
      { key: '16', icon: <AimOutlined className={getIconStyle('16').className} />, label: 'Questionnaires' },
      { key: '14', icon: <FolderOpenOutlined className={getIconStyle('14').className} />, label: 'CV Pool' },
      { key: '23', icon: <FileDoneOutlined className={getIconStyle('23').className} />, label: 'Deliverables' },
    ],
    recruitment_executive: [
      { key: '16', icon: <AimOutlined className={getIconStyle('16').className} />, label: 'Questionnaires' },
      { key: '14', icon: <FolderOpenOutlined className={getIconStyle('14').className} />, label: 'CV Pool' },
      { key: '23', icon: <FileDoneOutlined className={getIconStyle('23').className} />, label: 'Deliverables' },
    ],
    accountant: [], // No extra tabs for accountant
    project_manager: [],
  };

  const menuGroupByKey = {
    '1': 'Overview', '19': 'Overview',
    '9': 'Leads & Sales', '10': 'Leads & Sales', '15': 'Leads & Sales',
    '17': 'Leads & Sales', '11': 'Leads & Sales', '12': 'Leads & Sales', '22': 'Leads & Sales',
    '2': 'Team Management', '3': 'Team Management', '4': 'Team Management', '7': 'Team Management',
    '6': 'Clients & Projects', '8': 'Clients & Projects', '13': 'Clients & Projects',
    '18': 'Recruitment', '25': 'Recruitment', '14': 'Recruitment', '16': 'Recruitment', '23': 'Recruitment',
    '24': 'Finance', '20': 'Administration', '21': 'Administration', '26': 'Administration',
  };
  const menuItems = [...baseMenu, ...(roleMenuMap[user.user_type] || [])]
    .filter(item => canAccessMenu(signedInUser?.user_type, item.key))
    .map(item => ({ ...item, group: menuGroupByKey[item.key] || 'Workspace' }));
  const sidebarBadgeByKey = {
    ...(isInvoiceBadgeEnabled ? { '24': invoiceCount } : {}),
    ...(isJdRequestBadgeEnabled ? { '25': pendingJdRequestCount } : {}),
  };

  return <AdminShell menuItems={menuItems} selectedKey={selectedKey} onSelect={handleMenuClick} badges={sidebarBadgeByKey}>{children}</AdminShell>;
}
