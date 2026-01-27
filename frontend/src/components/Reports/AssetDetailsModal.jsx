import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDate } from '../../utils/dateFormatter';
import VoucherPreviewModal from '../VoucherPreviewModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AssetDetailsModal = ({ asset, onClose }) => {
  const [assetDetails, setAssetDetails] = useState(null);
  const [repairs, setRepairs] = useState([]);
  const [returns, setReturns] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voucherModal, setVoucherModal] = useState({ isOpen: false, path: '', filename: '' });

  useEffect(() => {
    if (asset) {
      fetchAssetDetails();
    }
  }, [asset]);

  const fetchAssetDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const [assetRes, repairsRes, returnsRes, auctionsRes, assignmentHistoryRes] = await Promise.all([
        axios.get(`${API_URL}/api/assets/${asset.oracle_number}`),
        axios.get(`${API_URL}/api/repairs/${asset.oracle_number}`),
        axios.get(`${API_URL}/api/returns/${asset.oracle_number}`),
        axios.get(`${API_URL}/api/auctions/${asset.oracle_number}`),
        axios.get(`${API_URL}/api/assets/${asset.oracle_number}/assignment-history`)
      ]);

      setAssetDetails(assetRes.data);
      setRepairs(repairsRes.data);
      setReturns(returnsRes.data);
      setAuctions(auctionsRes.data);
      setAssignmentHistory(assignmentHistoryRes.data);
    } catch (err) {
      setError('Failed to fetch asset details');
      console.error('Error fetching asset details:', err);
    }
    setLoading(false);
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // Set up document properties
    doc.setProperties({
      title: `Asset Details - ${asset.oracle_number}`,
      subject: 'Asset Management Report',
      author: 'Inventory Management System'
    });

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Asset Details Report', 20, 25);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Oracle Asset Number: ${asset.oracle_number || 'N/A'}`, 20, 35);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 42);

  let yPosition = 55;
  const margin = 20;
  const pageHeight = doc.internal.pageSize.height;

    // General Information Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('General Information', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const generalInfo = [
      ['Device Type:', asset.device_type || 'Not Available'],
      ['Brand:', asset.brand_name || 'Not Available'],
      ['Model:', asset.model_name || 'Not Available'],
      ['Serial Number:', asset.serial_number || 'Not Available'],
      ['Current Status:', asset.status || 'Not Available'],
      ['Purchase Date:', formatDate(asset.purchase_date) || 'Not Available'],
      ['Warranty Expiry:', formatDate(asset.warranty_expiry) || 'Not Available'],
      ['Vendor Name:', asset.vendor_name || 'Not Available'],
      ['Tender No:', asset.tender_no || 'Not Available'],
      ['Unit Price (PKR):', assetDetails?.unit_price ? `PKR ${assetDetails.unit_price}` : 'Not Available']
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: generalInfo,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 120 }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = doc.lastAutoTable.finalY + 15;
    if (yPosition > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }

    // Assignment Information Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Assignment Information', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const assignmentInfo = [
      ['Assigned To:', asset.assigned_to || 'Not Assigned'],
      ['Assignment Date:', formatDate(asset.assignment_date) || 'Not Available'],
      ['Designation:', assetDetails?.designation || 'Not Available'],
      ['Department:', assetDetails?.department || 'Not Available'],
      ['Return Date:', formatDate(assetDetails?.return_date) || 'Not Available'],
      ['Allocation Voucher:', assetDetails?.allocation_voucher ? assetDetails.allocation_voucher.split('/').pop() : 'Not Available']
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: assignmentInfo,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 120 }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = doc.lastAutoTable.finalY + 15;
    if (yPosition > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }

    // Assignment History Section
    if (assignmentHistory.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Assignment History', 20, yPosition);
      yPosition += 10;

      const assignmentHistoryData = assignmentHistory.map(assignment => [
        assignment.employee_name || '-',
        formatDate(assignment.assignment_date) || '-',
        assignment.designation || '-',
        assignment.department || '-',
        formatDate(assignment.return_date) || '-'
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Assigned To', 'Assignment Date', 'Designation', 'Department', 'Return Date']],
        body: assignmentHistoryData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { left: 20, right: 20 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    }

    // Repair History Section
    if (repairs.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Repair History', 20, yPosition);
      yPosition += 10;

      repairs.forEach((repair, index) => {
        if (yPosition > pageHeight - margin - 30) {
          doc.addPage();
          yPosition = margin;
        }
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Repair ${index + 1}:`, 20, yPosition);
        yPosition += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        const repairText = `Request: ${repair.repair_description || '-'}\n`;
        const repairLines = doc.splitTextToSize(repairText, 160);
        doc.text(repairLines, 25, yPosition);
        yPosition += repairLines.length * 5;

        if (repair.status === 'in-progress') {
          doc.text('Status: Pending', 25, yPosition);
          yPosition += 8;
        } else {
          const completedText = `Cost: ${repair.repair_cost || '-'}\nVendor: ${repair.vendor_name || '-'}\nReturn Date: ${formatDate(repair.return_date) || '-'}\nDescription: ${repair.repair_description || '-'}\nStatus: ${repair.is_fixed ? 'FIXED' : 'DAMAGED'}`;
          const completedLines = doc.splitTextToSize(completedText, 160);
          doc.text(completedLines, 25, yPosition);
          yPosition += completedLines.length * 5;
        }

        yPosition += 5;
      });
      yPosition += 5;
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    }

    // Return Details Section
    if (returns.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Return Details', 20, yPosition);
      yPosition += 10;

      const returnData = returns.map(returnRecord => [
        returnRecord.return_type || '-',
        formatDate(returnRecord.return_date) || '-',
        returnRecord.notes || '-',
        returnRecord.voucher_filename ? returnRecord.voucher_filename.split('/').pop() : '-'
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Return Type', 'Date', 'Notes', 'Voucher']],
        body: returnData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          2: { cellWidth: 60 }
        },
        margin: { left: 20, right: 20 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    }

    // Auction Details Section
    if (auctions.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Auction Details', 20, yPosition);
      yPosition += 10;

      const auctionData = auctions.map(auction => [
        formatDate(auction.auction_date) || '-',
        auction.price || '-',
        'Auctioned',
        auction.voucher_filename ? auction.voucher_filename.split('/').pop() : '-'
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Auction Date', 'Price', 'Status', 'Voucher']],
        body: auctionData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { left: 20, right: 20 }
      });
      yPosition = doc.lastAutoTable.finalY + 15;
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated by Inventory Management System - Page ${i} of ${pageCount}`, 20, doc.internal.pageSize.height - 10);
      doc.text(`Asset: ${asset.oracle_number}`, doc.internal.pageSize.width - 60, doc.internal.pageSize.height - 10);
    }

    // Save the PDF
    doc.save(`Asset_Details_${asset.oracle_number}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (!asset) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
        <div className="bg-white rounded-lg sm:rounded-2xl shadow-2xl w-full max-w-7xl max-h-[98vh] sm:max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg sm:rounded-t-2xl">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Asset Details</h3>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Comprehensive information about the selected asset</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={generatePDF}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center transition-colors duration-200 shadow-md flex-shrink-0"
                title="Download PDF"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center transition-colors duration-200 shadow-md flex-shrink-0"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-3 sm:p-6">
            {loading && (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600 font-medium text-sm sm:text-base">Loading asset details...</p>
                </div>
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center px-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <p className="text-red-600 font-medium text-sm sm:text-base">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && (
              <div className="space-y-6 sm:space-y-8">
                {/* General Information Section */}
                <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 pb-2 border-b border-gray-200">General Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Oracle Asset Number:</label>
                      <span className="block text-sm sm:text-base text-gray-900 font-medium break-all">{asset.oracle_number || 'Not Available'}</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Device Type:</label>
                      <span className="block text-sm sm:text-base text-gray-900 font-medium">{asset.device_type || 'Not Available'}</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Brand:</label>
                      <span className="block text-sm sm:text-base text-gray-900 font-medium">{asset.brand_name || 'Not Available'}</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Model:</label>
                      <span className="block text-sm sm:text-base text-gray-900 font-medium">{asset.model_name || 'Not Available'}</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Serial Number:</label>
                      <span className="block text-sm sm:text-base text-gray-900 font-medium break-all">{asset.serial_number || 'Not Available'}</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Current Status:</label>
                      <span className="block text-sm sm:text-base text-gray-900 font-medium">{asset.status || 'Not Available'}</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Purchase Date:</label>
                      <span className="block text-sm sm:text-base text-gray-900 font-medium">{formatDate(asset.purchase_date) || 'Not Available'}</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Warranty Expiry:</label>
                      <span className="block text-sm sm:text-base text-gray-900 font-medium">{formatDate(asset.warranty_expiry) || 'Not Available'}</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Vendor Name:</label>
                      <span className="block text-sm sm:text-base text-gray-900 font-medium">{asset.vendor_name || 'Not Available'}</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Tender No:</label>
                      <span className="block text-sm sm:text-base text-gray-900 font-medium break-all">{asset.tender_no || 'Not Available'}</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Unit Price (PKR):</label>
                      <span className="block text-sm sm:text-base text-gray-900 font-medium">{assetDetails?.unit_price ? `PKR ${assetDetails.unit_price}` : 'Not Available'}</span>
                    </div>
                  </div>
                </div>

                {/* Assignment Information Section */}
                <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 pb-2 border-b border-gray-200">Assignment Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Assigned To:</label>
                      <span className="block text-sm sm:text-base text-gray-900 font-medium">{asset.assigned_to || 'Not Assigned'}</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Assignment Date:</label>
                      <span className="block text-sm sm:text-base text-gray-900 font-medium">{formatDate(asset.assignment_date) || 'Not Available'}</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Designation:</label>
                      <span className="block text-sm sm:text-base text-gray-900 font-medium">{assetDetails?.designation || 'Not Available'}</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Department:</label>
                      <span className="block text-sm sm:text-base text-gray-900 font-medium">{assetDetails?.department || 'Not Available'}</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Return Date:</label>
                      <span className="block text-sm sm:text-base text-gray-900 font-medium">{formatDate(assetDetails?.return_date) || 'Not Available'}</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Allocation Voucher:</label>
                      <span className="block">
                        {assetDetails?.allocation_voucher ? (
                          <button
                            className="text-blue-600 hover:text-blue-800 underline text-sm sm:text-base font-medium transition-colors duration-200 break-all text-left"
                            onClick={() => setVoucherModal({
                              isOpen: true,
                              path: assetDetails.allocation_voucher,
                              filename: assetDetails.allocation_voucher.split('/').pop()
                            })}
                          >
                            {assetDetails.allocation_voucher.split('/').pop()}
                          </button>
                        ) : (
                          <span className="text-sm sm:text-base text-gray-900 font-medium">Not Available</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assignment History Section */}
                <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 pb-2 border-b border-gray-200">Assignment History</h3>
                  {assignmentHistory.length > 0 ? (
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment Date</th>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Designation</th>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Department</th>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Date</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {assignmentHistory.map((assignment) => (
                              <tr
                                key={assignment.id}
                                className={assignment.status === 'assigned' ? 'bg-blue-50' : 'hover:bg-gray-50'}
                              >
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {assignment.employee_name || '-'}
                                  {/* Mobile: Show designation and department below name */}
                                  <div className="sm:hidden mt-1 space-y-1">
                                    <div className="text-xs text-gray-500">{assignment.designation || '-'}</div>
                                    <div className="text-xs text-gray-500 md:hidden">{assignment.department || '-'}</div>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(assignment.assignment_date) || '-'}</td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">{assignment.designation || '-'}</td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">{assignment.department || '-'}</td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(assignment.return_date) || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8 text-sm sm:text-base">Not Assigned Yet</p>
                  )}
                </div>

                {/* Repair History Section */}
                <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 pb-2 border-b border-gray-200">Repair History</h3>
                  {repairs.length > 0 ? (

                    <div className="space-y-4">
                      {repairs.map((repair, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Repair Request</h4>
                              <p className="text-sm text-gray-700">{repair.repair_description || '-'}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Completed Repair</h4>
                              {repair.status === 'in-progress' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Pending
                                </span>
                              ) : (
                                <div className="space-y-2 text-sm text-gray-700">
                                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                                    <span><strong>Cost:</strong> {repair.repair_cost !== null && repair.repair_cost !== undefined ? repair.repair_cost : '-'}</span>
                                    <span><strong>Vendor:</strong> {repair.vendor_name || '-'}</span>
                                  </div>
                                  <div><strong>Return Date:</strong> {formatDate(repair.return_date) || '-'}</div>
                                  <div><strong>Description:</strong> {repair.repair_description || '-'}</div>
                                  <div className="flex items-center gap-2">
                                    <strong>Status:</strong>
                                    {repair.is_fixed ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        FIXED
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        DAMAGED
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8 text-sm sm:text-base">No repair history available</p>
                  )}

                </div>

                {/* Return Details Section */}
                <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 pb-2 border-b border-gray-200">Return Details</h3>
                  {returns.length > 0 ? (
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Type</th>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Notes</th>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voucher</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {returns.map((returnRecord, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900">
                                  {returnRecord.return_type || '-'}
                                  {/* Mobile: Show notes below return type */}
                                  <div className="sm:hidden mt-1 text-xs text-gray-500">
                                    {returnRecord.notes || '-'}
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(returnRecord.return_date) || '-'}</td>
                                <td className="px-3 sm:px-6 py-4 text-sm text-gray-900 hidden sm:table-cell max-w-xs truncate">{returnRecord.notes || '-'}</td>
                                <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                                  {returnRecord.voucher_filename ? (
                                    <button
                                      className="text-blue-600 hover:text-blue-800 underline transition-colors duration-200 break-all text-left"
                                      onClick={() => setVoucherModal({
                                        isOpen: true,
                                        path: returnRecord.voucher_filename,
                                        filename: returnRecord.voucher_filename.split('/').pop()
                                      })}
                                    >
                                      {returnRecord.voucher_filename.split('/').pop()}
                                    </button>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8 text-sm sm:text-base">No return details available</p>
                  )}
                </div>

                {/* Auction Details Section */}
                <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 pb-2 border-b border-gray-200">Auction Details</h3>
                  {auctions.length > 0 ? (
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auction Date</th>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voucher</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {auctions.map((auction, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatDate(auction.auction_date) || '-'}</td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{auction.price || '-'}</td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Auctioned
                                  </span>
                                </td>
                                <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                                  {auction.voucher_filename ? (
                                    <button
                                      className="text-blue-600 hover:text-blue-800 underline transition-colors duration-200 break-all text-left"
                                      onClick={() => setVoucherModal({
                                        isOpen: true,
                                        path: auction.voucher_filename,
                                        filename: auction.voucher_filename.split('/').pop()
                                      })}
                                    >
                                      {auction.voucher_filename.split('/').pop()}
                                    </button>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8 text-sm sm:text-base">No auction details available</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {voucherModal.isOpen && (
        <VoucherPreviewModal
          voucherPath={voucherModal.path}
          voucherFilename={voucherModal.filename}
          onClose={() => setVoucherModal({ isOpen: false, path: '', filename: '' })}
        />
      )}
    </>
  );
};

export default AssetDetailsModal;