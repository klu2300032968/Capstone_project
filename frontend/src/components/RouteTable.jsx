import React, { useState } from 'react';
import { Search, CheckCircle2, XCircle, Eye, ShieldAlert, ShieldCheck, Filter, ArrowUpRight } from 'lucide-react';

export default function RouteTable({ routes = [], onSelectRoute }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL');

  const filteredRoutes = routes.filter((route) => {
    const matchesSearch =
      route.routePath.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (route.description && route.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRisk = selectedRisk === 'ALL' || route.riskRating === selectedRisk;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="table-section cyber-card">
      <div className="table-toolbar">
        <div className="table-toolbar-left">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search API routes (e.g. /api/payments, orders, auth)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="results-counter">
            Showing <strong>{filteredRoutes.length}</strong> of {routes.length} routes
          </span>
        </div>

        <div className="filter-pills-group">
          <span className="filter-label">
            <Filter size={13} />
            <span>Risk Filter:</span>
          </span>
          <div className="filter-pills">
            {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((tier) => (
              <button
                key={tier}
                className={`filter-pill pill-${tier.toLowerCase()} ${selectedRisk === tier ? 'active' : ''}`}
                onClick={() => setSelectedRisk(tier)}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="arsa-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Route Path & Description</th>
              <th>JWT</th>
              <th>RBAC</th>
              <th>Validation</th>
              <th>Rate Limit</th>
              <th>IP Filter</th>
              <th>Audit Log</th>
              <th>Controls</th>
              <th>Score</th>
              <th>Risk Tier</th>
              <th style={{ textAlign: 'center' }}>Audit Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoutes.length === 0 ? (
              <tr>
                <td colSpan="12" className="empty-table-cell">
                  <ShieldAlert size={28} className="empty-icon" />
                  <div className="empty-title">No matching routes found</div>
                  <div className="empty-subtitle">Try adjusting your search query or risk filter criteria.</div>
                </td>
              </tr>
            ) : (
              filteredRoutes.map((route) => (
                <tr key={`${route.httpMethod}-${route.routePath}`} className="route-row">
                  <td>
                    <span className={`method-badge method-${route.httpMethod.toLowerCase()}`}>
                      {route.httpMethod}
                    </span>
                  </td>
                  <td>
                    <div className="route-path-cell">{route.routePath}</div>
                    <div className="route-desc">{route.description}</div>
                  </td>
                  <td>
                    <ControlBadge passed={route.jwtAuth} />
                  </td>
                  <td>
                    <ControlBadge passed={route.rbac} />
                  </td>
                  <td>
                    <ControlBadge passed={route.requestValidation} />
                  </td>
                  <td>
                    <ControlBadge passed={route.rateLimiting} />
                  </td>
                  <td>
                    <ControlBadge passed={route.ipFiltering} />
                  </td>
                  <td>
                    <ControlBadge passed={route.auditLogging} />
                  </td>
                  <td className="controls-count-cell">
                    <span className="controls-num">{route.activeControlsCount}</span>
                    <span className="controls-total">/6</span>
                  </td>
                  <td className="score-cell" style={{ color: getScoreColor(route.complianceScore) }}>
                    <div className="score-val">{route.complianceScore.toFixed(1)}%</div>
                    <div className="mini-progress-track">
                      <div
                        className="mini-progress-bar"
                        style={{
                          width: `${route.complianceScore}%`,
                          backgroundColor: getScoreColor(route.complianceScore)
                        }}
                      />
                    </div>
                  </td>
                  <td>
                    <span className={`risk-badge risk-${route.riskRating.toLowerCase()}`}>
                      {route.riskRating}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn-inspect"
                      onClick={() => onSelectRoute(route)}
                      title="Inspect Route Security Details"
                    >
                      <Eye size={13} />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ControlBadge({ passed }) {
  return passed ? (
    <span className="ctrl-badge ctrl-pass" title="Control Active & Enforced">
      <CheckCircle2 size={13} />
      <span>PASS</span>
    </span>
  ) : (
    <span className="ctrl-badge ctrl-fail" title="Control Missing or Disabled">
      <XCircle size={13} />
      <span>FAIL</span>
    </span>
  );
}

function getScoreColor(score) {
  if (score >= 90) return 'var(--risk-low)';
  if (score >= 70) return 'var(--risk-medium)';
  if (score >= 40) return 'var(--risk-high)';
  return 'var(--risk-critical)';
}
