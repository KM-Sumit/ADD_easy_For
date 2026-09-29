import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import api from '../api/client'
import {
  Camera, Package, Megaphone, BarChart3,
  TrendingUp, CheckCircle2, AlertTriangle, ArrowRight, Zap
} from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const [integration, setIntegration] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [intRes, campRes, prodRes] = await Promise.allSettled([
          api.get('/integrations/instagram/status'),
          api.get('/campaigns'),
          api.get('/products'),
        ])
        if (intRes.status === 'fulfilled') setIntegration(intRes.value.data)
        if (campRes.status === 'fulfilled') setCampaigns(campRes.value.data)
        if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length
  const demoCampaigns = campaigns.filter(c => c.status === 'DEMO').length

  const quickActions = [
    { icon: Camera, label: 'Connect Instagram', desc: 'Link your Meta ad account', to: '/connect', gradient: true },
    { icon: Package, label: 'Add Product', desc: 'Upload a product to advertise', to: '/products', gradient: false },
    { icon: Megaphone, label: 'Create Campaign', desc: 'Generate an AI-powered ad', to: '/campaigns/create', gradient: false },
    { icon: BarChart3, label: 'View Campaigns', desc: 'Track performance & metrics', to: '/campaigns', gradient: false },
  ]

  return (
    <Layout>
      <div className="animate-slide-in">
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>
            Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 15 }}>
            Here's your InstaPilot AI dashboard overview.
          </p>
        </div>

        {/* Instagram connection status */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: integration?.connected ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Camera size={22} color={integration?.connected ? 'var(--success)' : 'var(--warning)'} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                  Instagram Advertising Account
                </div>
                {loading ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Loading…</div>
                ) : integration?.connected ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span className="badge badge-success">🟢 Connected</span>
                    {integration.account?.platform_account_id && (
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Ad Account: {integration.account.platform_account_id}
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span className="badge badge-warning">⚠ Not Connected</span>
                    {!integration?.meta_configured && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Meta credentials not configured</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            {!integration?.connected && (
              <Link to="/connect" className="btn-gradient" id="connect-instagram-btn">
                <Camera size={16} />
                Connect Instagram
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Campaigns', value: campaigns.length, icon: Megaphone, color: '#a78bfa' },
            { label: 'Active Campaigns', value: activeCampaigns, icon: TrendingUp, color: 'var(--success)' },
            { label: 'Demo Campaigns', value: demoCampaigns, icon: Zap, color: 'var(--warning)' },
            { label: 'Products', value: products.length, icon: Package, color: '#60a5fa' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                <Icon size={16} color={color} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>{loading ? '–' : value}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {quickActions.map(({ icon: Icon, label, desc, to, gradient }) => (
              <Link
                key={to} to={to}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px',
                  background: gradient ? 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.2))' : 'var(--bg-card)',
                  border: `1px solid ${gradient ? 'rgba(124,58,237,0.3)' : 'var(--border)'}`,
                  borderRadius: 14, textDecoration: 'none',
                  transition: 'all 0.2s ease', cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: gradient ? 'var(--accent-gradient)' : 'var(--bg-elevated)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color={gradient ? 'white' : '#a78bfa'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{desc}</div>
                </div>
                <ArrowRight size={16} color="var(--text-muted)" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent campaigns */}
        {campaigns.length > 0 && (
          <div>
            <div className="section-header">
              <h2 className="section-title" style={{ fontSize: 16 }}>Recent Campaigns</h2>
              <Link to="/campaigns" style={{ fontSize: 13, color: '#a78bfa', textDecoration: 'none', fontWeight: 500 }}>
                View all →
              </Link>
            </div>
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              {campaigns.slice(0, 5).map((c, i) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderBottom: i < Math.min(campaigns.length, 5) - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/campaigns/${c.id}`)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      ₹{c.daily_budget}/day · {c.objective}
                    </div>
                  </div>
                  <span className={`badge ${statusBadge(c.status)}`}>{c.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function statusBadge(status) {
  if (status === 'ACTIVE') return 'badge-success'
  if (status === 'PAUSED') return 'badge-warning'
  if (status === 'DEMO') return 'badge-purple'
  return 'badge-gray'
}
