import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface SearchableSelectProps {
  options: string[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  label?: string;
  multi?: boolean;
  allowCustom?: boolean;
  disabled?: boolean;
  className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Search or type...',
  label,
  multi = false,
  allowCustom = true,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedArray = Array.isArray(value) ? value : value ? [value] : [];
  const normalizedOptions = options.map(opt => opt.toLowerCase());
  const searchLower = searchQuery.toLowerCase();

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchLower)
  );

  const showAddCustom = allowCustom && searchQuery.trim() && !filteredOptions.some(opt => opt.toLowerCase() === searchLower);

  const displayOptions = filteredOptions.length > 0 ? filteredOptions : (showAddCustom ? [] : options);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      return;
    }

    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % (displayOptions.length + (showAddCustom ? 1 : 0)));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + (displayOptions.length + (showAddCustom ? 1 : 0))) % (displayOptions.length + (showAddCustom ? 1 : 0)));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex < displayOptions.length) {
          handleSelect(displayOptions[highlightedIndex]);
        } else if (showAddCustom) {
          handleSelect(searchQuery.trim());
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (selectedValue: string) => {
    if (multi) {
      if (selectedArray.includes(selectedValue)) {
        onChange(selectedArray.filter(v => v !== selectedValue));
      } else {
        onChange([...selectedArray, selectedValue]);
      }
      setSearchQuery('');
      setHighlightedIndex(0);
    } else {
      onChange(selectedValue);
      setSearchQuery('');
      setIsOpen(false);
      setHighlightedIndex(0);
    }
  };

  const handleRemoveTag = (removedValue: string) => {
    if (multi) {
      onChange(selectedArray.filter(v => v !== removedValue));
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2 font-[Tajawal]">
          {label}
        </label>
      )}

      <div className="relative">
        <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-transparent transition-all">
          <div className="flex flex-wrap gap-2 flex-1">
            {multi && selectedArray.length > 0 ? (
              selectedArray.map(item => (
                <div key={item} className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full flex items-center gap-2 text-sm font-[Tajawal]">
                  {item}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(item)}
                    className="hover:text-teal-900"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            ) : null}
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
                setHighlightedIndex(0);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={selectedArray.length === 0 ? placeholder : ''}
              disabled={disabled}
              className="flex-1 min-w-32 outline-none bg-transparent font-[Tajawal]"
            />
          </div>
          <ChevronDown
            size={18}
            className={`text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          />
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            {displayOptions.length > 0 ? (
              displayOptions.map((option, index) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-4 py-2.5 transition-colors font-[Tajawal] ${
                    highlightedIndex === index ? 'bg-teal-50' : ''
                  } ${
                    selectedArray.includes(option) ? 'bg-teal-100 text-teal-700 font-semibold' : 'hover:bg-gray-50'
                  }`}
                >
                  {option}
                </button>
              ))
            ) : null}

            {showAddCustom && (
              <button
                type="button"
                onClick={() => handleSelect(searchQuery.trim())}
                className={`w-full text-left px-4 py-2.5 transition-colors font-[Tajawal] border-t border-gray-200 text-teal-600 hover:bg-teal-50 ${
                  highlightedIndex === displayOptions.length ? 'bg-teal-50' : ''
                }`}
              >
                ➕ إضافة: "{searchQuery.trim()}"
              </button>
            )}

            {displayOptions.length === 0 && !showAddCustom && (
              <div className="px-4 py-8 text-center text-gray-500 font-[Tajawal]">
                لا توجد نتائج
              </div>
            )}
          </div>
        )}
      </div>

      {!multi && value && selectedArray.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 font-[Tajawal]">
          تم التحديد: <span className="font-semibold text-gray-700">{selectedArray[0]}</span>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
