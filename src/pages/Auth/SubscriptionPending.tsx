import React from 'react';
import { Clock, CheckCircle, Phone, Mail, MessageCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionPending() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3 font-[Tajawal]">
            تم استلام طلبك بنجاح! 🎉
          </h1>
          
          {/* Description */}
          <p className="text-gray-600 mb-6 font-[Tajawal]">
            شكراً لتسجيلك في نظام إدارة العيادات. سيتم مراجعة طلبك وتفعيل اشتراكك خلال 24 ساعة.
          </p>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-right">
            <h3 className="font-semibold text-blue-900 mb-4 flex items-center font-[Tajawal]">
              <CheckCircle className="w-5 h-5 ml-2" />
              الخطوات التالية
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start text-sm text-blue-800 font-[Tajawal]">
                <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs ml-2">✓</span>
                <span>تم إنشاء حسابك بنجاح</span>
              </li>
              <li className="flex items-start text-sm text-blue-800 font-[Tajawal]">
                <span className="flex-shrink-0 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs ml-2">⏳</span>
                <span>جاري مراجعة البيانات والدفع</span>
              </li>
              <li className="flex items-start text-sm text-blue-800 font-[Tajawal]">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs ml-2">📧</span>
                <span>سيتم إرسال بريد إلكتروني عند التفعيل</span>
              </li>
              <li className="flex items-start text-sm text-blue-800 font-[Tajawal]">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs ml-2">🚀</span>
                <span>ستتمكن من الدخول فوراً بعد التفعيل</span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="border-t pt-6">
            <p className="text-sm text-gray-600 mb-4 font-[Tajawal]">للاستفسارات والدعم الفني:</p>
            <div className="space-y-3">
              <a
                href="tel:+201234567890"
                className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span className="font-[Tajawal]">01234567890</span>
              </a>
              <a
                href="mailto:support@clinic.com"
                className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>support@clinic.com</span>
              </a>
              <a
                href="https://wa.me/201234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-green-600 hover:text-green-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="font-[Tajawal]">واتساب</span>
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-[Tajawal] font-medium"
            >
              <span>الذهاب لصفحة تسجيل الدخول</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-[Tajawal]"
            >
              العودة للصفحة الرئيسية
            </button>
          </div>

          {/* Timeline Info */}
          <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-800 font-[Tajawal]">
              ⏱️ متوسط وقت المراجعة والتفعيل: <span className="font-bold">2-24 ساعة</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
