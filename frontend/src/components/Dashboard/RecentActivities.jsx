import React, { useEffect, useState } from 'react';
import ActivityModal from '../ActivityModal';
import axios from 'axios';

// const activityIcons = {
//   Assigned: '🔁',
//   Unassigned: '🔁',
//   Added: '➕',
//   Deleted: '🗑️',
//   Repaired: '🔧',
// };

// const activityColors = {
//   Assigned: 'text-green-600',
//   Unassigned: 'text-orange-500',
//   Added: 'text-blue-600',
//   Deleted: 'text-red-600',
//   Repaired: 'text-purple-600',
// };

const activityBgColors = {
  Assigned: 'bg-green-50 border-l-green-500',
  Unassigned: 'bg-orange-50 border-l-orange-500',
  Added: 'bg-blue-50 border-l-blue-500',
  Deleted: 'bg-red-50 border-l-red-500',
  Repaired: 'bg-purple-50 border-l-purple-500',
};

function formatDateTime(dateString) {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

const RecentActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/activity-logs');
      setActivities(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load recent activities.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 h-full">
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 font-medium">Loading recent activities...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 h-full">
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
      </div>
    );
  }

  // Sort activities by timestamp descending to ensure latest first
  const sortedActivities = [...activities].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          Recent Activity
        </h3>
        <div className="flex items-center text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Live Updates
        </div>
      </div>

      {sortedActivities.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No recent admin activity to show.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <div className="space-y-2 h-full overflow-y-auto pr-2 custom-scrollbar">
            {sortedActivities.slice(0, 5).map((activity, index) => (
              <div
                key={activity._id || `activity-${index}`}
                className={`relative p-4 rounded-xl border-l-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer group ${
                  activityBgColors[activity.activityType] || 'bg-gray-50 border-l-gray-500'
                }`}
                title={activity.remarks || ''}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      activity.activityType === 'Assigned' ? 'bg-green-100' :
                      activity.activityType === 'Unassigned' ? 'bg-orange-100' :
                      activity.activityType === 'Added' ? 'bg-blue-100' :
                      activity.activityType === 'Deleted' ? 'bg-red-100' :
                      activity.activityType === 'Repaired' ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      <span className={activityColors[activity.activityType] || 'text-gray-600'}>
                        {activityIcons[activity.activityType] || 'ℹ️'}
                      </span>
                    </div> */}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          activity.activityType === 'Assigned' ? 'bg-green-100 text-green-800' :
                          activity.activityType === 'Unassigned' ? 'bg-orange-100 text-orange-800' :
                          activity.activityType === 'Added' ? 'bg-blue-100 text-blue-800' :
                          activity.activityType === 'Deleted' ? 'bg-red-100 text-red-800' :
                          activity.activityType === 'Repaired' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {activity.activityType}
                        </span>
                        <div className="flex items-center text-xs text-gray-500">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          {formatDateTime(activity.timestamp)}
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {activity.assetType && (
                            <span className="text-gray-700">
                              <span className="font-medium text-gray-900">Type:</span> {activity.assetType}
                            </span>
                          )}
                          {activity.brandName && (
                            <span className="text-gray-700">
                              <span className="font-medium text-gray-900">Brand:</span> {activity.brandName}
                            </span>
                          )}
                        </div>
                        {activity.assetName && (
                          <div className="text-gray-700">
                            <span className="font-medium text-gray-900">Name/Model:</span> {activity.assetName}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {activity.employeeName && (
                            <span className="text-gray-700">
                              <span className="font-medium text-gray-900">Employee:</span> {activity.employeeName}
                            </span>
                          )}
                          {activity.departmentName && (
                            <span className="text-gray-700">
                              <span className="font-medium text-gray-900">Department:</span> {activity.departmentName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    className="flex-shrink-0 ml-3 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 shadow-sm hover:shadow-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedActivity(activity);
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedActivity && (
        <ActivityModal 
          activity={selectedActivity} 
          onClose={() => setSelectedActivity(null)} 
        />
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default RecentActivities;