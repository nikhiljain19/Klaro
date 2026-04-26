import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function QuestionInput({ onSubmit, disabled, disabledReason, placeholderText = "Ask anything about your medical history or help thinking through a decision..." }) {
  const [question, setQuestion] = useState('');

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
       e.preventDefault();
       fireSubmit();
    }
  };

  const fireSubmit = () => {
    if (!question.trim() || disabled) return;
    onSubmit(question.trim());
    setQuestion('');
  };

  // Build the underlying DOM block
  const innerContent = (
    <>
       <textarea 
         value={question}
         onChange={e => setQuestion(e.target.value)}
         onKeyDown={handleKeyDown}
         disabled={disabled}
         placeholder={placeholderText}
         className={`w-full rounded-xl border border-border p-4 pr-20 pb-10 text-sm resize-none min-h-24 ${
            disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'focus:border-focus focus:ring-1 focus:ring-primary focus:outline-none'
         }`}
       />
       <div className="absolute bottom-3 right-16 text-xs text-text-subtle pointer-events-none">
         {question.length} chars
       </div>
       <button 
         onClick={fireSubmit}
         disabled={disabled || !question.trim()}
         className={`absolute bottom-3 right-3 bg-primary text-white rounded-lg px-4 py-1.5 text-sm font-medium ${
            (disabled || !question.trim()) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90 transition-colors'
         }`}
       >
         Ask
       </button>
    </>
  );

  // Return conditionally wrapped block avoiding React internal component remount destruction
  if (disabled && disabledReason) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative w-full cursor-not-allowed">
            {innerContent}
          </div>
        </PopoverTrigger>
        <PopoverContent className="text-xs text-text-muted p-2 w-auto bg-card border border-border shadow-md rounded-lg">
          {disabledReason}
        </PopoverContent>
      </Popover>
    );
  }

  return <div className="relative w-full">{innerContent}</div>;
}
