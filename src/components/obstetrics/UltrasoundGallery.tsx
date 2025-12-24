import React from 'react';
import { ImageIcon, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface UltrasoundGalleryProps {
  files: any[];
}

export const UltrasoundGallery: React.FC<UltrasoundGalleryProps> = ({ files }) => {
  if (!files || files.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">لا توجد صور سونار</h3>
        <p className="text-gray-500 mt-2">لم يتم رفع أي صور سونار لهذا المريض بعد</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {files.map((file) => (
        <div key={file.id} className="group relative bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 aspect-square">
          <img 
            src={file.file_url} 
            alt={file.file_name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <a 
              href={file.file_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/40 transition-colors"
            >
              <Download size={20} />
            </a>
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
  );
};
