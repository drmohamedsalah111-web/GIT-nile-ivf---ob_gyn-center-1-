import React, { useState, useRef } from 'react';
import { ImageIcon, Download, Upload, X, Loader2, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { obstetricsService } from '../../../services/obstetricsService';

interface UltrasoundGalleryProps {
  files: any[];
  pregnancyId: string;
  onUploadSuccess: () => void;
}

export const UltrasoundGallery: React.FC<UltrasoundGalleryProps> = ({ files, pregnancyId, onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        await obstetricsService.uploadPregnancyFile(pregnancyId, selectedFiles[i]);
      }
      onUploadSuccess();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (fileId: string, fileUrl: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;

    try {
      await obstetricsService.deletePregnancyFile(fileId, fileUrl);
      onUploadSuccess();
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">معرض صور السونار</h2>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
            multiple
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-sm disabled:opacity-50 transition-all"
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            <span>{isUploading ? 'جاري الرفع...' : 'رفع صور جديدة'}</span>
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <p>{uploadError}</p>
          <button onClick={() => setUploadError(null)}>
            <X size={18} />
          </button>
        </div>
      )}

      {!files || files.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">لا توجد صور سونار</h3>
          <p className="text-gray-500 mt-2">لم يتم رفع أي صور سونار لهذا المريض بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file) => (
            <div key={file.id} className="group relative bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 aspect-square">
              <img 
                src={file.file_url} 
                alt={file.file_name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                <a 
                  href={file.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/40 transition-colors"
                  title="عرض الصورة"
                >
                  <Download size={20} />
                </a>
                <button
                  onClick={() => handleDelete(file.id, file.file_url)}
                  className="p-2 bg-red-500/20 backdrop-blur-sm rounded-full text-white hover:bg-red-500/40 transition-colors"
                  title="حذف"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-white text-sm font-medium truncate">{file.file_name}</p>
                <p className="text-white/80 text-xs">
                  {file.created_at ? format(parseISO(file.created_at), 'dd/MM/yyyy') : '-'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
