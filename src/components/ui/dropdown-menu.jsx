import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react';
import { cn } from '@/components/lib/utils.js';
const DropdownMenu = React.forwardRef(function DropdownMenu({ ...props }, ref) {
    props.ref = ref;

    return <DropdownMenuPrimitive.Root data-slot='dropdown-menu' {...props}/>;

});
const DropdownMenuPortal = React.forwardRef(function DropdownMenuPortal({ ...props }, ref) {
    props.ref = ref;

    return (<DropdownMenuPrimitive.Portal data-slot='dropdown-menu-portal' {...props}/>);

});
const DropdownMenuTrigger = React.forwardRef(function DropdownMenuTrigger({ ...props }, ref) {
    props.ref = ref;

    return (<DropdownMenuPrimitive.Trigger data-slot='dropdown-menu-trigger' {...props}/>);

});
const DropdownMenuContent = React.forwardRef(function DropdownMenuContent({ className, sideOffset = 4, ...props }, ref) {
    props.ref = ref;

    return (<DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content data-slot='dropdown-menu-content' sideOffset={sideOffset} className={cn('z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-32 origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95', className)} {...props}/>
    </DropdownMenuPrimitive.Portal>);

});
const DropdownMenuGroup = React.forwardRef(function DropdownMenuGroup({ ...props }, ref) {
    props.ref = ref;

    return (<DropdownMenuPrimitive.Group data-slot='dropdown-menu-group' {...props}/>);

});
const DropdownMenuItem = React.forwardRef(function DropdownMenuItem({ className, inset, variant = 'default', ...props }, ref) {
    props.ref = ref;

    return (<DropdownMenuPrimitive.Item data-slot='dropdown-menu-item' data-inset={inset} data-variant={variant} className={cn("relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:ps-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground data-[variant=destructive]:*:[svg]:text-destructive!", className)} {...props}/>);

});
const DropdownMenuCheckboxItem = React.forwardRef(function DropdownMenuCheckboxItem({ className, children, checked, ...props }, ref) {
    props.ref = ref;

    return (<DropdownMenuPrimitive.CheckboxItem data-slot='dropdown-menu-checkbox-item' className={cn("relative flex cursor-default items-center gap-2 rounded-sm py-1.5 ps-8 pe-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className)} checked={checked} {...props}>
      <span className='pointer-events-none absolute inset-s-2 flex size-3.5 items-center justify-center'>
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className='size-4'/>
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>);

});
const DropdownMenuRadioGroup = React.forwardRef(function DropdownMenuRadioGroup({ ...props }, ref) {
    props.ref = ref;

    return (<DropdownMenuPrimitive.RadioGroup data-slot='dropdown-menu-radio-group' {...props}/>);

});
const DropdownMenuRadioItem = React.forwardRef(function DropdownMenuRadioItem({ className, children, ...props }, ref) {
    props.ref = ref;

    return (<DropdownMenuPrimitive.RadioItem data-slot='dropdown-menu-radio-item' className={cn("relative flex cursor-default items-center gap-2 rounded-sm py-1.5 ps-8 pe-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className)} {...props}>
      <span className='pointer-events-none absolute inset-s-2 flex size-3.5 items-center justify-center'>
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className='size-2 fill-current'/>
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>);

});
const DropdownMenuLabel = React.forwardRef(function DropdownMenuLabel({ className, inset, ...props }, ref) {
    props.ref = ref;

    return (<DropdownMenuPrimitive.Label data-slot='dropdown-menu-label' data-inset={inset} className={cn('px-2 py-1.5 text-sm font-medium data-inset:ps-8', className)} {...props}/>);

});
const DropdownMenuSeparator = React.forwardRef(function DropdownMenuSeparator({ className, ...props }, ref) {
    props.ref = ref;

    return (<DropdownMenuPrimitive.Separator data-slot='dropdown-menu-separator' className={cn('-mx-1 my-1 h-px bg-border', className)} {...props}/>);

});
const DropdownMenuShortcut = React.forwardRef(function DropdownMenuShortcut({ className, ...props }, ref) {
    props.ref = ref;

    return (<span data-slot='dropdown-menu-shortcut' className={cn('ms-auto text-xs tracking-widest text-muted-foreground', className)} {...props}/>);

});
const DropdownMenuSub = React.forwardRef(function DropdownMenuSub({ ...props }, ref) {
    props.ref = ref;

    return <DropdownMenuPrimitive.Sub data-slot='dropdown-menu-sub' {...props}/>;

});
const DropdownMenuSubTrigger = React.forwardRef(function DropdownMenuSubTrigger({ className, inset, children, ...props }, ref) {
    props.ref = ref;

    return (<DropdownMenuPrimitive.SubTrigger data-slot='dropdown-menu-sub-trigger' data-inset={inset} className={cn('flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-inset:ps-8 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground', className)} {...props}>
      {children}
      <ChevronRightIcon className='ms-auto size-4'/>
    </DropdownMenuPrimitive.SubTrigger>);

});
const DropdownMenuSubContent = React.forwardRef(function DropdownMenuSubContent({ className, ...props }, ref) {
    props.ref = ref;

    return (<DropdownMenuPrimitive.SubContent data-slot='dropdown-menu-sub-content' className={cn('z-50 min-w-32 origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95', className)} {...props}/>);

});
export { DropdownMenu, DropdownMenuPortal, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, };
