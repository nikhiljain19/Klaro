import React from 'react';

export default function PersonSelector({ people = [], selectedPersonId, onSelect }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Asking about</h3>
      <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
        <button
          onClick={() => onSelect(null)}
          className={`flex-shrink-0 md:w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
            selectedPersonId === null
              ? 'bg-primary/10 text-primary border-l-4 border-primary font-medium'
              : 'text-gray-700 hover:bg-muted cursor-pointer border-l-4 border-transparent'
          }`}
        >
          <div className="font-medium">Everyone</div>
        </button>
        {people.map(person => (
          <button
            key={person.id}
            onClick={() => onSelect(person.id)}
            className={`flex-shrink-0 md:w-full text-left rounded-lg px-3 py-2 text-sm transition-colors flex flex-col ${
              selectedPersonId === person.id
                ? 'bg-primary/10 text-primary border-l-4 border-primary font-medium'
                : 'text-gray-700 hover:bg-muted cursor-pointer border-l-4 border-transparent'
            }`}
          >
            <span className="font-medium">{person.name}</span>
            {person.relationship && (
              <span className="text-xs text-text-muted mt-0.5">{person.relationship}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
