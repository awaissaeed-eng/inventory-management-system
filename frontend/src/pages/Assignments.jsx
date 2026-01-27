import  { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ViewAllAssignmentsModal from '../components/Assignments/ViewAllAssignmentsModal';
import DepartmentDropdown from '../components/Assignments/DepartmentDropdown';
import DesignationDropdown from '../components/Assignments/DesignationDropdown';
import VoucherPreviewModal from '../components/VoucherPreviewModal';
import { 
  FaUserCheck, 
   
  FaPlus, 
  FaEye, 
  FaFileAlt, 
  FaSpinner, 
  FaExclamationTriangle,
  FaClock,
  FaCheckCircle,
  FaTimes
} from 'react-icons/fa';
import { API_URL } from '../config';

const Assignments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [assets, setAssets] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [assignedCount, setAssignedCount] = useState(0);

  // Form state
  const [form, setForm] = useState({
    employeeName: '',
    designation: '',
    department: '',
    assetType: '',
    oracleNumber: '',
    assignmentDate: '',
    expectedReturnDate: '',
    notes: '',
    allocationVoucher: null
  });

  const [editingId, setEditingId] = useState(null);
  const [oracleNumberSearch, setOracleNumberSearch] = useState('');
  const [filteredOracleNumbers, setFilteredOracleNumbers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [voucherModal, setVoucherModal] = useState({ isOpen: false, path: '', filename: '' });

  // Fetch functions
  useEffect(() => {
    fetchAssets();
    fetchAssignments();
    fetchAssignedCount();
  }, []);

  // Handle navigation state
  useEffect(() => {
    const navigationState = location.state;
    if (navigationState?.showAllAssignments) {
      setIsModalOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/assignments`);
      const formattedAssignments = res.data
        .filter(assignment => {
          const status = String(assignment.status).trim().toLowerCase();
          const assetStatus = assignment.asset_status ? String(assignment.asset_status).trim().toLowerCase() : '';
          const isAssigned = status === 'assigned';
          const isUnderRepair = status === 'under repair';
          const hasEmployee = assignment.employee_name && assignment.employee_name.trim() !== '';
          const isReturned = status === 'returned' || status === 'buyback' || status === 'damaged' || status === 'used' || assetStatus === 'buyback';
          return (isAssigned || (isUnderRepair && hasEmployee)) && !isReturned;
        })
        .map(assignment => {
          const voucherPath = assignment.allocation_voucher_path || '';
          const voucherFilename = voucherPath ? voucherPath.split(/[/\\]/).pop() : '';
          return {
            id: assignment.id,
            oracleNumber: assignment.oracle_number,
            deviceName: assignment.device_name || 'N/A',
            type: assignment.asset_type || 'N/A',
            employeeName: assignment.employee_name,
            designation: assignment.designation || '',
            department: assignment.department || '',
            assignmentDate: assignment.assignment_date || '',
            expectedReturnDate: assignment.expected_return_date || '',
            status: assignment.status === 'under repair' ? 'Under Repair' : 'Assigned',
            timestamp: assignment.timestamp || '',
            allocationVoucher: voucherFilename,
            allocationVoucherPath: voucherPath,
            remainingTime: assignment.expected_return_date
              ? Math.ceil((new Date(assignment.expected_return_date) - new Date()) / (1000 * 60 * 60 * 24))
              : 0
          };
        });
      setAssignments(formattedAssignments);
    } catch (err) {
      setError('Failed to fetch assignments.');
      console.error(err);
    }
    setLoading(false);
  };

  window.fetchAssignments = fetchAssignments;

  const fetchAssignedCount = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/assignments/count`);
      setAssignedCount(res.data.assigned_count || 0);
    } catch (err) {
      console.error('Failed to fetch assigned count:', err);
    }
  };

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/assets`);
      setAssets(res.data);
    } catch (err) {
      setError('Failed to fetch assets.');
      console.error(err);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === 'assetType') {
      setOracleNumberSearch('');
      setForm(prev => ({ ...prev, oracleNumber: '' }));
      const newAssets = getNewOracleNumbers();
      setFilteredOracleNumbers(newAssets);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('oracle_number', form.oracleNumber);
      formData.append('employee_name', form.employeeName);
      formData.append('designation', form.designation);
      formData.append('department', form.department);
      formData.append('assignment_date', form.assignmentDate);
      formData.append('expected_return_date', form.expectedReturnDate);
      formData.append('notes', form.notes);

      if (form.allocationVoucher) {
        formData.append('allocation_voucher', form.allocationVoucher);
      }

      if (editingId) {
        await axios.put(`${API_URL}/api/assignments/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post(`${API_URL}/api/assignments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // Reset form
      setForm({
        employeeName: '',
        designation: '',
        department: '',
        assetType: '',
        oracleNumber: '',
        assignmentDate: '',
        expectedReturnDate: '',
        notes: '',
        allocationVoucher: null
      });
      setEditingId(null);
      setError('');

      await fetchAssignments();
    } catch (err) {
      if (err.response?.data?.error) {
        setError(`Failed to add assignment: ${err.response.data.error}`);
      } else {
        setError('Failed to save assignment.');
      }
      console.error(err);
    }
    setLoading(false);
  };

  const assetTypes = [...new Set(assets.map(asset => asset.device_type || asset.type).filter(type => type))];

  const getNewOracleNumbers = () => {
    const assignedOracleNumbers = new Set(assignments.map(a => a.oracleNumber));
    return assets
      .filter(asset => {
        const isAssignable = asset.status === 'new' || asset.status === 'used' || !asset.status;
        const matchesType = form.assetType ? asset.device_type === form.assetType : true;
        const isNotAssigned = !assignedOracleNumbers.has(asset.oracle_number);
        return isAssignable && matchesType && isNotAssigned && asset.oracle_number;
      })
      .map(asset => ({
        oracle_number: asset.oracle_number,
        device_name: asset.device_name || '',
        brand_name: asset.brand_name || '',
        model_name: asset.model_name || ''
      }));
  };

  const handleOracleNumberSearch = (searchTerm) => {
    setOracleNumberSearch(searchTerm);
    const newAssets = getNewOracleNumbers();
    const filtered = newAssets.filter(on =>
      on.oracle_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOracleNumbers(filtered);
  };

  const handleOracleNumberSelect = (oracleNumber) => {
    setForm(prev => ({ ...prev, oracleNumber }));
    setOracleNumberSearch(oracleNumber);
    setFilteredOracleNumbers([]);

    const asset = assets.find(a => a.oracle_number === oracleNumber);
    if (asset) {
      setForm(prev => ({ ...prev, assetType: asset.device_type || '' }));
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Under Repair') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <FaExclamationTriangle className="mr-1" />
          Under Repair
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <FaCheckCircle className="mr-1" />
        Assigned
      </span>
    );
  };

  const getRemainingTimeBadge = (days) => {
    if (days < 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
          <FaClock className="mr-1" />
          Overdue
        </span>
      );
    } else if (days <= 7) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
          <FaClock className="mr-1" />
          {days} days
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
        <FaClock className="mr-1" />
        {days} days
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
              <FaUserCheck className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Asset Assignments</h1>
              <p className="text-gray-600">Assign assets to employees and track allocations</p>
            </div>
          </div>
          <div className="bg-white rounded-xl px-4 py-2 shadow-lg border border-gray-200">
            <div className="text-sm text-gray-600">Assigned Assets</div>
            <div className="text-2xl font-bold text-green-600">{assignedCount}</div>
          </div>
        </div>
      </div>

      {/* Assignment Form */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
            <FaPlus className="text-white text-sm" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">New Assignment</h2>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
            <FaExclamationTriangle className="mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700">
                Employee Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="employeeName"
                value={form.employeeName}
                onChange={handleChange}
                placeholder="Enter employee name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="employeeDesignation" className="block text-sm font-medium text-gray-700">
                Designation <span className="text-red-500">*</span>
              </label>
              <DesignationDropdown
                value={form.designation}
                onChange={(value) => setForm(prev => ({ ...prev, designation: value }))}
                placeholder="Select Designation"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="employeeDepartment" className="block text-sm font-medium text-gray-700">
                Department <span className="text-red-500">*</span>
              </label>
              <DepartmentDropdown
                value={form.department}
                onChange={(value) => setForm(prev => ({ ...prev, department: value }))}
                placeholder="Select Department"
              />
            </div>
          </div>

          {/* Asset Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Asset Type <span className="text-red-500">*</span>
              </label>
              <select
                name="assetType"
                value={form.assetType}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                required
              >
                <option value="">Select Asset Type</option>
                {assetTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Oracle Asset Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="oracleNumber"
                  value={oracleNumberSearch}
                  onChange={(e) => handleOracleNumberSearch(e.target.value)}
                  onFocus={() => {
                    const newAssets = getNewOracleNumbers();
                    setFilteredOracleNumbers(newAssets);
                  }}
                  placeholder={form.assetType ? `Search ${form.assetType} oracle numbers...` : "Select asset type first..."}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  disabled={!form.assetType}
                  required
                />
                
                {filteredOracleNumbers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {filteredOracleNumbers.map(on => (
                      <div
                        key={on.oracle_number}
                        className="px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        onClick={() => handleOracleNumberSelect(on.oracle_number)}
                      >
                        <div className="font-medium text-gray-900">{on.oracle_number}</div>
                        <div className="text-sm text-gray-600">{on.device_name} ({on.brand_name})</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Date Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Assignment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="assignmentDate"
                value={form.assignmentDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Expected Return Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="expectedReturnDate"
                value={form.expectedReturnDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Allocation Voucher (Picture/PDF)</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FaFileAlt className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF (MAX. 10MB)</p>
                </div>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setForm(prev => ({ ...prev, allocationVoucher: file }));
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
            
            {form.allocationVoucher && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <FaFileAlt className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">{form.allocationVoucher.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, allocationVoucher: null }))}
                  className="p-1 text-blue-600 hover:text-blue-800 transition-colors duration-200"
                >
                  <FaTimes />
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Comments</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Add any additional notes or comments..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FaUserCheck />
                  <span>{editingId ? 'Update Assignment' : 'Assign Asset'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Current Assignments Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Current Assignments</h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium text-sm flex items-center space-x-2"
            >
              <FaEye />
              <span>View All</span>
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <FaSpinner className="animate-spin text-4xl text-blue-600" />
              <p className="text-gray-600 font-medium">Loading assignments...</p>
            </div>
          </div>
        )}

        {!loading && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oracle Number</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Remaining</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voucher</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <FaUserCheck className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 font-medium">No assignments found</p>
                        <p className="text-gray-400 text-sm">Start by creating your first asset assignment</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  assignments.slice(0, 10).map((assignment, index) => (
                    <tr key={assignment.oracleNumber} className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {assignment.oracleNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {assignment.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {assignment.deviceName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{assignment.employeeName}</div>
                        <div className="text-sm text-gray-500">{assignment.designation}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {assignment.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {assignment.assignmentDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {assignment.expectedReturnDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(assignment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRemainingTimeBadge(assignment.remainingTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {assignment.allocationVoucher ? (
                          <button
                            onClick={() => setVoucherModal({
                              isOpen: true,
                              path: assignment.allocationVoucherPath,
                              filename: assignment.allocationVoucher
                            })}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                          >
                            <FaFileAlt />
                            <span>View</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">No Voucher</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {assignments.length > 10 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Showing 10 of {assignments.length} assignments. 
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-blue-600 hover:text-blue-800 font-medium ml-1"
              >
                View all assignments
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <ViewAllAssignmentsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {voucherModal.isOpen && (
        <VoucherPreviewModal
          voucherPath={voucherModal.path}
          voucherFilename={voucherModal.filename}
          onClose={() => setVoucherModal({ isOpen: false, path: '', filename: '' })}
        />
      )}
    </div>
  );
};

export default Assignments;