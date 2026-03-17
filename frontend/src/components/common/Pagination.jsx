import React from 'react';

function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded-md disabled:opacity-50"
        style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}
      >
        Previous
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded-md ${page === currentPage ? '' : ''}`}
          style={page === currentPage
            ? { background: 'var(--color-primary)', color: 'var(--color-bg)' }
            : { background: 'var(--color-secondary)', color: 'var(--color-text)' }}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded-md disabled:opacity-50"
        style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}
      >
        Next
      </button>
    </div>
  );
}

export default Pagination;