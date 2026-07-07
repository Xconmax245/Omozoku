import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.96] duration-200",
  {
    variants: {
      variant: {
        default: "bg-white text-black hover:bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-xl",
        glass: "bg-[rgba(255,255,255,0.06)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.08)] text-white hover:bg-[rgba(255,255,255,0.1)] hover:shadow-[0_8px_32px_rgba(255,255,255,0.05)] rounded-xl",
        ghost: "bg-transparent text-white/70 hover:text-white hover:bg-white/10 rounded-xl",
        navbar: "bg-transparent text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full",
        episode: "w-full justify-start bg-bg-surface/40 hover:bg-bg-surface/80 border border-transparent hover:border-white/10 text-white rounded-xl overflow-hidden",
        modal: "bg-[#1A1A24] text-white hover:bg-[#252533] border border-white/5 shadow-lg rounded-xl",
        danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 border border-red-500/20 rounded-xl",
        icon: "rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white backdrop-blur-md",
        outline: "border border-white/20 bg-transparent text-white hover:bg-white/10 rounded-xl",
        secondary: "bg-white/10 text-white hover:bg-white/20 border border-white/5 rounded-xl",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-[44px] w-[44px]", // Directive: minimum 44x44 touch targets
        pill: "h-9 px-4 rounded-full",
        episode: "p-3", // specific size for episodes
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
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
