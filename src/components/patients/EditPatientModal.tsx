import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, Calendar, Heart } from 'lucide-react';
import { patientService } from '../../services/PatientService';
import toast from 'react-hot-toast';

interface Patient {
    id: string;
    name: string;
    age?: number;
    phone: string;
    husband_name?: string;
}

interface EditPatientModalProps {
    patient: Patient;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

const EditPatientModal: React.FC<EditPatientModalProps> = ({ patient, isOpen, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        phone: '',
        husband_name: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (patient) {
            setFormData({
                name: patient.name || '',
                age: patient.age?.toString() || '',
                phone: patient.phone || '',
                husband_name: patient.husband_name || ''
            });
        }
    }, [patient]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            await patientService.updatePatient(patient.id, {
                name: formData.name,
                age: parseInt(formData.age),
                phone: formData.phone,
                husband_name: formData.husband_name
            });
            toast.success('تم تحديث بيانات المريضة بنجاح');
            onUpdate();
            onClose();
        } catch (error: any) {
            console.error('Error updating patient:', error);
            toast.error('حدث خطأ أثناء التحديث');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-blue-600 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute left-4 top-6 p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="text-center">
                        <h3 className="text-xl font-black mb-1">تعديل بيانات المريضة</h3>
                        <p className="text-teal-50/80 text-sm font-medium">تحديث المعلومات الأساسية</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-black text-gray-500 mr-2 flex items-center gap-1">
                            <User size={12} className="text-teal-600" />
                            الاسم الكامل
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-gray-700"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-500 mr-2 flex items-center gap-1">
                                <Calendar size={12} className="text-teal-600" />
                                العمر
                            </label>
                            <input
                                type="number"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-gray-700"
                                value={formData.age}
                                onChange={e => setFormData({ ...formData, age: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-500 mr-2 flex items-center gap-1">
                                <Phone size={12} className="text-teal-600" />
                                رقم الهاتف
                            </label>
                            <input
                                type="tel"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-gray-700"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-black text-gray-500 mr-2 flex items-center gap-1">
                            <Heart size={12} className="text-teal-600" />
                            اسم الزوج
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-bold text-gray-700"
                            value={formData.husband_name}
                            onChange={e => setFormData({ ...formData, husband_name: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-gradient-to-r from-teal-600 to-blue-600 text-white py-3.5 rounded-2xl font-black shadow-lg shadow-teal-600/20 hover:shadow-teal-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={20} />
                                    حفظ التعديلات
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-black hover:bg-gray-200 transition-all"
                        >
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPatientModal;
