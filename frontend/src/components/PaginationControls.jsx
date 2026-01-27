import React from 'react';


const PaginationControls = ({ page, setPage, totalPages }) => (
  <div className="pagination-controls">
    <button
      onClick={() => setPage(p => Math.max(1, p - 1))}
      disabled={page === 1}
    >
      Previous
    </button>
    <span>Page {page} of {totalPages}</span>
    <button
      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
      disabled={page === totalPages}
    >
      Next
    </button>
  </div>
);

export default PaginationControls;
