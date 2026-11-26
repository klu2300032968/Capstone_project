import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../pages/Dashboard';
import ScoreGauge from '../components/ScoreGauge';
import RiskCard from '../components/RiskCard';
import ControlCoverage from '../components/ControlCoverage';
import RouteTable from '../components/RouteTable';
import * as AuthContextModule from '../context/AuthContext';
import * as ApiClientModule from '../api/apiClient';

const mockRoutes = [
  {
    routePath: '/api/payments/process',
    httpMethod: 'POST',
    description: 'Payment transaction settlement',
    jwtAuth: true,
    rbac: true,
    requestValidation: true,
    rateLimiting: true,
    ipFiltering: true,
    auditLogging: true,
    activeControlsCount: 6,
    complianceScore: 100.0,
    riskRating: 'LOW',
    missingControls: [],
    recommendations: []
  },
  {
    routePath: '/api/public/products',
    httpMethod: 'GET',
    description: 'Product catalog',
    jwtAuth: false,
    rbac: false,
    requestValidation: false,
    rateLimiting: true,
    ipFiltering: true,
    auditLogging: false,
    activeControlsCount: 2,
    complianceScore: 33.33,
    riskRating: 'CRITICAL',
    missingControls: ['JWT Authentication', 'Role-Based Access Control', 'Request Validation', 'Centralized Audit Logging'],
    recommendations: ['Enable JWT authentication', 'Configure RBAC']
  }
];

const mockSummary = {
  totalRoutes: 2,
  fullyCompliantRoutes: 1,
  partiallyCompliantRoutes: 0,
  nonCompliantRoutes: 1,
  averageComplianceScore: 66.67,
  riskDistribution: { LOW: 1, MEDIUM: 0, HIGH: 0, CRITICAL: 1 },
  missingControlsSummary: {
    'JWT Authentication': 1,
    'Role-Based Access Control': 1,
    'Request Validation': 1,
    'Rate Limiting': 0,
    'IP Filtering': 0,
    'Centralized Audit Logging': 1
  },
  routes: mockRoutes
};

describe('ARSA Dashboard Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders unauthenticated notice when not logged in', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isAdmin: false,
      user: null
    });

    render(<Dashboard onOpenLogin={() => {}} />);
    expect(screen.getByText(/Authentication Required/i)).toBeInTheDocument();
  });

  it('renders 403 Forbidden notice when logged in as regular USER', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isAdmin: false,
      user: { username: 'alice_dev', role: 'USER' }
    });

    render(<Dashboard onOpenLogin={() => {}} />);
    expect(screen.getByText(/403 — Access Forbidden/i)).toBeInTheDocument();
    expect(screen.getByText(/alice_dev/i)).toBeInTheDocument();
  });

  it('renders full dashboard metrics and route table when logged in as ADMIN', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isAdmin: true,
      user: { username: 'admin', role: 'ADMIN' }
    });

    vi.spyOn(ApiClientModule.arsaApi, 'getSummary').mockResolvedValue(mockSummary);
    vi.spyOn(ApiClientModule.arsaApi, 'getRoutes').mockResolvedValue(mockRoutes);

    render(<Dashboard onOpenLogin={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Adaptive Route Security Analyzer/i)).toBeInTheDocument();
      expect(screen.getByText(/66.7%/i)).toBeInTheDocument();
      expect(screen.getByText('/api/payments/process')).toBeInTheDocument();
      expect(screen.getByText('/api/public/products')).toBeInTheDocument();
    });
  });

  it('filters routes by search term', () => {
    render(<RouteTable routes={mockRoutes} onSelectRoute={() => {}} />);

    const searchInput = screen.getByPlaceholderText(/Search API routes/i);
    fireEvent.change(searchInput, { target: { value: 'payments' } });

    expect(screen.getByText('/api/payments/process')).toBeInTheDocument();
    expect(screen.queryByText('/api/public/products')).not.toBeInTheDocument();
  });

  it('ScoreGauge displays correct percentage and status color', () => {
    render(<ScoreGauge score={83.33} totalRoutes={11} />);
    expect(screen.getByText('83.3%')).toBeInTheDocument();
    expect(screen.getByText('11 Routes')).toBeInTheDocument();
  });

  it('RiskCard displays counts for all 4 risk tiers', () => {
    render(<RiskCard riskDistribution={{ LOW: 3, MEDIUM: 4, HIGH: 1, CRITICAL: 3 }} />);
    expect(screen.getByText('Low Risk')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('High Risk')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getAllByText('3')).toHaveLength(2); // Low (3) and Critical (3)
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
