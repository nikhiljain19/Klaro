import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { EMPTY_STATES } from '../lib/strings';
import FilterBar from '../components/timeline/FilterBar';
import TimelineList from '../components/timeline/TimelineList';
import ReportDetailPanel from '../components/reports/ReportDetailPanel';

export default function Timeline({ reports = [], isLoading = false, fetchReports, onReportDeleted }) {
  const [activeType, setActiveType] = useState('all');
  const [activeDateRange, setActiveDateRange] = useState('all');
  const [activePatient, setActivePatient] = useState('all');
  
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    if (!fetchReports) return;
    const handleRefresh = () => fetchReports();
    window.addEventListener('refresh-timeline', handleRefresh);
    return () => window.removeEventListener('refresh-timeline', handleRefresh);
  }, [fetchReports]);

  const getFilteredReports = () => {
    return reports.filter(r => {
      // Type filter
      let typeMatch = true;
      if (activeType === 'blood_test') typeMatch = r.report_type === 'blood_test';
      else if (activeType === 'imaging') typeMatch = ['ultrasound', 'mri', 'hsg', 'laparoscopy'].includes(r.report_type);
      else if (activeType === 'consult') typeMatch = ['consult_note', 'discharge_summary'].includes(r.report_type);

      // Date filter
      let dateMatch = true;
      if (activeDateRange !== 'all' && r.report_date) {
        const reportDate = new Date(r.report_date);
        const now = new Date();
        const diffMonths = (now.getFullYear() - reportDate.getFullYear()) * 12 + now.getMonth() - reportDate.getMonth();
        
        if (activeDateRange === '6m') dateMatch = diffMonths <= 6;
        if (activeDateRange === '1y') dateMatch = diffMonths <= 12;
      }

      // Patient filter
      let patientMatch = true;
      if (activePatient !== 'all') {
        const pName = r.extracted_values?.patient_info?.name;
        if (!pName) {
          patientMatch = false;
        } else {
          patientMatch = pName.toLowerCase().trim() === activePatient.toLowerCase().trim();
        }
      }

      return typeMatch && dateMatch && patientMatch;
    });
  };

  const filteredReports = getFilteredReports();

  const handleClearAll = () => {
    setActiveType('all');
    setActiveDateRange('all');
    setActivePatient('all');
  };

  return (
    <div className="px-4 py-6 md:px-6 md:py-8 max-w-7xl mx-auto">
      
      <div className="sticky top-[68px] z-20 bg-surface pb-4 pt-2 -mx-4 px-4 md:-mx-6 md:px-6">
        <FilterBar 
          reports={reports}
          activeType={activeType}
          activeDateRange={activeDateRange}
          activePatient={activePatient}
          onTypeChange={setActiveType}
          onDateRangeChange={setActiveDateRange}
          onPatientChange={setActivePatient}
          onClearAll={handleClearAll}
        />
      </div>

      <div className="mt-2">
        {isLoading ? (
          // Skeleton Cards
          <div className="space-y-4">
             <div className="w-32 h-6 bg-border/50 rounded animate-pulse mb-6"></div>
             {[1,2,3].map(i => (
               <div key={i} className="flex bg-card rounded-xl shadow-sm border border-border h-24 animate-pulse w-full">
                 <div className="w-1 shrink-0 bg-border"></div>
                 <div className="p-5 flex flex-col justify-between flex-1">
                   <div className="w-1/4 h-4 bg-muted rounded"></div>
                   <div className="flex gap-2"><div className="w-16 h-5 bg-muted rounded-full"></div><div className="w-20 h-5 bg-muted rounded-full"></div></div>
                 </div>
               </div>
             ))}
          </div>
        ) : reports.length === 0 ? (
          // Total Empty State (no reports at all in DB)
          <div className="mt-20 flex flex-col items-center">
            <FileText className="w-12 h-12 text-text-subtle mb-4" />
            <p className="text-sm text-text-muted text-center max-w-sm">
              {EMPTY_STATES.NO_REPORTS}
            </p>
            {/* The add button is in the App header already, but UI.md recommends it here too */}
            <button 
              onClick={() => document.querySelector('header button.bg-primary')?.click()}
              className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium mt-6"
            >
              Add Report
            </button>
          </div>
        ) : filteredReports.length === 0 ? (
          // Filter Result Empty State
          <div className="mt-20 flex flex-col items-center">
            <p className="text-sm text-text-muted text-center">
              {EMPTY_STATES.NO_FILTER_RESULTS}
            </p>
            <button onClick={handleClearAll} className="text-primary text-sm font-medium mt-4">
              Clear filters
            </button>
          </div>
        ) : (
          <TimelineList reports={filteredReports} onReportClick={setSelectedReport} />
        )}
      </div>

      <ReportDetailPanel 
        report={selectedReport} 
        isOpen={!!selectedReport} 
        onClose={() => setSelectedReport(null)} 
        onReportDeleted={onReportDeleted}
      />
    </div>
  );
}
