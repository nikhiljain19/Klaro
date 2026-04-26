import React, { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import QuestionBubble from './QuestionBubble';
import AIResponseCard from './AIResponseCard';
import SuggestedQuestions from './SuggestedQuestions';

export default function ConversationArea({ 
  previousQA = [], 
  streamingQuestion = null, 
  streamingText = '', 
  isStreaming = false,
  selectedPersonName = '',
  selectedPersonId,
  onCitationClick,
  onSuggest
}) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [previousQA, streamingQuestion, streamingText]);

  const hasHistory = previousQA.length > 0 || streamingQuestion;

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-8 md:px-8 w-full max-w-4xl mx-auto scroll-smooth">
      {!hasHistory ? (
        <div className="mt-20 flex flex-col items-center justify-center animate-in fade-in duration-500">
          <Sparkles className="w-10 h-10 text-text-subtle mb-4" />
          <h2 className="text-base font-medium text-gray-900 text-center">
            Ask anything about your medical history
          </h2>
          <p className="text-sm text-text-muted mt-1 text-center max-w-md">
            Select a person on the left or ask about everyone. Klaro will help you think through your health situation.
          </p>
          <div className="w-full mt-8 flex justify-center">
             <SuggestedQuestions onSelect={onSuggest} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col space-y-2 pb-6">
          {/* Render past Q&A */}
          {previousQA.map((qa, i) => (
             <div key={i} className="flex flex-col mb-4">
               <QuestionBubble text={qa.question} />
               <AIResponseCard 
                 content={qa.answer} 
                 isStreaming={false} 
                 onCitationClick={onCitationClick}
                 question={qa.question}
                 personId={selectedPersonId}
               />
             </div>
          ))}

          {/* Render active stream / pending request */}
          {streamingQuestion && (
             <div className="flex flex-col mb-4">
               <QuestionBubble text={streamingQuestion} />
               <AIResponseCard 
                 content={streamingText} 
                 isStreaming={isStreaming} 
                 onCitationClick={onCitationClick}
                 question={streamingQuestion}
                 personId={selectedPersonId}
               />
             </div>
          )}
        </div>
      )}
    </div>
  );
}
