import React, { useState } from 'react'
import { FaTimes, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa'
import { db, auth } from '../../../firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import './ComplaintModal.css'

const REASONS = [
  { value: 'inappropriate_behavior', label: 'Inappropriate Behavior', desc: 'Rude or abusive language during the call.' },
  { value: 'price_manipulation',     label: 'Price Manipulation',     desc: 'Asking for excessively high or unfairly low prices.' },
  { value: 'fake_request',           label: 'Fake Request / Supply',  desc: 'Posting a requirement or crop that doesn\'t exist.' },
  { value: 'other',                  label: 'Other',                  desc: 'Describe the issue in your own words.' },
]

const ComplaintModal = ({ reportedUser, contextId, onClose, onSuccess }) => {
  const [reasons,     setReasons]     = useState(new Set())
  const [description, setDescription] = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [success,     setSuccess]     = useState(false)
  const [error,       setError]       = useState('')

  const toggleReason = (value) => {
    setReasons(prev => {
      const next = new Set(prev)
      next.has(value) ? next.delete(value) : next.add(value)
      return next
    })
    setError('')
  }

  const hasOther = reasons.has('other')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (reasons.size === 0) return setError('Please select at least one reason.')
    if (hasOther && !description.trim()) return setError('Please describe the issue.')

    const user = auth.currentUser
    if (!user) return setError('You must be logged in to file a complaint.')

    const reasonsArray = [...reasons]
    const reasonLabels = reasonsArray.map(v => REASONS.find(r => r.value === v)?.label || v)

    setSubmitting(true)
    setError('')
    try {
      await addDoc(collection(db, 'complaints'), {
        reporterId:    user.uid,
        reporterName:  user.displayName || user.email || 'Unknown',
        reportedId:    reportedUser.id,
        reportedName:  reportedUser.name,
        reportedRole:  reportedUser.role,
        reasons:       reasonsArray,
        reasonLabels,
        description:   description.trim(),
        contextId:     contextId || null,
        status:        'open',
        createdAt:     serverTimestamp(),
      })
      setSuccess(true)
      if (onSuccess) onSuccess(contextId)
    } catch (err) {
      setError(err.message || 'Failed to submit. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <div className="cmp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cmp-modal">

        <div className="cmp-header">
          <div className="cmp-header-icon"><FaExclamationTriangle /></div>
          <div>
            <h2 className="cmp-title">Raise a Complaint</h2>
            <p className="cmp-subtitle">
              Report an issue with <strong>{reportedUser.name}</strong>
            </p>
          </div>
          <button className="cmp-close" onClick={onClose}><FaTimes /></button>
        </div>

        {success ? (
          <div className="cmp-success">
            <div className="cmp-success-icon"><FaCheckCircle /></div>
            <h3>Complaint Registered</h3>
            <p>Admin will review this shortly and take appropriate action.</p>
            <button className="cmp-done-btn" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form className="cmp-form" onSubmit={handleSubmit}>
            {error && <div className="cmp-error">{error}</div>}

            {/* Multi-select reasons */}
            <div className="cmp-field">
              <label className="cmp-label">Select Reason(s) <span className="cmp-optional">(pick all that apply)</span></label>
              <div className="cmp-reason-list">
                {REASONS.map(r => {
                  const active = reasons.has(r.value)
                  return (
                    <button
                      key={r.value}
                      type="button"
                      className={`cmp-reason-btn ${active ? 'cmp-reason-btn--active' : ''}`}
                      onClick={() => toggleReason(r.value)}
                    >
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                        <div className="cmp-reason-label">{r.label}</div>
                        {active && <FaCheckCircle style={{ color:'#b45309', fontSize:13, flexShrink:0 }} />}
                      </div>
                      <div className="cmp-reason-desc">{r.desc}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Description — required if Other selected */}
            <div className="cmp-field">
              <label className="cmp-label">
                Additional Details
                {!hasOther && <span className="cmp-optional"> (optional)</span>}
              </label>
              <textarea
                className="cmp-textarea"
                placeholder={hasOther ? 'Describe the issue in detail…' : 'Any additional context you would like to share…'}
                rows={3}
                value={description}
                onChange={e => { setDescription(e.target.value); setError('') }}
              />
            </div>

            <button
              type="submit"
              className="cmp-submit"
              disabled={submitting || reasons.size === 0}
            >
              {submitting
                ? <span className="cmp-spinner" />
                : <><FaExclamationTriangle style={{ marginRight: 8 }} />Submit Complaint</>}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ComplaintModal
