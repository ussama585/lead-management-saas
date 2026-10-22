import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '@/components/lib/utils.js';
const Separator = React.forwardRef(function Separator({ className, orientation = 'horizontal', decorative = true, ...props }, ref) {
    props.ref = ref;

    return (<SeparatorPrimitive.Root data-slot='separator' decorative={decorative} orientation={orientation} className={cn('shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px', className)} {...props}/>);

});
export { Separator };
