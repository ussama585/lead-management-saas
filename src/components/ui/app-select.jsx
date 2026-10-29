import React, { useState } from 'react';
import { Check, ChevronDown, LoaderCircle, X } from 'lucide-react';
import { Button } from './button.jsx';
import { Input } from './input.jsx';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem } from './dropdown-menu.jsx';
import { cn } from '../lib/utils.js';

export function selectOptions(options, children) {
  if (options) return options.flatMap(option => option.options || [option]);
  return React.Children.toArray(children).flatMap(child => child?.props?.value !== undefined
    ? [{ ...child.props, label: child.props.label ?? child.props.children }]
    : selectOptions(null, child?.props?.children));
}

const text = value => typeof value === 'string' || typeof value === 'number' ? String(value)
  : Array.isArray(value) ? value.map(text).join(' ') : React.isValidElement(value) ? text(value.props.children) : '';

export function Select({ value, defaultValue, options, children, onChange, onSelect, onDeselect, onSearch,
  onBlur, onFocus, onClear, onDropdownVisibleChange, onOpenChange, mode, showSearch, allowClear,
  disabled, loading, placeholder = 'Select', className, style, id, name, status,
  filterOption, optionFilterProp = 'label', optionLabelProp, optionRender, labelRender,
  labelInValue, tokenSeparators = [], onInputKeyDown, notFoundContent, dropdownStyle }) {
  const [local, setLocal] = useState(defaultValue);
  const [search, setSearch] = useState('');
  const multiple = mode === 'multiple' || mode === 'tags';
  const current = value === undefined ? local : value;
  const selected = (multiple ? current || [] : current == null ? [] : [current]).map(item => labelInValue && typeof item === 'object' ? item.value : item);
  const allOptions = selectOptions(options, children);
  const known = selected.map(item => allOptions.find(option => String(option.value) === String(item))
    || { value: item, label: labelInValue ? (Array.isArray(current) ? current : [current]).find(entry => entry?.value === item)?.label || item : item });
  const emit = values => {
    const records = values.map(item => allOptions.find(option => String(option.value) === String(item)) || { value: item, label: item });
    const output = labelInValue ? records.map(option => ({ value: option.value, label: option.label })) : values;
    const next = multiple ? output : output[0];
    setLocal(next); onChange?.(next, multiple ? records : records[0]);
  };
  const choose = option => {
    if (option.disabled) return;
    const exists = selected.some(item => String(item) === String(option.value));
    emit(multiple ? exists ? selected.filter(item => String(item) !== String(option.value)) : [...selected, option.value] : [option.value]);
    (exists && multiple ? onDeselect : onSelect)?.(labelInValue ? { value: option.value, label: option.label } : option.value, option);
    if (!multiple) { setSearch(''); onSearch?.(''); }
  };
  const visible = allOptions.filter(option => !search || filterOption === false || (typeof filterOption === 'function'
    ? filterOption(search, { ...option, children: option.label })
    : text(option[optionFilterProp] ?? option.label).toLowerCase().includes(search.toLowerCase())));
  const addTags = raw => {
    const values = tokenSeparators.reduce((parts, separator) => parts.flatMap(part => part.split(separator)), [raw]).map(item => item.trim()).filter(Boolean);
    if (!values.length) return;
    emit([...new Set([...selected, ...values])]); setSearch(''); onSearch?.('');
  };
  return <div className={cn('relative inline-flex min-w-0', className)} style={style}>
    <DropdownMenu modal={false} onOpenChange={open => { onDropdownVisibleChange?.(open); onOpenChange?.(open); if (!open) { setSearch(''); onBlur?.({ target: { name, value: current } }); } }}>
      <DropdownMenuTrigger asChild>
        <Button data-slot="select-trigger" id={id} type="button" variant="outline" disabled={disabled} aria-invalid={status === 'error' || undefined}
          aria-label={typeof placeholder === 'string' ? placeholder : undefined} onFocus={onFocus}
          className={cn('w-full min-w-0 justify-between font-normal', multiple && 'h-auto min-h-10 whitespace-normal', allowClear && selected.length > 0 && 'pr-9')}>
          <span className={cn('min-w-0 text-left', !multiple && 'truncate', !selected.length && 'text-muted-foreground')}>
            {known.length ? known.map((option, index) => <React.Fragment key={String(option.value)}>
              {index > 0 && ', '}{labelRender ? labelRender(option) : optionLabelProp ? option[optionLabelProp] ?? option.label : option.label}
            </React.Fragment>) : placeholder}
          </span>
          {loading ? <LoaderCircle className="size-4 shrink-0 animate-spin" /> : <ChevronDown className="size-4 shrink-0" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[var(--radix-dropdown-menu-trigger-width)] max-w-[90vw]" style={dropdownStyle}>
        {(showSearch || mode === 'tags') && <Input aria-label="Search options" placeholder="Search..." value={search}
          onChange={event => {
            const next = event.target.value;
            if (mode === 'tags' && tokenSeparators.some(separator => next.includes(separator))) addTags(next);
            else { setSearch(next); onSearch?.(next); }
          }} onKeyDown={event => {
            onInputKeyDown?.(event);
            if (event.key !== 'Escape') event.stopPropagation();
            if (mode === 'tags' && event.key === 'Enter') { event.preventDefault(); addTags(search); }
          }} />}
        <div className="max-h-64 overflow-y-auto">
          {visible.map((option, index) => {
            const checked = selected.some(item => String(item) === String(option.value));
            const content = optionRender ? optionRender({ ...option, data: option, key: option.value }, { index }) : option.label;
            return multiple ? <DropdownMenuCheckboxItem key={String(option.value)} checked={checked} disabled={option.disabled}
              onSelect={event => event.preventDefault()} onCheckedChange={() => choose(option)}>{content}</DropdownMenuCheckboxItem>
              : <DropdownMenuItem key={String(option.value)} disabled={option.disabled} onSelect={() => choose(option)}>
                  {checked && <Check className="size-4" />}{content}
                </DropdownMenuItem>;
          })}
          {mode === 'tags' && search.trim() && !allOptions.some(option => String(option.value) === search.trim()) &&
            <DropdownMenuItem onSelect={event => { event.preventDefault(); addTags(search); }}>Add “{search.trim()}”</DropdownMenuItem>}
          {!visible.length && mode !== 'tags' && <div className="p-2 text-sm text-muted-foreground">{notFoundContent ?? 'No options found.'}</div>}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
    {allowClear && selected.length > 0 && !disabled && <Button type="button" variant="ghost" size="icon" aria-label="Clear selection" className="absolute right-0 top-0 h-full w-8"
      onClick={() => { emit([]); onClear?.(); }}><X className="size-3" /></Button>}
  </div>;
}

Select.Option = function Option() { return null; };
Select.OptGroup = function OptGroup() { return null; };
