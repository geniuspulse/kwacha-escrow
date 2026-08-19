import { cn } from '../../lib/utils'
import { Loader2 } from 'lucide-react'

export function Button({ className, variant = 'default', size = 'default', children, loading, disabled, ...props }) {
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-border bg-transparent hover:bg-accent text-foreground',
    ghost: 'bg-transparent hover:bg-accent text-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  }
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3 text-sm',
    lg: 'h-12 px-6 text-base',
    icon: 'h-10 w-10',
  }
  return (
    <button
      className={cn('inline-flex items-center justify-center rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed', variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  )
}
