import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Activity, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Bell, Boxes, BriefcaseBusiness,
  CalendarDays, Check, ChevronDown, ChevronRight, CircleHelp, ClipboardList, Clock3, Cloud,
  Command, CreditCard, Database, Download, Ellipsis, Eye, EyeOff, FileSpreadsheet, FileText, Filter, HeartPulse,
  LayoutDashboard, LifeBuoy, LockKeyhole, LogOut, Menu, MoreHorizontal, Package, Plus, Search,
  Settings, ShieldCheck, Sparkles, Sun, Moon, Truck, Upload, Users, WandSparkles, X, Zap,
} from 'lucide-react'
import { demoConfigs, isBusinessDomain } from './config/demoConfigs'
import { ConfigurationRequestError, dataService, generateConfiguration, isApiConfigured, isCloudDataConfigured, previewSpreadsheet, validateBusinessRecord, type SpreadsheetPreview } from './services/api'
import { getActiveConfig, saveConfig } from './services/demoStore'
import type { BusinessConfig, BusinessRecord, ConfigEntity, ConfigField } from './types/config'
import { supabase, authConfigured } from './services/supabase'
import { useAuth } from './services/AuthProvider'

const industryCards = [
  { id: 'retail', icon: Package, title: 'Retail & E-commerce', text: 'Products, sales, inventory and suppliers.' },
  { id: 'healthcare', icon: HeartPulse, title: 'Healthcare', text: 'Patient records, appointments and care teams.' },
  { id: 'warehouse', icon: Boxes, title: 'Warehouse & Logistics', text: 'Stock, storage locations and dispatch.' },
  { id: 'hospitality', icon: BriefcaseBusiness, title: 'Hospitality', text: 'Bookings, rooms and guest experiences.' },
]

const money = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`
const primaryEntity = (config: BusinessConfig) => config.entities[0]
const getEntity = (config: BusinessConfig, key: string | undefined) =>
  config.entities.find((entity) => entity.key === key) ?? primaryEntity(config)

function Brand({ light = false }: { light?: boolean }) {
  return <Link to="/" className={`brand ${light ? 'brand-light' : ''}`} aria-label="AdaptAI home"><span className="brand-mark"><Command size={19} strokeWidth={2.5} /></span><span>adapt<span>ai</span></span></Link>
}

function PublicHeader() {
  const [open, setOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('adaptai.theme') === 'dark')
  const location = useLocation()
  const links = [['Home', '/'], ['Features', '/features'], ['How it works', '/how-it-works'], ['Industries', '/industries'], ['Pricing', '/pricing']]
  useEffect(() => { document.documentElement.dataset.theme = darkMode ? 'dark' : 'light' }, [darkMode])
  const toggleTheme = () => setDarkMode((current) => {
    const next = !current
    localStorage.setItem('adaptai.theme', next ? 'dark' : 'light')
    return next
  })
  return <header className="public-header"><div className="nav-wrap"><Brand light /><nav id="public-navigation" className={open ? 'public-links open' : 'public-links'} aria-label="Main navigation">{links.map(([label, path]) => <Link key={path} className={location.pathname === path ? 'nav-active' : ''} aria-current={location.pathname === path ? 'page' : undefined} to={path} onClick={() => setOpen(false)}>{label}</Link>)}</nav><div className="nav-actions"><button type="button" className="public-theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`} aria-pressed={darkMode} title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}>{darkMode ? <Sun size={17} /> : <Moon size={17} />}</button><Link className="login-link" to="/login">Log in</Link><Link className="button button-small button-primary" to="/setup">Get started <ArrowRight size={15} /></Link></div><button type="button" className="mobile-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-controls="public-navigation" aria-expanded={open}>{open ? <X /> : <Menu />}</button></div></header>
}

function Footer() {
  return <footer className="footer"><div className="footer-top"><div className="footer-brand"><Brand light /><p>Business software that finally fits<br />the way you work.</p></div><div className="footer-col"><b>Product</b><Link to="/features">Features</Link><Link to="/industries">Industries</Link><Link to="/pricing">Pricing</Link></div><div className="footer-col"><b>Explore</b><Link to="/how-it-works">How it works</Link><Link to="/setup">Get started</Link><Link to="/login">Log in</Link></div></div><div className="footer-bottom"><span>© 2026 AdaptAI. All rights reserved.</span><span>Thoughtfully made for businesses of all kinds.</span></div></footer>
}

function DashboardPreview() {
  const bars = [32, 46, 39, 65, 51, 76, 59, 84, 68, 95, 73, 88]
  return <div className="preview-shell"><div className="preview-window"><aside className="preview-sidebar"><Brand light /><span className="preview-workspace">WORKSPACE</span>{['Overview', 'Products', 'Sales', 'Inventory', 'Suppliers'].map((x, i) => <div key={x} className={`preview-nav ${i === 0 ? 'selected' : ''}`}>{[LayoutDashboard, Package, CreditCard, Boxes, Users].map((Icon, n) => n === i ? <Icon key={x} size={15} /> : null)}{x}</div>)}<div className="preview-sidebar-foot"><Settings size={15} /> Settings</div></aside><div className="preview-content"><div className="preview-heading"><div><span>ILLUSTRATIVE DASHBOARD PREVIEW</span><h3>Good morning, Alex <span>✦</span></h3></div><div className="preview-avatar">A</div></div><div className="preview-metrics">{[['Total products', '1,284', '+12.8%'], ['Total sales', '₹48,230', '+8.2%'], ['Low stock', '08', 'Needs attention'], ['Inventory value', '₹2.45L', '+4.6%']].map((x, i) => <div className="preview-metric" key={x[0]}><span>{x[0]}</span><b>{x[1]}</b><small className={i === 2 ? 'warning-text' : ''}>{x[2]}</small></div>)}</div><div className="preview-chart-card"><div className="preview-card-heading"><div><b>Sales overview</b><span>Revenue performance</span></div><span className="preview-dropdown">This week⌄</span></div><div className="chart-bars">{bars.map((n, i) => <div key={i} className="chart-column"><i style={{ height: `${n}%` }} /><span>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i % 7]}</span></div>)}</div></div><div className="preview-table"><b>Best selling products</b><div className="preview-row preview-row-head"><span>Product</span><span>Sold</span><span>Revenue</span></div>{[['Everyday Tote', '148', '₹1,92,400'], ['Linen Shirt', '96', '₹1,44,000'], ['Cloud Sneakers', '74', '₹2,88,600']].map((row) => <div className="preview-row" key={row[0]}><span><i className="product-dot" />{row[0]}</span><span>{row[1]}</span><span>{row[2]}</span></div>)}</div></div></div><div className="preview-glow" /></div>
}

function HomePage() {
  const navigate = useNavigate()
  return <><section className="hero"><PublicHeader /><div className="hero-inner"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> BUSINESS SOFTWARE, REIMAGINED</div><h1>One platform.<br /><span>Any business.</span></h1><p>Describe your business and start with a workspace shaped around how you work. AI generation is used when available; industry templates provide a ready-to-use fallback.</p><div className="hero-buttons"><Link to="/setup" className="button button-primary button-large">Build your workspace <ArrowRight size={17} /></Link><Link to="/how-it-works" className="button button-ghost button-large"><span className="play-icon">▶</span> See how it works</Link></div><div className="reassurance"><span><Check /> Industry templates</span><span><Check /> No coding required</span><span><Check /> Setup takes a few steps</span></div></div><DashboardPreview /></div><div className="hero-bottom"><span>MADE FOR HOW YOU WORK</span><div><span>RETAIL</span><span>HEALTHCARE</span><span>LOGISTICS</span><span>HOSPITALITY</span><span>AND MORE</span></div></div></section><section className="capability-strip" aria-label="Workspace capabilities"><div><Boxes size={18} /><span><b>Business templates</b><small>Ready-to-use starting points</small></span></div><div><ClipboardList size={18} /><span><b>Flexible records</b><small>Fields based on your setup</small></span></div><div><FileSpreadsheet size={18} /><span><b>Spreadsheet import</b><small>Preview and map your data</small></span></div><div><LayoutDashboard size={18} /><span><b>Useful overview</b><small>See current workspace activity</small></span></div></section><section className="section industries-section" id="industries"><div className="section-heading"><div className="eyebrow eyebrow-light">ONE PLATFORM, ENDLESS POSSIBILITIES</div><h2>Built for every kind<br />of <span>business.</span></h2><p>Not another one-size-fits-all tool. AdaptAI shapes itself around the work you do.</p></div><div className="industry-grid">{industryCards.map(({ id, icon: Icon, title, text }) => <button className="industry-card" key={id} onClick={() => navigate(`/setup?industry=${id}`)}><span className="industry-icon"><Icon size={21} /></span><span className="industry-card-title">{title}<ArrowUpRight size={16} /></span><span className="industry-card-text">{text}</span><span className="industry-explore">Explore template <ArrowRight size={14} /></span></button>)}</div></section><section className="section how-section" id="how"><div className="section-heading"><div className="eyebrow eyebrow-light">FROM IDEA TO UP AND RUNNING</div><h2>Less setup. More <span>doing.</span></h2><p>Go from a blank page to a business system that feels like yours.</p></div><div className="steps-grid">{[{ icon: WandSparkles, n: '01', title: 'Tell us how you work', text: 'Describe what your business needs in plain English.' }, { icon: Sparkles, n: '02', title: 'Make it yours', text: 'Review a tailored dashboard, modules and useful fields.' }, { icon: LayoutDashboard, n: '03', title: 'Get to work', text: 'Manage records, keep track of activity and see the bigger picture.' }].map(({ icon: Icon, n, title, text }) => <div className="step-card" key={n}><div className="step-top"><div className="step-icon"><Icon /></div><span>{n}</span></div><h3>{title}</h3><p>{text}</p></div>)}</div></section><section className="product-showcase"><div className="showcase-inner"><div className="showcase-copy"><div className="eyebrow">YOUR BUSINESS, YOUR WAY</div><h2>A workspace that<br />speaks <span>your language.</span></h2><p>The modules, fields, and useful numbers you see are shaped by the business you describe. Start with a template. Make it your own.</p><Link className="text-link" to="/industries">Explore industry templates <ArrowRight size={16} /></Link><div className="showcase-stat"><b>One flexible foundation.</b><span>New business, new modules, same simple way to work.</span></div></div><DashboardPreview /></div></section><section className="final-cta"><div className="final-glow" /><div className="eyebrow"><span className="eyebrow-dot" /> YOUR NEXT CHAPTER STARTS HERE</div><h2>Your business. Your system.<br /><span>Ready when you are.</span></h2><p>Stop adapting your business to rigid software.<br />Build a system around the way you work.</p><Link className="button button-primary button-large" to="/setup">Create your workspace <ArrowRight size={17} /></Link><span className="cta-note">Start with a free, no-pressure demo workspace.</span></section><Footer /></>
}

function PublicPage({ title, intro, eyebrow, children }: { title: ReactNode; intro: string; eyebrow: string; children: ReactNode }) {
  return <><PublicHeader /><main className="public-page"><div className="public-page-heading"><div className="eyebrow eyebrow-light">{eyebrow}</div><h1>{title}</h1><p>{intro}</p></div>{children}</main><Footer /></>
}

function FeaturesPage() {
  const features = [
    { icon: LayoutDashboard, label: 'A dashboard that starts with you', text: 'See the useful numbers first. Each workspace begins with widgets that fit your chosen business template.' },
    { icon: ClipboardList, label: 'Records that make sense', text: 'Create and manage records with fields, tables and labels designed around the kind of work you do.' },
    { icon: Database, label: 'Keep business data together', text: 'Products, appointments or stock: find the records you need in a consistent workspace.' },
    { icon: Activity, label: 'A clearer view of activity', text: 'Review sample sales trends, activity and useful summaries using the workspace’s current records.' },
    { icon: Zap, label: 'Room to grow', text: 'Workflow automation is on our roadmap; it is not currently available in this demo.' },
    { icon: Cloud, label: 'Wherever work takes you', text: 'Responsive layouts keep the demo useful on a desktop, tablet or phone.' },
  ]
  return <PublicPage eyebrow="A BETTER FIT BY DESIGN" title={<>Useful tools. <span>Built around you.</span></>} intro="A practical foundation for managing the moving parts of your business—without the one-size-fits-all baggage."><div className="feature-grid">{features.map(({ icon: Icon, label, text }, i) => <article className={`feature-card ${i === 0 || i === 3 ? 'feature-wide' : ''}`} key={label}><span className="industry-icon"><Icon /></span><h3>{label}</h3><p>{text}</p><span className="feature-status">{i === 4 ? 'PLANNED' : 'AVAILABLE IN DEMO'}</span></article>)}</div><div className="public-cta-card"><h2>See what a better fit looks like.</h2><p>Choose an industry template and make it your own.</p><Link to="/setup" className="button button-primary">Build your business system <ArrowRight size={16} /></Link></div></PublicPage>
}

function HowPage() {
  const [description, setDescription] = useState('I run a clothing store. I need to manage products, stock, sales and suppliers.')
  const [selected, setSelected] = useState<BusinessConfig['domain']>('retail')
  const [showProposal, setShowProposal] = useState(false)
  const config = demoConfigs[selected]
  return <PublicPage eyebrow="SIMPLE BY DESIGN" title={<>From a few words to <span>your workspace.</span></>} intro="A guided starting point for shaping a management system around your business. In this frontend demo, proposed configurations are predefined—not generated by a connected AI service."><div className="workflow-demo"><div className="workflow-form"><div className="eyebrow eyebrow-light">TRY THE DEMO</div><label htmlFor="demo-prompt">Describe how you work</label><textarea id="demo-prompt" value={description} onChange={(event) => setDescription(event.target.value)} /><label htmlFor="demo-industry">Choose a template</label><select id="demo-industry" value={selected} onChange={(event) => setSelected(event.target.value as BusinessConfig['domain'])}><option value="retail">Retail & E-commerce</option><option value="healthcare">Healthcare</option><option value="warehouse">Warehouse & Logistics</option><option value="hospitality">Hospitality</option></select><button className="button button-primary" onClick={() => setShowProposal(true)}>Preview a demo setup <ArrowRight size={16} /></button><small>Simulated demo · no AI request is sent</small></div><div className="proposal-card"><span className="proposal-tag"><Sparkles size={14} /> {showProposal ? 'DEMO CONFIGURATION READY' : 'YOUR DEMO PREVIEW'}</span><h3>{showProposal ? config.title : 'Your proposed workspace'}</h3><p>{showProposal ? `Based on the ${config.industry} demo template.` : 'Pick a template and preview the modules it includes.'}</p><div className="proposal-modules">{config.entities.map((entity) => <span key={entity.key}><Check size={14} />{entity.label}</span>)}</div><div className="proposal-fields"><b>Example fields</b><p>{config.entities[0].fields.slice(0, 4).map((field) => field.label).join(' · ')}</p></div><div className="proposal-fields"><b>Dashboard widgets</b><p>{config.dashboard.widgets.map((widget) => widget.label).join(' · ')}</p></div><Link className="button button-primary" to={`/setup?industry=${selected}`}>Customize this template <ArrowRight size={16} /></Link></div></div><div className="workflow-steps">{[['01', 'Describe', 'Tell us what your business needs.'], ['02', 'Generate', 'Start with a matching demo configuration.'], ['03', 'Review', 'Check the proposed modules and fields.'], ['04', 'Manage', 'Use your generated demo workspace.']].map(([n, title, text]) => <div key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></div>)}</div></PublicPage>
}

function IndustriesPage() {
  return <PublicPage eyebrow="FIND YOUR STARTING POINT" title={<>A template for every <span>kind of work.</span></>} intro="Explore an example of how the same flexible renderer can adapt to different business domains."><div className="template-list">{industryCards.map(({ id, icon: Icon, title, text }) => { const config = demoConfigs[id as BusinessConfig['domain']]; return <article className="template-card" key={id}><div className="template-info"><span className="industry-icon"><Icon /></span><div><h2>{title}</h2><p>{text}</p></div></div><div className="template-modules"><span>EXAMPLE MODULES</span>{config.entities.map((entity) => <b key={entity.key}>{entity.label}</b>)}</div><div className="template-modules"><span>EXAMPLE FIELDS</span>{config.entities[0].fields.slice(0, 4).map((field) => <b key={field.key}>{field.label}</b>)}</div><Link className="button button-secondary" to={`/setup?industry=${id}`}>Use this template <ArrowRight size={15} /></Link></article> })}</div><p className="demo-note">Healthcare examples use synthetic demo information only.</p></PublicPage>
}

function PricingPage() {
  const plans = [
    { name: 'Starter', price: 'Illustrative', desc: 'For a first look at your new workspace.', points: ['A business template', 'Core records and dashboard', 'Local demo persistence'] },
    { name: 'Professional', price: 'Illustrative', desc: 'For teams with more to keep track of.', points: ['Everything in Starter', 'Flexible business modules', 'Expanded reporting demo'], featured: true },
    { name: 'Enterprise', price: 'Contact us', desc: 'For more complex business requirements.', points: ['Configurable workspace', 'Backend integration pathway', 'Availability to be determined'] },
  ]
  return <PublicPage eyebrow="SIMPLE, TRANSPARENT STARTING POINT" title={<>A plan for what’s <span>next.</span></>} intro="Pricing is not finalized. These example tiers are illustrative and are not offers or commercial commitments."><div className="pricing-grid">{plans.map((plan) => <article className={`price-card ${plan.featured ? 'price-featured' : ''}`} key={plan.name}>{plan.featured && <span className="popular-tag">A PLACE TO START</span>}<h2>{plan.name}</h2><p>{plan.desc}</p><b className="price">{plan.price}</b><span className="price-caption">Example only · not finalized</span><ul>{plan.points.map((point) => <li key={point}><Check size={15} />{point}</li>)}</ul><Link className={`button ${plan.featured ? 'button-primary' : 'button-secondary'}`} to={plan.name === 'Enterprise' ? '/login' : '/setup'}>{plan.name === 'Enterprise' ? 'Sign in for updates' : 'Try the demo'} <ArrowRight size={15} /></Link></article>)}</div><section className="faq-section"><h2>Good to know</h2>{[['Are these real prices?', 'No. Pricing has not been finalized; the labels on this page are illustrative.'], ['Is the demo connected to a backend?', 'No. By default, the app uses local demo data. API mode can be configured for a compatible backend.'], ['Can I change my plan?', 'There are no active plans or commercial commitments in this frontend demo.']].map(([q, a]) => <details key={q}><summary>{q}<ChevronDown size={17} /></summary><p>{a}</p></details>)}</section></PublicPage>
}

function AuthPage({ register = false }: { register?: boolean }) {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()
  useEffect(() => { if (user) navigate('/app/dashboard', { replace: true }) }, [user, navigate])
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) { setMessage('Authentication is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart Vite.'); return }
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim().toLowerCase()
    const password = String(form.get('password') ?? '')
    if (password.length < 8) { setMessage('Use at least 8 characters for the password.'); return }
    if (register && form.get('password') !== form.get('confirm')) { setMessage('The passwords do not match.'); return }
    setMessage('')
    setBusy(true)
    try {
      if (register) {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: String(form.get('name') ?? '').trim() }, emailRedirectTo: `${window.location.origin}/verify-email?email=${encodeURIComponent(email)}` } })
        if (error) throw error
        if (data.session) navigate('/app/dashboard', { replace: true })
        else navigate(`/verify-email?email=${encodeURIComponent(email)}`)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/app/dashboard', { replace: true })
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Authentication failed. Please try again.') }
    finally { setBusy(false) }
  }
  return <AuthFrame title={register ? 'Create your account' : 'Welcome back'} intro={register ? 'Register to create your AdaptAI account.' : 'Sign in to continue to your workspace.'} message={message} onSubmit={submit} busy={busy} submitLabel={busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}>
    {register && <label>Full name<input name="name" placeholder="Your name" required autoComplete="name" /></label>}
    <label>Email address<input name="email" type="email" placeholder="you@company.com" required autoComplete="email" /></label>
    <label>Password<div className="password-wrap"><input name="password" type={visible ? 'text' : 'password'} placeholder="At least 8 characters" required autoComplete={register ? 'new-password' : 'current-password'} /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
    {register && <><label>Confirm password<input name="confirm" type={visible ? 'text' : 'password'} required autoComplete="new-password" /></label><p className="auth-demo-notice">Use demo data only. Don’t enter confidential business or patient information.</p></>}
    <div className="auth-extra">{!register && <Link to="/forgot-password">Forgot password?</Link>}</div>
    {!authConfigured && <div className="form-message">Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable authentication.</div>}
    <span className="auth-switch">{register ? 'Already have an account?' : 'New to AdaptAI?'} <Link to={register ? '/login' : '/register'}>{register ? 'Log in' : 'Create an account'}</Link></span>
  </AuthFrame>
}

function AuthFrame({ title, intro, message, onSubmit, children, submitLabel, busy = false }: { title: string; intro: string; message: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void; children: ReactNode; submitLabel?: string; busy?: boolean }) {
  return <div className="auth-page"><div className="auth-art"><Brand light /><div className="auth-art-copy"><div className="eyebrow"><span className="eyebrow-dot" /> A BETTER FIT FOR BUSINESS</div><h1>Your work,<br /><span>your way.</span></h1><p>A workspace that adapts to your business, not the other way around.</p><div className="auth-art-decoration"><div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" /><div className="auth-art-center"><Command size={38} /></div><span className="floating-chip chip-one"><Boxes size={15} /> Your modules</span><span className="floating-chip chip-two"><Sparkles size={15} /> Your way</span></div></div><span className="auth-legal">AdaptAI account security powered by Supabase</span></div><div className="auth-main"><Link to="/" className="auth-back"><ArrowLeft size={16} /> Back to home</Link><form className="auth-form" onSubmit={onSubmit}><div className="industry-icon"><LockKeyhole size={21} /></div><h2>{title}</h2><p>{intro}</p>{children}{message && <div className="form-message" role="alert">{message}</div>}<button disabled={busy} className="button button-primary auth-submit" type="submit">{submitLabel ?? title}<ArrowRight size={16} /></button></form><div className="auth-footer">© 2026 AdaptAI</div></div></div>
}

function VerifyEmailPage() {
  const [params] = useSearchParams()
  const email = params.get('email') ?? ''
  const [message, setMessage] = useState('Enter the six-digit code sent to your email.')
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  useEffect(() => { if (!loading && user) navigate('/app/dashboard', { replace: true }) }, [loading, user, navigate])
  useEffect(() => { if (cooldown > 0) { const timer = window.setTimeout(() => setCooldown(cooldown - 1), 1000); return () => window.clearTimeout(timer) } }, [cooldown])
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!supabase || !email) { setMessage('Signup session is missing. Please register again.'); return }
    setBusy(true); setMessage('')
    try { const token = String(new FormData(event.currentTarget).get('token') ?? '').trim(); const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' }); if (error) throw error; navigate('/app/dashboard', { replace: true }) }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not verify this code.') }
    finally { setBusy(false) }
  }
  const resend = async () => { if (!supabase || cooldown) return; setBusy(true); try { const { error } = await supabase.auth.resend({ type: 'signup', email }); if (error) throw error; setMessage('A new verification code was sent.'); setCooldown(60) } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not resend the code.') } finally { setBusy(false) } }
  return <AuthFrame title="Verify your email" intro={`Enter the verification code sent to ${email || 'your email address'}.`} message={message} onSubmit={submit} busy={busy} submitLabel={busy ? 'Verifying…' : 'Verify email'}><label>Verification code<input name="token" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required /></label><button className="text-link" type="button" disabled={busy || cooldown > 0} onClick={resend}>{cooldown ? `Resend available in ${cooldown}s` : 'Resend code'}</button></AuthFrame>
}

function ForgotPasswordPage() {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!supabase) { setMessage('Authentication is not configured.'); return }; setBusy(true); setMessage(''); try { const email = String(new FormData(event.currentTarget).get('email') ?? '').trim(); const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }); if (error) throw error; setMessage('If an account exists for that address, a password reset email has been sent.') } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not send reset email.') } finally { setBusy(false) } }
  return <AuthFrame title="Reset your password" intro="We’ll email you a secure password recovery link." message={message} onSubmit={submit} busy={busy} submitLabel={busy ? 'Sending…' : 'Send recovery email'}><label>Email address<input name="email" type="email" autoComplete="email" required /></label><Link to="/login">Return to login</Link></AuthFrame>
}

function ResetPasswordPage() {
  const [message, setMessage] = useState('Use the secure link from your email to set a new password.')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!supabase) { setMessage('Authentication is not configured.'); return }; const form = new FormData(event.currentTarget); const password = String(form.get('password') ?? ''); if (password.length < 8 || password !== form.get('confirm')) { setMessage(password.length < 8 ? 'Use at least 8 characters.' : 'The passwords do not match.'); return }; setBusy(true); try { const { error } = await supabase.auth.updateUser({ password }); if (error) throw error; setMessage('Password updated. You can now sign in.'); await supabase.auth.signOut(); window.setTimeout(() => navigate('/login', { replace: true }), 900) } catch (error) { setMessage(error instanceof Error ? error.message : 'The recovery link may be invalid or expired. Request a new one.') } finally { setBusy(false) } }
  return <AuthFrame title="Choose a new password" intro="Set a new password for your account." message={message} onSubmit={submit} busy={busy} submitLabel={busy ? 'Updating…' : 'Update password'}><label>New password<input name="password" type="password" minLength={8} autoComplete="new-password" required /></label><label>Confirm password<input name="confirm" type="password" autoComplete="new-password" required /></label></AuthFrame>
}

const setupSteps = ['Business details', 'Generate system', 'Review & confirm', 'Start using']
function SetupPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const param = params.get('industry')
  const [domain, setDomain] = useState<BusinessConfig['domain']>(isBusinessDomain(param) ? param : 'retail')
  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [generatedConfig, setGeneratedConfig] = useState<BusinessConfig | null>(null)
  const [aiGenerated, setAiGenerated] = useState(false)
  const [saving, setSaving] = useState(false)
  const config = generatedConfig ?? demoConfigs[domain]
  useEffect(() => {
    if (isBusinessDomain(param)) setDomain(param)
  }, [param])
  const generate = async () => {
    const businessName = name.trim()
    const description = prompt.trim()
    if (!businessName) { setError('Enter your business name to continue.'); return }
    if (businessName.length > 100) { setError('Business name must be 100 characters or fewer.'); return }
    if (description.length < 10) { setError('Description must be at least 10 characters.'); return }
    if (description.length > 2000) { setError('Description must be 2,000 characters or fewer.'); return }
    setError('')
    setNotice('')
    setGeneratedConfig(null)
    setAiGenerated(false)
    setStep(1)
    try {
      const result = await generateConfiguration({ businessName, description, domain })
      setGeneratedConfig(result)
      setAiGenerated(true)
      setStep(2)
    } catch (e) {
      if (import.meta.env.DEV && e instanceof ConfigurationRequestError) {
        console.warn('[AdaptAI] Configuration request failed.', { status: e.status })
      }
      if (e instanceof ConfigurationRequestError && e.status === 400) {
        setError(e.message)
        setStep(0)
        return
      }
      setGeneratedConfig({ ...demoConfigs[domain], title: name.trim() })
      setAiGenerated(false)
      setNotice(e instanceof Error ? `${e.message} A predefined ${demoConfigs[domain].industry.toLowerCase()} template is shown so you can still preview the workspace.` : 'AI generation is unavailable. A predefined template is shown instead.')
      setStep(2)
    }
  }
  const useIndustryTemplate = () => {
    const businessName = name.trim()
    if (!businessName) { setError('Enter your business name to continue.'); return }
    if (businessName.length > 100) { setError('Business name must be 100 characters or fewer.'); return }
    setError('')
    setNotice('AI was skipped. Review this ready-to-use industry template and customize it later.')
    setGeneratedConfig({ ...demoConfigs[domain], title: businessName })
    setAiGenerated(false)
    setStep(2)
  }
  const confirm = async () => {
    const customized = { ...config, title: name.trim() || config.title }
    setError('')
    setSaving(true)
    try {
      if (supabase) {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw new Error(`Could not verify your account: ${userError.message}`)
        if (!user) {
          sessionStorage.setItem('adaptai.pendingConfig', JSON.stringify(customized))
          navigate('/register')
          return
        }
      }
      await dataService.saveConfiguration(customized)
      saveConfig(customized)
      setStep(3)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the workspace configuration.')
    } finally {
      setSaving(false)
    }
  }
  return <div className="setup-page"><PublicHeader /><main className={`setup-main ${step === 2 ? 'setup-review-main' : ''}`}><Link to="/" className="back-link"><ArrowLeft size={15} /> Back to home</Link><div className="setup-heading"><div className="eyebrow eyebrow-light">YOUR WORKSPACE STARTS HERE</div><h1>Let’s make something <span>that fits.</span></h1><p>A few details help us set up the right workspace for your business.</p></div><div className="stepper" aria-label="Workspace setup progress">{setupSteps.map((title, i) => <div key={title} className={`stepper-item ${step === i ? 'current' : ''} ${step > i ? 'complete' : ''}`} aria-current={step === i ? 'step' : undefined}><span>{step > i ? <Check size={15} /> : i + 1}</span><b>{title}</b></div>)}</div><div className={`setup-card ${step === 2 ? 'setup-review-card' : ''}`}>{step === 0 && <><span className="form-step-label">STEP 1 OF 4 · BUSINESS DETAILS</span><h2>Tell us about your business</h2><p>Describe what you need; AI will draft modules, fields and dashboard widgets for review.</p><label>Choose your industry<select value={domain} onChange={(event) => { setDomain(event.target.value as BusinessConfig['domain']); setGeneratedConfig(null) }}><option value="retail">Retail & E-commerce</option><option value="healthcare">Healthcare</option><option value="warehouse">Warehouse & Logistics</option><option value="hospitality">Hospitality</option></select></label><label>Business name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. The Corner Store" /></label><label>What would you like to manage?<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Example: I run a clothing store. I want to manage products, stock quantities, sales and suppliers." rows={4} /></label><div className="setup-note"><Sparkles size={16} /><span><b>AI-assisted setup</b><br />Your description is sent to your configured AdaptAI server to draft a workspace.</span></div>{error && <div className="form-message">{error}</div>}<div className="setup-generation-actions"><button className="button button-primary setup-button" onClick={generate}>Generate my system <ArrowRight size={16} /></button><button className="button button-secondary setup-button" onClick={useIndustryTemplate}>Use industry template</button></div></>}{step === 1 && <div className="generation-state" role="status" aria-live="polite"><div className="generation-icon"><Sparkles /></div><span className="form-step-label">STEP 2 OF 4 · GENERATING YOUR WORKSPACE</span><h2>Drafting your setup</h2><p>Turning your business needs into modules, fields and dashboard widgets.</p><div className="generation-checks"><span><Check /> Reading your business description</span><span><Check /> Designing relevant modules and fields</span><span className="generation-active"><span className="spinner" /> Building your dashboard preview</span></div></div>}{step === 2 && <><span className="form-step-label">STEP 3 OF 4 · REVIEW & CONFIRM</span><h2>{name || config.title}</h2><p>{aiGenerated ? 'AI generated this starting point. Review and adjust your description before creating the workspace.' : `Review the predefined ${config.industry.toLowerCase()} template preview.`}</p>{notice && <div className="setup-fallback-notice" role="status">{notice}</div>}{error && <div className="form-message" role="alert">{error}</div>}<div className="review-block"><h3>Included modules</h3><div className="review-modules">{config.entities.map((entity) => <span key={entity.key}><Check size={14} />{entity.label}</span>)}</div></div><div className="review-block"><h3>Example fields</h3>{config.entities.map((entity) => <div className="review-entity" key={entity.key}><b>{entity.label}</b><span>{entity.fields.map((field) => field.label).join(' · ')}</span></div>)}</div><div className="review-block"><h3>Dashboard widgets</h3><div className="review-modules">{config.dashboard.widgets.map((widget) => <span key={widget.key}><LayoutDashboard size={14} />{widget.label}</span>)}</div></div><div className="review-actions"><button className="button button-secondary" onClick={() => setStep(0)}><ArrowLeft size={15} /> Edit details</button><button className="button button-primary" onClick={confirm} disabled={saving}>{saving ? "Saving workspace…" : "Confirm & create dashboard"} <ArrowRight size={15} /></button></div></>}{step === 3 && <div className="generation-state" role="status" aria-live="polite"><div className="generation-icon success"><Check /></div><span className="form-step-label">STEP 4 OF 4 · READY TO GO</span><h2>Your workspace is ready.</h2><p>{isCloudDataConfigured ? 'Your configuration is saved to your Supabase workspace. Business records are stored there as you create them.' : 'This demo configuration is saved in this browser. Sign-in is required to create a cloud workspace.'}</p><button className="button button-primary setup-button" onClick={() => navigate('/app/dashboard')}>Open your dashboard <ArrowRight size={16} /></button></div>}</div><div className="demo-note centered">{isCloudDataConfigured ? 'Sign in to save configurations and records to the workspace protected by Supabase RLS.' : isApiConfigured ? 'Configurations can be sent to your configured AdaptAI API; records use local demo storage unless Supabase is configured.' : 'Workspace configurations and sample records are saved in this browser.'}</div></main><Footer /></div>
}

const navIcons = [LayoutDashboard, Package, Activity, Boxes, Users, ClipboardList, Settings]
function workspaceNav(config: BusinessConfig) {
  const first = primaryEntity(config)
  const routeMap: Record<string, string> = { products: '/app/records', patients: '/app/records', stock: '/app/records', rooms: '/app/records', sales: '/app/activity', appointments: '/app/activity', dispatches: '/app/activity', bookings: '/app/activity', suppliers: '/app/contacts', doctors: '/app/contacts', locations: '/app/contacts', staff: '/app/contacts' }
  const main = [{ label: 'Dashboard', path: '/app/dashboard', icon: navIcons[0] }, { label: first.label, path: '/app/records', icon: navIcons[1] }, { label: 'Import data', path: '/app/import', icon: FileSpreadsheet }]
  for (const entity of config.entities.slice(1)) {
    const path = routeMap[entity.key] ?? `/app/records?entity=${entity.key}`
    if (!main.some((item) => item.path === path || item.label === entity.label)) main.push({ label: entity.label, path, icon: entity.key.includes('sale') || entity.key.includes('appointment') || entity.key.includes('dispatch') ? navIcons[2] : navIcons[4] })
  }
  return [...main, { label: 'Analytics', path: '/app/analytics', icon: navIcons[5] }, { label: 'Settings', path: '/app/settings', icon: navIcons[6] }]
}

function AppShell({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState(getActiveConfig)
  const [configError, setConfigError] = useState('')
  const [cloudReady, setCloudReady] = useState(!isCloudDataConfigured)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('adaptai.sidebar') === 'collapsed')
  const [accountOpen, setAccountOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('adaptai.theme') === 'dark')
  useEffect(() => { document.documentElement.dataset.theme = darkMode ? 'dark' : 'light' }, [darkMode])
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()
  const accountName = String(user?.user_metadata?.full_name ?? user?.email ?? 'Account')
  const signOut = async () => { if (!supabase) return; await supabase.auth.signOut(); navigate('/login', { replace: true }) }
  useEffect(() => {
    if (!user || !isCloudDataConfigured) return
    let active = true
    setCloudReady(false)
    const load = async () => {
      const pendingConfig = sessionStorage.getItem('adaptai.pendingConfig')
      if (pendingConfig) {
        const savedConfig = JSON.parse(pendingConfig) as BusinessConfig
        await dataService.saveConfiguration(savedConfig)
        sessionStorage.removeItem('adaptai.pendingConfig')
        if (active) {
          saveConfig(savedConfig)
          setConfig(savedConfig)
          setConfigError('')
          setCloudReady(true)
        }
        return
      }
      const savedConfig = await dataService.loadConfiguration(config.domain)
      if (!active) return
      if (savedConfig) {
        saveConfig(savedConfig)
        setConfig(savedConfig)
      }
      setConfigError('')
      setCloudReady(true)
    }
    load()
      .catch((error: unknown) => {
        if (active) {
          setConfigError(error instanceof Error ? error.message : 'Could not load this workspace.')
          setCloudReady(true)
        }
      })
    return () => { active = false }
  }, [user?.id, config.domain])
  useEffect(() => {
    const sync = () => setConfig(getActiveConfig())
    window.addEventListener('storage', sync)
    window.addEventListener('adaptai:config-changed', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('adaptai:config-changed', sync)
    }
  }, [])
  const nav = workspaceNav(config)
  const changeDomain = (value: string) => {
    if (!isBusinessDomain(value)) return
    const activate = (savedConfig: BusinessConfig | null) => {
      const nextConfig = savedConfig ?? demoConfigs[value]
      saveConfig(nextConfig)
      setConfig(nextConfig)
      setConfigError('')
      navigate('/app/dashboard')
    }
    if (isCloudDataConfigured) {
      setCloudReady(false)
      dataService.loadConfiguration(value)
        .then(activate)
        .catch((error: unknown) => {
          setConfigError(error instanceof Error ? error.message : 'Could not load this workspace.')
          setCloudReady(true)
        })
      return
    }
    activate(null)
  }
  if (user && isCloudDataConfigured && !cloudReady) {
    return <div className="auth-loading" role="status">Loading your secure workspace…</div>
  }
  const toggleTheme = () => setDarkMode((current) => {
    const next = !current
    localStorage.setItem('adaptai.theme', next ? 'dark' : 'light')
    return next
  })
  return <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} data-theme={darkMode ? 'dark' : 'light'}><aside className={`app-sidebar ${menuOpen ? 'sidebar-open' : ''}`}><div className="app-logo"><Brand light /><button type="button" className="sidebar-collapse" onClick={() => setSidebarCollapsed((current) => { const next = !current; localStorage.setItem('adaptai.sidebar', next ? 'collapsed' : 'expanded'); return next })} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-pressed={sidebarCollapsed}><ChevronRight size={17} /></button><button className="sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={18} /></button></div><div className="sidebar-workspace"><span className="workspace-avatar">{config.title.slice(0, 1).toUpperCase()}</span><span><b>{config.title}</b><small>{config.industry} · {isCloudDataConfigured ? 'Cloud' : 'Demo'}</small></span><ChevronDown size={15} /></div><div className="sidebar-label">WORKSPACE</div><nav className="app-nav">{nav.map(({ label, path, icon: Icon }) => <NavLink to={path} key={label} aria-label={label} title={label} onClick={() => setMenuOpen(false)} className={({ isActive }) => `app-nav-link ${isActive ? 'app-nav-active' : ''}`}><Icon size={17} /><span>{label}</span>{label === 'Analytics' && <span className="nav-beta">{isCloudDataConfigured ? 'LIVE' : 'DEMO'}</span>}</NavLink>)}</nav><div className="sidebar-bottom"><div className="plan-card"><span className="plan-icon"><Sparkles size={15} /></span><b>{isCloudDataConfigured ? 'Cloud workspace' : 'Demo workspace'}</b><p>{isCloudDataConfigured ? 'Records are saved to your Supabase workspace.' : 'Your changes are saved locally in this browser.'}</p><Link to="/setup">Customize workspace <ArrowRight size={13} /></Link></div><button className="app-nav-link theme-toggle" onClick={toggleTheme} aria-pressed={darkMode} aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}>{darkMode ? <Sun size={17} /> : <Moon size={17} />}<span>{darkMode ? 'Light mode' : 'Dark mode'}</span></button><button className="app-nav-link" aria-label="Sign out" title="Sign out" onClick={signOut}><LogOut size={17} /><span>Sign out</span></button><div className="sidebar-user"><div className="user-avatar">{accountName.slice(0, 1).toUpperCase()}</div><div><b>{accountName}</b><small>{user?.email}</small></div></div></div></aside>{menuOpen && <button className="mobile-scrim" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}<main className="app-main"><header className="app-topbar"><button className="app-menu-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><b>{nav.find((item) => item.path === window.location.pathname)?.label ?? 'Overview'}</b></div><label className="workspace-switch"><BriefcaseBusiness size={15} /><select aria-label="Switch demo workspace" value={config.domain} onChange={(event) => changeDomain(event.target.value)}><option value="retail">Retail demo</option><option value="healthcare">Healthcare demo</option><option value="warehouse">Warehouse demo</option><option value="hospitality">Hospitality demo</option></select><ChevronDown size={13} /></label><div className="topbar-actions"><label className="top-search"><Search size={15} /><input aria-label="Search records; press Enter to view results" placeholder="Search records…" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && search) navigate(`/app/records?search=${encodeURIComponent(search)}`) }} /></label><span className="icon-button notification-button" role="img" aria-label="Demo notifications: no new alerts" title="Demo notifications: no new alerts"><Bell size={18} /><i /></span><div className="account-menu-wrap"><button className="top-avatar" onClick={() => setAccountOpen(!accountOpen)} aria-label="Account menu">{accountName.slice(0, 1).toUpperCase()}</button>{accountOpen && <div className="account-dropdown"><b>{accountName}</b><span>{user?.email}</span><button onClick={() => { setAccountOpen(false); navigate('/app/settings') }}><Settings size={15} /> Settings</button><button onClick={signOut}><LogOut size={15} /> Sign out</button></div>}</div></div></header><div className="app-content">{configError && <div className="form-message" role="alert">{configError}</div>}{children}</div><div className="app-footer"><span>{isCloudDataConfigured ? 'Cloud data · Saved to your workspace' : 'Demo data · Saved locally in this browser'}</span><span>AdaptAI workspace preview</span></div></main></div>
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="auth-loading" role="status">Restoring your secure session…</div>
  if (!authConfigured) return <div className="auth-loading"><p>Workspace access requires Supabase authentication. Configure the public Supabase URL and anon key to continue.</p><Link className="button button-primary" to="/login">Go to login</Link></div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

function PageTitle({ eyebrow = 'YOUR WORKSPACE', title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-title"><div><div className="eyebrow eyebrow-light">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function useWorkspaceRecords(config: BusinessConfig) {
  const [records, setRecords] = useState<Record<string, BusinessRecord[]>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const configKey = JSON.stringify(config)
  useEffect(() => {
    let active = true
    const currentConfig = JSON.parse(configKey) as BusinessConfig
    setLoading(true)
    setRecords({})
    setError('')
    Promise.all(currentConfig.entities.map(async (entity) => [
      entity.key,
      await dataService.listRecords(currentConfig, entity.key),
    ] as const))
      .then((entries) => {
        if (active) {
          setRecords(Object.fromEntries(entries))
          setLoading(false)
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : 'Could not load workspace records.')
          setLoading(false)
        }
      })
    return () => { active = false }
  }, [configKey])
  return { records, error, loading }
}

function getWeeklyCounts(records: BusinessRecord[], entity: ConfigEntity) {
  const dateField = entity.fields.find((field) => field.type === 'date')
  const dateKeys = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setUTCHours(0, 0, 0, 0)
    date.setUTCDate(date.getUTCDate() - (6 - index))
    return date.toISOString().slice(0, 10)
  })
  const counts = dateKeys.map((dateKey) => records.filter((record) =>
    typeof record[dateField?.key ?? ''] === 'string' && String(record[dateField?.key ?? '']).slice(0, 10) === dateKey,
  ).length)
  return dateKeys.map((date, index) => ({
    date,
    label: new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`)),
    count: counts[index],
  }))
}

function DashboardPage() {
  const config = getActiveConfig()
  const { records, error, loading } = useWorkspaceRecords(config)
  const products = records[primaryEntity(config).key] ?? []
  const values = config.dashboard.widgets.map((widget) => {
    const rows = records[widget.entity] ?? []
    const entity = getEntity(config, widget.entity)
    let value = widget.type === 'sum'
      ? rows.reduce((sum, row) => sum + Number(row[widget.field ?? ''] ?? 0), 0)
      : widget.type === 'low-stock'
        ? rows.filter((row) => Number(row.quantity) <= Number(row.reorderLevel)).length
        : rows.length
    if (widget.key === 'inventory-value') value = rows.reduce((sum, row) => sum + Number(row.price ?? 0) * Number(row.quantity ?? 0), 0)
    return { ...widget, value, entity }
  })
  const daily = records[config.domain === 'retail' ? 'sales' : config.domain === 'healthcare' ? 'appointments' : config.domain === 'hospitality' ? 'bookings' : 'dispatches'] ?? []
  const activityEntity = config.entities.find((entity) => ['sales', 'appointments', 'bookings', 'dispatches'].includes(entity.key)) ?? primaryEntity(config)
  const weeklyActivity = getWeeklyCounts(daily, activityEntity)
  const dateField = activityEntity.fields.find((field) => field.type === 'date')
  const amountField = activityEntity.fields.find((field) => field.key === 'amount')
  const weeklyValues = weeklyActivity.map((day) => {
    if (!amountField) return day.count
    return daily
      .filter((record) => String(record[dateField?.key ?? '']).slice(0, 10) === day.date)
      .reduce((sum, record) => sum + Number(record[amountField.key] ?? 0), 0)
  })
  const maximumActivity = Math.max(1, ...weeklyValues)
  const chartBars = isCloudDataConfigured ? weeklyValues.map((value) => value ? value / maximumActivity * 100 : 0) : [38, 57, 46, 70, 53, 82, 64]
  const chartAxisLabels = isCloudDataConfigured
    ? [maximumActivity, Math.ceil(maximumActivity * 0.75), Math.ceil(maximumActivity * 0.5), Math.ceil(maximumActivity * 0.25), 0]
    : [20, 40, 60, 80, 100]
  const activitySummary = config.domain === 'retail' && amountField
    ? money(weeklyValues.reduce((sum, value) => sum + value, 0))
    : `${weeklyValues.reduce((sum, value) => sum + value, 0)} ${config.domain === 'healthcare' ? 'visits' : 'activities'}`
  return <>{loading && <div className="data-loading" role="status">Loading your workspace overview…</div>}{!loading && !error && products.length === 0 && <div className="empty-state dashboard-empty"><span className="industry-icon"><Database /></span><h3>Your workspace is ready</h3><p>Import a spreadsheet or add your first {primaryEntity(config).singular.toLowerCase()} to see this overview update.</p><div><Link className="button button-primary" to="/app/import"><Upload size={15} /> Import data</Link><Link className="button button-secondary" to="/app/records"><Plus size={15} /> Add a record</Link></div></div>}<PageTitle eyebrow={`${config.industry.toUpperCase()} · ${isCloudDataConfigured ? 'CLOUD DATA' : 'DEMO DATA'}`} title="Workspace overview" description={`Here’s what’s happening in your ${config.title.toLowerCase()} today.`} action={<button className="button button-secondary" onClick={() => { const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${config.domain}-${isCloudDataConfigured ? 'workspace' : 'demo'}-data.json`; a.click(); URL.revokeObjectURL(url) }}><Download size={16} /> Export data</button>} />{error && <div className="form-message" role="alert">{error}</div>}<div className="sample-banner"><span><Sparkles size={16} /> {isCloudDataConfigured ? 'Your workspace data is connected' : 'You’re viewing sample data'}</span><span>{isCloudDataConfigured ? 'Metrics use records saved in your workspace.' : 'Records and metrics shown are examples and saved locally.'}</span><Link to="/app/settings">Manage preferences <ArrowRight size={14} /></Link></div><section className="kpi-grid">{values.map((item, i) => { const Icon = [Package, CreditCard, Boxes, Activity][i % 4]; return <article className="kpi-card" key={item.key}><div className="kpi-top"><span>{item.label}</span><span className={`kpi-icon kpi-icon-${i % 4}`}><Icon size={17} /></span></div><b>{item.key === 'sales' || item.key === 'inventory-value' ? money(item.value) : item.value.toLocaleString()}</b><small>{item.key === 'low-stock' ? 'Items to check' : `${item.entity?.label ?? 'Records'}`}</small><div className="kpi-foot"><span className={i === 2 ? 'trend-warn' : 'trend-up'}>{i === 2 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />} {i === 2 ? 'Attention' : isCloudDataConfigured ? 'Current total' : 'Sample metric'}</span><span>·</span><span>{isCloudDataConfigured ? 'Live' : 'Demo'}</span></div></article> })}</section><div className="dashboard-main-grid"><section className="app-card sales-card"><div className="app-card-heading"><div><h2>Activity overview</h2><p>{isCloudDataConfigured ? 'Based on saved workspace records' : 'Illustrative activity from your demo records'}</p></div><button className="select-button">Last 7 days <ChevronDown size={14} /></button></div><div className="chart-summary"><b>{isCloudDataConfigured ? activitySummary : config.domain === 'retail' ? money((records.sales ?? []).reduce((sum, row) => sum + Number(row.amount), 0)) : `${daily.length} ${config.domain === 'healthcare' ? 'visits' : 'activities'}`}</b><span><ArrowUpRight size={14} /> {isCloudDataConfigured ? 'Last 7 days' : 'Demo data'}</span></div><div className="dashboard-chart-grid">{chartAxisLabels.map((x, index) => <span key={`${x}-${index}`}>{isCloudDataConfigured ? amountField ? money(x) : x : config.domain === 'retail' ? `₹${x}k` : x * 2}</span>)}</div><div className="dashboard-chart">{chartBars.map((height, i) => <div className="dashboard-chart-column" key={i}><i style={{ height: `${height}%` }} /><span>{isCloudDataConfigured ? weeklyActivity[i].label : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span></div>)}</div></section><section className="app-card breakdown-card"><div className="app-card-heading"><div><h2>{primaryEntity(config).label} breakdown</h2><p>Across your {isCloudDataConfigured ? 'workspace' : 'demo workspace'}</p></div><button className="more-button" aria-label="More options"><Ellipsis /></button></div><div className="donut-wrap"><div className="donut-chart"><div><b>{products.length}</b><span>records</span></div></div></div><div className="legend-list">{Object.entries(products.reduce<Record<string, number>>((acc, row) => { const key = String(row.category ?? row.status ?? row.zone ?? 'Other'); acc[key] = (acc[key] ?? 0) + 1; return acc }, {})).slice(0, 4).map(([label, count], i) => <div key={label}><i className={`legend-color color-${i}`} /><span>{label}</span><b>{products.length ? Math.round(count / products.length * 100) : 0}%</b></div>)}</div></section></div><section className="app-card records-card"><div className="app-card-heading"><div><h2>Recent {primaryEntity(config).label.toLowerCase()}</h2><p>Latest entries in your {isCloudDataConfigured ? 'workspace' : 'demo workspace'}</p></div><Link to="/app/records" className="text-link">View all <ArrowRight size={15} /></Link></div><div className="table-scroll"><table className="data-table"><thead><tr>{primaryEntity(config).fields.slice(0, 4).map((field) => <th key={field.key}>{field.label}</th>)}<th>STATUS</th></tr></thead><tbody>{products.slice(0, 4).map((row, i) => <tr key={String(row.id)}>{primaryEntity(config).fields.slice(0, 4).map((field) => <td key={field.key}>{field.key === 'price' ? money(Number(row[field.key])) : field.key === 'quantity' ? Number(row[field.key]).toLocaleString() : String(row[field.key] ?? '—')}</td>)}<td><span className={`status-pill ${i === 1 ? 'status-warning' : 'status-active'}`}>{row.quantity !== undefined && Number(row.quantity) <= Number(row.reorderLevel) ? 'Low stock' : 'In stock'}</span></td></tr>)}</tbody></table></div><div className="table-foot"><span>Showing {Math.min(4, products.length)} of {products.length} records</span><Link to="/app/records">Manage records <ArrowRight size={14} /></Link></div></section></>
}

function RecordModal({ entity, record, onClose, onSave }: { entity: ConfigEntity; record?: BusinessRecord; onClose: () => void; onSave: (data: BusinessRecord) => void }) {
  const [values, setValues] = useState<BusinessRecord>(record ?? {})
  const [error, setError] = useState('')
  const save = (event: FormEvent) => {
    event.preventDefault()
    const missing = entity.fields.find((field) => field.required && (values[field.key] === undefined || values[field.key] === ''))
    if (missing) { setError(`${missing.label} is required.`); return }
    onSave(values)
  }
  return <div className="modal-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><form className="record-modal" onSubmit={save}><div className="modal-heading"><div><h2>{record ? `Edit ${entity.singular.toLowerCase()}` : `Add ${entity.singular.toLowerCase()}`}</h2><p>{isCloudDataConfigured ? 'Changes save to your Supabase workspace.' : 'Changes are saved in this browser’s demo workspace.'}</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog"><X /></button></div>{entity.fields.map((field) => <FieldControl key={field.key} field={field} value={values[field.key]} onChange={(value) => setValues({ ...values, [field.key]: value })} />)}{error && <div className="form-message">{error}</div>}<div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary">{record ? 'Save changes' : `Add ${entity.singular.toLowerCase()}`}</button></div></form></div>
}

function FieldControl({ field, value, onChange }: { field: ConfigField; value: unknown; onChange: (value: string | number | boolean) => void }) {
  return <label className="record-field">{field.label}{field.type === 'select' ? <select required={field.required} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)}><option value="">Select {field.label.toLowerCase()}</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select> : field.type === 'boolean' ? <span className="boolean-control"><input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} /> {value ? 'Enabled' : 'Disabled'}</span> : <input type={field.type} required={field.required} value={String(value ?? '')} onChange={(event) => onChange(field.type === 'number' ? Number(event.target.value) : event.target.value)} />}</label>
}

function RecordsPage({ requestedEntity }: { requestedEntity?: string }) {
  const config = getActiveConfig()
  const [params, setParams] = useSearchParams()
  const entity = getEntity(config, requestedEntity ?? params.get('entity') ?? undefined)
  const [items, setItems] = useState<BusinessRecord[]>([])
  const [query, setQuery] = useState(params.get('search') ?? '')
  const [status, setStatus] = useState('All statuses')
  const [modal, setModal] = useState<BusinessRecord | null | undefined>(undefined)
  const [error, setError] = useState('')
  const refresh = () => {
    setError('')
    dataService.listRecords(config, entity.key)
      .then(setItems)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not load records.'))
  }
  useEffect(() => { refresh() }, [config.domain, entity.key])
  const statuses = useMemo(() => ['All statuses', ...new Set(items.map((item) => String(item.status ?? '')).filter(Boolean))], [items])
  const visible = items.filter((record) => Object.values(record).some((value) => String(value).toLowerCase().includes(query.toLowerCase())) && (status === 'All statuses' || record.status === status))
  const save = (record: BusinessRecord) => {
    dataService.saveRecord(config, entity.key, modal?.id ? { ...modal, ...record } : record).then(() => { setModal(undefined); refresh() }).catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not save this record.'))
  }
  const remove = (id: string) => {
    if (!window.confirm('Delete this record? This cannot be undone.')) return
    dataService.removeRecord(config, entity.key, id).then(refresh).catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not delete this record.'))
  }
  return <><PageTitle eyebrow={`${config.industry.toUpperCase()} · RECORDS`} title={entity.label} description={entity.description} action={<button className="button button-primary" onClick={() => setModal(null)}><Plus size={16} /> Add {entity.singular}</button>} /><div className="sample-banner compact"><span><Database size={15} /> {isCloudDataConfigured || isApiConfigured ? 'Connected records' : 'Demo records'}</span><span>{isCloudDataConfigured ? 'Records are persisted in your Supabase workspace.' : isApiConfigured ? 'Loaded from the configured backend.' : 'Saved locally in this browser.'}</span></div><section className="app-card records-card"><div className="record-toolbar"><label className="record-search"><Search size={16} /><input placeholder={`Search ${entity.label.toLowerCase()}…`} value={query} onChange={(event) => setQuery(event.target.value)} /></label><label className="filter-select"><Filter size={15} /><select value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label><span className="record-count">{visible.length} records</span></div>{error && <div className="form-message">{error}</div>}{visible.length ? <div className="table-scroll"><table className="data-table"><thead><tr>{entity.fields.map((field) => <th key={field.key}>{field.label.toUpperCase()}</th>)}<th>ACTIONS</th></tr></thead><tbody>{visible.map((record) => <tr key={String(record.id)}>{entity.fields.map((field) => <td key={field.key}>{field.key === 'price' || field.key === 'amount' ? money(Number(record[field.key])) : field.type === 'boolean' ? <span className={`status-pill ${record[field.key] ? 'status-active' : 'status-neutral'}`}>{record[field.key] ? 'Yes' : 'No'}</span> : field.key === 'quantity' ? <div className="stock-cell">{Number(record[field.key])}<span className={`status-pill ${Number(record.quantity) <= Number(record.reorderLevel) ? 'status-warning' : 'status-active'}`}>{Number(record.quantity) <= Number(record.reorderLevel) ? 'Low stock' : 'In stock'}</span></div> : field.key === 'status' ? <span className={`status-pill ${record[field.key] === 'Pending' || record[field.key] === 'Processing' ? 'status-warning' : 'status-active'}`}>{String(record[field.key])}</span> : String(record[field.key] ?? '—')}</td>)}<td><div className="row-actions"><button onClick={() => setModal(record)} aria-label={`Edit ${entity.singular}`}><Settings size={15} /></button><button onClick={() => remove(String(record.id))} aria-label={`Delete ${entity.singular}`}><X size={15} /></button></div></td></tr>)}</tbody></table></div> : <div className="empty-state"><span className="industry-icon"><Search /></span><h3>{items.length ? 'No matching records' : `No ${entity.label.toLowerCase()} yet`}</h3><p>{items.length ? 'Try another search or status filter.' : `Add your first ${entity.singular.toLowerCase()} to get started.`}</p>{!items.length && <button className="button button-primary" onClick={() => setModal(null)}><Plus size={15} /> Add {entity.singular}</button>}</div>}<div className="table-foot"><span>Showing {visible.length} of {items.length} records</span><span>Page 1 of 1</span></div></section>{modal !== undefined && <RecordModal key={modal ? String(modal.id) : 'new'} entity={entity} record={modal ?? undefined} onClose={() => setModal(undefined)} onSave={save} />}</>
}

function importCellValue(field: ConfigField, raw: unknown): string | number | boolean | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined
  const text = String(raw).trim()
  if (!text) return undefined
  if (field.type === 'number') {
    const number = typeof raw === 'number' ? raw : Number(text.replace(/,/g, ''))
    if (!Number.isFinite(number)) throw new Error(`${field.label} must be a number.`)
    return number
  }
  if (field.type === 'boolean') {
    if (typeof raw === 'boolean') return raw
    if (['true', 'yes', '1', 'enabled'].includes(text.toLowerCase())) return true
    if (['false', 'no', '0', 'disabled'].includes(text.toLowerCase())) return false
    throw new Error(`${field.label} must be true/false, yes/no, or 1/0.`)
  }
  if (field.type === 'date') {
    const date = new Date(text)
    if (Number.isNaN(date.getTime())) throw new Error(`${field.label} must be a valid date.`)
    return date.toISOString().slice(0, 10)
  }
  if (field.type === 'select') {
    const option = field.options?.find((item) => item.toLowerCase() === text.toLowerCase())
    if (!option) throw new Error(`${field.label} must match one of: ${field.options?.join(', ') ?? 'the configured options'}.`)
    return option
  }
  return text
}

function importRecordKey(record: BusinessRecord, entity: ConfigEntity): string {
  return JSON.stringify(entity.fields.map((field) => [field.key, record[field.key] ?? null]))
}

function ImportPage() {
  const config = getActiveConfig()
  const [params] = useSearchParams()
  const [entityKey, setEntityKey] = useState(params.get('entity') ?? config.entities[0].key)
  const entity = getEntity(config, entityKey)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<SpreadsheetPreview | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmImport, setConfirmImport] = useState(false)
  const [result, setResult] = useState('')
  const importKey = useRef(crypto.randomUUID())
  const previewRequestId = useRef(0)
  const { records: existingRecords, error: recordsError, loading: recordsLoading } = useWorkspaceRecords(config)

  const chooseFile = (selected: File | undefined) => {
    if (!selected) return
    setFile(null)
    setPreview(null)
    setMapping({})
    setConfirmImport(false)
    setResult('')
    setError('')
    setBusy(false)
    previewRequestId.current += 1
    if (!/\.(csv|xlsx)$/i.test(selected.name)) {
      setError('Choose a .csv or .xlsx file. Legacy .xls files are not supported.')
      return
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError('Spreadsheet uploads are limited to 5 MB.')
      return
    }
    setFile(selected)
    setPreview(null)
    setMapping({})
    setError('')
    setResult('')
    setConfirmImport(false)
    importKey.current = crypto.randomUUID()
    void loadPreview(selected)
  }

  const loadPreview = async (selectedFile: File, worksheet?: string) => {
    const requestId = ++previewRequestId.current
    setBusy(true)
    setError('')
    try {
      const loaded = await previewSpreadsheet(selectedFile, worksheet)
      if (previewRequestId.current === requestId) setPreview(loaded)
    } catch (reason) {
      if (previewRequestId.current === requestId) {
        setPreview(null)
        setError(reason instanceof Error ? reason.message : 'Could not preview the spreadsheet.')
      }
    } finally {
      if (previewRequestId.current === requestId) setBusy(false)
    }
  }

  useEffect(() => {
    if (!preview) return
    const nextMapping: Record<string, string> = {}
    for (const header of preview.headers) {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '')
      const matchedField = entity.fields.find((field) =>
        [field.key, field.label].some((value) => value.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedHeader),
      )
      nextMapping[header] = matchedField?.key ?? ''
    }
    setMapping(nextMapping)
    setConfirmImport(false)
  }, [preview, entity.key])

  const analysis = useMemo(() => {
    if (!preview) return { valid: [] as { rowNumber: number; data: BusinessRecord }[], invalid: [] as { rowNumber: number; error: string }[] }
    const valid: { rowNumber: number; data: BusinessRecord }[] = []
    const invalid: { rowNumber: number; error: string }[] = []
    const seen = new Set<string>()
    const existing = new Set((existingRecords[entity.key] ?? []).map((record) => importRecordKey(record, entity)))
    preview.rows.forEach((source, index) => {
      const rowNumber = preview.rowNumbers[index]
      try {
        const candidate: BusinessRecord = {}
        for (const header of preview.headers) {
          const targetKey = mapping[header]
          if (!targetKey) continue
          const field = entity.fields.find((item) => item.key === targetKey)
          if (!field) throw new Error(`The selected mapping for “${header}” is no longer available.`)
          const value = importCellValue(field, source[header])
          if (value !== undefined) candidate[targetKey] = value
        }
        const normalized = validateBusinessRecord(config, entity.key, candidate)
        const key = importRecordKey(normalized, entity)
        if (seen.has(key)) throw new Error('Duplicate row in this spreadsheet.')
        if (existing.has(key)) throw new Error('This record already exists in the workspace.')
        seen.add(key)
        valid.push({ rowNumber, data: normalized })
      } catch (reason) {
        invalid.push({ rowNumber, error: reason instanceof Error ? reason.message : 'This row is invalid.' })
      }
    })
    return { valid, invalid }
  }, [config, entity, existingRecords, mapping, preview])

  const importData = async () => {
    if (!confirmImport || !preview || !analysis.valid.length || recordsLoading || recordsError) return
    setBusy(true)
    setError('')
    setResult('')
    try {
      const imported = await dataService.importRecords(
        config,
        entity.key,
        analysis.valid,
        analysis.invalid,
        importKey.current,
        preview.filename,
      )
      setResult(imported.alreadyImported
        ? `This upload was already imported: ${imported.imported} records saved, ${imported.skipped} rows skipped.`
        : `Import complete: ${imported.imported} records saved, ${imported.skipped} rows skipped.`)
      setConfirmImport(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not import these records.')
    } finally {
      setBusy(false)
    }
  }

  const worksheetChanged = (worksheet: string) => {
    if (file) void loadPreview(file, worksheet)
  }

  return <><PageTitle eyebrow={`${config.industry.toUpperCase()} · DATA IMPORT`} title="Import spreadsheet" description={`Upload a CSV or Excel workbook and map its columns into ${entity.label.toLowerCase()}.`} /><div className="sample-banner compact"><span><ShieldCheck size={15} /> Private, reviewed import</span><span>Uploaded file is parsed by the AdaptAI API; no spreadsheet contents are sent to AI.</span></div>{recordsError && <div className="form-message" role="alert">{recordsError}</div>}{error && <div className="form-message" role="alert">{error}</div>}{result && <div className="success-message" role="status">{result}<Link to="/app/dashboard"> View updated dashboard</Link></div>}<section className="app-card import-card"><div className="import-options"><label className="record-field">Import into<select value={entity.key} onChange={(event) => { setEntityKey(event.target.value); setConfirmImport(false) }}>{config.entities.map((item) => <option value={item.key} key={item.key}>{item.label}</option>)}</select></label><label className="record-field import-file-field">Spreadsheet file<input aria-label="Choose a CSV or XLSX spreadsheet" type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => chooseFile(event.target.files?.[0])} /><small>CSV or Excel (.xlsx) · up to 5 MB</small></label></div>{recordsLoading && <div role="status">Checking existing workspace records for duplicates…</div>}{busy && <div className="import-loading" role="status">Reading or importing spreadsheet…</div>}{preview && <><div className="import-meta"><FileSpreadsheet size={18} /><span><b>{preview.filename}</b><small>{preview.rows.length} rows · {preview.headers.length} columns · {preview.worksheetNames.length} worksheet(s)</small></span></div>{preview.worksheetNames.length > 1 && <label className="record-field">Worksheet<select disabled={busy} value={preview.selectedWorksheet} onChange={(event) => worksheetChanged(event.target.value)}>{preview.worksheetNames.map((name) => <option value={name} key={name}>{name}</option>)}</select></label>}<div className="import-step"><h2>1. Map spreadsheet columns</h2><p>Each destination field may be mapped from one column. Leave irrelevant columns as “Do not import”.</p><div className="import-mapping">{preview.headers.map((header) => <label key={header}>{header}<select value={mapping[header] ?? ''} onChange={(event) => { setMapping({ ...mapping, [header]: event.target.value }); setConfirmImport(false) }}><option value="">Do not import</option>{entity.fields.map((field) => <option key={field.key} value={field.key} disabled={Object.entries(mapping).some(([source, target]) => source !== header && target === field.key)}>{field.label}{field.required ? ' · required' : ''}</option>)}</select></label>)}</div></div><div className="import-step"><h2>2. Review validation</h2><div className="import-counts" role="status" aria-live="polite"><span><b>{analysis.valid.length}</b> ready to import</span><span><b>{analysis.invalid.length}</b> rows with errors or duplicates</span></div>{analysis.invalid.length > 0 && <div className="table-scroll"><table className="data-table"><thead><tr><th>ROW</th><th>ISSUE</th></tr></thead><tbody>{analysis.invalid.slice(0, 12).map((item) => <tr key={item.rowNumber}><td>{item.rowNumber}</td><td>{item.error}</td></tr>)}</tbody></table>{analysis.invalid.length > 12 && <p>Showing 12 of {analysis.invalid.length} invalid rows.</p>}</div>}<div className="table-scroll"><table className="data-table"><thead><tr>{entity.fields.filter((field) => Object.values(mapping).includes(field.key)).map((field) => <th key={field.key}>{field.label}</th>)}</tr></thead><tbody>{analysis.valid.slice(0, 5).map((item) => <tr key={item.rowNumber}>{entity.fields.filter((field) => Object.values(mapping).includes(field.key)).map((field) => <td key={field.key}>{String(item.data[field.key] ?? '—')}</td>)}</tr>)}</tbody></table><p>Showing up to 5 valid rows.</p></div></div><label className="import-confirm"><input type="checkbox" checked={confirmImport} onChange={(event) => setConfirmImport(event.target.checked)} disabled={!analysis.valid.length || busy || recordsLoading || Boolean(recordsError)} /> I reviewed the mappings and confirm saving {analysis.valid.length} valid records to this workspace.</label><button className="button button-primary" disabled={!confirmImport || !analysis.valid.length || busy || recordsLoading || Boolean(recordsError)} onClick={importData}><Upload size={16} /> {busy ? 'Importing…' : `Import ${analysis.valid.length} records`}</button></>}{!preview && !busy && <div className="empty-state"><span className="industry-icon"><FileSpreadsheet /></span><h3>Choose a spreadsheet to preview</h3><p>Supported: UTF-8 CSV or .xlsx, up to 5 MB, 500 rows and 50 columns.</p></div>}</section></>
}

function ActivityPage() {
  const config = getActiveConfig()
  const { records, error } = useWorkspaceRecords(config)
  const entity = config.entities.find((item) => ['sales', 'appointments', 'dispatches', 'bookings'].includes(item.key)) ?? config.entities[0]
  const rows = records[entity.key] ?? []
  const amountField = entity.fields.find((field) => ['amount', 'items'].includes(field.key))
  return <><PageTitle eyebrow={`${config.industry.toUpperCase()} · ACTIVITY`} title={entity.label} description={entity.description} />{error && <div className="form-message" role="alert">{error}</div>}<div className="sample-banner compact"><span><Activity size={15} /> Activity overview</span><span>{isCloudDataConfigured ? 'Based on persisted workspace records.' : 'Sample activity · illustrative demo data.'}</span></div><div className="kpi-grid activity-kpis"><article className="kpi-card"><div className="kpi-top"><span>Total {entity.label.toLowerCase()}</span><span className="kpi-icon kpi-icon-0"><Activity size={17} /></span></div><b>{rows.length}</b><small>{isCloudDataConfigured ? 'Current records' : 'Sample records'}</small></article><article className="kpi-card"><div className="kpi-top"><span>In progress</span><span className="kpi-icon kpi-icon-1"><Clock3 size={17} /></span></div><b>{rows.filter((row) => ['Processing', 'Scheduled', 'Preparing', 'In transit'].includes(String(row.status))).length}</b><small>Based on current records</small></article><article className="kpi-card"><div className="kpi-top"><span>{amountField?.label ?? 'Completed'}</span><span className="kpi-icon kpi-icon-2"><CreditCard size={17} /></span></div><b>{amountField ? money(rows.reduce((total, row) => total + Number(row[amountField.key] ?? 0), 0)) : rows.filter((row) => ['Completed', 'Delivered'].includes(String(row.status))).length}</b><small>{isCloudDataConfigured ? 'Persisted data' : 'Demo data only'}</small></article></div><section className="app-card records-card"><div className="app-card-heading"><div><h2>Recent {entity.label.toLowerCase()}</h2><p>Current activity in your {isCloudDataConfigured ? 'workspace' : 'sample workspace'}</p></div></div><div className="table-scroll"><table className="data-table"><thead><tr>{entity.fields.map((field) => <th key={field.key}>{field.label}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={String(row.id)}>{entity.fields.map((field) => <td key={field.key}>{field.key === 'amount' ? money(Number(row[field.key])) : field.key === 'status' ? <span className="status-pill status-active">{String(row[field.key])}</span> : String(row[field.key] ?? '—')}</td>)}</tr>)}</tbody></table></div><div className="table-foot"><Link to="/app/records">Manage records <ArrowRight size={14} /></Link></div></section></>
}

function AnalyticsPage() {
  const config = getActiveConfig()
  const { records, error } = useWorkspaceRecords(config)
  const first = primaryEntity(config)
  const list = records[first.key] ?? []
  const second = config.entities[1]
  const secondRecords = records[second?.key ?? ''] ?? []
  const analyticsEntity = config.entities.find((entity) => entity.fields.some((field) => field.type === 'date')) ?? first
  const analyticsWeek = getWeeklyCounts(records[analyticsEntity.key] ?? [], analyticsEntity)
  const maxAnalyticsCount = Math.max(1, ...analyticsWeek.map((day) => day.count))
  const analyticsBars = isCloudDataConfigured
    ? analyticsWeek.map((day) => day.count ? day.count / maxAnalyticsCount * 100 : 0)
    : [32, 62, 48, 76, 57, 89, 70]
  const exportCsv = () => {
    const fields = first.fields
    const csv = [fields.map((field) => field.label).join(','), ...list.map((record) => fields.map((field) => `"${String(record[field.key] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a'); a.href = url; a.download = `${first.key}-demo-report.csv`; a.click(); URL.revokeObjectURL(url)
  }
  return <><PageTitle eyebrow={`${config.industry.toUpperCase()} · ANALYTICS`} title="Analytics & reports" description={`A snapshot based on records in your ${isCloudDataConfigured ? 'workspace' : 'demo workspace'}.`} action={<button className="button button-secondary" onClick={exportCsv}><Download size={16} /> Download CSV</button>} />{error && <div className="form-message" role="alert">{error}</div>}<div className="sample-banner compact"><span><Activity size={15} /> {isCloudDataConfigured ? 'Workspace data analysis' : 'Sample data analysis'}</span><span>{isCloudDataConfigured ? 'Summaries use persisted workspace records.' : 'Summaries use locally saved demo records.'}</span></div><div className="kpi-grid"><article className="kpi-card"><div className="kpi-top"><span>{first.label}</span><span className="kpi-icon kpi-icon-0"><Database size={17} /></span></div><b>{list.length}</b><small>Current records</small></article><article className="kpi-card"><div className="kpi-top"><span>{second?.label ?? 'Related records'}</span><span className="kpi-icon kpi-icon-1"><Activity size={17} /></span></div><b>{secondRecords.length}</b><small>Current records</small></article><article className="kpi-card"><div className="kpi-top"><span>{first.label} with status</span><span className="kpi-icon kpi-icon-2"><Check size={17} /></span></div><b>{list.filter((row) => row.status).length}</b><small>Based on current records</small></article><article className="kpi-card"><div className="kpi-top"><span>Low stock</span><span className="kpi-icon kpi-icon-3"><Boxes size={17} /></span></div><b>{list.filter((row) => row.quantity !== undefined && Number(row.quantity) <= Number(row.reorderLevel)).length}</b><small>Quantity at or below reorder level</small></article></div><div className="dashboard-main-grid"><section className="app-card sales-card"><div className="app-card-heading"><div><h2>Record overview</h2><p>{isCloudDataConfigured ? `Records by date in ${analyticsEntity.label.toLowerCase()}` : 'Illustrative weekly activity'}</p></div><span className="data-chip">{isCloudDataConfigured ? 'LIVE' : 'SAMPLE'}</span></div><div className="dashboard-chart analytics-bars">{analyticsBars.map((height, i) => <div className="dashboard-chart-column" key={i}><i style={{ height: `${height}%` }} /><span>{isCloudDataConfigured ? analyticsWeek[i].label : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span></div>)}</div></section><section className="app-card breakdown-card"><div className="app-card-heading"><div><h2>By {first.fields.find((field) => field.key === 'category')?.label ?? 'status'}</h2><p>Current {isCloudDataConfigured ? 'workspace' : 'demo'} records</p></div></div><div className="legend-list analytics-legend">{Object.entries(list.reduce<Record<string, number>>((acc, row) => { const key = String(row.category ?? row.status ?? 'Uncategorized'); acc[key] = (acc[key] ?? 0) + 1; return acc }, {})).map(([label, count], i) => <div key={label}><i className={`legend-color color-${i % 4}`} /><span>{label}</span><b>{count}</b></div>)}</div></section></div></>
}

function ContactsPage() {
  const config = getActiveConfig()
  const entity = getEntity(config, config.entities[config.domain === 'retail' ? 2 : 2]?.key)
  return <RecordsPage requestedEntity={entity.key} />
}

function SettingsPage() {
  const [config, setConfig] = useState(getActiveConfig)
  const [name, setName] = useState(config.title)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const sync = () => { const current = getActiveConfig(); setConfig(current); setName(current.title) }
    window.addEventListener('adaptai:config-changed', sync)
    return () => window.removeEventListener('adaptai:config-changed', sync)
  }, [])
  const save = async () => {
    if (!name.trim()) { setMessage('Workspace name cannot be empty.'); return }
    const updated = { ...config, title: name.trim() }
    setBusy(true)
    setMessage('')
    try {
      await dataService.saveConfiguration(updated)
      saveConfig(updated)
      setConfig(updated)
      setMessage(isCloudDataConfigured ? 'Workspace configuration saved to Supabase.' : 'Workspace name saved locally in this browser.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save the workspace configuration.')
    } finally {
      setBusy(false)
    }
  }
  return <><PageTitle eyebrow="WORKSPACE PREFERENCES" title="Settings" description="Manage your account and workspace preferences." /><div className="settings-layout"><AccountSettingsCard /><section className="app-card settings-card"><div className="settings-heading"><span className="industry-icon"><BriefcaseBusiness /></span><div><h2>Workspace details</h2><p>{isCloudDataConfigured ? 'Configuration changes are stored in your Supabase workspace.' : 'Changes are local to this browser.'}</p></div></div><label className="record-field">Workspace name<input value={name} onChange={(event) => setName(event.target.value)} /></label><div className="readonly-setting"><span>Industry</span><b>{config.industry}</b></div><div className="readonly-setting"><span>Active configuration</span><b>{config.domain} · version {config.version}</b></div><button className="button button-primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save workspace details'}</button>{message && <div className={message.startsWith('Workspace configuration saved') || message.startsWith('Workspace name saved') ? 'success-message' : 'form-message'} role="status">{message}</div>}</section><section className="app-card settings-card"><div className="settings-heading"><span className="industry-icon"><ShieldCheck /></span><div><h2>Data & privacy</h2><p>Know where your data lives.</p></div></div><div className="privacy-item"><b>Sample records</b><p>Built-in healthcare examples are synthetic and do not contain real patient data.</p></div><div className="privacy-item"><b>{isCloudDataConfigured ? 'Cloud workspace data' : 'Local demo storage'}</b><p>{isCloudDataConfigured ? 'Configurations and records are stored in the Supabase workspace with row-level access policies.' : 'Demo configuration and record changes stay in this browser and are not cloud-synced.'}</p></div><div className="privacy-item"><b>Account security</b><p>Sign-in and email verification use Supabase Auth. Workspace data access is controlled by Supabase RLS policies.</p></div>{!isCloudDataConfigured && <button className="button button-secondary" onClick={() => { if (!window.confirm('Clear AdaptAI demo data from this browser?')) return; try { Object.keys(localStorage).filter((key) => key.startsWith('adaptai.demo.')).forEach((key) => localStorage.removeItem(key)); window.dispatchEvent(new Event('adaptai:config-changed')); setConfig(getActiveConfig()); setName(getActiveConfig().title); setMessage('Demo data cleared from this browser.') } catch { setMessage('Could not clear demo data from browser storage.') } }}>Clear demo data</button>}</section></div></>
}

function AccountSettingsCard() {
  const { user } = useAuth()
  const [name, setName] = useState(String(user?.user_metadata?.full_name ?? ''))
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => setName(String(user?.user_metadata?.full_name ?? '')), [user])
  const save = async () => {
    if (!supabase || !user) return
    const fullName = name.trim()
    if (!fullName) { setMessage('Name is required.'); return }
    setBusy(true); setMessage('')
    try {
      const { error: authError } = await supabase.auth.updateUser({ data: { full_name: fullName } })
      if (authError) throw authError
      const { error: profileError } = await supabase.from('profiles').update({ full_name: fullName, updated_at: new Date().toISOString() }).eq('id', user.id)
      if (profileError) throw profileError
      setMessage('Profile updated.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not update profile.') }
    finally { setBusy(false) }
  }
  return <section className="app-card settings-card"><div className="settings-heading"><span className="industry-icon"><Users /></span><div><h2>Account</h2><p>Your verified sign-in account.</p></div></div><div className="readonly-setting"><span>Email</span><b>{user?.email}</b></div><label className="record-field">Full name<input value={name} onChange={(event) => setName(event.target.value)} /></label><button className="button button-primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save profile'}</button>{message && <div className={message === 'Profile updated.' ? 'success-message' : 'form-message'} role="status">{message}</div>}</section>
}

function NotFound() { return <div className="not-found"><span className="industry-icon"><CircleHelp /></span><h1>That page isn’t here.</h1><p>The link may have moved, or the page may not exist.</p><Link className="button button-primary" to="/">Go to AdaptAI home</Link></div> }

export default function App() {
  return <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/features" element={<FeaturesPage />} />
    <Route path="/how-it-works" element={<HowPage />} />
    <Route path="/industries" element={<IndustriesPage />} />
    <Route path="/pricing" element={<PricingPage />} />
    <Route path="/login" element={<AuthPage />} />
    <Route path="/register" element={<AuthPage register />} />
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/setup" element={<SetupPage />} />
    <Route path="/app" element={<ProtectedRoute><AppShell><DashboardPage /></AppShell></ProtectedRoute>} />
    <Route path="/app/dashboard" element={<ProtectedRoute><AppShell><DashboardPage /></AppShell></ProtectedRoute>} />
    <Route path="/app/records" element={<ProtectedRoute><AppShell><RecordsPage /></AppShell></ProtectedRoute>} />
    <Route path="/app/import" element={<ProtectedRoute><AppShell><ImportPage /></AppShell></ProtectedRoute>} />
    <Route path="/app/activity" element={<ProtectedRoute><AppShell><ActivityPage /></AppShell></ProtectedRoute>} />
    <Route path="/app/inventory" element={<ProtectedRoute><AppShell><RecordsPage requestedEntity={getActiveConfig().domain === 'warehouse' ? 'stock' : 'products'} /></AppShell></ProtectedRoute>} />
    <Route path="/app/contacts" element={<ProtectedRoute><AppShell><ContactsPage /></AppShell></ProtectedRoute>} />
    <Route path="/app/analytics" element={<ProtectedRoute><AppShell><AnalyticsPage /></AppShell></ProtectedRoute>} />
    <Route path="/app/settings" element={<ProtectedRoute><AppShell><SettingsPage /></AppShell></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
}
