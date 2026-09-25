import React from 'react';

export default function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="animate-pulse space-y-4 py-3">
      {/* Table Header skeleton */}
      <div className="flex gap-4 border-b border-gray-100 pb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-gray-200 rounded"
            style={{ width: `${100 / cols}%` }}
          />
        ))}
      </div>

      {/* Table Rows skeleton */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 items-center py-2.5 border-b border-gray-50">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-4 bg-gray-100 rounded"
              style={{
                width: c === 0 ? '40px' : c === cols - 1 ? '70px' : `${(100 / cols) * 0.8}%`
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
