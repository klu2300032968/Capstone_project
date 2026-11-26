import React, { useState } from 'react';
import { X, Sparkles, Shield, AlertTriangle } from 'lucide-react';
import { arsaApi } from '../api/apiClient';

export default function EvaluateRouteModal({ onClose, onEvaluationComplete }) {
  const [formData, setFormData] = useState({
    routePath: '/api/v2/financial/transfer',
    httpMethod: 'POST',
    description: 'Financial asset transfer transaction',
    jwtAuth: true,
    rbac: true,
    requestValidation: true,
    rateLimiting: false,
    ipFiltering: false,
    auditLogging: true
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const toggleControl = (key) => {
    setFormData((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const evaluation = await arsaApi.evaluateRoute(formData);
      setResult(evaluation);
      if (onEvaluationComplete) {
        onEvaluationComplete(evaluation);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} style={{ color: 'var(--accent-cyan)' }} />
            <h3>ARSA Sandbox Route Evaluator</h3>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleEvaluate}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>HTTP Method</label>
                <select
                  value={formData.httpMethod}
                  onChange={(e) => setFormData({ ...formData, httpMethod: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(17, 24, 39, 0.9)',
                    border: '1px solid var(--border-color)',
                    padding: '8px',
                    borderRadius: '6px',
                    marginTop: '4px'
                  }}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Route Path Pattern</label>
                <input
                  type="text"
                  value={formData.routePath}
                  onChange={(e) => setFormData({ ...formData, routePath: e.target.value })}
                  required
                  placeholder="/api/v1/..."
                  style={{
                    width: '100%',
                    background: 'rgba(17, 24, 39, 0.9)',
                    border: '1px solid var(--border-color)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    marginTop: '4px',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Route Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the function of this API endpoint..."
                style={{
                  width: '100%',
                  background: 'rgba(17, 24, 39, 0.9)',
                  border: '1px solid var(--border-color)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginTop: '4px'
                }}
              />
            </div>

            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Configure Enforced Security Controls (Toggle on/off)
            </label>

            <div className="toggle-grid">
              <ToggleCard
                title="JWT Authentication"
                desc="Enforces Bearer token verification"
                active={formData.jwtAuth}
                onClick={() => toggleControl('jwtAuth')}
              />
              <ToggleCard
                title="Role-Based Access Control"
                desc="Enforces authority / role permissions"
                active={formData.rbac}
                onClick={() => toggleControl('rbac')}
              />
              <ToggleCard
                title="Request Validation"
                desc="Enforces schema & Bean validation"
                active={formData.requestValidation}
                onClick={() => toggleControl('requestValidation')}
              />
              <ToggleCard
                title="Rate Limiting"
                desc="Token bucket anti-flood defense"
                active={formData.rateLimiting}
                onClick={() => toggleControl('rateLimiting')}
              />
              <ToggleCard
                title="IP Filtering"
                desc="Whitelist / Blacklist enforcement"
                active={formData.ipFiltering}
                onClick={() => toggleControl('ipFiltering')}
              />
              <ToggleCard
                title="Audit Logging"
                desc="Persists security event logs"
                active={formData.auditLogging}
                onClick={() => toggleControl('auditLogging')}
              />
            </div>

            {error && (
              <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '6px', marginTop: '12px', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Evaluating...' : 'Run ARSA Evaluation'}
              </button>
            </div>
          </form>

          {result && (
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={16} style={{ color: 'var(--accent-cyan)' }} />
                ARSA Evaluation Results
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(31, 41, 55, 0.4)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Score</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                    {result.complianceScore.toFixed(1)}%
                  </div>
                </div>

                <div style={{ background: 'rgba(31, 41, 55, 0.4)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Risk Rating</div>
                  <div style={{ marginTop: '4px' }}>
                    <span className={`risk-badge ${result.riskRating}`}>
                      {result.riskRating}
                    </span>
                  </div>
                </div>

                <div style={{ background: 'rgba(31, 41, 55, 0.4)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Controls Active</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                    {result.activeControlsCount} / 6
                  </div>
                </div>
              </div>

              {result.recommendations && result.recommendations.length > 0 && (
                <div className="recommendations-box">
                  <h4>
                    <AlertTriangle size={16} />
                    Missing Controls & Recommendations ({result.recommendations.length})
                  </h4>
                  <ul className="recommendations-list">
                    {result.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleCard({ title, desc, active, onClick }) {
  return (
    <div className={`toggle-card ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="toggle-label">
        <h5>{title}</h5>
        <p>{desc}</p>
      </div>
      <div className="switch-indicator">
        <div className="switch-knob" />
      </div>
    </div>
  );
}
