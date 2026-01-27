import React, { useState, useEffect } from 'react';
import { 
  FaTimes, 
  FaSearchPlus, 
  FaSearchMinus, 
  FaUndo, 
  FaDownload, 
  FaFilePdf, 
  FaFileImage, 
  FaFileAlt,
  FaExclamationTriangle,
  FaSpinner
} from 'react-icons/fa';

const VoucherPreviewModal = ({ voucherPath, voucherFilename, onClose }) => {
  const [fileType, setFileType] = useState('');
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (voucherFilename) {
      const extension = voucherFilename.split('.').pop().toLowerCase();
      if (['pdf'].includes(extension)) {
        setFileType('pdf');
      } else if (['jpg', 'jpeg', 'png'].includes(extension)) {
        setFileType('image');
      } else if (['txt'].includes(extension)) {
        setFileType('text');
      } else {
        setFileType('unsupported');
      }
    }
    setLoading(false);
  }, [voucherFilename]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleZoomReset = () => {
    setZoom(1);
  };

  const handleDownload = () => {
    const downloadUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/vouchers/${voucherPath}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = voucherFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = () => {
    switch (fileType) {
      case 'pdf':
        return <FaFilePdf className="text-red-500" />;
      case 'image':
        return <FaFileImage className="text-blue-500" />;
      case 'text':
        return <FaFileAlt className="text-green-500" />;
      default:
        return <FaFileAlt className="text-gray-500" />;
    }
  };

  const getFileTypeLabel = () => {
    switch (fileType) {
      case 'pdf':
        return 'PDF Document';
      case 'image':
        return 'Image File';
      case 'text':
        return 'Text File';
      default:
        return 'Unknown File Type';
    }
  };

  if (!voucherFilename) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center">
                <FaExclamationTriangle className="text-white text-lg" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Voucher Preview</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200"
            >
              <FaTimes className="text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaFileAlt className="text-gray-400 text-2xl" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Voucher Available</h4>
            <p className="text-gray-600">This item doesn't have an associated voucher document.</p>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl ${fullscreen ? 'w-full h-full' : 'w-full max-w-7xl max-h-[95vh]'} flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
              {getFileIcon()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Voucher Preview</h3>
              <p className="text-sm text-gray-600">{voucherFilename}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center transition-colors duration-200 shadow-md"
          >
            <FaTimes className="text-gray-500" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 mr-3">{getFileTypeLabel()}</span>
            <div className="flex items-center bg-white rounded-lg border border-gray-300">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 0.25}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <FaSearchMinus />
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-900 border-x border-gray-300 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <FaSearchPlus />
              </button>
            </div>
            <button
              onClick={handleZoomReset}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Reset Zoom"
            >
              <FaUndo />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              {fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium text-sm flex items-center space-x-2"
            >
              <FaDownload className="text-xs" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Preview Container */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center space-y-4">
                <FaSpinner className="animate-spin text-4xl text-blue-600" />
                <p className="text-gray-600 font-medium">Loading voucher...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaExclamationTriangle className="text-red-600 text-2xl" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Error Loading Voucher</h4>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="h-full overflow-auto p-4">
              {fileType === 'pdf' && (
                <div className="flex justify-center">
                  <iframe
                    src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/vouchers/${voucherPath}`}
                    className="border border-gray-300 rounded-lg shadow-lg bg-white"
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top center',
                      width: `${100 / zoom}%`,
                      height: `${800 / zoom}px`,
                      minHeight: '800px'
                    }}
                    title="Voucher Preview"
                    onLoad={() => setLoading(false)}
                    onError={() => setError('Failed to load PDF')}
                  />
                </div>
              )}

              {fileType === 'image' && (
                <div className="flex justify-center">
                  <img
                    src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/vouchers/${voucherPath}`}
                    alt="Voucher Preview"
                    className="max-w-full h-auto border border-gray-300 rounded-lg shadow-lg bg-white"
                    style={{ 
                      transform: `scale(${zoom})`, 
                      transformOrigin: 'top center' 
                    }}
                    onLoad={() => setLoading(false)}
                    onError={() => setError('Failed to load image')}
                  />
                </div>
              )}

              {fileType === 'text' && (
                <div className="flex justify-center">
                  <div 
                    className="bg-white border border-gray-300 rounded-lg shadow-lg p-6 max-w-full"
                    style={{ 
                      transform: `scale(${zoom})`, 
                      transformOrigin: 'top center' 
                    }}
                  >
                    <div className="text-center text-gray-600 py-8">
                      <FaFileAlt className="text-4xl mb-4 mx-auto" />
                      <p className="font-medium">Text File Preview</p>
                      <p className="text-sm mt-2">Text file preview is not implemented yet.</p>
                      <p className="text-sm">Please download the file to view its contents.</p>
                    </div>
                  </div>
                </div>
              )}

              {fileType === 'unsupported' && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaExclamationTriangle className="text-yellow-600 text-2xl" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Unsupported File Type</h4>
                    <p className="text-gray-600 mb-4">
                      Only PDF, JPG, PNG, and TXT files can be previewed.
                    </p>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
                    >
                      <FaDownload />
                      <span>Download File</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoucherPreviewModal;