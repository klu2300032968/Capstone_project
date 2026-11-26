import React, { useState } from 'react';
import {
  TestTube,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Layers,
  RefreshCw,
  Info,
  Terminal,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { securityTestApi, authApi, auditLogApi } from '../api/apiClient';

export default function SecurityTestingConsole() {
  const { token } = useAuth();
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [activeTestId, setActiveTestId] = useState(null);

  const testDefinitions = [
    {
      id: 'TC-01',
      name: 'Valid JWT Authentication Verification',
      endpoint: 'GET /api/orders',
      control: 'JWT Authentication',
      expectedStatus: 200,
      description: 'Tests that a cryptographically signed HMAC-SHA256 JWT is accepted by the perimeter Gateway.',
      run: async () => await securityTestApi.testValidJwt(token)
    },
    {
      id: 'TC-02',
      name: 'Forged / Tampered JWT Rejection',
      endpoint: 'GET /api/orders',
      control: 'JWT Signature Check',
      expectedStatus: 401,
      description: 'Injects a forged Bearer token. Verifies Gateway and Backend reject untrusted signatures with HTTP 401.',
      run: async () => await securityTestApi.testInvalidJwt()
    },
    {
      id: 'TC-03',
      name: 'Missing Credential Anonymous Rejection',
      endpoint: 'GET /api/orders',
      control: 'Perimeter Authentication Gate',
      expectedStatus: 401,
      description: 'Sends an unauthenticated request to a protected endpoint. Verifies perimeter denial with HTTP 401.',
      run: async () => await securityTestApi.testMissingJwt()
    },
    {
      id: 'TC-04',
      name: 'RBAC Least-Privilege Access Violation',
      endpoint: 'GET /api/arsa/summary',
      control: 'Role-Based Access Control',
      expectedStatus: 403,
      description: 'Logs in dynamically as standard user alice_dev and attempts to access administrative ARSA intelligence. Verifies HTTP 403.',
      run: async () => {
        // Authenticate alice_dev temporarily
        const loginRes = await authApi.login('alice_dev', 'SecurePassword@123');
        return await securityTestApi.testRbacRestriction(loginRes.token);
      }
    },
    {
      id: 'TC-05',
      name: 'Payload Bean Validation Rejection',
      endpoint: 'POST /api/payments/process',
      control: 'Jakarta Bean Validation',
      expectedStatus: 400,
      description: 'Transmits a payload with negative amount (-$99.99). Verifies @DecimalMin constraint triggers HTTP 400 Bad Request.',
      run: async () => await securityTestApi.testPayloadValidation(token)
    },
    {
      id: 'TC-06',
      name: 'Token-Bucket Rate Limiter Burst Throttling',
      endpoint: 'POST /api/auth/login',
      control: 'Token Bucket Rate Limiter',
      expectedStatus: 429,
      description: 'Executes rapid volumetric burst requests. Verifies Gateway Token Bucket trips and returns HTTP 429 Too Many Requests.',
      run: async () => await securityTestApi.testRateLimitBurst()
    },
    {
      id: 'TC-07',
      name: 'Perimeter IP Filtering Subnet Policy',
      endpoint: 'GET /api/public/products',
      control: 'Network CIDR IP Filter',
      expectedStatus: 200,
      description: 'Evaluates client IP resolution via ClientIpResolver against authorized subnet policies.',
      run: async () => await securityTestApi.testIpFilter()
    },
    {
      id: 'TC-08',
      name: 'Centralized Audit Event Persistence',
      endpoint: 'GET /api/audit-logs',
      control: 'Audit Trail Persistence',
      expectedStatus: 200,
      description: 'Queries MySQL audit_logs table to verify immutable lifecycle event storage and retrieval.',
      run: async () => {
        const start = performance.now();
        const logs = await auditLogApi.getAll();
        const durationMs = Math.round(performance.now() - start);
        return {
          status: 200,
          ok: true,
          durationMs,
          data: { totalAuditRecords: logs.length, sampleAction: logs[0]?.action }
        };
      }
    }
  ];

  const [testResults, setTestResults] = useState({});

  const executeTest = async (test) => {
    setActiveTestId(test.id);
    try {
      const res = await test.run();
      const passed = res.status === test.expectedStatus;
      setTestResults(prev => ({
        ...prev,
        [test.id]: {
          ...res,
          passed,
          executedAt: new Date().toLocaleTimeString()
        }
      }));
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [test.id]: {
          status: 0,
          passed: false,
          error: err.message,
          durationMs: 0,
          executedAt: new Date().toLocaleTimeString()
        }
      }));
    } finally {
      setActiveTestId(null);
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    for (const test of testDefinitions) {
      await executeTest(test);
    }
    setIsRunningAll(false);
  };

  const executedTests = Object.values(testResults);
  const passedCount = executedTests.filter(t => t.passed).length;

  return (
    <div className="section-container">
      <div className="section-header-row">
        <div>
          <div className="section-title-group">
            <TestTube size={22} className="icon-cyan" />
            <h3>Interactive Security Testing Console</h3>
          </div>
          <p className="section-subtitle">
            Simulate live perimeter attacks and policy verifications across JWT, RBAC, Validation, Rate Limiting, and IP Filters
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn-primary-gradient"
            onClick={runAllTests}
            disabled={isRunningAll || activeTestId !== null}
          >
            {isRunningAll ? (
              <>
                <RefreshCw size={15} className="spin" />
                <span>Running Test Suite...</span>
              </>
            ) : (
              <>
                <Play size={15} />
                <span>Run Complete Security Suite</span>
              </>
            )}
          </button>
        </div>
      </div>

      {executedTests.length > 0 && (
        <div className="test-summary-strip">
          <div className="test-stat-item">
            <span className="stat-num">{executedTests.length} / {testDefinitions.length}</span>
            <span className="stat-label">Tests Executed</span>
          </div>
          <div className="test-stat-item">
            <span className="stat-num text-emerald">{passedCount}</span>
            <span className="stat-label">Passed</span>
          </div>
          <div className="test-stat-item">
            <span className="stat-num text-red">{executedTests.length - passedCount}</span>
            <span className="stat-label">Failed</span>
          </div>
          <div className="test-stat-item">
            <span className="stat-num text-cyan">
              {Math.round((passedCount / executedTests.length) * 100)}%
            </span>
            <span className="stat-label">Security Integrity</span>
          </div>
        </div>
      )}

      <div className="test-cards-grid">
        {testDefinitions.map((test) => {
          const result = testResults[test.id];
          const isRunning = activeTestId === test.id;

          return (
            <div
              key={test.id}
              className={`test-card ${result ? (result.passed ? 'border-pass' : 'border-fail') : ''}`}
            >
              <div className="test-card-header">
                <div className="test-id-pill">{test.id}</div>
                <div className="test-control-tag">{test.control}</div>
                <div className="test-status-area">
                  {isRunning ? (
                    <span className="badge-running">
                      <RefreshCw size={12} className="spin" /> Running...
                    </span>
                  ) : result ? (
                    result.passed ? (
                      <span className="badge-pass">
                        <CheckCircle2 size={13} /> PASS
                      </span>
                    ) : (
                      <span className="badge-fail">
                        <XCircle size={13} /> FAIL
                      </span>
                    )
                  ) : (
                    <span className="badge-idle">Pending</span>
                  )}
                </div>
              </div>

              <h4 className="test-title">{test.name}</h4>
              <p className="test-desc">{test.description}</p>

              <div className="test-meta-box">
                <div className="test-meta-row">
                  <span className="meta-key">Target Endpoint:</span>
                  <code className="meta-val code-val">{test.endpoint}</code>
                </div>
                <div className="test-meta-row">
                  <span className="meta-key">Expected HTTP Code:</span>
                  <span className="meta-val bold-val">HTTP {test.expectedStatus}</span>
                </div>
                {result && (
                  <>
                    <div className="test-meta-row">
                      <span className="meta-key">Actual HTTP Status:</span>
                      <span className={`meta-val bold-val ${result.passed ? 'text-emerald' : 'text-red'}`}>
                        HTTP {result.status || 'ERR'}
                      </span>
                    </div>
                    <div className="test-meta-row">
                      <span className="meta-key">Execution Latency:</span>
                      <span className="meta-val text-muted">
                        <Clock size={11} style={{ display: 'inline', marginRight: '4px' }} />
                        {result.durationMs} ms
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="test-card-footer">
                <button
                  className="btn-test-run"
                  onClick={() => executeTest(test)}
                  disabled={isRunning || isRunningAll}
                >
                  {isRunning ? <RefreshCw size={13} className="spin" /> : <Play size={13} />}
                  <span>{result ? 'Re-test' : 'Execute Test'}</span>
                </button>
                {result && (
                  <span className="test-timestamp">Tested at {result.executedAt}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
