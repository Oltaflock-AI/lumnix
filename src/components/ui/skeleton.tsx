import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md animate-shimmer", className)}
      style={{ backgroundColor: "#E2E8F0" }}
      {...props}
    />
  )
}

export { Skeleton }
