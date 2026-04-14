import React, { useState, useEffect } from 'react';
import { X, Pencil, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { updateReport, getReportFileUrl, deleteReport } from '../../lib/supabase';
import { REPORT_TYPE_COLORS } from '../../lib/constants';
import { toast } from 'sonner';

export default function ReportDetailPanel({ report, isOpen, onClose, onReportDeleted }) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState('');
  const [showSavedState, setShowSavedState] = useState(false);
  const [editData, setEditData] = useState({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [showPatientSaved, setShowPatientSaved] = useState(false);

  useEffect(() => {
    if (report) {
      setNotes(report.user_notes || '');
      setEditData({
        report_type: report.report_type || 'unknown',
        report_date: report.report_date || '',
        lab_name: report.lab_name || '',
        doctor_name: report.doctor_name || ''
      });
      setPatientName(report.extracted_values?.patient_info?.name || '');
      setIsEditingPatient(false);
      setIsEditing(false);
      setIsDeleteDialogOpen(false);
    }
  }, [report, isOpen]);

  if (!isOpen || !report) return null;

  const accentColor = REPORT_TYPE_COLORS[report.report_type] || REPORT_TYPE_COLORS.unknown;
  const extraction = report.extracted_values || {};

  const handleNotesBlur = async () => {
    if (notes === (report.user_notes || '')) return;
    try {
      await updateReport(report.id, { user_notes: notes });
      setShowSavedState(true);
      setTimeout(() => setShowSavedState(false), 1500);
      window.dispatchEvent(new CustomEvent('refresh-timeline'));
    } catch (err) {
      toast.error("Failed to save notes");
    }
  };

  const handleEditSave = async () => {
    try {
      await updateReport(report.id, editData);
      setIsEditing(false);
      window.dispatchEvent(new CustomEvent('refresh-timeline'));
      toast.success("Changes saved");
    } catch (err) {
      toast.error("Failed to save changes");
    }
  };

  const handleViewOriginal = async () => {
    try {
      if (!report.file_path) throw new Error("No file path stored");
      const signedUrl = await getReportFileUrl(report.file_path);
      window.open(signedUrl, '_blank');
    } catch (err) {
      toast.error("Couldn't open the original file.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteReport(report.id, report.file_path);
      setIsDeleteDialogOpen(false);
      onClose();
      if (typeof onReportDeleted === 'function') {
        onReportDeleted(report.id);
      }
      toast.success("Report deleted");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't delete this report. Please try again.");
    }
  };

  const handlePatientSave = async () => {
    setIsEditingPatient(false);
    const originalName = report.extracted_values?.patient_info?.name || '';
    if (patientName === originalName) return;
    
    try {
      const newExtracted = { 
        ...report.extracted_values, 
        patient_info: { 
          ...(report.extracted_values?.patient_info || {}), 
          name: patientName 
        } 
      };
      await updateReport(report.id, { extracted_values: newExtracted });
      
      report.extracted_values = newExtracted;
      setShowPatientSaved(true);
      setTimeout(() => setShowPatientSaved(false), 1500);
      window.dispatchEvent(new CustomEvent('refresh-timeline'));
    } catch (err) {
      toast.error('Failed to update patient name');
      setPatientName(originalName);
    }
  };

  const handlePatientKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 z-40 md:hidden" 
        onClick={onClose}
      />
      <div className={`fixed inset-y-0 right-0 w-full md:w-96 bg-card shadow-xl z-50 transform transition-transform duration-200 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex justify-between items-center z-10 shrink-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }}></span>
              <span className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                {report.report_type.replace('_', ' ')}
              </span>
            </div>
            {report.report_date && (
              <span className="text-xs text-text-muted mt-1 ml-4 block">
                Date: {new Date(report.report_date).toLocaleDateString('default', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
            <div className="text-xs text-text-muted mt-0.5 ml-4 flex items-center gap-2">
              <span>Patient:</span>
              {isEditingPatient ? (
                <input
                  autoFocus
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  onBlur={handlePatientSave}
                  onKeyDown={handlePatientKeyDown}
                  className="text-sm border-b border-border focus:border-focus outline-none bg-transparent w-40 text-gray-900"
                />
              ) : (
                <span 
                  onClick={() => setIsEditingPatient(true)}
                  className={`cursor-pointer ${patientName ? 'text-gray-900 hover:text-primary transition-colors' : 'text-text-subtle hover:text-primary transition-colors'}`}
                >
                  {patientName || "Add patient name"}
                </span>
              )}
              {showPatientSaved && <span className="text-[10px] text-success animate-in fade-in transition-opacity duration-300">Saved</span>}
            </div>
            {extraction.referred_by && (
              <span className="text-xs text-text-muted mt-0.5 ml-4 block">
                Referred by: {extraction.referred_by}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="text-sm text-text-muted transition-colors font-medium">Cancel</button>
                <button onClick={handleEditSave} className="bg-primary text-white rounded-md px-3 py-1.5 text-xs font-medium">Save Changes</button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="text-text-muted hover:text-gray-900 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={onClose} className="text-text-muted hover:text-gray-900 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          
          {isEditing && (
             <div className="bg-muted/30 border border-border p-4 rounded-lg space-y-3 mb-6">
               <div>
                  <label className="block text-xs text-text-subtle mb-1">Report Date</label>
                  <input type="date" value={editData.report_date} onChange={(e) => setEditData({...editData, report_date: e.target.value})} className="rounded border border-border px-2 py-1 text-sm w-full bg-white"/>
               </div>
               <div>
                  <label className="block text-xs text-text-subtle mb-1">Lab / Clinic Name</label>
                  <input type="text" value={editData.lab_name} onChange={(e) => setEditData({...editData, lab_name: e.target.value})} className="rounded border border-border px-2 py-1 text-sm w-full bg-white"/>
               </div>
               <div>
                  <label className="block text-xs text-text-subtle mb-1">Doctor Name</label>
                  <input type="text" value={editData.doctor_name} onChange={(e) => setEditData({...editData, doctor_name: e.target.value})} className="rounded border border-border px-2 py-1 text-sm w-full bg-white"/>
               </div>
             </div>
          )}

          {/* Condition Tags */}
          {extraction.tags && extraction.tags.filter(t => t.toLowerCase() !== 'unknown').length > 0 && (
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wide text-text-muted mb-2">Condition Tags</h4>
              <div className="flex flex-wrap gap-2">
                {extraction.tags.filter(t => t.toLowerCase() !== 'unknown').map((tag, idx) => (
                  <span key={idx} className="bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs font-medium capitalize">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Lab Values */}
          {extraction.lab_values && extraction.lab_values.length > 0 && (
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wide text-text-muted mb-2">Lab Values</h4>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-text-muted text-xs uppercase hidden md:table-header-group">
                    <tr>
                      <th className="px-3 py-2 border-b border-border">Parameter</th>
                      <th className="px-3 py-2 border-b border-border">Value / Range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {extraction.lab_values.map((item, idx) => {
                       const isAbnormal = item.flag === 'high' || item.flag === 'low';
                       return (
                         <tr key={idx} className={isAbnormal ? 'bg-red-50/50' : ''}>
                           <td className="px-3 py-2">
                             <div className="font-medium text-gray-900">{item.name}</div>
                             {isAbnormal && <span className="text-[10px] uppercase text-danger font-bold">{item.flag}</span>}
                           </td>
                           <td className="px-3 py-2">
                             <div className={isAbnormal ? 'font-bold text-danger' : 'text-gray-700'}>{item.value} <span className="text-text-muted text-xs font-normal">{item.unit}</span></div>
                             {item.reference_range && <div className="text-xs text-text-muted mt-0.5">Range: {item.reference_range}</div>}
                           </td>
                         </tr>
                       );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Clinical Notes & Impression */}
          {extraction.findings && extraction.findings.length > 0 && (
             <div>
                <h4 className="text-xs font-medium uppercase tracking-wide text-text-muted mb-2">Clinical Notes & Findings</h4>
                <div className="bg-muted rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {extraction.findings.map((f, i) => <p key={i} className={i > 0 ? "mt-2" : ""}>{f}</p>)}
                </div>
             </div>
          )}
          
          {extraction.impression && (
             <div>
                <h4 className="text-xs font-medium uppercase tracking-wide text-text-muted mb-2">Impression</h4>
                <div className="bg-muted rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {extraction.impression}
                </div>
             </div>
          )}

          {/* Medications */}
          {extraction.medications && extraction.medications.length > 0 && (
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wide text-text-muted mb-2">Medications</h4>
              <ul className="space-y-3">
                {extraction.medications.map((med, i) => (
                  <li key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="text-sm font-medium text-gray-900">{med.name}</div>
                    <div className="text-xs text-text-muted space-x-2">
                       {med.dose && <span>{med.dose}</span>}
                       {med.frequency && <span>• {med.frequency}</span>}
                       {med.duration && <span>• {med.duration}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* User Notes */}
          <div>
            <div className="flex items-center gap-3 mb-2">
               <h4 className="text-xs font-medium uppercase tracking-wide text-text-muted">Your Notes</h4>
               {showSavedState && <span className="text-xs text-success animate-in fade-in transition-opacity duration-300">Saved</span>}
            </div>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add your own observations about this report..."
              className="w-full rounded-lg border border-border p-3 text-sm resize-none min-h-[5rem] focus:border-focus focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border px-5 py-4 shrink-0">
          <button 
            onClick={() => setIsDeleteDialogOpen(true)}
            className="w-full border border-danger text-danger rounded-lg py-2 text-sm font-medium hover:bg-red-50 bg-white mb-3"
          >
            Delete Report
          </button>
          <button 
            onClick={handleViewOriginal}
            className="w-full bg-muted border border-border rounded-lg py-2 text-sm font-medium text-gray-700 text-center hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" /> View Original PDF
          </button>
        </div>
      </div>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border shadow-xl rounded-xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 border-b border-border bg-muted/20">
            <DialogTitle>Delete Report</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p className="text-sm text-gray-700">This will permanently delete this report and cannot be undone.</p>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setIsDeleteDialogOpen(false)} 
                className="px-4 py-2 bg-muted text-gray-700 hover:bg-muted/80 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete} 
                className="px-4 py-2 bg-danger text-white hover:bg-danger/90 rounded-lg text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
