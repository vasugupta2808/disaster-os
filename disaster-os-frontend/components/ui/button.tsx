import * as React from "react"
import { Slot, Slottable } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "glass-button relative isolate cursor-pointer rounded-full transition-all flex items-center justify-center gap-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary/80 text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive/80 text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input/20 bg-background/50 shadow-sm hover:bg-accent/50 hover:text-accent-foreground",
        secondary:
          "bg-secondary/60 text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent/30 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2.5 text-base font-medium",
        sm: "h-9 rounded-full px-4 text-sm font-medium",
        lg: "h-14 rounded-full px-8 text-lg font-medium",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // We wrap every button in the glass wrapper for the UI effect requested,
    // while maintaining compatibility with Shadcn's button component.
    return (
      <div
        className={cn(
          "glass-button-wrap cursor-pointer rounded-full inline-flex",
          className
        )}
      >
        <Comp
          className={cn(buttonVariants({ variant, size }))}
          ref={ref}
          {...props}
        >
          {asChild ? (
            children
          ) : (
            <span
              className="glass-button-text relative flex select-none tracking-tighter items-center justify-center gap-2 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0"
            >
              {children}
            </span>
          )}
        </Comp>
        <div className="glass-button-shadow rounded-full"></div>
      </div>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
