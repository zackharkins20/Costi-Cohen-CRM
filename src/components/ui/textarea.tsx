import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full border border-cc-border bg-cc-surface-2 px-2.5 py-2 text-base text-cc-text-primary transition-colors outline-none placeholder:text-cc-text-faint focus-visible:border-cc-text-primary focus-visible:ring-3 focus-visible:ring-cc-text-primary/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
