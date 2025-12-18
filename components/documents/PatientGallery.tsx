import React, { useState, useEffect } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Download,
  Trash2,
  Eye,
  Tag,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { documentsService, PatientDocument } from '../../services/documentsService';
import toast from 'react-hot-toast';

interface PatientGalleryProps {
  patientId: string;
  refreshTrigger?: number;
}

const PatientGallery: React.FC<PatientGalleryProps> = ({
  patientId,
  refreshTrigger = 0
}) => {
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<PatientDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'All' | 'Lab' | 'Scan' | 'Rx' | 'Other'>('All');
  const [selectedDocument, setSelectedDocument] = useState<PatientDocument | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const categories: Array<'All' | 'Lab' | 'Scan' | 'Rx' | 'Other'> = ['All', 'Lab', 'Scan', 'Rx', 'Other'];

  useEffect(() => {
    fetchDocuments();
  }, [patientId, refreshTrigger]);

  useEffect(() => {
    filterDocuments();
  }, [documents, activeCategory, searchQuery]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await documentsService.getDocumentsByPatient(patientId);
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    if (activeCategory !== 'All') {
      filtered = filtered.filter(doc => doc.category === activeCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.file_name.toLowerCase().includes(query) ||
        doc.notes?.toLowerCase().includes(query) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredDocuments(filtered);
  };

  const handleDownload = async (doc: PatientDocument) => {
    try {
      const response = await fetch(doc.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async (doc: PatientDocument) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.file_name}"?`)) {
      return;
    }

    try {
      const storagePath = `${patientId}/${doc.id}`;
      await documentsService.deleteDocument(doc.id, storagePath);
      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Lab': 'bg-blue-100 text-blue-800 border-blue-300',
      'Scan': 'bg-purple-100 text-purple-800 border-purple-300',
      'Rx': 'bg-green-100 text-green-800 border-green-300',
      'Other': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[category] || colors['Other'];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Document Gallery</h3>
        <span className="text-sm text-gray-500">{filteredDocuments.length} document(s)</span>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search documents by name or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full font-medium transition text-sm ${
                activeCategory === cat
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">
          Loading documents...
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {documents.length === 0
              ? 'No documents uploaded yet'
              : 'No documents match your search'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map(doc => (
            <div
              key={doc.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition bg-white"
            >
              <div className="bg-gradient-to-br from-gray-100 to-gray-50 p-4 h-40 flex items-center justify-center relative">
                {doc.file_type === 'Image' ? (
                  <img
                    src={doc.file_url}
                    alt={doc.file_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 truncate max-w-full px-2">
                      {doc.file_name}
                    </p>
                  </div>
                )}

                <div className="absolute top-2 right-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(
                      doc.category
                    )}`}
                  >
                    {doc.category}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h4 className="font-semibold text-gray-900 text-sm truncate mb-2">
                  {doc.file_name}
                </h4>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(doc.created_at)}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {formatFileSize(doc.file_size_bytes)}
                  </div>
                </div>

                {doc.notes && (
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {doc.notes}
                  </p>
                )}

                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {doc.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 bg-teal-100 text-teal-700 px-2 py-0.5 rounded text-xs"
                      >
                        <Tag className="w-2 h-2" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedDocument(doc);
                      setIsPreviewOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-xs font-medium text-gray-700"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-xs font-medium text-gray-700"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="px-3 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isPreviewOpen && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {selectedDocument.file_name}
              </h3>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {selectedDocument.file_type === 'Image' ? (
                <img
                  src={selectedDocument.file_url}
                  alt={selectedDocument.file_name}
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">{selectedDocument.file_name}</p>
                  <button
                    onClick={() => handleDownload(selectedDocument)}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientGallery;
