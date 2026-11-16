import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import { LogOut, Command, KeyRound, Settings, House, UsersRound, BriefcaseBusiness, Globe, Database, ContactRound, CalendarClock, Building2, FolderKanban, ReceiptText, FileUser, ClipboardList, ChartNoAxesCombined, History, Presentation, BadgeCheck, CircleDollarSign } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar.jsx';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu.jsx';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import useUserStore from '@/pages/shared/store/user-store.js';
import { getRolePath } from '@/pages/auth/role-home.js';
import { isSuperAdmin } from '@/pages/auth/role-access.js';
import ChangePasswordDialog from '@/components/change-password-dialog.jsx';
import './admin-shell.css';

const copyrightYear = new Date().getFullYear();

const navigationIcons = {
  Dashboard: House, 'User Management': UsersRound, 'Sales Managers': UsersRound,
  'Sales Executives': ContactRound, Clients: ContactRound, Companies: Building2,
  Jobs: BriefcaseBusiness, Projects: FolderKanban, 'Website Leads': Globe,
  'Data Leads': Database, 'Meta Leads': ContactRound, 'Sales Data': Database,
  'Follow-up': CalendarClock, Invoices: ReceiptText, 'CV Pool': FileUser,
  Questionnaires: ClipboardList, 'Main Stats': ChartNoAxesCombined,
  'User Activity': History, 'Demo Request': Presentation, Deliverables: BadgeCheck,
  'Meta Spending': CircleDollarSign, 'JD Request': ClipboardList, Settings,
};

function ShellContents({ children, menuItems, selectedKey, onSelect, badges }) {
  const { user, clearUser } = useUserStore();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile, setOpenMobile } = useSidebar();
  const role = isSuperAdmin(user?.user_type) ? 'super admin' : (user?.user_type || '').replaceAll('_', ' ');
  const active = menuItems.find(item => item.key === selectedKey);
  const menuGroups = new Map();
  for (const item of menuItems) {
    const group = item.group || 'Workspace';
    if (!menuGroups.has(group)) menuGroups.set(group, []);
    menuGroups.get(group).push(item);
  }
  const orderedMenuGroups = Array.from(menuGroups).sort(([first], [second]) =>
    Number(first === 'Administration') - Number(second === 'Administration'));
  const initials = (user?.name || 'User').split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
  useEffect(() => { setOpenMobile(false); }, [location.pathname, setOpenMobile]);
  function logout() {
    queryClient.cancelQueries();
    queryClient.clear();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    Object.keys(sessionStorage).filter(key => key.startsWith('tableState_')).forEach(key => sessionStorage.removeItem(key));
    clearUser();
    navigate(isSuperAdmin(user?.user_type) ? '/super-admin/login' : '/', { replace: true });
  }
  function select(key) {
    onSelect({ key });
    if (isMobile) setOpenMobile(false);
  }
  return <>
    <a href='#main-content' className='sop-skip'>Skip to content</a>
    <Sidebar collapsible='icon' variant='inset' className='[&_[data-slot=sidebar-inner]]:rounded-2xl [&_[data-slot=sidebar-inner]]:border [&_[data-slot=sidebar-inner]]:border-primary/15 [&_[data-slot=sidebar-inner]]:bg-background [&_[data-slot=sidebar-inner]]:shadow-sm'>
      <SidebarHeader className='border-b border-primary/10 pb-3 pt-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1'>
        <SidebarMenu><SidebarMenuItem><SidebarMenuButton size='lg' aria-label='Search O Pal home' className='hover:bg-primary/5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!' onClick={() => select('1')}>
          <div className='flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm'><Command className='size-4' /></div>
          <div className='grid min-w-0 flex-1 gap-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden'><span className='truncate font-semibold text-primary'>Search O Pal</span><span className='truncate text-xs capitalize text-muted-foreground'>{role} workspace</span></div>
        </SidebarMenuButton></SidebarMenuItem></SidebarMenu>
      </SidebarHeader>
      <SidebarContent className='gap-0 py-1.5'>{orderedMenuGroups.map(([group, items]) => <SidebarGroup key={group} aria-label={group} className='py-1 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1'>
        <SidebarGroupLabel className='relative mb-1 text-[11px] group-data-[collapsible=icon]:hidden font-bold uppercase tracking-widest text-primary after:absolute after:bottom-0 after:left-2 after:h-0.5 after:w-8 after:rounded-full after:bg-primary'>{group}</SidebarGroupLabel><SidebarGroupContent>
        <SidebarMenu className='gap-0.5 group-data-[collapsible=icon]:items-center'>{items.map(item => {
          const Icon = navigationIcons[item.label];
          return <SidebarMenuItem key={item.key}>
          <SidebarMenuButton className='before:absolute before:inset-x-0 before:bottom-0 before:h-0.5 before:origin-left before:scale-x-0 before:bg-primary before:transition-transform before:duration-300 hover:before:scale-x-100 focus-visible:before:scale-x-100 motion-reduce:before:transition-none relative h-8 gap-3 rounded-md px-3 text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary active:bg-primary/10 data-[active=true]:bg-transparent data-[active=true]:font-semibold data-[active=true]:text-primary data-[active=true]:after:absolute data-[active=true]:after:inset-y-1 data-[active=true]:after:right-0 data-[active=true]:after:w-[5px] data-[active=true]:after:rounded-full data-[active=true]:after:bg-primary [&>svg]:size-5 [&>svg]:stroke-[1.75] data-[active=true]:[&>svg]:stroke-[2.25] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:[&>span]:hidden group-data-[collapsible=icon]:after:hidden group-data-[collapsible=icon]:before:hidden group-data-[collapsible=icon]:data-[active=true]:bg-primary/10' tooltip={item.label} isActive={item.key === selectedKey} onClick={() => select(item.key)}>
            {Icon ? <Icon /> : item.icon}<span>{item.label}</span>
          </SidebarMenuButton>
          {Number(badges[item.key]) > 0 && <SidebarMenuBadge className='right-3 rounded-full bg-primary px-2 text-primary-foreground peer-hover/menu-button:text-primary-foreground'>{badges[item.key] > 99 ? '99+' : badges[item.key]}</SidebarMenuBadge>}
        </SidebarMenuItem>; })}</SidebarMenu>
      </SidebarGroupContent></SidebarGroup>)}</SidebarContent>

    </Sidebar>
    <SidebarInset className='min-w-0'>
      <header className='sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-primary/10 bg-background px-4'>
        <SidebarTrigger className='rounded-lg border border-primary/15 bg-primary/5 text-primary transition-colors hover:bg-primary/10 hover:text-primary' /><Separator orientation='vertical' className='h-4 bg-primary/15' />
        <span className='min-w-0 truncate text-sm font-semibold text-primary'>{location.pathname.endsWith('/settings') ? 'Settings' : active?.label || 'Overview'}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type='button' aria-label='Open account menu' className='ml-auto flex min-w-0 shrink-0 items-center gap-2 rounded-xl border border-primary/15 bg-primary/[0.025] px-3 py-1.5 text-left outline-none transition-colors hover:border-primary/30 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'>
              <Avatar className='size-8 rounded-lg'><AvatarImage src={user?.profile_pic} alt='' /><AvatarFallback className='rounded-lg bg-primary/10 font-semibold text-primary'>{initials}</AvatarFallback></Avatar>
              <span className='grid min-w-0 max-w-[130px] leading-tight sm:max-w-[220px]'>
                <span className='truncate text-sm font-semibold text-primary'>{user?.name || 'User'}</span>
                <span className='truncate text-xs text-muted-foreground'>{user?.email}</span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side='bottom' align='end' className='min-w-56 rounded-xl border-primary/15 [&_svg]:text-primary'>
            <DropdownMenuLabel><div>{user?.name}</div><div className='text-xs font-normal text-muted-foreground'>{user?.email}</div></DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate(getRolePath(user?.user_type, '/settings'))}><Settings />Settings</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setPasswordOpen(true)}><KeyRound />Reset password</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={logout}><LogOut />Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
      <main id='main-content' tabIndex={-1} className='sop-page-content'>{children}</main>
      <footer className='mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-primary/10 bg-primary/[0.025] px-5 py-3 text-xs text-muted-foreground sm:px-6'>
        <div className='flex items-center gap-2.5'>
          <span className='flex size-7 items-center justify-center rounded-lg border border-primary/10 bg-background text-primary'><Command className='size-3.5' aria-hidden='true' /></span>
          <div className='flex flex-wrap items-baseline gap-x-2 gap-y-0.5'>
            <span className='font-semibold text-primary'>Search O Pal</span>
            <span>© {copyrightYear} All rights reserved.</span>
          </div>
        </div>
        <span className='rounded-full border border-primary/10 bg-background px-3 py-1 font-medium capitalize text-primary'>{role} workspace</span>
      </footer>
    </SidebarInset>
  </>;
}

export default function AdminShell(props) {
  return <SidebarProvider className='sop-admin-shell' defaultOpen={document.cookie.split('; ').find(row => row.startsWith('sidebar_state='))?.split('=')[1] !== 'false'}><ShellContents badges={{}} {...props} /></SidebarProvider>;
}
