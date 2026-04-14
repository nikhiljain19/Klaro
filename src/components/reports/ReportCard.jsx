import React from 'react';
import { REPORT_TYPE_COLORS } from '../../lib/constants';

const HUMAN_TYPE_LABELS = {
  blood_test: 'Blood Test',
  ultrasound: 'Ultrasound',
  mri: 'MRI',
  consult_note: 'Consultation Note',
  hsg: 'HSG Report',
  laparoscopy: 'Laparoscopy',
  discharge_summary: 'Discharge Summary',
  ivf: 'IVF Report',
  embryology: 'Embryology Report',
  unknown: 'Other',
};

export default function ReportCard({ report, onClick }) {
  if (!report) return null; // Or skeleton

  const accentColor = REPORT_TYPE_COLORS[report.report_type] || REPORT_TYPE_COLORS.unknown;
  
  const dateStr = report.report_date 
    ? new Date(report.report_date).toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Unknown Date';

  // Sort chips: high/low first
  const sortedChips = [...(report.extracted_values?.lab_values || [])].sort((a, b) => {
    const isAbnormalA = a.flag === 'high' || a.flag === 'low' ? 0 : 1;
    const isAbnormalB = b.flag === 'high' || b.flag === 'low' ? 0 : 1;
    return isAbnormalA - isAbnormalB;
  }).slice(0, 3);

  return (
    <div 
      onClick={onClick}
      className="flex bg-card rounded-xl shadow-sm border border-border overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-150 w-full"
    >
      <div className="w-1 shrink-0" style={{ backgroundColor: accentColor }}></div>
      <div className="flex-1 p-5 flex flex-col md:flex-row justify-between gap-4 md:items-center">
        
        {/* Left Col */}
        <div className="flex flex-col flex-1">
          <div className="text-sm font-medium text-gray-900">{dateStr}</div>
          <div className="text-xs text-text-muted mt-0.5">{report.lab_name || report.doctor_name || 'No provider listed'}</div>
          {report.extracted_values?.patient_info?.name && (
            <div className="text-xs text-text-muted mt-0.5">Patient: {report.extracted_values.patient_info.name}</div>
          )}
          {report.extracted_values?.referred_by && (
            <div className="text-xs text-text-muted mt-0.5">Referred by: {report.extracted_values.referred_by}</div>
          )}
          {report.extracted_values?.tags && report.extracted_values.tags.filter(t => t.toLowerCase() !== 'unknown').length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {report.extracted_values.tags.filter(t => t.toLowerCase() !== 'unknown').slice(0, 3).map((tag, idx) => (
                <span key={idx} className="bg-muted border border-border rounded-full px-2 py-0.5 text-xs text-text-muted capitalize">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Center Col */}
        <div className="flex flex-wrap flex-[2] gap-2">
          {sortedChips.map((chip, idx) => {
            let chipStyle = 'bg-muted text-text-muted border-border';
            if (chip.flag === 'high' || chip.flag === 'low') {
              chipStyle = 'bg-red-50 text-danger border-red-200';
            } else if (chip.flag === 'normal') {
              chipStyle = 'bg-green-50 text-success border-green-200';
            }
            
            return (
              <span key={idx} className={`text-xs font-mono px-2 py-0.5 rounded-full border ${chipStyle}`}>
                {chip.name}: {chip.value} {chip.unit || ''}
              </span>
            );
          })}
        </div>

        {/* Right Col */}
        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-text-muted">
            {HUMAN_TYPE_LABELS[report.report_type] || 'Other'}
          </span>
          {report.extraction_confidence === 'medium' && (
            <span className="bg-yellow-50 text-yellow-700 text-xs px-2 py-0.5 rounded-full border border-yellow-200">
              Medium Confidence
            </span>
          )}
          {report.extraction_confidence === 'low' && (
            <span className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full border border-orange-200">
              Low Confidence
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
