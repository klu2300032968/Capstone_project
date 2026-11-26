import React from 'react';
import { X, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function RouteDetailModal({ route, onClose }) {
  if (!route) return null;

  const controlsList = [
    { name: 'JWT Authentication', passed: route.jwtAuth, desc: 'Enforces cryptographically signed Bearer JWT verification' },
    { name: 'Role-Based Access Control (RBAC)', passed: route.rbac, desc: 'Restricts route execution to authorized authority roles' },
    { name: 'Request Body Validation', passed: route.requestValidation, desc: 'Validates structure and constraints via Jakarta Bean Validation' },
    { name: 'Rate Limiting Protection', passed: route.rateLimiting, desc: 'Token bucket rate-limiter prevents brute-force & flood attacks' },
    { name: 'IP Filtering & Whitelisting', passed: route.ipFiltering, desc: 'Perimeter CIDR / IP whitelist & blacklist enforcement' },
    { name: 'Centralized Security Audit Logging', passed: route.auditLogging, desc: 'Persists route lifecycle and access events into MySQL audit storage' }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className={`method-badge method-${route.httpMethod.toLowerCase()}`}>
              {route.httpMethod}
            </span>
            <h3>{route.routePath}</h3>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
            {route.description}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{ background: 'rgba(31, 41, 55, 0.4)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Compliance Score</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {route.complianceScore.toFixed(1)}%
              </div>
            </div>

            <div style={{ background: 'rgba(31, 41, 55, 0.4)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Risk Tier</div>
              <div style={{ marginTop: '4px' }}>
                <span className={`risk-badge ${route.riskRating}`}>
                  {route.riskRating}
                </span>
              </div>
            </div>

            <div style={{ background: 'rgba(31, 41, 55, 0.4)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Controls</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {route.activeControlsCount} / 6
              </div>
            </div>
          </div>

          <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Security Control Audit Breakdown
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {controlsList.map((ctrl) => (
              <div
                key={ctrl.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(31, 41, 55, 0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{ctrl.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ctrl.desc}</div>
                </div>
                <div>
                  {ctrl.passed ? (
                    <span className="ctrl-badge ctrl-pass">
                      <CheckCircle size={13} />
                      <span>PASS</span>
                    </span>
                  ) : (
                    <span className="ctrl-badge ctrl-fail">
                      <XCircle size={13} />
                      <span>FAIL</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {route.recommendations && route.recommendations.length > 0 && (
            <div className="recommendations-box">
              <h4>
                <AlertTriangle size={16} />
                Remediation Recommendations ({route.recommendations.length})
              </h4>
              <ul className="recommendations-list">
                {route.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
