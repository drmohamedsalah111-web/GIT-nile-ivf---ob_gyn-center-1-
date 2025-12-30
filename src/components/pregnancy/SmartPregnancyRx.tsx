// ============================================================
// SMART PREGNANCY PRESCRIPTION COMPONENT
// ============================================================
// Purpose: Quick and easy prescription writing for antenatal care
// Features: Color-coded categories, fast search, Egyptian market drugs
// ============================================================

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { medicationsService, NewMedicationInput } from '../../services/medicationsService';
import {
  Search,
  Plus,
  X,
  Pill,
  Check,
  ChevronDown,
  ChevronRight,
  Trash2,
  Copy,
  Printer,
  Clock,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

// ============================================================
// TYPES
// ============================================================

interface Medication {
  id: string;
  trade_name: string;
  generic_name: string;
  manufacturer: string;
  category: string;
  category_color: string;
  form: string;
  strength: string;
  default_dose: string;
  default_frequency: string;
  default_duration: string;
  warnings: string | null;
  use_count: number;
}

interface PrescriptionItem {
  medication: Medication;
  dose: string;
  frequency: string;
  duration: string;
  notes: string;
}

interface SmartPregnancyRxProps {
  patientId: string;
  patientName: string;
  gestationalAge?: string;
  onSave?: (prescription: PrescriptionItem[]) => void;
  onClose?: () => void;
}

// ============================================================
// CATEGORY CONFIG WITH COLORS
// ============================================================

const CATEGORY_CONFIG: Record<string, { color: string; icon: string; order: number }> = {
  'Folic Acid': { color: '#8B5CF6', icon: '💜', order: 1 },
  'Vitamins & Supplements': { color: '#10B981', icon: '💚', order: 2 },
  'Iron & Calcium': { color: '#EF4444', icon: '❤️', order: 3 },
  'Anti-Nausea': { color: '#F59E0B', icon: '🧡', order: 4 },
  'Progesterone Support': { color: '#EC4899', icon: '💗', order: 5 },
  'Antihypertensive': { color: '#3B82F6', icon: '💙', order: 6 },
  'Antidiabetic': { color: '#06B6D4', icon: '🩵', order: 7 },
  'Antibiotics': { color: '#F97316', icon: '🧡', order: 8 },
  'Antifungal': { color: '#84CC16', icon: '💚', order: 9 },
  'Pain Relief': { color: '#6366F1', icon: '💜', order: 10 },
  'Antispasmodic': { color: '#14B8A6', icon: '💚', order: 11 },
  'Laxatives': { color: '#A855F7', icon: '💜', order: 12 },
  'Anticoagulants': { color: '#DC2626', icon: '❤️', order: 13 },
  'Thyroid': { color: '#0EA5E9', icon: '💙', order: 14 },
  'Tocolytics': { color: '#D946EF', icon: '💗', order: 15 },
  'Corticosteroids': { color: '#64748B', icon: '🩶', order: 16 },
  'Other': { color: '#78716C', icon: '🤎', order: 17 }
};

// ============================================================
// FREQUENCY OPTIONS
// ============================================================

const FREQUENCY_OPTIONS = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'At bedtime',
  'Before meals',
  'After meals',
  'As needed',
  'Weekly',
  'Monthly'
];

const DURATION_OPTIONS = [
  '3 days',
  '5 days',
  '7 days',
  '10 days',
  '14 days',
  '1 month',
  '3 months',
  'Throughout pregnancy',
  'Until delivery',
  'First trimester',
  'Second trimester',
  'Third trimester',
  'As needed',
  'Continuous'
];

// ============================================================
// MAIN COMPONENT
// ============================================================

export const SmartPregnancyRx: React.FC<SmartPregnancyRxProps> = ({
  patientId,
  patientName,
  gestationalAge,
  onSave,
  onClose
}) => {
  // State
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMed, setNewMed] = useState<Partial<NewMedicationInput> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [prescription, setPrescription] = useState<PrescriptionItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<number | null>(null);

  // ============================================================
  // FETCH MEDICATIONS
  // ============================================================

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      const data = await medicationsService.fetchAll();
      setMedications(data || []);
    } catch (err) {
      console.error('Error fetching medications:', err);
      toast.error('Failed to load medications');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FILTERING & GROUPING
  // ============================================================

  const filteredMedications = useMemo(() => {
    let result = medications;

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        med =>
          med.trade_name.toLowerCase().includes(search) ||
          med.generic_name.toLowerCase().includes(search)
      );
    }

    // Filter by category
    if (selectedCategory) {
      result = result.filter(med => med.category === selectedCategory);
    }

    return result;
  }, [medications, searchTerm, selectedCategory]);

  const groupedMedications = useMemo(() => {
    const groups: Record<string, Medication[]> = {};
    
    filteredMedications.forEach(med => {
      if (!groups[med.category]) {
        groups[med.category] = [];
      }
      groups[med.category].push(med);
    });

    // Sort categories by predefined order
    return Object.entries(groups).sort((a, b) => {
      const orderA = CATEGORY_CONFIG[a[0]]?.order || 99;
      const orderB = CATEGORY_CONFIG[b[0]]?.order || 99;
      return orderA - orderB;
    });
  }, [filteredMedications]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const addToPrescription = useCallback((medication: Medication) => {
    // Check if already in prescription
    if (prescription.some(item => item.medication.id === medication.id)) {
      toast.error('Already in prescription');
      return;
    }

    const newItem: PrescriptionItem = {
      medication,
      dose: medication.default_dose || '1 tablet',
      frequency: medication.default_frequency || 'Once daily',
      duration: medication.default_duration || '1 month',
      notes: ''
    };

    setPrescription(prev => [...prev, newItem]);
    toast.success(`${medication.trade_name} added`);

    // Increment use count
    supabase.rpc('increment_medication_use', { med_id: medication.id }).catch(console.error);
  }, [prescription]);

  // ============================================================
  // AUTOCOMPLETE SUGGESTIONS
  // ============================================================
  const suggestionResults = useMemo(() => {
    if (!searchTerm) return [];
    const s = searchTerm.toLowerCase();
    return medications.filter(m => (
      m.trade_name.toLowerCase().includes(s) || m.generic_name.toLowerCase().includes(s) || (m.category||'').toLowerCase().includes(s)
    )).slice(0, 8);
  }, [medications, searchTerm]);

  // ============================================================
  // ADD NEW MEDICATION HANDLERS
  // ============================================================
  const openAddModalFor = (prefill?: Partial<NewMedicationInput>) => {
    setNewMed(prefill || { category: 'Other', category_color: '#78716C', form: 'Tablet', strength: '' });
    setShowAddModal(true);
  };

  const handleSaveNewMedication = async () => {
    if (!newMed || !newMed.trade_name || !newMed.generic_name || !newMed.category || !newMed.category_color || !newMed.form || !newMed.strength) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      const created = await medicationsService.addMedication(newMed as NewMedicationInput);
      toast.success('Medication added to master list');
      // refresh
      const all = await medicationsService.fetchAll();
      setMedications(all || []);
      // auto-add to prescription
      addToPrescription(created as any);
      setShowAddModal(false);
      setNewMed(null);
    } catch (err) {
      console.error('Failed to add medication:', err);
      toast.error('Failed to add medication');
    }
  };

  const removeFromPrescription = useCallback((index: number) => {
    setPrescription(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updatePrescriptionItem = useCallback((index: number, updates: Partial<PrescriptionItem>) => {
    setPrescription(prev => 
      prev.map((item, i) => i === index ? { ...item, ...updates } : item)
    );
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (prescription.length === 0) {
      toast.error('Add at least one medication');
      return;
    }
    onSave?.(prescription);
    toast.success('Prescription saved!');
  }, [prescription, onSave]);

  const copyToClipboard = useCallback(() => {
    const text = prescription.map(item => 
      `${item.medication.trade_name} (${item.medication.strength}) - ${item.dose} ${item.frequency} for ${item.duration}`
    ).join('\n');
    
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  }, [prescription]);

  // ============================================================
  // RENDER: Category Badge
  // ============================================================

  const CategoryBadge: React.FC<{ category: string; count?: number }> = ({ category, count }) => {
    const config = CATEGORY_CONFIG[category] || { color: '#78716C', icon: '💊' };
    const isSelected = selectedCategory === category;
    
    return (
      <button
        onClick={() => setSelectedCategory(isSelected ? null : category)}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
          transition-all duration-200 whitespace-nowrap shadow-sm
          ${isSelected ? 'ring-2 ring-offset-2' : 'hover:scale-105'}
        `}
        style={{
          backgroundColor: isSelected ? config.color : `${config.color}20`,
          color: isSelected ? 'white' : config.color,
          borderColor: config.color
        }}
      >
        <span>{config.icon}</span>
        <span>{category}</span>
        {count !== undefined && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.6)' }}>
            {count}
          </span>
        )}
      </button>
    );
  };

  // ============================================================
  // RENDER: Medication Card
  // ============================================================

  const MedicationCard: React.FC<{ medication: Medication }> = ({ medication }) => {
    const config = CATEGORY_CONFIG[medication.category] || { color: '#78716C' };
    const isInPrescription = prescription.some(item => item.medication.id === medication.id);

    return (
      <div
        onClick={() => !isInPrescription && addToPrescription(medication)}
        className={`
          relative p-3 rounded-lg border-2 cursor-pointer
          transition-all duration-200 hover:shadow-md
          ${
            isInPrescription 
            ? 'bg-surface/50 border-borderColor cursor-not-allowed opacity-60' 
            : 'bg-surface hover:scale-[1.02] border-borderColor hover:shadow-lg'
          }
        `}
        style={{ 
          borderColor: isInPrescription ? undefined : config.color,
          borderLeftWidth: '4px'
        }}
      >
        {/* Trade Name */}
        <div className="font-semibold text-textMain">{medication.trade_name}</div>
        
        {/* Generic Name */}
        <div className="text-sm text-textSecondary italic">{medication.generic_name}</div>
        
        {/* Form & Strength */}
        <div className="flex items-center gap-2 mt-1">
          <span 
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: `${config.color}20`, color: config.color }}
          >
            {medication.form}
          </span>
          <span className="text-sm text-textSecondary font-medium">{medication.strength}</span>
        </div>

        {/* Default Dosing */}
        {medication.default_dose && (
          <div className="text-xs text-textSecondary/70 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {medication.default_dose} - {medication.default_frequency}
          </div>
        )}

        {/* Warning Badge */}
        {medication.warnings && (
          <div className="absolute top-2 right-2" title={medication.warnings}>
            <AlertCircle className="w-4 h-4 text-warning" />
          </div>
        )}

        {/* Added Check */}
        {isInPrescription && (
          <div className="absolute top-2 right-2">
            <Check className="w-5 h-5 text-success" />
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // RENDER: Prescription Item
  // ============================================================

  const PrescriptionItemRow: React.FC<{ item: PrescriptionItem; index: number }> = ({ item, index }) => {
    const config = CATEGORY_CONFIG[item.medication.category] || { color: '#78716C' };
    const isEditing = editingItem === index;

    return (
      <div 
        className="p-3 bg-surface rounded-lg border border-borderColor hover:shadow-md transition-all"
        style={{ borderLeftWidth: '4px', borderLeftColor: config.color }}
      >
        <div className="flex items-start justify-between">
          {/* Medication Info */}
          <div className="flex-1">
            <div className="font-semibold text-textMain flex items-center gap-2">
              {item.medication.trade_name}
              <span className="text-xs font-normal text-textSecondary">
                ({item.medication.strength})
              </span>
            </div>
            <div className="text-sm text-textSecondary italic">{item.medication.generic_name}</div>
          </div>

          {/* Delete Button */}
          <button
            onClick={() => removeFromPrescription(index)}
            className="p-1 text-error/60 hover:text-error hover:bg-error/10 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Dosing Row */}
        <div className="mt-2 grid grid-cols-3 gap-2">
          {/* Dose */}
          <div>
            <label className="text-xs text-textSecondary block mb-1">Dose</label>
            <input
              type="text"
              value={item.dose}
              onChange={(e) => updatePrescriptionItem(index, { dose: e.target.value })}
              className="w-full px-2 py-1 text-sm bg-background border border-borderColor rounded text-textMain focus:ring-1 focus:ring-brand focus:border-brand transition-colors"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="text-xs text-textSecondary block mb-1">Frequency</label>
            <select
              value={item.frequency}
              onChange={(e) => updatePrescriptionItem(index, { frequency: e.target.value })}
              className="w-full px-2 py-1 text-sm bg-background border border-borderColor rounded text-textMain focus:ring-1 focus:ring-brand focus:border-brand transition-colors"
            >
              {FREQUENCY_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs text-textSecondary block mb-1">Duration</label>
            <select
              value={item.duration}
              onChange={(e) => updatePrescriptionItem(index, { duration: e.target.value })}
              className="w-full px-2 py-1 text-sm bg-background border border-borderColor rounded text-textMain focus:ring-1 focus:ring-brand focus:border-brand transition-colors"
            >
              {DURATION_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <input
          type="text"
          placeholder="Special instructions..."
          value={item.notes}
          onChange={(e) => updatePrescriptionItem(index, { notes: e.target.value })}
          className="mt-2 w-full px-2 py-1 text-sm border border-borderColor rounded bg-background text-textMain placeholder:text-textSecondary/50 focus:ring-1 focus:ring-brand focus:border-brand transition-colors"
        />
      </div>

      {/* Add Medication Modal */}
      {showAddModal && newMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-3">Add Medication to Master List</h3>
            <div className="grid grid-cols-1 gap-3">
              <input placeholder="Trade name" value={newMed.trade_name || ''} onChange={e => setNewMed({ ...newMed, trade_name: e.target.value })} className="p-2 border rounded" />
              <input placeholder="Generic name" value={newMed.generic_name || ''} onChange={e => setNewMed({ ...newMed, generic_name: e.target.value })} className="p-2 border rounded" />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Strength (eg. 500mg)" value={newMed.strength || ''} onChange={e => setNewMed({ ...newMed, strength: e.target.value })} className="p-2 border rounded" />
                <input placeholder="Form (Tablet/Capsule)" value={newMed.form || ''} onChange={e => setNewMed({ ...newMed, form: e.target.value })} className="p-2 border rounded" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={newMed.category || 'Other'} onChange={e => setNewMed({ ...newMed, category: e.target.value })} className="p-2 border rounded">
                  {Object.keys(CATEGORY_CONFIG).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input placeholder="Category color (hex)" value={newMed.category_color || ''} onChange={e => setNewMed({ ...newMed, category_color: e.target.value })} className="p-2 border rounded" />
              </div>
              <input placeholder="Default dose" value={newMed.default_dose || ''} onChange={e => setNewMed({ ...newMed, default_dose: e.target.value })} className="p-2 border rounded" />
              <input placeholder="Default frequency" value={newMed.default_frequency || ''} onChange={e => setNewMed({ ...newMed, default_frequency: e.target.value })} className="p-2 border rounded" />
              <input placeholder="Default duration" value={newMed.default_duration || ''} onChange={e => setNewMed({ ...newMed, default_duration: e.target.value })} className="p-2 border rounded" />
              <textarea placeholder="Warnings (optional)" value={newMed.warnings || ''} onChange={e => setNewMed({ ...newMed, warnings: e.target.value })} className="p-2 border rounded" />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setShowAddModal(false); setNewMed(null); }} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSaveNewMedication} className="px-4 py-2 bg-brand text-white rounded">Save & Add</button>
            </div>
          </div>
        </div>
      )}
    );
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-borderColor px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-lg">
              <Pill className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h2 className="font-semibold text-textMain">Pregnancy Prescription</h2>
              <p className="text-sm text-textSecondary">
                {patientName} {gestationalAge && `• ${gestationalAge}`}
              </p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-surface rounded-lg transition-colors">
              <X className="w-5 h-5 text-textSecondary" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Medication Catalog */}
        <div className="w-2/3 flex flex-col border-r border-borderColor bg-surface">
          {/* Search Bar */}
          <div className="p-4 border-b border-borderColor">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textSecondary" />
              <input
                type="text"
                placeholder="Search medications by trade or generic name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-borderColor rounded-lg text-textMain placeholder:text-textSecondary focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-textMain transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
                {/* Suggestions dropdown */}
                {suggestionResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-12 bg-white border border-borderColor rounded shadow-lg z-50 max-h-64 overflow-auto">
                    {suggestionResults.map(m => (
                      <div key={m.id} className="px-3 py-2 hover:bg-gray-50 flex items-center justify-between cursor-pointer" onClick={() => addToPrescription(m as any)}>
                        <div>
                          <div className="font-medium">{m.trade_name} <span className="text-xs text-textSecondary">{m.strength}</span></div>
                          <div className="text-xs text-textSecondary italic">{m.generic_name} • {m.category}</div>
                        </div>
                        <div className="text-sm text-brand font-medium">Add</div>
                      </div>
                    ))}
                    <div className="px-3 py-2 border-t text-sm text-center">
                      <button onClick={() => openAddModalFor({ trade_name: searchTerm, generic_name: '', category: 'Other', category_color: '#78716C', form: 'Tablet', strength: '' })} className="text-sm text-blue-600">Add "{searchTerm}" to master list</button>
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Category Pills */}
          <div className="px-4 py-3 border-b border-borderColor overflow-x-auto bg-background">
            <div className="flex gap-2 flex-nowrap">
              {Object.entries(CATEGORY_CONFIG)
                .sort((a, b) => a[1].order - b[1].order)
                .map(([category]) => {
                  const count = medications.filter(m => m.category === category).length;
                  if (count === 0) return null;
                  return <CategoryBadge key={category} category={category} count={count} />;
                })}
            </div>
          </div>

          {/* Medications Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {searchTerm || selectedCategory ? (
              // Flat list when searching or filtering
              <div className="grid grid-cols-2 gap-3">
                {filteredMedications.map(med => (
                  <MedicationCard key={med.id} medication={med} />
                ))}
                {filteredMedications.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-textSecondary">
                    No medications found
                  </div>
                )}
              </div>
            ) : (
              // Grouped by category
              <div className="space-y-4">
                {groupedMedications.map(([category, meds]) => {
                  const config = CATEGORY_CONFIG[category] || { color: '#78716C', icon: '💊' };
                  const isExpanded = expandedCategories.has(category);

                  return (
                    <div key={category} className="border border-borderColor rounded-lg overflow-hidden bg-surface">
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-background hover:bg-surface transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{config.icon}</span>
                          <span 
                            className="font-semibold"
                            style={{ color: config.color }}
                          >
                            {category}
                          </span>
                          <span className="text-sm text-textSecondary">({meds.length})</span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-textSecondary" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-textSecondary" />
                        )}
                      </button>

                      {/* Category Medications */}
                      {isExpanded && (
                        <div className="p-3 grid grid-cols-2 gap-3">
                          {meds.map(med => (
                            <MedicationCard key={med.id} medication={med} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Prescription */}
        <div className="w-1/3 flex flex-col bg-background">
          {/* Prescription Header */}
          <div className="px-4 py-3 bg-surface border-b border-borderColor">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand" />
                <span className="font-semibold text-textMain">Current Prescription</span>
              </div>
              <span className="text-sm text-textSecondary">
                {prescription.length} item{prescription.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Prescription Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {prescription.length === 0 ? (
              <div className="text-center py-12">
                <Pill className="w-12 h-12 text-textSecondary/50 mx-auto mb-3" />
                <p className="text-textSecondary">Click medications to add</p>
                <p className="text-sm text-textSecondary/70 mt-1">
                  They will appear here
                </p>
              </div>
            ) : (
              prescription.map((item, index) => (
                <PrescriptionItemRow key={item.medication.id} item={item} index={index} />
              ))
            )}
          </div>

          {/* Action Buttons */}
          {prescription.length > 0 && (
            <div className="p-4 bg-surface border-t border-borderColor space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-borderColor rounded-lg text-textMain bg-background hover:bg-surface transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-borderColor rounded-lg text-textMain bg-background hover:bg-surface transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              </div>
              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors font-medium shadow-sm"
              >
                <Check className="w-5 h-5" />
                Save Prescription
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartPregnancyRx;
