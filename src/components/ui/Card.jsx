import { cn } from '../../lib/utils'

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)} {...props}>
      {children}
    </div>
  )
}

export function Badge({ className, children, variant = 'default' }) {
  const variants = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-500',
    warning: 'bg-amber-500/10 text-amber-500',
    destructive: 'bg-destructive/10 text-destructive',
    neutral: 'bg-secondary text-muted-foreground',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
