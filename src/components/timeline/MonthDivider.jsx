import React from 'react';

export default function MonthDivider({ label }) {
  return (
    <div className="w-full bg-muted rounded-lg px-4 py-2 mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
      {label}
    </div>
  );
}
