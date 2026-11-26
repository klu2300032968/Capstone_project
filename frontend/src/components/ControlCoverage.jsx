import React from 'react';
import { Key, Users, CheckSquare, Sliders, Globe, Database, ShieldCheck } from 'lucide-react';

const CONTROLS = [
  { key: 'Rate Limiting', label: 'Rate Limiting', icon: Sliders },
  { key: 'IP Filtering', label: 'IP Filtering', icon: Globe },
  { key: 'Centralized Audit Logging', label: 'Audit Logging', icon: Database },
  { key: 'JWT Authentication', label: 'JWT Auth', icon: Key },
  { key: 'Role-Based Access Control', label: 'RBAC', icon: Users },
  { key: 'Request Validation', label: 'Req Validation', icon: CheckSquare }
];

export default function ControlCoverage({ totalRoutes = 0, missingControls = {} }) {
  return (
    <div className="card cyber-card">
      <div className="card-title">
        <div className="card-title-left">
          <ShieldCheck size={16} className="icon-cyan" />
          <span>Security Controls Coverage</span>
        </div>
        <span className="route-count-pill">6 Core Controls</span>
      </div>

      <div className="coverage-list">
        {CONTROLS.map((ctrl) => {
          const Icon = ctrl.icon;
          const missingCount = missingControls[ctrl.key] || 0;
          const activeCount = totalRoutes > 0 ? Math.max(0, totalRoutes - missingCount) : 0;
          const percentage = totalRoutes > 0 ? Math.round((activeCount / totalRoutes) * 100) : 0;

          return (
            <div key={ctrl.key} className="coverage-row">
              <div className="coverage-header">
                <div className="coverage-name-group">
                  <Icon size={14} className="control-icon" />
                  <span className="coverage-name">{ctrl.label}</span>
                </div>
                <span className="coverage-stat">
                  <strong>{activeCount}</strong>/{totalRoutes} ({percentage}%)
                </span>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${percentage}%`,
                    background: percentage === 100 
                      ? 'linear-gradient(90deg, #10b981, #059669)' 
                      : percentage >= 60 
                      ? 'linear-gradient(90deg, #06b6d4, #3b82f6)' 
                      : 'linear-gradient(90deg, #f59e0b, #ef4444)'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
