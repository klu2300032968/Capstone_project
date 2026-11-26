import React from 'react';
import { ShieldCheck, Activity, AlertTriangle, AlertOctagon, BarChart3 } from 'lucide-react';

export default function RiskCard({ riskDistribution = {} }) {
  const low = riskDistribution['LOW'] || 0;
  const medium = riskDistribution['MEDIUM'] || 0;
  const high = riskDistribution['HIGH'] || 0;
  const critical = riskDistribution['CRITICAL'] || 0;
  const total = low + medium + high + critical;

  const lowPct = total > 0 ? (low / total) * 100 : 0;
  const medPct = total > 0 ? (medium / total) * 100 : 0;
  const highPct = total > 0 ? (high / total) * 100 : 0;
  const critPct = total > 0 ? (critical / total) * 100 : 0;

  return (
    <div className="card cyber-card">
      <div className="card-title">
        <div className="card-title-left">
          <BarChart3 size={16} className="icon-cyan" />
          <span>Risk Profile Distribution</span>
        </div>
        <span className="route-count-pill">4 Rating Tiers</span>
      </div>

      {/* Segmented Distribution Bar */}
      <div className="segmented-risk-bar">
        {lowPct > 0 && (
          <div
            className="seg-bar seg-low"
            style={{ width: `${lowPct}%` }}
            title={`Low Risk: ${low} routes (${lowPct.toFixed(0)}%)`}
          />
        )}
        {medPct > 0 && (
          <div
            className="seg-bar seg-medium"
            style={{ width: `${medPct}%` }}
            title={`Medium Risk: ${medium} routes (${medPct.toFixed(0)}%)`}
          />
        )}
        {highPct > 0 && (
          <div
            className="seg-bar seg-high"
            style={{ width: `${highPct}%` }}
            title={`High Risk: ${high} routes (${highPct.toFixed(0)}%)`}
          />
        )}
        {critPct > 0 && (
          <div
            className="seg-bar seg-critical"
            style={{ width: `${critPct}%` }}
            title={`Critical Risk: ${critical} routes (${critPct.toFixed(0)}%)`}
          />
        )}
      </div>

      <div className="risk-grid">
        <div className="risk-item low">
          <div className="risk-item-header">
            <ShieldCheck size={16} className="icon-emerald" />
            <span className="risk-count">{low}</span>
          </div>
          <div className="risk-info">
            <h4>Low Risk</h4>
            <p>Score 90–100%</p>
          </div>
        </div>

        <div className="risk-item medium">
          <div className="risk-item-header">
            <Activity size={16} className="icon-blue" />
            <span className="risk-count">{medium}</span>
          </div>
          <div className="risk-info">
            <h4>Medium</h4>
            <p>Score 70–89%</p>
          </div>
        </div>

        <div className="risk-item high">
          <div className="risk-item-header">
            <AlertTriangle size={16} className="icon-amber" />
            <span className="risk-count">{high}</span>
          </div>
          <div className="risk-info">
            <h4>High Risk</h4>
            <p>Score 40–69%</p>
          </div>
        </div>

        <div className="risk-item critical">
          <div className="risk-item-header">
            <AlertOctagon size={16} className="icon-crimson" />
            <span className="risk-count">{critical}</span>
          </div>
          <div className="risk-info">
            <h4>Critical</h4>
            <p>Score 0–39%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
