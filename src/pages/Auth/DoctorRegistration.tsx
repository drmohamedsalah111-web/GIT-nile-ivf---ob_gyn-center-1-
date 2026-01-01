import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabaseClient';
import { User, Mail, Lock, Phone, MapPin, Stethoscope, CheckCircle, AlertCircle, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface RegistrationStep {
  step: number;
  title: string;
  title_ar: string;
}

const steps: RegistrationStep[] = [
  { step: 1, title: 'Personal Information', title_ar: 'البيانات الشخصية' },
  { step: 2, title: 'Clinic Information', title_ar: 'بيانات العيادة' },
  { step: 3, title: 'Choose Plan', title_ar: 'اختر الباقة' },
  { step: 4, title: 'Payment', title_ar: 'الدفع' },
];

export default function DoctorRegistration() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Personal Info
  const [personalInfo, setPersonalInfo] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  // Step 2: Clinic Info
  const [clinicInfo, setClinicInfo] = useState({
    clinic_name: '',
    clinic_name_ar: '',
    address: '',
    city: '',
    specialization: 'obgyn',
    license_number: '',
  });

  // Step 3: Selected Plan
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);

  // Step 4: Payment
  const [paymentInfo, setPaymentInfo] = useState({
    payment_method: 'bank_transfer',
    payment_reference: '',
  });

  // Load plans on mount
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error('Error loading plans:', error);
      toast.error('حدث خطأ في تحميل الباقات');
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (personalInfo.password !== personalInfo.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    if (personalInfo.password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setCurrentStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(3);
  };

  const handleStep3Submit = () => {
    if (!selectedPlan) {
      toast.error('يرجى اختيار باقة');
      return;
    }
    setCurrentStep(4);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1️⃣ إنشاء حساب المستخدم
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: personalInfo.email,
        password: personalInfo.password,
        options: {
          data: {
            full_name: personalInfo.full_name,
            role: 'doctor',
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('فشل في إنشاء الحساب');

      // 2️⃣ إنشاء سجل الدكتور
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .insert({
          user_id: authData.user.id,
          full_name: personalInfo.full_name,
          email: personalInfo.email,
          phone: personalInfo.phone,
          clinic_name: clinicInfo.clinic_name,
          clinic_name_ar: clinicInfo.clinic_name_ar,
          address: clinicInfo.address,
          city: clinicInfo.city,
          specialization: clinicInfo.specialization,
          license_number: clinicInfo.license_number,
          role: 'doctor',
        })
        .select()
        .single();

      if (doctorError) throw doctorError;

      // 3️⃣ إنشاء الاشتراك
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + selectedPlan.duration_days);

      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('clinic_subscriptions')
        .insert({
          clinic_id: doctorData.id,
          plan_id: selectedPlan.id,
          status: selectedPlan.price === 0 ? 'active' : 'pending',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          is_trial: selectedPlan.trial_days > 0,
          payment_method: paymentInfo.payment_method,
          payment_status: selectedPlan.price === 0 ? 'paid' : 'pending',
          amount_paid: selectedPlan.price,
        })
        .select()
        .single();

      if (subscriptionError) throw subscriptionError;

      // 4️⃣ تسجيل المدفوعات (إذا لم تكن مجانية)
      if (selectedPlan.price > 0) {
        await supabase.from('subscription_payments').insert({
          subscription_id: subscriptionData.id,
          amount: selectedPlan.price,
          payment_method: paymentInfo.payment_method,
          payment_status: 'pending',
          payment_reference: paymentInfo.payment_reference,
          created_by: authData.user.id,
        });
      }

      toast.success('تم التسجيل بنجاح! 🎉');
      
      if (selectedPlan.price === 0) {
        toast.success('تم تفعيل الفترة التجريبية المجانية ✅');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        toast.success('سيتم مراجعة طلبك وتفعيل الاشتراك خلال 24 ساعة');
        setTimeout(() => navigate('/subscription-pending'), 2000);
      }

    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 font-[Tajawal]">
            انضم إلى نظام إدارة العيادات
          </h1>
          <p className="text-gray-600 font-[Tajawal]">
            سجّل الآن واحصل على فترة تجريبية مجانية
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div key={step.step} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      currentStep >= step.step
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.step ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      step.step
                    )}
                  </div>
                  <p className="text-xs mt-2 text-center font-[Tajawal]">{step.title_ar}</p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all ${
                      currentStep > step.step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Personal Info */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 font-[Tajawal]">البيانات الشخصية</h2>
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[Tajawal]">
                  الاسم الكامل <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={personalInfo.full_name}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, full_name: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 font-[Tajawal]"
                    placeholder="د. محمد أحمد"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[Tajawal]">
                  البريد الإلكتروني <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={personalInfo.email}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, email: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="doctor@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[Tajawal]">
                  رقم الهاتف <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={personalInfo.phone}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, phone: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="01xxxxxxxxx"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[Tajawal]">
                  كلمة المرور <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={personalInfo.password}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, password: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 font-[Tajawal]">6 أحرف على الأقل</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[Tajawal]">
                  تأكيد كلمة المرور <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={personalInfo.confirmPassword}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, confirmPassword: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-[Tajawal] font-medium"
              >
                التالي ←
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Clinic Info */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 font-[Tajawal]">بيانات العيادة</h2>
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[Tajawal]">
                  اسم العيادة (بالإنجليزية) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={clinicInfo.clinic_name}
                    onChange={(e) =>
                      setClinicInfo({ ...clinicInfo, clinic_name: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nile IVF Center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[Tajawal]">
                  اسم العيادة (بالعربية) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={clinicInfo.clinic_name_ar}
                    onChange={(e) =>
                      setClinicInfo({ ...clinicInfo, clinic_name_ar: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 font-[Tajawal]"
                    placeholder="مركز النيل للحقن المجهري"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[Tajawal]">
                  العنوان <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={clinicInfo.address}
                    onChange={(e) =>
                      setClinicInfo({ ...clinicInfo, address: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 font-[Tajawal]"
                    placeholder="123 شارع الهرم، الجيزة"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[Tajawal]">
                  المدينة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clinicInfo.city}
                  onChange={(e) =>
                    setClinicInfo({ ...clinicInfo, city: e.target.value })
                  }
                  className="w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 font-[Tajawal]"
                  placeholder="القاهرة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-[Tajawal]">
                  رقم الترخيص <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={clinicInfo.license_number}
                    onChange={(e) =>
                      setClinicInfo({ ...clinicInfo, license_number: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="LIC-12345"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-[Tajawal]"
                >
                  → السابق
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-[Tajawal]"
                >
                  التالي ←
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Choose Plan */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 font-[Tajawal]">اختر الباقة المناسبة</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    selectedPlan?.id === plan.id
                      ? 'border-blue-600 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2 font-[Tajawal]">{plan.name_ar}</h3>
                  <div className="text-3xl font-bold text-blue-600 mb-4">
                    {plan.price === 0 ? (
                      <span className="font-[Tajawal]">مجاناً</span>
                    ) : (
                      <>
                        {plan.price} <span className="text-lg">ج.م</span>
                      </>
                    )}
                    <span className="text-sm text-gray-600 font-normal mr-2 font-[Tajawal]">
                      / {plan.duration_days} يوم
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 font-[Tajawal]">{plan.description_ar}</p>
                  
                  <ul className="space-y-2">
                    {plan.features?.patients && (
                      <li className="flex items-center text-sm text-gray-700 font-[Tajawal]">
                        <CheckCircle className="w-4 h-4 text-green-500 ml-2 flex-shrink-0" />
                        {plan.features.patients === 'unlimited' 
                          ? 'عدد مريضات غير محدود' 
                          : `حتى ${plan.features.patients} مريضة`}
                      </li>
                    )}
                    {plan.features?.ivf && (
                      <li className="flex items-center text-sm text-gray-700 font-[Tajawal]">
                        <CheckCircle className="w-4 h-4 text-green-500 ml-2 flex-shrink-0" />
                        إدارة الحقن المجهري
                      </li>
                    )}
                    {plan.features?.support && (
                      <li className="flex items-center text-sm text-gray-700 font-[Tajawal]">
                        <CheckCircle className="w-4 h-4 text-green-500 ml-2 flex-shrink-0" />
                        دعم فني: {plan.features.support}
                      </li>
                    )}
                    {plan.features?.storage_gb && (
                      <li className="flex items-center text-sm text-gray-700 font-[Tajawal]">
                        <CheckCircle className="w-4 h-4 text-green-500 ml-2 flex-shrink-0" />
                        مساحة تخزين: {plan.features.storage_gb} GB
                      </li>
                    )}
                  </ul>
                  
                  {plan.trial_days > 0 && (
                    <div className="mt-4 bg-green-100 text-green-800 px-3 py-2 rounded text-sm font-[Tajawal]">
                      🎁 {plan.trial_days} يوم تجربة مجانية
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-[Tajawal]"
              >
                → السابق
              </button>
              <button
                onClick={handleStep3Submit}
                disabled={!selectedPlan}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-[Tajawal]"
              >
                التالي ←
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Payment */}
        {currentStep === 4 && selectedPlan && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 font-[Tajawal]">معلومات الدفع</h2>
            
            {selectedPlan?.price === 0 ? (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-2 font-[Tajawal]">
                    🎉 باقة مجانية!
                  </h3>
                  <p className="text-green-700 font-[Tajawal]">
                    يمكنك البدء فوراً مع الفترة التجريبية المجانية لمدة {selectedPlan.trial_days} يوم
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-[Tajawal]"
                  >
                    → السابق
                  </button>
                  <button
                    onClick={handleFinalSubmit}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-[Tajawal]"
                  >
                    {loading ? 'جاري التسجيل...' : 'ابدأ الفترة التجريبية 🚀'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFinalSubmit} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-[Tajawal]">الباقة المختارة:</span>
                    <span className="font-bold font-[Tajawal]">{selectedPlan?.name_ar}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-[Tajawal]">المبلغ المطلوب:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {selectedPlan?.price} <span className="text-lg">ج.م</span>
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-[Tajawal]">
                    طريقة الدفع
                  </label>
                  <select
                    value={paymentInfo.payment_method}
                    onChange={(e) =>
                      setPaymentInfo({ ...paymentInfo, payment_method: e.target.value })
                    }
                    className="w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 font-[Tajawal]"
                  >
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="vodafone_cash">فودافون كاش</option>
                    <option value="cash">نقداً</option>
                    <option value="card">بطاقة ائتمان</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-[Tajawal]">
                    رقم العملية / المرجع (اختياري)
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.payment_reference}
                    onChange={(e) =>
                      setPaymentInfo({ ...paymentInfo, payment_reference: e.target.value })
                    }
                    className="w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="REF-12345"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 font-[Tajawal]">
                    📌 بعد إتمام التسجيل، سيتم مراجعة طلبك وتفعيل الاشتراك خلال 24 ساعة.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-[Tajawal]"
                  >
                    → السابق
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-[Tajawal]"
                  >
                    {loading ? 'جاري التسجيل...' : 'إتمام التسجيل ✓'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
