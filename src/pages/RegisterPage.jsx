import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { toast } from 'sonner'
import { User, Mail, Lock, Phone } from 'lucide-react'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signUp(form)
      toast.success('Account created! Check your email to verify.')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10 sm:py-16">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="font-heading font-bold text-xl sm:text-2xl">Create your account</h1>
        <p className="text-sm text-muted-foreground mt-1">Start trading USDT securely in minutes</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Full name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="pl-10" placeholder="John Banda" />
          </div>
        </div>
        <div>
          <Label>Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="pl-10" placeholder="you@example.com" />
          </div>
        </div>
        <div>
          <Label>Phone number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="pl-10" placeholder="+265 991 23 45 67" />
          </div>
        </div>
        <div>
          <Label>Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="password" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="pl-10" placeholder="At least 6 characters" />
          </div>
        </div>
        <Button type="submit" loading={loading} size="lg" className="w-full">Create Account</Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
