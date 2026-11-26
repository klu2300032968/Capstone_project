import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Clock,
  User,
  Globe,
  Radio,
  CheckCircle2,
  XCircle,
  Filter
} from 'lucide-react';
import { auditLogApi } from '../api/apiClient';

export default function SecurityMonitoring() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await auditLogApi.getAll();
      setLogs(data || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve real-time audit logs from MySQL');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Compute telemetry metrics from actual database audit logs
  const totalEvents = logs.length;
  const loginFailures = logs.filter(l => l.action?.includes('LOGIN_FAIL') || l.httpStatus === 401).length;
  const forbiddenEvents = logs.filter(l => l.httpStatus === 403 || l.status === 'DENIED' || l.status === 'FORBIDDEN').length;
  const rateLimitEvents = logs.filter(l => l.httpStatus === 429 || l.action?.includes('RATE_LIMIT')).length;
  const validationErrors = logs.filter(l => l.httpStatus === 400).length;
  const successfulEvents = logs.filter(l => l.httpStatus === 200 || l.httpStatus === 201 || l.status === 'SUCCESS').length;

  const filteredLogs = logs.filter(log => {
    if (filterSeverity === 'ALERTS') {
      return log.httpStatus >= 400 || log.status !== 'SUCCESS';
    }
    if (filterSeverity === 'SUCCESS') {
      return log.httpStatus === 200 || log.httpStatus === 201 || log.status === 'SUCCESS';
    }
    return true;
  });

  return (
    <div className="section-container">
      <div className="section-header-row">
        <div>
          <div className="section-title-group">
            <Activity size={22} className="icon-cyan" />
            <h3>Real-Time Security Event Telemetry & Incident Feed</h3>
          </div>
          <p className="section-subtitle">
            Continuous threat detection, volumetric rate-limiting alerts, and live HTTP perimeter incident stream from MySQL
          </p>
        </div>
        <div className="header-actions">
          <div className="live-feed-pill">
            <span className="live-pulsing-dot"></span>
            <span>GATEWAY STREAM LIVE</span>
          </div>
          <button className="btn-secondary" onClick={fetchLogs} disabled={loading} title="Refresh Telemetry">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={18} className="icon-red" />
          <span>{error}</span>
        </div>
      )}

      {/* Real Incident Counters */}
      <div className="telemetry-stats-banner">
        <div className="telemetry-card">
          <div className="telemetry-icon-box cyan"><Activity size={18} /></div>
          <div className="telemetry-info">
            <span className="telemetry-val">{totalEvents}</span>
            <span className="telemetry-lbl">Audited Events</span>
          </div>
        </div>

        <div className="telemetry-card">
          <div className="telemetry-icon-box red"><ShieldAlert size={18} /></div>
          <div className="telemetry-info">
            <span className="telemetry-val text-red">{forbiddenEvents}</span>
            <span className="telemetry-lbl">403 Forbidden Violations</span>
          </div>
        </div>

        <div className="telemetry-card">
          <div className="telemetry-icon-box amber"><AlertTriangle size={18} /></div>
          <div className="telemetry-info">
            <span className="telemetry-val text-amber">{loginFailures}</span>
            <span className="telemetry-lbl">Auth / 401 Denials</span>
          </div>
        </div>

        <div className="telemetry-card">
          <div className="telemetry-icon-box purple"><Radio size={18} /></div>
          <div className="telemetry-info">
            <span className="telemetry-val text-purple">{rateLimitEvents}</span>
            <span className="telemetry-lbl">Rate-Limit Throttles (429)</span>
          </div>
        </div>

        <div className="telemetry-card">
          <div className="telemetry-icon-box emerald"><CheckCircle2 size={18} /></div>
          <div className="telemetry-info">
            <span className="telemetry-val text-emerald">{successfulEvents}</span>
            <span className="telemetry-lbl">Authorized 200 OK</span>
          </div>
        </div>
      </div>

      {/* Incident Distribution Breakdown */}
      <div className="monitoring-grid">
        <div className="incident-breakdown-card">
          <h4>Perimeter Threat & Response Distribution</h4>
          <p className="card-sub">Distribution of HTTP responses intercepted at the Gateway perimeter</p>

          <div className="meter-list">
            <div className="meter-item">
              <div className="meter-header">
                <span className="meter-name">Authorized Ingress (HTTP 200/201)</span>
                <span className="meter-val text-emerald">{successfulEvents} ({totalEvents ? Math.round((successfulEvents/totalEvents)*100) : 0}%)</span>
              </div>
              <div className="meter-track">
                <div
                  className="meter-fill fill-emerald"
                  style={{ width: `${totalEvents ? (successfulEvents/totalEvents)*100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="meter-item">
              <div className="meter-header">
                <span className="meter-name">RBAC & Permission Blocks (HTTP 403)</span>
                <span className="meter-val text-red">{forbiddenEvents} ({totalEvents ? Math.round((forbiddenEvents/totalEvents)*100) : 0}%)</span>
              </div>
              <div className="meter-track">
                <div
                  className="meter-fill fill-red"
                  style={{ width: `${totalEvents ? (forbiddenEvents/totalEvents)*100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="meter-item">
              <div className="meter-header">
                <span className="meter-name">Unauthenticated Ingress Denials (HTTP 401)</span>
                <span className="meter-val text-amber">{loginFailures} ({totalEvents ? Math.round((loginFailures/totalEvents)*100) : 0}%)</span>
              </div>
              <div className="meter-track">
                <div
                  className="meter-fill fill-amber"
                  style={{ width: `${totalEvents ? (loginFailures/totalEvents)*100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="meter-item">
              <div className="meter-header">
                <span className="meter-name">Volumetric Rate-Limiting Throttles (HTTP 429)</span>
                <span className="meter-val text-purple">{rateLimitEvents} ({totalEvents ? Math.round((rateLimitEvents/totalEvents)*100) : 0}%)</span>
              </div>
              <div className="meter-track">
                <div
                  className="meter-fill fill-purple"
                  style={{ width: `${totalEvents ? (rateLimitEvents/totalEvents)*100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="meter-item">
              <div className="meter-header">
                <span className="meter-name">Payload Constraint Rejections (HTTP 400)</span>
                <span className="meter-val text-cyan">{validationErrors} ({totalEvents ? Math.round((validationErrors/totalEvents)*100) : 0}%)</span>
              </div>
              <div className="meter-track">
                <div
                  className="meter-fill fill-cyan"
                  style={{ width: `${totalEvents ? (validationErrors/totalEvents)*100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Incident Feed */}
        <div className="incident-feed-card">
          <div className="feed-header-row">
            <h4>Live Incident Stream ({filteredLogs.length})</h4>
            <div className="filter-pill-group">
              <button
                className={`filter-pill ${filterSeverity === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilterSeverity('ALL')}
              >
                All Events
              </button>
              <button
                className={`filter-pill ${filterSeverity === 'ALERTS' ? 'active' : ''}`}
                onClick={() => setFilterSeverity('ALERTS')}
              >
                Alerts & Blocks
              </button>
              <button
                className={`filter-pill ${filterSeverity === 'SUCCESS' ? 'active' : ''}`}
                onClick={() => setFilterSeverity('SUCCESS')}
              >
                Success Only
              </button>
            </div>
          </div>

          <div className="incident-scroll-list">
            {filteredLogs.length === 0 ? (
              <div className="empty-state">No matching security events recorded.</div>
            ) : (
              filteredLogs.slice(0, 15).map((log, idx) => {
                const isAlert = log.httpStatus >= 400 || log.status !== 'SUCCESS';
                return (
                  <div key={log.id || idx} className={`incident-item ${isAlert ? 'item-alert' : 'item-success'}`}>
                    <div className="incident-icon">
                      {isAlert ? <ShieldAlert size={16} className="icon-red" /> : <ShieldCheck size={16} className="icon-emerald" />}
                    </div>
                    <div className="incident-content">
                      <div className="incident-top">
                        <span className="incident-action">{log.action}</span>
                        <span className={`status-code-pill status-${log.httpStatus}`}>
                          HTTP {log.httpStatus}
                        </span>
                      </div>
                      <div className="incident-details">{log.details || log.path}</div>
                      <div className="incident-meta">
                        <span><Clock size={11} /> {new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span><User size={11} /> {log.username || 'anonymous'}</span>
                        <span><Globe size={11} /> {log.clientIp}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
