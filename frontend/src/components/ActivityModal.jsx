import React from 'react';
import { FaTimes, FaInfoCircle, FaUser, FaBuilding, FaClock, FaTag, FaComments } from 'react-icons/fa';

const ActivityModal = ({ activity, onClose }) => {
  if (!activity) return null;

  const getActivityIcon = (activityType) => {
    switch (activityType?.toLowerCase()) {
      case 'assigned':
        return '🔁';
      case 'unassigned':
        return '🔁';
      case 'added':
        return '➕';
      case 'deleted':
        return '🗑️';
      case 'repaired':
        return '🔧';
      default:
        return 'ℹ️';
    }
  };

  const getActivityColor = (activityType) => {
    switch (activityType?.toLowerCase()) {
      case 'assigned':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'unassigned':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'added':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'deleted':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'repaired':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    try {
      return new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return '-';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <FaInfoCircle className="text-lg" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Activity Details</h3>
                <p className="text-blue-100 text-sm">Asset management activity log</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-all duration-200"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {/* Activity Type Badge */}
          {/* <div className="flex items-center justify-center mb-6">
            <div className={`inline-flex items-center px-4 py-2 rounded-full border text-sm font-medium ${getActivityColor(activity.activityType)}`}>
              <span className="mr-2 text-lg">{getActivityIcon(activity.activityType)}</span>
              {activity.activityType || 'Unknown Activity'}
            </div>
          </div> */}

          {/* Details Grid */}
          <div className="space-y-6">
            {/* Asset Information Section */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FaTag className="mr-2 text-blue-500" />
                Asset Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Activity Type</label>
                  <p className="text-sm font-medium text-gray-900">{activity.activityType || 'Unknown Activity'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Asset Type</label>
                  <p className="text-sm font-medium text-gray-900">{activity.assetType || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Brand Name</label>
                  <p className="text-sm font-medium text-gray-900">{activity.brandName || '-'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Model/Name</label>
                  <p className="text-sm font-medium text-gray-900">{activity.assetName || '-'}</p>
                </div>
              </div>
            </div>

            {/* Employee Information Section */}
            {(activity.employeeName || activity.departmentName) && (
              <div className="bg-emerald-50 rounded-xl p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FaUser className="mr-2 text-emerald-500" />
                  Employee Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Employee Name</label>
                    <p className="text-sm font-medium text-gray-900">{activity.employeeName || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Department</label>
                    <p className="text-sm font-medium text-gray-900">{activity.departmentName || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Timeline Section */}
            <div className="bg-amber-50 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FaClock className="mr-2 text-amber-500" />
                Timeline
              </h4>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date & Time</label>
                <p className="text-sm font-medium text-gray-900">{formatDateTime(activity.timestamp)}</p>
              </div>
            </div>

            {/* Remarks Section */}
            {activity.remarks && (
              <div className="bg-purple-50 rounded-xl p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FaComments className="mr-2 text-purple-500" />
                  Additional Notes
                </h4>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Remarks</label>
                  <p className="text-sm text-gray-700 leading-relaxed bg-white p-3 rounded-lg border">
                    {activity.remarks}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-medium text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityModal;