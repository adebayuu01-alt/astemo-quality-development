import React from 'react';

export default function PageHeaderCard({ title, subtitle, action }) {
  return (
    <div className="bg-white rounded-xl border border-[#E4E7EC] px-5 py-3.5 flex items-center justify-between shadow-sm flex-shrink-0">
      <div>
        <h1 className="text-xl font-bold text-[#1E232F]">{title}</h1>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
