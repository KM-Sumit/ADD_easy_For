import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../api/client'
import { Camera, CheckCircle2, AlertCircle, Loader2, ExternalLink, Shield, Unlink } from 'lucide-react'

export default function ConnectInstagram() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState(null)
  const [adAccounts, setAdAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const step = searchParams.get('step')
  const errParam = searchParams.get('error')

  useEffect(() => {
    if (errParam) setError(`OAuth error: ${errParam.replace(/_/g, ' ')}`)
    fetchStatus()
  }, [])

  useEffect(() => {
    if (step === 'select_account') fetchAdAccounts()
  }, [step])

  const fetchStatus = async () => {
    try {
      const res = await api.get('/integrations/instagram/status')
      setStatus(res.data)
    } catch {
      setError('Failed to fetch integration status.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAdAccounts = async () => {
    try {
      const res = await api.get('/integrations/instagram/ad-accounts')
      setAdAccounts(res.data)
    } catch {
      setError('Could not fetch ad accounts. Please try reconnecting.')
    }
  }

  const handleConnect = async () => {
    setConnecting(true)
    setError('')
    try {
      const res = await api.get('/integrations/instagram/connect')
      window.location.href = res.data.oauth_url
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not initiate connection.')
      setConnecting(false)
    }
  }

  const handleSelectAccount = async () => {
    if (!selectedAccount) return
    setLoading(true)
    try {
      await api.post('/integrations/instagram/select-account', { platform_account_id: selectedAccount })
      setSuccess('Instagram connected successfully!')
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch {
      setError('Failed to save account selection.')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Disconnect your Instagram account? Existing campaigns will remain.')) return
    await api.delete('/integrations/instagram/disconnect')
    setStatus({ ...status, connected: false, account: null })
    setSuccess('')
    setError('')
    setAdAccounts([])
  }

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <Loader2 size={32} className="animate-spin" color="var(--accent-purple)" />
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="animate-slide-in" style={{ maxWidth: 600 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Connect Instagram</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
            Link your Meta advertising account to create Instagram campaigns.
          </p>
        </div>

        {error && (
          <div className="alert-banner alert-error" style={{ marginBottom: 20 }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-banner alert-success" style={{ marginBottom: 20 }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {!status?.meta_configured && (
          <div className="alert-banner alert-warning" style={{ marginBottom: 20 }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <div>
              <strong>Instagram integration is not configured.</strong>
              <br />
              <span style={{ fontSize: 13 }}>
                Please set META_APP_ID and META_APP_SECRET in <code>backend/.env</code> and restart the server. See the README for setup instructions.
              </span>
            </div>
          </div>
        )}

        {/* Security notice */}
        <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <Shield size={18} color="#a78bfa" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Security Notice:</strong> We use the official Meta OAuth system. 
              Your Meta/Facebook password is <strong>never</strong> collected or stored by InstaPilot AI. 
              You authenticate directly on Meta's website.
            </div>
          </div>
        </div>

        {/* Account selection step */}
        {step === 'select_account' && adAccounts.length > 0 && (
          <div className="glass-card" style={{ padding: '28px', marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Select Ad Account</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Choose the Meta ad account to use for Instagram campaigns.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {adAccounts.map(acc => (
                <label
                  key={acc.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    background: selectedAccount === acc.id ? 'rgba(124,58,237,0.15)' : 'var(--bg-elevated)',
                    border: `1px solid ${selectedAccount === acc.id ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
                    borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <input type="radio" name="adaccount" value={acc.id}
                    checked={selectedAccount === acc.id}
                    onChange={() => setSelectedAccount(acc.id)}
                    style={{ accentColor: 'var(--accent-purple)', width: 16, height: 16 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{acc.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{acc.id} · {acc.currency}</div>
                  </div>
                </label>
              ))}
            </div>
            <button className="btn-gradient" onClick={handleSelectAccount} disabled={!selectedAccount} id="select-account-btn">
              <CheckCircle2 size={16} />
              Confirm Selection
            </button>
          </div>
        )}

        {/* Connected state */}
        {status?.connected && step !== 'select_account' ? (
          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'rgba(16,185,129,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Camera size={24} color="var(--success)" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Instagram</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span className="badge badge-success">🟢 Connected</span>
                </div>
              </div>
            </div>
            {status.account?.platform_account_id && (
              <div style={{ marginBottom: 20, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Ad Account</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{status.account.platform_account_id}</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn-danger" onClick={handleDisconnect} id="disconnect-btn">
                <Unlink size={15} />
                Disconnect
              </button>
              <button className="btn-secondary" onClick={() => navigate('/campaigns/create')} id="create-campaign-from-connect">
                <ExternalLink size={15} />
                Create Campaign
              </button>
            </div>
          </div>
        ) : step !== 'select_account' && (
          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Camera size={24} color="var(--text-muted)" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Instagram Advertising Account</div>
                <span className="badge badge-gray" style={{ marginTop: 6, display: 'inline-flex' }}>Not Connected</span>
              </div>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
              Connect your Meta advertising account to start creating Instagram campaigns. 
              You'll be redirected to Meta's official authentication page.
            </p>
            <button
              id="connect-instagram-oauth-btn"
              className="btn-gradient"
              onClick={handleConnect}
              disabled={connecting || !status?.meta_configured}
            >
              {connecting ? <><div className="spinner" />&nbsp;Redirecting…</> : (
                <><Camera size={16} />Connect Instagram</>
              )}
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
