import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../api/client'
import { Zap, Target, Globe, DollarSign, Megaphone, MapPin, Loader2, AlertCircle, Sparkles } from 'lucide-react'

const GOALS = [
  { value: 'sales', label: 'Sales', desc: 'Drive product purchases' },
  { value: 'leads', label: 'Leads', desc: 'Collect customer info' },
  { value: 'website_traffic', label: 'Website Traffic', desc: 'Bring visitors to your site' },
]

export default function CreateCampaign() {
  const location = useLocation()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    product_id: location.state?.productId || '',
    target_country: 'India',
    target_cities: '',
    daily_budget: '500',
    campaign_goal: 'sales',
  })

  useEffect(() => {
    api.get('/products').then(r => setProducts(r.data)).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.product_id) { setError('Please select a product.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/campaigns/plan', {
        product_id: parseInt(form.product_id),
        target_country: form.target_country,
        target_cities: form.target_cities || null,
        daily_budget: parseFloat(form.daily_budget),
        campaign_goal: form.campaign_goal,
      })
      // Navigate to preview with AI plan + form data
      navigate('/campaigns/preview', {
        state: {
          aiPlan: res.data,
          formData: form,
          product: products.find(p => p.id === parseInt(form.product_id)),
        }
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'AI planning failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="animate-slide-in" style={{ maxWidth: 700 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={18} color="white" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Create Instagram Campaign</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Fill in the details and our AI will generate a complete campaign plan.
          </p>
        </div>

        {error && (
          <div className="alert-banner alert-error" style={{ marginBottom: 20 }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Product selection */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target size={15} color="#a78bfa" /> Product
            </h2>
            <div>
              <label className="form-label">Select Product *</label>
              <select
                id="campaign-product"
                className="form-input"
                value={form.product_id}
                onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}
                required
              >
                <option value="">Choose a product…</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}{p.price ? ` — ₹${p.price}` : ''}</option>
                ))}
              </select>
              {products.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  No products yet.{' '}
                  <a href="/products" style={{ color: '#a78bfa' }}>Add a product first</a>
                </p>
              )}
            </div>
          </div>

          {/* Targeting */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={15} color="#a78bfa" /> Targeting
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label">Target Country *</label>
                <select id="target-country" className="form-input"
                  value={form.target_country}
                  onChange={e => setForm(f => ({ ...f, target_country: e.target.value }))}>
                  <option>India</option>
                  <option>United States</option>
                  <option>United Kingdom</option>
                  <option>Canada</option>
                  <option>Australia</option>
                  <option>Germany</option>
                  <option>France</option>
                  <option>Singapore</option>
                  <option>UAE</option>
                </select>
              </div>
              <div>
                <label className="form-label">Target Cities (optional)</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input id="target-cities" className="form-input" style={{ paddingLeft: 34 }}
                    placeholder="Mumbai, Delhi…"
                    value={form.target_cities}
                    onChange={e => setForm(f => ({ ...f, target_cities: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={15} color="#a78bfa" /> Budget
            </h2>
            <div>
              <label className="form-label">Daily Budget (₹)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 15 }}>₹</span>
                <input id="daily-budget" className="form-input" style={{ paddingLeft: 32 }}
                  type="number" min="100" step="50" placeholder="500"
                  value={form.daily_budget}
                  onChange={e => setForm(f => ({ ...f, daily_budget: e.target.value }))}
                  required />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                Minimum ₹100/day recommended. Meta charges in your ad account currency.
              </p>
            </div>
          </div>

          {/* Campaign goal */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: 28 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Megaphone size={15} color="#a78bfa" /> Campaign Goal
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {GOALS.map(g => (
                <label
                  key={g.value}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    background: form.campaign_goal === g.value ? 'rgba(124,58,237,0.15)' : 'var(--bg-elevated)',
                    border: `1px solid ${form.campaign_goal === g.value ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
                    borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <input type="radio" name="campaign_goal" value={g.value}
                    checked={form.campaign_goal === g.value}
                    onChange={() => setForm(f => ({ ...f, campaign_goal: g.value }))}
                    style={{ accentColor: 'var(--accent-purple)', width: 16, height: 16 }}
                    id={`goal-${g.value}`}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{g.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{g.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            id="generate-ai-campaign-btn"
            type="submit"
            className="btn-gradient"
            style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: 16 }}
            disabled={loading}
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" />&nbsp;Generating AI Campaign Plan…</>
            ) : (
              <><Zap size={18} fill="white" />Generate AI Campaign</>
            )}
          </button>
          {loading && (
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
              Our AI is analyzing your product and crafting the perfect campaign…
            </p>
          )}
        </form>
      </div>
    </Layout>
  )
}
