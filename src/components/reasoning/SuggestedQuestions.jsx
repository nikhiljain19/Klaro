import React from 'react';

const SUGGESTIONS = [
  "What are my most recent abnormal results?",
  "Help me prepare for my next doctor visit",
  "What trends do you see in my reports over time?"
];

export default function SuggestedQuestions({ onSelect }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
      {SUGGESTIONS.map((q, i) => (
        <button
          key={i}
          onClick={() => onSelect(q)}
          className="bg-muted border border-border rounded-full px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-muted/80 hover:border-border/80 transition-colors"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
