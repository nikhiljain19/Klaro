import React from 'react';
import MonthDivider from './MonthDivider';
import ReportCard from '../reports/ReportCard';

export default function TimelineList({ reports, onReportClick }) {
  const getGroupLabel = (dateString) => {
    if (!dateString) return 'Unknown Date';
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const getSortKey = (dateString) => {
    if (!dateString) return '0000-00';
    return dateString.substring(0, 7); // YYYY-MM
  };

  // Group reports
  const groups = {};
  reports.forEach(report => {
    const key = getSortKey(report.report_date);
    if (!groups[key]) {
      groups[key] = { label: getGroupLabel(report.report_date), items: [] };
    }
    groups[key].items.push(report);
  });

  // Sort groups descending (newest first)
  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  
  // Notice reports within group are implicitly already sorted by timeline fetch, but if needed we can sort here.

  return (
    <div className="space-y-6 mt-6">
      {sortedKeys.map(key => (
        <div key={key}>
          <MonthDivider label={groups[key].label} />
          <div className="space-y-2 mt-4 relative">
            {groups[key].items.map(report => {
               // Only format "15 Mar" for the left gutter strip
               const dateStr = report.report_date 
                  ? new Date(report.report_date).toLocaleDateString('default', { day: 'numeric', month: 'short' })
                  : '-';
               return (
                 <div key={report.id} className="flex gap-4 items-start relative z-10">
                   <div className="w-20 shrink-0 text-right pt-3 text-xs font-medium uppercase tracking-wide text-text-muted hidden md:block">
                     {dateStr}
                   </div>
                   <div className="flex-1 md:border-l-2 border-border md:pl-4">
                     <ReportCard report={report} onClick={() => onReportClick(report)} />
                   </div>
                 </div>
               );
            })}
            <div className="absolute left-20 border-l-2 border-border h-full top-0 -z-10 hidden md:block"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
