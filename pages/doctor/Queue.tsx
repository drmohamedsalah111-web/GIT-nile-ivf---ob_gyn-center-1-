import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import DoctorQueueCard from '../../components/doctor/DoctorQueueCard';
import toast from 'react-hot-toast';

const DoctorQueue: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Fetch appointments for the doctor where clinic_id = get_doctor_id() - simplified here
      const { data, error } = await supabase
        .from('appointments')
        .select('id, patient_id, patient:patients(name, phone), financial_status, scheduled_at')
        .eq('doctor_id', (await supabase.auth.getUser()).data.user?.id)
        .order('scheduled_at', { ascending: true });

      if (error) {
        toast.error('خطأ في تحميل قائمة الانتظار');
        setAppointments([]);
      } else {
        setAppointments(data || []);
      }

      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="py-12">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">قائمة الانتظار الطبية</h1>
      <div className="space-y-3">
        {appointments.map(a => (
          <DoctorQueueCard key={a.id} appointment={a} />
        ))}
      </div>
    </div>
  );
};

export default DoctorQueue;
