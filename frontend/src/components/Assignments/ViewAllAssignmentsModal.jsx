import React, { useState, useEffect } from "react";
import axios from "axios";
import { calculateTimeCovered } from "../../utils/dateFormatter";
import { API_URL } from "../../config";

const ViewAllAssignmentsModal = ({ isOpen, onClose }) => {
  const [allAssignments, setAllAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [sortBy, setSortBy] = useState("assignmentDate");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    if (isOpen) {
      fetchAllAssignments();
    }
  }, [isOpen]);

  useEffect(() => {
    applyFilters();
  }, [allAssignments, searchTerm, filterType, sortBy, sortOrder]);

  const fetchAllAssignments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/assignments/all`);
      const formattedAssignments = res.data
        .filter((assignment) => {
          // Only show assets currently assigned or under repair but still assigned
          const status = String(assignment.status).trim().toLowerCase();
          const assetStatus = assignment.asset_status
            ? String(assignment.asset_status).trim().toLowerCase()
            : "";
          const isAssigned = status === "assigned";
          const isUnderRepair = status === "under repair";
          const hasEmployee =
            assignment.employee_name && assignment.employee_name.trim() !== "";
          // Exclude returned, buyback, damaged, or asset status buyback
          const isReturned =
            status === "returned" ||
            status === "buyback" ||
            status === "damaged" ||
            status === "used" ||
            assetStatus === "buyback";
          return (isAssigned || (isUnderRepair && hasEmployee)) && !isReturned;
        })
        .map((assignment) => ({
          id: assignment.id,
          oracleNumber: assignment.oracle_number,
          serialNumber: assignment.serial_number || "-",
          deviceName: assignment.device_name || "N/A",
          type: assignment.asset_type || "N/A",
          employeeName: assignment.employee_name,
          designation: assignment.designation || "",
          department: assignment.department || "",
          assignmentDate: assignment.assignment_date || "",
          expectedReturnDate: assignment.expected_return_date || "",
          actualReturnDate: assignment.actual_return_date || "-",
          status:
            assignment.status === "under repair" ? "Under Repair" : "Assigned",
          timestamp: assignment.timestamp || "",
          notes: assignment.notes || "-",
          allocationVoucher: assignment.allocation_voucher_path
            ? assignment.allocation_voucher_path.split(/[/\\]/).pop()
            : "No Voucher",
          remainingTime: assignment.expected_return_date
            ? Math.ceil(
                (new Date(assignment.expected_return_date) - new Date()) /
                  (1000 * 60 * 60 * 24)
              )
            : 0,
        }));
      setAllAssignments(formattedAssignments);
    } catch (err) {
      console.error("Failed to fetch all assignments:", err);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...allAssignments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (assignment) =>
          assignment.employeeName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          assignment.oracleNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          assignment.serialNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          assignment.deviceName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          assignment.department
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          assignment.designation
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter(
        (assignment) => assignment.type === filterType
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "assignmentDate":
          aVal = new Date(a.assignmentDate);
          bVal = new Date(b.assignmentDate);
          break;
        case "employeeName":
          aVal = a.employeeName.toLowerCase();
          bVal = b.employeeName.toLowerCase();
          break;
        case "serialNumber":
          aVal = a.serialNumber.toLowerCase();
          bVal = b.serialNumber.toLowerCase();
          break;
        case "type":
          aVal = a.type.toLowerCase();
          bVal = b.type.toLowerCase();
          break;
        default:
          aVal = new Date(a.timestamp);
          bVal = new Date(b.timestamp);
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredAssignments(filtered);
  };

  const handleDownload = () => {
    const csvContent = [
      [
        "Oracle Number",
        "Serial Number",
        "Device Name",
        "Type",
        "Employee Name",
        "Designation",
        "Department",
        "Assignment Date",
        "Expected Return Date",
        "Time Covered",
        "Time Remaining",
        "Status",
        "Allocation Voucher",
        "Notes",
      ],
      ...filteredAssignments.map((assignment) => {
        const remainingTimeFormatted =
          assignment.remainingTime <= 0
            ? "Overdue"
            : `${assignment.remainingTime} days`;
        return [
          assignment.oracleNumber,
          assignment.serialNumber,
          assignment.deviceName,
          assignment.type,
          assignment.employeeName,
          assignment.designation,
          assignment.department,
          assignment.assignmentDate,
          assignment.expectedReturnDate,
          calculateTimeCovered(
            assignment.assignmentDate,
            assignment.expectedReturnDate
          ),
          remainingTimeFormatted,
          assignment.status,
          assignment.allocationVoucher,
          assignment.notes,
        ];
      }),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `asset_assignments_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case "assigned":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1.5"></div>
            Assigned
          </span>
        );
      case "under repair":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mr-1.5"></div>
            Under Repair
          </span>
        );
      case "returned":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-1.5"></div>
            Returned
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full mr-1.5"></div>
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <div className="w-1.5 h-1.5 bg-gray-600 rounded-full mr-1.5"></div>
            {status}
          </span>
        );
    }
  };

  const getRemainingTimeBadge = (remainingTime) => {
    if (remainingTime <= 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
          Overdue
        </span>
      );
    } else if (remainingTime <= 7) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
          {remainingTime} days
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
          {remainingTime} days
        </span>
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-2.5 py-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-none max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                ></path>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                All Asset Assignments
              </h2>
              <p className="text-sm text-gray-500">
                Manage and track all asset assignments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
            >
              <option value="all">All Types</option>
              {[...new Set(allAssignments.map((a) => a.type))].map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {/* Status Filter */}

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
            >
              <option value="assignmentDate">Assignment Date</option>
              <option value="employeeName">Employee Name</option>
              <option value="serialNumber">Serial Number</option>
              <option value="type">Asset Type</option>
            </select>

            {/* Sort Order & Download */}
            <div className="flex space-x-2">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
              <button
                onClick={handleDownload}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium text-sm flex items-center space-x-2 whitespace-nowrap"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <span className="font-medium text-gray-900">
                  {filteredAssignments.length}
                </span>
                <span className="ml-1">
                  of {allAssignments.length} assignments
                </span>
              </span>
              {searchTerm && (
                <span className="text-green-600">
                  Filtered by: "{searchTerm}"
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <p className="text-gray-600 font-medium">
                  Loading assignments...
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-auto h-full">
              <div className="min-w-full inline-block align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Oracle Asset Number
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Serial Number
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Device Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assignment Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expected Return
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time Covered
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remaining
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Voucher
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAssignments.length === 0 ? (
                      <tr>
                        <td colSpan="12" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <svg
                              className="w-12 h-12 text-gray-400 mb-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4"
                              ></path>
                            </svg>
                            <p className="text-gray-500 font-medium">
                              No assignments found
                            </p>
                            <p className="text-gray-400 text-sm">
                              Try adjusting your search criteria
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredAssignments.map((assignment, index) => (
                        <tr
                          key={assignment.id}
                          className={`hover:bg-gray-50 transition-colors duration-150 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-25"
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {assignment.oracleNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                            {assignment.serialNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {assignment.deviceName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {assignment.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-medium">
                              {assignment.employeeName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {assignment.designation}
                            </div>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {calculateTimeCovered(
                              assignment.assignmentDate,
                              assignment.expectedReturnDate
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getRemainingTimeBadge(assignment.remainingTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(assignment.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {assignment.allocationVoucher}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewAllAssignmentsModal;
