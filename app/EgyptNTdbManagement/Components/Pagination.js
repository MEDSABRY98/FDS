export function Pagination({ currentPage, setCurrentPage, totalPages }) {
    if (totalPages <= 1) return null;

    return (
        <div className="pagination-controls">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>PREVIOUS</button>
            <div className="page-indicator">PAGE {currentPage} OF {totalPages}</div>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>NEXT</button>
        </div>
    );
}
