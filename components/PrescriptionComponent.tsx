import React, { useState } from 'react';
import { Plus, Trash2, Search, Pill } from 'lucide-react';
import { PrescriptionItem } from '../types';
import { EGYPTIAN_MARKET_DRUGS, DrugEntry, searchDrugs, getDrugsByCategory } from '../data/egyptian_drugs';

interface PrescriptionComponentProps {
  prescriptions: PrescriptionItem[];
  onPrescriptionsChange: (prescriptions: PrescriptionItem[]) => void;
}

const PrescriptionComponent: React.FC<PrescriptionComponentProps> = ({
  prescriptions,
  onPrescriptionsChange
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDrug, setSelectedDrug] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customDose, setCustomDose] = useState<string>('');

  const categories = Object.keys(EGYPTIAN_MARKET_DRUGS);
  const categoryDrugs = selectedCategory ? getDrugsByCategory(selectedCategory) : [];
  const searchResults = searchQuery ? searchDrugs(searchQuery) : [];

  const handleAddDrug = () => {
    if (!selectedDrug) return;

    let drugEntry: DrugEntry | undefined;

    // Find the drug entry
    if (searchQuery) {
      drugEntry = searchResults.find(d => d.tradeName === selectedDrug);
    } else {
      drugEntry = categoryDrugs.find(d => d.tradeName === selectedDrug);
    }

    if (!drugEntry) return;

    const dose = customDose || drugEntry.dose;

    const newPrescription: PrescriptionItem = {
      category: drugEntry.category,
      drug: drugEntry.tradeName,
      dose: dose
    };

    onPrescriptionsChange([...prescriptions, newPrescription]);

    // Reset form
    setSelectedDrug('');
    setCustomDose('');
    setSearchQuery('');
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
      <div className="flex items-center gap-2 mb-4">
        <Pill className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Prescription</h3>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search for medication..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedCategory('');
            setSelectedDrug('');
          }}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Category Selection (only show if not searching) */}
      {!searchQuery && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setSelectedDrug('');
              }}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Drug Selection */}
      {(selectedCategory || searchQuery) && (
        <div className="space-y-3">
          <select
            value={selectedDrug}
            onChange={(e) => setSelectedDrug(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="">
              {searchQuery ? 'Select from search results...' : 'Select medication...'}
            </option>
            {(searchQuery ? searchResults : categoryDrugs).map(drug => (
              <option key={drug.tradeName} value={drug.tradeName}>
                {drug.tradeName} ({drug.active})
              </option>
            ))}
          </select>

          {/* Custom Dose Input */}
          {selectedDrug && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dose (leave empty for standard dose)
              </label>
              <input
                type="text"
                value={customDose}
                onChange={(e) => setCustomDose(e.target.value)}
                placeholder="Custom dose instructions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          <button
            onClick={handleAddDrug}
            disabled={!selectedDrug}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add to Prescription
          </button>
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