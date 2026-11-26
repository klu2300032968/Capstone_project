import React from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  Network,
  Activity,
  FileText,
  TestTube,
  Server,
  FileSpreadsheet,
  Users,
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentTab, onSelectTab, isCollapsed, onToggleCollapse }) {
  const { isAdmin } = useAuth();

  const menuSections = [
    {
      title: 'INTELLIGENCE & ROUTES',
      items: [
        {
          id: 'overview',
          label: 'Overview',
          badge: 'Live',
          icon: LayoutDashboard,
          description: 'Executive security dashboard'
        },
        {
          id: 'arsa',
          label: 'ARSA Route Analyzer',
          badge: 'Score',
          icon: ShieldCheck,
          description: 'Adaptive compliance analysis'
        },
        {
          id: 'routes',
          label: 'API Routes',
          badge: '11 Routes',
          icon: Network,
          description: 'Route matrix & policy inspector'
        }
      ]
    },
    {
      title: 'SECURITY OPERATIONS',
      items: [
        {
          id: 'monitoring',
          label: 'Security Monitoring',
          badge: 'Stream',
          icon: Activity,
          description: 'Perimeter threat telemetry'
        },
        {
          id: 'audit',
          label: 'Audit Logs',
          badge: 'CSV',
          icon: FileText,
          description: 'Tamper-evident access history'
        },
        {
          id: 'testing',
          label: 'Security Testing',
          badge: '8 Tests',
          icon: TestTube,
          description: 'Live perimeter attack suite'
        }
      ]
    },
    {
      title: 'SYSTEM & GOVERNANCE',
      items: [
        {
          id: 'health',
          label: 'System Health',
          badge: ':8081',
          icon: Server,
          description: '4-tier distributed diagnostics'
        },
        {
          id: 'reports',
          label: 'Reports',
          badge: 'Export',
          icon: FileSpreadsheet,
          description: 'Compliance dossiers & CSV'
        },
        ...(isAdmin
          ? [
              {
                id: 'users',
                label: 'User Management',
                badge: 'Admin',
                icon: Users,
                description: 'MySQL identities & RBAC'
              }
            ]
          : [])
      ]
    }
  ];

  return (
    <aside className={`enterprise-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand-box">
        <div className="sidebar-brand-icon">
          <Shield size={22} className="brand-icon-svg" />
        </div>
        {!isCollapsed && (
          <div className="sidebar-brand-text">
            <span className="brand-title">ARSA DEFENSE</span>
            <span className="brand-sub">Gateway Security v2.4</span>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="sidebar-nav-section">
            {!isCollapsed && (
              <div className="sidebar-section-title">{section.title}</div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div className="nav-item-icon">
                    <Icon size={18} />
                  </div>
                  {!isCollapsed && (
                    <div className="nav-item-body">
                      <div className="nav-item-title-row">
                        <span className="nav-item-name">{item.label}</span>
                        {item.badge && (
                          <span className={`nav-item-badge ${isActive ? 'badge-active' : ''}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="nav-item-desc">{item.description}</span>
                    </div>
                  )}
                  {!isCollapsed && isActive && (
                    <ChevronRight size={14} className="nav-active-arrow" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Health Indicator */}
      {!isCollapsed && (
        <div className="sidebar-footer-box">
          <div className="footer-status-indicator">
            <span className="live-beacon"></span>
            <div className="footer-status-details">
              <span className="footer-status-headline">Perimeter Protected</span>
              <span className="footer-status-sub">Gateway :8081 Online</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
