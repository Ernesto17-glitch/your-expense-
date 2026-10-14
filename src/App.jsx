import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, ArrowLeftRight, Target, ChartNoAxesCombined, Settings,
  Wallet, ArrowDownLeft, ArrowUpRight, Plus, Search, Trash2, Download,
  Utensils, Car, Zap, ShoppingBag, Receipt, Check, X, TrendingUp, TrendingDown,
  ShieldCheck, CircleDollarSign, CalendarDays, Pencil, PiggyBank, Menu
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

const CATEGORIES = [
  "Food & Dining", "Transport", "Bills & Utilities", "Shopping",
  "Entertainment", "Health", "Education", "Housing", "Salary", "Freelance", "Other"
];
const EXPENSE_CATEGORIES = CATEGORIES.filter(c => !["Salary", "Freelance"].includes(c));
const COLORS = ["#287b55", "#e8a15a", "#7395c5", "#d87966", "#9877bb", "#60a8a0", "#c6b45d", "#8a9690", "#d49aaf", "#7492a5", "#b4a79a"];
const today = new Date().toISOString().slice(0, 10);
const currentMonth = today.slice(0, 7);

const starterTransactions = [
  { id: "seed-1", title: "Groceries at the market", category: "Food & Dining", type: "Expense", amount: 320, date: today, note: "Weekly groceries" },
  { id: "seed-2", title: "Monthly salary", category: "Salary", type: "Income", amount: 6500, date: today, note: "Example income" },
  { id: "seed-3", title: "Internet subscription", category: "Bills & Utilities", type: "Expense", amount: 180, date: today, note: "Monthly internet" },
  { id: "seed-4", title: "Ride to work", category: "Transport", type: "Expense", amount: 45, date: today, note: "Transport" },
  { id: "seed-5", title: "Freelance design work", category: "Freelance", type: "Income", amount: 1200, date: today, note: "Example income" },
  { id: "seed-6", title: "Lunch with friends", category: "Food & Dining", type: "Expense", amount: 85, date: today, note: "Lunch" },
  { id: "seed-7", title: "Electricity bill", category: "Bills & Utilities", type: "Expense", amount: 250, date: today, note: "Prepaid electricity" },
  { id: "seed-8", title: "New shoes", category: "Shopping", type: "Expense", amount: 380, date: today, note: "Personal shopping" }
];
const starterBudgets = EXPENSE_CATEGORIES.slice(0, 5).map((category, i) => ({
  category, limit: [1200, 600, 900, 700, 300][i], spent: 0
}));

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}
function formatMoney(value, currency) {
  try {
    return new Intl.NumberFormat("en-GH", {
      style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `${currency} ${Number(value).toFixed(2)}`;
  }
}
function IconForCategory({ category, size = 19 }) {
  const props = { size, strokeWidth: 1.8 };
  if (category === "Food & Dining") return <Utensils {...props} />;
  if (category === "Transport") return <Car {...props} />;
  if (category === "Bills & Utilities") return <Zap {...props} />;
  if (category === "Shopping") return <ShoppingBag {...props} />;
  if (category === "Salary" || category === "Freelance") return <ArrowDownLeft {...props} />;
  return <Receipt {...props} />;
}
function downloadCSV(transactions) {
  const columns = ["Date", "Description", "Category", "Type", "Amount", "Note"];
  const escape = value => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = transactions.map(t => [t.date, t.title, t.category, t.type, t.amount, t.note].map(escape).join(","));
  const blob = new Blob([[columns.join(","), ...rows].join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "your-expenses-transactions.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [transactions, setTransactions] = useState(() => readStorage("ye-transactions", starterTransactions));
  const [budgets, setBudgets] = useState(() => readStorage("ye-budgets", starterBudgets));
  const [settings, setSettings] = useState(() => readStorage("ye-settings", { currency: "GHS", incomeGoal: 8000, savingsGoal: 2000 }));
  const [activeTab, setActiveTab] = useState("Overview");
  const [month, setMonth] = useState(currentMonth);
  const [period, setPeriod] = useState("month");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [form, setForm] = useState({ title: "", amount: "", type: "Expense", category: "Food & Dining", date: today, note: "" });
  const [budgetForm, setBudgetForm] = useState({ category: "Food & Dining", limit: "1200" });

  useEffect(() => localStorage.setItem("ye-transactions", JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem("ye-budgets", JSON.stringify(budgets)), [budgets]);
  useEffect(() => localStorage.setItem("ye-settings", JSON.stringify(settings)), [settings]);

  // Real-life array operations: filter transactions by month/type, reduce totals,
  // map categories into chart series, sort by date, and find/update records by id.
  const monthTransactions = useMemo(() => transactions.filter(t => t.date.startsWith(month)), [transactions, month]);
  const income = useMemo(() => monthTransactions.filter(t => t.type === "Income").reduce((sum, t) => sum + t.amount, 0), [monthTransactions]);
  const expenses = useMemo(() => monthTransactions.filter(t => t.type === "Expense").reduce((sum, t) => sum + t.amount, 0), [monthTransactions]);
  const balance = income - expenses;
  const filteredTransactions = useMemo(() => [...transactions]
    .filter(t => (activeTab !== "Transactions" || period === "all" || t.date.startsWith(month))
      && (typeFilter === "All" || t.type === typeFilter)
      && `${t.title} ${t.category} ${t.note}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date)), [transactions, activeTab, period, month, typeFilter, query]);

  const categoryData = useMemo(() => EXPENSE_CATEGORIES.map(category => ({
    name: category,
    value: (period === "all" ? transactions : monthTransactions)
      .filter(t => t.type === "Expense" && t.category === category)
      .reduce((sum, t) => sum + t.amount, 0)
  })).filter(item => item.value > 0).sort((a, b) => b.value - a.value), [transactions, monthTransactions, period]);
  const currency = settings.currency;
  const money = value => formatMoney(value, currency);
  const updateForm = (key, value) => setForm(old => ({ ...old, [key]: value }));

  function openAddForm() {
    setEditingId(null);
    setForm({ title: "", amount: "", type: "Expense", category: "Food & Dining", date: today, note: "" });
    setShowForm(true);
    setNotice("");
  }
  function openEditForm(transaction) {
    setEditingId(transaction.id);
    setForm({ title: transaction.title, amount: String(transaction.amount), type: transaction.type, category: transaction.category, date: transaction.date, note: transaction.note || "" });
    setShowForm(true);
    setNotice("");
  }
  function saveTransaction(event) {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0 || !form.date) {
      setNotice("Please enter a description, a valid positive amount, and a date.");
      return;
    }
    const transaction = { ...form, title: form.title.trim(), note: form.note.trim(), amount, id: editingId ?? crypto.randomUUID() };
    if (editingId) {
      setTransactions(old => old.map(t => t.id === editingId ? transaction : t));
      setNotice("Transaction updated.");
    } else {
      setTransactions(old => [transaction, ...old]);
      setNotice("Transaction saved.");
    }
    setShowForm(false);
    setEditingId(null);
  }
  function removeTransaction(id) {
    if (!window.confirm("Delete this transaction? This cannot be undone.")) return;
    setTransactions(old => old.filter(t => t.id !== id));
    setNotice("Transaction deleted.");
  }
  function saveBudget(event) {
    event.preventDefault();
    const limit = Number(budgetForm.limit);
    if (!Number.isFinite(limit) || limit <= 0) { setNotice("Enter a budget greater than zero."); return; }
    setBudgets(old => old.some(b => b.category === budgetForm.category)
      ? old.map(b => b.category === budgetForm.category ? { ...b, limit } : b)
      : [...old, { category: budgetForm.category, limit, spent: 0 }]);
    setNotice("Budget saved.");
  }
  const navItems = [
    { label: "Overview", icon: LayoutDashboard }, { label: "Transactions", icon: ArrowLeftRight },
    { label: "Budgets", icon: Target }, { label: "Reports", icon: ChartNoAxesCombined },
    { label: "Settings", icon: Settings }
  ];

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
      <a className="brand" href="#" onClick={e => { e.preventDefault(); setActiveTab("Overview"); setMobileNav(false); }}>
        <span className="brand-mark"><Wallet size={23} /></span><span><strong>Your expenses</strong><small>Personal finance</small></span>
      </a>
      <div className="nav-label">WORKSPACE</div>
      <nav>{navItems.map(({ label, icon: Icon }) => <button key={label} className={`nav-link ${activeTab === label ? "active" : ""}`} onClick={() => { setActiveTab(label); setMobileNav(false); }}>
        <Icon size={19} /><span>{label}</span>{label === "Transactions" && <span className="nav-count">{transactions.length}</span>}
      </button>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><span className="help-icon"><PiggyBank size={21}/></span><strong>Small steps add up.</strong><p>Keep tracking your spending to build better money habits.</p><button onClick={() => setActiveTab("Budgets")}>Review budgets <span>↗</span></button></div>
        <div className="sidebar-foot"><ShieldCheck size={15}/> Your records stay on this device</div>
      </div>
    </aside>

    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNav(v => !v)}><Menu size={20}/></button>
        <div className="breadcrumbs">Workspace <span>/</span> <strong>{activeTab}</strong></div>
        <div className="top-actions"><span className="currency-label">Currency</span><select className="currency-select" aria-label="Currency" value={currency} onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))}><option value="GHS">GHS ₵</option><option value="USD">USD $</option><option value="GBP">GBP £</option><option value="EUR">EUR €</option><option value="NGN">NGN ₦</option></select><div className="avatar">YE</div></div>
      </header>

      <div className="content">
        {notice && <div className="notice" role="status"><Check size={17}/><span>{notice}</span><button aria-label="Dismiss notification" onClick={() => setNotice("")}><X size={16}/></button></div>}

        {activeTab === "Overview" && <>
          <div className="page-heading"><div><div className="eyebrow">YOUR FINANCES AT A GLANCE</div><h1>Good to see you.</h1><p>Here's what's happening with your money.</p></div><button className="primary-button" onClick={openAddForm}><Plus size={18}/> Add transaction</button></div>
          <div className="toolbar"><div className="period-select"><CalendarDays size={17}/><input aria-label="Select month" type="month" value={month} onChange={e => setMonth(e.target.value)}/></div><span className="muted small">Showing monthly summary</span></div>
          <section className="stats-grid">
            <article className="stat-card balance-card"><div className="stat-top"><span>Net cash flow</span><span className="stat-icon"><Wallet size={19}/></span></div><div className="stat-number">{money(balance)}</div><div className="stat-foot"><span className={`status-pill ${balance >= 0 ? "good" : "bad"}`}>{balance >= 0 ? "Positive balance" : "Spending exceeds income"}</span><span className="stat-period">This month</span></div><div className="balance-decoration">₵</div></article>
            <article className="stat-card"><div className="stat-top"><span>Total income</span><span className="stat-icon green"><ArrowDownLeft size={19}/></span></div><div className="stat-number">{money(income)}</div><div className="stat-foot"><span className="trend good"><TrendingUp size={14}/> Money in</span><span className="stat-period">This month</span></div></article>
            <article className="stat-card"><div className="stat-top"><span>Total expenses</span><span className="stat-icon coral"><ArrowUpRight size={19}/></span></div><div className="stat-number">{money(expenses)}</div><div className="stat-foot"><span className="trend bad"><TrendingDown size={14}/> Money out</span><span className="stat-period">This month</span></div></article>
          </section>
          <section className="overview-grid">
            <article className="panel spending-panel"><div className="panel-heading"><div><h2>Spending by category</h2><p>See where your money goes</p></div><button className="text-button" onClick={() => setActiveTab("Reports")}>Full report ↗</button></div>
              {categoryData.length ? <><div className="donut-wrap"><ResponsiveContainer width="100%" height={215}><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={88} paddingAngle={3} stroke="none">{categoryData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]}/>)}</Pie><Tooltip formatter={value => money(value)}/></PieChart></ResponsiveContainer><div className="donut-center"><strong>{money(expenses)}</strong><span>Total spent</span></div></div><div className="legend-list">{categoryData.slice(0, 5).map((item, i) => <div className="legend-row" key={item.name}><span className="legend-name"><i style={{ background: COLORS[i % COLORS.length] }}/>{item.name}</span><strong>{money(item.value)}</strong><span className="legend-percent">{expenses ? Math.round(item.value / expenses * 100) : 0}%</span></div>)}</div></> : <EmptyState icon={ChartNoAxesCombined} title="No spending to chart" text="Add an expense to see your spending breakdown."/>}
            </article>
            <article className="panel budget-panel"><div className="panel-heading"><div><h2>Budget overview</h2><p>Stay on top of your limits</p></div><button className="text-button" onClick={() => setActiveTab("Budgets")}>Manage ↗</button></div>
              {budgets.length ? <div className="budget-list">{budgets.slice(0, 5).map(b => { const spent = monthTransactions.filter(t => t.type === "Expense" && t.category === b.category).reduce((sum, t) => sum + t.amount, 0); const pct = b.limit ? spent / b.limit * 100 : 0; return <div className="budget-item" key={b.category}><div className="budget-item-top"><span>{b.category}</span><strong>{money(spent)} <small>/ {money(b.limit)}</small></strong></div><div className="progress-track"><div className={`progress-fill ${pct > 100 ? "over" : ""}`} style={{ width: `${Math.min(100, pct)}%` }}/></div><div className="budget-item-foot"><span>{Math.round(pct)}% used</span><span className={pct > 100 ? "text-danger" : ""}>{pct > 100 ? `${money(spent - b.limit)} over` : `${money(b.limit - spent)} left`}</span></div></div>; })}</div> : <EmptyState icon={Target} title="No budgets yet" text="Create a category budget to start planning."/>}
            </article>
          </section>
          <section className="panel transactions-panel"><div className="panel-heading"><div><h2>Recent transactions</h2><p>Your latest financial activity</p></div><button className="text-button" onClick={() => { setActiveTab("Transactions"); setPeriod("all"); }}>View all transactions ↗</button></div><TransactionTable transactions={[...monthTransactions].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5)} money={money} onEdit={openEditForm} onDelete={removeTransaction}/></section>
        </>}

        {activeTab === "Transactions" && <>
          <div className="page-heading"><div><div className="eyebrow">YOUR MONEY, ORGANIZED</div><h1>Transactions</h1><p>Every income and expense, all in one place.</p></div><button className="primary-button" onClick={openAddForm}><Plus size={18}/> Add transaction</button></div>
          <div className="panel transaction-page"><div className="transaction-tools"><div className="search-box"><Search size={17}/><input placeholder="Search transactions..." value={query} onChange={e => setQuery(e.target.value)}/></div><select aria-label="Filter transaction type" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}><option>All</option><option>Income</option><option>Expense</option></select><select aria-label="Filter date period" value={period} onChange={e => setPeriod(e.target.value)}><option value="month">Selected month</option><option value="all">All dates</option></select><button className="secondary-button" onClick={() => downloadCSV(filteredTransactions)}><Download size={16}/> Export CSV</button></div><div className="table-caption">{filteredTransactions.length} transaction{filteredTransactions.length === 1 ? "" : "s"} found</div><TransactionTable transactions={filteredTransactions} money={money} onEdit={openEditForm} onDelete={removeTransaction}/></div>
        </>}

        {activeTab === "Budgets" && <>
          <div className="page-heading"><div><div className="eyebrow">PLAN WITH PURPOSE</div><h1>Your budgets</h1><p>Set limits and make your money work for you.</p></div></div>
          <section className="stats-grid budget-stats"><article className="stat-card"><div className="stat-top"><span>Total budgeted</span><span className="stat-icon"><Target size={19}/></span></div><div className="stat-number">{money(budgets.reduce((s,b) => s + b.limit, 0))}</div><div className="stat-foot"><span className="stat-period">Across {budgets.length} categories</span></div></article><article className="stat-card"><div className="stat-top"><span>Spent this month</span><span className="stat-icon coral"><ArrowUpRight size={19}/></span></div><div className="stat-number">{money(expenses)}</div><div className="stat-foot"><span className="stat-period">{budgets.reduce((s,b) => s + b.limit, 0) ? Math.round(expenses / budgets.reduce((s,b) => s + b.limit, 0) * 100) : 0}% of total budget</span></div></article><article className="stat-card"><div className="stat-top"><span>Budget remaining</span><span className="stat-icon green"><PiggyBank size={19}/></span></div><div className="stat-number">{money(budgets.reduce((s,b) => s + b.limit, 0) - expenses)}</div><div className="stat-foot"><span className="stat-period">Budget minus recorded expenses</span></div></article></section>
          <div className="budget-layout"><section className="panel"><div className="panel-heading"><div><h2>Category budgets</h2><p>Spending progress for {month}</p></div></div>{budgets.length ? <div className="budget-list large">{budgets.map(b => { const spent = monthTransactions.filter(t => t.type === "Expense" && t.category === b.category).reduce((sum,t) => sum + t.amount, 0); const pct = b.limit ? spent/b.limit*100 : 0; return <div className="budget-item" key={b.category}><div className="budget-item-top"><span>{b.category}</span><strong>{money(spent)} <small>/ {money(b.limit)}</small></strong></div><div className="progress-track"><div className={`progress-fill ${pct > 100 ? "over" : ""}`} style={{width:`${Math.min(100,pct)}%`}}/></div><div className="budget-item-foot"><span>{Math.round(pct)}% used</span><span className={pct > 100 ? "text-danger" : ""}>{pct > 100 ? `${money(spent-b.limit)} over budget` : `${money(b.limit-spent)} remaining`}</span></div></div>; })}</div> : <EmptyState icon={Target} title="No budgets created" text="Use the form to create your first budget."/>}</section>
            <section className="panel budget-form-panel"><div className="panel-heading"><div><h2>Set a budget</h2><p>Create or update a category limit</p></div></div><form onSubmit={saveBudget} className="form-stack"><label>Category<select value={budgetForm.category} onChange={e => setBudgetForm(f => ({...f,category:e.target.value}))}>{EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label><label>Monthly limit<input type="number" min="0.01" step="0.01" required value={budgetForm.limit} onChange={e => setBudgetForm(f => ({...f,limit:e.target.value}))}/></label><button className="primary-button full" type="submit"><Check size={17}/> Save budget</button></form><div className="form-hint">Tip: start with the categories where you spend the most.</div></section></div>
        </>}

        {activeTab === "Reports" && <>
          <div className="page-heading"><div><div className="eyebrow">KNOW YOUR NUMBERS</div><h1>Reports & insights</h1><p>Understand patterns and make informed decisions.</p></div><div className="period-select"><CalendarDays size={17}/><input aria-label="Report month" type="month" value={month} onChange={e => setMonth(e.target.value)}/></div></div>
          <section className="stats-grid"><article className="stat-card"><div className="stat-top"><span>Income</span><span className="stat-icon green"><ArrowDownLeft size={19}/></span></div><div className="stat-number">{money(income)}</div><div className="stat-foot"><span className="stat-period">Selected month</span></div></article><article className="stat-card"><div className="stat-top"><span>Expenses</span><span className="stat-icon coral"><ArrowUpRight size={19}/></span></div><div className="stat-number">{money(expenses)}</div><div className="stat-foot"><span className="stat-period">Selected month</span></div></article><article className="stat-card"><div className="stat-top"><span>Net cash flow</span><span className="stat-icon"><CircleDollarSign size={19}/></span></div><div className="stat-number">{money(balance)}</div><div className="stat-foot"><span className="stat-period">Income minus expenses</span></div></article></section>
          <section className="overview-grid"><article className="panel"><div className="panel-heading"><div><h2>Spending breakdown</h2><p>Expenses by category</p></div></div>{categoryData.length ? <div className="chart-container"><ResponsiveContainer width="100%" height={300}><BarChart data={categoryData} layout="vertical" margin={{left:10,right:20}}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" tick={{fontSize:11}}/><YAxis dataKey="name" type="category" width={125} tick={{fontSize:11}}/><Tooltip formatter={v => money(v)}/><Bar dataKey="value" fill="#287b55" radius={[0,5,5,0]}/></BarChart></ResponsiveContainer></div> : <EmptyState icon={ChartNoAxesCombined} title="No report data yet" text="Add some expenses to see your chart."/>}</article><article className="panel"><div className="panel-heading"><div><h2>Budget health</h2><p>Actual spending versus limits</p></div></div><div className="budget-list">{budgets.map(b => {const spent = monthTransactions.filter(t => t.type === "Expense" && t.category === b.category).reduce((s,t)=>s+t.amount,0);const pct=b.limit?spent/b.limit*100:0;return <div className="budget-item" key={b.category}><div className="budget-item-top"><span>{b.category}</span><strong>{Math.round(pct)}%</strong></div><div className="progress-track"><div className={`progress-fill ${pct>100?"over":""}`} style={{width:`${Math.min(100,pct)}%`}}/></div></div>;})}</div></article></section>
          <section className="panel transactions-panel"><div className="panel-heading"><div><h2>Report transactions</h2><p>Download your records for spreadsheets or accounting.</p></div><button className="secondary-button" onClick={() => downloadCSV(monthTransactions)}><Download size={16}/> Export month CSV</button></div><TransactionTable transactions={[...monthTransactions].sort((a,b)=>b.date.localeCompare(a.date))} money={money} onEdit={openEditForm} onDelete={removeTransaction}/></section>
        </>}

        {activeTab === "Settings" && <>
          <div className="page-heading"><div><div className="eyebrow">MAKE IT YOURS</div><h1>Settings</h1><p>Personalize your expense tracking experience.</p></div></div>
          <div className="settings-grid"><section className="panel settings-panel"><div className="panel-heading"><div><h2>Preferences</h2><p>Choose your default currency and financial targets.</p></div><span className="setting-icon"><Settings size={20}/></span></div><form className="form-stack" onSubmit={e => {e.preventDefault();setNotice("Preferences saved.");}}><label>Display currency<select value={settings.currency} onChange={e=>setSettings(s=>({...s,currency:e.target.value}))}><option value="GHS">Ghanaian cedi (GHS)</option><option value="USD">US dollar (USD)</option><option value="GBP">British pound (GBP)</option><option value="EUR">Euro (EUR)</option><option value="NGN">Nigerian naira (NGN)</option></select><small>Changing currency changes the display only; it does not convert recorded amounts.</small></label><label>Monthly income target<input type="number" min="0" step="0.01" value={settings.incomeGoal} onChange={e=>setSettings(s=>({...s,incomeGoal:e.target.value}))}/></label><label>Monthly savings target<input type="number" min="0" step="0.01" value={settings.savingsGoal} onChange={e=>setSettings(s=>({...s,savingsGoal:e.target.value}))}/></label><button className="primary-button" type="submit"><Check size={17}/> Save preferences</button></form></section>
            <section className="panel settings-panel"><div className="panel-heading"><div><h2>Data & privacy</h2><p>Manage your transaction records.</p></div><span className="setting-icon"><ShieldCheck size={20}/></span></div><div className="privacy-note"><ShieldCheck size={20}/><div><strong>Stored locally in your browser</strong><p>Your data is saved to localStorage on this device. This version does not send transactions to a server or connect to your bank.</p></div></div><button className="secondary-button full" onClick={() => downloadCSV(transactions)}><Download size={17}/> Back up transactions (CSV)</button><button className="danger-button full" onClick={() => {if(window.confirm("This will permanently remove all transactions and budgets saved in this browser. Continue?")){setTransactions([]);setBudgets([]);setNotice("Local transaction and budget data cleared.");}}}><Trash2 size={17}/> Clear all transactions and budgets</button><div className="form-hint">Export your data before clearing it. CSV backups do not include settings or budgets.</div></section></div>
        </>}
        <footer className="page-footer"><span>© {new Date().getFullYear()} Your expenses</span><span><ShieldCheck size={14}/> Your money, your clarity.</span></footer>
      </div>
    </main>

    {showForm && <div className="modal-backdrop" onMouseDown={e => {if(e.target === e.currentTarget) setShowForm(false);}}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="transaction-modal-title"><div className="modal-heading"><div><div className="eyebrow">{editingId ? "EDIT RECORD" : "NEW RECORD"}</div><h2 id="transaction-modal-title">{editingId ? "Edit transaction" : "Add transaction"}</h2><p>Enter the details of your money movement.</p></div><button className="icon-button" aria-label="Close" onClick={() => setShowForm(false)}><X size={20}/></button></div><form onSubmit={saveTransaction} className="form-stack"><div className="type-switch"><button type="button" className={form.type === "Expense" ? "selected expense" : ""} onClick={() => updateForm("type","Expense")}><ArrowUpRight size={17}/> Expense</button><button type="button" className={form.type === "Income" ? "selected income" : ""} onClick={() => updateForm("type","Income")}><ArrowDownLeft size={17}/> Income</button></div><label>Description<input autoFocus required maxLength={100} placeholder="e.g. Grocery shopping" value={form.title} onChange={e=>updateForm("title",e.target.value)}/></label><label>Amount ({currency})<input type="number" min="0.01" step="0.01" required placeholder="0.00" value={form.amount} onChange={e=>updateForm("amount",e.target.value)}/></label><div className="form-row"><label>Category<select value={form.category} onChange={e=>updateForm("category",e.target.value)}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label><label>Date<input type="date" required value={form.date} onChange={e=>updateForm("date",e.target.value)}/></label></div><label>Note <span className="optional">(optional)</span><textarea rows="2" maxLength="300" placeholder="Add a note..." value={form.note} onChange={e=>updateForm("note",e.target.value)}/></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setShowForm(false)}>Cancel</button><button type="submit" className="primary-button"><Check size={17}/>{editingId ? "Save changes" : "Save transaction"}</button></div></form></section></div>}
  </div>;
}

function TransactionTable({ transactions, money, onEdit, onDelete }) {
  if (!transactions.length) return <EmptyState icon={Receipt} title="No transactions found" text="Try a different filter or add your first transaction." />;
  return <div className="table-scroll"><table><thead><tr><th>TRANSACTION</th><th>CATEGORY</th><th>DATE</th><th>AMOUNT</th><th aria-label="Actions"></th></tr></thead><tbody>{transactions.map(t=><tr key={t.id}><td><div className="transaction-name"><span className={`transaction-icon ${t.type === "Income" ? "income-icon" : ""}`}><IconForCategory category={t.category}/></span><span><strong>{t.title}</strong>{t.note && <small>{t.note}</small>}</span></div></td><td><span className="category-badge">{t.category}</span></td><td className="date-cell">{new Date(`${t.date}T12:00:00`).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</td><td><strong className={t.type === "Income" ? "amount-income" : "amount-expense"}>{t.type === "Income" ? "+" : "−"}{money(t.amount)}</strong></td><td><div className="row-actions"><button className="icon-button" title="Edit transaction" aria-label={`Edit ${t.title}`} onClick={()=>onEdit(t)}><Pencil size={15}/></button><button className="icon-button delete-action" title="Delete transaction" aria-label={`Delete ${t.title}`} onClick={()=>onDelete(t.id)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>;
}
function EmptyState({ icon: Icon, title, text }) {
  return <div className="empty-state"><span><Icon size={25}/></span><strong>{title}</strong><p>{text}</p></div>;
}