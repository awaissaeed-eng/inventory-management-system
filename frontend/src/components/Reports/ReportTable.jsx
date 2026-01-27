import React, { useState } from 'react';
import { formatDate } from '../../utils/dateFormatter';
import VoucherPreviewModal from '../VoucherPreviewModal';
import { FileText, Eye } from 'lucide-react';

const ReportTable = ({ assets, advanced, onRowClick }) => {
  const [voucherModal, setVoucherModal] = useState({ isOpen: false, path: '', filename: '' });

  const handleVoucherClick = (voucherPath, voucherFilename) => {
    setVoucherModal({
      isOpen: true,
      path: voucherPath,
      filename: voucherFilename
    });
  };

  const closeVoucherModal = () => {
    setVoucherModal({ isOpen: false, path: '', filename: '' });
  };

  const VoucherButton = ({ voucherPath, filename, onClick }) => (
    <button
      className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-colors duration-200"
      onClick={onClick}
    >
      <FileText className="w-3 h-3 mr-1" />
      {filename}
    </button>
  );

  const StatusBadge = ({ status }) => {
    const getStatusColor = (status) => {
      const normalizedStatus = status?.toLowerCase();
      switch (normalizedStatus) {
        case 'assigned':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'available':
        case 'in stock':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'under repair':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'damaged':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'auctioned':
          return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'returned':
          return 'bg-teal-100 text-teal-800 border-teal-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(status)}`}>
        {status || '-'}
      </span>
    );
  };

  return (
    <>
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Oracle Asset Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Device Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Brand
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Model
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Serial Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Holder
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Status
              </th>
              {advanced && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warranty Expiry
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tender No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignment Date / Return Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Repair History
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auction Details
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assets.length === 0 ? (
              <tr>
                <td 
                  colSpan={advanced ? 15 : 7} 
                  className="px-4 py-8 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center">
                    <Eye className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-lg font-medium">No assets found</p>
                    <p className="text-sm">Try adjusting your filters or search criteria</p>
                  </div>
                </td>
              </tr>
            ) : (
              assets.map(asset => (
                <tr 
                  key={asset.oracle_number} 
                  onClick={() => onRowClick && onRowClick(asset)} 
                  className={`hover:bg-gray-50 transition-colors duration-150 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {asset.oracle_number || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {asset.device_type || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {asset.brand_name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {asset.model_name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                    {asset.serial_number || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {asset.assigned_to ? (
                      <span className="font-medium text-gray-900">{asset.assigned_to}</span>
                    ) : (
                      <span className="text-gray-400 italic">Not Assigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge status={asset.status} />
                  </td>
                  {advanced && (
                    <>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(asset.purchase_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(asset.warranty_expiry)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {asset.vendor_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {asset.tender_no || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {asset.assignment_date 
                          ? formatDate(asset.assignment_date) 
                          : (asset.return_date ? formatDate(asset.return_date) : '-')
                        }
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {asset.repair_history ? (
                          <div className="space-y-2 max-w-sm">
                            {asset.repair_history.map((repair, idx) => (
                              <div key={idx} className="p-3 bg-gray-50 rounded-lg border">
                                <div className="space-y-1 text-xs">
                                  <div><span className="font-medium">Technician:</span> {repair.technician}</div>
                                  <div><span className="font-medium">Cost:</span> {repair.cost}</div>
                                  <div><span className="font-medium">Fixed:</span> 
                                    <span className={`ml-1 px-1 py-0.5 rounded text-xs ${
                                      repair.fixed 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {repair.fixed ? 'Yes' : 'No'}
                                    </span>
                                  </div>
                                  <div><span className="font-medium">Description:</span> {repair.description}</div>
                                  <div className="flex items-center">
                                    <span className="font-medium">Voucher:</span>
                                    {repair.voucher ? (
                                      <div className="ml-2">
                                        <VoucherButton
                                          voucherPath={repair.voucher}
                                          filename={repair.voucher.split('/').pop()}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleVoucherClick(repair.voucher, repair.voucher.split('/').pop());
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <span className="ml-1 text-gray-400">-</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {asset.return_details ? (
                          <div className="p-3 bg-teal-50 rounded-lg border border-teal-200 max-w-sm">
                            <div className="space-y-1 text-xs">
                              <div><span className="font-medium">Type:</span> {asset.return_details.type}</div>
                              <div><span className="font-medium">Date:</span> {formatDate(asset.return_details.date)}</div>
                              <div><span className="font-medium">Notes:</span> {asset.return_details.notes}</div>
                              <div className="flex items-center">
                                <span className="font-medium">Voucher:</span>
                                {asset.return_details.voucher ? (
                                  <div className="ml-2">
                                    <VoucherButton
                                      voucherPath={asset.return_details.voucher}
                                      filename={asset.return_details.voucher.split('/').pop()}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleVoucherClick(asset.return_details.voucher, asset.return_details.voucher.split('/').pop());
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <span className="ml-1 text-gray-400">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {asset.auction_details ? (
                          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 max-w-sm">
                            <div className="space-y-1 text-xs">
                              <div><span className="font-medium">Date:</span> {formatDate(asset.auction_details.date)}</div>
                              <div><span className="font-medium">Price:</span> {asset.auction_details.price}</div>
                              <div><span className="font-medium">Status:</span> {asset.auction_details.status}</div>
                              {asset.auction_details.voucher && (
                                <div className="flex items-center">
                                  <span className="font-medium">Voucher:</span>
                                  <div className="ml-2">
                                    <VoucherButton
                                      voucherPath={asset.auction_details.voucher}
                                      filename={asset.auction_details.voucher.split('/').pop()}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleVoucherClick(asset.auction_details.voucher, asset.auction_details.voucher.split('/').pop());
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {voucherModal.isOpen && (
        <VoucherPreviewModal
          voucherPath={voucherModal.path}
          voucherFilename={voucherModal.filename}
          onClose={closeVoucherModal}
        />
      )}
    </>
  );
};

export default ReportTable;