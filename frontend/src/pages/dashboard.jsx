import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import RecentActivities from '../components/Dashboard/RecentActivities';
import ViewAllAssignmentsModal from '../components/Assignments/ViewAllAssignmentsModal';
import AllAssetsModal from '../components/Assets/AllAssetsModal';
import { FaDatabase, FaBox, FaUser, FaWrench, FaExclamationTriangle, FaShoppingCart, FaGavel, FaTimes, FaDownload, FaFilter } from 'react-icons/fa';
import { API_URL } from '../config';

ChartJS.register(ArcElement, Tooltip, Legend);

// Dashboard Component
function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [assignmentsModalOpen, setAssignmentsModalOpen] = useState(false);
  const [showAllAssetsModal, setShowAllAssetsModal] = useState(false);
  const [isStockOnlyModal, setIsStockOnlyModal] = useState(false);

  const fetchDashboardStats = () => {
    axios.get(`${API_URL}/api/dashboard`)
      .then(res => {
        setStats(res.data);
      })
      .catch(err => {
        console.error("Failed to fetch dashboard data", err);
      });
  };

  const fetchAssignedCount = () => {
    axios.get(`${API_URL}/api/assignments/count`)
      .then(res => {
        setStats(prev => {
          if (!prev) return null;
          if (prev.assigned !== res.data.assigned_count) {
            return {...prev, assigned: res.data.assigned_count};
          }
          return prev;
        });
      })
      .catch(err => {
        console.error("Failed to fetch assigned count", err);
      });
  };

  const handleViewStockOnlyAssets = (stockOnly = false) => {
    setIsStockOnlyModal(stockOnly);
    setShowAllAssetsModal(true);
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchAssignedCount();
  }, []);

  useEffect(() => {
    if (modalOpen && selectedStatus !== null) {
      setLoadingAssets(true);
      if (selectedStatus === 'assigned' || selectedStatus === 'unassigned' || selectedStatus === 'new') {
        axios.get(`${API_URL}/api/assets`)
          .then(res => {
            setAssets(res.data);
            setLoadingAssets(false);
          })
          .catch(err => {
            console.error("Failed to fetch assets", err);
            setLoadingAssets(false);
          });
      } else if (selectedStatus === 'stock') {
        axios.get(`${API_URL}/api/assets?stock=true`)
          .then(res => {
            setAssets(res.data);
            setLoadingAssets(false);
          })
          .catch(err => {
            console.error("Failed to fetch stock assets", err);
            setLoadingAssets(false);
          });
      } else {
        axios.get(`${API_URL}/api/assets?status=${encodeURIComponent(selectedStatus)}`)
          .then(res => {
            setAssets(res.data);
            setLoadingAssets(false);
          })
          .catch(err => {
            console.error("Failed to fetch assets", err);
            setLoadingAssets(false);
          });
      }
    }
  }, [modalOpen, selectedStatus]);


  const closeModal = () => {
    setModalOpen(false);
    setSelectedStatus(null);
    setAssets([]);
    setFilterType("");
  };

  const filteredAssets = useMemo(() => {
    let filtered = assets;
    if (selectedStatus === 'assigned') {
      filtered = assets.filter(asset => {
        const hasAssignment = asset.assigned_to && asset.assigned_to !== '';
        const isDamaged = asset.status && asset.status.toLowerCase() === 'damaged';
        const isAuctioned = asset.status && asset.status.toLowerCase() === 'auctioned';
        return hasAssignment && !isDamaged && !isAuctioned;
      });
    } else if (selectedStatus === 'unassigned') {
      filtered = assets.filter(asset => {
        const isAuctioned = asset.status && asset.status.toLowerCase() === 'auctioned';
        return (!asset.assigned_to || asset.assigned_to === '') && !isAuctioned;
      });
    } else if (selectedStatus === 'new') {
      filtered = assets.filter(asset => {
        const isAssigned = asset.assigned_to && asset.assigned_to !== '';
        const isUnderRepair = asset.status && asset.status.toLowerCase() === 'under repair';
        const isDamaged = asset.status && asset.status.toLowerCase() === 'damaged';
        const isAuctioned = asset.status && asset.status.toLowerCase() === 'auctioned';
        return !isAssigned && !isUnderRepair && !isDamaged && !isAuctioned;
      });
    } else if (selectedStatus === 'under repair') {
      filtered = assets.filter(asset => {
        const isUnderRepair = asset.status && asset.status.toLowerCase() === 'under repair';
        const isAuctioned = asset.status && asset.status.toLowerCase() === 'auctioned';
        return isUnderRepair && !isAuctioned;
      });
    } else if (selectedStatus === 'damaged') {
      filtered = assets.filter(asset => {
        const isDamaged = asset.status && asset.status.toLowerCase() === 'damaged';
        const isAuctioned = asset.status && asset.status.toLowerCase() === 'auctioned';
        return isDamaged && !isAuctioned;
      });
    } else if (!selectedStatus || selectedStatus === '') {
      filtered = assets;
    }
    if (!filterType) return filtered;
    return filtered.filter(asset => {
      if (!asset.type) return false;
      return asset.type.toLowerCase() === filterType.toLowerCase();
    });
  }, [assets, filterType, selectedStatus]);

  const chartData = useMemo(() => {
    if (!stats) return null;
    return {
      labels: ['Stock', 'Assigned', 'Under Repair', 'Damaged', 'Buyback', 'Auction'],
      datasets: [
        {
          data: [stats.stock_count, stats.assigned, stats.under_repair, stats.damaged, stats.buyback_count, stats.auctioned],
          backgroundColor: [
            '#1e3a8a', // blue-800
            '#059669', // emerald-600
            '#d97706', // amber-600
            '#dc2626', // red-600
            '#0891b2', // cyan-600
            '#7c3aed', // violet-600
          ],
          borderColor: [
            '#1e40af', // blue-700
            '#047857', // emerald-700
            '#b45309', // amber-700
            '#b91c1c', // red-700
            '#0e7490', // cyan-700
            '#6d28d9', // violet-700
          ],
          borderWidth: 2,
          hoverBorderWidth: 3,
        },
      ],
    };
  }, [stats]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 2,
      }
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const title = `Assets_${selectedStatus || "All"}_${filterType || "All"}_${new Date().toLocaleDateString()}`;
    doc.text(title, 14, 16);
    const columns = Object.keys(assets[0] || {}).map(key => ({ header: key, dataKey: key }));
    const rows = filteredAssets.map(asset => {
      const row = {};
      Object.entries(asset).forEach(([key, value]) => {
        row[key] = value ? value.toString() : "";
      });
      return row;
    });
    doc.autoTable({
      columns,
      body: rows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen p-4 lg:p-6">
      {/* Header Section */}
      {/* <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600 text-lg">Asset Management Overview</p>
          </div>
          <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Data</span>
          </div>
        </div>
      </div> */}

      {/* Stats Cards */}
      {stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 lg:gap-6 mb-8">
          {/* Total Assets */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl cursor-pointer flex flex-col items-center transition-all duration-300 hover:-translate-y-1 border border-gray-100 group" 
               onClick={() => navigate('/assets', { state: { showAllAssets: true } })}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-blue-500 to-blue-700 text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <FaDatabase className="text-xl" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2 text-center">Total Assets</h3>
            <p className="text-3xl font-bold text-blue-900">{stats.total_assets}</p>
          </div>

          {/* Stock */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl cursor-pointer flex flex-col items-center transition-all duration-300 hover:-translate-y-1 border border-gray-100 group" 
               onClick={() => handleViewStockOnlyAssets(true)}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <FaBox className="text-xl" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2 text-center">Stock</h3>
            <p className="text-3xl font-bold text-indigo-900">{stats.stock_count}</p>
          </div>

          {/* Assigned */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl cursor-pointer flex flex-col items-center transition-all duration-300 hover:-translate-y-1 border border-gray-100 group" 
               onClick={() => navigate('/assignments', { state: { showAllAssignments: true } })}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <FaUser className="text-xl" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2 text-center">Assigned</h3>
            <p className="text-3xl font-bold text-emerald-900">{stats.assigned}</p>
          </div>

          {/* Under Repair */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl cursor-pointer flex flex-col items-center transition-all duration-300 hover:-translate-y-1 border border-gray-100 group" 
               onClick={() => window.location.href = '/repair?status=in-progress'}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-amber-500 to-amber-700 text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <FaWrench className="text-xl" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2 text-center">Under Repair</h3>
            <p className="text-3xl font-bold text-amber-900">{stats.under_repair}</p>
          </div>

          {/* Damaged */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl cursor-pointer flex flex-col items-center transition-all duration-300 hover:-translate-y-1 border border-gray-100 group" 
               onClick={() => navigate('/return', { state: { openDamagedModal: true } })}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-red-500 to-red-700 text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <FaExclamationTriangle className="text-xl" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2 text-center">Damaged</h3>
            <p className="text-3xl font-bold text-red-900">{stats.damaged}</p>
          </div>

          {/* Buyback */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl cursor-pointer flex flex-col items-center transition-all duration-300 hover:-translate-y-1 border border-gray-100 group" 
               onClick={() => navigate('/return', { state: { openBuybackModal: true } })}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-cyan-500 to-cyan-700 text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <FaShoppingCart className="text-xl" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2 text-center">Buyback</h3>
            <p className="text-3xl font-bold text-cyan-900">{stats.buyback_count}</p>
          </div>

          {/* Auction */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl cursor-pointer flex flex-col items-center transition-all duration-300 hover:-translate-y-1 border border-gray-100 group" 
               onClick={() => navigate('/auction', { state: { openViewAllModal: true } })}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-violet-500 to-violet-700 text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <FaGavel className="text-xl" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2 text-center">Auction</h3>
            <p className="text-3xl font-bold text-violet-900">{stats.auctioned}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 font-medium">Loading dashboard data...</p>
          </div>
        </div>
      )}

      {/* Charts and Activities Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {/* Inventory Chart */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Inventory Overview</h3>
            <div className="text-sm text-gray-500">Asset Distribution</div>
          </div>
          <div className="h-96">
            {chartData ? (
              <Pie data={chartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="h-full">
          <RecentActivities />
        </div>
      </div>

      {/* Modal for Asset Details */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                  <FaFilter className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Assets {selectedStatus ? `- ${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}` : ''}
                  </h3>
                  <p className="text-sm text-gray-500">Filter and view asset details</p>
                </div>
              </div>
              <button 
                onClick={closeModal}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200"
              >
                <FaTimes className="text-gray-500" />
              </button>
            </div>

            {/* Filter Section */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-4">
                <label htmlFor="assetTypeFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Filter by Type:
                </label>
                <select
                  id="assetTypeFilter"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                >
                  <option value="">All Types</option>
                  <option value="Printer">Printer</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Scanner">Scanner</option>
                  <option value="Monitor">Monitor</option>
                </select>
                <button 
                  onClick={downloadPDF}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium text-sm flex items-center space-x-2"
                >
                  <FaDownload className="text-xs" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 overflow-hidden p-6">
              {loadingAssets ? (
                <div className="flex items-center justify-center h-64">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 font-medium">Loading assets...</p>
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-auto">
                  {filteredAssets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <FaDatabase className="text-gray-400 text-2xl" />
                      </div>
                      <p className="text-gray-500 font-medium">No assets found</p>
                      <p className="text-gray-400 text-sm">Try adjusting your filter criteria</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {filteredAssets.map((asset, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:bg-gray-100 transition-colors duration-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(asset).map(([key, value]) => (
                              <div key={key} className="flex flex-col">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  {key.replace(/_/g, ' ')}
                                </span>
                                <span className="text-sm text-gray-900 font-medium">
                                  {value ? value.toString() : '-'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ViewAllAssignmentsModal 
        isOpen={assignmentsModalOpen} 
        onClose={() => setAssignmentsModalOpen(false)} 
      />

      {showAllAssetsModal && (
        <AllAssetsModal 
          onClose={() => setShowAllAssetsModal(false)}
          stockOnly={isStockOnlyModal}
        />
      )}
    </div>
  );
}

export default Dashboard;