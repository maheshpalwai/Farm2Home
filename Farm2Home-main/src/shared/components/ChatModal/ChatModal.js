import { useState, useEffect, useRef } from 'react'
import { db, auth } from '../../../firebase'
import {
  collection, addDoc, onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { FaTimes, FaPaperPlane, FaLeaf, FaUser } from 'react-icons/fa'
import './ChatModal.css'

/**
 * ChatModal — real-time in-app chat between farmer & consumer for a specific demand
 * Uses: market_demands/{demandId}/messages subcollection
 */
const ChatModal = ({ demand, currentRole, onClose }) => {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const user = auth.currentUser

  const otherName =
    currentRole === 'farmer'
      ? demand.consumerName || 'Consumer'
      : demand.committedFarmerName || 'Farmer'

  // Real-time messages listener
  useEffect(() => {
    const q = query(
      collection(db, 'market_demands', demand.id, 'messages'),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => { try { unsub() } catch (_) {} }
  }, [demand.id])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || !user) return
    setSending(true)
    try {
      await addDoc(collection(db, 'market_demands', demand.id, 'messages'), {
        senderId:   user.uid,
        senderName: user.displayName || user.email || (currentRole === 'farmer' ? 'Farmer' : 'Consumer'),
        senderRole: currentRole,
        text:       trimmed,
        createdAt:  serverTimestamp(),
      })
      setText('')
    } catch (err) {
      console.error('Send failed:', err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (ts) => {
    if (!ts?.seconds) return ''
    return new Date(ts.seconds * 1000).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    })
  }

  return (
    <div className="chat-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="chat-header-icon">
              {currentRole === 'farmer' ? <FaUser /> : <FaLeaf />}
            </div>
            <div>
              <div className="chat-header-name">{otherName}</div>
              <div className="chat-header-sub">
                Chat about: <strong>{demand.cropName}</strong> · {demand.quantityKg} kg
              </div>
            </div>
          </div>
          <button className="chat-close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <p>No messages yet.</p>
              <p>Start the conversation about price, quality or delivery!</p>
            </div>
          )}
          {messages.map(msg => {
            const isMine = msg.senderId === user?.uid
            return (
              <div key={msg.id} className={`chat-bubble-row ${isMine ? 'chat-bubble-row--mine' : ''}`}>
                {!isMine && (
                  <div className="chat-bubble-avatar">
                    {(msg.senderName || '?')[0].toUpperCase()}
                  </div>
                )}
                <div className={`chat-bubble ${isMine ? 'chat-bubble--mine' : 'chat-bubble--theirs'}`}>
                  {!isMine && <div className="chat-bubble-sender">{msg.senderName}</div>}
                  <div className="chat-bubble-text">{msg.text}</div>
                  <div className="chat-bubble-time">{formatTime(msg.createdAt)}</div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="chat-input-row">
          <textarea
            className="chat-input"
            placeholder="Type a message... (Enter to send)"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            maxLength={500}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={sending || !text.trim()}
          >
            <FaPaperPlane />
          </button>
        </div>

      </div>
    </div>
  )
}

export default ChatModal
