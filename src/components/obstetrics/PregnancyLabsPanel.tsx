import React, { useState, useEffect } from 'react';
import { FlaskConical, Plus, Check, Clock, Trash2, Printer, AlertCircle } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import toast from 'react-hot-toast';

// تحاليل الحمل الأساسية
const PREGNANCY_LABS = {
  booking: {
    title: 'تحاليل الحجز (First Visit)',
    tests: [
      { id: 'cbc', name: 'CBC', nameAr: 'صورة دم كاملة' },
      { id: 'blood_group', name: 'Blood Group + Rh', nameAr: 'فصيلة الدم' },
      { id: 'rbs', name: 'RBS', nameAr: 'سكر عشوائي' },
      { id: 'urine', name: 'Urine Analysis', nameAr: 'تحليل بول' },
      { id: 'hbsag', name: 'HBsAg', nameAr: 'التهاب كبدي B' },
      { id: 'hcv', name: 'HCV Ab', nameAr: 'التهاب كبدي C' },
      { id: 'hiv', name: 'HIV', nameAr: 'فيروس نقص المناعة' },
      { id: 'vdrl', name: 'VDRL', nameAr: 'اختبار الزهري' },
      { id: 'rubella', name: 'Rubella IgG', nameAr: 'الحصبة الألمانية' },
      { id: 'tsh', name: 'TSH', nameAr: 'هرمون الغدة الدرقية' },
    ]
  },
  firstTrimester: {
    title: 'تحاليل الثلث الأول (11-14 أسبوع)',
    tests: [
      { id: 'double_test', name: 'Double Test (PAPP-A + Free β-hCG)', nameAr: 'فحص مزدوج' },
      { id: 'nt_scan', name: 'NT Scan', nameAr: 'قياس الشفافية القفوية' },
    ]
  },
  secondTrimester: {
    title: 'تحاليل الثلث الثاني (15-20 أسبوع)',
    tests: [
      { id: 'quad_test', name: 'Quad Screen', nameAr: 'الفحص الرباعي' },
      { id: 'anomaly_scan', name: 'Anomaly Scan', nameAr: 'فحص التشوهات' },
      { id: 'gtt', name: 'GTT (24-28 weeks)', nameAr: 'منحنى السكر' },
    ]
  },
  thirdTrimester: {
    title: 'تحاليل الثلث الثالث (28+ أسبوع)',
    tests: [
      { id: 'cbc_3rd', name: 'CBC', nameAr: 'صورة دم كاملة' },
      { id: 'gbs', name: 'GBS Culture (35-37 weeks)', nameAr: 'مزرعة المكورات العقدية' },
      { id: 'coagulation', name: 'Coagulation Profile', nameAr: 'اختبارات التخثر' },
    ]
  },
  highRisk: {
    title: 'تحاليل الحمل عالي الخطورة',
    tests: [
      { id: 'hba1c', name: 'HbA1c', nameAr: 'السكر التراكمي' },
      { id: 'kidney', name: 'Kidney Function', nameAr: 'وظائف الكلى' },
      { id: 'liver', name: 'Liver Function', nameAr: 'وظائف الكبد' },
      { id: '24h_urine', name: '24h Urine Protein', nameAr: 'بروتين البول 24 ساعة' },
      { id: 'uric_acid', name: 'Uric Acid', nameAr: 'حمض اليوريك' },
      { id: 'ldh', name: 'LDH', nameAr: 'إنزيم LDH' },
      { id: 'platelets', name: 'Platelet Count', nameAr: 'عدد الصفائح' },
    ]
  }
};

interface LabOrder {
  id: string;
  pregnancy_id: string;
  test_names: string[];
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  ordered_at: string;
  completed_at?: string;
  results?: Record<string, string>;
}

interface PregnancyLabsPanelProps {
  pregnancyId: string;
  riskLevel: 'low' | 'moderate' | 'high';
  gestationalWeeks: number;
}

export const PregnancyLabsPanel: React.FC<PregnancyLabsPanelProps> = ({ 
  pregnancyId, 
  riskLevel,
  gestationalWeeks 
}) => {
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchLabOrders();
  }, [pregnancyId]);

  const fetchLabOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('pregnancy_labs')
        .select('*')
        .eq('pregnancy_id', pregnancyId)
        .order('ordered_at', { ascending: false });

      if (error) throw error;
      setLabOrders(data || []);
    } catch (err) {
      console.error('Error fetching lab orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (selectedTests.length === 0) {
      toast.error('اختر تحاليل على الأقل');
      return;
    }

    try {
      const { error } = await supabase
        .from('pregnancy_labs')
        .insert({
          id: crypto.randomUUID(),
          pregnancy_id: pregnancyId,
          test_names: selectedTests,
          status: 'pending',
          notes: notes || null,
          ordered_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('تم طلب التحاليل بنجاح');
      setSelectedTests([]);
      setNotes('');
      setShowNewOrder(false);
      fetchLabOrders();
    } catch (err) {
      console.error('Error creating lab order:', err);
      toast.error('حدث خطأ أثناء الطلب');
    }
  };

  const handleToggleTest = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(t => t !== testId)
        : [...prev, testId]
    );
  };

  const handleSelectPackage = (tests: { id: string }[]) => {
    const testIds = tests.map(t => t.id);
    setSelectedTests(prev => {
      const newTests = testIds.filter(id => !prev.includes(id));
      return [...prev, ...newTests];
    });
  };

  const handleMarkCompleted = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('pregnancy_labs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      toast.success('تم تحديث حالة التحاليل');
      fetchLabOrders();
    } catch (err) {
      toast.error('حدث خطأ');
    }
  };

  const getRecommendedTests = () => {
    const recommended: string[] = [];
    
    // First visit tests
    if (gestationalWeeks < 14) {
      recommended.push(...PREGNANCY_LABS.booking.tests.map(t => t.id));
    }
    
    // First trimester screening
    if (gestationalWeeks >= 11 && gestationalWeeks <= 14) {
      recommended.push(...PREGNANCY_LABS.firstTrimester.tests.map(t => t.id));
    }
    
    // GTT timing
    if (gestationalWeeks >= 24 && gestationalWeeks <= 28) {
      recommended.push('gtt');
    }
    
    // Third trimester
    if (gestationalWeeks >= 28) {
      recommended.push(...PREGNANCY_LABS.thirdTrimester.tests.map(t => t.id));
    }
    
    // High risk additional tests
    if (riskLevel === 'high') {
      recommended.push(...PREGNANCY_LABS.highRisk.tests.map(t => t.id));
    }
    
    return recommended;
  };

  const recommendedTests = getRecommendedTests();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <FlaskConical className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">تحاليل الحمل</h3>
            <p className="text-sm text-gray-500">طلب ومتابعة التحاليل المطلوبة</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewOrder(!showNewOrder)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus size={18} />
          <span>طلب تحاليل</span>
        </button>
      </div>

      {/* Recommended Tests Alert */}
      {recommendedTests.length > 0 && !showNewOrder && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">تحاليل مقترحة لعمر الحمل الحالي ({gestationalWeeks} أسبوع)</p>
              <p className="text-sm text-amber-700 mt-1">
                اضغط على "طلب تحاليل" لعرض التحاليل المناسبة
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New Order Form */}
      {showNewOrder && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-gray-900">اختر التحاليل المطلوبة</h4>
          
          {Object.entries(PREGNANCY_LABS).map(([key, category]) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-medium text-gray-700">{category.title}</h5>
                <button
                  type="button"
                  onClick={() => handleSelectPackage(category.tests)}
                  className="text-xs text-purple-600 hover:text-purple-700"
                >
                  اختر الكل
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {category.tests.map(test => {
                  const isSelected = selectedTests.includes(test.id);
                  const isRecommended = recommendedTests.includes(test.id);
                  
                  return (
                    <button
                      key={test.id}
                      type="button"
                      onClick={() => handleToggleTest(test.id)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-600'
                          : isRecommended
                          ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {test.nameAr}
                      {isRecommended && !isSelected && ' ⭐'}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              rows={2}
              placeholder="ملاحظات إضافية..."
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubmitOrder}
              disabled={selectedTests.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={18} />
              <span>تأكيد الطلب ({selectedTests.length} تحليل)</span>
            </button>
            <button
              onClick={() => {
                setShowNewOrder(false);
                setSelectedTests([]);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Lab Orders History */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">سجل التحاليل</h4>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
        ) : labOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FlaskConical className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p>لا توجد تحاليل مطلوبة</p>
          </div>
        ) : (
          labOrders.map(order => (
            <div
              key={order.id}
              className={`border rounded-lg p-4 ${
                order.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {order.status === 'pending' ? (
                      <Clock className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      order.status === 'pending' ? 'text-amber-700' : 'text-green-700'
                    }`}>
                      {order.status === 'pending' ? 'قيد الانتظار' : 'مكتمل'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(order.ordered_at).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {order.test_names.map((testId, idx) => {
                      const allTests = Object.values(PREGNANCY_LABS).flatMap(c => c.tests);
                      const test = allTests.find(t => t.id === testId);
                      return (
                        <span key={idx} className="px-2 py-0.5 bg-white text-gray-700 text-xs rounded border">
                          {test?.nameAr || testId}
                        </span>
                      );
                    })}
                  </div>
                  {order.notes && (
                    <p className="text-sm text-gray-600 mt-2">{order.notes}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleMarkCompleted(order.id)}
                      className="p-1.5 text-green-600 hover:bg-green-100 rounded"
                      title="تحديد كمكتمل"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button
                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                    title="طباعة"
                  >
                    <Printer size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
