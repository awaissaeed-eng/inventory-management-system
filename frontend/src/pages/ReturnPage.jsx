import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, ShoppingCart, AlertTriangle, Download, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';

import { formatDate, formatDateTime } from "../utils/dateFormatter";
import { API_URL } from '../config';

function ReturnPage() {
  const location = useLocation();
  const [oracleNumbers, setOracleNumbers] = useState([]);
  const [formData, setFormData] = useState({
    oracle_number: "",
    asset_type: "",
    asset_model: "",
    employee_name: "",
    employee_department: "",
    employee_designation: "",
    allocation_date: "",
    expected_return_date: "",
    return_date: "",
    condition: "",
    return_option: "",
    voucher: null,
    comments: ""
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Return Asset Card states
  const [returnedAssets, setReturnedAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [conditionFilter, setConditionFilter] = useState("All");

  // Buyback Asset Card states
  const [buybackAssets, setBuybackAssets] = useState([]);
  const [filteredBuybackAssets, setFilteredBuybackAssets] = useState([]);
  const [buybackSearchTerm, setBuybackSearchTerm] = useState("");
  const [buybackStartDate, setBuybackStartDate] = useState("");
  const [buybackEndDate, setBuybackEndDate] = useState("");
  const [showBuybackModal, setShowBuybackModal] = useState(false);

  // Damaged Asset Card states
  const [damagedAssets, setDamagedAssets] = useState([]);
  const [filteredDamagedAssets, setFilteredDamagedAssets] = useState([]);
  const [damagedSearchTerm, setDamagedSearchTerm] = useState("");
  const [damagedStartDate, setDamagedStartDate] = useState("");
  const [damagedEndDate, setDamagedEndDate] = useState("");
  const [showDamagedModal, setShowDamagedModal] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [buybackCurrentPage, setBuybackCurrentPage] = useState(1);
  const [damagedCurrentPage, setDamagedCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchAssignedOracleNumbers = () => {
    axios.get(`${API_URL}/api/assets/assigned`)
      .then(res => {
        // Filter out assets that are under repair
        axios.get(`${API_URL}/api/repairs/under-repair/oracle-numbers`)
          .then(repairRes => {
            const underRepairOracleNumbers = repairRes.data.oracle_numbers || [];
            const filteredOracleNumbers = res.data.filter(oracleNumber =>
              !underRepairOracleNumbers.includes(oracleNumber)
            );
            setOracleNumbers(filteredOracleNumbers);
          })
          .catch(err => {
            console.error("Failed to fetch under repair oracle numbers", err);
            // If we can't fetch under repair numbers, show all assigned assets
            setOracleNumbers(res.data);
          });
      })
      .catch(err => {
        console.error("Failed to fetch assigned oracle numbers", err);
      });
  };

  const fetchReturns = () => {
    axios.get(`${API_URL}/api/returns`)
      .then(res => {
        const normalized = res.data.map(asset => ({ ...asset, return_type: String(asset.return_type).trim().toLowerCase() }));
        setReturnedAssets(normalized.filter(a => a.return_type === 'returned_to_inventory'));
        setFilteredAssets(normalized.filter(a => a.return_type === 'returned_to_inventory'));
        setBuybackAssets(normalized.filter(a => a.return_type === 'buyback'));
        setFilteredBuybackAssets(normalized.filter(a => a.return_type === 'buyback'));
        setDamagedAssets(normalized.filter(a => a.return_type === 'damaged'));
        setFilteredDamagedAssets(normalized.filter(a => a.return_type === 'damaged'));
      })
      .catch(err => {
        console.error("Failed to fetch returned assets", err);
      });
  };

  useEffect(() => {
    fetchAssignedOracleNumbers();
    fetchReturns();
  }, []);

  // Pagination logic
  const getPaginatedData = (data, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (dataLength) => {
    return Math.ceil(dataLength / itemsPerPage);
  };

  // Filtering logic
  useEffect(() => {
    let filtered = returnedAssets.filter(asset => String(asset.return_type).trim().toLowerCase() === 'returned_to_inventory');

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(asset =>
        (asset.oracle_number && asset.oracle_number.toLowerCase().includes(term)) ||
        (asset.asset_type && asset.asset_type.toLowerCase().includes(term)) ||
        (asset.asset_model && asset.asset_model.toLowerCase().includes(term)) ||
        (asset.serial_number && asset.serial_number.toLowerCase().includes(term)) ||
        (asset.employee_name && asset.employee_name.toLowerCase().includes(term)) ||
        (asset.employee_department && asset.employee_department.toLowerCase().includes(term)) ||
        (asset.employee_designation && asset.employee_designation.toLowerCase().includes(term))
      );
    }

    if (conditionFilter !== "All") {
      filtered = filtered.filter(asset => asset.condition === conditionFilter);
    }

    if (startDate && endDate) {
      filtered = filtered.filter(asset => {
        const returnDate = new Date(asset.return_date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return returnDate >= start && returnDate <= end;
      });
    }

    setFilteredAssets(filtered);
  }, [returnedAssets, searchTerm, conditionFilter, startDate, endDate]);

  // Buyback filtering logic
  useEffect(() => {
    let filtered = buybackAssets.filter(asset => String(asset.return_type).trim().toLowerCase() === 'buyback');

    if (buybackSearchTerm) {
      const term = buybackSearchTerm.toLowerCase();
      filtered = filtered.filter(asset =>
        (asset.oracle_number && asset.oracle_number.toLowerCase().includes(term)) ||
        (asset.asset_type && asset.asset_type.toLowerCase().includes(term)) ||
        (asset.asset_model && asset.asset_model.toLowerCase().includes(term)) ||
        (asset.serial_number && asset.serial_number.toLowerCase().includes(term)) ||
        (asset.employee_name && asset.employee_name.toLowerCase().includes(term)) ||
        (asset.employee_department && asset.employee_department.toLowerCase().includes(term)) ||
        (asset.employee_designation && asset.employee_designation.toLowerCase().includes(term))
      );
    }

    if (buybackStartDate && buybackEndDate) {
      filtered = filtered.filter(asset => {
        const returnDate = new Date(asset.return_date);
        const start = new Date(buybackStartDate);
        const end = new Date(buybackEndDate);
        return returnDate >= start && returnDate <= end;
      });
    }

    setFilteredBuybackAssets(filtered);
  }, [buybackAssets, buybackSearchTerm, buybackStartDate, buybackEndDate]);

  // Damaged filtering logic
  useEffect(() => {
    let filtered = damagedAssets.filter(asset =>
      String(asset.return_type).trim().toLowerCase() === 'damaged' &&
      String(asset.asset_status).trim().toLowerCase() !== 'auctioned'
    );

    if (damagedSearchTerm) {
      const term = damagedSearchTerm.toLowerCase();
      filtered = filtered.filter(asset =>
        (asset.oracle_number && asset.oracle_number.toLowerCase().includes(term)) ||
        (asset.asset_type && asset.asset_type.toLowerCase().includes(term)) ||
        (asset.asset_model && asset.asset_model.toLowerCase().includes(term)) ||
        (asset.serial_number && asset.serial_number.toLowerCase().includes(term)) ||
        (asset.employee_name && asset.employee_name.toLowerCase().includes(term)) ||
        (asset.employee_department && asset.employee_department.toLowerCase().includes(term)) ||
        (asset.employee_designation && asset.employee_designation.toLowerCase().includes(term))
      );
    }

    if (damagedStartDate && damagedEndDate) {
      filtered = filtered.filter(asset => {
        const returnDate = new Date(asset.return_date);
        const start = new Date(damagedStartDate);
        const end = new Date(damagedEndDate);
        return returnDate >= start && returnDate <= end;
      });
    }

    setFilteredDamagedAssets(filtered);
  }, [damagedAssets, damagedSearchTerm, damagedStartDate, damagedEndDate]);

  // Check for navigation state to open modals
  useEffect(() => {
    if (location.state?.openDamagedModal) {
      setShowDamagedModal(true);
    }
    if (location.state?.openBuybackModal) {
      setShowBuybackModal(true);
    }
  }, [location.state]);

  const handleOracleNumberChange = async (e) => {
    const oracleNumber = e.target.value;
    setFormData({ ...formData, oracle_number: oracleNumber });

    // Clear any previous errors
    setErrors(prev => ({ ...prev, oracle_number: "", submit: "" }));

    if (oracleNumber) {
      try {
        // Check if asset is under repair
        const repairResponse = await axios.get(`${API_URL}/api/repairs/under-repair/oracle-numbers`);
        const underRepairOracleNumbers = repairResponse.data.oracle_numbers || [];

        if (underRepairOracleNumbers.includes(oracleNumber)) {
          setErrors(prev => ({
            ...prev,
            oracle_number: "This asset is currently under repair and cannot be processed here."
          }));
          // Clear the form data if asset is under repair
          setFormData(prev => ({
            ...prev,
            asset_type: "",
            asset_model: "",
            employee_name: "",
            employee_department: "",
            employee_designation: "",
            allocation_date: "",
            expected_return_date: ""
          }));
          return;
        }

        const response = await axios.get(`${API_URL}/api/assets/${oracleNumber}/assignment-details`);
        const assignmentData = response.data;

        setFormData(prev => ({
          ...prev,
          asset_type: assignmentData.asset_type || "",
          asset_model: assignmentData.asset_model || "",
          employee_name: assignmentData.employee_name || "",
          employee_department: assignmentData.employee_department || "",
          employee_designation: assignmentData.employee_designation || "",
          allocation_date: assignmentData.allocation_date || "",
          expected_return_date: assignmentData.expected_return_date || ""
        }));
      } catch (error) {
        console.error("Failed to fetch assignment details", error);
        setErrors(prev => ({
          ...prev,
          oracle_number: "Failed to validate Oracle Number. Please try again."
        }));
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleExport = (exportFilteredOnly) => {
    const dataToExport = exportFilteredOnly ? filteredAssets : returnedAssets;

    if (dataToExport.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = [
      'Oracle Number', 'Asset Type', 'Asset Model', 'Serial Number', 'Employee Name',
      'Employee Department', 'Employee Designation', 'Allocation Date', 'Expected Return Date',
      'Return Date', 'Condition', 'Voucher', 'Notes', 'Time of Addition'
    ];

    const csvContent = [
      headers.join(','),
      ...dataToExport.map(asset => [
        asset.oracle_number || '', asset.asset_type || '', asset.asset_model || '',
        asset.serial_number || '', asset.employee_name || '', asset.employee_department || '',
        asset.employee_designation || '', asset.allocation_date || '', asset.expected_return_date || '',
        asset.return_date || '', asset.condition || '', asset.voucher ? 'Yes' : 'No',
        asset.notes || '', asset.timestamp || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `returned_assets_${exportFilteredOnly ? 'filtered' : 'all'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBuybackExport = (exportFilteredOnly) => {
    const dataToExport = exportFilteredOnly ? filteredBuybackAssets : buybackAssets;
    // Similar export logic as handleExport
  };

  const handleDamagedExport = (exportFilteredOnly) => {
    const dataToExport = exportFilteredOnly ? filteredDamagedAssets : damagedAssets;
    // Similar export logic as handleExport
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.oracle_number) {
      newErrors.oracle_number = "Oracle Number is required";
    }
    
    if (!formData.return_option) {
      newErrors.return_option = "Return Option is required";
    }
    
    if (!formData.return_date) {
      newErrors.return_date = "Return Date is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'voucher' && formData[key]) {
          formDataToSend.append(key, formData[key]);
        } else if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      await axios.post(`${API_URL}/api/returns`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccessMessage("Asset returned successfully!");
      setFormData({
        oracle_number: "", asset_type: "", asset_model: "", employee_name: "",
        employee_department: "", employee_designation: "", allocation_date: "",
        expected_return_date: "", return_date: "", condition: "", return_option: "",
        voucher: null, comments: ""
      });
      
      fetchAssignedOracleNumbers();
      fetchReturns();
      if (window.fetchAssignments) window.fetchAssignments();
      if (window.fetchAssets) window.fetchAssets();
      if (window.fetchReports) window.fetchReports();
    } catch (error) {
      console.error("Failed to submit return", error);
      setErrors({ submit: "Failed to submit return. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
        <div className="text-sm text-gray-700">
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalPages * itemsPerPage)} entries
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {[...Array(Math.min(5, totalPages))].map((_, index) => {
            const page = index + 1;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {page}
              </button>
            );
          })}
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Return Asset Summary Card */}
          <div 
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer p-6 border border-gray-100"
            onClick={() => setShowModal(true)}
          >
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <ArrowLeft className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Returned Assets</h3>
                <p className="text-3xl font-bold text-gray-900">{returnedAssets.length}</p>
              </div>
            </div>
          </div>

          {/* Buyback Asset Summary Card */}
          <div 
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer p-6 border border-gray-100"
            onClick={() => setShowBuybackModal(true)}
          >
            <div className="flex items-center space-x-4">
              <div className="bg-teal-100 p-3 rounded-xl">
                <ShoppingCart className="w-8 h-8 text-teal-600" />
              </div>
              <div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Buyback Assets</h3>
                <p className="text-3xl font-bold text-gray-900">{buybackAssets.length}</p>
              </div>
            </div>
          </div>

          {/* Damaged Asset Summary Card */}
          <div 
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer p-6 border border-gray-100"
            onClick={() => setShowDamagedModal(true)}
          >
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 p-3 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Damaged Assets</h3>
                <p className="text-3xl font-bold text-gray-900">{damagedAssets.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Return Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Return Asset Form</h2>
          
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          )}
          
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">{errors.submit}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Oracle Number with Autocomplete */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Oracle Number *
              </label>
              <input
                type="text"
                name="oracle_number"
                value={formData.oracle_number}
                onChange={handleOracleNumberChange}
                list="oracleNumbers"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.oracle_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter Oracle Number"
              />
              <datalist id="oracleNumbers">
                {oracleNumbers.map((number) => (
                  <option key={number} value={number} />
                ))}
              </datalist>
              {errors.oracle_number && (
                <p className="mt-1 text-sm text-red-600">{errors.oracle_number}</p>
              )}
            </div>

            {/* Autofill Fields (Read-only) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Asset Type</label>
                <input
                  type="text"
                  value={formData.asset_type}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Asset Model</label>
                <input
                  type="text"
                  value={formData.asset_model}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee Name</label>
                <input
                  type="text"
                  value={formData.employee_name}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee Department</label>
                <input
                  type="text"
                  value={formData.employee_department}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee Designation</label>
                <input
                  type="text"
                  value={formData.employee_designation}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allocation Date</label>
                <input
                  type="text"
                  value={formData.allocation_date}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Return Date</label>
                <input
                  type="text"
                  value={formData.expected_return_date}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Return Date *</label>
                <input
                  type="date"
                  name="return_date"
                  value={formData.return_date}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.return_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.return_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.return_date}</p>
                )}
              </div>
            </div>

            {/* Condition on Return */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Condition on Return</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select Condition</option>
                <option value="Good">Good</option>
                <option value="Minor Damaged">Minor Damaged</option>
                <option value="Major Damaged">Major Damaged</option>
              </select>
            </div>

            {/* Return Option */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Return Option *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="return_option"
                    value="returned_to_inventory"
                    checked={formData.return_option === "returned_to_inventory"}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">Returned to Inventory</span>
                </label>
                <label className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="return_option"
                    value="employee_buyback"
                    checked={formData.return_option === "employee_buyback"}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">Employee Buyback</span>
                </label>
                <label className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="return_option"
                    value="marked_as_damaged"
                    checked={formData.return_option === "marked_as_damaged"}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">Marked as Damaged</span>
                </label>
              </div>
              {errors.return_option && (
                <p className="mt-2 text-sm text-red-600">{errors.return_option}</p>
              )}
            </div>

            {/* Attach Voucher */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Attach Voucher (Optional)</label>
              <input
                type="file"
                name="voucher"
                onChange={handleInputChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Comments (Optional)</label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                placeholder="e.g., Screen cracked, Expired warranty"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            <button 
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {submitting ? "Submitting..." : "Submit Return"}
            </button>
          </div>
        </div>

        {/* Returned Assets Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Returned Assets</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Search and Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by Oracle number, asset type, model, employee name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <select
                    value={conditionFilter}
                    onChange={(e) => setConditionFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="All">All Conditions</option>
                    <option value="Good">Good</option>
                    <option value="Minor Damaged">Minor Damaged</option>
                    <option value="Major Damaged">Major Damaged</option>
                  </select>

                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <span className="text-gray-500 self-center">to</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleExport(false)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </button>
                    {/* <button 
                      onClick={() => handleExport(true)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Filtered
                    </button> */}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border rounded-lg">
                  {filteredAssets.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No assets to display</p>
                    </div>
                  ) : (
                    <table className="w-full border-collapse bg-white">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Oracle Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Asset Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Asset Model</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Serial Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Employee Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Department</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Designation</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Allocation Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Expected Return Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Return Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Condition</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Voucher</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Notes</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Time of Addition</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {getPaginatedData(filteredAssets, currentPage).map(asset => (
                          <tr key={asset.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.oracle_number || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.asset_type || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.asset_model || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.serial_number || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.employee_name || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.employee_department || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.employee_designation || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatDate(asset.allocation_date)}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatDate(asset.expected_return_date)}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatDate(asset.return_date)}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                asset.condition === 'Good' ? 'bg-green-100 text-green-800' :
                                asset.condition === 'Minor Damaged' ? 'bg-yellow-100 text-yellow-800' :
                                asset.condition === 'Major Damaged' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {asset.condition || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.voucher ? 'Yes' : 'No'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{asset.notes || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatDateTime(asset.timestamp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <PaginationControls 
                  currentPage={currentPage} 
                  totalPages={getTotalPages(filteredAssets.length)} 
                  onPageChange={setCurrentPage} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Buyback Modal */}
        {showBuybackModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Buyback Assets</h2>
                <button 
                  onClick={() => setShowBuybackModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Search and Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by Oracle number, asset type, model, employee name..."
                      value={buybackSearchTerm}
                      onChange={(e) => setBuybackSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={buybackStartDate}
                      onChange={(e) => setBuybackStartDate(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <span className="text-gray-500 self-center">to</span>
                    <input
                      type="date"
                      value={buybackEndDate}
                      onChange={(e) => setBuybackEndDate(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleBuybackExport(false)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </button>
                    {/* <button 
                      onClick={() => handleBuybackExport(true)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Filtered
                    </button> */}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border rounded-lg">
                  {filteredBuybackAssets.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No assets to display</p>
                    </div>
                  ) : (
                    <table className="w-full border-collapse bg-white">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Oracle Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Asset Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Asset Model</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Serial Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Employee Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Department</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Designation</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Allocation Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Expected Return Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Return Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Condition</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Voucher</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Notes</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Time of Addition</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {getPaginatedData(filteredBuybackAssets, buybackCurrentPage).map(asset => (
                          <tr key={asset.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.oracle_number || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.asset_type || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.asset_model || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.serial_number || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.employee_name || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.employee_department || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.employee_designation || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatDate(asset.allocation_date)}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatDate(asset.expected_return_date)}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatDate(asset.return_date)}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                asset.condition === 'Good' ? 'bg-green-100 text-green-800' :
                                asset.condition === 'Minor Damaged' ? 'bg-yellow-100 text-yellow-800' :
                                asset.condition === 'Major Damaged' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {asset.condition || ''}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.voucher ? 'Yes' : 'No'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{asset.notes || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatDateTime(asset.timestamp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <PaginationControls 
                  currentPage={buybackCurrentPage} 
                  totalPages={getTotalPages(filteredBuybackAssets.length)} 
                  onPageChange={setBuybackCurrentPage} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Damaged Modal */}
        {showDamagedModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Damaged Assets</h2>
                <button 
                  onClick={() => setShowDamagedModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Search and Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by Oracle number, asset type, model, employee name..."
                      value={damagedSearchTerm}
                      onChange={(e) => setDamagedSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={damagedStartDate}
                      onChange={(e) => setDamagedStartDate(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <span className="text-gray-500 self-center">to</span>
                    <input
                      type="date"
                      value={damagedEndDate}
                      onChange={(e) => setDamagedEndDate(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleDamagedExport(false)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </button>
                    {/* <button 
                      onClick={() => handleDamagedExport(true)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Filtered
                    </button> */}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border rounded-lg">
                  {filteredDamagedAssets.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No assets to display</p>
                    </div>
                  ) : (
                    <table className="w-full border-collapse bg-white">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Oracle Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Asset Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Asset Model</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Serial Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Employee Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Department</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Designation</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Allocation Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Expected Return Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Return Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Condition</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Voucher</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Notes</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Time of Addition</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {getPaginatedData(filteredDamagedAssets, damagedCurrentPage).map(asset => (
                          <tr key={asset.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.oracle_number || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.asset_type || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.asset_model || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.serial_number || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.employee_name || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.employee_department || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.employee_designation || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatDate(asset.allocation_date)}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatDate(asset.expected_return_date)}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatDate(asset.return_date)}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                asset.condition === 'Good' ? 'bg-green-100 text-green-800' :
                                asset.condition === 'Minor Damaged' ? 'bg-yellow-100 text-yellow-800' :
                                asset.condition === 'Major Damaged' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {asset.condition || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{asset.voucher ? 'Yes' : 'No'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{asset.notes || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatDateTime(asset.timestamp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <PaginationControls 
                  currentPage={damagedCurrentPage} 
                  totalPages={getTotalPages(filteredDamagedAssets.length)} 
                  onPageChange={setDamagedCurrentPage} 
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReturnPage;