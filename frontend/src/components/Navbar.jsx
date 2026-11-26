import React from 'react';
import { Shield, User, LogOut, Activity, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenLogin }) {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();

  return (
    <header className="enterprise-navbar">
      <div className="nav-left">
        <div className="nav-brand-group">
          <div className="nav-logo-box">
            <Shield size={20} className="nav-logo-icon" />
          </div>
          <div className="nav-brand-text">
            <div className="nav-title-row">
              <span className="nav-main-title">ARSA Enterprise Defense</span>
              <span className="nav-version-badge">v2.4 Production</span>
            </div>
            <span className="nav-tagline">
              API Gateway Security Controls With Consistent Route Enforcement
            </span>
          </div>
        </div>
      </div>

      <div className="nav-center">
        <div className="nav-health-status">
          <span className="live-beacon"></span>
          <span className="health-label">Perimeter Active (:8081)</span>
          <span className="health-dot">•</span>
          <span className="health-type">Reactive Netty Gateway</span>
        </div>
      </div>

      <div className="nav-right">
        {isAuthenticated ? (
          <div className="nav-user-cluster">
            <div className="user-profile-card">
              <div className={`user-avatar-circle ${isAdmin ? 'admin-avatar-glow' : ''}`}>
                <User size={15} />
              </div>
              <div className="user-text-col">
                <span className="user-display-name">{user?.username}</span>
                <span className="user-display-email">{user?.email || (user?.username === 'admin' ? 'admin@security.local' : 'user@security.local')}</span>
              </div>
              <span className={`role-tag ${isAdmin ? 'role-tag-admin' : 'role-tag-user'}`}>
                {user?.role}
              </span>
            </div>

            <button
              className="btn-signout"
              onClick={logout}
              title="Sign out of current security session"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <button className="btn-primary" onClick={onOpenLogin}>
            <Lock size={15} />
            <span>Sign In to Terminal</span>
          </button>
        )}
      </div>
    </header>
  );
}
