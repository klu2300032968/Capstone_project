import React, { useState } from 'react';
import {
  X,
  Lock,
  User,
  Key,
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
  Cpu,
  Eye,
  EyeOff,
  AlertCircle,
  Mail,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginModal({ isOpen, onClose }) {
  const { login, signup, loading, error, setError } = useAuth();
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [selectedRoleHint, setSelectedRoleHint] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    if (setError) setError(null);

    if (!username.trim()) {
      setValidationError('Please enter your identity or username.');
      return;
    }
    if (authMode === 'signup' && !email.trim()) {
      setValidationError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setValidationError('Please enter your account password.');
      return;
    }
    if (authMode === 'signup' && password.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }

    const result = authMode === 'signup'
      ? await signup(username.trim(), email.trim(), password)
      : await login(username.trim(), password);

    if (result.success) {
      onClose();
    }
  };

  const setCredentials = (user, pass, role) => {
    setUsername(user);
    setPassword(pass);
    setSelectedRoleHint(role);
    setValidationError('');
    if (setError) setError(null);
  };

  return (
    <div className="enterprise-modal-backdrop" onClick={onClose}>
      <div
        className="enterprise-modal-card white-login-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="login-modal-header">
          <div className="login-title-group">
            <div className="login-icon-box">
              <Lock size={20} className="icon-blue" />
            </div>
            <div>
              <h3 className="login-heading">ARSA Enterprise Terminal</h3>
              <p className="login-subheading">Cryptographic Bearer JWT Authentication</p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose} title="Close Modal">
            <X size={18} />
          </button>
        </div>

        <div className="login-modal-body">
          {/* Mode Switcher */}
          <div className="auth-toggle-group">
            <button
              type="button"
              className={`auth-toggle-btn ${authMode === 'signin' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('signin');
                setValidationError('');
                if (setError) setError(null);
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
                setValidationError('');
                if (setError) setError(null);
              }}
            >
              <UserPlus size={13} />
              <span>Register Account</span>
            </button>
          </div>

          {/* Quick Demo Profile Selector (Sign-in mode only) */}
          {authMode === 'signin' && (
            <div className="demo-accounts-container">
              <div className="demo-accounts-heading">
                <Cpu size={14} className="icon-blue" />
                <span>Demonstration One-Click Credentials:</span>
              </div>
              <div className="demo-buttons-grid">
                <button
                  type="button"
                  className={`demo-credential-card ${selectedRoleHint === 'ADMIN' ? 'selected-admin' : ''}`}
                  onClick={() => setCredentials('admin', 'Admin@12345', 'ADMIN')}
                >
                  <div className="demo-card-top">
                    <ShieldCheck size={16} className="icon-purple" />
                    <span className="demo-card-role">Security Admin</span>
                  </div>
                  <div className="demo-card-creds">
                    <code>admin</code> • <code>Admin@12345</code>
                  </div>
                  <span className="demo-card-scope">Full ARSA & Operations Access</span>
                </button>

                <button
                  type="button"
                  className={`demo-credential-card ${selectedRoleHint === 'USER' ? 'selected-user' : ''}`}
                  onClick={() => setCredentials('alice_dev', 'SecurePassword@123', 'USER')}
                >
                  <div className="demo-card-top">
                    <User size={16} className="icon-blue" />
                    <span className="demo-card-role">Standard User</span>
                  </div>
                  <div className="demo-card-creds">
                    <code>alice_dev</code> • <code>SecurePassword@123</code>
                  </div>
                  <span className="demo-card-scope">Business Portal & RBAC 403 Demo</span>
                </button>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="enterprise-login-form">
            <div className="form-field-group">
              <label className="field-label">Account Identity / Username</label>
              <div className="field-input-wrapper">
                <User size={16} className="field-prefix-icon" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setValidationError('');
                    if (setError) setError(null);
                  }}
                  placeholder={authMode === 'signup' ? 'Choose unique username' : 'e.g. admin or alice_dev'}
                  className="white-input"
                  autoFocus
                />
              </div>
            </div>

            {authMode === 'signup' && (
              <div className="form-field-group">
                <label className="field-label">Email Address</label>
                <div className="field-input-wrapper">
                  <Mail size={16} className="field-prefix-icon" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="white-input"
                  />
                </div>
              </div>
            )}

            <div className="form-field-group">
              <label className="field-label">Account Password</label>
              <div className="field-input-wrapper">
                <Key size={16} className="field-prefix-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setValidationError('');
                    if (setError) setError(null);
                  }}
                  placeholder={authMode === 'signup' ? 'Min. 6 characters' : 'Enter account password'}
                  className="white-input"
                />
                <button
                  type="button"
                  className="btn-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Validation or Auth Error */}
            {validationError && (
              <div className="white-error-banner">
                <AlertCircle size={15} />
                <span>{validationError}</span>
              </div>
            )}

            {error && (
              <div className="white-error-banner">
                <ShieldAlert size={15} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn-primary full-width" disabled={loading}>
              {loading ? (
                <>
                  <span className="live-beacon"></span>
                  <span>{authMode === 'signup' ? 'Creating Account & Authorizing...' : 'Authenticating Identity...'}</span>
                </>
              ) : (
                <>
                  <span>{authMode === 'signup' ? 'Create Account & Authorize Bearer JWT' : 'Sign In & Authorize Bearer JWT'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Security Enforcement Footer */}
          <div className="login-security-notice">
            <ShieldCheck size={14} className="icon-emerald" />
            <span>Enforces HMAC-SHA256 • IP Normalized • Token Bucket Rate Limited</span>
          </div>
        </div>
      </div>
    </div>
  );
}
