import * as React from 'react';
import { cn } from '@/components/lib/utils.js';
const Skeleton = React.forwardRef(function Skeleton({ className, ...props }, ref) {
    props.ref = ref;

    return (<div data-slot='skeleton' className={cn('animate-pulse rounded-md bg-accent', className)} {...props}/>);

});
export { Skeleton };
