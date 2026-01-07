/**
 * ============================================================================
 * SMART PROTOCOL SELECTOR
 * مكون اختيار البروتوكول الذكي
 * ============================================================================
 * يعرض البروتوكولات المناسبة بناءً على البيانات السريرية للمريضة
 * مع درجة التطابق والتوصيات
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, AlertCircle, CheckCircle2, Zap, FileText } from 'lucide-react';
import smartStimulationService from '../../services/smartStimulationService.unified';
import type { StimulationProtocol, ProtocolSuggestion, InitialAssessment } from '../../types/smartStimulation.types';
import toast from 'react-hot-toast';

interface SmartProtocolSelectorProps {
  patientAssessment: InitialAssessment;
  onProtocolSelected: (protocol: StimulationProtocol, suggestion: ProtocolSuggestion) => void;
  showAllProtocols?: boolean;
}

const SmartProtocolSelector: React.FC<SmartProtocolSelectorProps> = ({
  patientAssessment,
  onProtocolSelected,
  showAllProtocols = false
}) => {
  const [loading, setLoading] = useState(true);
  const [allProtocols, setAllProtocols] = useState<StimulationProtocol[]>([]);
  const [suggestions, setSuggestions] = useState<ProtocolSuggestion[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [patientAssessment]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get all protocols
      const { data: protocols } = await smartStimulationService.getProtocols();
      if (protocols) {
        setAllProtocols(protocols);
      }

      // Get AI suggestions if assessment data available
      if (
        patientAssessment.age &&
        patientAssessment.amh &&
        patientAssessment.afc
      ) {
        const { data: aiSuggestions } = await smartStimulationService.suggestProtocol(
          patientAssessment.age,
          patientAssessment.amh,
          patientAssessment.afc,
          patientAssessment.bmi,
          patientAssessment.previous_cycles || 0
        );

        if (aiSuggestions) {
          setSuggestions(aiSuggestions);
        }
      }
    } catch (error) {
      console.error('Error loading protocols:', error);
      toast.error('فشل تحميل البروتوكولات');
    } finally {
      setLoading(false);
    }
  };

  const handleProtocolSelect = (protocol: StimulationProtocol) => {
    const suggestion = suggestions.find(s => s.protocol_id === protocol.id);
    
    if (suggestion) {
      setSelectedProtocol(protocol.id);
      onProtocolSelected(protocol, suggestion);
      toast.success(`تم اختيار: ${protocol.protocol_name_ar || protocol.protocol_name}`);
    } else {
      // Manual selection without AI score
      const manualSuggestion: ProtocolSuggestion = {
        protocol_id: protocol.id,
        protocol_name: protocol.protocol_name,
        match_score: 0,
        reason: 'اختيار يدوي من الطبيب'
      };
      setSelectedProtocol(protocol.id);
      onProtocolSelected(protocol, manualSuggestion);
      toast.success(`تم اختيار: ${protocol.protocol_name_ar || protocol.protocol_name}`);
    }
  };

  const getMatchScoreColor = (score: number): string => {
    if (score >= 75) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  const getMatchScoreBadge = (score: number): string => {
    if (score >= 75) return 'توافق ممتاز';
    if (score >= 50) return 'توافق جيد';
    return 'توافق متوسط';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show AI suggestions first if available
  const suggestedProtocols = suggestions.length > 0
    ? allProtocols.filter(p => suggestions.some(s => s.protocol_id === p.id))
    : [];

  const otherProtocols = allProtocols.filter(
    p => !suggestions.some(s => s.protocol_id === p.id)
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <Target className="w-8 h-8" />
          <h2 className="text-2xl font-bold">اختيار البروتوكول الذكي</h2>
        </div>
        <p className="text-indigo-100">
          بناءً على البيانات السريرية، النظام يقترح البروتوكولات الأنسب للمريضة
        </p>
      </div>

      {/* Patient Assessment Summary */}
      <div className="bg-white rounded-lg shadow p-4 border-r-4 border-indigo-500">
        <h3 className="font-semibold text-gray-900 mb-3">ملخص التقييم</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {patientAssessment.age && (
            <div>
              <span className="text-gray-600">العمر:</span>
              <span className="font-semibold mr-2">{patientAssessment.age} سنة</span>
            </div>
          )}
          {patientAssessment.amh && (
            <div>
              <span className="text-gray-600">AMH:</span>
              <span className="font-semibold mr-2">{patientAssessment.amh} ng/mL</span>
            </div>
          )}
          {patientAssessment.afc && (
            <div>
              <span className="text-gray-600">AFC:</span>
              <span className="font-semibold mr-2">{patientAssessment.afc}</span>
            </div>
          )}
          {patientAssessment.bmi && (
            <div>
              <span className="text-gray-600">BMI:</span>
              <span className="font-semibold mr-2">{patientAssessment.bmi}</span>
            </div>
          )}
        </div>
      </div>

      {/* AI Suggested Protocols */}
      {suggestedProtocols.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-bold text-gray-900">البروتوكولات المقترحة (AI)</h3>
          </div>

          {suggestedProtocols.map((protocol) => {
            const suggestion = suggestions.find(s => s.protocol_id === protocol.id)!;
            const isSelected = selectedProtocol === protocol.id;
            const isExpanded = expandedProtocol === protocol.id;

            return (
              <div
                key={protocol.id}
                className={`
                  bg-white rounded-xl shadow-md border-2 transition-all
                  ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'}
                  hover:shadow-lg
                `}
              >
                {/* Protocol Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-xl font-bold text-gray-900">
                          {protocol.protocol_name_ar || protocol.protocol_name}
                        </h4>
                        {isSelected && (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {protocol.description_ar || protocol.description}
                      </p>
                    </div>

                    {/* Match Score */}
                    <div className={`px-4 py-2 rounded-lg ${getMatchScoreColor(suggestion.match_score)}`}>
                      <div className="text-2xl font-bold text-center">
                        {suggestion.match_score}%
                      </div>
                      <div className="text-xs text-center">
                        {getMatchScoreBadge(suggestion.match_score)}
                      </div>
                    </div>
                  </div>

                  {/* AI Reason */}
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900 mb-1">
                          سبب الاقتراح:
                        </p>
                        <p className="text-sm text-blue-800">{suggestion.reason}</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                    {protocol.expected_stim_days_range && (
                      <div className="bg-gray-50 rounded p-2 text-center">
                        <div className="text-gray-600">مدة التنشيط</div>
                        <div className="font-semibold">{protocol.expected_stim_days_range}</div>
                      </div>
                    )}
                    {protocol.expected_oocytes_range && (
                      <div className="bg-gray-50 rounded p-2 text-center">
                        <div className="text-gray-600">البويضات المتوقعة</div>
                        <div className="font-semibold">{protocol.expected_oocytes_range}</div>
                      </div>
                    )}
                    {protocol.success_rate && (
                      <div className="bg-gray-50 rounded p-2 text-center">
                        <div className="text-gray-600">معدل النجاح</div>
                        <div className="font-semibold">{protocol.success_rate}%</div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleProtocolSelect(protocol)}
                      className={`
                        flex-1 py-2 px-4 rounded-lg font-semibold transition-colors
                        ${
                          isSelected
                            ? 'bg-green-600 text-white'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }
                      `}
                    >
                      {isSelected ? '✓ محدد' : 'اختيار هذا البروتوكول'}
                    </button>
                    <button
                      onClick={() => setExpandedProtocol(isExpanded ? null : protocol.id)}
                      className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t-2 border-gray-100 p-5 bg-gray-50 space-y-4">
                    {/* Medications Plan */}
                    {protocol.medications_plan && protocol.medications_plan.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">خطة الأدوية:</h5>
                        <div className="space-y-2">
                          {protocol.medications_plan.map((med: any, idx: number) => (
                            <div key={idx} className="bg-white rounded p-3 text-sm">
                              <div className="font-semibold text-indigo-600">{med.medication_name}</div>
                              <div className="text-gray-600">
                                الجرعة: {med.starting_dose} {med.unit} - {med.frequency}
                              </div>
                              <div className="text-gray-500 text-xs">
                                البداية: {med.start_day} - الطريق: {med.route}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Advantages */}
                    {protocol.advantages && (
                      <div>
                        <h5 className="font-semibold text-green-900 mb-2">المميزات:</h5>
                        <p className="text-sm text-green-800 bg-green-50 rounded p-3">
                          {protocol.advantages}
                        </p>
                      </div>
                    )}

                    {/* Disadvantages */}
                    {protocol.disadvantages && (
                      <div>
                        <h5 className="font-semibold text-orange-900 mb-2">العيوب:</h5>
                        <p className="text-sm text-orange-800 bg-orange-50 rounded p-3">
                          {protocol.disadvantages}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Other Protocols */}
      {showAllProtocols && otherProtocols.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-bold text-gray-900">بروتوكولات أخرى</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherProtocols.map((protocol) => {
              const isSelected = selectedProtocol === protocol.id;

              return (
                <div
                  key={protocol.id}
                  className={`
                    bg-white rounded-lg shadow border-2 p-4 transition-all
                    ${isSelected ? 'border-indigo-500' : 'border-gray-200'}
                    hover:shadow-md cursor-pointer
                  `}
                  onClick={() => handleProtocolSelect(protocol)}
                >
                  <h4 className="font-bold text-gray-900 mb-2">
                    {protocol.protocol_name_ar || protocol.protocol_name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {protocol.description_ar || protocol.description}
                  </p>
                  {isSelected && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-semibold">محدد</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Protocols Message */}
      {allProtocols.length === 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <p className="text-yellow-900 font-semibold">
            لا توجد بروتوكولات متاحة حالياً
          </p>
          <p className="text-yellow-700 text-sm mt-2">
            يرجى إضافة بروتوكولات من إعدادات النظام
          </p>
        </div>
      )}
    </div>
  );
};

export default SmartProtocolSelector;
