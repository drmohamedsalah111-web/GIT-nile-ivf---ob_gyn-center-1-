import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Pill, Printer, ChevronDown } from 'lucide-react';
import { PrescriptionItem } from '../types';
import { EGYPTIAN_MARKET_DRUGS, DrugEntry, searchDrugs, getDrugsByCategory, getAllDrugs } from '../data/egyptian_drugs';
import { EGYPTIAN_DRUGS_ARABIC } from '../constants';

interface PrescriptionComponentProps {
  prescriptions: PrescriptionItem[];
  onPrescriptionsChange: (prescriptions: PrescriptionItem[]) => void;
  onPrint?: () => void;
  showPrintButton?: boolean;
}

const PrescriptionComponent: React.FC<PrescriptionComponentProps> = ({
  prescriptions,
  onPrescriptionsChange,
  onPrint,
  showPrintButton = false
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [customDose, setCustomDose] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get suggestions based on search query
  const getSuggestions = (): DrugEntry[] => {
    if (!searchQuery.trim()) {
      // Show common categories when no search query
      const commonCategories = ['Antibiotics', 'Analgesics', 'Pregnancy Supplements', 'Luteal Support'];
      return commonCategories.flatMap(category => getDrugsByCategory(category).slice(0, 3));
    }
    return searchDrugs(searchQuery);
  };

  const suggestions = getSuggestions();

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDropdownOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
            handleSelectDrug(suggestions[highlightedIndex]);
          }
          break;
        case 'Escape':
          setIsDropdownOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDropdownOpen, highlightedIndex, suggestions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectDrug = (drug: DrugEntry) => {
    const dose = customDose || drug.dose;

    const newPrescription: PrescriptionItem = {
      category: drug.category,
      drug: drug.tradeName,
      dose: dose
    };

    onPrescriptionsChange([...prescriptions, newPrescription]);

    // Reset form
    setSearchQuery('');
    setCustomDose('');
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
  };

  const getArabicDosage = (drugName: string): string => {
    for (const category in EGYPTIAN_DRUGS_ARABIC) {
      const categoryData = EGYPTIAN_DRUGS_ARABIC[category as keyof typeof EGYPTIAN_DRUGS_ARABIC];
      if (categoryData && drugName in categoryData) {
        return categoryData[drugName as keyof typeof categoryData]?.dose || '';
      }
    }
    return '';
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? <mark key={index} className="bg-yellow-200">{part}</mark> : part
    );
  };

  const handleRemoveDrug = (index: number) => {
    const updatedPrescriptions = prescriptions.filter((_, i) => i !== index);
    onPrescriptionsChange(updatedPrescriptions);
  };

  const handleUpdateDose = (index: number, newDose: string) => {
    const updatedPrescriptions = prescriptions.map((prescription, i) =>
      i === index ? { ...prescription, dose: newDose } : prescription
    );
    onPrescriptionsChange(updatedPrescriptions);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Pill className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Prescription</h3>
        </div>
        {showPrintButton && prescriptions.length > 0 && onPrint && (
          <button
            onClick={onPrint}
            className="flex items-center gap-2 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Prescription
          </button>
        )}
      </div>

      {/* Smart Combobox */}
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for medication... (e.g., Augmentin, Paracetamol)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
          />
          <ChevronDown
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </div>

        {/* Dropdown */}
        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.length > 0 ? (
              suggestions.map((drug, index) => (
                <div
                  key={`${drug.tradeName}-${index}`}
                  onClick={() => handleSelectDrug(drug)}
                  className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-purple-50 ${
                    index === highlightedIndex ? 'bg-purple-100' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    {highlightMatch(drug.tradeName, searchQuery)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {highlightMatch(drug.active, searchQuery)} ({drug.category})
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    EN: {drug.dose}
                  </div>
                  {getArabicDosage(drug.tradeName) && (
                    <div className="text-xs text-blue-600 mt-1" dir="rtl">
                      AR: {getArabicDosage(drug.tradeName)}
                    </div>
                  )}
                </div>
              ))
            ) : searchQuery ? (
              <div className="px-4 py-3 text-gray-500 text-center">
                No medications found for "{searchQuery}"
              </div>
            ) : (
              <div className="px-4 py-3 text-gray-500 text-center">
                Start typing to search medications...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Dose Input (shown when there's a search query) */}
      {searchQuery && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custom Dose (optional - leave empty for standard dose)
          </label>
          <input
            type="text"
            value={customDose}
            onChange={(e) => setCustomDose(e.target.value)}
            placeholder="e.g., 1 tablet twice daily after meals"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
      )}

      {/* Current Prescriptions */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Current Prescriptions</h4>

        {prescriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Pill className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No medications prescribed yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {prescriptions.map((prescription, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{prescription.drug}</div>
                    <div className="text-sm text-purple-600 mt-1">{prescription.category}</div>
                    {getArabicDosage(prescription.drug) && (
                      <div className="text-xs text-blue-600 mt-1 p-1 bg-blue-50 rounded" dir="rtl">
                        سيتم طباعته: {getArabicDosage(prescription.drug)}
                      </div>
                    )}
                    <input
                      type="text"
                      value={prescription.dose}
                      onChange={(e) => handleUpdateDose(index, e.target.value)}
                      className="w-full mt-2 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                      placeholder="Enter dose..."
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveDrug(index)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionComponent;