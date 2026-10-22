'use client';
import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/components/lib/utils.js';
const TooltipProvider = React.forwardRef(function TooltipProvider({ delayDuration = 0, ...props }, ref) {
    props.ref = ref;

    return (<TooltipPrimitive.Provider data-slot='tooltip-provider' delayDuration={delayDuration} {...props}/>);

});
const Tooltip = React.forwardRef(function Tooltip({ ...props }, ref) {
    props.ref = ref;

    return (<TooltipProvider>
      <TooltipPrimitive.Root data-slot='tooltip' {...props}/>
    </TooltipProvider>);

});
const TooltipTrigger = React.forwardRef(function TooltipTrigger({ ...props }, ref) {
    props.ref = ref;

    return <TooltipPrimitive.Trigger data-slot='tooltip-trigger' {...props}/>;

});
const TooltipContent = React.forwardRef(function TooltipContent({ className, sideOffset = 0, children, ...props }, ref) {
    props.ref = ref;

    return (<TooltipPrimitive.Portal>
      <TooltipPrimitive.Content data-slot='tooltip-content' sideOffset={sideOffset} className={cn('z-50 w-fit origin-(--radix-tooltip-content-transform-origin) animate-in rounded-md bg-primary px-3 py-1.5 text-xs text-balance text-primary-foreground fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95', className)} {...props}>
        {children}
        <TooltipPrimitive.Arrow className='z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] bg-primary fill-primary'/>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>);

});
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
