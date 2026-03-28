import React, { useState } from 'react';
import {
  FaLeaf, FaUsers, FaCheckCircle, FaWeightHanging,
  FaMapMarkerAlt, FaPhone, FaCoins, FaComments
} from 'react-icons/fa';
import ComplaintModal from '../../../shared/components/ComplaintModal/ComplaintModal';
import { getCropImage } from '../utils/cropHelpers';

const WEIGHT_UNIT_OPTIONS = [
  { value: 'kg',      label: 'per kg' },
  { value: 'quintal', label: 'per Quintal (100 kg)' },
  { value: 'ton',     label: 'per Ton (1000 kg)' },
];

const DemandCard = ({ demand, isPriority, onSubmitOffer, onOpenChat, onToastError, onToastSuccess, isBlinking = false }) => {
  const demandUnit = demand.quantityUnit || 'kg';
  const isWeightDemand = demandUnit === 'kg';
  const offerUnitOptions = isWeightDemand ? WEIGHT_UNIT_OPTIONS : [{ value: demandUnit, label: `per ${demandUnit}` }];
  const demandQty = parseFloat(demand.quantityKg || 0) || 0;
  
  const [showComplaint, setShowComplaint] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerPrice, setOfferPrice]       = useState('');
  const [offerUnit,  setOfferUnit]        = useState(demandUnit);
  const [offerOrganic, setOfferOrganic]   = useState('non-organic');
  const [offerAvailDate, setOfferAvailDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 10); return d.toISOString().split('T')[0]; });
  const [submitting, setSubmitting]       = useState(false);
  
  const hasPhone = demand.consumerPhone && demand.consumerPhone !== 'Not provided';
  const cropImg  = getCropImage(demand.cropName);

  const handleSubmitOffer = async () => {
    if (!offerPrice || parseFloat(offerPrice) <= 0) { onToastError('Enter a valid price'); return; }
    if (!offerAvailDate) { onToastError('Please set your crop availability date'); return; }
    setSubmitting(true);
    const res = await onSubmitOffer(demand.id, offerPrice, offerUnit, offerAvailDate, offerOrganic === 'organic');
    setSubmitting(false);
    if (res.success) {
      onToastSuccess('Offer submitted! Consumer will be notified.');
      const def = new Date(); def.setDate(def.getDate() + 10);
      setShowOfferForm(false); setOfferPrice(''); setOfferUnit(demandUnit); setOfferOrganic('non-organic'); setOfferAvailDate(def.toISOString().split('T')[0]);
    } else {
      onToastError(res.error || 'Could not submit offer');
    }
  };

  const unitMult = offerUnit === 'quintal' ? 100 : offerUnit === 'ton' ? 1000 : 1;
  const totalEst = offerPrice ? (demandQty * parseFloat(offerPrice) / unitMult).toFixed(0) : null;

  return (
    <div
      data-notif-id={demand.id}
      className={`bg-white rounded-xl shadow-sm border p-4 transition-all duration-300 relative ${
        isPriority ? 'border-[#86efac] border-2 bg-gradient-to-b from-green-50 to-white' : 'border-gray-200 hover:shadow-md hover:-translate-y-1'
      } ${isBlinking ? 'animate-pulse' : ''}`}
    >
      {/* ── Top row ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-green-50 flex-shrink-0 flex items-center justify-center border border-green-100">
          {cropImg ? (
            <img src={cropImg} alt={demand.cropName} className="w-full h-full object-cover block" />
          ) : (
            <FaLeaf className="text-2xl text-green-600" />
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isPriority && <div className="bg-yellow-100 text-yellow-800 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap">📍 Near You</div>}
          {(demand.consumerTotalDeals || 0) >= 5 && (
            <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">✓ Verified</span>
          )}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 transition-colors"
            onClick={() => onOpenChat(demand)}
          >
            <FaComments /> Chat
          </button>
        </div>
      </div>

      {/* ── Crop name | Consumer name ── */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold text-gray-900 capitalize leading-tight">{demand.cropName}</span>
        <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md">
          <FaUsers className="text-[10px]" />{demand.consumerName}
        </span>
      </div>

      {demand.notes && <p className="text-[13px] text-gray-600 italic bg-gray-50 border-l-[3px] border-gray-300 px-3 py-2 my-3 rounded-r-lg shadow-sm">"{demand.notes}"</p>}

      {/* ── Offer form ── */}
      {showOfferForm && (
        <div className="mt-3 bg-green-50 border border-green-300 rounded-xl p-3.5 shadow-sm">
          <div className="text-[13px] font-bold text-green-800 mb-2.5">💰 Your Price Offer</div>
          
          <div className="flex gap-1.5 mb-2.5">
            {offerUnitOptions.map(u => (
              <button
                key={u.value}
                onClick={() => setOfferUnit(u.value)}
                className={`flex-1 py-1.5 px-1 text-[11px] font-semibold rounded-lg border-[1.5px] cursor-pointer transition-colors ${
                  offerUnit === u.value ? 'border-green-600 bg-green-100 text-green-800 shadow-sm' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >{u.label}</button>
            ))}
          </div>

          <div className="flex items-center border-[1.5px] border-green-300 rounded-lg overflow-hidden bg-white mb-2 focus-within:ring-2 ring-green-400">
            <span className="px-3 text-base font-bold text-green-800 border-r border-green-300 h-full flex items-center bg-green-50">₹</span>
            <input
              type="number" min="1" step="0.01"
              placeholder={isWeightDemand ? `Amount ${offerUnit === 'kg' ? 'per kg' : offerUnit === 'quintal' ? 'per quintal' : 'per ton'}` : `Amount per ${offerUnit}`}
              value={offerPrice}
              onChange={e => setOfferPrice(e.target.value)}
              className="flex-1 py-2 px-2.5 border-none text-[15px] outline-none bg-transparent"
            />
          </div>

          {totalEst && (
            <div className="text-xs font-semibold text-green-800 mb-3 bg-green-100/70 rounded-md py-2 px-2.5 border border-green-200">
              Total for {demandQty} {demandUnit} <span className="text-gray-400 mx-1">→</span> ₹{parseInt(totalEst).toLocaleString()}
            </div>
          )}

          <div className="mb-2.5">
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Crop Type</label>
            <select
              value={offerOrganic}
              onChange={e => setOfferOrganic(e.target.value)}
              className="w-full py-2 px-2.5 border-[1.5px] border-green-300 rounded-lg text-[13px] outline-none bg-white focus:ring-2 ring-green-400"
            >
              <option value="non-organic">Non-Organic</option>
              <option value="organic">Organic</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Crop Available Until *</label>
            <input
              type="date"
              value={offerAvailDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setOfferAvailDate(e.target.value)}
              className="w-full py-2 px-2.5 border-[1.5px] border-green-300 rounded-lg text-[13px] outline-none bg-white focus:ring-2 ring-green-400"
            />
            <span className="text-[10px] text-gray-500 mt-1 block tracking-tight">Consumer will know till when you have this crop</span>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSubmitOffer} disabled={submitting}
              className={`flex-1 py-2 rounded-lg font-bold text-[13px] text-white flex items-center justify-center transition-all ${
                submitting ? 'bg-gray-400 cursor-not-allowed opacity-80' : 'bg-gradient-to-r from-green-600 to-green-700 shadow hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
              }`}
            >
              {submitting ? 'Submitting…' : <><FaCheckCircle className="mr-1.5" />Send Offer</>}
            </button>
            <button
              onClick={() => { const def = new Date(); def.setDate(def.getDate()+10); setShowOfferForm(false); setOfferPrice(''); setOfferUnit(demandUnit); setOfferOrganic('non-organic'); setOfferAvailDate(def.toISOString().split('T')[0]); }}
              className="py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg text-[13px] font-semibold shadow-sm hover:bg-gray-50 hover:text-gray-900 cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom: qty left, location right ── */}
      <div className="flex justify-between items-center mt-3 p-2 bg-gray-50 rounded-lg text-[13px] font-semibold text-gray-700 border border-gray-100">
        <span className="flex items-center gap-1.5">
          <FaWeightHanging className="text-gray-400 text-[11px]" /> {demandQty} {demandUnit}
        </span>
        <span className="flex items-center gap-1.5">
          <FaMapMarkerAlt className="text-red-400 text-[11px]" /> {demand.location}
        </span>
      </div>

      {/* ── Action row ── */}
      {!showOfferForm && (
        <div className="flex gap-2 mt-3 items-stretch h-11">
          {hasPhone ? (
            <a
              href={`tel:${demand.consumerPhone}`}
              className="flex-1 flex items-center justify-center gap-2 px-2 bg-green-50/50 border border-green-200 rounded-lg text-green-700 font-bold text-[13px] hover:bg-green-100 hover:border-green-300 transition-all shadow-sm"
            >
              <FaPhone className="text-[11px]" /> {demand.consumerPhone}
            </a>
          ) : (
            <span className="flex-1 flex items-center justify-center px-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-400 font-medium italic">
              No phone provided
            </span>
          )}
          <button
            className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-green-600 to-green-700 text-white border-none rounded-lg font-bold text-[13px] shadow hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            onClick={() => setShowOfferForm(true)}
          >
            <FaCoins className="text-[11px]" /> Send Price
          </button>
        </div>
      )}

      {showComplaint && (
        <ComplaintModal
          reportedUser={{ id: demand.consumerId, name: demand.consumerName, role: 'consumer' }}
          contextId={demand.id}
          onClose={() => setShowComplaint(false)}
        />
      )}
    </div>
  );
};

export default DemandCard;
