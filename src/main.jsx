import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  API_BASE_URL,
  adminDashboard,
  approvePayment,
  clearSession,
  formatDate,
  formatDateTime,
  getStoredUser,
  getToken,
  listBusinesses,
  listPlans,
  listSubscriptionPayments,
  login,
  money,
  rejectPayment,
  setBusinessBlocked,
} from './api.js';
import './styles.css';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: '▦' },
  { key: 'businesses', label: 'Businesses', icon: '🏪' },
  { key: 'payments', label: 'Subscription payments', icon: '💳' },
  { key: 'plans', label: 'Plans', icon: '📦' },
  { key: 'setup', label: 'Setup guide', icon: '⚙' },
];

function App() {
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(getStoredUser());

  const handleLogout = useCallback(() => {
    clearSession();
    setToken('');
    setUser(null);
  }, []);

  if (!token) {
    return <LoginScreen onLogin={(next) => { setToken(next.token); setUser(next.user); }} />;
  }

  return <AdminShell user={user} onLogout={handleLogout} />;
}

function LoginScreen({ onLogin }) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const session = await login(emailOrPhone.trim(), password);
      onLogin(session);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="brand-lockup">
          <div className="brand-mark">SK</div>
          <div>
            <h1>Smart Khata</h1>
            <p>Super Admin Portal</p>
          </div>
        </div>
        <div className="visual-card">
          <span className="pulse-dot" />
          <h2>Control your SaaS business</h2>
          <p>Manage businesses, approve subscriptions, block misuse, and monitor platform growth from one clean portal.</p>
          <div className="mini-grid">
            <div><strong>Live</strong><span>Railway API</span></div>
            <div><strong>Secure</strong><span>JWT login</span></div>
            <div><strong>Fast</strong><span>Static web app</span></div>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="eyebrow">Admin access</div>
          <h2>Login to Super Admin</h2>
          <p className="muted">Use a user account where <code>is_super_admin = true</code>.</p>

          {error && <div className="alert error">{error}</div>}

          <label>
            Email or phone
            <input value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} placeholder="admin@example.com" required />
          </label>

          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </label>

          <button className="primary-btn" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>

          <div className="api-note">
            API: <span>{API_BASE_URL}</span>
          </div>
        </form>
      </section>
    </main>
  );
}

function AdminShell({ user, onLogout }) {
  const [active, setActive] = useState('dashboard');

  const title = navItems.find((item) => item.key === active)?.label || 'Dashboard';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small">SK</div>
          <div>
            <strong>Smart Khata</strong>
            <span>Super Admin</span>
          </div>
        </div>
        <nav>
          {navItems.map((item) => (
            <button key={item.key} className={active === item.key ? 'active' : ''} onClick={() => setActive(item.key)}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{(user?.fullName || user?.full_name || 'A').slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{user?.fullName || user?.full_name || 'Admin'}</strong>
              <span>{user?.email || 'Super admin'}</span>
            </div>
          </div>
          <button className="ghost-btn full" onClick={onLogout}>Logout</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>{title}</h1>
            <p>Smart Khata SaaS control centre</p>
          </div>
          <div className="top-actions">
            <span className="api-badge">API online</span>
            <button className="ghost-btn" onClick={() => window.location.reload()}>Refresh</button>
          </div>
        </header>

        {active === 'dashboard' && <Dashboard />}
        {active === 'businesses' && <Businesses />}
        {active === 'payments' && <SubscriptionPayments />}
        {active === 'plans' && <Plans />}
        {active === 'setup' && <SetupGuide />}
      </main>
    </div>
  );
}

function LoadState({ loading, error, children, onRetry }) {
  if (loading) return <div className="card skeleton-card"><div className="spinner" /> Loading...</div>;
  if (error) return <div className="alert error"><strong>Error:</strong> {error} {onRetry && <button onClick={onRetry}>Retry</button>}</div>;
  return children;
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await adminDashboard());
    } catch (err) {
      setError(err.message || 'Unable to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const chartData = useMemo(() => [
    { label: 'Businesses', value: Number(data?.totalBusinesses || 0) },
    { label: 'Users', value: Number(data?.totalUsers || 0) },
    { label: 'Pending payments', value: Number(data?.pendingSubscriptionPayments || 0) },
    { label: 'Active subscriptions', value: Number(data?.activeSubscriptions || 0) },
  ], [data]);

  return (
    <LoadState loading={loading} error={error} onRetry={load}>
      <section className="kpi-grid">
        <Kpi title="Total businesses" value={data?.totalBusinesses || 0} icon="🏪" tone="teal" />
        <Kpi title="Total users" value={data?.totalUsers || 0} icon="👥" tone="blue" />
        <Kpi title="Pending payments" value={data?.pendingSubscriptionPayments || 0} icon="⏳" tone="amber" />
        <Kpi title="Active subscriptions" value={data?.activeSubscriptions || 0} icon="✅" tone="green" />
      </section>

      <section className="content-grid two">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Platform overview</h3>
              <p>Live totals from your Smart Khata backend.</p>
            </div>
          </div>
          <BarChart data={chartData} />
        </div>
        <div className="card gradient-card">
          <h3>Admin actions</h3>
          <p>Approve subscription payments quickly, block inactive or suspicious businesses, and keep control of your monthly revenue.</p>
          <div className="action-list">
            <span>Review pending payment screenshots</span>
            <span>Block businesses with expired/non-paid subscription</span>
            <span>Monitor business growth and user count</span>
          </div>
        </div>
      </section>
    </LoadState>
  );
}

function Kpi({ title, value, icon, tone }) {
  return (
    <div className={`kpi-card ${tone}`}>
      <div className="kpi-icon">{icon}</div>
      <div>
        <span>{title}</span>
        <strong>{Number(value || 0).toLocaleString()}</strong>
      </div>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(1, ...data.map((row) => row.value));
  return (
    <div className="bar-chart">
      {data.map((row) => (
        <div className="bar-row" key={row.label}>
          <div className="bar-label">{row.label}</div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(6, (row.value / max) * 100)}%` }} /></div>
          <div className="bar-value">{row.value.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}

function Businesses() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workingId, setWorkingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listBusinesses({ page, search: search.trim() });
      setRows(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message || 'Unable to load businesses.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  async function toggleBlock(row) {
    const id = row.public_id || row.publicId;
    const isBlocked = Boolean(row.is_blocked || row.isBlocked);
    const reason = !isBlocked ? window.prompt('Reason for blocking this business?', 'Subscription not paid') || '' : '';
    setWorkingId(id);
    try {
      await setBusinessBlocked(id, !isBlocked, reason);
      await load();
    } catch (err) {
      alert(err.message || 'Action failed.');
    } finally {
      setWorkingId('');
    }
  }

  return (
    <section className="card">
      <div className="card-head sticky-head">
        <div>
          <h3>Businesses</h3>
          <p>View registered businesses and block/unblock access.</p>
        </div>
        <div className="search-box">
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search business, owner or phone" />
        </div>
      </div>
      <LoadState loading={loading} error={error} onRetry={load}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Business</th><th>Owner</th><th>City</th><th>Status</th><th>Created</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const id = row.public_id || row.publicId;
                const blocked = Boolean(row.is_blocked || row.isBlocked);
                return (
                  <tr key={id}>
                    <td><strong>{row.business_name || row.businessName}</strong><span>{row.business_type || row.businessType || 'Business'}</span></td>
                    <td><strong>{row.owner_name || row.ownerName}</strong><span>{row.owner_email || row.ownerEmail || row.owner_phone || row.ownerPhone || '-'}</span></td>
                    <td>{row.city || '-'}</td>
                    <td><StatusBadge status={blocked ? 'BLOCKED' : 'ACTIVE'} /></td>
                    <td>{formatDate(row.created_at || row.createdAt)}</td>
                    <td className="right"><button className={blocked ? 'success-btn' : 'danger-btn'} disabled={workingId === id} onClick={() => toggleBlock(row)}>{blocked ? 'Unblock' : 'Block'}</button></td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan="6" className="empty">No businesses found.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={page} setPage={setPage} pagination={pagination} />
      </LoadState>
    </section>
  );
}

function Pagination({ page, setPage, pagination }) {
  const totalPages = Number(pagination.totalPages || 1);
  return (
    <div className="pagination">
      <span>Total: {Number(pagination.total || 0).toLocaleString()}</span>
      <div>
        <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
        <strong>{page} / {totalPages}</strong>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}

function SubscriptionPayments() {
  const [status, setStatus] = useState('PENDING');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workingId, setWorkingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await listSubscriptionPayments(status));
    } catch (err) {
      setError(err.message || 'Unable to load subscription payments.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  async function approve(id) {
    if (!window.confirm('Approve this subscription payment and extend subscription by 1 month?')) return;
    setWorkingId(String(id));
    try {
      await approvePayment(id);
      await load();
    } catch (err) {
      alert(err.message || 'Approve failed.');
    } finally {
      setWorkingId('');
    }
  }

  async function reject(id) {
    const reason = window.prompt('Reject reason', 'Invalid or missing payment proof');
    if (!reason) return;
    setWorkingId(String(id));
    try {
      await rejectPayment(id, reason);
      await load();
    } catch (err) {
      alert(err.message || 'Reject failed.');
    } finally {
      setWorkingId('');
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h3>Subscription payments</h3>
          <p>Approve or reject manual subscription payments.</p>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="">All</option>
        </select>
      </div>
      <LoadState loading={loading} error={error} onRetry={load}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Business</th><th>Amount</th><th>Method</th><th>Reference</th><th>Status</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const id = row.subscription_payment_id || row.subscriptionPaymentId;
                const paymentStatus = row.payment_status || row.paymentStatus;
                return (
                  <tr key={id}>
                    <td><strong>{row.business_name || row.businessName}</strong><span>{row.business_public_id || row.businessPublicId}</span></td>
                    <td>{money(row.amount, row.currency_code || row.currencyCode || 'PKR')}</td>
                    <td>{row.payment_method || row.paymentMethod || '-'}</td>
                    <td>{row.transaction_reference || row.transactionReference || '-'}</td>
                    <td><StatusBadge status={paymentStatus} /></td>
                    <td>{formatDateTime(row.created_at || row.createdAt)}</td>
                    <td className="right actions">
                      {row.payment_screenshot_url && <a className="ghost-link" href={row.payment_screenshot_url} target="_blank" rel="noreferrer">Proof</a>}
                      {paymentStatus === 'PENDING' && <>
                        <button className="success-btn" disabled={workingId === String(id)} onClick={() => approve(id)}>Approve</button>
                        <button className="danger-btn" disabled={workingId === String(id)} onClick={() => reject(id)}>Reject</button>
                      </>}
                    </td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan="7" className="empty">No payments found.</td></tr>}
            </tbody>
          </table>
        </div>
      </LoadState>
    </section>
  );
}

function Plans() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await listPlans());
    } catch (err) {
      setError(err.message || 'Unable to load plans.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <LoadState loading={loading} error={error} onRetry={load}>
      <section className="plan-grid">
        {rows.map((plan) => (
          <div className="plan-card" key={plan.plan_id || plan.planId || plan.plan_code}>
            <div className="plan-code">{plan.plan_code || plan.planCode}</div>
            <h3>{plan.plan_name || plan.planName}</h3>
            <div className="plan-price">{money(plan.monthly_price || plan.monthlyPrice, plan.currency_code || plan.currencyCode || 'PKR')}<span>/month</span></div>
            <ul>
              <li>Users: {plan.max_users || plan.maxUsers || 'Unlimited'}</li>
              <li>Businesses: {plan.max_businesses || plan.maxBusinesses || 'Unlimited'}</li>
              <li>Inventory: {(plan.has_inventory ?? plan.hasInventory) ? 'Yes' : 'No'}</li>
              <li>Quotation: {(plan.has_quotation ?? plan.hasQuotation) ? 'Yes' : 'No'}</li>
              <li>WhatsApp sharing: {(plan.has_whatsapp_sharing ?? plan.hasWhatsAppSharing) ? 'Yes' : 'No'}</li>
            </ul>
          </div>
        ))}
      </section>
    </LoadState>
  );
}

function SetupGuide() {
  return (
    <div className="content-grid two">
      <section className="card setup-card">
        <h3>Make your account Super Admin</h3>
        <p>Open Railway PostgreSQL → Data → Query and run this SQL for the email you want to use as admin.</p>
        <pre>{`UPDATE app_users
SET is_super_admin = TRUE
WHERE LOWER(email) = LOWER('ahmed@example.com');`}</pre>
        <p>Then login here with the same email/password.</p>
      </section>
      <section className="card setup-card">
        <h3>API configuration</h3>
        <p>This portal uses your Railway API URL:</p>
        <pre>{API_BASE_URL}</pre>
        <p>If you change API URL, update <code>VITE_API_BASE_URL</code> in GitHub Actions or Railway variables.</p>
      </section>
      <section className="card setup-card">
        <h3>Recommended admin workflow</h3>
        <ol>
          <li>Customer sends JazzCash/EasyPaisa/bank payment proof.</li>
          <li>Business owner submits payment request from mobile app.</li>
          <li>You open Subscription payments.</li>
          <li>Approve valid payment or reject invalid proof.</li>
          <li>Subscription automatically extends by one month.</li>
        </ol>
      </section>
      <section className="card setup-card">
        <h3>Security note</h3>
        <p>Keep super admin accounts limited. Use strong passwords. Do not share admin login with normal business users.</p>
      </section>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || 'UNKNOWN').toUpperCase();
  return <span className={`status ${normalized.toLowerCase()}`}>{normalized}</span>;
}

createRoot(document.getElementById('root')).render(<App />);
