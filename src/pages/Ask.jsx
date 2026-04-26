import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import PersonSelector from '../components/reasoning/PersonSelector';
import ConversationArea from '../components/reasoning/ConversationArea';
import QuestionInput from '../components/reasoning/QuestionInput';
import ReportDetailPanel from '../components/reports/ReportDetailPanel';
import { askQuestion } from '../lib/gemini';

export default function Ask({ reports = [], people = [] }) {
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  
  const [previousQA, setPreviousQA] = useState([]);
  const [streamingQuestion, setStreamingQuestion] = useState(null);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  const [selectedReport, setSelectedReport] = useState(null);

  // Clear QA when person selection changes
  useEffect(() => {
    setPreviousQA([]);
    setStreamingQuestion(null);
    setStreamingText('');
    setIsStreaming(false);
  }, [selectedPersonId]);

  const handleSubmit = async (questionText) => {
    if (isStreaming || !questionText.trim()) return;

    setStreamingQuestion(questionText);
    setStreamingText('');
    setIsStreaming(true);

    try {
      const stream = await askQuestion(questionText, selectedPersonId, reports, people, previousQA);

      let fullText = '';
      for await (const chunk of stream) {
        const text = chunk.text();
        fullText += text;
        setStreamingText(fullText);
      }

      setPreviousQA(prev => [...prev, { question: questionText, answer: fullText }]);
      setStreamingQuestion(null);
      setStreamingText('');

    } catch (error) {
      console.error(error);
      toast.error("Couldn't process your question right now. Try again in a moment.");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCitationClick = (citeData) => {
    const { report_date, report_type } = citeData;
    // Map to actual report object checking date and type boundaries
    const target = reports.find(r => 
      r.report_type === report_type && 
      r.report_date && r.report_date.startsWith(report_date)
    );
    if (target) {
      setSelectedReport(target);
    } else {
      toast.error('The referenced report could not be found.');
    }
  };

  const hasReports = reports.length > 0;
  
  let pName = null;
  if (selectedPersonId) {
    pName = people.find(p => p.id === selectedPersonId)?.name;
  }

  const placeholderText = pName 
    ? `Ask about ${pName}'s records...`
    : "Ask about anyone's medical history...";

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-73px)] w-full overflow-hidden bg-surface">
      
      {/* Left Sidebar (Desktop) / Top Piller (Mobile) */}
      <div className="w-full md:w-64 shrink-0 bg-card border-b md:border-b-0 md:border-r border-border p-4 md:p-6 overflow-y-auto z-10 shadow-sm md:shadow-none">
        <PersonSelector 
          people={people} 
          selectedPersonId={selectedPersonId} 
          onSelect={setSelectedPersonId} 
        />
      </div>

      {/* Main Conversation Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <ConversationArea 
          previousQA={previousQA}
          streamingQuestion={streamingQuestion}
          streamingText={streamingText}
          isStreaming={isStreaming}
          selectedPersonName={pName}
          selectedPersonId={selectedPersonId}
          onCitationClick={handleCitationClick}
          onSuggest={handleSubmit}
        />
        
        <div className="shrink-0 w-full p-4 md:p-6 bg-gradient-to-t from-surface via-surface to-transparent pt-8">
           <div className="max-w-4xl mx-auto">
             <QuestionInput 
               onSubmit={handleSubmit}
               disabled={isStreaming || !hasReports}
               disabledReason={!hasReports ? "Add a few reports first so I have your history to work with." : null}
               placeholderText={placeholderText}
             />
           </div>
        </div>
      </div>

      <ReportDetailPanel 
        report={selectedReport} 
        isOpen={!!selectedReport} 
        onClose={() => setSelectedReport(null)} 
      />
    </div>
  );
}
