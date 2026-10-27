import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem } from '../../components/ui/dropdown-menu.jsx';

export default function SalesDataSelect({ value, onChange, onBlur, options = [], placeholder, mode, name }) {
  const [search, setSearch] = useState('');
  const multiple = mode === 'multiple';
  const selected = multiple ? value || [] : value ? [value] : [];
  const labels = selected.map(item => options.find(option => option.value === item)?.label || item);
  const visible = options.filter(option => String(option.label).toLowerCase().includes(search.toLowerCase()));
  return <DropdownMenu onOpenChange={open => { if (!open) { setSearch(''); onBlur?.({ target: { name } }); } }}>
    <DropdownMenuTrigger asChild>
      <Button type="button" variant="outline" className="w-full justify-between font-normal" aria-label={placeholder}>
        <span className="truncate">{labels.length ? labels.join(', ') : placeholder}</span><ChevronDown className="size-4 shrink-0" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
      <Input aria-label={`Search ${placeholder}`} placeholder="Search..." value={search}
        onChange={event => setSearch(event.target.value)}
        onKeyDown={event => { if (event.key !== 'Escape') event.stopPropagation(); }} />
      <div className="max-h-60 overflow-y-auto">
        {visible.map(option => multiple
          ? <DropdownMenuCheckboxItem key={option.value} checked={selected.includes(option.value)}
              onSelect={event => event.preventDefault()}
              onCheckedChange={checked => onChange(checked ? [...selected, option.value] : selected.filter(item => item !== option.value))}>
              {option.label}
            </DropdownMenuCheckboxItem>
          : <DropdownMenuItem key={option.value} onSelect={() => onChange(option.value)}>{option.label}</DropdownMenuItem>)}
        {!visible.length && <p className="p-2 text-sm text-muted-foreground">No options found.</p>}
      </div>
    </DropdownMenuContent>
  </DropdownMenu>;
}
