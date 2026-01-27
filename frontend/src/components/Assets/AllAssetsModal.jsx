import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { formatDate, formatWarrantyExpiry } from '../../utils/dateFormatter';
import { FaTimes, FaSearch, FaDownload, FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AllAssetsModal = ({ onClose, assets: initialAssets, stockOnly = false }) => {
  const [assets, setAssets] = useState(initialAssets || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [purchaseDateStart, setPurchaseDateStart] = useState('');
  const [purchaseDateEnd, setPurchaseDateEnd] = useState('');
  const [assetStatusFilter, setAssetStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch assets if not provided
  useEffect(() => {
    if (!initialAssets || initialAssets.length === 0) {
      fetchAssets();
    }
  }, [initialAssets]);

  // Refetch assets when assetStatusFilter changes
  useEffect(() => {
    if (!initialAssets || initialAssets.length === 0) {
      fetchAssets();
    }
  }, [assetStatusFilter]);

  const fetchAssets = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (assetStatusFilter === 'new') {
        params.new = 'true';
      } else if (assetStatusFilter === 'stock' || stockOnly) {
        params.stock = 'true';
      }
      if (stockOnly) {
        params.unassigned = 'true';
      }
      const res = await axios.get(`${API_URL}/api/assets`, { params });
      setAssets(res.data);
    } catch (err) {
      setError('Failed to fetch assets.');
    }
    setLoading(false);
  };

  // Apply filters and get filtered assets
  const filteredAssets = useMemo(() => {
    let result = assets;

    // Text search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(asset =>
        (asset.oracle_number && asset.oracle_number.toLowerCase().includes(term)) ||
        (asset.device_type && asset.device_type.toLowerCase().includes(term)) ||
        (asset.model_name && asset.model_name.toLowerCase().includes(term)) ||
        (asset.serial_number && asset.serial_number.toLowerCase().includes(term)) ||
        (asset.unit_price && asset.unit_price.toString().includes(term)) ||
        (asset.vendor_name && asset.vendor_name.toLowerCase().includes(term)) ||
        (asset.tender_no && asset.tender_no.toLowerCase().includes(term))
      );
    }

    // Purchase date range filter
    if (purchaseDateStart || purchaseDateEnd) {
      result = result.filter(asset => {
        if (!asset.purchase_date) return false;
        const assetDate = new Date(asset.purchase_date);
        if (purchaseDateStart) {
          const fromDate = new Date(purchaseDateStart);
          if (assetDate < fromDate) return false;
        }
        if (purchaseDateEnd) {
          const toDate = new Date(purchaseDateEnd);
          if (assetDate > toDate) return false;
        }
        return true;
      });
    }

    return result;
  }, [assets, searchTerm, purchaseDateStart, purchaseDateEnd]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAssets = filteredAssets.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, purchaseDateStart, purchaseDateEnd, assetStatusFilter]);

  const getStatusText = (asset) => {
    let status = 'New';
    if (asset.return_type === 'buyback' || asset.status === 'buyback') {
      status = 'Buyback';
    } else if (asset.status === 'under repair') {
      status = 'Under Repair';
    } else if (asset.status === 'damaged') {
      status = 'Damaged';
    } else if (asset.status === 'assigned') {
      status = 'Assigned';
    } else if (asset.status === 'auctioned') {
      status = 'Auctioned';
    } else if ((!asset.assigned_to || asset.assigned_to === '') && asset.status === 'used') {
      status = 'Used';
    } else if ((!asset.assigned_to || asset.assigned_to === '') && asset.status === 'new') {
      status = 'New';
    } else if (asset.status) {
      status = asset.status.charAt(0).toUpperCase() + asset.status.slice(1);
    }
    return status;
  };

  const handleExport = (exportFilteredOnly) => {
    const dataToExport = exportFilteredOnly ? filteredAssets : assets;

    if (dataToExport.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = [
      'Oracle Number',
      'Type',
      'Model',
      'Brand',
      'Serial Number',
      'Price (PKR)',
      'Purchase Date',
      'Warranty Expiry',
      'Vendor',
      'Tender No',
      'Status',
      'Notes'
    ];

    const csvContent = [
      headers.join(','),
      ...dataToExport.map(asset => [
        asset.oracle_number || '',
        asset.device_type || '',
        asset.model_name || '',
        asset.brand_name || '',
        asset.serial_number || '',
        asset.unit_price ? `₨${asset.unit_price.toLocaleString()}` : '₨0',
        asset.purchase_date || '',
        asset.warranty_expiry || '',
        asset.vendor_name || '',
        asset.tender_no || '',
        getStatusText(asset),
        asset.notes || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `assets_${exportFilteredOnly ? 'filtered' : 'all'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePDFDownload = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // landscape
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('All Assets Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Table data
    const tableData = filteredAssets.map(asset => [
      asset.oracle_number || '-',
      asset.device_type || '-',
      asset.model_name || '-',
      asset.brand_name || '-',
      asset.serial_number || '-',
      asset.unit_price ? `₨${asset.unit_price.toLocaleString()}` : '₨0',
      asset.purchase_date || '-',
      asset.warranty_expiry || '-',
      asset.vendor_name || '-',
      asset.tender_no || '-',
      getStatusText(asset),
      asset.notes || '-'
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Oracle Number', 'Type', 'Model', 'Brand', 'Serial Number', 'Price (PKR)', 'Purchase Date', 'Warranty Expiry', 'Vendor', 'Tender No', 'Status', 'Notes']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 6 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: margin, right: margin },
    });

    // Save the PDF
    doc.save('all_assets_report.pdf');
  };

  const getStatusBadge = (asset) => {
    let status = 'New';
    let bgColor = 'bg-blue-100 text-blue-800';

    if (asset.return_type === 'buyback' || asset.status === 'buyback') {
      status = 'Buyback';
      bgColor = 'bg-teal-100 text-teal-800';
    } else if (asset.status === 'under repair') {
      status = 'Under Repair';
      bgColor = 'bg-yellow-100 text-yellow-800';
    } else if (asset.status === 'damaged') {
      status = 'Damaged';
      bgColor = 'bg-red-100 text-red-800';
    } else if (asset.status === 'assigned') {
      status = 'Assigned';
      bgColor = 'bg-green-100 text-green-800';
    } else if (asset.status === 'auctioned') {
      status = 'Auctioned';
      bgColor = 'bg-purple-100 text-purple-800';
    } else if ((!asset.assigned_to || asset.assigned_to === '') && asset.status === 'used') {
      status = 'Used';
      bgColor = 'bg-gray-100 text-gray-800';
    } else if ((!asset.assigned_to || asset.assigned_to === '') && asset.status === 'new') {
      status = 'New';
      bgColor = 'bg-blue-100 text-blue-800';
    } else if (asset.status) {
      status = asset.status.charAt(0).toUpperCase() + asset.status.slice(1);
      bgColor = 'bg-gray-100 text-gray-800';
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
        {status}
      </span>
    );
  };

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    
    // First page button
    if (currentPage > 2) {
      buttons.push(
        <button
          key="first"
          onClick={() => goToPage(1)}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          title="First page"
        >
          <FaAngleDoubleLeft />
        </button>
      );
    }

    // Previous page button
    if (currentPage > 1) {
      buttons.push(
        <button
          key="prev"
          onClick={() => goToPage(currentPage - 1)}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          title="Previous page"
        >
          <FaChevronLeft />
        </button>
      );
    }

    // Page number buttons
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
            i === currentPage
              ? 'bg-blue-500 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }

    // Next page button
    if (currentPage < totalPages) {
      buttons.push(
        <button
          key="next"
          onClick={() => goToPage(currentPage + 1)}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          title="Next page"
        >
          <FaChevronRight />
        </button>
      );
    }

    // Last page button
    if (currentPage < totalPages - 1) {
      buttons.push(
        <button
          key="last"
          onClick={() => goToPage(totalPages)}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          title="Last page"
        >
          <FaAngleDoubleRight />
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-2.5 py-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-none max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">All Assets Details</h3>
              <p className="text-sm text-gray-600">Manage and view all asset information</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePDFDownload}
              className="w-10 h-10 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center transition-colors duration-200 shadow-md"
              title="Download PDF"
            >
              <FaDownload className="text-gray-500" />
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center transition-colors duration-200 shadow-md"
            >
              <FaTimes className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              />
            </div>

            {/* Status Filter */}
            <select
              value={assetStatusFilter}
              onChange={(e) => setAssetStatusFilter(e.target.value)}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="used">Used</option>
              <option value="under repair">Under Repair</option>
              <option value="damaged">Damaged</option>
              <option value="auctioned">Auctioned</option>
              <option value="buyback">Buyback</option>
            </select>

            {/* Date Filter From */}
            <div className="relative">
              <input
                type="date"
                value={purchaseDateStart}
                onChange={(e) => setPurchaseDateStart(e.target.value)}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              />
              <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500">Purchase Date From</label>
            </div>

            {/* Date Filter To */}
            <div className="relative">
              <input
                type="date"
                value={purchaseDateEnd}
                onChange={(e) => setPurchaseDateEnd(e.target.value)}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              />
              <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500">Purchase Date To</label>
            </div>

            {/* Export Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleExport(false)}
                className="flex-1 px-3 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium text-sm flex items-center justify-center space-x-2"
                title="Export all assets"
              >
                <FaDownload className="text-xs" />
                <span>All</span>
              </button>
              <button
                onClick={() => handleExport(true)}
                className="flex-1 px-3 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium text-sm flex items-center justify-center space-x-2"
                title="Export filtered assets"
              >
                <FaDownload className="text-xs" />
                <span>Filtered</span>
              </button>
            </div>
          </div>

          {/* Stats and Items Per Page */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <span className="font-medium text-gray-900">{filteredAssets.length}</span>
                <span className="ml-1">of {assets.length} assets</span>
              </span>
              {searchTerm && (
                <span className="text-blue-600">
                  Filtered by: "{searchTerm}"
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-500">per page</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 font-medium">Loading assets...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Table */}
              <div className="overflow-auto" style={{ height: 'calc(80vh - 280px)', minHeight: '300px' }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oracle Number</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (PKR)</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warranty Expiry</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tender No</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAssets.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                            </svg>
                            <p className="text-gray-500 font-medium">No assets found</p>
                            <p className="text-gray-400 text-sm">Try adjusting your search criteria</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentAssets.map((asset, index) => (
                        <tr key={asset.id} className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {asset.oracle_number || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {asset.device_type || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {asset.model_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {asset.brand_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                            {asset.serial_number || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {asset.unit_price ? `₨${asset.unit_price.toLocaleString()}` : '₨0'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatDate(asset.purchase_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatWarrantyExpiry(asset.warranty_expiry)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {asset.vendor_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {asset.tender_no || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(asset)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white border-t border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredAssets.length)} of {filteredAssets.length} results
                    </div>
                    <div className="flex items-center space-x-1">
                      {renderPaginationButtons()}
                    </div>
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

export default AllAssetsModal;