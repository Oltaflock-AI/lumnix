import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap outline-none select-none transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[#FF0066] text-white hover:bg-[#FF3385] hover:shadow-[0_4px_12px_rgba(255,0,102,0.3)] active:scale-[0.98]",
        gradient:
          "bg-[#FF0066] text-white shadow-[0_2px_12px_rgba(255,0,102,0.3)] hover:bg-[#FF3385] hover:shadow-[0_6px_24px_rgba(255,0,102,0.4)] hover:-translate-y-px active:translate-y-0 transition-all duration-200",
        outline:
          "border-[#E2E8F0] bg-white text-[#374151] hover:border-[#FF0066] hover:text-[#FF0066] hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] dark:bg-[#1E293B] dark:text-[#CBD5E1] dark:hover:border-[#FF0066] dark:hover:text-[#FF85B5]",
        secondary:
          "bg-white text-[#374151] border border-[#E2E8F0] hover:border-[#FF0066] hover:text-[#FF0066] hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:bg-[#1E293B] dark:text-[#CBD5E1] dark:border-[rgba(255,255,255,0.1)] dark:hover:border-[#FF0066] dark:hover:text-[#FF85B5]",
        ghost:
          "hover:bg-[#F1F5F9] hover:text-foreground aria-expanded:bg-[#F1F5F9] aria-expanded:text-foreground dark:hover:bg-[rgba(255,255,255,0.06)] dark:aria-expanded:bg-[rgba(255,255,255,0.06)]",
        destructive:
          "bg-transparent text-[#EF4444] border border-[#FCA5A5] hover:bg-[#FEF2F2] hover:border-[#EF4444] dark:border-[rgba(239,68,68,0.3)] dark:hover:bg-[rgba(239,68,68,0.1)]",
        link: "text-[#FF0066] underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-[min(var(--radius-md),12px)] px-3 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 px-5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
