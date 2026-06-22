import { Search, Plus, Replace } from "lucide-react";

export function DatabaseToolbar({ searchTerm, setSearchTerm, recordCount, loading, onAdd, onReplace, selectedTable, currentPage, totalPages }) {
    return (
        <div className="data-toolbar">
            {/* Search bar */}
            <div className="search-wrap">
                <input
                    type="text"
                    placeholder="SEARCH RECORD..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Record count + Add button row */}
            <div className="record-count" style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {!loading && (
                    <span>{recordCount} RECORDS FOUND (PAGE {currentPage} OF {totalPages || 1})</span>
                )}
                {selectedTable && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={onReplace}
                            title="REPLACE TEXT"
                            style={{
                                background: 'transparent',
                                border: '2px solid #c9a84c',
                                color: '#c9a84c',
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 10px rgba(201,168,76,0.05)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(201,168,76,0.1)';
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            <Replace size={16} />
                        </button>
                        <button
                            onClick={onAdd}
                            title="ADD RECORD"
                            style={{
                                background: '#c9a84c',
                                color: '#000',
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 10px rgba(201,168,76,0.2)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#b8943e';
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#c9a84c';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
