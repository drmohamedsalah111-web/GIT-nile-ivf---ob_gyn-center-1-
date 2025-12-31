import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  Activity,
  User,
  Calendar,
  FileText,
  Save,
  AlertCircle,
  CheckCircle,
  Search,
  ChevronDown,
  ChevronUp,
  TestTube,
  Baby,
  PlayCircle,
  Stethoscope,
  ListChecks,
  Printer
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Patient {
  id: string;
  name: string;
  age: number;
  phone: string;
}

const InfertilityWorkup: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);

  // Form State
  const [maleFactor, setMaleFactor] = useState({
    volume: '',
    concentration: '',
    motility: '',
    morphology: '',
    notes: ''
  });

  const [ovarianFactor, setOvarianFactor] = useState({
    amh: '',
    fsh: '',
    menses: 'Regular', // Regular, Irregular
    age: ''
  });

  const [tubalFactor, setTubalFactor] = useState({
    hsg: 'Bilateral Patent',
    hysteroscopy: '',
    notes: ''
  });

  const [infertilityDuration, setInfertilityDuration] = useState('');

  // Accordion State
  const [sections, setSections] = useState({
    male: true,
    ovarian: true,
    tubal: true
  });

  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Logic & Diagnosis
  const maleDiagnosis = useMemo(() => {
    const conc = parseFloat(maleFactor.concentration);
    const mot = parseFloat(maleFactor.motility);
    const morph = parseFloat(maleFactor.morphology);

    if (isNaN(conc)) return null;

    if (conc < 16 || mot < 30 || morph < 4) {
      const reasons = [];
      if (conc < 16) reasons.push(`Low Concentration (${conc} M/ml)`);
      if (mot < 30) reasons.push(`Low Motility (${mot}%)`);
      if (morph < 4) reasons.push(`Low Morphology (${morph}%)`);

      return {
        status: 'abnormal',
        label: 'Male Factor Detected',
        detail: reasons.join(', ') || 'Oligo/Astheno/Terato-zoospermia'
      };
    }
    return { status: 'normal', label: 'Normozoospermia', detail: 'Normal WHO 2021 Parameters' };
  }, [maleFactor]);

  const ovarianDiagnosis = useMemo(() => {
    const amh = parseFloat(ovarianFactor.amh);
    const age = parseFloat(ovarianFactor.age);
    const menses = ovarianFactor.menses;

    if (isNaN(amh)) return null;

    if (menses === 'Irregular' && amh > 3.5) {
      return { status: 'warning', label: 'Possible PCOS', detail: 'High AMH and Irregular Cycles' };
    }
    if (amh < 1.1 || age > 38) {
      return { status: 'abnormal', label: 'Diminished Ovarian Reserve (DOR)', detail: amh < 1.1 ? 'Low AMH' : 'Advanced Maternal Age' };
    }
    return { status: 'normal', label: 'Normal Reserve', detail: 'Reserve within expected range' };
  }, [ovarianFactor]);

  const tubalDiagnosis = useMemo(() => {
    if (tubalFactor.hsg === 'Bilateral Block') {
      return { status: 'abnormal', label: 'Tubal Factor (Blocked)', detail: 'Bilateral fallopian tube occlusion' };
    }
    if (tubalFactor.hsg === 'Unilateral Block') {
      return { status: 'warning', label: 'Unilateral Tubal Block', detail: 'Partial fertility potential limitation' };
    }
    return { status: 'normal', label: 'Patent Tubes', detail: 'Bilateral Patent HSG' };
  }, [tubalFactor]);

  const recommendation = useMemo(() => {
    if (!isProcessed) return null;

    const male = maleDiagnosis;
    const ovarian = ovarianDiagnosis;
    const tubal = tubalDiagnosis;
    const duration = parseFloat(infertilityDuration) || 0;
    const age = parseFloat(ovarianFactor.age) || 0;
    const conc = parseFloat(maleFactor.concentration) || 0;

    if (!male || !ovarian || !tubal) return null;

    // Severe factors -> IVF/ICSI
    if ((conc < 5 && conc > 0) || tubal.status === 'abnormal') {
      return {
        type: 'IVF/ICSI',
        color: 'bg-red-50 text-red-900 border-red-200',
        icon: <TestTube className="w-6 h-6 text-red-600" />,
        header: 'ICSI - IVF Proceed Immediately',
        reasoning: tubal.status === 'abnormal' ? 'Bilateral tubal blockage is an absolute indication.' : 'Severe male factor (Concentration < 5M) requires ICSI.',
        nextSteps: ['Semen preparation/selection', 'Stimulation protocol planning', 'Pre-IVF workup']
      };
    }

    // PCOS -> OI
    if (ovarian.label === 'Possible PCOS' && male.status === 'normal' && tubal.status === 'normal') {
      return {
        type: 'OI',
        color: 'bg-yellow-50 text-yellow-900 border-yellow-200',
        icon: <Activity className="w-6 h-6 text-yellow-600" />,
        header: 'Ovulation Induction (OI)',
        reasoning: 'Anovulation/PCOS with patent tubes and normal male factor.',
        nextSteps: ['Letrozole/Clomid prescription', 'Follicular tracking (D11-D13)', 'Glucose Tolerance Test (GTT)']
      };
    }

    // Unexplained Short Duration -> IUI
    if (male.status === 'normal' && ovarian.status === 'normal' && tubal.status === 'normal' && duration < 2 && age < 35) {
      return {
        type: 'IUI',
        color: 'bg-emerald-50 text-emerald-900 border-emerald-200',
        icon: <Baby className="w-6 h-6 text-emerald-600" />,
        header: 'IUI (Intrauterine Insemination)',
        reasoning: 'Unexplained infertility with short duration and normal reserve.',
        nextSteps: ['Mild stimulation', 'IUI timing', 'Progesterone support']
      };
    }

    // Long duration or Age -> IVF
    if (duration >= 2 || age >= 35) {
      return {
        type: 'IVF',
        color: 'bg-orange-50 text-orange-900 border-orange-200',
        icon: <TestTube className="w-6 h-6 text-orange-600" />,
        header: 'Consider IVF/ICSI',
        reasoning: duration >= 2 ? 'Long duration of unexplained infertility (>2y).' : 'Advanced maternal age affects egg quality/reserve.',
        nextSteps: ['Ovarian reserve reassessment', 'Counseling for expectations', 'IVF laboratory workup']
      };
    }

    return {
      type: 'Review',
      color: 'bg-slate-50 text-slate-900 border-slate-200',
      icon: <FileText className="w-6 h-6 text-slate-600" />,
      header: 'Further Clinical Review',
      reasoning: 'Inconclusive findings, additional testing or laparoscopic evaluation might be needed.',
      nextSteps: ['Laparoscopy/Dye test', 'Karyotyping', 'Endometrial biopsy']
    };
  }, [isProcessed, maleDiagnosis, ovarianDiagnosis, tubalDiagnosis, infertilityDuration, ovarianFactor.age, maleFactor.concentration]);

  // Search Patients
  const searchPatients = async (term: string) => {
    if (term.length < 2) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, age, phone')
        .ilike('name', `%${term}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) searchPatients(searchTerm);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    if (selectedPatient) {
      setOvarianFactor(prev => ({ ...prev, age: selectedPatient.age?.toString() || '' }));
      fetchExistingData(selectedPatient.id);
      setIsProcessed(false);
    }
  }, [selectedPatient]);

  const fetchExistingData = async (patientId: string) => {
    try {
      const { data: semenData } = await supabase
        .from('semen_analyses')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (semenData) {
        setMaleFactor({
          volume: semenData.volume?.toString() || '',
          concentration: semenData.concentration?.toString() || '',
          motility: semenData.progressive_motility?.toString() || '',
          morphology: semenData.morphology?.toString() || '',
          notes: semenData.notes || ''
        });
      }

      const { data: workupData } = await supabase
        .from('infertility_workups')
        .select('*')
        .eq('patient_id', patientId)
        .single();

      if (workupData) {
        setOvarianFactor(prev => ({
          ...prev,
          amh: workupData.amh?.toString() || '',
          fsh: workupData.fsh_day_3?.toString() || '',
          menses: workupData.cycle_regularity || 'Regular'
        }));
        setTubalFactor(prev => ({
          ...prev,
          hsg: workupData.hsg_result || 'Bilateral Patent',
          hysteroscopy: workupData.hysteroscopy_findings || ''
        }));
        setInfertilityDuration(workupData.duration_years?.toString() || '');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedPatient) return;
    setSaving(true);
    try {
      const { error: semenError } = await supabase.from('semen_analyses').insert({
        patient_id: selectedPatient.id,
        volume: parseFloat(maleFactor.volume) || null,
        concentration: parseFloat(maleFactor.concentration) || null,
        progressive_motility: parseFloat(maleFactor.motility) || null,
        morphology: parseFloat(maleFactor.morphology) || null,
        notes: maleFactor.notes
      });

      if (semenError) throw semenError;

      const { data: existingWorkup } = await supabase
        .from('infertility_workups')
        .select('id')
        .eq('patient_id', selectedPatient.id)
        .single();

      const workupData = {
        patient_id: selectedPatient.id,
        amh: parseFloat(ovarianFactor.amh) || null,
        fsh: parseFloat(ovarianFactor.fsh) || null,
        cycle_regularity: ovarianFactor.menses,
        hsg_result: tubalFactor.hsg,
        hysteroscopy_findings: tubalFactor.hysteroscopy,
        duration_years: parseFloat(infertilityDuration) || null,
        diagnosis: recommendation?.header,
        plan: recommendation?.type
      };

      if (existingWorkup) {
        await supabase.from('infertility_workups').update(workupData).eq('id', existingWorkup.id);
      } else {
        await supabase.from('infertility_workups').insert(workupData);
      }

      toast.success('Diagnosis saved successfully');
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error('Failed to save: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const renderStatusBadge = (diagnosis: any) => {
    if (!diagnosis) return null;
    const colors = {
      normal: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      warning: 'bg-amber-100 text-amber-800 border-amber-200',
      abnormal: 'bg-rose-100 text-rose-800 border-rose-200'
    };
    const icons = {
      normal: <CheckCircle className="w-4 h-4" />,
      warning: <AlertCircle className="w-4 h-4" />,
      abnormal: <AlertCircle className="w-4 h-4" />
    };

    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${colors[diagnosis.status as keyof typeof colors]}`}>
        {icons[diagnosis.status as keyof typeof icons]}
        <span>{diagnosis.label}</span>
      </div>
    );
  };

  const handleProcess = () => {
    if (!selectedPatient) {
      toast.error('Please select a patient first');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setIsProcessed(true);
      setLoading(false);
      toast.success('ESHRE Algorithm Executed');
    }, 800);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto font-[Tajawal]" dir="rtl">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-1">Infertility Diagnosis Assistant</h1>
          <p className="text-slate-500 font-bold">Decision Support System based on ESHRE Guidelines</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleProcess}
            disabled={!selectedPatient || loading}
            className="flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-brand/20 disabled:opacity-50 disabled:scale-100"
          >
            <PlayCircle size={20} />
            {loading ? 'Processing...' : 'Run ESHRE Algorithm'}
          </button>
        </div>
      </div>

      {/* Patient Search */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 group transition-all hover:border-brand/40">
        <div className="relative">
          <Search className="absolute right-4 top-3.5 text-slate-400 group-hover:text-brand transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search patient by name or phone..."
            className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:bg-white transition-all font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              {searchResults.map(patient => (
                <div
                  key={patient.id}
                  className="p-4 hover:bg-slate-50 cursor-pointer border-b last:border-b-0 transition-colors"
                  onClick={() => {
                    setSelectedPatient(patient);
                    setSearchResults([]);
                    setSearchTerm(patient.name);
                  }}
                >
                  <div className="font-black text-slate-900">{patient.name}</div>
                  <div className="text-sm text-slate-500 font-bold">{patient.phone} | Age: {patient.age}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedPatient && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Section A: Male Factor */}
            <div className={`bg-white rounded-3xl shadow-sm border ${sections.male ? 'border-blue-200' : 'border-slate-200'} overflow-hidden transition-all h-fit`}>
              <div
                className={`p-5 flex justify-between items-center cursor-pointer ${sections.male ? 'bg-blue-50/50' : 'bg-white'}`}
                onClick={() => toggleSection('male')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <User size={20} />
                  </div>
                  <h2 className="font-black text-slate-900">The Husband</h2>
                </div>
                {sections.male ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>

              {sections.male && (
                <div className="p-6 space-y-4 animate-in fade-in duration-300">
                  {renderStatusBadge(maleDiagnosis)}
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1 uppercase tracking-wider">Concentration (M/ml)</label>
                    <input
                      type="number"
                      placeholder="Normal ≥ 16"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500"
                      value={maleFactor.concentration}
                      onChange={e => setMaleFactor({ ...maleFactor, concentration: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Motility (%)</label>
                      <input
                        type="number"
                        placeholder="≥ 30"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        value={maleFactor.motility}
                        onChange={e => setMaleFactor({ ...maleFactor, motility: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Morph (%)</label>
                      <input
                        type="number"
                        placeholder="≥ 4"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        value={maleFactor.morphology}
                        onChange={e => setMaleFactor({ ...maleFactor, morphology: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section B: Ovarian Factor */}
            <div className={`bg-white rounded-3xl shadow-sm border ${sections.ovarian ? 'border-pink-200' : 'border-slate-200'} overflow-hidden h-fit`}>
              <div
                className={`p-5 flex justify-between items-center cursor-pointer ${sections.ovarian ? 'bg-pink-50/50' : 'bg-white'}`}
                onClick={() => toggleSection('ovarian')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
                    <Activity size={20} />
                  </div>
                  <h2 className="font-black text-slate-900">The Reserve</h2>
                </div>
                {sections.ovarian ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>

              {sections.ovarian && (
                <div className="p-6 space-y-4 animate-in fade-in duration-300">
                  {renderStatusBadge(ovarianDiagnosis)}
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1 uppercase">AMH (ng/ml)</label>
                    <input
                      type="number"
                      placeholder="DOR < 1.1 | PCOS > 3.5"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-pink-500"
                      value={ovarianFactor.amh}
                      onChange={e => setOvarianFactor({ ...ovarianFactor, amh: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Menses regularity</label>
                    <select
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      value={ovarianFactor.menses}
                      onChange={e => setOvarianFactor({ ...ovarianFactor, menses: e.target.value })}
                    >
                      <option value="Regular">Regular</option>
                      <option value="Irregular">Irregular</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Section C: Tubal Factor */}
            <div className={`bg-white rounded-3xl shadow-sm border ${sections.tubal ? 'border-purple-200' : 'border-slate-200'} overflow-hidden h-fit`}>
              <div
                className={`p-5 flex justify-between items-center cursor-pointer ${sections.tubal ? 'bg-purple-50/50' : 'bg-white'}`}
                onClick={() => toggleSection('tubal')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                    <Stethoscope size={20} />
                  </div>
                  <h2 className="font-black text-slate-900">Tubes & Uterus</h2>
                </div>
                {sections.tubal ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>

              {sections.tubal && (
                <div className="p-6 space-y-4 animate-in fade-in duration-300">
                  {renderStatusBadge(tubalDiagnosis)}
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1 uppercase">HSG Result</label>
                    <select
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-purple-500"
                      value={tubalFactor.hsg}
                      onChange={e => setTubalFactor({ ...tubalFactor, hsg: e.target.value })}
                    >
                      <option value="Bilateral Patent">Bilateral Patent</option>
                      <option value="Unilateral Block">Unilateral Block</option>
                      <option value="Bilateral Block">Bilateral Block (Absolute IVF)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Infertility Duration (Y)</label>
                    <input
                      type="number"
                      placeholder="Years"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      value={infertilityDuration}
                      onChange={e => setInfertilityDuration(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results dashboard */}
          {isProcessed && recommendation && (
            <div className={`rounded-[2.5rem] border-2 p-8 shadow-2xl shadow-brand/10 animate-in zoom-in-95 duration-500 ${recommendation.color}`}>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center shrink-0 shadow-lg">
                  {recommendation.icon}
                </div>
                <div className="flex-1 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-white/50 rounded-full text-[10px] font-black uppercase tracking-widest">ESHRE Recommendation</span>
                    </div>
                    <h3 className="text-3xl font-black mb-2 tracking-tight">{recommendation.header}</h3>
                    <p className="text-lg font-bold opacity-80">{recommendation.reasoning}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/40 p-5 rounded-2xl border border-white/60">
                      <h4 className="flex items-center gap-2 font-black text-sm mb-3 uppercase tracking-wider">
                        <ListChecks size={16} /> Recommended Next Steps
                      </h4>
                      <ul className="space-y-2">
                        {recommendation.nextSteps.map((step, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm font-bold">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-col justify-end gap-3">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl"
                      >
                        <Save size={18} />
                        {saving ? 'Crunshing Data...' : 'Save Diagnosis & Case File'}
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black hover:bg-slate-50 transition-all">
                        <Printer size={18} />
                        Print Clinical Summary
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InfertilityWorkup;
