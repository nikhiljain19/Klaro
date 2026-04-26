import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { saveFeedback } from '../../lib/supabase';

export default function AIResponseCard({ content, isStreaming, citedReports = [], onCitationClick, question, personId }) {
  const [rating, setRating] = useState(null);
  const [showThanks, setShowThanks] = useState(false);
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState(null);
  const [otherText, setOtherText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let t;
    if (showThanks) {
      t = setTimeout(() => setShowThanks(false), 2000);
    }
    return () => clearTimeout(t);
  }, [showThanks]);

  if (!content && isStreaming) {
    return (
      <div className="bg-muted rounded-xl p-5 border-l-4 border-primary shadow-sm mb-4">
        <p className="text-sm text-text-muted mb-4">Reading your history...</p>
        <div className="space-y-3">
          <div className="h-4 bg-border/50 rounded animate-pulse w-full"></div>
          <div className="h-4 bg-border/50 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-border/50 rounded animate-pulse w-full"></div>
          <div className="h-20 bg-border/50 rounded animate-pulse w-full"></div>
        </div>
      </div>
    );
  }

  const extractSection = (startMatch, endMatch) => {
    const startIdx = content.indexOf(startMatch);
    if (startIdx === -1) return null;
    
    const textStart = startIdx + startMatch.length;
    let endIdx = content.length;
    
    if (endMatch) {
       const possibleEnd = content.indexOf(endMatch, textStart);
       if (possibleEnd !== -1) endIdx = possibleEnd;
    }
    
    return content.substring(textStart, endIdx).trim();
  };

  const s1 = extractSection('1. RELEVANT HISTORY', '2. REASONING') || extractSection('RELEVANT HISTORY', 'REASONING');
  const s2 = extractSection('2. REASONING', '3. GAPS') || extractSection('REASONING', 'GAPS');
  const s3 = extractSection('3. GAPS', '4. QUESTIONS FOR YOUR DOCTOR') || extractSection('GAPS', 'QUESTIONS FOR YOUR DOCTOR');
  const s4 = extractSection('4. QUESTIONS FOR YOUR DOCTOR', '5. DISCLAIMER') || extractSection('QUESTIONS FOR YOUR DOCTOR', 'DISCLAIMER');
  const s5 = extractSection('5. DISCLAIMER', null) || extractSection('DISCLAIMER', null);
  
  // Custom parsing for Clarification + Memory hooks
  const clarification = extractSection('CLARIFICATION NEEDED:', null)?.split('\n')[0];
  const memoryNote = extractSection('MEMORY NOTE:', null);

  const renderWithCitations = (text) => {
    if (!text) return null;
    const parts = [];
    const regex = /\(Report:\s*([0-9]{4}-[0-9]{2}-[0-9]{2}),\s*Type:\s*([^\)]+)\)/g;
    
    let lastIdx = 0;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
       parts.push(<span key={`text-${lastIdx}`}>{text.substring(lastIdx, match.index)}</span>);
       
       const rDate = match[1];
       const rType = match[2];
       
       parts.push(
         <span 
           key={`cite-${match.index}`}
           onClick={() => onCitationClick({ report_date: rDate, report_type: rType })}
           className="bg-white border border-border rounded px-1.5 py-0.5 text-[11px] font-mono cursor-pointer hover:border-primary inline-flex items-center text-primary/80 mx-1 align-baseline shadow-sm"
         >
           {match[0]}
         </span>
       );
       lastIdx = match.index + match[0].length;
    }
    parts.push(<span key={`text-end-${lastIdx}`}>{text.substring(lastIdx)}</span>);
    return <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{parts}</p>;
  };

  const renderQuestionsArray = (textBlock) => {
    if (!textBlock) return null;
    const items = textBlock.split('\n').filter(l => l.trim().match(/^[0-9]+[.-]|^[*-]/));
    if (items.length === 0) {
       return <p className="text-sm text-gray-700">{textBlock}</p>;
    }
    return (
      <ol className="list-decimal ml-4 text-sm text-gray-700 space-y-2">
        {items.map((item, idx) => {
          const clean = item.replace(/^[0-9]+[.-]\s*/, '').replace(/^[*-]\s*/, '').trim();
          return <li key={idx} className="leading-relaxed pl-1">{clean}</li>;
        })}
      </ol>
    );
  };

  const submitFeedbackPayload = async (rateVal, reasonStr) => {
    try {
      await saveFeedback({
        question,
        response: content,
        rating: rateVal,
        reason: reasonStr,
        person_id: personId || null
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleRating = async (val) => {
    if (submitted || isStreaming) return;
    setRating(val);
    if (val === 'helpful') {
      setSubmitted(true);
      setShowThanks(true);
      submitFeedbackPayload(val, null);
    } else {
      setShowReason(true);
    }
  };

  const handleReasonSubmit = async () => {
    if (!reason || submitted) return;
    const finalReason = reason === 'Other' ? `Other: ${otherText}` : reason;
    setSubmitted(true);
    submitFeedbackPayload('not_helpful', finalReason);
  };

  const reasonOptions = [
    "Response was too generic",
    "Cited the wrong information",
    "Missed important context",
    "Response was too long",
    "Tone was off",
    "Other"
  ];

  return (
    <div className="bg-muted rounded-xl p-5 border-l-4 border-primary shadow-sm mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300 transition-all">
      <div className="space-y-5">
        
        {clarification && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-yellow-800 mb-2">Clarification Needed</h4>
            <p className="text-sm text-yellow-900 leading-relaxed">{clarification}</p>
          </div>
        )}

        {s1 && !clarification && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-900 mb-2">History</h4>
            {renderWithCitations(s1)}
          </div>
        )}
        
        {s2 && !clarification && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-900 mb-2">Reasoning</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{s2}</p>
          </div>
        )}

        {s3 && !clarification && (
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-text-muted mb-1">What would help answer this better:</h4>
            <p className="text-sm text-text-muted italic leading-relaxed">{s3}</p>
          </div>
        )}

        {s4 && !clarification && (
          <div className="border-l-4 border-primary/50 bg-white rounded-lg p-4 mt-4 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 block">Questions for Your Doctor</h4>
            {renderQuestionsArray(s4)}
          </div>
        )}

        {memoryNote && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-blue-800 mb-2">Memory Note</h4>
            <p className="text-sm text-blue-900 leading-relaxed">{memoryNote}</p>
          </div>
        )}

        {s5 && !clarification && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs text-text-subtle italic text-gray-500">
              "This reasoning is based on your uploaded records and is not medical advice. Please discuss any decisions with your doctor."
            </p>
          </div>
        )}

        {/* Catch-all */}
        {!s1 && !s2 && !s3 && !s4 && !s5 && !clarification && content && (
           <div className="text-sm text-gray-700 whitespace-pre-wrap">{content}</div>
        )}

        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-primary ml-1 align-middle animate-pulse opacity-70 rounded-full" />
        )}
      </div>

      {/* Feedback Section */}
      {!isStreaming && content && !clarification && (
        <div className="border-t border-border mt-4 pt-4">
          <p className="text-xs text-text-muted mb-2">Was this helpful?</p>
          <div className="flex items-center gap-2">
            {(!submitted || rating === 'helpful') && (
              <button 
                onClick={() => handleRating('helpful')}
                className={`border rounded-lg px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${rating === 'helpful' ? 'bg-green-50 border-green-200 text-green-700' : 'border-border text-gray-700 hover:bg-card'}`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${rating === 'helpful' && 'fill-current'}`} />
                Yes
              </button>
            )}
            
            {(!submitted || rating === 'not_helpful') && (
              <button 
                onClick={() => handleRating('not_helpful')}
                className={`border rounded-lg px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${rating === 'not_helpful' ? 'bg-red-50 border-red-200 text-red-700' : 'border-border text-gray-700 hover:bg-card'}`}
              >
                <ThumbsDown className={`w-3.5 h-3.5 ${rating === 'not_helpful' && 'fill-current'}`} />
                No
              </button>
            )}

            {showThanks && (
              <span className="text-xs text-success animate-in fade-in ml-2">Thanks!</span>
            )}
            {submitted && rating === 'not_helpful' && !showReason && (
              <span className="text-xs text-success animate-in fade-in ml-2">Thanks for the feedback</span>
            )}
          </div>

          {showReason && !submitted && rating === 'not_helpful' && (
            <div className="bg-card border border-border rounded-lg p-3 mt-3 animate-in fade-in slide-in-from-top-1">
              <p className="text-xs font-medium text-gray-900 mb-2">What went wrong?</p>
              <div className="flex flex-col gap-2 mb-3">
                {reasonOptions.map((opt, i) => (
                  <label key={i} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-gray-900">
                    <input 
                      type="radio" 
                      name="feedbackReason" 
                      value={opt} 
                      checked={reason === opt}
                      onChange={(e) => setReason(e.target.value)}
                      className="text-primary focus:ring-primary h-3.5 w-3.5"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              
              {reason === 'Other' && (
                <textarea 
                  placeholder="Tell us more..."
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  className="w-full text-sm rounded border border-border p-2 mb-2 min-h-16 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              )}

              <button 
                onClick={handleReasonSubmit}
                disabled={!reason}
                className="text-xs bg-primary text-white rounded px-3 py-1.5 hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Submit
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
