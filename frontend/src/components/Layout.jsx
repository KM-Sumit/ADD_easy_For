import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Camera, Package, Megaphone,
  BarChart3, Settings, LogOut, Menu, X, Zap, ChevronRight
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/connect', icon: Camera, label: 'Connect Instagram' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/campaigns/create', icon: Megaphone, label: 'Create Campaign' },
  { to: '/campaigns', icon: BarChart3, label: 'My Campaigns' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

function SidebarContent({ onNavClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      padding: '24px 16px',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Zap size={18} color="white" fill="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>InstaPilot</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>AI Ads</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavClick}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '11px 12px',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'white' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-gradient)' : 'transparent',
              transition: 'all 0.15s ease',
              boxShadow: isActive ? '0 4px 12px rgba(124,58,237,0.3)' : 'none',
            })}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{
        marginTop: 'auto', paddingTop: 16,
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ padding: '8px 12px', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '10px 12px',
            background: 'transparent', border: 'none',
            color: 'var(--text-secondary)', fontSize: 14,
            cursor: 'pointer', borderRadius: 10,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = 'var(--danger)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Desktop sidebar */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        position: 'sticky', top: 0, height: '100vh',
        overflowY: 'auto',
        display: 'none',
      }}
        className="lg-sidebar"
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside style={{
        position: 'fixed', left: sidebarOpen ? 0 : -280,
        top: 0, bottom: 0, width: 260,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        zIndex: 51, transition: 'left 0.3s ease',
        overflowY: 'auto',
      }}>
        <SidebarContent onNavClick={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Mobile top bar */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '8px 10px', cursor: 'pointer',
              color: 'var(--text-primary)', display: 'flex',
            }}
          >
            <Menu size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={14} color="white" fill="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>InstaPilot AI</span>
          </div>
          <div style={{ width: 40 }} />
        </header>

        <main style={{ flex: 1, padding: '24px 20px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .lg-sidebar { display: block !important; }
          header { display: none !important; }
        }
      `}</style>
    </div>
  )
}
