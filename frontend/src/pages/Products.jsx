import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../api/client'
import { API_URL } from '../api/client'
import { Package, Plus, Trash2, ExternalLink, Upload, DollarSign, Loader2 } from 'lucide-react'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', url: '', description: '', price: '', image: null })
  const [preview, setPreview] = useState(null)
  const fileRef = useRef()

  useEffect(() => { fetchProducts() }, [])

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products')
      setProducts(res.data)
    } finally {
      setLoading(false)
    }
  }

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setForm(f => ({ ...f, image: file }))
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      if (form.url) fd.append('url', form.url)
      if (form.description) fd.append('description', form.description)
      if (form.price) fd.append('price', form.price)
      if (form.image) fd.append('image', form.image)

      await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm({ name: '', url: '', description: '', price: '', image: null })
      setPreview(null)
      setShowForm(false)
      fetchProducts()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create product.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    await api.delete(`/products/${id}`)
    setProducts(p => p.filter(x => x.id !== id))
  }

  return (
    <Layout>
      <div className="animate-slide-in">
        <div className="section-header">
          <div>
            <h1 className="section-title">Products</h1>
            <p className="section-subtitle">Products you want to advertise on Instagram</p>
          </div>
          <button id="add-product-btn" className="btn-gradient" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} />
            Add Product
          </button>
        </div>

        {/* Add product form */}
        {showForm && (
          <div className="glass-card" style={{ padding: '28px', marginBottom: 28 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>New Product</h2>
            {error && <div className="alert-banner alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
                <div>
                  <label className="form-label">Product Name *</label>
                  <input id="product-name" className="form-input" placeholder="e.g. Premium Leather Wallet"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Product URL</label>
                  <input id="product-url" className="form-input" placeholder="https://yourstore.com/product"
                    value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} type="url" />
                </div>
                <div>
                  <label className="form-label">Price (₹)</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input id="product-price" className="form-input" style={{ paddingLeft: 36 }} placeholder="999"
                      value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} type="number" min="0" step="0.01" />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Description</label>
                <textarea id="product-desc" className="form-input" placeholder="Describe your product…"
                  style={{ minHeight: 90, resize: 'vertical' }}
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              {/* Image upload */}
              <div style={{ marginBottom: 24 }}>
                <label className="form-label">Product Image</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border)', borderRadius: 12, padding: '28px 20px',
                    textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s',
                    background: 'var(--bg-elevated)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-purple)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {preview ? (
                    <img src={preview} alt="preview" style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }} />
                  ) : (
                    <>
                      <Upload size={24} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
                      <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Click to upload image</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>JPEG, PNG, WebP · max 10MB</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} id="product-image" />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn-gradient" id="submit-product-btn" disabled={submitting}>
                  {submitting ? <><div className="spinner" />&nbsp;Saving…</> : <><Plus size={15} />Add Product</>}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Products list */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Loader2 size={28} className="animate-spin" color="var(--accent-purple)" />
          </div>
        ) : products.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Package size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>No products yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
              Add your first product to start creating Instagram campaigns.
            </p>
            <button className="btn-gradient" onClick={() => setShowForm(true)} id="first-product-btn">
              <Plus size={15} />Add First Product
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {products.map(p => (
              <div key={p.id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                {p.image_url && (
                  <img
                    src={`${API_URL}${p.image_url}`}
                    alt={p.name}
                    style={{ width: '100%', height: 180, objectFit: 'cover' }}
                  />
                )}
                {!p.image_url && (
                  <div style={{ height: 100, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={32} color="var(--text-muted)" />
                  </div>
                )}
                <div style={{ padding: '16px' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: 'var(--text-primary)' }}>{p.name}</div>
                  {p.price && <div style={{ fontSize: 16, fontWeight: 700, color: '#a78bfa', marginBottom: 6 }}>₹{p.price}</div>}
                  {p.description && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-gradient" style={{ padding: '8px 14px', fontSize: 13 }}
                      onClick={() => navigate('/campaigns/create', { state: { productId: p.id } })}>
                      <Plus size={13} />Create Ad
                    </button>
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '8px 12px', fontSize: 13 }}>
                        <ExternalLink size={13} />
                      </a>
                    )}
                    <button className="btn-danger" style={{ padding: '8px 12px', fontSize: 13, marginLeft: 'auto' }}
                      onClick={() => handleDelete(p.id)} id={`delete-product-${p.id}`}>
                      <Trash2 size={13} />
                    </button>
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
