import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { ERROR_STATES } from '../../lib/strings';

export default function UploadArea({ onFileSelected, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndProcessFile = (file) => {
    setError(null);
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError(ERROR_STATES.WRONG_FILE_TYPE);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(ERROR_STATES.FILE_TOO_LARGE);
      return;
    }

    setSelectedFile(file);
    onFileSelected(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    
    const file = e.dataTransfer.files[0];
    validateAndProcessFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    validateAndProcessFile(file);
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onFileSelected(null);
  };

  return (
    <div className={`w-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div 
        onClick={() => !disabled && !selectedFile && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors
          ${disabled ? '' : (selectedFile ? 'border-success bg-green-50/50' : (isDragging ? 'border-primary bg-primary/5 cursor-copy' : 'border-border cursor-pointer hover:border-primary/50'))}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleChange}
          accept="application/pdf"
          className="hidden"
          disabled={disabled}
        />
        
        {selectedFile ? (
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
              {selectedFile.name}
            </span>
            <span className="text-xs text-text-muted mt-1">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </span>
            {!disabled && (
              <button 
                onClick={removeFile}
                className="mt-3 bg-white border border-border px-3 py-1 rounded-md text-xs text-text-muted hover:text-danger flex items-center gap-1 shadow-sm transition-colors"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            )}
          </div>
        ) : (
          <>
            <Upload className={`w-10 h-10 mb-3 mx-auto ${isDragging ? 'text-primary' : 'text-text-subtle'}`} />
            <p className="text-sm text-text-muted font-medium">
              {isDragging ? 'Drop it here' : 'Drag a PDF here or click to browse'}
            </p>
            <p className="text-xs text-text-subtle mt-1">
              PDF only · Max 10MB
            </p>
          </>
        )}
      </div>
      
      {error && !selectedFile && (
        <p className="text-xs text-danger mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
