

const AssetFilters = ({ search, setSearch }) => (
  <div className="asset-filters">
    <input
      type="text"
      placeholder="Search by Oracle number, type, or device name..."
      value={search}
      onChange={e => setSearch(e.target.value)}
      className="filter-input"
    />
  </div>
);

export default AssetFilters;
