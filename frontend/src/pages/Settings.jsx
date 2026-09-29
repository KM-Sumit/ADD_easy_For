import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { User, Shield, Settings as SettingsIcon, Camera, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()
  const [status, setStatus] = useState(null)
  const [health, setHealth] = useState(null)

  useEffect(() => {
    api.get('/integrations/instagram/status').then(r => setStatus(r.data)).catch(() => {})
    api.get('/health').then(r => setHealth(r.data)).catch(() => {})
  }, [])

  return (
    <Layout>
      <div className="animate-slide-in" style={{ maxWidth: 600 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 className="section-title">Settings</h1>
          <p className="section-subtitle">Account and integration settings</p>
        </div>

        {/* Profile */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={15} color="#a78bfa" /> Account
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[{ label: 'Name', value: user?.name }, { label: 'Email', value: user?.email }].map(({ label, value }) => (
              <div key={label} style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* System health */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <SettingsIcon size={15} color="#a78bfa" /> System Status
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Meta App Credentials', ok: health?.meta_configured },
              { label: 'OpenAI API Key', ok: health?.ai_configured },
              { label: 'Instagram Account Connected', ok: status?.connected },
            ].map(({ label, ok }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 10,
              }}>
                <span style={{ fontSize: 14 }}>{label}</span>
                {ok
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>
                      <CheckCircle2 size={14} />Configured
                    </span>
                  : <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
                      <AlertCircle size={14} />Not set
                    </span>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Instagram connection */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Camera size={15} color="#e879f9" /> Instagram Integration
          </h2>
          {status?.connected ? (
            <div>
              <div className="alert-banner alert-success" style={{ marginBottom: 12 }}>
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                <span>Connected · Ad Account: {status.account?.platform_account_id || 'Not selected'}</span>
              </div>
              <a href="/connect" style={{ fontSize: 13, color: '#a78bfa', textDecoration: 'none' }}>Manage connection →</a>
            </div>
          ) : (
            <div>
              <div className="alert-banner alert-warning" style={{ marginBottom: 12 }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>No Instagram account connected.</span>
              </div>
              <a href="/connect" className="btn-gradient" style={{ display: 'inline-flex', fontSize: 13, padding: '10px 18px' }}>
                <Camera size={14} />Connect Instagram
              </a>
            </div>
          )}
        </div>

        {/* Security note */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={15} color="#34d399" /> Security
          </h2>
          <ul style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 2, paddingLeft: 16 }}>
            <li>Passwords are hashed with bcrypt — never stored in plaintext</li>
            <li>Meta OAuth tokens are encrypted with Fernet at rest</li>
            <li>Access tokens are never exposed to the browser</li>
            <li>Sessions use short-lived JWT tokens</li>
            <li>OAuth state parameter validates CSRF protection</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}
