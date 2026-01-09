import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';

interface Props {
  onSelect: (patient: any) => void;
}

const PatientLookup: React.FC<Props> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const search = async (q: string) => {
    setQuery(q);
    if (!q) return setResults([]);
    const { data, error } = await supabase
      .from('patients')
      .select('id, name, phone, total_debt')
      .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(20);

    if (error) return toast.error('خطأ في البحث');

    setResults(data || []);
  };

  return (
    <div className="bg-white rounded-xl border p-4">
      <label className="block text-sm font-medium">ابحث عن مريض (اسم/هاتف)</label>
      <input className="w-full p-2 border rounded mt-2" value={query} onChange={(e) => search(e.target.value)} placeholder="ابحث..." />

      <div className="mt-4 space-y-2 max-h-96 overflow-auto">
        {results.map((p) => (
          <div key={p.id} className="p-2 hover:bg-gray-50 rounded flex justify-between items-center">
            <div>
              <div className="font-medium">{p.name}</div>
            </div>
            <div className="text-right">
              {p.total_debt > 0 && <span className="text-red-600 text-sm">دين: {p.total_debt}</span>}
              <button onClick={() => onSelect(p)} className="bg-teal-500 text-white px-3 py-1 rounded ml-2">اختيار</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientLookup;
