import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Loader2, Upload as UploadIcon, FileSearch, Sparkles, Plus } from 'lucide-react';
import { toast } from 'sonner';
import UploadArea from './UploadArea';
import ExtractionPreview from './ExtractionPreview';
import { extractReportFromPDF } from '../../lib/gemini';
import { uploadReportFile, saveReport, supabase, getPatients, savePatient } from '../../lib/supabase';

export default function UploadModal({ isOpen, onClose, onReportSaved }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  
  const [uploadStage, setUploadStage] = useState(null); // 'uploading' | 'processing' | 'extracting' | null
  const [uploadData, setUploadData] = useState(null);
  const [extractionResult, setExtractionResult] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientRel, setNewPatientRel] = useState('Self');
  const [savingPatient, setSavingPatient] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFile(null);
      setUploadStage(null);
      setUploadData(null);
      setExtractionResult(null);
      setDuplicateWarning(null);
      setPendingFile(null);
      setSelectedPatientId(null);
      setShowNewPatient(false);
      setNewPatientName('');
      setNewPatientRel('Self');
      
      getPatients().then(setPatients).catch(console.error);
    }
  }, [isOpen]);

  const checkDuplicate = async (fileToCheck) => {
    try {
      const { data: exact } = await supabase
        .from('reports')
        .select('id, file_name, report_date, report_type')
        .eq('file_name', fileToCheck.name)
        .limit(1);

      if (exact && exact.length > 0) return { type: 'exact', report: exact[0] };

      const { data: all } = await supabase
        .from('reports')
        .select('id, file_name, report_date, report_type, file_size');

      if (all) {
        const similar = all.find(r => r.file_size && Math.abs(r.file_size - fileToCheck.size) <= 1024);
        if (similar) return { type: 'similar', report: similar };
      }
    } catch (e) {
      console.warn("Duplicate check failed:", e);
    }
    return null;
  };

  const handleFileSelected = async (selectedFile) => {
    if (!selectedFile) return;
    setPendingFile(selectedFile);
    
    const dupe = await checkDuplicate(selectedFile);
    if (dupe) {
      setDuplicateWarning(dupe);
      return;
    }
    goToPatientSelection();
  };

  const goToPatientSelection = () => {
    setDuplicateWarning(null);
    setStep(1.5);
  };

  const handleCreatePatient = async () => {
    if (!newPatientName.trim()) return;
    setSavingPatient(true);
    try {
      const p = await savePatient({
        name: newPatientName,
        relationship: newPatientRel,
        gender: 'Prefer not to say'
      });
      setPatients(prev => [...prev, p]);
      setShowNewPatient(false);
      proceedWithUpload(pendingFile, p.id);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create patient');
    } finally {
      setSavingPatient(false);
    }
  };

  const proceedWithUpload = async (selectedFile, patientId) => {
    setSelectedPatientId(patientId);
    setFile(selectedFile);
    setStep(1);
    setUploadStage('uploading');
    
    try {
      const { fileUrl, filePath } = await uploadReportFile(selectedFile);
      setUploadData({ fileUrl, filePath });

      setUploadStage('processing');
      const processingTimer = setTimeout(() => {
        setUploadStage(prev => prev === 'processing' ? 'extracting' : prev);
      }, 4000);

      const result = await extractReportFromPDF(selectedFile);
      clearTimeout(processingTimer);
      
      setExtractionResult(result);
      setUploadStage(null);
      setStep(2);
    } catch (error) {
      console.error(error);
      setUploadStage(null);
      toast.error(error.message || "Something went wrong during upload");
      setStep(1);
      setFile(null); // allow retry
    }
  };

  const handleSave = async (finalData) => {
    try {
      const dbRow = {
        patient_id: selectedPatientId,
        file_url: uploadData.fileUrl,
        file_path: uploadData.filePath,
        file_name: file.name,
        file_size: file.size,
        report_type: finalData.report_type,
        report_date: finalData.report_date || null,
        lab_name: finalData.lab_name || null,
        doctor_name: finalData.doctor_name || null,
        extracted_values: finalData.extracted_values || {},
        extraction_confidence: finalData.extraction_confidence || 'low',
        confidence_reason: finalData.confidence_reason || null,
        extraction_failed: finalData.extraction_failed || false,
        raw_text: null
      };

      await saveReport(dbRow);
      
      try {
        if (typeof onReportSaved === 'function') onReportSaved();
      } catch (e) {
        console.warn('Refresh failed:', e);
      }
      
      toast.success("Report saved successfully");
      window.dispatchEvent(new CustomEvent('refresh-timeline'));
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Couldn't save your report. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-card border border-border shadow-xl rounded-xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b border-border bg-muted/20">
          <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {step === 1 ? 'Add New Report' : step === 1.5 ? 'Who is this for?' : 'Review Information'}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 max-h-[85vh] overflow-y-auto">
          {step === 1 && !uploadStage && (
            <div className="flex flex-col items-center">
              <UploadArea onFileSelected={handleFileSelected} disabled={!!duplicateWarning} />
              
              {duplicateWarning && duplicateWarning.type === 'exact' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 w-full mt-4">
                  <p className="font-medium mb-1">This file appears to have been uploaded before.</p>
                  <p className="mb-1 text-yellow-700">Previously uploaded: {duplicateWarning.report.report_date ? new Date(duplicateWarning.report.report_date).toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown Date'}</p>
                  <p className="mb-3 text-yellow-700">Type: {duplicateWarning.report.report_type ? duplicateWarning.report.report_type.replace('_', ' ') : 'Unknown'}</p>
                  <div className="flex gap-3">
                    <button onClick={goToPatientSelection} className="px-3 py-1.5 bg-yellow-100 font-medium rounded border border-yellow-300 hover:bg-yellow-200 transition-colors">Upload Anyway</button>
                    <button onClick={() => { setDuplicateWarning(null); setPendingFile(null); }} className="px-3 py-1.5 font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded bg-white shadow-sm transition-colors">Cancel</button>
                  </div>
                </div>
              )}

              {duplicateWarning && duplicateWarning.type === 'similar' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800 w-full mt-4">
                  <p className="mb-3 font-medium">This file is very similar in size to "{duplicateWarning.report.file_name}" already in your timeline. Are you sure this is a different report?</p>
                  <div className="flex gap-3">
                    <button onClick={goToPatientSelection} className="px-3 py-1.5 bg-orange-100 font-medium rounded border border-orange-300 hover:bg-orange-200 transition-colors">Yes, upload</button>
                    <button onClick={() => { setDuplicateWarning(null); setPendingFile(null); }} className="px-3 py-1.5 font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded bg-white shadow-sm transition-colors">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 1 && uploadStage === 'uploading' && (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in">
              <UploadIcon className="w-8 h-8 text-primary animate-bounce mb-3" />
              <h3 className="text-sm font-medium text-gray-900">Securing your document...</h3>
              <p className="text-xs text-text-muted mt-1">Uploading to secure storage</p>
            </div>
          )}

          {step === 1 && uploadStage === 'processing' && (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in">
              <FileSearch className="w-8 h-8 text-primary animate-pulse mb-3" />
              <h3 className="text-sm font-medium text-gray-900">Reading your report...</h3>
              <p className="text-xs text-text-muted mt-1">Identifying report type and structure</p>
            </div>
          )}

          {step === 1 && uploadStage === 'extracting' && (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in">
              <Sparkles className="w-8 h-8 text-primary animate-pulse mb-3" />
              <h3 className="text-sm font-medium text-gray-900">Extracting insights...</h3>
              <p className="text-xs text-text-muted mt-1">Identifying lab values, dates and clinical notes</p>
            </div>
          )}

          {step === 1.5 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Who is this report for?</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {patients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => proceedWithUpload(pendingFile, p.id)}
                    className="bg-card border border-border hover:border-primary/50 text-gray-700 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
                
                <button
                  onClick={() => setShowNewPatient(true)}
                  className="bg-muted text-text-muted border border-border border-dashed hover:border-primary/50 hover:text-primary px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> New Patient
                </button>
              </div>

              {showNewPatient && (
                <div className="bg-muted/30 border border-border rounded-lg p-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Name</label>
                      <input type="text" value={newPatientName} onChange={e => setNewPatientName(e.target.value)} placeholder="Patient name" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-focus focus:ring-1 focus:ring-primary focus:outline-none bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Relationship</label>
                      <select value={newPatientRel} onChange={e => setNewPatientRel(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-focus focus:ring-1 focus:ring-primary focus:outline-none bg-white">
                        <option>Self</option>
                        <option>Partner</option>
                        <option>Mother</option>
                        <option>Father</option>
                        <option>Child</option>
                        <option>Sibling</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowNewPatient(false)} className="text-xs font-medium text-text-muted hover:text-gray-900 px-3 py-1.5 transition-colors">Cancel</button>
                    <button onClick={handleCreatePatient} disabled={savingPatient || !newPatientName.trim()} className="bg-primary text-white text-xs font-medium px-4 py-1.5 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50">
                      {savingPatient ? 'Saving...' : 'Save & Continue'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && extractionResult && (
            <ExtractionPreview 
              extraction={extractionResult}
              confidence={extractionResult.extraction_failed ? 'failed' : (extractionResult.extraction_confidence || 'low')}
              confidenceReason={extractionResult.confidence_reason}
              onSave={handleSave}
              onCancel={onClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
