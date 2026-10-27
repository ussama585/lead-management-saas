import React, { useState } from 'react';
import { LoaderCircle, Search, X, Eye, EyeOff } from 'lucide-react';
import { Button as UiButton } from './button.jsx';
import { Input as UiInput } from './input.jsx';
import { Textarea } from './textarea.jsx';
import { Tooltip as UiTooltip, TooltipTrigger, TooltipContent } from './tooltip.jsx';
import { cn } from '../lib/utils.js';

// Preserve existing event handlers while moving callers to shadcn primitives.
export const Button = React.forwardRef(function Button({ type = 'default', htmlType = 'button', variant, size, loading, icon, children, danger, block, disabled, shape, ghost, href, ...props }, ref) {
  const mappedVariant = danger ? 'destructive' : type === 'primary' ? 'default'
    : type === 'link' ? 'link' : type === 'text' || ghost ? 'ghost'
      : ['default', 'outline', 'secondary', 'destructive', 'ghost', 'link'].includes(variant) ? variant : 'outline';
  const content = <>{loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : icon}{children}</>;
  if (href && !disabled && !loading) return <UiButton asChild variant={mappedVariant} className={props.className}>
    <a {...props} href={href} ref={ref}>{content}</a>
  </UiButton>;
  return <UiButton {...props} ref={ref} type={htmlType} variant={mappedVariant}
    size={size === 'small' ? 'sm' : size === 'large' ? 'lg' : size}
    className={cn(block && 'w-full', shape === 'circle' && 'rounded-full', props.className)}
    disabled={disabled || Boolean(loading)} aria-busy={Boolean(loading)}>
    {content}
  </UiButton>;
});

export function Spin({ spinning = true, children, tip, indicator, className, style }) {
  if (!children) return spinning ? <span role="status" aria-label={tip || 'Loading'} className={cn('inline-flex items-center gap-2', className)} style={style}>
    {indicator || <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}{tip}
  </span> : null;
  return <div className={cn('relative', className)} style={style} aria-busy={spinning}>
    {children}
    {spinning && <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-background/70" role="status" aria-label={tip || 'Loading'}>
      {indicator || <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}{tip}
    </div>}
  </div>;
}

export const Input = React.forwardRef(function Input({ allowClear, prefix, suffix, addonBefore, addonAfter, status, size, onPressEnter, onChange, value, defaultValue, ...props }, ref) {
  const [local, setLocal] = useState(defaultValue || '');
  const current = value === undefined ? local : value;
  const control = <UiInput {...props} ref={ref} value={current ?? ''} aria-invalid={status === 'error' || undefined}
    className={cn((prefix || addonBefore) && 'pl-9', (suffix || addonAfter || allowClear) && 'pr-9', props.className)}
    onKeyDown={event => { props.onKeyDown?.(event); if (event.key === 'Enter') onPressEnter?.(event); }}
    onChange={event => { setLocal(event.target.value); onChange?.(event); }} />;
  if (!prefix && !suffix && !addonBefore && !addonAfter && !allowClear) return control;
  return <div className="relative flex w-full items-center">
    {(prefix || addonBefore) && <span className="absolute left-3 z-10 text-muted-foreground">{prefix || addonBefore}</span>}
    {control}
    {(suffix || addonAfter) && <span className="absolute right-3">{suffix || addonAfter}</span>}
    {allowClear && current && !props.disabled && <UiButton type="button" variant="ghost" size="icon" className="absolute right-0 h-full" aria-label="Clear input"
      onClick={() => { setLocal(''); onChange?.({ target: { name: props.name, value: '' }, currentTarget: { name: props.name, value: '' } }); }}><X /></UiButton>}
  </div>;
});

Input.TextArea = React.forwardRef(function TextArea({ autoSize, status, onPressEnter, ...props }, ref) {
  return <Textarea {...props} ref={ref} aria-invalid={status === 'error' || undefined}
    rows={props.rows || (typeof autoSize === 'object' ? autoSize.minRows : undefined)}
    onKeyDown={event => { props.onKeyDown?.(event); if (event.key === 'Enter') onPressEnter?.(event); }} />;
});

Input.Search = React.forwardRef(function SearchInput({ onSearch, onChange, value, defaultValue, enterButton, loading, ...props }, ref) {
  const [local, setLocal] = useState(defaultValue || '');
  const current = value === undefined ? local : value;
  return <div className="flex w-full gap-2" style={props.style}>
    <Input {...props} ref={ref} value={current} onChange={event => { setLocal(event.target.value); onChange?.(event); }}
      onPressEnter={event => { event.preventDefault(); onSearch?.(current, event); }} />
    <Button type="primary" loading={loading} aria-label="Search" onClick={event => onSearch?.(current, event)}>{typeof enterButton === 'string' ? enterButton : <Search />}</Button>
  </div>;
});

Input.Password = React.forwardRef(function PasswordInput({ visibilityToggle = true, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  return <Input {...props} ref={ref} type={visible ? 'text' : 'password'} suffix={visibilityToggle &&
    <UiButton type="button" variant="ghost" size="icon" aria-label={visible ? 'Hide password' : 'Show password'} disabled={props.disabled} onClick={() => setVisible(previous => !previous)}>
      {visible ? <EyeOff /> : <Eye />}
    </UiButton>} />;
});

export function Tooltip({ title, children, placement = 'top', open, onOpenChange, className, ...props }) {
  if (!title) return children;
  return <UiTooltip open={open} onOpenChange={onOpenChange}>
    <TooltipTrigger asChild><span className={cn('inline-flex items-center', className)} style={props.style}>{children}</span></TooltipTrigger>
    <TooltipContent side={placement.startsWith('bottom') ? 'bottom' : placement.startsWith('left') ? 'left' : placement.startsWith('right') ? 'right' : 'top'}>{title}</TooltipContent>
  </UiTooltip>;
}
