import React from 'react';
import { AlertTriangle, FileText, AlertCircle, CheckCircle, TrendingDown, TrendingUp } from 'lucide-react';

interface ClinicalDataDisplayProps {
  data: any;
  department?: string;
}

const ClinicalDataDisplay: React.FC<ClinicalDataDisplayProps> = ({ data, department }) => {
  if (!data || typeof data !== 'object') {
    return <div className="text-sm text-gray-500 italic">لا توجد بيانات سريرية</div>;
  }

  const getRiskBadgeColor = (riskLevel: string) => {
    const level = String(riskLevel).toLowerCase().trim();
    if (level === 'low' || level === 'منخفض') return 'bg-green-100 text-green-800 border-green-300';
    if (level === 'medium' || level === 'متوسط') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (level === 'high' || level === 'مرتفع') return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getRiskIcon = (riskLevel: string) => {
    const level = String(riskLevel).toLowerCase().trim();
    if (level === 'high' || level === 'مرتفع') {
      return <AlertTriangle className="w-4 h-4" />;
    }
    if (level === 'low' || level === 'منخفض') {
      return <CheckCircle className="w-4 h-4" />;
    }
    return <AlertCircle className="w-4 h-4" />;
  };

  const renderField = (label: string, value: any, icon?: any) => {
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0 && !label.includes('risk_factors'))) {
      return null;
    }

    return (
      <div key={label} className="flex flex-col">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <div className="flex items-start gap-2 mt-1">
          {icon}
          <span className="text-sm text-gray-900 flex-1">{value}</span>
        </div>
      </div>
    );
  };

  const renderRiskFactors = (factors: any) => {
    if (!Array.isArray(factors) || factors.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic">
          لا يوجد عوامل خطورة مسجلة
        </div>
      );
    }

    return (
      <ul className="space-y-1 mt-2">
        {factors.map((factor: any, idx: number) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-red-500 mt-1">•</span>
            <span>{factor}</span>
          </li>
        ))}
      </ul>
    );
  };

  const renderLongText = (text: string, maxChars: number = 150) => {
    if (!text || typeof text !== 'string') return null;
    
    const isLong = text.length > maxChars;
    const displayText = isLong ? text.substring(0, maxChars) + '...' : text;

    return (
      <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
        {displayText}
      </div>
    );
  };

  const knownFields = {
    // Obstetrics fields
    gestational_age_weeks: 'Gestational Age (Weeks)',
    gestational_age_days: 'Gestational Age (Days)',
    systolic_bp: 'Systolic BP',
    diastolic_bp: 'Diastolic BP',
    weight_kg: 'Weight (kg)',
    fundal_height: 'Fundal Height (cm)',
    fetal_heart_rate: 'Fetal Heart Rate',
    risk_level: 'Risk Level',
    risk_factors: 'Risk Factors',

    // Gynecology fields
    complaint: 'Chief Complaint',
    pv_examination: 'PV Examination',
    ultrasound_findings: 'Ultrasound Findings',
    diagnosis: 'Diagnosis',
    treatment_plan: 'Treatment Plan',
    notes: 'Clinical Notes',

    // IVF fields
    protocol: 'Protocol',
    e2: 'Estradiol (E2)',
    lh: 'Luteinizing Hormone (LH)',
    fsh: 'Follicle Stimulating Hormone (FSH)',
    follicle_count: 'Follicle Count',
    endometrium_thickness: 'Endometrium Thickness (mm)',

    // Generic fields
    clinical_indication: 'Clinical Indication',
    observations: 'Observations'
  };

  const renderUnknownFields = (excludedKeys: Set<string>) => {
    const unknownFields: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (!excludedKeys.has(key) && value !== null && value !== undefined) {
        unknownFields.push({ key, value });
      }
    });

    if (unknownFields.length === 0) return null;

    return (
      <div className="border-t border-gray-200 pt-3 mt-3">
        {unknownFields.map(({ key, value }) => {
          const label = key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
          const displayValue = Array.isArray(value)
            ? value.filter((v) => v).join(', ')
            : typeof value === 'string'
              ? value
              : typeof value === 'object'
                ? JSON.stringify(value, null, 2)
                : String(value);

          return (
            <div key={key} className="mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
              <span className="text-sm text-gray-700 block mt-1">{displayValue}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const excludedKeys = new Set<string>();

  // Render based on available data structure
  return (
    <div className="space-y-4">
      {/* Risk Assessment Section (Obstetrics focused) */}
      {data.risk_level && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">Risk Assessment</h3>
          </div>

          <div className="space-y-3">
            {/* Risk Level Badge */}
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Risk Level</span>
              <div className="mt-2 flex items-center gap-2">
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border ${getRiskBadgeColor(data.risk_level)}`}>
                  {getRiskIcon(data.risk_level)}
                  <span className="text-sm font-medium">{data.risk_level}</span>
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            {data.risk_factors && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Risk Factors</span>
                {renderRiskFactors(data.risk_factors)}
              </div>
            )}
          </div>
          {excludedKeys.add('risk_level')}
          {excludedKeys.add('risk_factors')}
        </div>
      )}

      {/* Vital Signs Section (Obstetrics) */}
      {(data.systolic_bp || data.weight_kg || data.fundal_height) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">Vital Signs & Measurements</h3>

          {data.systolic_bp && data.diastolic_bp && (
            <>
              {renderField(
                'Blood Pressure',
                `${data.systolic_bp}/${data.diastolic_bp} mmHg`,
                data.systolic_bp >= 140 || data.diastolic_bp >= 90
                  ? <TrendingUp className="w-4 h-4 text-red-600 flex-shrink-0" />
                  : undefined
              )}
              {excludedKeys.add('systolic_bp')}
              {excludedKeys.add('diastolic_bp')}
            </>
          )}

          {data.weight_kg && (
            <>
              {renderField('Weight', `${data.weight_kg} kg`)}
              {excludedKeys.add('weight_kg')}
            </>
          )}

          {data.fundal_height && (
            <>
              {renderField('Fundal Height', `${data.fundal_height} cm`)}
              {excludedKeys.add('fundal_height')}
            </>
          )}

          {data.fetal_heart_rate && (
            <>
              {renderField('Fetal Heart Rate', `${data.fetal_heart_rate} bpm`)}
              {excludedKeys.add('fetal_heart_rate')}
            </>
          )}

          {data.gestational_age_weeks || data.gestational_age_days ? (
            <>
              {renderField(
                'Gestational Age',
                `${data.gestational_age_weeks || '?'}w + ${data.gestational_age_days || '?'}d`
              )}
              {excludedKeys.add('gestational_age_weeks')}
              {excludedKeys.add('gestational_age_days')}
            </>
          ) : null}
        </div>
      )}

      {/* Clinical Findings Section */}
      {(data.complaint || data.diagnosis || data.pv_examination || data.ultrasound_findings) && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-gray-900">Clinical Findings</h3>
          </div>

          {data.complaint && (
            <>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Chief Complaint</span>
                {renderLongText(data.complaint)}
              </div>
              {excludedKeys.add('complaint')}
            </>
          )}

          {data.pv_examination && (
            <>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">PV Examination</span>
                {renderLongText(data.pv_examination)}
              </div>
              {excludedKeys.add('pv_examination')}
            </>
          )}

          {data.ultrasound_findings && (
            <>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ultrasound Findings</span>
                {renderLongText(data.ultrasound_findings)}
              </div>
              {excludedKeys.add('ultrasound_findings')}
            </>
          )}

          {data.diagnosis && (
            <>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Diagnosis</span>
                <div className="mt-1 bg-white border border-gray-200 rounded px-2 py-1">
                  <span className="text-sm font-medium text-gray-900">{data.diagnosis}</span>
                </div>
              </div>
              {excludedKeys.add('diagnosis')}
            </>
          )}

          {data.treatment_plan && (
            <>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Treatment Plan</span>
                {renderLongText(data.treatment_plan)}
              </div>
              {excludedKeys.add('treatment_plan')}
            </>
          )}
        </div>
      )}

      {/* Lab/IVF Specific Section */}
      {(data.protocol || data.e2 || data.lh || data.fsh || data.follicle_count || data.endometrium_thickness) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">Lab/IVF Parameters</h3>

          {data.protocol && (
            <>
              {renderField('Protocol', data.protocol)}
              {excludedKeys.add('protocol')}
            </>
          )}

          {data.e2 && (
            <>
              {renderField('Estradiol (E2)', `${data.e2} pg/mL`)}
              {excludedKeys.add('e2')}
            </>
          )}

          {data.lh && (
            <>
              {renderField('LH', `${data.lh} mIU/mL`)}
              {excludedKeys.add('lh')}
            </>
          )}

          {data.fsh && (
            <>
              {renderField('FSH', `${data.fsh} mIU/mL`)}
              {excludedKeys.add('fsh')}
            </>
          )}

          {data.follicle_count && (
            <>
              {renderField('Follicle Count', `${data.follicle_count} follicles`)}
              {excludedKeys.add('follicle_count')}
            </>
          )}

          {data.endometrium_thickness && (
            <>
              {renderField('Endometrium Thickness', `${data.endometrium_thickness} mm`)}
              {excludedKeys.add('endometrium_thickness')}
            </>
          )}
        </div>
      )}

      {/* Clinical Notes Section */}
      {data.notes && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Clinical Notes</span>
              <div className="mt-2 bg-white rounded border border-gray-300 p-2 max-h-32 overflow-y-auto">
                {renderLongText(data.notes, 500)}
              </div>
            </div>
          </div>
          {excludedKeys.add('notes')}
        </div>
      )}

      {/* Additional/Unknown Fields */}
      {renderUnknownFields(excludedKeys)}
    </div>
  );
};

export default ClinicalDataDisplay;
