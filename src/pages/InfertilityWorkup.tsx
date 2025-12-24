import React, { useState, useEffect } from 'react';
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
  Baby
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
    age: '' // Will be populated from patient but editable
  });

  const [tubalFactor, setTubalFactor] = useState({
    hsg: 'Bilateral Patent', // Bilateral Patent, Unilateral Block, Bilateral Block
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
    }
  }, [selectedPatient]);

  const fetchExistingData = async (patientId: string) => {
    try {
      // Fetch latest semen analysis
      const { data: semenData } = await supabase
        .from('semen_analyses')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (semenData) {
        setMaleFactor({
          volume: semenData.volume || '',
          concentration: semenData.concentration || '',
          motility: semenData.progressive_motility || '',
          morphology: semenData.morphology || '',
          notes: semenData.notes || ''
        });
      }

      // Fetch infertility workup
      const { data: workupData } = await supabase
        .from('infertility_workups')
        .select('*')
        .eq('patient_id', patientId)
        .single();

      if (workupData) {
        setOvarianFactor(prev => ({
          ...prev,
          amh: workupData.amh || '',
          fsh: workupData.fsh_day_3 || '',
          menses: workupData.cycle_regularity || 'Regular'
        }));
        setTubalFactor(prev => ({
          ...prev,
          hsg: workupData.hsg_result || 'Bilateral Patent',
          hysteroscopy: workupData.hysteroscopy_findings || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Logic & Diagnosis
  const getMaleDiagnosis = () => {
    const conc = parseFloat(maleFactor.concentration);
    const mot = parseFloat(maleFactor.motility);
    const morph = parseFloat(maleFactor.morphology);

    if (!maleFactor.concentration) return null;

    if (conc < 16 || mot < 30 || morph < 4) {
      return { status: 'abnormal', label: 'Male Factor Detected', detail: 'Oligo/Astheno/Terato-zoospermia' };
    }
    return { status: 'normal', label: 'Normozoospermia', detail: 'Normal Parameters' };
  };

  const getOvarianDiagnosis = () => {
    const amh = parseFloat(ovarianFactor.amh);
    const age = parseFloat(ovarianFactor.age);
    const menses = ovarianFactor.menses;

    if (!ovarianFactor.amh) return null;

    if (menses === 'Irregular' && amh > 3.5) {
      return { status: 'warning', label: 'Possible PCOS', detail: 'High AMH + Irregular Cycles' };
    }
    if (amh < 1.1 || age > 40) {
      return { status: 'abnormal', label: 'Diminished Ovarian Reserve (DOR)', detail: 'Low AMH or Advanced Age' };
    }
    return { status: 'normal', label: 'Normal Reserve', detail: 'Within expected range' };
  };

  const getTubalDiagnosis = () => {
    if (tubalFactor.hsg === 'Bilateral Block') {
      return { status: 'abnormal', label: 'Tubal Factor', detail: 'Absolute Indication for IVF' };
    }
    if (tubalFactor.hsg === 'Unilateral Block') {
      return { status: 'warning', label: 'Unilateral Tubal Block', detail: 'Reduced fertility potential' };
    }
    return { status: 'normal', label: 'Patent Tubes', detail: 'Bilateral Patent' };
  };

  const getRecommendation = () => {
    const male = getMaleDiagnosis();
    const ovarian = getOvarianDiagnosis();
    const tubal = getTubalDiagnosis();
    const duration = parseFloat(infertilityDuration) || 0;
    const age = parseFloat(ovarianFactor.age) || 0;
    const conc = parseFloat(maleFactor.concentration) || 0;

    if (!male || !ovarian || !tubal) return null;

    // Scenario 1: Severe Male Factor or Tubal Block
    if ((conc < 5 && conc > 0) || tubal.label === 'Tubal Factor') {
      return { 
        type: 'IVF/ICSI', 
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <TestTube className="w-6 h-6" />,
        text: 'Proceed to ICSI/IVF (High Priority)' 
      };
    }

    // Scenario 2: PCOS + Normal Male + Patent Tubes
    if (ovarian.label === 'Possible PCOS' && male.status === 'normal' && tubal.status === 'normal') {
      return { 
        type: 'OI', 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Activity className="w-6 h-6" />,
        text: 'Ovulation Induction (Letrozole) + Timed Intercourse' 
      };
    }

    // Scenario 3: Unexplained < 2 years
    if (male.status === 'normal' && ovarian.status === 'normal' && tubal.status === 'normal' && duration < 2) {
      return { 
        type: 'IUI', 
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <Baby className="w-6 h-6" />,
        text: 'IUI (Intrauterine Insemination)' 
      };
    }

    // Scenario 4: Unexplained > 2 years OR Age > 35
    if ((male.status === 'normal' && ovarian.status === 'normal' && tubal.status === 'normal') && (duration >= 2 || age > 35)) {
      return { 
        type: 'IVF', 
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: <TestTube className="w-6 h-6" />,
        text: 'Consider IVF (Duration/Age Factor)' 
      };
    }

    return { 
      type: 'Review', 
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: <FileText className="w-6 h-6" />,
      text: 'Review Clinical Picture' 
    };
  };

  const handleSave = async () => {
    if (!selectedPatient) return;
    setSaving(true);
    try {
      // Save Semen Analysis
      const { error: semenError } = await supabase.from('semen_analyses').insert({
        patient_id: selectedPatient.id,
        volume: parseFloat(maleFactor.volume) || null,
        concentration: parseFloat(maleFactor.concentration) || null,
        progressive_motility: parseFloat(maleFactor.motility) || null,
        morphology: parseFloat(maleFactor.morphology) || null,
        notes: maleFactor.notes,
        doctor_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (semenError) throw semenError;

      // Save Infertility Workup
      const { data: existingWorkup } = await supabase
        .from('infertility_workups')
        .select('id')
        .eq('patient_id', selectedPatient.id)
        .single();

      const workupData = {
        patient_id: selectedPatient.id,
        amh: parseFloat(ovarianFactor.amh) || null,
        fsh_day_3: parseFloat(ovarianFactor.fsh) || null,
        cycle_regularity: ovarianFactor.menses,
        hsg_result: tubalFactor.hsg,
        hysteroscopy_findings: tubalFactor.hysteroscopy,
        diagnosis: getRecommendation()?.text,
        plan: getRecommendation()?.type
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
      normal: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      abnormal: 'bg-red-100 text-red-800'
    };
    const icons = {
      normal: <CheckCircle className="w-4 h-4" />,
      warning: <AlertCircle className="w-4 h-4" />,
      abnormal: <AlertCircle className="w-4 h-4" />
    };

    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${colors[diagnosis.status as keyof typeof colors]}`}>
        {icons[diagnosis.status as keyof typeof icons]}
        <span>{diagnosis.label}</span>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto font-[Tajawal]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ESHRE Infertility Diagnosis Assistant</h1>
        <p className="text-gray-500">Decision Support System based on ESHRE guidelines</p>
      </div>

      {/* Patient Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search patient by name..."
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
              {searchResults.map(patient => (
                <div
                  key={patient.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => {
                    setSelectedPatient(patient);
                    setSearchResults([]);
                    setSearchTerm(patient.name);
                  }}
                >
                  <div className="font-medium">{patient.name}</div>
                  <div className="text-sm text-gray-500">{patient.phone} | Age: {patient.age}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedPatient && (
        <div className="space-y-6">
          {/* Section A: Male Factor */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div 
              className="p-4 bg-blue-50 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('male')}
            >
              <div className="flex items-center gap-3">
                <User className="text-blue-600" />
                <h2 className="text-lg font-semibold text-blue-900">Section A: Male Factor (The Husband)</h2>
              </div>
              <div className="flex items-center gap-4">
                {renderStatusBadge(getMaleDiagnosis())}
                {sections.male ? <ChevronUp /> : <ChevronDown />}
              </div>
            </div>
            
            {sections.male && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Volume (ml)</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg"
                    value={maleFactor.volume}
                    onChange={e => setMaleFactor({...maleFactor, volume: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Concentration (M/ml)</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg"
                    value={maleFactor.concentration}
                    onChange={e => setMaleFactor({...maleFactor, concentration: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Normal: ≥ 16 M/ml</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Progressive Motility (%)</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg"
                    value={maleFactor.motility}
                    onChange={e => setMaleFactor({...maleFactor, motility: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Normal: ≥ 30%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Morphology (%)</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg"
                    value={maleFactor.morphology}
                    onChange={e => setMaleFactor({...maleFactor, morphology: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Normal: ≥ 4%</p>
                </div>
              </div>
            )}
          </div>

          {/* Section B: Ovarian Factor */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div 
              className="p-4 bg-pink-50 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('ovarian')}
            >
              <div className="flex items-center gap-3">
                <Activity className="text-pink-600" />
                <h2 className="text-lg font-semibold text-pink-900">Section B: Ovarian Factor (The Reserve)</h2>
              </div>
              <div className="flex items-center gap-4">
                {renderStatusBadge(getOvarianDiagnosis())}
                {sections.ovarian ? <ChevronUp /> : <ChevronDown />}
              </div>
            </div>
            
            {sections.ovarian && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg"
                    value={ovarianFactor.age}
                    onChange={e => setOvarianFactor({...ovarianFactor, age: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AMH (ng/ml)</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg"
                    value={ovarianFactor.amh}
                    onChange={e => setOvarianFactor({...ovarianFactor, amh: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">DOR: &lt; 1.1 | PCOS: &gt; 3.5</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">FSH (Day 3)</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg"
                    value={ovarianFactor.fsh}
                    onChange={e => setOvarianFactor({...ovarianFactor, fsh: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Menses Regularity</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={ovarianFactor.menses}
                    onChange={e => setOvarianFactor({...ovarianFactor, menses: e.target.value})}
                  >
                    <option value="Regular">Regular</option>
                    <option value="Irregular">Irregular</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Section C: Tubal Factor */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div 
              className="p-4 bg-purple-50 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection('tubal')}
            >
              <div className="flex items-center gap-3">
                <TestTube className="text-purple-600" />
                <h2 className="text-lg font-semibold text-purple-900">Section C: Tubal & Uterine Factor</h2>
              </div>
              <div className="flex items-center gap-4">
                {renderStatusBadge(getTubalDiagnosis())}
                {sections.tubal ? <ChevronUp /> : <ChevronDown />}
              </div>
            </div>
            
            {sections.tubal && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HSG Result</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={tubalFactor.hsg}
                    onChange={e => setTubalFactor({...tubalFactor, hsg: e.target.value})}
                  >
                    <option value="Bilateral Patent">Bilateral Patent</option>
                    <option value="Unilateral Block">Unilateral Block</option>
                    <option value="Bilateral Block">Bilateral Block</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hysteroscopy Findings</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg"
                    placeholder="e.g. Normal, Polyp, Septum"
                    value={tubalFactor.hysteroscopy}
                    onChange={e => setTubalFactor({...tubalFactor, hysteroscopy: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration of Infertility (Years)</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg"
                    value={infertilityDuration}
                    onChange={e => setInfertilityDuration(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Recommendation Card */}
          {getRecommendation() && (
            <div className={`rounded-xl border-2 p-6 ${getRecommendation()?.color}`}>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white bg-opacity-50 rounded-full">
                  {getRecommendation()?.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">ESHRE Algorithm Recommendation</h3>
                  <p className="text-lg font-medium">{getRecommendation()?.text}</p>
                  <div className="mt-4 flex gap-3">
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg font-medium transition-all"
                    >
                      <Save size={18} />
                      {saving ? 'Saving...' : 'Save Diagnosis'}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg font-medium transition-all">
                      <FileText size={18} />
                      Print Report
                    </button>
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
