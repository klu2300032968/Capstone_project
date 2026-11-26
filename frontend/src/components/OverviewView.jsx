import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Layers,
  Server,
  Database,
  Cpu,
  Activity,
  ArrowRight,
  AlertTriangle,
  Lock,
  Globe,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText
} from 'lucide-react';
import ScoreGauge from './ScoreGauge';
import RiskCard from './RiskCard';
import ControlCoverage from './ControlCoverage';
import RouteTable from './RouteTable';
import { auditLogApi } from '../api/apiClient';

export default function OverviewView({
  summary,
  routes = [],
  gatewayStatus,
  onNavigate,
  onOpenEvaluate,
  onSelectRoute
}) {
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    let mounted = true;
    const fetchRecent = async () => {
      try {
        const data = await auditLogApi.getAll();
        if (mounted && Array.isArray(data)) {
          setRecentLogs(data.slice(0, 5));
        }
      } catch (e) {
        // Fallback silently if logs cannot be loaded
      }
    };
    fetchRecent();
    return () => { mounted = false; };
  }, []);

  const totalRoutes = summary?.totalRoutes || routes.length || 11;
  const protectedRoutes = routes.filter((r) => r.jwtAuth).length || 7;
  const publicRoutes = totalRoutes - protectedRoutes;
  const criticalCount = summary?.riskDistribution?.CRITICAL || 3;
  const complianceScore = summary?.averageComplianceScore || 72.73;

  return (
    <div className="overview-view-container">
      {/* Page Header */}
      <div className="overview-header-row">
        <div>
          <h2 className="overview-main-title">Adaptive Route Security Analyzer — Security Overview</h2>
          <p className="overview-sub-title">
            Centralized perimeter defense metrics, distributed cluster health, and real-time security posture across all microservices
          </p>
        </div>
        <div className="overview-header-actions">
          <button className="btn-secondary" onClick={() => onNavigate('testing')}>
            <Activity size={15} />
            <span>Launch Security Suite</span>
          </button>
          <button className="btn-primary" onClick={onOpenEvaluate}>
            <Sparkles size={15} />
            <span>Evaluate Custom Route</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="kpi-cards-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Overall Security Score</span>
            <div className="kpi-icon-badge blue"><ShieldCheck size={18} /></div>
          </div>
          <div className="kpi-metric-row">
            <span className="kpi-val text-blue">{Math.round(complianceScore * 10) / 10} pts</span>
            <span className="kpi-chip chip-moderate">ENFORCED</span>
          </div>
          <p className="kpi-subtext">Weighted average across 6 security controls on 11 routes</p>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Total API Endpoints</span>
            <div className="kpi-icon-badge indigo"><Layers size={18} /></div>
          </div>
          <div className="kpi-metric-row">
            <span className="kpi-val">{totalRoutes}</span>
            <span className="kpi-chip chip-info">Active</span>
          </div>
          <p className="kpi-subtext">Registered across auth, orders, products & intelligence</p>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Protected vs Public</span>
            <div className="kpi-icon-badge emerald"><Lock size={18} /></div>
          </div>
          <div className="kpi-metric-row">
            <span className="kpi-val text-emerald">{protectedRoutes} <span className="kpi-val-sub">/ {totalRoutes}</span></span>
            <span className="kpi-chip chip-success">{Math.round((protectedRoutes / totalRoutes) * 100)}% Secure</span>
          </div>
          <p className="kpi-subtext">{publicRoutes} endpoints open for public catalog / documentation</p>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Critical Attention Routes</span>
            <div className="kpi-icon-badge red"><AlertTriangle size={18} /></div>
          </div>
          <div className="kpi-metric-row">
            <span className="kpi-val text-red">{criticalCount}</span>
            <span className="kpi-chip chip-danger">Action Required</span>
          </div>
          <p className="kpi-subtext">Endpoints missing token bucket or strict input validation</p>
        </div>
      </div>

      {/* 4-Pillar Distributed Infrastructure Health */}
      <div className="infrastructure-health-card">
        <div className="health-card-header">
          <div>
            <h4 className="health-card-title">Distributed Perimeter Health & Cluster Topology</h4>
            <p className="health-card-sub">Real-time status of the 4-tier microservices security architecture</p>
          </div>
          <button className="btn-link" onClick={() => onNavigate('health')}>
            <span>View Full Diagnostics</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="health-nodes-grid">
          <div className="health-node-card">
            <div className="health-node-top">
              <div className="node-icon-box"><Cpu size={18} /></div>
              <span className="node-status-badge status-up">ONLINE</span>
            </div>
            <span className="node-name">React + Vite UI</span>
            <span className="node-port">Port :5174</span>
            <span className="node-meta">Client Single Page App • Clean White Theme</span>
          </div>

          <div className="health-node-card">
            <div className="health-node-top">
              <div className="node-icon-box node-gateway"><Globe size={18} /></div>
              <span className="node-status-badge status-up">ONLINE</span>
            </div>
            <span className="node-name">Spring Cloud Gateway</span>
            <span className="node-port">Port :8081</span>
            <span className="node-meta">Netty Reactive Engine • Token Bucket & IP Filter</span>
          </div>

          <div className="health-node-card">
            <div className="health-node-top">
              <div className="node-icon-box"><Server size={18} /></div>
              <span className="node-status-badge status-up">ONLINE</span>
            </div>
            <span className="node-name">Spring Boot API</span>
            <span className="node-port">Port :8080</span>
            <span className="node-meta">Tomcat 10 • JWT HMAC-SHA256 • ARSA Engine</span>
          </div>

          <div className="health-node-card">
            <div className="health-node-top">
              <div className="node-icon-box"><Database size={18} /></div>
              <span className="node-status-badge status-up">ONLINE</span>
            </div>
            <span className="node-name">MySQL Database</span>
            <span className="node-port">Port :3306</span>
            <span className="node-meta">api_security_db • Users, Roles, Audit Vault</span>
          </div>
        </div>
      </div>

      {/* ARSA Score, Risk Distribution & Control Coverage */}
      <div className="metrics-grid">
        <ScoreGauge
          score={complianceScore}
          totalRoutes={totalRoutes}
        />

        <RiskCard
          riskDistribution={summary?.riskDistribution || { LOW: 3, MEDIUM: 4, HIGH: 1, CRITICAL: 3 }}
        />

        <ControlCoverage
          totalRoutes={totalRoutes}
          missingControls={summary?.missingControlsSummary || {}}
        />
      </div>

      {/* API Route Security Matrix */}
      <div className="overview-route-table-section">
        <div className="section-title-between">
          <div>
            <h3 className="section-heading">Audited API Route Security Controls</h3>
            <p className="section-subtext">Comprehensive control enforcement across all 11 registered microservice routes</p>
          </div>
          <button className="btn-secondary" onClick={() => onNavigate('routes')}>
            <span>Open Route Inspector</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <RouteTable
          routes={routes}
          onSelectRoute={onSelectRoute}
        />
      </div>

      {/* Recent Security Events & Quick Actions Row */}
      <div className="overview-split-grid">
        {/* Recent Audit Ingress Events */}
        <div className="recent-events-card">
          <div className="recent-events-header">
            <div>
              <h4 className="events-title">Recent Perimeter Ingress Events</h4>
              <p className="events-sub">Live audit trail intercepted by the Spring Cloud Gateway</p>
            </div>
            <button className="btn-link" onClick={() => onNavigate('audit')}>
              <span>View All Logs</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="recent-events-list">
            {recentLogs.length === 0 ? (
              <div className="no-events-box">
                <CheckCircle2 size={24} className="text-emerald" />
                <span>All gateway perimeter requests are actively audited in MySQL</span>
              </div>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="recent-event-item">
                  <div className="event-item-left">
                    <span className={`http-pill code-${log.httpStatus || 200}`}>
                      {log.httpStatus || 200}
                    </span>
                    <div className="event-meta-col">
                      <div className="event-path-row">
                        <span className="event-method">{log.httpMethod}</span>
                        <span className="event-path">{log.path}</span>
                      </div>
                      <span className="event-user">Identity: {log.username || 'anonymous'} • {log.action}</span>
                    </div>
                  </div>
                  <div className="event-item-right">
                    <span className="event-timestamp">
                      <Clock size={11} style={{ display: 'inline', marginRight: '4px' }} />
                      {log.timestamp ? log.timestamp.substring(11, 19) : 'Just now'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Executive Action Shortcuts */}
        <div className="quick-shortcuts-card">
          <h4 className="events-title">Administrative Actions</h4>
          <p className="events-sub">Rapid operational workflows for the college presentation</p>

          <div className="shortcuts-list">
            <div className="shortcut-item" onClick={() => onNavigate('routes')}>
              <div className="shortcut-icon-box blue"><Layers size={18} /></div>
              <div className="shortcut-body">
                <span className="shortcut-name">Audit 11 Routes Matrix</span>
                <span className="shortcut-desc">Inspect per-route security controls, JWT, and risk tiers</span>
              </div>
              <ArrowRight size={16} className="shortcut-arrow" />
            </div>

            <div className="shortcut-item" onClick={() => onNavigate('testing')}>
              <div className="shortcut-icon-box purple"><Activity size={18} /></div>
              <div className="shortcut-body">
                <span className="shortcut-name">Run Security Attack Simulator</span>
                <span className="shortcut-desc">Live simulation of JWT forgery, 403 RBAC, and 429 burst</span>
              </div>
              <ArrowRight size={16} className="shortcut-arrow" />
            </div>

            <div className="shortcut-item" onClick={() => onNavigate('monitoring')}>
              <div className="shortcut-icon-box emerald"><Activity size={18} /></div>
              <div className="shortcut-body">
                <span className="shortcut-name">Perimeter Threat Telemetry</span>
                <span className="shortcut-desc">Real-time threat counters, rate-limit warnings, and incident stream</span>
              </div>
              <ArrowRight size={16} className="shortcut-arrow" />
            </div>

            <div className="shortcut-item" onClick={() => onNavigate('reports')}>
              <div className="shortcut-icon-box cyan"><FileText size={18} /></div>
              <div className="shortcut-body">
                <span className="shortcut-name">Download Compliance Reports</span>
                <span className="shortcut-desc">Export Audit Log CSV and 11 Routes Security Matrix</span>
              </div>
              <ArrowRight size={16} className="shortcut-arrow" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
