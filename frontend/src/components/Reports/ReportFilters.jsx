import React from 'react';

const ReportFilters = ({ search, setSearch, statusFilter, setStatusFilter }) => (
  <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-6">
    <input
      type="text"
      placeholder="Search by Oracle Asset Number, Model, Type, Serial Number..."
      value={search}
      onChange={e => setSearch(e.target.value)}
      className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-gray-900"
    />
    <select
      value={statusFilter}
      onChange={e => setStatusFilter(e.target.value)}
      className="w-full md:w-1/4 mt-4 md:mt-0 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-gray-900"
    >
      <option>All Status</option>
      <option>New</option>
      <option>Assigned</option>
      <option>Damaged</option>
      <option>Under Repair</option>
      <option>Used</option>
      <option>Buyback</option>
      <option>Auctioned</option>
    </select>
  </div>
);

export default ReportFilters;
