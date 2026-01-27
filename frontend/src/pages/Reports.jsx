import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import ReportTable from '../components/Reports/ReportTable';
import ReportFilters from '../components/Reports/ReportFilters';
import AssetDetailsModal from '../components/Reports/AssetDetailsModal';

import { FaFileAlt, FaDownload } from 'react-icons/fa';

import { API_URL } from '../config';

const Reports = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchAssets = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter !== 'All Status') params.status = statusFilter.toLowerCase();
      const res = await axios.get(`${API_URL}/api/assets`, { params });
      setAssets(res.data);
    } catch (err) {
      setError('Failed to fetch assets.');
    }
    setLoading(false);
  };

  // Expose fetchAssets as fetchReports globally for cross-page refreshes
  window.fetchReports = fetchAssets;

  useEffect(() => {
    fetchAssets();
  }, [statusFilter]);

  const filteredAssets = assets.filter(asset => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (asset.oracle_number && asset.oracle_number.toLowerCase().includes(q)) ||
      (asset.model_name && asset.model_name.toLowerCase().includes(q)) ||
      (asset.device_type && asset.device_type.toLowerCase().includes(q)) ||
      (asset.serial_number && asset.serial_number.toLowerCase().includes(q))
    );
  });

  const sortedAssets = [...filteredAssets].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const pagedAssets = sortedAssets.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(sortedAssets.length / pageSize);

  const handleExport = (format) => {
    if (format === 'Excel') {
      // Prepare data for export
      const exportData = filteredAssets.map(asset => {
        const flatAsset = {
          'Oracle Asset Number': asset.oracle_number || '',
          'Device Type': asset.device_type || '',
          'Brand': asset.brand_name || '',
          'Model': asset.model_name || '',
          'Serial Number': asset.serial_number || '',
          'Current Holder': asset.assigned_to || '',
          'Current Status': asset.status || '',
        };
        if (false) { // advanced is false here, but if advanced prop is used, add these fields
          flatAsset['Purchase Date'] = asset.purchase_date || '';
          flatAsset['Warranty Expiry'] = asset.warranty_expiry || '';
          flatAsset['Vendor Name'] = asset.vendor_name || '';
          flatAsset['Tender No'] = asset.tender_no || '';
          flatAsset['Assignment Date / Return Date'] = asset.assignment_date || asset.return_date || '';
          flatAsset['Repair History'] = asset.repair_history ? JSON.stringify(asset.repair_history) : '';
          flatAsset['Return Details'] = asset.return_details ? JSON.stringify(asset.return_details) : '';
          flatAsset['Auction Details'] = asset.auction_details ? JSON.stringify(asset.auction_details) : '';
        }
        return flatAsset;
      });

      // Create worksheet and workbook
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets');

      // Generate buffer and save file
      XLSX.writeFile(workbook, `Assets_Export_${new Date().toISOString().slice(0,10)}.xlsx`);
    } else if (format === 'PDF') {
      // Existing PDF export logic
      console.log('Exporting to PDF');
    }
  };

  const handleRowClick = (asset) => {
    setSelectedAsset(asset);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAsset(null);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (page > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(page - 1)}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          Previous
        </button>
      );
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
            i === page
              ? 'bg-blue-500 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }

    // Next button
    if (page < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(page + 1)}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          Next
        </button>
      );
    }

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, sortedAssets.length)} of {sortedAssets.length} results
        </div>
        <div className="flex items-center space-x-1">
          {pages}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <FaFileAlt className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-600">Generate and view asset reports</p>
            </div>
          </div>
          <div className="bg-white rounded-xl px-4 py-2 shadow-lg border border-gray-200">
            <div className="text-sm text-gray-600">Total Assets</div>
            <div className="text-2xl font-bold text-blue-600">{assets.length}</div>
          </div>
        </div>
      </div>

      {/* Filters and Export */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 md:mb-0">Asset Reports</h2>
          <div className="flex space-x-3">
            <button
              onClick={() => handleExport('PDF')}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium flex items-center space-x-2"
            >
              <FaDownload className="text-sm" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => handleExport('Excel')}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium flex items-center space-x-2"
            >
              <FaDownload className="text-sm" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>
        <ReportFilters
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 font-medium">Loading assets...</p>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6">
          <ReportTable assets={pagedAssets} advanced={false} onRowClick={handleRowClick} />
        </div>
      )}

      {/* Pagination */}
      {!loading && (
        renderPagination()
      )}

      {showModal && selectedAsset && (
        <AssetDetailsModal asset={selectedAsset} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default Reports;
