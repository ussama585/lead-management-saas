import React, { useEffect, useRef, useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { useAppTheme } from './providers/app-theme-context.js';
import { DEFAULT_PRIMARY_COLOR, normalizeThemeColor, primaryTextColor } from './providers/theme-color.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card.jsx';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import ThemeSwitcher from './theme-switcher.jsx';
import useUserStore from '../pages/shared/store/user-store.js';
import { isSuperAdmin } from '../pages/auth/role-access.js';

const presets = [
  ['Blue', DEFAULT_PRIMARY_COLOR], ['Purple', '#7C3AED'], ['Green', '#15803D'],
  ['Orange', '#EA580C'], ['Rose', '#E11D48'], ['Teal', '#0F766E'],
];

export default function AppearanceSettings() {
  const { user } = useUserStore();
  const { primaryColor, setPrimaryColor } = useAppTheme();
  const [draft, setDraft] = useState(primaryColor);
  const pendingColor = useRef(null);
  useEffect(() => () => clearTimeout(pendingColor.current), []);
  const validColor = normalizeThemeColor(draft);
  if (!isSuperAdmin(user?.user_type)) return null;
  function choose(color) {
    clearTimeout(pendingColor.current);
    setDraft(color);
    setPrimaryColor(color);
  }
  function previewColor(color) {
    setDraft(color);
    clearTimeout(pendingColor.current);
    pendingColor.current = setTimeout(() => setPrimaryColor(color), 180);
  }
  return <Card className='mb-6 max-w-[880px]'>
    <CardHeader><CardTitle>Appearance</CardTitle><CardDescription>Personalize your workspace. Changes apply immediately and are saved in this browser.</CardDescription></CardHeader>
    <CardContent className='grid gap-6'>
      <div className='flex items-center justify-between gap-4'><span className='text-sm font-medium'>Color mode</span><ThemeSwitcher /></div>
      <fieldset className='min-w-0'><legend className='mb-3 text-sm font-medium'>Primary color</legend>
        <div className='flex flex-wrap gap-3'>{presets.map(([label, color]) => <button key={color} type='button' onClick={() => choose(color)} aria-pressed={primaryColor === color} aria-label={`${label} theme`} title={label}
          className='flex size-10 items-center justify-center rounded-full border-2 border-background shadow-sm outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring'
          style={{ backgroundColor: color, outline: primaryColor === color ? `2px solid ${color}` : undefined }}>
          {primaryColor === color && <Check className='size-5 text-white' />}
        </button>)}</div>
      </fieldset>
      <div>
        <label htmlFor='theme-color-hex' className='mb-2 block text-sm font-medium'>Custom color</label>
        <div className='flex flex-wrap items-center gap-3'>
          <input type='color' aria-label='Choose a custom primary color' value={validColor || primaryColor} onChange={event => previewColor(event.target.value)} className='h-10 w-12 cursor-pointer rounded border border-input bg-background p-1' />
          <Input id='theme-color-hex' value={draft} maxLength={7} placeholder='#3E6A9F' className='w-32 font-sans' aria-invalid={!validColor} aria-describedby='theme-color-help' onChange={event => { clearTimeout(pendingColor.current); setDraft(event.target.value); }} onKeyDown={event => { if (event.key === 'Enter' && validColor) choose(validColor); }} />
          <Button disabled={!validColor} onClick={() => choose(validColor)}>Apply color</Button>
        </div>
        <p id='theme-color-help' className='mt-2 text-xs text-muted-foreground'>{validColor ? 'Enter a six-digit HEX color, then apply.' : 'Use a valid HEX color such as #3E6A9F.'}</p>
      </div>
      <div className='rounded-lg border border-border bg-muted/30 p-4' style={validColor ? { '--primary': validColor, '--primary-foreground': primaryTextColor(validColor) } : undefined}>
        <p className='mb-3 text-sm font-medium'>Live preview</p>
        <div className='flex flex-wrap items-center gap-3'><Button>Primary button</Button><Button variant='outline'>Secondary button</Button><span className='rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground'>Active</span></div>
      </div>
      <div><Button variant='outline' onClick={() => choose(DEFAULT_PRIMARY_COLOR)}><RotateCcw />Reset to default</Button></div>
    </CardContent>
  </Card>;
}
