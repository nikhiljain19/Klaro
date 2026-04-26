import React from 'react';
import { X, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const TYPE_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Blood Tests", value: "blood_test" },
  { label: "Imaging", value: "imaging" },
  { label: "Consult", value: "consult" }
];

const DATE_OPTIONS = [
  { label: "All time", value: "all" },
  { label: "Last 6 months", value: "6m" },
  { label: "Last year", value: "1y" }
];

export default function FilterBar({ 
  reports = [],
  people = [],
  activeType, 
  activeDateRange, 
  activePatient = 'all',
  onTypeChange, 
  onDateRangeChange, 
  onPatientChange,
  onClearAll 
}) {
  const isTypeActive = activeType !== "all";
  const isDateActive = activeDateRange !== "all";
  const isPatientActive = activePatient !== "all";
  const hasActiveFilters = isTypeActive || isDateActive || isPatientActive;

  return (
    <div className="flex flex-col gap-3">
      {/* People Filter Row */}
      {people.length > 0 && (
        <div className="flex gap-2 items-center overflow-x-auto whitespace-nowrap scrollbar-hide pb-2 border-b border-border">
          <span className="text-xs font-medium uppercase tracking-wide text-text-muted mr-3">People:</span>
          <button
            onClick={() => onPatientChange('all')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150 cursor-pointer ${
              activePatient === 'all' 
                ? 'bg-primary text-white border border-primary' 
                : 'bg-card border border-border text-text-muted hover:border-primary hover:text-primary'
            }`}
          >
            Everyone
          </button>
          
          {people.map(person => {
            const isActive = activePatient === person.id;
            return (
              <button
                key={person.id}
                onClick={() => onPatientChange(person.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150 cursor-pointer ${
                  isActive 
                    ? 'bg-primary text-white border border-primary' 
                    : 'bg-card border border-border text-text-muted hover:border-primary hover:text-primary'
                }`}
              >
                {person.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Pills Row */}
      <div className="flex gap-2 items-center overflow-x-auto whitespace-nowrap scrollbar-hide pb-1">
        {TYPE_OPTIONS.map((opt) => {
          const isActive = activeType === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onTypeChange(opt.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-150 cursor-pointer ${
                isActive 
                  ? 'bg-primary text-white border border-primary' 
                  : 'bg-card border border-border text-text-muted hover:border-primary hover:text-primary'
              }`}
            >
              {opt.label}
            </button>
          );
        })}

        <div className="mx-1 h-6 w-px bg-border shrink-0"></div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-150 cursor-pointer flex items-center gap-1 ${
                isDateActive
                  ? 'bg-primary text-white border border-primary'
                  : 'bg-card border border-border text-text-muted hover:border-primary hover:text-primary'
              }`}>
              {DATE_OPTIONS.find(o => o.value === activeDateRange)?.label || 'All time'}
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-card border-border shadow-sm rounded-lg min-w-[150px]">
            {DATE_OPTIONS.map((opt) => (
              <DropdownMenuItem 
                key={opt.value}
                onClick={() => onDateRangeChange(opt.value)}
                className="text-sm px-3 py-2 cursor-pointer hover:bg-muted focus:bg-muted"
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active Chips Row */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {isTypeActive && (
            <div className="bg-muted border border-border rounded-full px-3 py-1 text-xs text-text-muted flex items-center">
              Type: {TYPE_OPTIONS.find(o => o.value === activeType)?.label}
              <button onClick={() => onTypeChange('all')} className="ml-1 hover:text-gray-900"><X className="w-3 h-3" /></button>
            </div>
          )}
          {isDateActive && (
            <div className="bg-muted border border-border rounded-full px-3 py-1 text-xs text-text-muted flex items-center">
              Date: {DATE_OPTIONS.find(o => o.value === activeDateRange)?.label}
              <button onClick={() => onDateRangeChange('all')} className="ml-1 hover:text-gray-900"><X className="w-3 h-3" /></button>
            </div>
          )}
          {isPatientActive && (
            <div className="bg-muted border border-border rounded-full px-3 py-1 text-xs text-text-muted flex items-center">
              Person: {people.find(p => p.id === activePatient)?.name || 'Unknown'}
              <button onClick={() => onPatientChange('all')} className="ml-1 hover:text-gray-900"><X className="w-3 h-3" /></button>
            </div>
          )}
          <button 
            onClick={onClearAll}
            className="text-primary text-sm ml-2 font-medium hover:text-primary/80 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
