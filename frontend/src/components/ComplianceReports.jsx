import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  ShieldCheck,
  Terminal,
  Database,
  Layers,
  FileSpreadsheet,
  Eye
} from 'lucide-react';
import { arsaApi, auditLogApi } from '../api/apiClient';

export default function ComplianceReports({ summary, routes }) {
  const [downloadingId, setDownloadingId] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');

  // Helper to trigger browser file download
  const triggerDownload = (content, filename, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 1. Export Audit Logs as CSV
  const handleExportAuditLogsCsv = async () => {
    setDownloadingId('audit-csv');
    try {
      const logs = await auditLogApi.getAll();
      const headers = ['ID', 'Timestamp', 'Client IP', 'HTTP Method', 'Path', 'Username', 'Action', 'HTTP Status', 'Status', 'Details'];
      const rows = logs.map(l => [
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
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      triggerDownload(csvContent, `ARSA_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    } catch (e) {
      alert('Failed to generate audit log CSV: ' + e.message);
    } finally {
      setDownloadingId(null);
    }
  };

  // 2. Export 11 Routes Security Matrix as CSV
  const handleExportRoutesCsv = () => {
    setDownloadingId('routes-csv');
    try {
      const headers = ['Route #', 'HTTP Method', 'Path', 'JWT Auth', 'RBAC', 'Validation', 'Rate Limiter', 'IP Filter', 'Audit Log', 'Active Controls', 'Compliance Score', 'Risk Rating'];
      const rows = routes.map((r, i) => [
        i + 1,
        r.httpMethod,
        `"${r.routePath}"`,
        r.jwtAuth ? 'YES' : 'NO',
        r.rbac ? 'YES' : 'NO',
        r.requestValidation ? 'YES' : 'NO',
        r.rateLimiting ? 'YES' : 'NO',
        r.ipFiltering ? 'YES' : 'NO',
        r.auditLogging ? 'YES' : 'NO',
        `${r.activeControlsCount}/6`,
        `${r.complianceScore}%`,
        r.riskRating
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      triggerDownload(csvContent, `ARSA_Routes_Security_Matrix_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    } finally {
      setDownloadingId(null);
    }
  };

  // 3. Export Executive Security Assessment (Markdown)
  const handleExportExecutiveReport = () => {
    setDownloadingId('executive-md');
    try {
      const md = `# ARSA EXECUTIVE SECURITY ASSESSMENT REPORT
Generated: ${new Date().toLocaleString()}
System: API Gateway Security Controls With Consistent Enforcement Across Routes
Target Audience: Project Guide / HOD / External Examiner

## 1. Executive Telemetry Overview
- Audited API Routes: ${summary?.totalRoutes || routes.length}
- Estate Compliance Index: ${(summary?.averageComplianceScore || 0).toFixed(2)}%
- Fully Compliant Routes (Score >= 90%): ${summary?.fullyCompliantRoutes || 0}
- Partially Compliant Routes (50% <= Score < 90%): ${summary?.partiallyCompliantRoutes || 0}
- Non-Compliant / Public Exposure (Score < 50%): ${summary?.nonCompliantRoutes || 0}

## 2. Risk Distribution
- LOW Risk Routes: ${summary?.riskDistribution?.LOW || 0}
- MEDIUM Risk Routes: ${summary?.riskDistribution?.MEDIUM || 0}
- HIGH Risk Routes: ${summary?.riskDistribution?.HIGH || 0}
- CRITICAL Risk Routes: ${summary?.riskDistribution?.CRITICAL || 0}

## 3. Perimeter Enforced Security Controls
1. JWT Authentication (HMAC-SHA256 Stateless Tokens)
2. Role-Based Access Control (@PreAuthorize Method Security)
3. Jakarta Bean Validation (DTO Payload Integrity)
4. Token Bucket Rate Limiting (Volumetric DDoS Defense)
5. Perimeter IP Filtering (Subnet CIDR Whitelist / Blacklist)
6. Centralized Audit Telemetry (Persistent Relational Trail in MySQL)

## 4. Route Security Breakdown
${routes.map((r, i) => `### Route ${i + 1}: [${r.httpMethod}] ${r.routePath}
- Description: ${r.description || 'API Endpoint'}
- Compliance Score: ${r.complianceScore}% (${r.activeControlsCount}/6 controls active)
- Risk Classification: ${r.riskRating}
- Active Controls: ${r.enabledControls?.join(', ') || 'None'}
- Missing Controls: ${r.missingControls?.join(', ') || 'None'}
`).join('\n')}

---
Certified by: Adaptive Route Security Analyzer (ARSA) v2.4
`;
      triggerDownload(md, `ARSA_Executive_Security_Report_${new Date().toISOString().slice(0, 10)}.md`, 'text/markdown');
    } finally {
      setDownloadingId(null);
    }
  };

  // 4. Preview Report
  const handlePreview = (title, generator) => {
    setPreviewTitle(title);
    setPreviewContent(generator());
  };

  return (
    <div className="section-container">
      <div className="section-header-row">
        <div>
          <div className="section-title-group">
            <FileText size={22} className="icon-cyan" />
            <h3>Security Compliance Reports & Data Exports</h3>
          </div>
          <p className="section-subtitle">
            Generate and download professional compliance dossiers, route audit matrices, and forensic audit log exports
          </p>
        </div>
      </div>

      <div className="reports-grid">
        {/* Report Card 1 */}
        <div className="report-card">
          <div className="report-card-top">
            <div className="report-icon-box cyan">
              <FileSpreadsheet size={24} />
            </div>
            <span className="file-format-tag">CSV SPREADSHEET</span>
          </div>
          <h4>Centralized Audit Log Vault Export</h4>
          <p className="report-desc">
            Complete raw export of security lifecycle events stored in MySQL: user logins, access denials, purchases, and IP traces.
          </p>
          <div className="report-actions">
            <button
              className="btn-download"
              onClick={handleExportAuditLogsCsv}
              disabled={downloadingId === 'audit-csv'}
            >
              <Download size={14} />
              <span>{downloadingId === 'audit-csv' ? 'Exporting...' : 'Download CSV'}</span>
            </button>
          </div>
        </div>

        {/* Report Card 2 */}
        <div className="report-card">
          <div className="report-card-top">
            <div className="report-icon-box purple">
              <FileSpreadsheet size={24} />
            </div>
            <span className="file-format-tag">CSV AUDIT MATRIX</span>
          </div>
          <h4>11 Routes Security Controls Matrix</h4>
          <p className="report-desc">
            Tabular breakdown of all 11 gateway routes with control status (JWT, RBAC, Validation, Rate Limiter, IP, Audit) and scores.
          </p>
          <div className="report-actions">
            <button
              className="btn-download"
              onClick={handleExportRoutesCsv}
              disabled={downloadingId === 'routes-csv'}
            >
              <Download size={14} />
              <span>{downloadingId === 'routes-csv' ? 'Exporting...' : 'Download CSV'}</span>
            </button>
          </div>
        </div>

        {/* Report Card 3 */}
        <div className="report-card">
          <div className="report-card-top">
            <div className="report-icon-box emerald">
              <ShieldCheck size={24} />
            </div>
            <span className="file-format-tag">MARKDOWN / PDF</span>
          </div>
          <h4>Executive Security Assessment Dossier</h4>
          <p className="report-desc">
            Complete assessment report with compliance index, risk distributions, defense architecture, and route-by-route gap analyses.
          </p>
          <div className="report-actions">
            <button
              className="btn-download"
              onClick={handleExportExecutiveReport}
              disabled={downloadingId === 'executive-md'}
            >
              <Download size={14} />
              <span>{downloadingId === 'executive-md' ? 'Exporting...' : 'Download Report'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
