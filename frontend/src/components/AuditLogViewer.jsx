import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Terminal,
  User,
  Globe,
  Activity,
  CheckCircle2,
  XCircle,
  Download,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Clock
} from 'lucide-react';
import { auditLogApi } from '../api/apiClient';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await auditLogApi.getAll();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve audit log telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filtered dataset
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Text Search
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        (log.username && log.username.toLowerCase().includes(search)) ||
        (log.action && log.action.toLowerCase().includes(search)) ||
        (log.clientIp && log.clientIp.toLowerCase().includes(search)) ||
        (log.path && log.path.toLowerCase().includes(search)) ||
        (log.details && log.details.toLowerCase().includes(search));

      // 2. HTTP Status Filter
      const isSuccess = log.status === 'SUCCESS' || (log.httpStatus >= 200 && log.httpStatus < 300);
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'SUCCESS' && isSuccess) ||
        (statusFilter === 'FAILURE' && !isSuccess);

      // 3. Action Filter
      const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

      // 4. Category Filter
      let matchesCategory = true;
      if (categoryFilter !== 'ALL') {
        const action = log.action || '';
        if (categoryFilter === 'AUTH') {
          matchesCategory = action.includes('LOGIN') || action.includes('AUTH');
        } else if (categoryFilter === 'GOVERNANCE') {
          matchesCategory = action.includes('FORBIDDEN') || action.includes('USER');
        } else if (categoryFilter === 'RATE_LIMIT') {
          matchesCategory = action.includes('RATE_LIMIT') || log.httpStatus === 429;
        } else if (categoryFilter === 'BUSINESS') {
          matchesCategory = action.includes('ORDER') || action.includes('PRODUCT') || action.includes('PAYMENT');
        } else if (categoryFilter === 'ARSA') {
          matchesCategory = action.includes('ARSA') || log.path?.includes('/api/arsa');
        }
      }

      // 5. Date Range Filter
      let matchesDate = true;
      if (log.timestamp) {
        const logDate = log.timestamp.substring(0, 10);
        if (startDate && logDate < startDate) matchesDate = false;
        if (endDate && logDate > endDate) matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesAction && matchesCategory && matchesDate;
    });
  }, [logs, searchTerm, statusFilter, actionFilter, categoryFilter, startDate, endDate]);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, actionFilter, categoryFilter, startDate, endDate, pageSize]);

  // Paginated Slicing
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Export CSV
  const handleExportCsv = () => {
    if (!filteredLogs.length) return;
    const headers = ['ID', 'Timestamp', 'Client IP', 'HTTP Method', 'Path', 'Username', 'Action', 'HTTP Status', 'Status', 'Details'];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.clientIp}"`,
      `"${l.httpMethod}"`,
      `"${l.path}"`,
      `"${l.username || 'anonymous'}"`,
      `"${l.action}"`,
      l.httpStatus,
      `"${l.status}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ARSA_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const uniqueActions = ['ALL', ...Array.from(new Set(logs.map((log) => log.action).filter(Boolean)))];

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setActionFilter('ALL');
    setCategoryFilter('ALL');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="audit-section-container">
      {/* Header */}
      <div className="audit-header-row">
        <div>
          <div className="audit-title-group">
            <Terminal size={22} className="icon-blue" />
            <h3 className="audit-heading">Centralized Audit Log Vault</h3>
          </div>
          <p className="audit-subtitle">
            Tamper-evident security ledger capturing all HTTP ingress events, authentication requests, and policy rejections
          </p>
        </div>

        <div className="header-actions">
          <button
            className="btn-download"
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            title="Export filtered records to CSV"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button
            className="btn-secondary"
            onClick={fetchLogs}
            disabled={loading}
            title="Refresh Audit Telemetry"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="white-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="audit-filter-card">
        {/* Row 1: Search, Status, Category, Action */}
        <div className="filter-controls-row">
          <div className="audit-search-box">
            <Search size={16} className="search-prefix-icon" />
            <input
              type="text"
              placeholder="Search by IP, path, username, action, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="white-input"
            />
          </div>

          <div className="filter-item">
            <label className="filter-label">Outcome Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="white-select"
            >
              <option value="ALL">All Outcomes</option>
              <option value="SUCCESS">Success Only (HTTP 2xx)</option>
              <option value="FAILURE">Denied / Blocked (4xx/5xx)</option>
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label">Event Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="white-select"
            >
              <option value="ALL">All Categories</option>
              <option value="AUTH">Authentication & Sign-in</option>
              <option value="GOVERNANCE">RBAC & Identity Access</option>
              <option value="RATE_LIMIT">Rate-Limiting Events (429)</option>
              <option value="BUSINESS">Orders & Commerce</option>
              <option value="ARSA">ARSA Route Intelligence</option>
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label">Specific Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="white-select"
            >
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Date Range, Reset, Page Size */}
        <div className="date-controls-row">
          <div className="date-pickers-group">
            <Calendar size={15} className="text-muted" />
            <span className="date-label">Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="white-date-input"
              title="Start Date"
            />
            <span className="date-separator">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="white-date-input"
              title="End Date"
            />
          </div>

          <div className="filter-actions-right">
            {(searchTerm || statusFilter !== 'ALL' || actionFilter !== 'ALL' || categoryFilter !== 'ALL' || startDate || endDate) && (
              <button className="btn-link-reset" onClick={clearAllFilters}>
                Clear All Filters
              </button>
            )}

            <div className="page-size-selector">
              <span className="filter-label">Show per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="white-select-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="white-table-card">
        {loading ? (
          <div className="table-loading-box">
            <RefreshCw size={28} className="spin icon-blue" />
            <span>Querying security telemetry from MySQL audit vault...</span>
          </div>
        ) : paginatedLogs.length === 0 ? (
          <div className="table-empty-box">
            <AlertCircle size={28} className="text-muted" />
            <div className="empty-title">No Audit Records Found</div>
            <div className="empty-sub">No log entries matched your filter parameters. Try clearing the search query or date range.</div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="enterprise-data-table">
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>ID</th>
                  <th style={{ width: '170px' }}>Timestamp (UTC)</th>
                  <th style={{ width: '130px' }}>Client IP</th>
                  <th style={{ width: '90px' }}>Method</th>
                  <th>Route Ingress Path</th>
                  <th style={{ width: '130px' }}>Identity</th>
                  <th style={{ width: '170px' }}>Action Triggered</th>
                  <th style={{ width: '90px' }}>Status</th>
                  <th style={{ width: '100px' }}>Outcome</th>
                  <th>Details & Context</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log) => {
                  const isSuccess = log.status === 'SUCCESS' || (log.httpStatus >= 200 && log.httpStatus < 300);
                  const is403 = log.httpStatus === 403;
                  const is401 = log.httpStatus === 401;
                  const is429 = log.httpStatus === 429;
                  return (
                    <tr key={log.id}>
                      <td className="mono text-muted">#{log.id}</td>
                      <td className="timestamp-cell">
                        <Clock size={12} className="text-muted" style={{ display: 'inline', marginRight: '5px' }} />
                        <span>{log.timestamp ? log.timestamp.replace('T', ' ').substring(0, 19) : 'N/A'}</span>
                      </td>
                      <td className="mono font-semibold">{log.clientIp || '127.0.0.1'}</td>
                      <td>
                        <span className={`method-pill method-${(log.httpMethod || 'GET').toLowerCase()}`}>
                          {log.httpMethod}
                        </span>
                      </td>
                      <td className="mono text-primary font-medium">{log.path}</td>
                      <td>
                        <span className="user-identity-pill">
                          <User size={12} />
                          <span>{log.username || 'anonymous'}</span>
                        </span>
                      </td>
                      <td>
                        <span className={`action-tag ${isSuccess ? 'action-ok' : is403 || is401 ? 'action-warn' : is429 ? 'action-rate' : 'action-info'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <span className={`http-code-tag code-${log.httpStatus || 200}`}>
                          HTTP {log.httpStatus || 200}
                        </span>
                      </td>
                      <td>
                        <span className={`outcome-pill ${isSuccess ? 'outcome-pass' : 'outcome-fail'}`}>
                          {isSuccess ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          <span>{isSuccess ? 'PERMIT' : 'BLOCKED'}</span>
                        </span>
                      </td>
                      <td className="details-cell" title={log.details}>
                        {log.details || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="table-pagination-footer">
          <div className="pagination-count-text">
            Showing <strong>{filteredLogs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong>{Math.min(currentPage * pageSize, filteredLogs.length)}</strong> of{' '}
            <strong>{filteredLogs.length}</strong> audited records
          </div>

          <div className="pagination-controls">
            <button
              className="btn-page-nav"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              title="Previous Page"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            <span className="page-indicator-pill">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>

            <button
              className="btn-page-nav"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              title="Next Page"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
