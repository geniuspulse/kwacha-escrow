import { cn } from '@/lib/utils'

export function Input({ className, ...props }) {
  return (
    <input
      className={cn('w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all', className)}
      {...props}
    />
  )
}

export function Label({ className, children, ...props }) {
  return (
    <label className={cn('block text-sm font-medium text-muted-foreground mb-1.5', className)} {...props}>
      {children}
    </label>
  )
}
