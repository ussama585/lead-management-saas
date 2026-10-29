import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import { LogOut, Command, KeyRound, Settings } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar.jsx';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu.jsx';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger, useSidebar } from '@/components/ui/sidebar.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import useUserStore from '@/pages/shared/store/user-store.js';
import { getRolePath } from '@/pages/auth/role-home.js';
import { isSuperAdmin } from '@/pages/auth/role-access.js';
import ChangePasswordDialog from '@/components/change-password-dialog.jsx';

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
    <Sidebar collapsible='icon' variant='inset'>
      <SidebarHeader>
        <SidebarMenu><SidebarMenuItem><SidebarMenuButton size='lg' onClick={() => select('1')}>
          <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground'><Command className='size-4' /></div>
          <div className='grid flex-1 text-left text-sm leading-tight'><span className='truncate font-semibold'>Search O Pal</span><span className='truncate text-xs capitalize'>{role} workspace</span></div>
        </SidebarMenuButton></SidebarMenuItem></SidebarMenu>
      </SidebarHeader>
      <SidebarContent>{orderedMenuGroups.map(([group, items]) => <SidebarGroup key={group} aria-label={group}>
        <SidebarGroupLabel className='text-base font-semibold tracking-wide'>{group}</SidebarGroupLabel><SidebarGroupContent>
        <SidebarMenu>{items.map(item => <SidebarMenuItem key={item.key}>
          <SidebarMenuButton tooltip={item.label} isActive={item.key === selectedKey} onClick={() => select(item.key)}>
            {item.icon}<span>{item.label}</span>
          </SidebarMenuButton>
          {Number(badges[item.key]) > 0 && <SidebarMenuBadge>{badges[item.key] > 99 ? '99+' : badges[item.key]}</SidebarMenuBadge>}
        </SidebarMenuItem>)}</SidebarMenu>
      </SidebarGroupContent></SidebarGroup>)}</SidebarContent>
      <SidebarFooter>
        <div className='flex items-center gap-2 overflow-hidden rounded-md p-2'>
          <Avatar className='size-8 shrink-0 rounded-lg'><AvatarFallback className='rounded-lg'>{initials}</AvatarFallback></Avatar>
          <div className='grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden'>
            <span className='truncate font-semibold'>{user?.name}</span><span className='truncate text-xs'>{user?.email}</span>
          </div>
        </div>
      </SidebarFooter><SidebarRail />
    </Sidebar>
    <SidebarInset className='min-w-0'>
      <header className='sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b bg-background px-4'>
        <SidebarTrigger /><Separator orientation='vertical' className='h-4' />
        <span className='min-w-0 truncate text-sm font-medium'>{location.pathname.endsWith('/settings') ? 'Settings' : active?.label || 'Workspace'}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type='button' aria-label='Open account menu' className='ml-auto shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'>
              <Avatar className='size-8'><AvatarFallback>{initials}</AvatarFallback></Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side='bottom' align='end' className='min-w-56'>
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
      <footer className='flex flex-wrap items-center justify-between gap-2 border-t px-6 py-4 text-xs text-muted-foreground'><span>Search O Pal · Management workspace</span><span className='capitalize'>{role}</span></footer>
    </SidebarInset>
  </>;
}

export default function AdminShell(props) {
  return <SidebarProvider defaultOpen={document.cookie.split('; ').find(row => row.startsWith('sidebar_state='))?.split('=')[1] !== 'false'}><ShellContents badges={{}} {...props} /></SidebarProvider>;
}
