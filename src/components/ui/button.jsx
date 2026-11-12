import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/components/lib/utils.js';
import { ArrowUpRight, Plus, Pencil, Trash2, Check, X, Download, Search } from 'lucide-react';
import '../../assets/styles/button-hover-animation.css';

function flattenContent(children) {
    return React.Children.toArray(children).flatMap(child => React.isValidElement(child) && child.type === React.Fragment
        ? flattenContent(child.props.children) : [child]);
}

function actionIcon(label) {
    if (/delete|remove/i.test(label)) return Trash2;
    if (/cancel|close/i.test(label)) return X;
    if (/add|create|new/i.test(label)) return Plus;
    if (/edit|change|reset/i.test(label)) return Pencil;
    if (/save|confirm|submit|verify|apply|restore/i.test(label)) return Check;
    if (/export|download/i.test(label)) return Download;
    if (/search/i.test(label)) return Search;
    return ArrowUpRight;
}
const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive", {
    variants: {
        variant: {
            default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
            destructive: 'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
            outline: 'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
            secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
            ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
            link: 'text-primary underline-offset-4 hover:underline',
        },
        size: {
            default: 'h-9 px-4 py-2 has-[>svg]:px-3',
            sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
            lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
            icon: 'size-9',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
});
const Button = React.forwardRef(function Button({ className, variant, size, asChild = false, children, ...props }, ref) {
    props.ref = ref;

    const Comp = asChild ? Slot : 'button';
    const parts = flattenContent(children);
    const hasText = parts.some(part => typeof part === 'string' && part.trim());
    const animate = !asChild && hasText && size !== 'icon' && !props['aria-haspopup']
        && props['aria-pressed'] == null && props['aria-expanded'] == null && !props['aria-controls']
        && props['data-slot'] !== 'select-trigger' && props.role !== 'tab'
        && !props['aria-busy'] && !props.disabled;
    let content = children;
    if (animate) {
        const iconIndex = parts.findIndex(part => React.isValidElement(part) && (part.type === 'svg'
            || part.type === 'img' || Boolean(part.type?.render && part.type?.displayName)));
        const Icon = actionIcon(parts.filter(part => typeof part === 'string').join(' '));
        const icon = iconIndex >= 0 ? parts[iconIndex] : React.createElement(Icon, { size: 16, 'aria-hidden': true });
        content = <><span className="button-flight-icon" aria-hidden="true"><span className="svg-wrapper">{icon}</span></span>
            <span className="button-flight-label">{parts.filter((_, index) => index !== iconIndex)}</span></>;
    }
    return (<Comp data-slot='button' className={cn(buttonVariants({ variant, size, className }), animate && 'button-flight')} {...props}>{content}</Comp>);

});
export { Button, buttonVariants };
