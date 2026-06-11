import React from 'react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    return (
        <div className="pagination-controls">
            <button
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                PREVIOUS
            </button>
            <div className="page-indicator">
                <span>PAGE</span>
                <span style={{ color: '#c9a84c', fontWeight: 800 }}>{currentPage}</span>
                <span>OF</span>
                <span>{totalPages}</span>
            </div>
            <button
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                NEXT
            </button>
        </div>
    );
}
