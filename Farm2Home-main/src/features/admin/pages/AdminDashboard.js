// AdminDashboard.js — Gemini Profit Guard + Reverse Marketplace Monitor
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../../firebase'
import {
  collection, onSnapshot, query, orderBy, where,
  doc, updateDoc, serverTimestamp
} from 'firebase/firestore'
import { useAuth } from '../../../context/AuthContext'
import './AdminDashboard.css'

import {
  FaLeaf, FaShoppingCart, FaHandshake, FaExclamationTriangle,
  FaRupeeSign, FaUsers, FaChartBar, FaBullseye, FaRobot,
  FaCheckCircle, FaClock, FaFire, FaTag, FaMapMarkerAlt,
  FaSignOutAlt, FaSync, FaShieldAlt, FaBell, FaFlag, FaBan
} from 'react-icons/fa'

/* ─────────────────── Gemini helper ─────────────────── */
const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

async function callGemini(apiKey, prompt) {
  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 800 },
    }),
  })
  if (!res.ok) throw new Error(`Gemini error ${res.status}`)
  const json = await res.json()
  return json?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

/* ─────────────────── Status helpers ────────────────── */
function daysSince(ts) {
  if (!ts) return 0
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
}

function timeAgo(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const sec = Math.floor((Date.now() - d.getTime()) / 1000)
  if (sec < 60)  return 'just now'
  if (sec < 3600) return `${Math.floor(sec/60)}m ago`
  if (sec < 86400) return `${Math.floor(sec/3600)}h ago`
  return `${Math.floor(sec/86400)}d ago`
}

const STATUS_CHIP = {
  open:        { label: 'Open',          bg: '#eff6ff', color: '#1d4ed8' },
  quoted:      { label: 'Offer Sent',    bg: '#fef3c7', color: '#b45309' },
  deal_closed: { label: 'Deal Closed',   bg: '#d1fae5', color: '#065f46' },
  fulfilled:   { label: 'Fulfilled',     bg: '#f0fdf4', color: '#14532d' },
}

/* ═══════════════════ COMPONENT ═══════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate()
  const { currentUser, userData, logout } = useAuth()

  // Guard — only admins
  useEffect(() => {
    if (userData && userData.role !== 'admin') navigate('/', { replace: true })
  }, [userData, navigate])

  /* live data */
  const [demands,        setDemands]        = useState([])
  const [crops,          setCrops]          = useState([])
  const [complaints,     setComplaints]     = useState([])
  const [activeTab,      setActiveTab]      = useState('overview')

  /* Gemini */
  const [apiKey,         setApiKey]         = useState(
    () => localStorage.getItem('gemini_admin_key') || ''
  )
  const [apiKeyInput,    setApiKeyInput]    = useState('')
  const [showKeyInput,   setShowKeyInput]   = useState(false)
  const [geminiResults,  setGeminiResults]  = useState({}) // demandId → display text
  const [analyzingId,    setAnalyzingId]    = useState(null)
  const [bulkAnalyzing,  setBulkAnalyzing]  = useState(false)
  const [wastageAlerts,  setWastageAlerts]  = useState([]) // { crop, suggestion }
  const [complaintSummaries, setComplaintSummaries] = useState({}) // reportedId → text
  const [summarizingId,  setSummarizingId]  = useState(null)
  const autoAnalysed = useRef(new Set()) // track IDs already auto-analysed this session

  /* ── Firestore listeners ── */
  useEffect(() => {
    const q = query(collection(db, 'market_demands'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap =>
      setDemands(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [])

  useEffect(() => {
    const q = query(
      collection(db, 'crops'),
      where('status', '==', 'available'),
      orderBy('createdAt', 'asc')
    )
    return onSnapshot(q, snap =>
      setCrops(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [])

  /* ── Derived stats ── */
  const openCount      = demands.filter(d => d.status === 'open').length
  const quotedCount    = demands.filter(d => d.status === 'quoted').length
  const closedCount    = demands.filter(d => d.status === 'deal_closed').length
  const fulfilledCount = demands.filter(d => d.status === 'fulfilled').length
  const staleCrops     = crops.filter(c => daysSince(c.createdAt) >= 3)
  const needsAnalysis  = demands.filter(d => !d.suggestedPriceMin && d.status === 'open')

  /* ── Auto-analyse new open demands (saves to Firestore so farmers see it) ── */
  useEffect(() => {
    if (!apiKey || needsAnalysis.length === 0) return
    const queue = needsAnalysis.filter(d => !autoAnalysed.current.has(d.id))
    if (queue.length === 0) return

    const runOne = async (demand) => {
      autoAnalysed.current.add(demand.id)
      try {
        const prompt = `You are an agricultural market expert for India.
Crop: ${demand.cropName}
Quantity needed: ${demand.quantityKg} kg
Location: ${demand.location}

Respond ONLY with this exact JSON format (no extra text):
{
  "minPrice": <number>,
  "maxPrice": <number>,
  "note": "<one sentence explaining the price range based on current Indian market>"
}`
        const raw = await callGemini(apiKey, prompt)
        // Parse JSON from response
        const jsonMatch = raw.match(/\{[\s\S]*\}/)
        if (!jsonMatch) return
        const parsed = JSON.parse(jsonMatch[0])
        const min = Number(parsed.minPrice)
        const max = Number(parsed.maxPrice)
        if (!min || !max) return

        // Save to Firestore so everyone (farmers, consumers) can see it
        await updateDoc(doc(db, 'market_demands', demand.id), {
          suggestedPriceMin:  min,
          suggestedPriceMax:  max,
          suggestedPriceNote: parsed.note || '',
          priceAnalysedAt:    serverTimestamp(),
        })
        setGeminiResults(prev => ({
          ...prev,
          [demand.id]: `₹${min} – ₹${max}/kg — ${parsed.note}`,
        }))
      } catch { /* silent fail — will retry when admin revisits */ }
    }

    // Stagger calls to avoid rate limits
    queue.forEach((d, i) => setTimeout(() => runOne(d), i * 1200))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, demands])

  function saveKey() {
    if (!apiKeyInput.trim()) return
    localStorage.setItem('gemini_admin_key', apiKeyInput.trim())
    setApiKey(apiKeyInput.trim())
    setApiKeyInput('')
    setShowKeyInput(false)
  }

  /* ── Analyse single demand (manual re-check) ── */
  const analyseDemand = useCallback(async (demand) => {
    if (!apiKey) { setShowKeyInput(true); return }
    setAnalyzingId(demand.id)
    try {
      const prompt = `You are an agricultural market expert for India.
Crop: ${demand.cropName}
Quantity needed: ${demand.quantityKg} kg
Location: ${demand.location}

Respond ONLY with this exact JSON format (no extra text):
{
  "minPrice": <number>,
  "maxPrice": <number>,
  "note": "<one sentence explaining the price range based on current Indian market>"
}`
      const raw = await callGemini(apiKey, prompt)
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null
      const min = parsed ? Number(parsed.minPrice) : null
      const max = parsed ? Number(parsed.maxPrice) : null

      if (min && max) {
        await updateDoc(doc(db, 'market_demands', demand.id), {
          suggestedPriceMin:  min,
          suggestedPriceMax:  max,
          suggestedPriceNote: parsed.note || '',
          priceAnalysedAt:    serverTimestamp(),
        })
        setGeminiResults(prev => ({ ...prev, [demand.id]: `₹${min} – ₹${max}/kg — ${parsed.note}` }))
      } else {
        setGeminiResults(prev => ({ ...prev, [demand.id]: raw }))
      }
    } catch (e) {
      setGeminiResults(prev => ({ ...prev, [demand.id]: `Error: ${e.message}` }))
    }
    setAnalyzingId(null)
  }, [apiKey])

  /* ── Bulk wastage flash-discount analysis ── */
  const analyseWastage = useCallback(async () => {
    if (!apiKey) { setShowKeyInput(true); return }
    if (staleCrops.length === 0) return
    setBulkAnalyzing(true)
    setWastageAlerts([])
    const results = []
    for (const crop of staleCrops.slice(0, 8)) {
      try {
        const age = daysSince(crop.createdAt)
        const prompt = `
A farmer listed "${crop.name}" at ₹${crop.pricePerKg}/kg ${age} days ago and it's still unsold.
In 60 words max:
1. Suggest a flash-discount % to clear stock fast and avoid total loss.
2. Give one sentence of urgency advice.
Keep it practical for Indian rural farmers.`
        const text = await callGemini(apiKey, prompt)
        results.push({ crop, suggestion: text })
      } catch {
        results.push({ crop, suggestion: 'Unable to analyse at this time.' })
      }
    }
    setWastageAlerts(results)
    setBulkAnalyzing(false)
  }, [apiKey, staleCrops])

  /* ── Mark demand fulfilled from admin ── */
  async function adminFulfil(demandId) {
    await updateDoc(doc(db, 'market_demands', demandId), {
      status: 'fulfilled',
      fulfilledAt: serverTimestamp(),
    })
  }

  /* ── Complaints listener ── */
  useEffect(() => {
    const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap =>
      setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [])

  /* ── Group complaints by reported user ── */
  const complaintGroups = complaints.reduce((acc, c) => {
    const key = c.reportedId
    if (!acc[key]) acc[key] = { reportedId: key, reportedName: c.reportedName, reportedRole: c.reportedRole, items: [] }
    acc[key].items.push(c)
    return acc
  }, {})
  const groupedComplaints = Object.values(complaintGroups).sort((a, b) => b.items.length - a.items.length)
  const highRiskCount = groupedComplaints.filter(g => g.items.length >= 3).length

  /* ── Gemini: summarise complaints for one user ── */
  const summarizeComplaints = useCallback(async (group) => {
    if (!apiKey) { setShowKeyInput(true); return }
    setSummarizingId(group.reportedId)
    try {
      const lines = group.items.map((c, i) =>
        `${i + 1}. Reason: ${c.reasonLabel}. Details: ${c.description || 'No extra details.'}`
      ).join('\n')
      const prompt = `You are an agricultural platform trust-and-safety AI.
User: ${group.reportedName} (${group.reportedRole})
Total complaints: ${group.items.length}

Complaints:
${lines}

In 3-4 sentences:
1. Summarise the pattern of complaints.
2. Risk level: Low / Medium / High.
3. Recommended action for the Admin (e.g. warning, temporary suspension, permanent ban).`
      const text = await callGemini(apiKey, prompt)
      setComplaintSummaries(prev => ({ ...prev, [group.reportedId]: text }))
    } catch (e) {
      setComplaintSummaries(prev => ({ ...prev, [group.reportedId]: `Error: ${e.message}` }))
    }
    setSummarizingId(null)
  }, [apiKey])

  /* ════════════════════ RENDER ═════════════════════ */
  const tabs = [
    { key: 'overview',    icon: <FaChartBar />,            label: 'Overview'                    },
    { key: 'demands',     icon: <FaBullseye />,            label: 'Demands',   badge: openCount  },
    { key: 'wastage',     icon: <FaExclamationTriangle />, label: 'Wastage Guard', badge: staleCrops.length },
    { key: 'gemini',      icon: <FaRobot />,              label: 'Profit Guard'                 },
    { key: 'complaints',  icon: <FaFlag />,               label: 'Complaints', badge: highRiskCount },
  ]

  return (
    <div className="adm-root">
      {/* ─ Sidebar ─ */}
      <aside className="adm-sidebar">
        <div className="adm-brand">
          <FaShieldAlt className="adm-brand-icon" />
          <div>
            <div className="adm-brand-title">Admin Portal</div>
            <div className="adm-brand-sub">Profit Guard</div>
          </div>
        </div>

        <nav className="adm-nav">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`adm-nav-btn ${activeTab === t.key ? 'adm-nav-btn--active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              <span className="adm-nav-icon">{t.icon}</span>
              <span>{t.label}</span>
              {t.badge > 0 && <span className="adm-nav-badge">{t.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <div className="adm-admin-info">
            <div className="adm-admin-avatar">
              {(userData?.displayName || userData?.email || 'A')[0].toUpperCase()}
            </div>
            <div>
              <div className="adm-admin-name">{userData?.displayName || 'Admin'}</div>
              <div className="adm-admin-email">{userData?.email}</div>
            </div>
          </div>
          <button className="adm-logout-btn" onClick={logout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      {/* ─ Main ─ */}
      <main className="adm-main">
        {/* API Key banner */}
        {!apiKey && (
          <div className="adm-key-banner">
            <FaRobot style={{ marginRight: 8 }} />
            Gemini API key not set — AI analysis is disabled.
            <button className="adm-key-btn" onClick={() => setShowKeyInput(v => !v)}>
              Set Key
            </button>
          </div>
        )}
        {showKeyInput && (
          <div className="adm-key-form">
            <input
              type="password"
              placeholder="Paste Gemini API key…"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              className="adm-key-input"
            />
            <button className="adm-key-save" onClick={saveKey}>Save</button>
            {apiKey && (
              <button
                className="adm-key-clear"
                onClick={() => {
                  localStorage.removeItem('gemini_admin_key')
                  setApiKey('')
                  setShowKeyInput(false)
                }}
              >
                Clear Key
              </button>
            )}
          </div>
        )}
        {apiKey && !showKeyInput && (
          <div className="adm-key-ok">
            <FaCheckCircle style={{ marginRight: 6, color: '#16a34a' }} />
            Gemini AI active
            <button
              className="adm-key-change"
              onClick={() => { setApiKeyInput(''); setShowKeyInput(true) }}
            >
              Change Key
            </button>
          </div>
        )}

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="adm-content">
            <h1 className="adm-page-title">Dashboard Overview</h1>

            <div className="adm-stat-grid">
              {[
                { label: 'Open Demands',      value: openCount,      color: '#1d4ed8', bg: '#eff6ff', icon: <FaBullseye /> },
                { label: 'Offers Sent',        value: quotedCount,    color: '#b45309', bg: '#fef3c7', icon: <FaHandshake /> },
                { label: 'Deals Closed',       value: closedCount,    color: '#065f46', bg: '#d1fae5', icon: <FaRupeeSign /> },
                { label: 'Fulfilled',          value: fulfilledCount, color: '#14532d', bg: '#f0fdf4', icon: <FaCheckCircle /> },
                { label: 'Stale Crops',        value: staleCrops.length, color: '#b91c1c', bg: '#fef2f2', icon: <FaExclamationTriangle /> },
                { label: 'Needs AI Analysis',  value: needsAnalysis.length, color: '#6b21a8', bg: '#faf5ff', icon: <FaRobot /> },
              ].map(s => (
                <div key={s.label} className="adm-stat-card" style={{ borderTopColor: s.color }}>
                  <div className="adm-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                  <div className="adm-stat-value" style={{ color: s.color }}>{s.value}</div>
                  <div className="adm-stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {staleCrops.length > 0 && (
              <div className="adm-alert-box">
                <FaFire className="adm-alert-icon" />
                <div>
                  <strong>{staleCrops.length} crop listing{staleCrops.length > 1 ? 's' : ''} unsold for 3+ days</strong>
                  <span> — visit Wastage Guard tab for AI-powered flash discount suggestions.</span>
                </div>
                <button className="adm-alert-cta" onClick={() => setActiveTab('wastage')}>
                  View Now
                </button>
              </div>
            )}

            {/* Recent demands table */}
            <h2 className="adm-section-title">Recent Demands</h2>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Crop</th>
                    <th>Consumer</th>
                    <th>Qty (kg)</th>
                    <th>AI Price</th>
                    <th>Offer Price</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Age</th>
                  </tr>
                </thead>
                <tbody>
                  {demands.slice(0, 12).map(d => {
                    const chip = STATUS_CHIP[d.status] || STATUS_CHIP.open
                    return (
                      <tr key={d.id}>
                        <td className="adm-td-crop">{d.cropName}</td>
                        <td>{d.consumerName}</td>
                        <td>{d.quantityKg}</td>
                        <td style={{ color: '#7c3aed', fontWeight: 600 }}>
                          {d.suggestedPriceMin
                            ? `₹${d.suggestedPriceMin}–${d.suggestedPriceMax}`
                            : <span style={{ color: '#9ca3af' }}>Pending…</span>}
                        </td>
                        <td style={{ color: '#059669', fontWeight: 600 }}>
                          {d.farmerOfferPrice ? `₹${d.farmerOfferPrice}` : '—'}
                        </td>
                        <td>{d.location}</td>
                        <td>
                          <span className="adm-chip" style={{ background: chip.bg, color: chip.color }}>
                            {chip.label}
                          </span>
                        </td>
                        <td style={{ color: '#9ca3af', fontSize: 12 }}>{timeAgo(d.createdAt)}</td>
                      </tr>
                    )
                  })}
                  {demands.length === 0 && (
                    <tr><td colSpan={8} className="adm-empty-row">No demands yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DEMANDS TAB ── */}
        {activeTab === 'demands' && (
          <div className="adm-content">
            <h1 className="adm-page-title">
              All Market Demands
              <span className="adm-count-badge">{demands.length}</span>
            </h1>
            <div className="adm-demands-grid">
              {demands.map(demand => {
                const chip = STATUS_CHIP[demand.status] || STATUS_CHIP.open
                const analysis = geminiResults[demand.id]
                return (
                  <div key={demand.id} className="adm-demand-card">
                    <div className="adm-dcard-header">
                      <div>
                        <div className="adm-dcard-crop">{demand.cropName}</div>
                        <div className="adm-dcard-consumer">
                          <FaUsers style={{ marginRight: 4, fontSize: 11 }} />
                          {demand.consumerName}
                        </div>
                      </div>
                      <span className="adm-chip" style={{ background: chip.bg, color: chip.color }}>
                        {chip.label}
                      </span>
                    </div>

                    <div className="adm-dcard-details">
                      <div><FaTag style={{ marginRight: 4 }} />
                        {demand.suggestedPriceMin
                          ? <span style={{ color: '#7c3aed' }}>AI: ₹{demand.suggestedPriceMin}–{demand.suggestedPriceMax}/kg</span>
                          : <span style={{ color: '#9ca3af' }}>AI analysis pending…</span>
                        }
                      </div>
                      <div>{demand.quantityKg} kg</div>
                      <div><FaMapMarkerAlt style={{ marginRight: 4 }} />{demand.location}</div>
                      <div style={{ color: '#9ca3af' }}>{timeAgo(demand.createdAt)}</div>
                    </div>

                    {demand.farmerOfferPrice && (
                      <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 13 }}>
                        🤝 Farmer Offer: <strong>₹{demand.farmerOfferPrice}/kg</strong> by {demand.committedFarmerName}
                      </div>
                    )}

                    {demand.notes && (
                      <p className="adm-dcard-notes">"{demand.notes}"</p>
                    )}

                    <div className="adm-dcard-actions">
                      <button
                        className="adm-ai-btn"
                        disabled={analyzingId === demand.id || !apiKey}
                        onClick={() => analyseDemand(demand)}
                      >
                        <FaRobot style={{ marginRight: 6 }} />
                        {analyzingId === demand.id ? 'Analysing…' : 'AI Price Check'}
                      </button>

                      {demand.status !== 'fulfilled' && (
                        <button
                          className="adm-fulfil-btn"
                          onClick={() => adminFulfil(demand.id)}
                        >
                          <FaCheckCircle style={{ marginRight: 6 }} />
                          Mark Fulfilled
                        </button>
                      )}
                    </div>

                    {analysis && (
                      <div className="adm-ai-result">
                        <div className="adm-ai-result-label">
                          <FaRobot style={{ marginRight: 6, color: '#7c3aed' }} />
                          Gemini Analysis
                        </div>
                        <pre className="adm-ai-result-text">{analysis}</pre>
                      </div>
                    )}
                  </div>
                )
              })}
              {demands.length === 0 && (
                <div className="adm-empty-state">
                  <div className="adm-empty-icon">🎯</div>
                  <h3>No demands yet</h3>
                  <p>Consumer crop requests will appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── WASTAGE GUARD TAB ── */}
        {activeTab === 'wastage' && (
          <div className="adm-content">
            <div className="adm-page-header">
              <h1 className="adm-page-title">
                <FaExclamationTriangle style={{ color: '#dc2626', marginRight: 10 }} />
                Wastage Guard
              </h1>
              <button
                className="adm-analyse-btn"
                disabled={bulkAnalyzing || staleCrops.length === 0}
                onClick={analyseWastage}
              >
                <FaRobot style={{ marginRight: 8 }} />
                {bulkAnalyzing ? 'Analysing All…' : 'Run AI Flash-Discount Analysis'}
              </button>
            </div>

            {staleCrops.length === 0 ? (
              <div className="adm-empty-state">
                <div className="adm-empty-icon">✅</div>
                <h3>No stale crops!</h3>
                <p>All crop listings are less than 3 days old. Great turnover!</p>
              </div>
            ) : (
              <>
                <p className="adm-wastage-sub">
                  {staleCrops.length} crop listing{staleCrops.length > 1 ? 's' : ''} have been
                  unsold for 3+ days. Use AI to generate flash-discount suggestions.
                </p>
                <div className="adm-demands-grid">
                  {staleCrops.map(crop => {
                    const alertData = wastageAlerts.find(a => a.crop.id === crop.id)
                    const age = daysSince(crop.createdAt)
                    return (
                      <div key={crop.id} className="adm-demand-card adm-stale-card">
                        <div className="adm-dcard-header">
                          <div>
                            <div className="adm-dcard-crop">{crop.name}</div>
                            <div className="adm-dcard-consumer" style={{ color: '#b91c1c' }}>
                              <FaClock style={{ marginRight: 4 }} />
                              Listed {age} day{age !== 1 ? 's' : ''} ago — no buyer
                            </div>
                          </div>
                          <span className="adm-chip" style={{ background: '#fef2f2', color: '#b91c1c' }}>
                            Stale
                          </span>
                        </div>

                        <div className="adm-dcard-details">
                          <div>₹{crop.pricePerKg}/kg</div>
                          <div>{crop.quantityKg} kg available</div>
                          <div><FaMapMarkerAlt style={{ marginRight: 4 }} />{crop.location || '—'}</div>
                          <div style={{ color: '#b91c1c', fontWeight: 600 }}>
                            Potential waste: ₹{(crop.quantityKg * crop.pricePerKg).toLocaleString()}
                          </div>
                        </div>

                        {alertData && (
                          <div className="adm-ai-result adm-wastage-result">
                            <div className="adm-ai-result-label">
                              <FaFire style={{ marginRight: 6, color: '#dc2626' }} />
                              Flash Discount Suggestion
                            </div>
                            <pre className="adm-ai-result-text">{alertData.suggestion}</pre>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── GEMINI PROFIT GUARD TAB ── */}
        {activeTab === 'gemini' && (
          <div className="adm-content">
            <h1 className="adm-page-title">
              <FaRobot style={{ color: '#7c3aed', marginRight: 10 }} />
              AI Profit Guard
            </h1>
            <p className="adm-wastage-sub">
              Select any open demand below to run an instant Gemini price fairness check —
              ensuring farmers are never underpaid and consumers get transparent pricing.
            </p>

            <div className="adm-demands-grid">
              {demands.filter(d => d.status === 'open').map(demand => {
                const analysis = geminiResults[demand.id]
                return (
                  <div key={demand.id} className="adm-demand-card">
                    <div className="adm-dcard-header">
                      <div>
                        <div className="adm-dcard-crop">{demand.cropName}</div>
                        <div className="adm-dcard-consumer">{demand.consumerName} · {demand.location}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {demand.suggestedPriceMin ? (
                          <div style={{ fontWeight: 700, color: '#7c3aed', fontSize: 14 }}>
                            AI: ₹{demand.suggestedPriceMin}–{demand.suggestedPriceMax}/kg
                          </div>
                        ) : (
                          <div style={{ color: '#9ca3af', fontSize: 13 }}>No AI price yet</div>
                        )}
                        <div style={{ color: '#9ca3af', fontSize: 12 }}>{demand.quantityKg} kg</div>
                      </div>
                    </div>

                    <button
                      className="adm-ai-btn"
                      style={{ width: '100%', marginTop: 12 }}
                      disabled={analyzingId === demand.id || !apiKey}
                      onClick={() => analyseDemand(demand)}
                    >
                      <FaRobot style={{ marginRight: 8 }} />
                      {analyzingId === demand.id
                        ? 'Thinking…'
                        : analysis ? 'Re-analyse' : 'Check Price Fairness with Gemini'}
                    </button>

                    {!apiKey && (
                      <p style={{ fontSize: 12, color: '#dc2626', marginTop: 8, textAlign: 'center' }}>
                        Set Gemini API key first (banner above).
                      </p>
                    )}

                    {analysis && (
                      <div className="adm-ai-result" style={{ marginTop: 14 }}>
                        <div className="adm-ai-result-label">
                          <FaShieldAlt style={{ marginRight: 6, color: '#7c3aed' }} />
                          Profit Guard Report
                        </div>
                        <pre className="adm-ai-result-text">{analysis}</pre>
                      </div>
                    )}
                  </div>
                )
              })}
              {demands.filter(d => d.status === 'open').length === 0 && (
                <div className="adm-empty-state">
                  <div className="adm-empty-icon">🤖</div>
                  <h3>No open demands</h3>
                  <p>Price fairness checks run on open consumer demand requests.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── COMPLAINTS TAB ── */}
        {activeTab === 'complaints' && (
          <div className="adm-content">
            <div className="adm-page-header">
              <h1 className="adm-page-title">
                <FaFlag style={{ color: '#dc2626', marginRight: 10 }} />
                User Complaints
                {complaints.length > 0 && (
                  <span className="adm-count-badge">{complaints.length}</span>
                )}
              </h1>
            </div>

            {highRiskCount > 0 && (
              <div className="adm-alert-box" style={{ borderColor: '#dc2626', background: '#fef2f2' }}>
                <FaBan className="adm-alert-icon" style={{ color: '#dc2626' }} />
                <div>
                  <strong>{highRiskCount} High-Risk user{highRiskCount > 1 ? 's' : ''} detected</strong>
                  <span> — {highRiskCount === 1 ? 'This user has' : 'These users have'} received 3 or more complaints. Gemini recommends review.</span>
                </div>
              </div>
            )}

            {groupedComplaints.length === 0 ? (
              <div className="adm-empty-state">
                <div className="adm-empty-icon">✅</div>
                <h3>No complaints yet</h3>
                <p>All users are behaving well. Complaints from farmers and consumers will appear here.</p>
              </div>
            ) : (
              <div className="adm-demands-grid">
                {groupedComplaints.map(group => {
                  const isHighRisk = group.items.length >= 3
                  const summary = complaintSummaries[group.reportedId]
                  return (
                    <div
                      key={group.reportedId}
                      className={`adm-demand-card adm-complaint-card${isHighRisk ? ' adm-complaint-card--highrisk' : ''}`}
                    >
                      {/* Card header */}
                      <div className="adm-dcard-header">
                        <div>
                          <div className="adm-dcard-crop" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {group.reportedName}
                            {isHighRisk && (
                              <span className="adm-highrisk-badge">
                                ⚠️ High Risk
                              </span>
                            )}
                          </div>
                          <div className="adm-dcard-consumer" style={{ textTransform: 'capitalize' }}>
                            <FaUsers style={{ marginRight: 4, fontSize: 11 }} />
                            {group.reportedRole} · {group.items.length} complaint{group.items.length > 1 ? 's' : ''}
                          </div>
                        </div>
                        <span
                          className="adm-chip"
                          style={isHighRisk
                            ? { background: '#fef2f2', color: '#b91c1c' }
                            : { background: '#fef3c7', color: '#b45309' }}
                        >
                          {isHighRisk ? 'High Risk' : 'Under Review'}
                        </span>
                      </div>

                      {/* Individual complaints */}
                      <div className="adm-complaint-list">
                        {group.items.map((c, idx) => (
                          <div key={c.id} className="adm-complaint-item">
                            <div className="adm-complaint-reason">
                              <FaFlag style={{ marginRight: 5, fontSize: 10, color: '#dc2626' }} />
                              {c.reasonLabel}
                            </div>
                            {c.description && (
                              <div className="adm-complaint-desc">"{c.description}"</div>
                            )}
                            <div className="adm-complaint-meta">
                              Reported by <strong>{c.reporterName}</strong> · {timeAgo(c.createdAt)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Gemini AI summary */}
                      <button
                        className="adm-ai-btn"
                        style={{ width: '100%', marginTop: 12 }}
                        disabled={summarizingId === group.reportedId || !apiKey}
                        onClick={() => summarizeComplaints(group)}
                      >
                        <FaRobot style={{ marginRight: 8 }} />
                        {summarizingId === group.reportedId
                          ? 'Analysing…'
                          : summary ? 'Re-analyse with Gemini' : 'Summarise with Gemini AI'}
                      </button>

                      {summary && (
                        <div className="adm-ai-result" style={{ marginTop: 14 }}>
                          <div className="adm-ai-result-label">
                            <FaShieldAlt style={{ marginRight: 6, color: '#dc2626' }} />
                            Gemini Trust & Safety Report
                          </div>
                          <pre className="adm-ai-result-text">{summary}</pre>
                          {isHighRisk && (
                            <div className="adm-deactivate-suggestion">
                              <FaBan style={{ marginRight: 6 }} />
                              Gemini recommends considering account deactivation or blocklist for this user.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
