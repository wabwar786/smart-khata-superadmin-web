import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { API_BASE_URL, AdminApi, clearSession, exportCsv, formatDate, formatDateTime, getStoredUser, getToken, login, money, number, toArray, toObject } from './api.js';
import './styles.css';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: '▦' },
  { key: 'businesses', label: 'Businesses', icon: '🏪' },
  { key: 'nearExpiry', label: 'Near expiry', icon: '⏰' },
  { key: 'users', label: 'Users', icon: '👥' },
  { key: 'billing', label: 'Billing', icon: '💳' },
  { key: 'plans', label: 'Plans', icon: '📦' },
  { key: 'tools', label: 'Tools', icon: '⚙' },
];

function App() {
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(getStoredUser());
  const logout = useCallback(() => { clearSession(); setToken(''); setUser(null); }, []);
  if (!token) return <LoginScreen onLogin={(next) => { setToken(next.token); setUser(next.user); }} />;
  return <AdminShell user={user} onLogout={logout} />;
}

function LoginScreen({ onLogin }) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault(); setLoading(true); setError('');
    try { onLogin(await login(emailOrPhone.trim(), password)); }
    catch (err) { setError(err.message || 'Login failed.'); }
    finally { setLoading(false); }
  }
  return <main className="login-page">
    <section className="login-card compact-login">
      <div className="brand-row"><div className="brand-mark">SK</div><div><h1>Smart Khata</h1><p>Super Admin Control Panel</p></div></div>
      <div className="mini-info"><span>Railway API</span><strong>{API_BASE_URL}</strong></div>
      {error && <Alert type="error">{error}</Alert>}
      <form onSubmit={submit} className="form-grid one">
        <Field label="Email or phone"><input value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} required placeholder="admin@example.com" /></Field>
        <Field label="Password"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" /></Field>
        <button className="btn primary" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      </form>
    </section>
  </main>;
}

function AdminShell({ user, onLogout }) {
  const [active, setActive] = useState('dashboard');
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const title = navItems.find((item) => item.key === active)?.label || 'Dashboard';
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="side-brand"><div className="brand-mark small">SK</div><div><strong>Smart Khata</strong><span>Super Admin</span></div></div>
      <nav>{navItems.map((n) => <button key={n.key} onClick={() => setActive(n.key)} className={active === n.key ? 'active' : ''}><span>{n.icon}</span>{n.label}</button>)}</nav>
      <div className="side-footer"><strong>{user?.fullName || user?.full_name || 'Admin'}</strong><span>{user?.email}</span><button className="btn ghost full" onClick={onLogout}>Logout</button></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div><h1>{title}</h1><p>Compact SaaS control center for businesses, users, billing, stock and sales.</p></div><button className="btn ghost" onClick={() => window.location.reload()}>Refresh</button></header>
      {active === 'dashboard' && <Dashboard onOpenBusiness={setSelectedBusiness} />}
      {active === 'businesses' && <Businesses onOpenBusiness={setSelectedBusiness} />}
      {active === 'nearExpiry' && <NearExpiry onOpenBusiness={setSelectedBusiness} />}
      {active === 'users' && <Users />}
      {active === 'billing' && <Billing onOpenBusiness={setSelectedBusiness} />}
      {active === 'plans' && <Plans />}
      {active === 'tools' && <Tools />}
    </main>
    {selectedBusiness && <BusinessDrawer publicId={selectedBusiness} onClose={() => setSelectedBusiness(null)} />}
  </div>;
}

function Alert({ children, type = 'info' }) { return <div className={`alert ${type}`}>{children}</div>; }
function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }
function Loader({ text = 'Loading...' }) { return <div className="card loader"><span className="spinner" />{text}</div>; }
function StatusBadge({ value }) { const v = String(value || '').toLowerCase(); return <span className={`badge ${v}`}>{value || '-'}</span>; }
function Empty({ text }) { return <div className="empty">{text || 'No record found.'}</div>; }

function Dashboard({ onOpenBusiness }) {
  const [data, setData] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { setData(await AdminApi.dashboard()); } catch (e) { setError(e.message); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  if (loading) return <Loader />; if (error) return <Alert type="error">{error}</Alert>;
  const daily = toArray(data.dailySales);
  return <>
    <section className="kpi-grid">
      <Kpi label="Businesses" value={data.totalBusinesses} />
      <Kpi label="Users" value={data.totalUsers} />
      <Kpi label="Active subs" value={data.activeSubscriptions} />
      <Kpi label="Expiring 7d" value={data.expiringIn7Days} tone="warn" />
      <Kpi label="Sub revenue" value={money(data.monthlySubscriptionRevenue)} />
      <Kpi label="Sales month" value={money(data.salesThisMonth)} />
      <Kpi label="Invoices month" value={data.invoicesThisMonth} />
      <Kpi label="Blocked" value={data.blockedBusinesses} tone="danger" />
    </section>
    <section className="grid two">
      <div className="card"><CardHead title="Sales trend" sub="Last 7 days platform sales" /><MiniBars rows={daily.map((x) => ({ label: x.label, value: Number(x.total_sales || 0) }))} moneyBars /></div>
      <div className="card"><CardHead title="Top businesses" sub="By sales in last 30 days" />{toArray(data.topBusinesses).map((b) => <button className="row-button" key={b.publicId} onClick={() => onOpenBusiness(b.publicId)}><span>{b.businessName}</span><strong>{money(b.totalSales)}</strong></button>)}</div>
    </section>
    <section className="card"><CardHead title="Near expiry subscriptions" sub="Renew these first" />{toArray(data.nearExpiry).length ? <CompactTable columns={["Business", "Plan", "End", "Days"]} rows={toArray(data.nearExpiry).map((b) => [<button className="link" onClick={() => onOpenBusiness(b.publicId)}>{b.businessName}</button>, b.planName, formatDate(b.endDate), b.daysLeft])} /> : <Empty text="No near-expiry subscription." />}</section>
  </>;
}

function Kpi({ label, value, tone = '' }) { return <div className={`kpi ${tone}`}><span>{label}</span><strong>{typeof value === 'number' ? number(value) : value}</strong></div>; }
function CardHead({ title, sub, right }) { return <div className="card-head"><div><h3>{title}</h3>{sub && <p>{sub}</p>}</div>{right}</div>; }
function MiniBars({ rows, moneyBars }) { const max = Math.max(1, ...rows.map((r) => Number(r.value || 0))); return <div className="mini-bars">{rows.map((r) => <div className="mini-bar" key={r.label}><span>{r.label}</span><div><i style={{ width: `${Math.max(4, (Number(r.value || 0) / max) * 100)}%` }} /></div><b>{moneyBars ? money(r.value) : number(r.value)}</b></div>)}</div>; }
function CompactTable({ columns, rows }) { return <div className="table-wrap"><table><thead><tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>; }

function Businesses({ onOpenBusiness }) {
  const [rows, setRows] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState(''), [search, setSearch] = useState(''), [showCreate, setShowCreate] = useState(false);
  const load = useCallback(async () => { setLoading(true); setError(''); try { const res = await AdminApi.listBusinesses({ search }); setRows(res.data); } catch (e) { setError(e.message); } finally { setLoading(false); } }, [search]);
  useEffect(() => { load(); }, [load]);
  return <section className="card"><CardHead title="Businesses" sub="Edit, view data, block, assign subscription" right={<button className="btn primary small" onClick={() => setShowCreate(true)}>+ Create business</button>} />
    <SearchBar value={search} setValue={setSearch} onSearch={load} placeholder="Search business, owner, email, phone" />
    {error && <Alert type="error">{error}</Alert>}{loading ? <Loader /> : <BusinessTable rows={rows} onOpen={onOpenBusiness} onChanged={load} />}
    {showCreate && <CreateBusinessModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); load(); }} />}
  </section>;
}

function BusinessTable({ rows, onOpen, onChanged }) {
  if (!rows.length) return <Empty />;
  return <CompactTable columns={["Business", "Owner", "Sub", "Sales", "Stock/Cust", "Status", "Action"]} rows={rows.map((b) => [
    <button className="link strong" onClick={() => onOpen(b.publicId)}>{b.businessName}<small>{b.city || '-'}</small></button>,
    <span>{b.ownerName}<small>{b.ownerEmail}</small></span>,
    <span>{b.planName || '-'}<small>{formatDate(b.subscriptionEndDate)} ({b.daysLeft ?? '-'}d)</small></span>,
    money(b.totalSales),
    `${b.totalProducts || 0}/${b.totalCustomers || 0}`,
    <StatusBadge value={b.isBlocked ? 'BLOCKED' : b.subscriptionStatus || 'ACTIVE'} />,
    <button className="btn tiny" onClick={async () => { await AdminApi.setBusinessBlocked(b.publicId, !b.isBlocked, !b.isBlocked ? 'Blocked by super admin' : ''); onChanged(); }}>{b.isBlocked ? 'Unblock' : 'Block'}</button>
  ])} />;
}

function SearchBar({ value, setValue, onSearch, placeholder }) { return <div className="searchbar"><input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSearch()} placeholder={placeholder} /><button className="btn small" onClick={onSearch}>Search</button></div>; }

function CreateBusinessModal({ onClose, onSaved }) {
  const [plans, setPlans] = useState([]), [loading, setLoading] = useState(false), [error, setError] = useState('');
  const today = new Date().toISOString().slice(0, 10); const end = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const [form, setForm] = useState({ ownerFullName: '', ownerEmail: '', ownerPhone: '', ownerPassword: '12345678', businessName: '', businessType: '', city: '', phoneNumber: '', whatsappNumber: '', planId: '', startDate: today, endDate: end, subscriptionStatus: 'ACTIVE', isTrial: false, currencyCode: 'PKR' });
  useEffect(() => { AdminApi.plans().then(setPlans).catch(() => {}); }, []);
  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  async function save(e) { e.preventDefault(); setLoading(true); setError(''); try { await AdminApi.createBusiness({ ...form, planId: Number(form.planId || plans[0]?.plan_id) }); onSaved(); } catch (err) { setError(err.message); } finally { setLoading(false); } }
  return <Modal title="Create business + admin user" onClose={onClose}><form onSubmit={save} className="form-grid two">{error && <Alert type="error">{error}</Alert>}
    <Field label="Owner full name"><input value={form.ownerFullName} onChange={(e) => set('ownerFullName', e.target.value)} required /></Field>
    <Field label="Owner email"><input type="email" value={form.ownerEmail} onChange={(e) => set('ownerEmail', e.target.value)} required /></Field>
    <Field label="Owner phone"><input value={form.ownerPhone} onChange={(e) => set('ownerPhone', e.target.value)} /></Field>
    <Field label="Owner password"><input value={form.ownerPassword} onChange={(e) => set('ownerPassword', e.target.value)} required /></Field>
    <Field label="Business name"><input value={form.businessName} onChange={(e) => set('businessName', e.target.value)} required /></Field>
    <Field label="Business type"><input value={form.businessType} onChange={(e) => set('businessType', e.target.value)} /></Field>
    <Field label="City"><input value={form.city} onChange={(e) => set('city', e.target.value)} /></Field>
    <Field label="Currency"><input value={form.currencyCode} onChange={(e) => set('currencyCode', e.target.value)} /></Field>
    <Field label="Phone"><input value={form.phoneNumber} onChange={(e) => set('phoneNumber', e.target.value)} /></Field>
    <Field label="WhatsApp"><input value={form.whatsappNumber} onChange={(e) => set('whatsappNumber', e.target.value)} /></Field>
    <Field label="Plan"><select value={form.planId} onChange={(e) => set('planId', e.target.value)} required>{plans.map((p) => <option key={p.plan_id} value={p.plan_id}>{p.plan_name} - {money(p.monthly_price, p.currency_code)}</option>)}</select></Field>
    <Field label="Status"><select value={form.subscriptionStatus} onChange={(e) => set('subscriptionStatus', e.target.value)}><option>ACTIVE</option><option>TRIAL</option><option>EXPIRED</option><option>CANCELLED</option><option>BLOCKED</option></select></Field>
    <Field label="Start date"><input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} /></Field>
    <Field label="End date"><input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} /></Field>
    <div className="modal-actions"><button className="btn ghost" type="button" onClick={onClose}>Cancel</button><button className="btn primary" disabled={loading}>{loading ? 'Saving...' : 'Create business'}</button></div>
  </form></Modal>;
}

function BusinessDrawer({ publicId, onClose }) {
  const [tab, setTab] = useState('overview'), [data, setData] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); setError(''); try { setData(await AdminApi.getBusiness(publicId)); } catch (e) { setError(e.message); } finally { setLoading(false); } }, [publicId]);
  useEffect(() => { load(); }, [load]);
  const b = toObject(data?.business);
  return <div className="drawer-backdrop"><aside className="drawer"><header><div><h2>{b.businessName || 'Business'}</h2><p>{b.ownerName || ''} · {b.city || ''}</p></div><button className="btn ghost" onClick={onClose}>Close</button></header>
    {loading ? <Loader /> : error ? <Alert type="error">{error}</Alert> : <>
      <div className="tabs">{['overview','edit','users','subscription','whatsapp','sales','inventory','customers','billing','performance'].map((t) => <button key={t} onClick={() => setTab(t)} className={tab === t ? 'active' : ''}>{t}</button>)}</div>
      {tab === 'overview' && <OverviewTab data={data} />}
      {tab === 'edit' && <EditBusinessTab business={b} onSaved={load} />}
      {tab === 'users' && <BusinessDataTab loader={() => AdminApi.businessUsers(publicId)} type="users" />}
      {tab === 'subscription' && <SubscriptionTab publicId={publicId} current={data.subscription} onSaved={load} />}
      {tab === 'whatsapp' && <WhatsappTab publicId={publicId} />}
      {tab === 'sales' && <BusinessDataTab loader={() => AdminApi.businessSales(publicId)} type="sales" />}
      {tab === 'inventory' && <BusinessDataTab loader={() => AdminApi.businessInventory(publicId)} type="inventory" exportable />}
      {tab === 'customers' && <BusinessDataTab loader={() => AdminApi.businessCustomers(publicId)} type="customers" />}
      {tab === 'billing' && <BusinessDataTab loader={() => AdminApi.billingHistory(publicId)} type="billing" />}
      {tab === 'performance' && <PerformanceTab publicId={publicId} />}
    </>}
  </aside></div>;
}

function OverviewTab({ data }) { const b = toObject(data.business), s = toObject(data.stats), sub = toObject(data.subscription); return <div className="drawer-section"><section className="kpi-grid compact"><Kpi label="Customers" value={s.customers} /><Kpi label="Products" value={s.products} /><Kpi label="Invoices" value={s.invoices} /><Kpi label="Sales" value={money(s.sales)} /><Kpi label="Receivable" value={money(s.receivable)} /><Kpi label="Reminders" value={s.pending_reminders} /></section><CompactTable columns={["Field","Value"]} rows={[["Business", b.businessName], ["Owner", `${b.ownerName} (${b.ownerEmail})`], ["Phone", b.phoneNumber], ["WhatsApp", b.whatsAppNumber], ["City", b.city], ["Subscription", `${sub.planName || '-'} / ${sub.status || '-'} / ${formatDate(sub.endDate)}`]]} /></div>; }

function EditBusinessTab({ business, onSaved }) { const [form, setForm] = useState({ businessName: business.businessName || '', businessType: business.businessType || '', phoneNumber: business.phoneNumber || '', whatsAppNumber: business.whatsAppNumber || '', email: business.email || '', address: business.address || '', city: business.city || '', country: business.country || 'Pakistan', ntn: business.ntn || '', strn: business.strn || '', currencyCode: business.currencyCode || 'PKR', isActive: business.isActive !== false }); const [msg, setMsg] = useState(''); function set(k,v){setForm(f=>({...f,[k]:v}))} async function save(e){e.preventDefault(); setMsg(''); await AdminApi.updateBusiness(business.publicId, form); setMsg('Saved.'); onSaved();} return <form className="form-grid two drawer-section" onSubmit={save}>{msg && <Alert>{msg}</Alert>}{Object.keys(form).filter(k=>k!=='isActive').map(k=><Field key={k} label={k}><input value={form[k] || ''} onChange={e=>set(k,e.target.value)} /></Field>)}<Field label="Active"><select value={String(form.isActive)} onChange={e=>set('isActive', e.target.value==='true')}><option value="true">Active</option><option value="false">Inactive</option></select></Field><div className="modal-actions"><button className="btn primary">Save details</button></div></form>; }

function SubscriptionTab({ publicId, current, onSaved }) { const [plans, setPlans] = useState([]), [msg, setMsg] = useState(''), [form, setForm] = useState({ planId: current?.planId || '', startDate: (current?.startDate || new Date().toISOString()).slice(0,10), endDate: (current?.endDate || new Date(Date.now()+30*86400000).toISOString()).slice(0,10), subscriptionStatus: current?.status || 'ACTIVE', isTrial: !!current?.isTrial, autoRenew: false }); useEffect(()=>{AdminApi.plans().then(setPlans)},[]); function set(k,v){setForm(f=>({...f,[k]:v}))} async function save(e){e.preventDefault(); await AdminApi.attachSubscription(publicId, {...form, planId:Number(form.planId)}); setMsg('Subscription updated.'); onSaved();} return <form className="form-grid two drawer-section" onSubmit={save}>{msg && <Alert>{msg}</Alert>}<Field label="Plan"><select value={form.planId} onChange={e=>set('planId',e.target.value)}>{plans.map(p=><option key={p.plan_id} value={p.plan_id}>{p.plan_name} - {money(p.monthly_price,p.currency_code)}</option>)}</select></Field><Field label="Status"><select value={form.subscriptionStatus} onChange={e=>set('subscriptionStatus',e.target.value)}><option>ACTIVE</option><option>TRIAL</option><option>EXPIRED</option><option>CANCELLED</option><option>BLOCKED</option></select></Field><Field label="Start"><input type="date" value={form.startDate} onChange={e=>set('startDate',e.target.value)} /></Field><Field label="End"><input type="date" value={form.endDate} onChange={e=>set('endDate',e.target.value)} /></Field><Field label="Trial"><select value={String(form.isTrial)} onChange={e=>set('isTrial',e.target.value==='true')}><option value="false">No</option><option value="true">Yes</option></select></Field><div className="modal-actions"><button className="btn primary">Attach / update</button></div></form>; }

function WhatsappTab({ publicId }) { const [form,setForm]=useState({ provider:'custom', apiUrl:'', apiKey:'', senderPhone:'', isActive:false }), [msg,setMsg]=useState(''); useEffect(()=>{AdminApi.getWhatsapp(publicId).then(d=>setForm({ provider:d.provider||'custom', apiUrl:d.api_url||d.apiUrl||'', apiKey:d.api_key||d.apiKey||'', senderPhone:d.sender_phone||d.senderPhone||'', isActive:!!d.is_active||!!d.isActive }))},[publicId]); function set(k,v){setForm(f=>({...f,[k]:v}))} async function save(e){e.preventDefault(); await AdminApi.saveWhatsapp(publicId, form); setMsg('WhatsApp API settings saved. APK integration can read these later.')} return <form className="form-grid one drawer-section" onSubmit={save}>{msg&&<Alert>{msg}</Alert>}<Field label="Provider"><input value={form.provider} onChange={e=>set('provider',e.target.value)} placeholder="custom / meta / ultramsg" /></Field><Field label="API URL"><input value={form.apiUrl} onChange={e=>set('apiUrl',e.target.value)} placeholder="https://api.example.com/send" /></Field><Field label="API key / token"><input value={form.apiKey} onChange={e=>set('apiKey',e.target.value)} placeholder="Paste key here" /></Field><Field label="Sender phone"><input value={form.senderPhone} onChange={e=>set('senderPhone',e.target.value)} /></Field><Field label="Active"><select value={String(form.isActive)} onChange={e=>set('isActive',e.target.value==='true')}><option value="false">No</option><option value="true">Yes</option></select></Field><button className="btn primary">Save WhatsApp settings</button></form> }

function BusinessDataTab({ loader, type, exportable }) { const [rows,setRows]=useState([]), [loading,setLoading]=useState(true), [error,setError]=useState(''); useEffect(()=>{let ok=true; setLoading(true); loader().then(r=>ok&&setRows(r)).catch(e=>ok&&setError(e.message)).finally(()=>ok&&setLoading(false)); return()=>{ok=false}},[loader]); if(loading)return<Loader/>; if(error)return<Alert type="error">{error}</Alert>; if(!rows.length)return<Empty/>; const keys = Object.keys(rows[0]).slice(0, type==='inventory'?12:9); return <div className="drawer-section">{exportable&&<div className="toolbar"><button className="btn small primary" onClick={()=>exportCsv(`smart-khata-${type}.csv`,rows)}>Download Excel CSV</button></div>}<CompactTable columns={keys.map(k=>k.replaceAll('_',' '))} rows={rows.map(row=>keys.map(k=>formatCell(row[k])))} /></div> }
function formatCell(v){ if(typeof v==='boolean')return v?'Yes':'No'; if(String(v).match(/^\d{4}-\d{2}-\d{2}/))return formatDate(v); if(typeof v==='number')return number(v); return v ?? '-'; }

function PerformanceTab({ publicId }) { const [data,setData]=useState(null), [loading,setLoading]=useState(true), [error,setError]=useState(''); useEffect(()=>{AdminApi.businessPerformance(publicId).then(setData).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[publicId]); if(loading)return<Loader/>; if(error)return<Alert type="error">{error}</Alert>; const s=toObject(data.summary); return <div className="drawer-section"><section className="kpi-grid compact"><Kpi label="Invoices month" value={s.invoices_this_month}/><Kpi label="Sales month" value={money(s.sales_this_month)}/><Kpi label="Collected" value={money(s.collected_this_month)}/><Kpi label="Receivable" value={money(s.total_receivable)} /></section><div className="card inner"><CardHead title="Daily sales"/><MiniBars rows={toArray(data.dailySales).map(x=>({label:x.label,value:Number(x.total_sales||0)}))} moneyBars /></div><div className="card inner"><CardHead title="Top products"/><CompactTable columns={["Product","Qty","Total"]} rows={toArray(data.topProducts).map(x=>[x.product_name, x.qty, money(x.total)])}/></div></div> }

function NearExpiry({ onOpenBusiness }) { const [rows,setRows]=useState([]), [days,setDays]=useState(14); useEffect(()=>{AdminApi.nearExpiry(days).then(setRows)},[days]); return <section className="card"><CardHead title="Near expiry businesses" sub="Businesses that need renewal follow-up" right={<select value={days} onChange={e=>setDays(e.target.value)}><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select>} />{rows.length?<CompactTable columns={["Business","Owner","Plan","End","Days","Action"]} rows={rows.map(b=>[b.businessName,b.ownerEmail,b.planName,formatDate(b.endDate),b.daysLeft,<button className="btn tiny" onClick={()=>onOpenBusiness(b.publicId)}>Open</button>])}/>:<Empty/>}</section> }

function Users() { const [rows,setRows]=useState([]), [search,setSearch]=useState(''), [show,setShow]=useState(false), [loading,setLoading]=useState(true), [error,setError]=useState(''); const current=getStoredUser(); const load=useCallback(()=>{setLoading(true); setError(''); AdminApi.listUsers({search}).then(r=>setRows(r.data)).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[search]); async function deleteUser(u){ if(current?.publicId===u.public_id||current?.public_id===u.public_id){alert('You cannot delete your own logged-in admin account.');return;} const name=u.full_name||u.email||'this user'; if(!confirm(`Delete ${name}?\n\nThis will disable login and remove business access, but old invoices/ledger records will remain safe.`))return; try{await AdminApi.deleteUser(u.public_id); await load();}catch(e){alert(e.message||'Delete failed.')}} useEffect(()=>{load()},[load]); return <section className="card"><CardHead title="Users" sub="Create, block/unblock or safely delete users" right={<button className="btn primary small" onClick={()=>setShow(true)}>+ Super user</button>} /><SearchBar value={search} setValue={setSearch} onSearch={load} placeholder="Search user" />{error&&<Alert type="error">{error}</Alert>}{loading?<Loader/>:<CompactTable columns={["Name","Email","Phone","Role","Businesses","Status","Action"]} rows={rows.map(u=>[u.full_name,u.email,u.phone_number,u.is_super_admin?'Super Admin':u.is_support_admin?'Support':'User',u.business_count,<StatusBadge value={u.is_active?'ACTIVE':'BLOCKED'}/>,<span className="actions-inline"><button className="btn tiny" onClick={async()=>{await AdminApi.setUserActive(u.public_id,!u.is_active);load();}}>{u.is_active?'Block':'Unblock'}</button><button className="btn tiny danger" disabled={current?.publicId===u.public_id||current?.public_id===u.public_id} onClick={()=>deleteUser(u)}>Delete</button></span>])}/>} {show&&<CreateSuperUserModal onClose={()=>setShow(false)} onSaved={()=>{setShow(false);load();}}/>}</section> }
function CreateSuperUserModal({onClose,onSaved}) { const [f,setF]=useState({fullName:'',email:'',phoneNumber:'',password:'12345678',isSupportAdmin:false}), [err,setErr]=useState(''); function set(k,v){setF(x=>({...x,[k]:v}))} async function save(e){e.preventDefault();setErr('');try{await AdminApi.createSuperUser(f);onSaved();}catch(x){setErr(x.message)}} return <Modal title="Create super user" onClose={onClose}><form className="form-grid two" onSubmit={save}>{err&&<Alert type="error">{err}</Alert>}<Field label="Full name"><input value={f.fullName} onChange={e=>set('fullName',e.target.value)} required/></Field><Field label="Email"><input type="email" value={f.email} onChange={e=>set('email',e.target.value)} required/></Field><Field label="Phone"><input value={f.phoneNumber} onChange={e=>set('phoneNumber',e.target.value)}/></Field><Field label="Password"><input value={f.password} onChange={e=>set('password',e.target.value)} required/></Field><Field label="Support admin"><select value={String(f.isSupportAdmin)} onChange={e=>set('isSupportAdmin',e.target.value==='true')}><option value="false">No</option><option value="true">Yes</option></select></Field><div className="modal-actions"><button type="button" className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary">Create</button></div></form></Modal> }

function Billing({ onOpenBusiness }) { const [rows,setRows]=useState([]), [status,setStatus]=useState(''); const load=useCallback(()=>AdminApi.subscriptionPayments(status).then(setRows),[status]); useEffect(()=>{load()},[load]); return <section className="card"><CardHead title="Subscription billing" sub="Approve/reject payments and view billing history" right={<select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All</option><option>PENDING</option><option>APPROVED</option><option>REJECTED</option></select>} />{rows.length?<CompactTable columns={["Business","Plan","Amount","Method","Ref","Status","Date","Action"]} rows={rows.map(p=>[<button className="link" onClick={()=>onOpenBusiness(p.business_public_id)}>{p.business_name}</button>,p.plan_name,money(p.amount,p.currency_code),p.payment_method,p.transaction_reference,<StatusBadge value={p.payment_status}/>,formatDateTime(p.created_at),p.payment_status==='PENDING'?<span><button className="btn tiny" onClick={async()=>{await AdminApi.approvePayment(p.subscription_payment_id);load();}}>Approve</button><button className="btn tiny danger" onClick={async()=>{const r=prompt('Reject reason?')||'Rejected';await AdminApi.rejectPayment(p.subscription_payment_id,r);load();}}>Reject</button></span>:'-'])}/>:<Empty/>}</section> }
function Plans(){const[rows,setRows]=useState([]);useEffect(()=>{AdminApi.plans().then(setRows)},[]);return <section className="card"><CardHead title="Plans" sub="Current SaaS plans"/><CompactTable columns={["Plan","Monthly","Users","Invoices","Inventory","WhatsApp","Active"]} rows={rows.map(p=>[p.plan_name,money(p.monthly_price,p.currency_code),p.max_users||'Unlimited',p.max_invoices_per_month||'Unlimited',p.has_inventory?'Yes':'No',p.has_whatsapp_sharing?'Yes':'No',p.is_active?'Yes':'No'])}/></section>}
function Tools(){return <section className="card"><CardHead title="Useful admin tools" sub="Recommended controls for your SaaS"/><div className="tool-grid"><div><b>Audit logs</b><span>Track edits, blocks, approvals and login activity.</span></div><div><b>Expired auto-block</b><span>Later add a daily job to block expired businesses automatically.</span></div><div><b>Backup exports</b><span>Export customers, sales and inventory per business.</span></div><div><b>Support access</b><span>Create support users without full delete access.</span></div><div><b>Announcements</b><span>Send app notices to all businesses.</span></div><div><b>WhatsApp templates</b><span>Manage invoice and payment reminder templates.</span></div></div></section>}

function Modal({ title, onClose, children }) { return <div className="modal-backdrop"><div className="modal"><header><h2>{title}</h2><button className="btn ghost" onClick={onClose}>×</button></header>{children}</div></div>; }

createRoot(document.getElementById('root')).render(<App />);
