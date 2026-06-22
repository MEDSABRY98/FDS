import { Search, Info, Replace } from "lucide-react";

export function DatabaseToolbar({ searchTerm, setSearchTerm, recordCount, loading, onReplace }) {
    return (
        <div className="data-toolbar">
            <div className="search-wrap">
                <input
                    type="text"
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={20} style={{ position: 'absolute', right: '25px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
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
                {!loading && (
                    <div className="record-count" style={{ display: 'flex', alignItems: 'center', gap: '5px', margin: 0 }}>
                        <Info size={14} />
                        <span>SHOWING {recordCount} RECORDS</span>
                    </div>
                )}
            </div>
        </div>
    );
}
