import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/api/supabaseClient'
import { Card, Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { toast } from 'sonner'
import { User, Wallet, Shield, Star } from 'lucide-react'

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    wallet_address_trc20: profile?.wallet_address_trc20 || '',
    wallet_address_bsc: profile?.wallet_address_bsc || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await db.entities.Profile.update(user.id, form)
      await refreshProfile()
      toast.success('Profile updated')
      setEditing(false)
    } catch (err) {
      toast.error('Failed to update profile')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-heading font-bold text-3xl mb-8">Profile</h1>

      {/* Profile summary */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="font-heading font-semibold text-xl">{profile?.full_name}</h2>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={profile?.kyc_status === 'verified' ? 'success' : 'warning'}>
                {profile?.kyc_status === 'verified' ? 'KYC Verified' : 'KYC Pending'}
              </Badge>
              <Badge variant="neutral">{profile?.total_trades || 0} trades</Badge>
              {profile?.reputation_score > 0 && (
                <Badge variant="success"><Star className="w-3 h-3" /> {profile.reputation_score.toFixed(1)}</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Editable fields */}
      {editing ? (
        <form onSubmit={handleSave} className="space-y-4">
          <Card>
            <Label>Full name</Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="pl-10" />
            </div>
          </Card>
          <Card>
            <Label>Phone number</Label>
            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </Card>
          <Card>
            <Label>TRC20 Wallet Address</Label>
            <div className="relative mt-1">
              <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={form.wallet_address_trc20} onChange={e => setForm({ ...form, wallet_address_trc20: e.target.value })} className="pl-10" placeholder="T..." />
            </div>
          </Card>
          <Card>
            <Label>BSC Wallet Address</Label>
            <div className="relative mt-1">
              <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={form.wallet_address_bsc} onChange={e => setForm({ ...form, wallet_address_bsc: e.target.value })} className="pl-10" placeholder="0x..." />
            </div>
          </Card>
          <div className="flex gap-3">
            <Button type="submit" loading={loading}>Save</Button>
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <Card>
            <p className="text-xs text-muted-foreground mb-1">Phone</p>
            <p className="font-medium">{profile?.phone || 'Not set'}</p>
          </Card>
          <Card>
            <p className="text-xs text-muted-foreground mb-1">TRC20 Wallet</p>
            <p className="font-medium font-mono text-sm">{profile?.wallet_address_trc20 || 'Not set'}</p>
          </Card>
          <Card>
            <p className="text-xs text-muted-foreground mb-1">BSC Wallet</p>
            <p className="font-medium font-mono text-sm">{profile?.wallet_address_bsc || 'Not set'}</p>
          </Card>
          <Card>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">KYC Verification</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {profile?.kyc_status === 'verified'
                    ? 'Your identity has been verified. You can create and accept trades.'
                    : 'KYC verification is required to create offers. Contact support to get verified.'}
                </p>
              </div>
            </div>
          </Card>
          <Button onClick={() => setEditing(true)}>Edit Profile</Button>
        </div>
      )}
    </div>
  )
}
