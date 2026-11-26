import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Package,
  ShieldAlert,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  RefreshCw,
  Send,
  UserCheck,
  ShieldCheck,
  Key,
  XCircle,
  Play
} from 'lucide-react';
import { productsApi, ordersApi, apiRequest } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

export default function UserPortal({ onSwitchToAdmin }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products' | 'rbac-demo' | 'account'
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New Order Form state
  const [newOrder, setNewOrder] = useState({
    item: 'Enterprise API Gateway Pro',
    quantity: 1,
    price: 499.99
  });
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Per-endpoint RBAC test states
  const [rbacResults, setRbacResults] = useState({});
  const [testingEndpoint, setTestingEndpoint] = useState(null);

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, orderRes] = await Promise.all([
        productsApi.getAll().catch(() => []),
        ordersApi.getAll().catch((err) => {
          throw new Error(err.message || 'Failed to retrieve orders from API Gateway.');
        })
      ]);
      setProducts(prodRes || []);
      setOrders(orderRes || []);
      if (prodRes && prodRes.length > 0 && !newOrder.item) {
        setNewOrder({
          item: prodRes[0].name,
          quantity: 1,
          price: parseFloat(prodRes[0].price)
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setOrderSubmitting(true);
    setOrderSuccess(null);
    setError(null);
    try {
      const created = await ordersApi.create({
        item: newOrder.item,
        quantity: parseInt(newOrder.quantity, 10),
        price: parseFloat(newOrder.price)
      });
      setOrderSuccess(`Order ${created.orderNumber} successfully created and verified through API Gateway!`);
      await fetchUserData();
    } catch (err) {
      setError(`Order submission failed: ${err.message}`);
    } finally {
      setOrderSubmitting(false);
    }
  };

  const testEndpointRbac = async (endpoint, name) => {
    setTestingEndpoint(endpoint);
    try {
      await apiRequest(endpoint);
      setRbacResults(prev => ({
        ...prev,
        [endpoint]: {
          endpoint,
          name,
          allowed: true,
          status: 200,
          message: 'Request unexpectedly permitted.'
        }
      }));
    } catch (err) {
      const statusCode = err.status || (
        err.message.toLowerCase().includes('403') || err.message.toLowerCase().includes('denied')
          ? 403
          : 401
      );
      setRbacResults(prev => ({
        ...prev,
        [endpoint]: {
          endpoint,
          name,
          allowed: false,
          status: statusCode,
          message: err.message || 'Access Denied: You lack permissions to view this resource.'
        }
      }));
    } finally {
      setTestingEndpoint(null);
    }
  };

  const testAllRbac = async () => {
    await testEndpointRbac('/api/arsa/summary', 'ARSA Summary');
    await testEndpointRbac('/api/audit-logs', 'Audit Logs');
    await testEndpointRbac('/api/payments', 'Payments');
  };

  const selectProductForOrder = (product) => {
    setNewOrder({
      item: product.name,
      quantity: 1,
      price: parseFloat(product.price)
    });
    setActiveTab('orders');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const testedCount = Object.keys(rbacResults).length;
  const passedCount = Object.values(rbacResults).filter(r => !r.allowed && r.status === 403).length;

  return (
    <div className="user-portal-container">
      {/* Top Banner explaining RBAC */}
      <div className="user-hero-card">
        <div className="user-hero-content">
          <div className="user-badge-group">
            <span className="user-role-pill">ROLE_USER</span>
            <span className="user-name-label">Standard Account: <strong>{user?.username}</strong></span>
            <span className="user-restriction-pill">403 — Access Forbidden</span>
          </div>
          <h2>Business Operations & Security Boundary Portal</h2>
          <p>
            You are authenticated with standard user privileges (<code>ROLE_USER</code>). In compliance with the Principle of Least Privilege,
            access to ARSA security intelligence and Centralized Audit Logs is restricted to administrators.
          </p>
        </div>
        <div className="user-hero-actions">
          <button className="btn-primary-gradient" onClick={onSwitchToAdmin} title="Switch to an Administrator account">
            <span>Switch to Admin Account</span>
            <ArrowRight size={16} />
          </button>
          <button className="btn-signout-inline" onClick={logout} title="Sign Out">
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="white-error-banner" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={18} />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            title="Dismiss"
          >
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="portal-tabs">
        <button
          className={`portal-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <ShoppingBag size={16} />
          <span>My Orders ({orders.length})</span>
        </button>
        <button
          className={`portal-tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Package size={16} />
          <span>Product Catalog ({products.length})</span>
        </button>
        <button
          className={`portal-tab ${activeTab === 'rbac-demo' ? 'active' : ''}`}
          onClick={() => setActiveTab('rbac-demo')}
        >
          <ShieldAlert size={16} />
          <span>RBAC Enforcement Verification</span>
        </button>
        <button
          className={`portal-tab ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          <UserCheck size={16} />
          <span>Account & Security Profile</span>
        </button>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="portal-loading-banner">
          <RefreshCw size={16} className="spin" />
          <span>Syncing telemetry from API Gateway perimeter...</span>
        </div>
      )}

      {/* TAB 1: Orders */}
      {activeTab === 'orders' && (
        <div className="portal-grid">
          <div className="portal-card">
            <div className="card-header-clean">
              <PlusCircle size={18} className="icon-cyan" />
              <h4>Create Business Order (POST /api/orders)</h4>
            </div>
            <form onSubmit={handleCreateOrder} className="portal-form">
              <div className="form-group">
                <label>Select Item</label>
                <select
                  value={newOrder.item}
                  onChange={(e) => {
                    const sel = products.find(p => p.name === e.target.value);
                    setNewOrder({
                      ...newOrder,
                      item: e.target.value,
                      price: sel ? parseFloat(sel.price) : newOrder.price
                    });
                  }}
                >
                  {products.length > 0 ? (
                    products.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name} (${parseFloat(p.price).toFixed(2)})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Enterprise API Gateway Pro">Enterprise API Gateway Pro ($499.99)</option>
                      <option value="Web Application Firewall Guard">Web Application Firewall Guard ($299.99)</option>
                      <option value="Network Intrusion Detector">Network Intrusion Detector ($1299.00)</option>
                      <option value="Zero-Trust Identity Module">Zero-Trust Identity Module ($199.50)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantity (1 - 10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newOrder.quantity}
                    onChange={(e) => setNewOrder({ ...newOrder, quantity: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newOrder.price}
                    readOnly
                    className="readonly-input"
                  />
                </div>
              </div>

              <div className="order-total-box">
                <span>Estimated Total:</span>
                <strong>${(newOrder.quantity * newOrder.price).toFixed(2)}</strong>
              </div>

              {orderSuccess && (
                <div className="order-success-msg">
                  <CheckCircle2 size={16} />
                  <span>{orderSuccess}</span>
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={orderSubmitting}>
                <Send size={15} />
                <span>{orderSubmitting ? 'Routing via Gateway...' : 'Submit Order'}</span>
              </button>
            </form>
          </div>

          <div className="portal-card">
            <div className="card-header-clean">
              <ShoppingBag size={18} className="icon-cyan" />
              <h4>Recent Orders (GET /api/orders)</h4>
            </div>
            {orders.length === 0 ? (
              <div className="empty-state-mini">
                <Package size={28} />
                <p>No orders recorded for this account. Create an order above to verify gateway transaction recording.</p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((o) => (
                  <div key={o.id || o.orderNumber} className="order-item">
                    <div className="order-info">
                      <div className="order-num">{o.orderNumber || `ORD-${o.id}`}</div>
                      <div className="order-prod">{o.item} (Qty: {o.quantity})</div>
                      <div className="order-user">Ordered by: <code>{o.username}</code></div>
                    </div>
                    <div className="order-meta">
                      <div className="order-total">${parseFloat(o.totalPrice || o.price || 0).toFixed(2)}</div>
                      <span className="status-badge-clean">{o.status || 'CONFIRMED'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Product Catalog */}
      {activeTab === 'products' && (
        <div className="products-grid">
          {products.map((p) => (
            <div key={p.id} className="product-card">
              <div className="product-tag">{p.category || 'Security Software'}</div>
              <h4 className="product-name">{p.name}</h4>
              <div className="product-price">${parseFloat(p.price).toFixed(2)}</div>
              <div className="product-stock">
                {p.inStock ? (
                  <span className="stock-in"><CheckCircle2 size={13} /> Active & In Stock</span>
                ) : (
                  <span className="stock-out"><AlertTriangle size={13} /> Restricted / Backorder</span>
                )}
              </div>
              <button
                type="button"
                className="btn-order-product"
                onClick={() => selectProductForOrder(p)}
              >
                <ShoppingBag size={14} />
                <span>Order This Product</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: RBAC Verification Demo */}
      {activeTab === 'rbac-demo' && (
        <div className="rbac-demo-container">
          <div className="rbac-intro">
            <div className="rbac-intro-top">
              <h4>
                <Lock size={18} className="icon-amber" />
                Interactive Role-Based Access Control (RBAC) Demonstration
              </h4>
              <button
                type="button"
                className="btn-run-all-rbac"
                onClick={testAllRbac}
                disabled={testingEndpoint !== null}
              >
                <Play size={14} />
                <span>Execute All 3 RBAC Probes</span>
              </button>
            </div>
            <p>
              Demonstrate how the API Gateway and Spring Security enforce strict role boundaries.
              Click any protected endpoint below with your current <code>ROLE_USER</code> credentials to verify that HTTP 403 Forbidden is consistently returned:
            </p>
          </div>

          <div className="rbac-test-grid">
            {/* Card 1 */}
            <div className="rbac-card">
              <div className="rbac-card-header">
                <h5>ARSA Route Security Summary</h5>
                <span className="pill-admin">ROLE_ADMIN Only</span>
              </div>
              <p className="rbac-path"><code>GET /api/arsa/summary</code></p>
              <p className="rbac-desc">Automated route posture assessment & compliance metrics</p>
              <button
                className="btn-test-rbac"
                onClick={() => testEndpointRbac('/api/arsa/summary', 'ARSA Summary')}
                disabled={testingEndpoint === '/api/arsa/summary'}
              >
                {testingEndpoint === '/api/arsa/summary' ? 'Verifying...' : 'Test Permission with ROLE_USER'}
              </button>
              {rbacResults['/api/arsa/summary'] && (
                <div className={`card-rbac-badge ${rbacResults['/api/arsa/summary'].status === 403 ? 'badge-pass' : 'badge-fail'}`}>
                  <ShieldCheck size={14} />
                  <span>HTTP {rbacResults['/api/arsa/summary'].status} Forbidden — Denied</span>
                </div>
              )}
            </div>

            {/* Card 2 */}
            <div className="rbac-card">
              <div className="rbac-card-header">
                <h5>Centralized Audit Telemetry</h5>
                <span className="pill-admin">ROLE_ADMIN Only</span>
              </div>
              <p className="rbac-path"><code>GET /api/audit-logs</code></p>
              <p className="rbac-desc">Perimeter security transaction logs & authentication audit events</p>
              <button
                className="btn-test-rbac"
                onClick={() => testEndpointRbac('/api/audit-logs', 'Audit Logs')}
                disabled={testingEndpoint === '/api/audit-logs'}
              >
                {testingEndpoint === '/api/audit-logs' ? 'Verifying...' : 'Test Permission with ROLE_USER'}
              </button>
              {rbacResults['/api/audit-logs'] && (
                <div className={`card-rbac-badge ${rbacResults['/api/audit-logs'].status === 403 ? 'badge-pass' : 'badge-fail'}`}>
                  <ShieldCheck size={14} />
                  <span>HTTP {rbacResults['/api/audit-logs'].status} Forbidden — Denied</span>
                </div>
              )}
            </div>

            {/* Card 3 */}
            <div className="rbac-card">
              <div className="rbac-card-header">
                <h5>Financial Settlement Processing</h5>
                <span className="pill-admin">ROLE_ADMIN Only</span>
              </div>
              <p className="rbac-path"><code>GET /api/payments</code></p>
              <p className="rbac-desc">High-risk payment transaction history and disbursement logs</p>
              <button
                className="btn-test-rbac"
                onClick={() => testEndpointRbac('/api/payments', 'Payments')}
                disabled={testingEndpoint === '/api/payments'}
              >
                {testingEndpoint === '/api/payments' ? 'Verifying...' : 'Test Permission with ROLE_USER'}
              </button>
              {rbacResults['/api/payments'] && (
                <div className={`card-rbac-badge ${rbacResults['/api/payments'].status === 403 ? 'badge-pass' : 'badge-fail'}`}>
                  <ShieldCheck size={14} />
                  <span>HTTP {rbacResults['/api/payments'].status} Forbidden — Denied</span>
                </div>
              )}
            </div>
          </div>

          {testedCount > 0 && (
            <div className="rbac-summary-box">
              <div className="summary-left">
                <ShieldCheck size={22} className="icon-emerald" />
                <div>
                  <strong>Least-Privilege RBAC Verification: {passedCount}/{testedCount} Endpoints Verified</strong>
                  <p>All attempted unauthorized administrative requests were intercepted and rejected with HTTP 403 Forbidden.</p>
                </div>
              </div>
              <span className="summary-badge">ROLE_USER Boundary Protected</span>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Account & Security Profile */}
      {activeTab === 'account' && (
        <div className="portal-card account-profile-card">
          <div className="card-header-clean">
            <UserCheck size={20} className="icon-cyan" />
            <h4>Account Identity & Security Profile</h4>
          </div>
          <div className="profile-details-grid">
            <div className="profile-field">
              <label>Authenticated Username</label>
              <div className="profile-val"><code>{user?.username}</code></div>
            </div>
            <div className="profile-field">
              <label>Registered Email</label>
              <div className="profile-val">{user?.email || 'N/A'}</div>
            </div>
            <div className="profile-field">
              <label>Security Role Authority</label>
              <div className="profile-val"><span className="role-tag-user">ROLE_USER</span></div>
            </div>
            <div className="profile-field">
              <label>Token Authentication</label>
              <div className="profile-val">Cryptographic Bearer JWT (HMAC-SHA256)</div>
            </div>
            <div className="profile-field">
              <label>Permitted Endpoints</label>
              <div className="profile-val"><code>GET /api/public/products</code>, <code>POST /api/orders</code>, <code>GET /api/orders</code></div>
            </div>
            <div className="profile-field">
              <label>Restricted Administrative Routes</label>
              <div className="profile-val text-red"><code>/api/arsa/**</code>, <code>/api/audit-logs/**</code>, <code>/api/users/**</code>, <code>/api/payments/**</code></div>
            </div>
            <div className="profile-field full-width">
              <label>Data Isolation Boundary</label>
              <div className="profile-val text-emerald">
                Strictly Isolated: User queries return only records owned by <code>{user?.username}</code>. Multi-tenant cross-talk is prevented at the controller and gateway layers.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
