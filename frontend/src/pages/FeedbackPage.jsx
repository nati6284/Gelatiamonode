import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { api } from '../api'

const RATINGS = [5, 4, 3, 2, 1]

const CATEGORIES = [
  {
    label: 'Food Quality',
    items: ['Taste', 'Presentation', 'Freshness', 'Portion size'],
  },
  {
    label: 'Service',
    items: ['Friendliness of staff', 'Speed of service', 'Accuracy of orders', 'Attentiveness'],
  },
  {
    label: 'Environment',
    items: ['Cleanliness', 'Ambiance', 'Comfort'],
  },
]

function RatingRow({ label, value, onChange }) {
  const name = label.replace(/\s+/g, '-').toLowerCase()
  return (
    <div className="feedback-row">
      <span className="feedback-row-label">{label}</span>
      <div className="feedback-stars">
        {RATINGS.map(r => (
          <label key={r} className={`feedback-radio-label ${value === r ? 'active' : ''}`}>
            <input
              type="radio"
              name={name}
              value={r}
              checked={value === r}
              onChange={() => onChange(r)}
              aria-label={`Rate ${label} ${r}`}
            />
            {r}
          </label>
        ))}
        
      </div>
    </div>
  )
}

export default function FeedbackPage({ selectedBranch }) {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [branches, setBranches] = useState([])
  const [branchId, setBranchId] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [order, setOrder] = useState('')
  const [comment, setComment] = useState('')

  useEffect(() => {
    api.branches().then(data => setBranches(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  // ratings keyed by item name
  const [ratings, setRatings] = useState({})

  const setRating = (item, val) => setRatings(r => ({ ...r, [item]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    // All rating items must be filled
    const allItems = CATEGORIES.flatMap(c => c.items)
    const missing = allItems.find(item => !ratings[item])
    if (missing) {
      alert(`Please rate: ${missing}`)
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      await api.submitFeedback({ branchId: branchId || null, phone, date, order, ratings, comment })
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <>
        <section className="page-banner page-banner--feedback-bg">
          <span className="eyebrow">CUSTOMER FEEDBACK</span>
          <h1>Thank <span style={{color:'var(--italian-red)'}}>You!</span></h1>
          <p>Your feedback helps us serve you better.</p>
        </section>
        <section className="section" style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '64px', height: '64px', borderRadius: '50%', background: 'var(--forest)',
            color: '#fff', marginBottom: '24px' }}>
            <Check size={32} />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', marginBottom: '12px' }}>
            Feedback received
          </h2>
          <p style={{ color: 'var(--muted)', maxWidth: '400px', margin: '0 auto' }}>
            We appreciate you taking the time to share your experience at Gelatiamo.
          </p>
        </section>
      </>
    )
  }

  return (
    <>
      <section
        className="page-banner page-banner--feedback-bg"
        style={selectedBranch?.interior_image ? { backgroundImage: `url(${selectedBranch.interior_image})` } : {}}
      >
        <span className="eyebrow">CUSTOMER FEEDBACK</span>
        <h1>Thank you for <span style={{color:'var(--italian-red)'}}>dining</span> with us!</h1>
        <p>Your feedback is invaluable in helping us enhance your experience.</p>
      </section>

      <section className="section">
        <div className="feedback-wrap">

          {/* Rating scale legend */}
          <div className="feedback-legend">
            <p className="feedback-legend-intro">
              Please rate each category from <strong>1 to 5</strong>, with <strong>5 being the best</strong>.
            </p>
            <div className="feedback-scale">
              {[
                ['5', 'Excellent',  'Exceeded expectations', 'var(--italian-green)'],
                ['4', 'Very Good',  'Met expectations',      '#4caf50'],
                ['3', 'Good',       'Satisfactory',          '#ff9800'],
                ['2', 'Fair',       'Below expectations',    '#f44336'],
                ['1', 'Poor',       'Unsatisfactory',        'var(--italian-red)'],
              ].map(([n, label, desc, color]) => (
                <div key={n} className="feedback-scale-item">
                  <span className="feedback-scale-badge" style={{ background: color }}>{n}</span>
                  <span className="feedback-scale-text">
                    <strong>{label}</strong>
                    <small>{desc}</small>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="feedback-form">

            {/* Contact info */}
            <div className="feedback-section">
              <div className="field">
                <label>Branch visited</label>
                <select value={branchId} onChange={e => setBranchId(e.target.value)} required>
                  <option value="">Select a branch…</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Contact number</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+251 9XX XXX XXX" />
                </div>
                <div className="field">
                  <label>Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
              </div>
              <div className="field">
                <label>Customer order</label>
                <input type="text" value={order} onChange={e => setOrder(e.target.value)}
                  placeholder="e.g. Tiramisu, Macchiato" />
              </div>
            </div>

            {/* Rating categories */}
            {CATEGORIES.map(cat => (
              <div key={cat.label} className="feedback-section">
                <h3 className="feedback-category-title">{cat.label}</h3>
                <div className="feedback-rating-header">
                  <span />
                  <div className="feedback-stars">
                    {RATINGS.map(r => (
                      <span key={r} className="feedback-star-label">{r}</span>
                    ))}
                  </div>
                </div>
                {cat.items.map(item => (
                  <RatingRow
                    key={item}
                    label={item}
                    value={ratings[item] || 0}
                    onChange={val => setRating(item, val)}
                  />
                ))}
              </div>
            ))}

            {/* Comments */}
            <div className="feedback-section">
              <div className="field">
                <label>Additional comments</label>
                <textarea rows="4" value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Tell us more about your experience…" />
              </div>
            </div>

            {submitError && (
              <p style={{ color: 'var(--italian-red)', textAlign: 'center', marginBottom: '8px' }}>
                {submitError}
              </p>
            )}

            <button type="submit" className="button" disabled={submitting}
              style={{ width: '100%', justifyContent: 'center', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Submitting…' : 'Submit feedback'}
            </button>
          </form>
        </div>
      </section>
    </>
  )
}
