'use client';
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import { cn } from '@/components/lib/utils.js';
const Dialog = React.forwardRef(function Dialog({ ...props }, ref) {
    props.ref = ref;

    return <DialogPrimitive.Root data-slot='dialog' {...props}/>;

});
const DialogTrigger = React.forwardRef(function DialogTrigger({ ...props }, ref) {
    props.ref = ref;

    return <DialogPrimitive.Trigger data-slot='dialog-trigger' {...props}/>;

});
const DialogPortal = React.forwardRef(function DialogPortal({ ...props }, ref) {
    props.ref = ref;

    return <DialogPrimitive.Portal data-slot='dialog-portal' {...props}/>;

});
const DialogClose = React.forwardRef(function DialogClose({ ...props }, ref) {
    props.ref = ref;

    return <DialogPrimitive.Close data-slot='dialog-close' {...props}/>;

});
const DialogOverlay = React.forwardRef(function DialogOverlay({ className, ...props }, ref) {
    props.ref = ref;

    return (<DialogPrimitive.Overlay data-slot='dialog-overlay' className={cn('fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0', className)} {...props}/>);

});
const DialogContent = React.forwardRef(function DialogContent({ className, children, showCloseButton = true, ...props }, ref) {
    props.ref = ref;

    return (<DialogPortal data-slot='dialog-portal'>
      <DialogOverlay />
      <DialogPrimitive.Content data-slot='dialog-content' className={cn('fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-lg', className)} {...props}>
        {children}
        {showCloseButton && (<DialogPrimitive.Close data-slot='dialog-close' className="absolute inset-e-4 top-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
            <XIcon />
            <span className='sr-only'>Close</span>
          </DialogPrimitive.Close>)}
      </DialogPrimitive.Content>
    </DialogPortal>);

});
const DialogHeader = React.forwardRef(function DialogHeader({ className, ...props }, ref) {
    props.ref = ref;

    return (<div data-slot='dialog-header' className={cn('flex flex-col gap-2 text-center sm:text-start', className)} {...props}/>);

});
const DialogFooter = React.forwardRef(function DialogFooter({ className, ...props }, ref) {
    props.ref = ref;

    return (<div data-slot='dialog-footer' className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props}/>);

});
const DialogTitle = React.forwardRef(function DialogTitle({ className, ...props }, ref) {
    props.ref = ref;

    return (<DialogPrimitive.Title data-slot='dialog-title' className={cn('text-lg leading-none font-semibold', className)} {...props}/>);

});
const DialogDescription = React.forwardRef(function DialogDescription({ className, ...props }, ref) {
    props.ref = ref;

    return (<DialogPrimitive.Description data-slot='dialog-description' className={cn('text-sm text-muted-foreground', className)} {...props}/>);

});
export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger, };
