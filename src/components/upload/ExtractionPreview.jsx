import React, { useState } from 'react';

const REPORT_TYPES = {
  'blood_test': 'Blood Test',
  'ultrasound': 'Ultrasound',
  'mri': 'MRI',
  'consult_note': 'Consultation Note',
  'hsg': 'HSG Report',
  'laparoscopy': 'Laparoscopy',
  'discharge_summary': 'Discharge Summary',
  'ivf': 'IVF Report',
  'embryology': 'Embryology Report',
  'unknown': 'Other'
};

const getFlagStyles = (flag) => {
  switch (flag?.toLowerCase()) {
    case 'high':
    case 'low':
      return 'bg-red-50 text-danger border-red-200';
    case 'normal':
      return 'bg-green-50 text-success border-green-200';
    default:
      return 'bg-muted text-text-muted border-border';
  }
};

export default function ExtractionPreview({ extraction, confidence, confidenceReason, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    report_type: extraction?.report_type || 'unknown',
    report_date: extraction?.report_date || '',
    lab_name: '',
    doctor_name: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave({
      ...formData,
      extracted_values: extraction,
      extraction_confidence: confidence,
      confidence_reason: confidenceReason,
      extraction_failed: confidence === 'failed'
    });
  };

  const renderBanner = () => {
    if (confidence === 'high') return null;
    
    if (confidence === 'medium') {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
          Some values may need review before saving
        </div>
      );
    }
    if (confidence === 'low') {
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-sm text-orange-800">
          We couldn't extract this reliably. Please check all fields carefully.
        </div>
      );
    }
    if (confidence === 'failed') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-danger">
          Extraction failed. Please enter details manually.
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex md:block flex-col max-h-[80vh] overflow-y-auto pr-2">
      {renderBanner()}

      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Detected Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-subtle mb-1">Report Type</label>
            <select 
              value={formData.report_type}
              onChange={(e) => handleChange('report_type', e.target.value)}
              className="rounded-lg border border-border px-3 py-2 text-sm w-full bg-white focus:border-focus focus:ring-1 focus:ring-primary outline-none"
            >
              {Object.entries(REPORT_TYPES).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-subtle mb-1">Report Date</label>
            <input 
              type="date"
              value={formData.report_date}
              onChange={(e) => handleChange('report_date', e.target.value)}
              className="rounded-lg border border-border px-3 py-2 text-sm w-full focus:border-focus focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-text-subtle mb-1">Lab Name</label>
            <input 
              type="text"
              placeholder="e.g. Quest Diagnostics"
              value={formData.lab_name}
              onChange={(e) => handleChange('lab_name', e.target.value)}
              className="rounded-lg border border-border px-3 py-2 text-sm w-full focus:border-focus focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-text-subtle mb-1">Doctor Name</label>
            <input 
              type="text"
              placeholder="e.g. Dr. Smith"
              value={formData.doctor_name}
              onChange={(e) => handleChange('doctor_name', e.target.value)}
              className="rounded-lg border border-border px-3 py-2 text-sm w-full focus:border-focus focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Extracted Values</h3>
        {(!extraction?.lab_values || extraction.lab_values.length === 0) ? (
          <p className="text-sm text-text-muted italic border rounded-lg p-4 bg-muted/30">
            No structured values extracted. You can add them after saving.
          </p>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-text-muted text-xs uppercase w-full">
                <tr>
                  <th className="px-4 py-3 border-b border-border">Parameter</th>
                  <th className="px-4 py-3 border-b border-border">Value</th>
                  <th className="px-4 py-3 border-b border-border">Unit</th>
                  <th className="px-4 py-3 border-b border-border">Range</th>
                  <th className="px-4 py-3 border-b border-border">Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {extraction.lab_values.map((item, idx) => (
                  <tr key={idx} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-2 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-2 text-gray-700">{item.value}</td>
                    <td className="px-4 py-2 text-text-muted">{item.unit || '-'}</td>
                    <td className="px-4 py-2 text-text-muted hidden md:table-cell">{item.reference_range || '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full border text-xs font-mono inline-block ${getFlagStyles(item.flag)}`}>
                        {item.flag?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border">
        <button 
          onClick={onCancel}
          className="text-sm text-text-muted hover:text-gray-900 px-4 py-2 transition-colors font-medium"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          className="bg-primary text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Save Report
        </button>
      </div>
    </div>
  );
}
