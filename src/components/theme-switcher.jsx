import React from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useAppTheme } from './providers/app-theme-context.js';
import { Button } from './ui/button.jsx';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.jsx';

export default function ThemeSwitcher() {
  const { preference, mode, setTheme } = useAppTheme();
  const Icon = mode === 'dark' ? Moon : Sun;
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant='outline' size='icon' aria-label='Choose color theme' title='Choose color theme'><Icon /></Button></DropdownMenuTrigger>
    <DropdownMenuContent align='end'>
      {[['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'System', Monitor]].map(([value, label, OptionIcon]) =>
        <DropdownMenuItem key={value} onSelect={() => setTheme(value)}>
          <OptionIcon />{label}{preference === value && <Check className='ml-auto' aria-label='Selected' />}
        </DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>;
}
