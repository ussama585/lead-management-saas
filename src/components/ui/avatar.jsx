import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/components/lib/utils.js';
const Avatar = React.forwardRef(function Avatar({ className, ...props }, ref) {
    props.ref = ref;

    return (<AvatarPrimitive.Root data-slot='avatar' className={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', className)} {...props}/>);

});
const AvatarImage = React.forwardRef(function AvatarImage({ className, ...props }, ref) {
    props.ref = ref;

    return (<AvatarPrimitive.Image data-slot='avatar-image' className={cn('aspect-square size-full', className)} {...props}/>);

});
const AvatarFallback = React.forwardRef(function AvatarFallback({ className, ...props }, ref) {
    props.ref = ref;

    return (<AvatarPrimitive.Fallback data-slot='avatar-fallback' className={cn('flex size-full items-center justify-center rounded-full bg-muted', className)} {...props}/>);

});
export { Avatar, AvatarImage, AvatarFallback };
