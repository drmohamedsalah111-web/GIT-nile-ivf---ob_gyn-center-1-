import React, { useEffect, useMemo, useState } from 'react';
import { sampleMedications, Medication } from '../data/medications';

import './PrescriptionPage.css';

const STORAGE_KEY = 'local_medications_v1';

const PrescriptionPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selected, setSelected] = useState<Medication | null>(null);
  const [editing, setEditing] = useState<Medication | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setMedications(JSON.parse(stored));
        return;
      } catch { }
    }
    setMedications(sampleMedications);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(medications));
  }, [medications]);

  const categories = useMemo(() => {
    const set = new Set<string>(medications.map(m => m.category));
    return ['All', ...Array.from(set)];
  }, [medications]);

  const filtered = useMemo(() => {
    return medications.filter(m => {
      const q = query.trim().toLowerCase();
      if (category !== 'All' && m.category !== category) return false;
      if (!q) return true;
      return m.name_en.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
    });
  }, [medications, query, category]);

  function handleSelect(m: Medication) {
    setSelected(m);
  }

  function handleDelete(id: string) {
    if (!confirm('حذف هذا الدواء؟')) return;
    setMedications(prev => prev.filter(p => p.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function handleSaveEdit(edited: Medication) {
    setMedications(prev => {
      const exists = prev.find(p => p.id === edited.id);
      if (exists) return prev.map(p => p.id === edited.id ? edited : p);
      return [edited, ...prev];
    });
    setEditing(null);
    setSelected(edited);
  }

  function exportPDF() {
    // Use browser print for now (Print to PDF). Advanced PDF export can be added with jsPDF/html2canvas.
    window.print();
  }

  return (
    <div className="prescription-page">
      <div className="prescription-header no-print">
        <h2>Prescription Builder</h2>
        <div className="controls">
          <input
            placeholder="Search medication or category"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => setEditing({ id: Date.now().toString(), name_en: '', dosage_ar: '', instructions_ar: '', category: 'Uncategorized' })}>Add Medication</button>
        </div>
      </div>

      <div className="prescription-body">
        <aside className="med-list">
          {filtered.map(m => (
            <div key={m.id} className={`med-item ${selected?.id === m.id ? 'selected' : ''}`} onClick={() => handleSelect(m)}>
              <div className="med-name">{m.name_en}</div>
              <div className="med-cat">{m.category}</div>
              <div className="med-actions no-print">
                <button onClick={(e) => { e.stopPropagation(); setEditing(m); }}>Edit</button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}>Delete</button>
              </div>
            </div>
          ))}
        </aside>

        <section className="med-details">
          {!selected ? (
            <div className="empty">اختر دواء لعرض التعليمات بالأسفل</div>
          ) : (
            <div className="prescription-card" id="prescription-print-area">
              <div className="card-header">
                <div className="clinic">Clinic Name</div>
                <div className="meta">
                  <div>Doctor: __________________</div>
                  <div>Date: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              <h3 className="med-title">{selected.name_en}</h3>
              <div className="dosage" dir="rtl">{selected.dosage_ar}</div>
              <div className="instructions" dir="rtl">{selected.instructions_ar}</div>

              <div className="print-actions no-print">
                <button onClick={exportPDF}>Print / Save PDF</button>
              </div>
            </div>
          )}
        </section>
      </div>

      {editing && (
        <div className="modal-overlay">
          <div className="modal">
            <h4>{medications.find(m => m.id === editing.id) ? 'Edit Medication' : 'Add Medication'}</h4>
            <label>English Name</label>
            <input value={editing.name_en} onChange={e => setEditing({ ...editing, name_en: e.target.value })} />
            <label>Dosage (Arabic)</label>
            <input value={editing.dosage_ar} onChange={e => setEditing({ ...editing, dosage_ar: e.target.value })} />
            <label>Usage Instructions (Arabic)</label>
            <textarea value={editing.instructions_ar} onChange={e => setEditing({ ...editing, instructions_ar: e.target.value })} />
            <label>Category</label>
            <input value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} />

            <div className="modal-actions">
              <button onClick={() => setEditing(null)}>Cancel</button>
              <button onClick={() => handleSaveEdit(editing)}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionPage;
