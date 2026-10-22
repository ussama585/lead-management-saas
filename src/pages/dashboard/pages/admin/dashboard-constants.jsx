//icons
import { UserPlus, UserStar, User as UserOutlined, Users as TeamOutlined, FolderKanban as ProjectOutlined, FileText as FileTextOutlined, Database as DatabaseOutlined, Webhook as ApiOutlined, UsersRound as UsergroupAddOutlined, ContactRound as SolutionOutlined, ChartBar as AuditOutlined, ChartColumn as BarChartOutlined, Contact as IdcardOutlined } from 'lucide-react';

export const statsConfig = [
  {
    key: 'user_stats',
    title: 'Total Users',
    iconComponent: <UserOutlined size="1em" className="app-icon" style={{ fontSize: 32, color: '#1890ff' }} />,
    color: '#1890ff',
    useSmallCard: false,
  },
  {
    key: 'sales_manager_stats',
    title: 'Sales Managers',
    iconComponent: <UserPlus />,
    color: '#FF6666',
    useSmallCard: false,
  },
  {
    key: 'sales_executive_stats',
    title: 'Sales Executives',
    iconComponent: <UserStar />,
    color: '#3E6A9F',
    useSmallCard: false,
  },
  {
    key: 'recruitment_manager_stats',
    title: 'Recruitment Managers',
    iconComponent: <TeamOutlined size="1em" className="app-icon" style={{ fontSize: 32, color: '#52c41a' }} />,
    color: '#52c41a',
    useSmallCard: false,
  },
  {
    key: 'recruitment_executive_stats',
    title: 'Recruitment Executives',
    iconComponent: <UsergroupAddOutlined size="1em" className="app-icon" style={{ fontSize: 32, color: '#722ed1' }} />,
    color: '#722ed1',
    useSmallCard: false,
  },
  {
    key: 'marketing_manager_stats',
    title: 'Marketing Managers',
    iconComponent: <BarChartOutlined size="1em" className="app-icon" style={{ fontSize: 32, color: '#fa8c16' }} />,
    color: '#fa8c16',
    useSmallCard: false,
  },
  {
    key: 'accountant_stats',
    title: 'Accountants',
    iconComponent: <AuditOutlined size="1em" className="app-icon" style={{ fontSize: 32, color: '#13c2c2' }} />,
    color: '#13c2c2',
    useSmallCard: false,
  },
  {
    key: 'data_entry_executive',
    title: 'Data Entry Executives',
    iconComponent: <DatabaseOutlined size="1em" className="app-icon" style={{ fontSize: 32, color: '#8A2BE2' }} />,
    color: '#8A2BE2',
    useSmallCard: false,
  },
  {
    key: 'headhunting_client_stats',
    title: 'Clients',
    iconComponent: <SolutionOutlined size="1em" className="app-icon" style={{ fontSize: 28, color: '#eb2f96' }} />,
    color: '#eb2f96',
    useSmallCard: true,
  },
  {
    key: 'headhunting_project_stats',
    title: 'Projects',
    iconComponent: <ProjectOutlined size="1em" className="app-icon" style={{ fontSize: 28, color: '#f5222d' }} />,
    color: '#f5222d',
    useSmallCard: true,
  },
  {
    key: 'headhunting_jobs_stats',
    title: 'Jobs',
    iconComponent: <FileTextOutlined size="1em" className="app-icon" style={{ fontSize: 28, color: '#a0d911' }} />,
    color: '#a0d911',
    useSmallCard: true,
  },
  {
    key: 'data_leads_stats',
    title: 'Data Leads',
    iconComponent: <DatabaseOutlined size="1em" className="app-icon" style={{ fontSize: 28, color: '#40a9ff' }} />,
    color: '#40a9ff',
    useSmallCard: true,
  },
  {
    key: 'meta_leads_stats',
    title: 'Meta Leads',
    iconComponent: <ApiOutlined size="1em" className="app-icon" style={{ fontSize: 28, color: '#36cfc9' }} />,
    color: '#36cfc9',
    useSmallCard: true,
  },
  {
    key: 'lead_generation_request_stats',
    title: 'Website Leads',
    iconComponent: <UsergroupAddOutlined size="1em" className="app-icon" style={{ fontSize: 28, color: '#95de64' }} />,
    color: '#95de64',
    useSmallCard: true,
  },
];

/** System Stats tab — CV Pool row (`/admin-stats/`: candidate_profile_stats, candidate_resume_stats) */
export const cvPoolSystemStatsConfig = [
  {
    key: 'candidate_profile_stats',
    title: 'Candidate Profiles',
    iconComponent: <IdcardOutlined size="1em" className="app-icon" style={{ fontSize: 28, color: '#2f54eb' }} />,
    color: '#2f54eb',
  },
  {
    key: 'candidate_resume_stats',
    title: 'Resumes',
    iconComponent: <FileTextOutlined size="1em" className="app-icon" style={{ fontSize: 28, color: '#9254de' }} />,
    color: '#9254de',
  },
];
