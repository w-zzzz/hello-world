import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '../lib/cn'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-brand-500 text-white hover:bg-brand-500/90 shadow-sm',
        secondary: 'bg-muted text-foreground hover:bg-muted/80',
        ghost: 'hover:bg-muted hover:text-foreground',
        outline: 'border border-border bg-transparent hover:bg-muted text-foreground',
        destructive: 'bg-bear-500 text-white hover:bg-bear-500/90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type SlotProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode
}

const Slot = React.forwardRef<HTMLElement, SlotProps>(function Slot({ children, ...props }, ref) {
  if (!React.isValidElement(children)) {
    return null
  }
  const childProps = (children.props ?? {}) as Record<string, unknown>
  const childClassName = typeof childProps.className === 'string' ? childProps.className : undefined
  const merged: Record<string, unknown> = {
    ...childProps,
    ...props,
    ref,
    className: cn(
      childClassName,
      typeof props.className === 'string' ? props.className : undefined,
    ),
  }
  return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, merged)
})

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, ...props },
  ref,
) {
  const classes = cn(buttonVariants({ variant, size }), className)
  if (asChild) {
    return (
      <Slot
        className={classes}
        ref={ref as unknown as React.Ref<HTMLElement>}
        {...(props as React.HTMLAttributes<HTMLElement>)}
      />
    )
  }
  return <button ref={ref} className={classes} {...props} />
})
