import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { toast } from 'sonner'
import { Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(email, password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10 sm:py-16">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="font-heading font-bold text-xl sm:text-2xl">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1">Sign in to your Kwacha Escrow account</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="pl-10" placeholder="you@example.com" />
          </div>
        </div>
        <div>
          <Label>Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="pl-10" placeholder="Enter your password" />
          </div>
        </div>
        <Button type="submit" loading={loading} size="lg" className="w-full">Sign In</Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        No account? <Link to="/register" className="text-primary hover:underline">Create one</Link>
      </p>
    </div>
  )
}
