import { useState, useEffect, useCallback } from 'react'
import { db, auth } from '../../../firebase'
import {
  collection, onSnapshot, query,
  where, doc, updateDoc, getDoc, serverTimestamp,
  arrayUnion, arrayRemove, deleteField
} from 'firebase/firestore'

/**
 * useMarketOpportunities — farmer side
 * Status flow: open → quoted → deal_closed → in_progress → completed
 */
export const useMarketOpportunities = () => {
  const [openDemands, setOpenDemands] = useState([])
  const [myQuotes,    setMyQuotes]    = useState([])
  const [loading,     setLoading]     = useState(true)

  /* ── All open requests (no farmer quoted yet) ── */
  useEffect(() => {
    const q = query(
      collection(db, 'market_demands'),
      where('status', '==', 'open')
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        docs.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0
          const tb = b.createdAt?.toMillis?.() ?? 0
          return tb - ta
        })
        setOpenDemands(docs)
        setLoading(false)
      },
      (err) => {
        console.warn('useMarketOpportunities openDemands error:', err.message)
        setLoading(false)
      }
    )
    return () => { try { unsub() } catch (_) {} }
  }, [])

  /* ── Deals where this farmer submitted a quote ── */
  useEffect(() => {
    let unsubSnap = null
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (unsubSnap) { unsubSnap(); unsubSnap = null }
      if (!user) return
      const q = query(
        collection(db, 'market_demands'),
        where('committedFarmerId', '==', user.uid)
      )
      unsubSnap = onSnapshot(q, (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        docs.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0
          const tb = b.createdAt?.toMillis?.() ?? 0
          return tb - ta
        })
        setMyQuotes(docs)
      })
    })
    return () => {
      if (unsubSnap) { try { unsubSnap() } catch (_) {} }
      try { unsubAuth() } catch (_) {}
    }
  }, [])

  /* ── Submit a price offer for a demand ── */
  const submitOffer = useCallback(async (demandId, offerPrice, offerUnit = 'kg', offerAvailableDate = '', offerOrganic = false) => {
    const user = auth.currentUser
    if (!user) return { success: false, error: 'Not logged in' }
    const price = parseFloat(offerPrice)
    if (!price || price <= 0) return { success: false, error: 'Enter a valid price' }
    try {
      // Fetch farmer's phone and location from their profile
      const profileSnap = await getDoc(doc(db, 'users', user.uid))
      const profileData = profileSnap.exists() ? profileSnap.data() : {}
      const farmerPhone = profileData.phone || profileData.phoneNumber || ''
      const farmerDistrict = (
        profileData.district ||
        profileData.location?.district ||
        profileData.address?.district ||
        profileData.city ||
        ''
      )

      if (!farmerPhone || farmerPhone.replace(/\D/g, '').length < 10) {
        return { success: false, error: 'Please add your phone number in your profile before submitting offers.' }
      }
      if (!farmerDistrict) {
        return { success: false, error: 'Please add your location (district) in your profile before submitting offers.' }
      }

      // Normalise to per-kg for calculation, but store original display unit
      const unitMultiplier = offerUnit === 'quintal' ? 100 : offerUnit === 'ton' ? 1000 : 1
      const pricePerKg = price / unitMultiplier

      await updateDoc(doc(db, 'market_demands', demandId), {
        status:              'quoted',
        committedFarmerId:   user.uid,
        committedFarmerName: user.displayName || user.email || 'Farmer',
        farmerOfferPrice:    pricePerKg,        // always stored per-kg
        farmerOfferDisplay:  price,             // original number entered
        farmerOfferUnit:     offerUnit,         // 'kg' | 'quintal' | 'ton'
        farmerOfferOrganic:  !!offerOrganic,
        farmerPhone,
        farmerAvailableUntil: offerAvailableDate || '',
        quotedAt:            serverTimestamp(),
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  /* ── Update an existing price offer ── */
  const updateOffer = useCallback(async (demandId, offerPrice, offerUnit = 'kg') => {
    const user = auth.currentUser
    if (!user) return { success: false, error: 'Not logged in' }
    const price = parseFloat(offerPrice)
    if (!price || price <= 0) return { success: false, error: 'Enter a valid price' }
    try {
      const unitMultiplier = offerUnit === 'quintal' ? 100 : offerUnit === 'ton' ? 1000 : 1
      const pricePerKg = price / unitMultiplier
      await updateDoc(doc(db, 'market_demands', demandId), {
        farmerOfferPrice:   pricePerKg,
        farmerOfferDisplay: price,
        farmerOfferUnit:    offerUnit,
        updatedAt:          serverTimestamp(),
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  /* ── Withdraw offer (reset to open so others can quote) ── */
  const withdrawOffer = useCallback(async (demandId) => {
    try {
      await updateDoc(doc(db, 'market_demands', demandId), {
        status:              'open',
        committedFarmerId:   null,
        committedFarmerName: null,
        farmerOfferPrice:    null,
        farmerOfferDisplay:  deleteField(),
        farmerOfferUnit:     deleteField(),
        farmerPhone:         null,
        quotedAt:            deleteField(),
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  /* ── Mark deal as in_progress (farmer dispatching / on the way) ── */
  const markInProgress = useCallback(async (demandId) => {
    try {
      await updateDoc(doc(db, 'market_demands', demandId), {
        status: 'in_progress',
        inProgressAt: serverTimestamp(),
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  /* ── Toggle 'I am fulfilling this' — adds/removes farmer uid from array ── */
  const toggleFulfilling = useCallback(async (demandId, isFulfilling) => {
    const user = auth.currentUser
    if (!user) return { success: false, error: 'Not logged in' }
    try {
      await updateDoc(doc(db, 'market_demands', demandId), {
        fulfillingFarmerIds: isFulfilling ? arrayRemove(user.uid) : arrayUnion(user.uid),
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  /* ── Farmer updates pickup date (can extend or prepone) ── */
  const farmerUpdatePickupDate = useCallback(async (demandId, newDate) => {
    if (!newDate) return { success: false, error: 'Please select a date' }
    const today = new Date().toISOString().split('T')[0]
    if (newDate < today) return { success: false, error: 'Date cannot be in the past' }
    try {
      await updateDoc(doc(db, 'market_demands', demandId), {
        pickupDate: newDate,
        pickupDateUpdatedAt: serverTimestamp(),
        pickupDateUpdatedBy: 'farmer',
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  return { openDemands, myQuotes, loading, submitOffer, updateOffer, withdrawOffer, markInProgress, toggleFulfilling, farmerUpdatePickupDate }
}
