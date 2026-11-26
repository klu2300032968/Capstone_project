const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Only inject default Bearer token if not explicitly overridden (or set to false/null)
  if (!('Authorization' in (options.headers || {}))) {
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } else if (!options.headers?.Authorization) {
    delete headers['Authorization'];
  }

  const config = {
    ...options,
    headers
  };

  const startTime = performance.now();

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const durationMs = Math.round(performance.now() - startTime);

    // If caller explicitly requested raw test response (e.g., Security Testing Console)
    if (options.rawTestResponse) {
      const text = await response.text();
      let parsed = {};
      try { parsed = JSON.parse(text); } catch (e) { parsed = { raw: text }; }
      return {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        data: parsed,
        durationMs
      };
    }

    // Handle 401 Unauthorized - Only trigger session logout if NOT a test request AND using the user's active token
    if (response.status === 401) {
      if (!options.skipAuthInterceptor && (!options.headers || !options.headers['Authorization'] || options.headers['Authorization'] === `Bearer ${token}`)) {
        if (token) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('auth-expired'));
        }
      }
      const errorData = await response.json().catch(() => ({}));
      const err = new Error(errorData.message || errorData.error || 'Invalid username or password.');
      err.status = 401;
      throw err;
    }

    // Handle 403 Forbidden
    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      const err = new Error(errorData.message || errorData.error || 'Access Denied: You lack permissions to view this resource.');
      err.status = 403;
      throw err;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const err = new Error(errorData.message || errorData.error || `HTTP error ${response.status}`);
      err.status = response.status;
      throw err;
    }

    return await response.json();
  } catch (err) {
    throw err;
  }
}

// ARSA API calls
export const arsaApi = {
  getRoutes: () => apiRequest('/api/arsa/routes'),
  getRouteByPath: (path) => apiRequest(`/api/arsa/route?path=${encodeURIComponent(path)}`),
  getSummary: () => apiRequest('/api/arsa/summary'),
  evaluateRoute: (data) => apiRequest('/api/arsa/evaluate', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

// Auth API calls
export const authApi = {
  login: (username, password) => apiRequest('/api/auth/login', {
    method: 'POST',
    headers: { Authorization: null },
    skipAuthInterceptor: true,
    body: JSON.stringify({ username, password })
  }),
  signup: (username, email, password) => apiRequest('/api/auth/signup', {
    method: 'POST',
    headers: { Authorization: null },
    skipAuthInterceptor: true,
    body: JSON.stringify({ username, email, password })
  })
};

// User Management API calls (Admin only)
export const usersApi = {
  getAll: () => apiRequest('/api/users'),
  getById: (id) => apiRequest(`/api/users/${id}`),
  create: (userData) => apiRequest('/api/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  toggleStatus: (id) => apiRequest(`/api/users/${id}/status`, {
    method: 'PATCH'
  })
};

// Audit Logs API calls (Admin only)
export const auditLogApi = {
  getAll: () => apiRequest('/api/audit-logs'),
  getPaged: (page = 0, size = 20) => apiRequest(`/api/audit-logs/paged?page=${page}&size=${size}`),
  getByUsername: (username) => apiRequest(`/api/audit-logs/user/${encodeURIComponent(username)}`),
  getByAction: (action) => apiRequest(`/api/audit-logs/action/${encodeURIComponent(action)}`)
};

// Business APIs (Orders & Products)
export const ordersApi = {
  getAll: () => apiRequest('/api/orders'),
  create: (order) => apiRequest('/api/orders', {
    method: 'POST',
    body: JSON.stringify(order)
  })
};

export const productsApi = {
  getAll: () => apiRequest('/api/public/products'),
  getById: (id) => apiRequest(`/api/public/products/${id}`)
};

export const healthApi = {
  getHealth: () => apiRequest('/api/health')
};

// Security Testing Console API (Isolated test execution that won't invalidate admin session)
export const securityTestApi = {
  testValidJwt: async (token) => {
    return await apiRequest('/api/orders', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
      skipAuthInterceptor: true,
      rawTestResponse: true
    });
  },
  testInvalidJwt: async () => {
    return await apiRequest('/api/orders', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer forged.tampered.token.2026' },
      skipAuthInterceptor: true,
      rawTestResponse: true
    });
  },
  testMissingJwt: async () => {
    return await apiRequest('/api/orders', {
      method: 'GET',
      headers: { 'Authorization': '' },
      skipAuthInterceptor: true,
      rawTestResponse: true
    });
  },
  testRbacRestriction: async (userToken) => {
    return await apiRequest('/api/arsa/summary', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${userToken}` },
      skipAuthInterceptor: true,
      rawTestResponse: true
    });
  },
  testPayloadValidation: async (token) => {
    return await apiRequest('/api/payments/process', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ amount: -99.99 }),
      skipAuthInterceptor: true,
      rawTestResponse: true
    });
  },
  testRateLimitBurst: async () => {
    const results = [];
    for (let i = 0; i < 12; i++) {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'volumetric_probe', password: 'Password@123' }),
        skipAuthInterceptor: true,
        rawTestResponse: true
      });
      results.push(res);
      if (res.status === 429) break;
    }
    return results[results.length - 1];
  },
  testIpFilter: async () => {
    return await apiRequest('/api/public/products', {
      method: 'GET',
      headers: { 'X-Forwarded-For': '127.0.0.1' },
      skipAuthInterceptor: true,
      rawTestResponse: true
    });
  }
};
