import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../api/client'
import {
  CheckCircle2, BarChart3, Zap, Loader2, ArrowLeft, RefreshCw,
  Eye, MousePointer, DollarSign, TrendingUp, Users, ShoppingBag, Lightbulb, AlertCircle
} from 'lucide-react'

function statusBadge(s) {
  if (s === 'ACTIVE') return 'badge-success'
  if (s === 'PAUSED') return 'badge-warning'
  if (s === 'DEMO') return 'badge-purple'
  return 'badge-gray'
}

export default function CampaignAnalytics() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const launched = location.state?.launched

  const [campaign, setCampaign] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { fetchAll() }, [id])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [campRes, metricsRes] = await Promise.allSettled([
        api.get(`/campaigns/${id}`),
        api.get(`/campaigns/${id}/metrics`),
      ])
      if (campRes.status === 'fulfilled') setCampaign(campRes.value.data)
      if (metricsRes.status === 'fulfilled') {
        const m = metricsRes.value.data
        setMetrics(m.length > 0 ? m[0] : null)
      }
    } catch {
      setError('Failed to load campaign.')
    } finally {
      setLoading(false)
    }
  }

  const handleAIAnalysis = async () => {
    setLoadingAI(true)
    setAnalysis(null)
    try {
      const res = await api.post(`/campaigns/${id}/ai-analysis`)
      setAnalysis(res.data)
    } catch {
      setError('AI analysis failed.')
    } finally {
      setLoadingAI(false)
    }
  }

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <Loader2 size={28} className="animate-spin" color="var(--accent-purple)" />
      </div>
    </Layout>
  )

  if (!campaign) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Campaign not found.</p>
        <button className="btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate('/campaigns')}>Back to Campaigns</button>
      </div>
    </Layout>
  )

  const isDemo = campaign.status === 'DEMO'

  return (
    <Layout>
      <div className="animate-slide-in" style={{ maxWidth: 800 }}>
        <button onClick={() => navigate('/campaigns')}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 20, padding: 0 }}>
          <ArrowLeft size={14} />All Campaigns
        </button>

        {/* Launch success banner */}
        {launched && (
          <div className="alert-banner alert-success" style={{ marginBottom: 20 }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <div>
              <strong>🟢 Campaign Created!</strong>
              {isDemo
                ? ' Running in Demo Mode — connect Meta to launch real campaigns.'
                : ` Campaign ID: ${campaign.external_campaign_id}`}
            </div>
          </div>
        )}

        {error && (
          <div className="alert-banner alert-error" style={{ marginBottom: 20 }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Header */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className={`badge ${statusBadge(campaign.status)}`}>{campaign.status}</span>
                {isDemo && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Demo Mode — no real spend</span>}
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{campaign.name}</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Created {new Date(campaign.created_at).toLocaleDateString()} · {campaign.objective} · ₹{campaign.daily_budget}/day
              </p>
              {campaign.external_campaign_id && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'monospace' }}>
                  Campaign ID: {campaign.external_campaign_id}
                </p>
              )}
            </div>
            <button className="btn-secondary" onClick={fetchAll} style={{ padding: '8px 14px', fontSize: 13 }} id="refresh-metrics-btn">
              <RefreshCw size={14} />Refresh
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={16} color="#a78bfa" />Performance Metrics
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
            {[
              { label: 'Impressions', value: metrics?.impressions ?? '—', icon: Eye, color: '#60a5fa' },
              { label: 'Reach', value: metrics?.reach ?? '—', icon: Users, color: '#a78bfa' },
              { label: 'Clicks', value: metrics?.clicks ?? '—', icon: MousePointer, color: '#34d399' },
              { label: 'CTR', value: metrics?.ctr != null ? `${metrics.ctr.toFixed(2)}%` : '—', icon: TrendingUp, color: '#fbbf24' },
              { label: 'Spend', value: metrics?.spend != null ? `₹${metrics.spend.toFixed(2)}` : '—', icon: DollarSign, color: '#f87171' },
              { label: 'Conversions', value: metrics?.conversions ?? '—', icon: ShoppingBag, color: 'var(--success)' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="stat-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</span>
                  <Icon size={13} color={color} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>
          {!metrics && (
            <div className="alert-banner alert-info" style={{ marginTop: 12 }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13 }}>
                {isDemo ? 'Demo campaigns have no real metrics. Connect Meta to see live data.' : 'No metrics yet. Metrics are updated once the campaign starts running.'}
              </span>
            </div>
          )}
        </div>

        {/* AI Optimization */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} color="#fbbf24" />AI Optimization
            </h2>
            <button
              className="btn-gradient"
              style={{ padding: '8px 16px', fontSize: 13 }}
              onClick={handleAIAnalysis}
              disabled={loadingAI}
              id="ai-analysis-btn"
            >
              {loadingAI ? <><Loader2 size={13} className="animate-spin" />&nbsp;Analyzing…</> : <><Zap size={13} />Get AI Suggestions</>}
            </button>
          </div>

          {analysis ? (
            <div>
              {analysis.is_demo && (
                <div className="alert-banner alert-info" style={{ marginBottom: 14 }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13 }}>Demo suggestions — set OPENAI_API_KEY for personalized analysis.</span>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {analysis.suggestions.map((s, i) => (
                  <div key={i} style={{
                    padding: '14px 16px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 12, fontSize: 14, lineHeight: 1.5,
                    color: 'var(--text-primary)',
                    borderLeft: '3px solid var(--accent-purple)',
                  }}>
                    {s}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                ⚠ AI provides recommendations only. No changes are made automatically. Review and approve any changes manually.
              </p>
            </div>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Click "Get AI Suggestions" to analyze your campaign performance and receive optimization recommendations.
            </p>
          )}
        </div>
      </div>
    </Layout>
  )
}
