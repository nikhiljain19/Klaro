import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Loader2, Upload as UploadIcon, FileSearch, Sparkles, Plus } from 'lucide-react';
import { toast } from 'sonner';
import UploadArea from './UploadArea';
import ExtractionPreview from './ExtractionPreview';
import { extractReportFromPDF } from '../../lib/gemini';
import { uploadReportFile, saveReport, supabase, getPatients, savePatient, findPersonByName } from '../../lib/supabase';

export default function UploadModal({ isOpen, onClose, onReportSaved }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  
  const [uploadStage, setUploadStage] = useState(null); // 'uploading' | 'processing' | 'extracting' | null
  const [uploadData, setUploadData] = useState(null);
  const [extractionResult, setExtractionResult] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFile(null);
      setUploadStage(null);
      setUploadData(null);
      setExtractionResult(null);
      setDuplicateWarning(null);
      setPendingFile(null);
      
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
    proceedWithUpload(selectedFile);
  };

  const proceedWithUpload = async (selectedFile) => {
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
      let computedPatientId = null;
      const personNameStr = finalData.person_name?.trim();
      
      if (personNameStr) {
        const match = await findPersonByName(personNameStr);
        if (match) {
          computedPatientId = match.id;
        } else {
          const newP = await savePatient({ name: personNameStr, relationship: 'Self', gender: 'Prefer not to say' });
          computedPatientId = newP.id;
        }
      }

      const dbRow = {
        patient_id: computedPatientId,
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
            {step === 1 ? 'Add New Report' : 'Review Information'}
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
                    <button onClick={() => proceedWithUpload(pendingFile)} className="px-3 py-1.5 bg-yellow-100 font-medium rounded border border-yellow-300 hover:bg-yellow-200 transition-colors">Upload Anyway</button>
                    <button onClick={() => { setDuplicateWarning(null); setPendingFile(null); }} className="px-3 py-1.5 font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded bg-white shadow-sm transition-colors">Cancel</button>
                  </div>
                </div>
              )}

              {duplicateWarning && duplicateWarning.type === 'similar' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800 w-full mt-4">
                  <p className="mb-3 font-medium">This file is very similar in size to "{duplicateWarning.report.file_name}" already in your timeline. Are you sure this is a different report?</p>
                  <div className="flex gap-3">
                    <button onClick={() => proceedWithUpload(pendingFile)} className="px-3 py-1.5 bg-orange-100 font-medium rounded border border-orange-300 hover:bg-orange-200 transition-colors">Yes, upload</button>
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
