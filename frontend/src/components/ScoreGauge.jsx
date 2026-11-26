import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Info, Zap } from 'lucide-react';

export default function ScoreGauge({ score = 0, totalRoutes = 0 }) {
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = '#ef4444'; // Red (Critical)
  let glowColor = 'rgba(239, 68, 68, 0.4)';
  let statusText = 'CRITICAL RISK';
  let statusClass = 'risk-critical';
  let Icon = ShieldAlert;
  let statusDescription = 'Severe perimeter or identity gaps detected';

  if (score >= 90) {
    strokeColor = '#10b981'; // Green (Low)
    glowColor = 'rgba(16, 185, 129, 0.4)';
    statusText = 'OPTIMAL COMPLIANCE';
    statusClass = 'risk-low';
    Icon = ShieldCheck;
    statusDescription = 'All core perimeter & auth controls active';
  } else if (score >= 70) {
    strokeColor = '#3b82f6'; // Blue (Medium)
    glowColor = 'rgba(59, 130, 246, 0.4)';
    statusText = 'MODERATE POSTURE';
    statusClass = 'risk-medium';
    Icon = ShieldCheck;
    statusDescription = 'Acceptable baseline; minor control omissions';
  } else if (score >= 40) {
    strokeColor = '#f59e0b'; // Amber (High)
    glowColor = 'rgba(245, 158, 11, 0.4)';
    statusText = 'ELEVATED RISK';
    statusClass = 'risk-high';
    Icon = AlertTriangle;
    statusDescription = 'Missing critical validation or audit controls';
  }

  return (
    <div className="card score-card cyber-card">
      <div className="card-title">
        <div className="card-title-left">
          <Zap size={16} className="icon-cyan" />
          <span>Estate Compliance Posture</span>
        </div>
        <span className="route-count-pill">{totalRoutes} Routes</span>
      </div>

      <div className="gauge-wrapper">
        <svg className="gauge-svg" viewBox="0 0 160 160">
          <defs>
            <linearGradient id="scoreGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.8" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="1" />
            </linearGradient>
            <filter id="gaugeGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background Track */}
          <circle
            className="gauge-bg"
            cx="80"
            cy="80"
            r={radius}
          />

          {/* Active Fill Track */}
          <circle
            className="gauge-fill"
            cx="80"
            cy="80"
            r={radius}
            style={{
              stroke: 'url(#scoreGaugeGrad)',
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              filter: `drop-shadow(0 0 8px ${glowColor})`
            }}
          />
        </svg>

        <div className="gauge-center-text">
          <span className="score-number" style={{ color: strokeColor }}>
            {score.toFixed(1)}%
          </span>
          <span className="score-unit">ARSA INDEX</span>
        </div>
      </div>

      <div className="gauge-footer-meta">
        <div className={`score-status-pill ${statusClass}`}>
          <Icon size={14} />
          <span>{statusText}</span>
        </div>
        <p className="gauge-desc">{statusDescription}</p>
        <div className="formula-tag">
          <code>Formula: (Active Controls / 6) × 100%</code>
        </div>
      </div>
    </div>
  );
}
