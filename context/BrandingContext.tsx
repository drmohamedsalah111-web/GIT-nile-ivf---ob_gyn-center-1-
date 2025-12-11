import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';
import { powerSyncDb } from '../src/powersync/client';

interface BrandingSettings {
  id: number;
  clinic_name: string;
  logo_url: string | null;
  clinic_address: string | null;
  clinic_phone: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  default_rx_notes: string | null;
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

      // Use PowerSync for offline-first data
      const results = await powerSyncDb.getAll('SELECT * FROM app_settings');

      if (results.length > 0) {
        setBranding(results[0] as BrandingSettings);
      } else {
        setBranding(getDefaultBranding());
      }
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
    default_rx_notes: null,
    updated_at: new Date().toISOString(),
  });

  const updateBranding = async (
    updates: Partial<BrandingSettings>,
    logoFile?: File
  ) => {
    try {
      setError(null);

      let logoUrl = updates.logo_url;

      // Image upload still requires online connection to Supabase Storage
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
        clinic_name: updates.clinic_name ?? branding?.clinic_name,
        clinic_address: updates.clinic_address ?? branding?.clinic_address,
        clinic_phone: updates.clinic_phone ?? branding?.clinic_phone,
        primary_color: updates.primary_color ?? branding?.primary_color,
        secondary_color: updates.secondary_color ?? branding?.secondary_color,
        accent_color: updates.accent_color ?? branding?.accent_color,
        default_rx_notes: updates.default_rx_notes ?? branding?.default_rx_notes,
        ...(logoUrl && { logo_url: logoUrl }),
        updated_at: new Date().toISOString(),
      };

      setBranding(prev => prev ? { ...prev, ...updateData } : null);

      // Update local PowerSync DB (which will sync to Supabase)
      // Note: We assume there's only one row in app_settings
      const existing = await powerSyncDb.getAll('SELECT id FROM app_settings');

      if (existing.length > 0) {
        const id = (existing[0] as any).id;
        await powerSyncDb.execute(
          `UPDATE app_settings SET 
             clinic_name = ?, clinic_address = ?, clinic_phone = ?, 
             primary_color = ?, secondary_color = ?, accent_color = ?, 
             default_rx_notes = ?, logo_url = ?, updated_at = ? 
           WHERE id = ?`,
          [
            updateData.clinic_name, updateData.clinic_address, updateData.clinic_phone,
            updateData.primary_color, updateData.secondary_color, updateData.accent_color,
            updateData.default_rx_notes, updateData.logo_url, updateData.updated_at,
            id
          ]
        );
      } else {
        // Insert if not exists (though sync should handle this)
        await powerSyncDb.execute(
          `INSERT INTO app_settings (
             id, clinic_name, clinic_address, clinic_phone, 
             primary_color, secondary_color, accent_color, 
             default_rx_notes, logo_url, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            crypto.randomUUID(), // Generate a new UUID if creating locally
            updateData.clinic_name, updateData.clinic_address, updateData.clinic_phone,
            updateData.primary_color, updateData.secondary_color, updateData.accent_color,
            updateData.default_rx_notes, updateData.logo_url, updateData.updated_at
          ]
        );
      }

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
