import React from 'react';
import { FaChartLine, FaSeedling, FaMoneyBillWave, FaTruck, FaCalendarAlt, FaLeaf } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { getCropImage } from '../utils/cropHelpers';

const MetricsOverview = ({ analytics, savedCrops, statusMeta, fmt }) => {
  const { t } = useTranslation();
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold flex items-center text-gray-800 mb-6">
        <FaChartLine className="text-blue-600 mr-2" />
        {t('farm_analytics', 'Farm Analytics')}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <FaSeedling />, label: t('total_crops', 'Total Crops'), val: (analytics?.totalCrops || 0).toLocaleString(),               cls: 'bg-green-50 text-green-700 border-green-200', iconBg: 'bg-green-100/50' },
          { icon: <FaMoneyBillWave />, label: t('stock_values', 'Stock Values'), val: `₹${(analytics?.totalValue || 0).toLocaleString()}`, cls: 'bg-blue-50 text-blue-700 border-blue-200', iconBg: 'bg-blue-100/50' },
          { icon: <FaTruck />,    label: t('available_stock', 'Available Stock'),       val: (analytics?.availableCrops || 0).toLocaleString(),           cls: 'bg-teal-50 text-teal-700 border-teal-200', iconBg: 'bg-teal-100/50' },
          { icon: <FaCalendarAlt />, label: t('total_sold', 'Total Sold'),         val: (analytics?.soldCrops || 0).toLocaleString(),                cls: 'bg-orange-50 text-orange-700 border-orange-200', iconBg: 'bg-orange-100/50' },
        ].map((card, i) => (
          <div key={i} className={`rounded-xl p-4 flex items-center shadow-sm border ${card.cls} hover:shadow-md transition-shadow`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mr-3 ${card.iconBg}`}>{card.icon}</div>
            <div>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">{card.label}</p>
              <p className="text-xl font-black">{card.val}</p>
            </div>
          </div>
        ))}
      </div>

      {savedCrops?.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <h3 className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 text-[15px] font-bold text-gray-800">{t('crop_breakdown', 'Crop Breakdown')}</h3>
          <div className="divide-y divide-gray-100">
            {savedCrops.map(crop => {
              const img = getCropImage(crop.crop || crop.cropName);
              const sm = statusMeta?.[crop.status] || { label: crop.status || 'Available', bg: '#f3f4f6', color: '#374151' };
              return (
                <div key={crop.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-green-50 flex items-center justify-center mr-3 border border-green-100">
                      {img
                        ? <img src={img} alt={crop.crop} className="w-full h-full object-cover block" />
                        : <FaLeaf className="text-xl text-green-600" />
                      }
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-gray-900 leading-tight capitalize mb-0.5">{t(crop.crop || crop.cropName, crop.crop || crop.cropName)}</p>
                      <p className="text-xs font-semibold text-gray-500 capitalize">{t(crop.district, fmt(crop.district))}, {t(crop.state, fmt(crop.state))}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">{crop.quantity} {crop.crop === 'Banana' || crop.cropName === 'Banana' ? t('dozen_short', 'doz') : t('kg', 'kg')}</span>
                      <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md">₹{crop.price}/{crop.crop === 'Banana' || crop.cropName === 'Banana' ? t('dozen_short', 'doz') : t('kg', 'kg')}</span>
                    </div>
                    <span 
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border shadow-sm"
                      style={{ background: sm.bg, color: sm.color, borderColor: `${sm.color}40` }}
                    >{t(sm.label.toLowerCase(), sm.label)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-[15px] font-bold text-gray-800 mb-2">{t('no_data_yet', 'No data yet')}</h3>
          <p className="text-[13px] font-semibold text-gray-500 max-w-sm">{t('no_data_sub', 'Add crops to see your farm\'s performance and analytics here.')}</p>
        </div>
      )}
    </div>
  );
};

export default MetricsOverview;
