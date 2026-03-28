import React from 'react';

const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse w-full max-w-sm" aria-hidden="true">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 rounded-xl bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded-md w-3/4" />
        <div className="h-3 bg-gray-200 rounded-md w-1/2" />
      </div>
    </div>
    <div className="space-y-2.5">
      <div className="h-3 bg-gray-200 rounded-md w-full" />
      <div className="h-3 bg-gray-200 rounded-md w-5/6" />
    </div>
    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
      <div className="h-10 bg-gray-200 rounded-lg flex-1" />
      <div className="h-10 bg-gray-200 rounded-lg flex-1" />
    </div>
  </div>
);

export default SkeletonCard;
