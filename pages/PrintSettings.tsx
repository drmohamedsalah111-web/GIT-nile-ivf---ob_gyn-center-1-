import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import type { PrintSettings } from '../types';
import PrescriptionTemplate from '@/components/PrescriptionTemplate';

const PrintSettings: React.FC = () => {
  const [settings, setSettings] = useState<PrintSettings>({
    clinic_id: 1,
    primary_color: '#2d5a6b',
    secondary_color: '#00838f',
    logo_url: null,
    header_text: 'Dr. Mohamed Salah Gabr',
    footer_text: 'Clinic Address | Phone: 0123456789',
    show_watermark: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('clinic_print_settings')
        .select('*')
        .eq('clinic_id', 1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows

      if (data) {
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('clinic_print_settings')
        .upsert(settings, { onConflict: 'clinic_id' });

      if (error) throw error;
      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `clinic_logo_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('clinic-assets')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('clinic-assets')
        .getPublicUrl(fileName);

      setSettings({ ...settings, logo_url: urlData.publicUrl });
    } catch (err) {
      console.error('Error uploading logo:', err);
      alert('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleLogoUpload(files[0]);
    }
  };

  const quickPalettes = [
    { primary: '#2d5a6b', secondary: '#00838f' }, // Blue
    { primary: '#7c3aed', secondary: '#a855f7' }, // Purple
    { primary: '#dc2626', secondary: '#ef4444' }, // Red
    { primary: '#d97706', secondary: '#f59e0b' }, // Gold
  ];

  const mockData = {
    patient: { name: 'John Doe', age: 30, date: '2023-12-25' },
    medicines: [
      { name: 'Paracetamol', dosage: '500mg', instructions: 'Twice daily' },
      { name: 'Ibuprofen', dosage: '200mg', instructions: 'As needed' },
    ],
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Prescription Print Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel: Controls */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Brand Identity</h2>

            {/* Logo Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Clinic Logo</label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="max-h-20 mx-auto mb-2" />
                ) : (
                  <div className="text-gray-500">Drag & drop logo here or click to upload</div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleLogoUpload(e.target.files[0])}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" className="cursor-pointer text-blue-600 hover:text-blue-800">
                  {uploading ? 'Uploading...' : 'Choose file'}
                </label>
              </div>
            </div>

            {/* Color Pickers */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
              <input
                type="color"
                value={settings.primary_color}
                onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
              <input
                type="color"
                value={settings.secondary_color}
                onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded"
              />
            </div>

            {/* Quick Palettes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quick Palettes</label>
              <div className="flex space-x-2">
                {quickPalettes.map((palette, index) => (
                  <button
                    key={index}
                    onClick={() => setSettings({ ...settings, primary_color: palette.primary, secondary_color: palette.secondary })}
                    className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center"
                    style={{ background: `linear-gradient(45deg, ${palette.primary}, ${palette.secondary})` }}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Header Text</label>
              <input
                type="text"
                value={settings.header_text}
                onChange={(e) => setSettings({ ...settings, header_text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="Dr. Name/Title"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Footer Text</label>
              <input
                type="text"
                value={settings.footer_text}
                onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="Address/Phone"
              />
            </div>

            {/* Watermark Toggle */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.show_watermark}
                  onChange={(e) => setSettings({ ...settings, show_watermark: e.target.checked })}
                  className="mr-2"
                />
                Show Logo Watermark in background
              </label>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          {/* Right Panel: Live Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Live Preview</h2>
            <div className="scale-75 origin-top-left">
              <PrescriptionTemplate settings={settings} data={mockData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintSettings;