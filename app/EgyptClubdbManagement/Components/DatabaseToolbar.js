import { Search, Plus } from "lucide-react";

export function DatabaseToolbar({ searchTerm, setSearchTerm, recordCount, loading, onAdd, selectedTable, currentPage, totalPages }) {
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
                    <button
                        onClick={onAdd}
                        style={{
                            background: '#c9a84c',
                            color: '#000',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: '800',
                            cursor: 'pointer',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 10px rgba(201,168,76,0.2)',
                            fontFamily: 'Space Mono, monospace'
                        }}
                    >
                        <Plus size={14} />
                        ADD RECORD
                    </button>
                )}
            </div>
        </div>
    );
}
