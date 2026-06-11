import { Search, Info } from "lucide-react";

export function DatabaseToolbar({ searchTerm, setSearchTerm, recordCount, loading }) {
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
            {!loading && (
                <div className="record-count">
                    <Info size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }} />
                    SHOWING {recordCount} RECORDS
                </div>
            )}
        </div>
    );
}
