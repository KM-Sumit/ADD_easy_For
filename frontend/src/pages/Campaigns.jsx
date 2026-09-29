import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../api/client'
import {
  Megaphone, TrendingUp, Pause, Play, BarChart3, Plus, Loader2,
  ExternalLink, Calendar, DollarSign
} from 'lucide-react'

function statusBadge(s) {
  if (s === 'ACTIVE') return 'badge-success'
  if (s === 'PAUSED') return 'badge-warning'
  if (s === 'DEMO') return 'badge-purple'
  if (s === 'DRAFT') return 'badge-gray'
  return 'badge-gray'
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { fetchCampaigns() }, [])

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/campaigns')
      setCampaigns(res.data)
    } finally {
      setLoading(false)
    }
  }

  const handlePause = async (id, e) => {
    e.stopPropagation()
    await api.post(`/campaigns/${id}/pause`)
    setCampaigns(cs => cs.map(c => c.id === id ? { ...c, status: 'PAUSED' } : c))
  }

  const handleResume = async (id, e) => {
    e.stopPropagation()
    await api.post(`/campaigns/${id}/resume`)
    setCampaigns(cs => cs.map(c => c.id === id ? { ...c, status: 'ACTIVE' } : c))
  }

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <Loader2 size={28} className="animate-spin" color="var(--accent-purple)" />
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="animate-slide-in">
        <div className="section-header">
          <div>
            <h1 className="section-title">My Instagram Campaigns</h1>
            <p className="section-subtitle">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} total</p>
          </div>
          <button className="btn-gradient" onClick={() => navigate('/campaigns/create')} id="new-campaign-btn">
            <Plus size={16} />New Campaign
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Megaphone size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>No campaigns yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
              Create your first AI-powered Instagram campaign.
            </p>
            <button className="btn-gradient" onClick={() => navigate('/campaigns/create')} id="first-campaign-btn">
              <Plus size={15} />Create Campaign
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {campaigns.map(c => (
              <div
                key={c.id}
                className="glass-card"
                style={{ padding: '20px 24px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                onClick={() => navigate(`/campaigns/${c.id}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-active)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span className={`badge ${statusBadge(c.status)}`}>{c.status}</span>
                      {c.external_campaign_id?.startsWith('DEMO_') && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Demo Mode</span>
                      )}
                    </div>
                    <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>{c.name}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <DollarSign size={12} />₹{c.daily_budget}/day
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <TrendingUp size={12} />{c.objective}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} />{new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {c.external_campaign_id && !c.external_campaign_id.startsWith('DEMO_') && (
                      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        ID: {c.external_campaign_id}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: 13 }}
                      onClick={(e) => { e.stopPropagation(); navigate(`/campaigns/${c.id}`) }}
                      id={`view-campaign-${c.id}`}
                    >
                      <BarChart3 size={14} />View
                    </button>
                    {c.status === 'ACTIVE' ? (
                      <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}
                        onClick={(e) => handlePause(c.id, e)} id={`pause-campaign-${c.id}`}>
                        <Pause size={14} />Pause
                      </button>
                    ) : c.status === 'PAUSED' ? (
                      <button className="btn-gradient" style={{ padding: '8px 14px', fontSize: 13 }}
                        onClick={(e) => handleResume(c.id, e)} id={`resume-campaign-${c.id}`}>
                        <Play size={14} />Resume
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
