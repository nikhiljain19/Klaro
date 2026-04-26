import React from 'react';

export default function QuestionBubble({ text }) {
  return (
    <div className="w-full flex justify-end mb-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-primary text-white rounded-xl rounded-tr-sm px-4 py-3 text-sm max-w-lg mb-2 shadow-sm whitespace-pre-wrap">
        {text}
      </div>
    </div>
  );
}
