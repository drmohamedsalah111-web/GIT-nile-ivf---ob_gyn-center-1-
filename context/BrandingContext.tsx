import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';

interface DoctorBrandingSettings {
  id: string;
  name: string;
  clinic_name: string | null;
  logo_url: string | null;
  clinic_address: string | null;
  clinic_phone: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  header_font: string;
  body_font: string;
  button_style: string;
  card_style: string;
  default_rx_notes: string | null;
  prescription_header: string | null;
  prescription_footer: string | null;
  clinic_watermark: string | null;
  updated_at: string;
}

interface BrandingContextType {
  branding: DoctorBrandingSettings | null;
  loading: boolean;
  error: string | null;
  updateBranding: (updates: Partial<DoctorBrandingSettings>, logoFile?: File) => Promise<void>;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<DoctorBrandingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranding = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user and fetch their doctor branding
      const user = await authService.getCurrentUser();
      if (!user) {
        setBranding(getDefaultBranding());
        return;
      }

      // Get doctor branding from Supabase
      const { data: results, error: fetchError } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);

      if (fetchError) {
        console.error('Error fetching doctor branding:', fetchError);
        throw fetchError;
      }

      if (results && results.length > 0) {
        const doctor = results[0] as any;
        setBranding({
          id: doctor.id,
          name: doctor.name || '',
          clinic_name: doctor.clinic_name || null,
          logo_url: doctor.clinic_image || null,
          clinic_address: doctor.clinic_address || null,
          clinic_phone: doctor.clinic_phone || null,
          primary_color: doctor.primary_color || '#2d5a6b',
          secondary_color: doctor.secondary_color || '#00838f',
          accent_color: doctor.accent_color || '#00bcd4',
          background_color: doctor.background_color || '#ffffff',
          text_color: doctor.text_color || '#1f2937',
          header_font: doctor.header_font || 'Tajawal',
          body_font: doctor.body_font || 'Tajawal',
          button_style: doctor.button_style || 'rounded',
          card_style: doctor.card_style || 'shadow',
          default_rx_notes: doctor.default_rx_notes || null,
          prescription_header: doctor.prescription_header || null,
          prescription_footer: doctor.prescription_footer || null,
          clinic_watermark: doctor.clinic_watermark || null,
          updated_at: doctor.updated_at || new Date().toISOString(),
        });
      } else {
        setBranding(getDefaultBranding());
      }
    } catch (err) {
      console.error('Failed to fetch doctor branding:', err);
      setError('فشل تحميل إعدادات الهوية البصرية');
      setBranding(getDefaultBranding());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultBranding = (): DoctorBrandingSettings => ({
    id: '',
    name: '',
    clinic_name: 'نظام د محمد صلاح جبر',
    logo_url: null,
    clinic_address: null,
    clinic_phone: null,
    primary_color: '#2d5a6b',
    secondary_color: '#00838f',
    accent_color: '#00bcd4',
    background_color: '#ffffff',
    text_color: '#1f2937',
    header_font: 'Tajawal',
    body_font: 'Tajawal',
    button_style: 'rounded',
    card_style: 'shadow',
    default_rx_notes: null,
    prescription_header: null,
    prescription_footer: null,
    clinic_watermark: null,
    updated_at: new Date().toISOString(),
  });

  const updateBranding = async (
    updates: Partial<DoctorBrandingSettings>,
    logoFile?: File
  ) => {
    try {
      setError(null);

      const { data: { session: sessionResult } } = await supabase.auth.getSession();
      const user = sessionResult?.user ?? null;
      if (!user) throw new Error('User not authenticated');

      let logoUrl = updates.logo_url;

      // Image upload still requires online connection to Supabase Storage
      if (logoFile) {
        try {
          const fileExt = logoFile.name.split('.').pop();
          const fileName = `${user.id}/clinic_logo_${Date.now()}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('doctor-logos')
            .upload(fileName, logoFile, { upsert: true });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error('فشل رفع الشعار: تأكد من إنشاء bucket "doctor-logos" في Supabase Storage');
          }

          const { data: urlData } = supabase.storage
            .from('doctor-logos')
            .getPublicUrl(fileName);

          logoUrl = urlData.publicUrl;
        } catch (uploadErr: any) {
          console.error('Logo upload failed:', uploadErr);
          throw uploadErr;
        }
      }

      // Update doctor branding in Supabase
      const { error: updateError } = await supabase
        .from('doctors')
        .update({
          clinic_name: updates.clinic_name ?? branding?.clinic_name,
          clinic_address: updates.clinic_address ?? branding?.clinic_address,
          clinic_phone: updates.clinic_phone ?? branding?.clinic_phone,
          primary_color: updates.primary_color ?? branding?.primary_color,
          secondary_color: updates.secondary_color ?? branding?.secondary_color,
          accent_color: updates.accent_color ?? branding?.accent_color,
          background_color: updates.background_color ?? branding?.background_color,
          text_color: updates.text_color ?? branding?.text_color,
          header_font: updates.header_font ?? branding?.header_font,
          body_font: updates.body_font ?? branding?.body_font,
          button_style: updates.button_style ?? branding?.button_style,
          card_style: updates.card_style ?? branding?.card_style,
          default_rx_notes: updates.default_rx_notes ?? branding?.default_rx_notes,
          prescription_header: updates.prescription_header ?? branding?.prescription_header,
          prescription_footer: updates.prescription_footer ?? branding?.prescription_footer,
          clinic_watermark: updates.clinic_watermark ?? branding?.clinic_watermark,
          clinic_image: logoUrl || branding?.logo_url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating branding:', updateError);
        throw updateError;
      }

      // Update local state
      if (branding) {
        const updatedBranding = {
          ...branding,
          ...updates,
          ...(logoUrl && { logo_url: logoUrl }),
          updated_at: new Date().toISOString(),
        };
        setBranding(updatedBranding);
      }

    } catch (err) {
      console.error('Failed to update branding:', err);
      setError('فشل تحديث إعدادات الهوية البصرية');
      throw err;
    }
  };

  const refreshBranding = async () => {
    await fetchBranding();
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider
      value={{
        branding: branding || getDefaultBranding(),
        loading,
        error,
        updateBranding,
        refreshBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = (): BrandingContextType => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
