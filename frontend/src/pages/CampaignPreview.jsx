import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../api/client'
import { API_URL } from '../api/client'
import {
  Camera, Edit3, Rocket, Users, Target, Lightbulb, Settings,
  CheckCircle2, AlertCircle, Loader2, ArrowLeft, Star
} from 'lucide-react'

export default function CampaignPreview() {
  const location = useLocation()
  const navigate = useNavigate()
  const { aiPlan, formData, product } = location.state || {}
  const [launching, setLaunching] = useState(false)
  const [error, setError] = useState('')

  if (!aiPlan || !product) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <AlertCircle size={40} color="var(--warning)" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>No campaign data found. Please generate a plan first.</p>
          <button className="btn-gradient" style={{ marginTop: 16 }} onClick={() => navigate('/campaigns/create')}>
            Create Campaign
          </button>
        </div>
      </Layout>
    )
  }

  const { audience, ad_copy, creative_concept, campaign_settings, is_demo } = aiPlan

  const handleLaunch = async () => {
    setLaunching(true)
    setError('')
    try {
      const campaignName = `${product.name} — ${formData.campaign_goal} Campaign`
      const res = await api.post('/campaigns/launch', {
        product_id: parseInt(formData.product_id),
        ai_plan: aiPlan,
        campaign_name: campaignName,
        target_country: formData.target_country,
        daily_budget: parseFloat(formData.daily_budget),
        objective: campaign_settings.objective,
      })
      navigate(`/campaigns/${res.data.id}`, { state: { launched: true } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Launch failed. Please try again.')
      setLaunching(false)
    }
  }

  return (
    <Layout>
      <div className="animate-slide-in" style={{ maxWidth: 760 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button onClick={() => navigate('/campaigns/create')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 16, padding: 0 }}>
            <ArrowLeft size={14} />Back to editor
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Instagram Campaign Preview</h1>
            {is_demo && <span className="badge badge-warning">⚡ AI Demo</span>}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Review your AI-generated campaign before launching.
          </p>
        </div>

        {is_demo && (
          <div className="alert-banner alert-info" style={{ marginBottom: 20 }}>
            <Star size={16} style={{ flexShrink: 0 }} />
            <span>This is an AI-generated demo plan. Set your OPENAI_API_KEY for personalized recommendations based on your product.</span>
          </div>
        )}

        {error && (
          <div className="alert-banner alert-error" style={{ marginBottom: 20 }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Campaign overview */}
        <div className="glass-card" style={{ padding: '20px', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {[
              { label: 'Product', value: product.name },
              { label: 'Goal', value: formData.campaign_goal },
              { label: 'Daily Budget', value: `₹${formData.daily_budget}` },
              { label: 'Target', value: formData.target_country },
              { label: 'Age', value: `${audience.age_min}–${audience.age_max}` },
              { label: 'Duration', value: `${campaign_settings.suggested_duration_days} days` },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '12px 0' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Ad Preview card */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Camera size={15} color="#e879f9" /> Ad Preview
          </h2>
          <div style={{
            border: '1px solid var(--border)', borderRadius: 14,
            overflow: 'hidden', maxWidth: 360, margin: '0 auto',
            background: 'var(--bg-elevated)',
          }}>
            {/* Instagram-style header */}
            <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--accent-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Camera size={15} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{product.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sponsored</div>
              </div>
            </div>
            {/* Product image */}
            {product.image_url ? (
              <img src={`${API_URL}${product.image_url}`} alt={product.name}
                style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%', aspectRatio: '1/1',
                background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.3))',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: 'white',
              }}>
                <Camera size={48} style={{ opacity: 0.5, marginBottom: 8 }} />
                <p style={{ fontSize: 13, opacity: 0.6 }}>No image uploaded</p>
              </div>
            )}
            {/* CTA bar */}
            <div style={{
              padding: '12px 14px', background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{ad_copy.headline}</span>
              <span style={{
                background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 12px',
                fontSize: 12, fontWeight: 600, color: 'white',
              }}>{ad_copy.cta}</span>
            </div>
            {/* Ad copy */}
            <div style={{ padding: '12px 14px' }}>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{ad_copy.primary_text}</p>
              {ad_copy.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{ad_copy.description}</p>}
            </div>
          </div>
        </div>

        {/* Audience */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={15} color="#a78bfa" /> Target Audience
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>{audience.description}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span className="badge badge-purple">Age {audience.age_min}–{audience.age_max}</span>
            <span className="badge badge-purple">{audience.location}</span>
            {audience.interests.map(i => (
              <span key={i} className="badge badge-gray">{i}</span>
            ))}
          </div>
        </div>

        {/* Creative concept */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lightbulb size={15} color="#fbbf24" /> Creative Concept
          </h2>
          {[
            { label: 'Image Concept', value: creative_concept.image_concept },
            { label: 'Hook Strategy', value: creative_concept.hook },
            { label: 'Visual Structure', value: creative_concept.visual_structure },
            { label: 'Text Overlay', value: creative_concept.text_overlay },
          ].map(({ label, value }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Campaign settings */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: 28 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={15} color="#34d399" /> Campaign Settings
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            {[
              { label: 'Objective', value: campaign_settings.objective },
              { label: 'Daily Budget', value: `₹${campaign_settings.recommended_daily_budget}` },
              { label: 'Duration', value: `${campaign_settings.suggested_duration_days} days` },
              { label: 'Placement', value: campaign_settings.placement },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
          {campaign_settings.notes && (
            <div className="alert-banner alert-info">
              <Target size={15} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13 }}>{campaign_settings.notes}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => navigate('/campaigns/create')} id="edit-campaign-btn">
            <Edit3 size={15} />Edit
          </button>
          <button
            id="approve-launch-btn"
            className="btn-gradient"
            style={{ flex: 1, justifyContent: 'center', padding: '14px' }}
            onClick={handleLaunch}
            disabled={launching}
          >
            {launching ? (
              <><Loader2 size={17} className="animate-spin" />&nbsp;Launching…</>
            ) : (
              <><Rocket size={17} />Approve &amp; Launch</>
            )}
          </button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>
          Campaigns are created in <strong>PAUSED</strong> state. You can activate them from the Meta Ads Manager.
        </p>
      </div>
    </Layout>
  )
}
