import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Sparkles,
  AlertCircle,
  ShieldAlert,
  Lock,
  ShieldCheck,
  Terminal,
  Layers,
  ArrowRight,
  Activity,
  Database,
  CheckCircle2,
  User,
  Cpu,
  Server,
  Network,
  Users,
  TestTube,
  FileText,
  Eye,
  EyeOff,
  Key,
  Mail,
  UserPlus
} from 'lucide-react';
import { arsaApi, healthApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import ScoreGauge from '../components/ScoreGauge';
import RiskCard from '../components/RiskCard';
import ControlCoverage from '../components/ControlCoverage';
import RouteTable from '../components/RouteTable';
import RouteDetailModal from '../components/RouteDetailModal';
import EvaluateRouteModal from '../components/EvaluateRouteModal';
import AuditLogViewer from '../components/AuditLogViewer';
import UserPortal from '../components/UserPortal';
import UserManagement from '../components/UserManagement';
import SecurityTestingConsole from '../components/SecurityTestingConsole';
import SecurityMonitoring from '../components/SecurityMonitoring';
import ComplianceReports from '../components/ComplianceReports';
import GatewayDiagnostics from '../components/GatewayDiagnostics';
import OverviewView from '../components/OverviewView';

export default function Dashboard({ onOpenLogin }) {
  const { isAuthenticated, isAdmin, user, login, signup, loading: authLoading, error: authError, setError: setAuthGlobalError } = useAuth();
  const [adminTab, setAdminTab] = useState('overview');
  const [summary, setSummary] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [gatewayStatus, setGatewayStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isEvaluateOpen, setIsEvaluateOpen] = useState(false);
  const [quickLoginLoading, setQuickLoginLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // In-line landing login & registration state
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'
  const [landingUsername, setLandingUsername] = useState('');
  const [landingEmail, setLandingEmail] = useState('');
  const [landingPassword, setLandingPassword] = useState('');
  const [showLandingPassword, setShowLandingPassword] = useState(false);
  const [landingValidation, setLandingValidation] = useState('');

  const fetchData = async () => {
    if (!isAuthenticated || !isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [summaryRes, routesRes, healthRes] = await Promise.all([
        arsaApi.getSummary(),
        arsaApi.getRoutes(),
        healthApi.getHealth().catch(() => ({ status: 'UP' }))
      ]);
      setSummary(summaryRes);
      setRoutes(routesRes || []);
      setGatewayStatus(healthRes);
    } catch (err) {
      setError(err.message || 'Failed to connect to Spring Cloud Gateway / Backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated, isAdmin]);

  const handleQuickLogin = async (username, password) => {
    setLandingUsername(username);
    setLandingPassword(password);
    setLandingValidation('');
    if (setAuthGlobalError) setAuthGlobalError(null);
    setQuickLoginLoading(true);
    try {
      await login(username, password);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
    } finally {
      setQuickLoginLoading(false);
    }
  };

  const handleSelectTab = (tabId) => {
    setAdminTab(tabId);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLandingSubmit = async (e) => {
    e.preventDefault();
    setLandingValidation('');
    if (!landingUsername.trim()) {
      setLandingValidation('Please enter your username.');
      return;
    }
    if (authMode === 'signup' && !landingEmail.trim()) {
      setLandingValidation('Please enter a valid email address.');
      return;
    }
    if (!landingPassword) {
      setLandingValidation('Please enter your password.');
      return;
    }
    if (authMode === 'signup' && landingPassword.length < 6) {
      setLandingValidation('Password must be at least 6 characters.');
      return;
    }

    if (authMode === 'signup') {
      await signup(landingUsername.trim(), landingEmail.trim(), landingPassword);
    } else {
      await login(landingUsername.trim(), landingPassword);
    }
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Unauthenticated State (Landing & White Login Entry)
  if (!isAuthenticated) {
    return (
      <div className="landing-container white-landing-theme">
        <div className="landing-hero">
          <div className="landing-pill">
            <ShieldCheck size={14} className="icon-emerald" />
            <span>Final-Year B.Tech CSE Capstone Demonstration • Cybersecurity</span>
          </div>
          <h1 className="landing-title">
            API Gateway Security Controls With Consistent Enforcement Across Routes
          </h1>
          <p className="landing-subtitle">
            Enterprise microservices perimeter defense featuring the <strong>Adaptive Route Security Analyzer (ARSA)</strong>,
            automated compliance posture scoring, token-bucket rate limiting, and centralized audit telemetry.
          </p>

          {/* 4-Tier Architecture Diagram Preview */}
          <div className="architecture-preview-box">
            <div className="arch-flow-title">
              <Network size={15} className="icon-blue" />
              <span>Verified 4-Tier Distributed Architecture</span>
            </div>
            <div className="arch-flow-steps">
              <div className="arch-step">
                <div className="arch-icon"><Cpu size={16} /></div>
                <div className="arch-name">React + Vite</div>
                <div className="arch-port">:5174</div>
              </div>
              <div className="arch-arrow">→</div>
              <div className="arch-step highlight-gateway">
                <div className="arch-icon"><Layers size={16} /></div>
                <div className="arch-name">Cloud Gateway</div>
                <div className="arch-port">:8081</div>
              </div>
              <div className="arch-arrow">→</div>
              <div className="arch-step highlight-backend">
                <div className="arch-icon"><Server size={16} /></div>
                <div className="arch-name">Spring Boot API</div>
                <div className="arch-port">:8080</div>
              </div>
              <div className="arch-arrow">→</div>
              <div className="arch-step">
                <div className="arch-icon"><Database size={16} /></div>
                <div className="arch-name">MySQL Database</div>
                <div className="arch-port">:3306</div>
              </div>
            </div>
          </div>

          <div className="feature-cards-grid">
            <div className="feature-card">
              <div className="feature-icon icon-blue">
                <ShieldCheck size={20} />
              </div>
              <h4>6 Core Security Controls</h4>
              <p>JWT Auth, RBAC, Jakarta Bean Validation, Token Bucket Rate Limiting, CIDR IP Filtering, and Centralized Audit Logging.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon icon-emerald">
                <Activity size={20} />
              </div>
              <h4>ARSA Dynamic Risk Engine</h4>
              <p>Deep route inspection, risk-weight penalty calculation, and real-time remediation recommendation generation.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon icon-purple">
                <Database size={20} />
              </div>
              <h4>Centralized Security Audit</h4>
              <p>Tamper-evident audit ledger with internal HMAC-secured gateway ingestion and real-time telemetry stream.</p>
            </div>
          </div>
        </div>

        {/* White Login Card on Landing */}
        <div className="landing-auth-panel white-auth-card">
          <div className="access-denied-icon">
            <Lock size={28} />
          </div>
          <h2>Authentication Required</h2>
          <p>
            The Adaptive Route Security Analyzer (ARSA) and Centralized Audit stream are restricted to authorized
            cybersecurity administrators. Sign in with your assigned credentials to access the intelligence console.
          </p>

          {/* Quick Demo Login One-Click Buttons */}
          <div className="quick-demo-accounts">
            <div className="quick-demo-title">Demonstration Credentials:</div>

            <button
              className="quick-demo-btn admin-btn"
              onClick={() => handleQuickLogin('admin', 'Admin@12345')}
              disabled={quickLoginLoading || authLoading}
            >
              <div className="demo-btn-top">
                <ShieldCheck size={16} className="icon-emerald" />
                <span className="demo-role">Admin (ROLE_ADMIN)</span>
              </div>
              <div className="demo-creds">
                <code>admin</code> • <code>Admin@12345</code>
              </div>
              <div className="demo-access-text">
                Full ARSA Suite, Audit Stream & Route Inspector →
              </div>
            </button>

            <button
              className="quick-demo-btn user-btn"
              onClick={() => handleQuickLogin('alice_dev', 'SecurePassword@123')}
              disabled={quickLoginLoading || authLoading}
            >
              <div className="demo-btn-top">
                <User size={16} className="icon-blue" />
                <span className="demo-role">User (ROLE_USER)</span>
              </div>
              <div className="demo-creds">
                <code>alice_dev</code> • <code>SecurePassword@123</code>
              </div>
              <div className="demo-access-text">
                User Business Operations & RBAC 403 Proof →
              </div>
            </button>
          </div>

          {/* Sign In / Sign Up Mode Toggle */}
          <div className="auth-toggle-group">
            <button
              type="button"
              className={`auth-toggle-btn ${authMode === 'signin' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('signin');
                setLandingValidation('');
                if (setAuthGlobalError) setAuthGlobalError(null);
              }}
            >
              <Lock size={13} />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              className={`auth-toggle-btn ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('signup');
                setLandingValidation('');
                if (setAuthGlobalError) setAuthGlobalError(null);
              }}
            >
              <UserPlus size={13} />
              <span>Register Account</span>
            </button>
          </div>

          {/* In-line Login / Signup Form with Password Toggle */}
          <form onSubmit={handleLandingSubmit} className="landing-inline-login-form">
            <div className="form-field-group">
              <label className="field-label">Username</label>
              <div className="field-input-wrapper">
                <User size={15} className="field-prefix-icon" />
                <input
                  type="text"
                  placeholder={authMode === 'signup' ? 'Choose unique username' : 'admin or alice_dev'}
                  value={landingUsername}
                  onChange={(e) => {
                    setLandingUsername(e.target.value);
                    setLandingValidation('');
                    if (setAuthGlobalError) setAuthGlobalError(null);
                  }}
                  className="white-input"
                />
              </div>
            </div>

            {authMode === 'signup' && (
              <div className="form-field-group">
                <label className="field-label">Email Address</label>
                <div className="field-input-wrapper">
                  <Mail size={15} className="field-prefix-icon" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={landingEmail}
                    onChange={(e) => {
                      setLandingEmail(e.target.value);
                      setLandingValidation('');
                      if (setAuthGlobalError) setAuthGlobalError(null);
                    }}
                    className="white-input"
                  />
                </div>
              </div>
            )}

            <div className="form-field-group">
              <label className="field-label">Password</label>
              <div className="field-input-wrapper">
                <Key size={15} className="field-prefix-icon" />
                <input
                  type={showLandingPassword ? 'text' : 'password'}
                  placeholder={authMode === 'signup' ? 'Min. 6 characters' : 'Enter password'}
                  value={landingPassword}
                  onChange={(e) => {
                    setLandingPassword(e.target.value);
                    setLandingValidation('');
                    if (setAuthGlobalError) setAuthGlobalError(null);
                  }}
                  className="white-input"
                />
                <button
                  type="button"
                  className="btn-password-toggle"
                  onClick={() => setShowLandingPassword(!showLandingPassword)}
                  title={showLandingPassword ? 'Hide password' : 'Show password'}
                >
                  {showLandingPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {landingValidation && (
              <div className="white-error-banner">
                <AlertCircle size={14} />
                <span>{landingValidation}</span>
              </div>
            )}

            {authError && (
              <div className="white-error-banner">
                <ShieldAlert size={14} />
                <span>{authError}</span>
              </div>
            )}

            <button type="submit" className="btn-primary full-width" disabled={authLoading || quickLoginLoading}>
              {authLoading || quickLoginLoading ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  <span>{authMode === 'signup' ? 'Creating Account...' : 'Authenticating...'}</span>
                </>
              ) : (
                <>
                  {authMode === 'signup' ? <UserPlus size={14} /> : <Lock size={14} />}
                  <span>{authMode === 'signup' ? 'Create Account & Sign In' : 'Sign In with Credentials'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Standard User View (Non-Admin: Demonstrates User Portal & 403 Forbidden intercept)
  if (!isAdmin) {
    return (
      <div className="app-container">
        <UserPortal onSwitchToAdmin={onOpenLogin} />
      </div>
    );
  }

  // Administrator View: Full Enterprise Command Center with 9 Tabs
  return (
    <div className="enterprise-command-center">
      {/* Dark Navy Sidebar */}
      <Sidebar
        currentTab={adminTab}
        onSelectTab={handleSelectTab}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main White Content Area */}
      <main className="enterprise-main-stage">
        {error && (
          <div className="white-error-banner" style={{ marginBottom: '20px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Executive Overview */}
        {adminTab === 'overview' && (
          <OverviewView
            summary={summary}
            routes={routes}
            gatewayStatus={gatewayStatus}
            onNavigate={handleSelectTab}
            onOpenEvaluate={() => setIsEvaluateOpen(true)}
            onSelectRoute={(route) => setSelectedRoute(route)}
          />
        )}

        {/* Tab 2: ARSA Route Analyzer */}
        {adminTab === 'arsa' && (
          <div className="section-container">
            <div className="section-header-row">
              <div>
                <div className="section-title-group">
                  <ShieldCheck size={22} className="icon-blue" />
                  <h3>Adaptive Route Security Analyzer (ARSA)</h3>
                </div>
                <p className="section-subtitle">
                  Continuous security control auditing, compliance posture scoring, and risk classification across all microservice routes
                </p>
              </div>
              <div className="header-actions">
                <button className="btn-secondary" onClick={fetchData} disabled={loading} title="Refresh Live Data">
                  <RefreshCw size={14} className={loading ? 'spin' : ''} />
                  <span>Refresh Telemetry</span>
                </button>
                <button className="btn-primary" onClick={() => setIsEvaluateOpen(true)}>
                  <Sparkles size={15} />
                  <span>Evaluate Custom Route</span>
                </button>
              </div>
            </div>

            <div className="metrics-grid">
              <ScoreGauge
                score={summary?.averageComplianceScore || 0}
                totalRoutes={summary?.totalRoutes || routes.length}
              />

              <RiskCard
                riskDistribution={summary?.riskDistribution || {}}
              />

              <ControlCoverage
                totalRoutes={summary?.totalRoutes || routes.length}
                missingControls={summary?.missingControlsSummary || {}}
              />
            </div>

            <div className="table-container">
              <RouteTable
                routes={routes}
                onSelectRoute={(route) => setSelectedRoute(route)}
              />
            </div>
          </div>
        )}

        {/* Tab 3: API Routes Dedicated View */}
        {adminTab === 'routes' && (
          <div className="section-container">
            <div className="section-header-row">
              <div>
                <div className="section-title-group">
                  <Network size={22} className="icon-blue" />
                  <h3>API Routes Security Matrix</h3>
                </div>
                <p className="section-subtitle">
                  Detailed inspection of all 11 registered ingress paths, control activation status, and risk classification
                </p>
              </div>
              <div className="header-actions">
                <button className="btn-primary" onClick={() => setIsEvaluateOpen(true)}>
                  <Sparkles size={15} />
                  <span>Evaluate Custom Route</span>
                </button>
              </div>
            </div>

            <RouteTable
              routes={routes}
              onSelectRoute={(route) => setSelectedRoute(route)}
            />
          </div>
        )}

        {/* Tab 4: Security Monitoring */}
        {adminTab === 'monitoring' && (
          <SecurityMonitoring />
        )}

        {/* Tab 5: Centralized Audit Logs */}
        {adminTab === 'audit' && (
          <AuditLogViewer />
        )}

        {/* Tab 6: Security Testing Console */}
        {adminTab === 'testing' && (
          <SecurityTestingConsole />
        )}

        {/* Tab 7: System Health Diagnostics */}
        {adminTab === 'health' && (
          <GatewayDiagnostics routes={routes} />
        )}

        {/* Tab 8: Compliance Reports */}
        {adminTab === 'reports' && (
          <ComplianceReports summary={summary} routes={routes} />
        )}

        {/* Tab 9: User Management (Admin Only) */}
        {adminTab === 'users' && (
          <UserManagement />
        )}
      </main>

      {/* Inspect Route Modal */}
      {selectedRoute && (
        <RouteDetailModal
          route={selectedRoute}
          onClose={() => setSelectedRoute(null)}
        />
      )}

      {/* Evaluate Custom Route Modal */}
      {isEvaluateOpen && (
        <EvaluateRouteModal
          isOpen={isEvaluateOpen}
          onClose={() => setIsEvaluateOpen(false)}
        />
      )}
    </div>
  );
}
