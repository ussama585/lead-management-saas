import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/button.jsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip.jsx';
import { cn } from './lib/utils.js';

export default function CustomButton({ children, loading = false, loadingText, icon, iconOnly = false, type = 'solid', color = 'primary', htmlType = 'button', disabled = false, className, style, onClick, tooltip = '', shape, block = false, ghost = false, size, ...props }) {
  const variant = ghost || type === 'text' ? 'ghost' : type === 'link' ? 'link' : type === 'default' || type === 'dashed' ? 'outline' : color === 'danger' ? 'destructive' : color === 'secondary' ? 'secondary' : 'default';
  const button = <Button type={htmlType} variant={variant} size={iconOnly ? 'icon' : size === 'small' ? 'sm' : size === 'large' ? 'lg' : undefined} disabled={disabled || loading} aria-busy={loading || undefined} aria-label={iconOnly ? tooltip || props['aria-label'] : undefined} onClick={onClick} className={cn(block && 'w-full', shape === 'circle' && 'rounded-full', type === 'dashed' && 'border-dashed', className)} style={style} {...props}>
    {loading ? <Loader2 className='size-4 animate-spin' /> : icon}
    {!iconOnly && (loading && loadingText ? loadingText : children)}
  </Button>;
  return tooltip ? <TooltipProvider><Tooltip><TooltipTrigger asChild>{button}</TooltipTrigger><TooltipContent>{tooltip}</TooltipContent></Tooltip></TooltipProvider> : button;
}
