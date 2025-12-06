import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';

interface BrandingSettings {
  id: number;
  clinic_name: string;
  logo_url: string | null;
  clinic_address: string | null;
  clinic_phone: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  updated_at: string;
}

interface BrandingContextType {
  branding: BrandingSettings | null;
  loading: boolean;
  error: string | null;
  updateBranding: (updates: Partial<BrandingSettings>, logoFile?: File) => Promise<void>;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranding = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (fetchError) throw fetchError;

      setBranding(data || getDefaultBranding());
    } catch (err) {
      console.error('Failed to fetch branding:', err);
      setError('فشل تحميل إعدادات العلامة التجارية');
      setBranding(getDefaultBranding());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultBranding = (): BrandingSettings => ({
    id: 1,
    clinic_name: 'نظام د محمد صلاح جبر',
    logo_url: null,
    clinic_address: null,
    clinic_phone: null,
    primary_color: '#2d5a6b',
    secondary_color: '#00838f',
    accent_color: '#00bcd4',
    updated_at: new Date().toISOString(),
  });

  const updateBranding = async (
    updates: Partial<BrandingSettings>,
    logoFile?: File
  ) => {
    try {
      setError(null);

      let logoUrl = updates.logo_url;

      if (logoFile) {
        try {
          const user = await authService.getCurrentUser();
          if (!user) throw new Error('User not authenticated');

          const fileExt = logoFile.name.split('.').pop();
          const fileName = `clinic_logo_${Date.now()}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('branding')
            .upload(fileName, logoFile, { upsert: true });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error('فشل رفع الشعار: تأكد من إنشاء bucket "branding" في Supabase Storage');
          }

          const { data: urlData } = supabase.storage
            .from('branding')
            .getPublicUrl(fileName);

          logoUrl = urlData.publicUrl;
        } catch (uploadErr: any) {
          console.error('Logo upload failed:', uploadErr);
          throw uploadErr;
        }
      }

      const updateData = {
        clinic_name: updates.clinic_name || branding?.clinic_name,
        clinic_address: updates.clinic_address || branding?.clinic_address,
        clinic_phone: updates.clinic_phone || branding?.clinic_phone,
        primary_color: updates.primary_color || branding?.primary_color,
        secondary_color: updates.secondary_color || branding?.secondary_color,
        accent_color: updates.accent_color || branding?.accent_color,
        ...(logoUrl && { logo_url: logoUrl }),
        updated_at: new Date().toISOString(),
      };

      const { data, error: updateError } = await supabase
        .from('app_settings')
        .update(updateData)
        .eq('id', 1)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      setBranding(data);
    } catch (err) {
      console.error('Failed to update branding:', err);
      setError('فشل تحديث إعدادات العلامة التجارية');
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
