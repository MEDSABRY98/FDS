"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import "./alahly_db_media_tracker.css";
import { AlAhlyService } from "./alahly_db_service";
import { Save, Edit2, CheckCircle2, ChevronDown, Search } from "lucide-react";

// Custom Premium Searchable Dropdown Component
function SearchableDropdown({ value, onChange, options, placeholder, width = "220px" }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = useMemo(() => {
        if (!search) return options;
        return options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
    }, [options, search]);

    return (
        <div className="mt-dropdown-container" ref={dropdownRef} style={{ position: 'relative', width, flex: 'none' }}>
            <div 
                className={`mt-search-input mt-dropdown-header ${isOpen ? 'mt-dropdown-open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 25px' }}
            >
                <div style={{ opacity: value ? 1 : 0.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: value ? '#000' : 'inherit' }}>
                    {value || placeholder}
                </div>
                <ChevronDown size={16} style={{ color: '#c9a84c', transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </div>

            {isOpen && (
                <div className="mt-dropdown-menu">
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '15px', top: '16px', color: '#aaa' }} />
                        <input 
                            type="text" 
                            className="mt-dropdown-search"
                            placeholder="Type to search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="mt-dropdown-list mt-custom-scrollbar">
                        <div 
                            className={`mt-dropdown-item ${value === "" ? 'mt-dropdown-selected' : ''}`}
                            onClick={() => { onChange(""); setIsOpen(false); setSearch(""); }}
                        >
                            <span style={{ fontWeight: 800 }}>Show All</span>
                        </div>
                        {filteredOptions.length === 0 ? (
                            <div className="mt-dropdown-item" style={{ opacity: 0.5, cursor: 'default' }}>No results found</div>
                        ) : (
                            filteredOptions.map(opt => (
                                <div 
                                    key={opt}
                                    className={`mt-dropdown-item ${value === opt ? 'mt-dropdown-selected' : ''}`}
                                    onClick={() => { onChange(opt); setIsOpen(false); setSearch(""); }}
                                >
                                    {opt}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AlAhlyMediaTracker({ matches, mediaTrackerData, onDataChange }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [mediaStatusFilter, setMediaStatusFilter] = useState("");
    const [champFilter, setChampFilter] = useState("");
    const [seasonFilter, setSeasonFilter] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [savedId, setSavedId] = useState(null);

    const uniqueChampions = useMemo(() => {
        const champs = new Set();
        (matches || []).forEach(m => {
            if (m.CHAMPION && m.CHAMPION.trim() !== "Unknown") champs.add(m.CHAMPION.trim());
        });
        return Array.from(champs).sort();
    }, [matches]);

    const uniqueSeasons = useMemo(() => {
        const seasons = new Set();
        (matches || []).forEach(m => {
            if (m["SEASON - NUMBER"] && String(m["SEASON - NUMBER"]).trim() !== "Unknown") seasons.add(String(m["SEASON - NUMBER"]).trim());
        });
        return Array.from(seasons).sort();
    }, [matches]);

    // Merge match data with media tracker data
    const combinedData = useMemo(() => {
        const matchesMap = new Map();
        (matches || []).forEach(m => {
            matchesMap.set(String(m.MATCH_ID).trim(), m);
        });

        let list = (mediaTrackerData || []).map(mt => {
            const mId = String(mt.MATCH_ID || "").trim();
            const matchInfo = matchesMap.get(mId) || {};
            return {
                ...mt,
                matchInfo
            };
        });

        if (champFilter) {
            list = list.filter(item => String(item.matchInfo.CHAMPION || "").trim() === champFilter);
        }
        if (seasonFilter) {
            list = list.filter(item => String(item.matchInfo["SEASON - NUMBER"] || "").trim() === seasonFilter);
        }

        if (mediaStatusFilter) {
            list = list.filter(item => {
                const isFull = item["FULL MATCH"] === "YES";
                const isHigh = item["HIGHLIGHT"] === "YES";

                if (mediaStatusFilter === "Have Both") return isFull && isHigh;
                if (mediaStatusFilter === "Only Full Match") return isFull && !isHigh;
                if (mediaStatusFilter === "Only Highlight") return !isFull && isHigh;
                if (mediaStatusFilter === "Missing Both") return !isFull && !isHigh;
                if (mediaStatusFilter === "Missing Full Match") return !isFull;
                if (mediaStatusFilter === "Missing Highlight") return !isHigh;
                
                return true;
            });
        }

        // Search logic
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            list = list.filter(item => {
                const opp = String(item.matchInfo["OPPONENT TEAM"] || "").toLowerCase();
                const notes = String(item.NOTES || "").toLowerCase();
                const mId = String(item.MATCH_ID || "").toLowerCase();
                return opp.includes(lowerSearch) || notes.includes(lowerSearch) || mId.includes(lowerSearch);
            });
        }

        return list.sort((a, b) => {
            const dateA = a.matchInfo.DATE ? new Date(a.matchInfo.DATE) : new Date(0);
            const dateB = b.matchInfo.DATE ? new Date(b.matchInfo.DATE) : new Date(0);
            return dateB - dateA;
        });
    }, [matches, mediaTrackerData, searchTerm, champFilter, seasonFilter, mediaStatusFilter]);

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, champFilter, seasonFilter, mediaStatusFilter]);

    const paginatedData = useMemo(() => {
        return combinedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    }, [combinedData, currentPage]);

    const totalPages = Math.ceil(combinedData.length / pageSize);

    const handleEdit = (mt) => {
        setEditingId(mt.ROW_ID);
        setEditForm({
            "FULL MATCH": mt["FULL MATCH"] || "",
            "COUNT FULL MATCH": mt["COUNT FULL MATCH"] || "",
            "HIGHLIGHT": mt.HIGHLIGHT || "",
            "COUNT HIGHLIGHT": mt["COUNT HIGHLIGHT"] || "",
            "MEDIA PATH": mt["MEDIA PATH"] || "",
            "NOTES": mt.NOTES || ""
        });
    };

    const handleSave = async (rowId) => {
        setSaving(true);
        try {
            await AlAhlyService.updateMediaRecord(rowId, editForm);
            if (onDataChange) await onDataChange(true);
            setEditingId(null);
            setSavedId(rowId);
            setTimeout(() => setSavedId(null), 3000);
        } catch (error) {
            alert("Failed to save record.");
        }
        setSaving(false);
    };

    const handleChange = (e, field) => {
        setEditForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    return (
        <div className="mt-fade-in" id="mt-tab-media-tracker">
            <div className="mt-wrapper">
                <div className="mt-header-container">
                    <div className="mt-section-title">AL AHLY <span className="mt-accent">MEDIA TRACKER</span></div>
                </div>
                <div className="mt-gold-line"></div>
                
                <div className="mt-controls">
                    <div className="mt-search-wrap" style={{ display: 'flex', gap: '20px', width: '100%', maxWidth: '1200px', flexWrap: 'nowrap', justifyContent: 'center' }}>
                        <input 
                            type="text" 
                            placeholder="Type opponent, Match ID, or notes..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="mt-search-input" 
                            style={{ width: '320px', flex: 'none', paddingLeft: '45px', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'18\' height=\'18\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23aaaaaa\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Ccircle cx=\'11\' cy=\'11\' r=\'8\'%3E%3C/circle%3E%3Cline x1=\'21\' y1=\'21\' x2=\'16.65\' y2=\'16.65\'%3E%3C/line%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: '15px center' }}
                        />
                        <SearchableDropdown 
                            value={mediaStatusFilter} 
                            onChange={setMediaStatusFilter} 
                            options={[
                                "Have Both",
                                "Only Full Match",
                                "Only Highlight",
                                "Missing Both",
                                "Missing Full Match",
                                "Missing Highlight"
                            ]} 
                            placeholder="Media Status"
                            width="230px"
                        />
                        <SearchableDropdown 
                            value={champFilter} 
                            onChange={setChampFilter} 
                            options={uniqueChampions} 
                            placeholder="Select Champion"
                            width="230px"
                        />
                        <SearchableDropdown 
                            value={seasonFilter} 
                            onChange={setSeasonFilter} 
                            options={uniqueSeasons} 
                            placeholder="Select Season"
                            width="230px"
                        />
                    </div>
                </div>

                <div className="mt-table-container">
                    <table className="mt-modern-table mt-fade-in">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>#</th>
                                <th style={{ width: '200px' }}>MATCH INFO</th>
                                <th style={{ width: '150px' }}>SEASON</th>
                                <th>FULL MATCH</th>
                                <th style={{ width: '60px' }}>COUNT</th>
                                <th>HIGHLIGHT</th>
                                <th style={{ width: '60px' }}>COUNT</th>
                                <th style={{ width: '200px' }}>MEDIA PATH</th>
                                <th>NOTES</th>
                                <th style={{ width: '80px', textAlign: 'center' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.length === 0 ? (
                                <tr><td colSpan="10" style={{ padding: '100px', opacity: 0.4 }}>No media tracker records found.</td></tr>
                            ) : (
                                paginatedData.map((item, i) => {
                                    const actualIndex = (currentPage - 1) * pageSize + i;
                                    const isEditing = editingId === item.ROW_ID;
                                    
                                    return (
                                        <tr key={item.ROW_ID} className={isEditing ? 'mt-editing-row' : ''}>
                                            <td><span className="mt-rank-badge">{actualIndex + 1}</span></td>
                                            <td>
                                                <div className="mt-match-info">
                                                    <div className="mt-text-opp">{item.matchInfo["OPPONENT TEAM"] || "N/A"}</div>
                                                    <div className="mt-text-date">{item.matchInfo.DATE || "N/A"}</div>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--gold)' }}>{item.matchInfo["SEASON - NAME"] || "N/A"}</td>
                                            
                                            {/* FULL MATCH */}
                                            <td>
                                                {isEditing ? (
                                                    <select className="mt-cell-input mt-center-text" value={editForm["FULL MATCH"]} onChange={(e) => handleChange(e, "FULL MATCH")}>
                                                        <option value="">-</option>
                                                        <option value="YES">YES</option>
                                                    </select>
                                                ) : (
                                                    <span style={{ 
                                                        color: item["FULL MATCH"] === "YES" ? "#2ecc71" : "inherit",
                                                        fontWeight: item["FULL MATCH"] === "YES" ? "800" : "600"
                                                    }}>
                                                        {item["FULL MATCH"] || "-"}
                                                    </span>
                                                )}
                                            </td>

                                            {/* COUNT FULL MATCH */}
                                            <td>
                                                {isEditing ? (
                                                    <input type="text" className="mt-cell-input mt-center-text" value={editForm["COUNT FULL MATCH"]} onChange={(e) => handleChange(e, "COUNT FULL MATCH")} />
                                                ) : (
                                                    <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{item["COUNT FULL MATCH"] || "-"}</span>
                                                )}
                                            </td>

                                            {/* HIGHLIGHT */}
                                            <td>
                                                {isEditing ? (
                                                    <select className="mt-cell-input mt-center-text" value={editForm["HIGHLIGHT"]} onChange={(e) => handleChange(e, "HIGHLIGHT")}>
                                                        <option value="">-</option>
                                                        <option value="YES">YES</option>
                                                    </select>
                                                ) : (
                                                    <span style={{ 
                                                        color: item["HIGHLIGHT"] === "YES" ? "#2ecc71" : "inherit",
                                                        fontWeight: item["HIGHLIGHT"] === "YES" ? "800" : "600"
                                                    }}>
                                                        {item["HIGHLIGHT"] || "-"}
                                                    </span>
                                                )}
                                            </td>

                                            {/* COUNT HIGHLIGHT */}
                                            <td>
                                                {isEditing ? (
                                                    <input type="text" className="mt-cell-input mt-center-text" value={editForm["COUNT HIGHLIGHT"]} onChange={(e) => handleChange(e, "COUNT HIGHLIGHT")} />
                                                ) : (
                                                    <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{item["COUNT HIGHLIGHT"] || "-"}</span>
                                                )}
                                            </td>

                                            {/* MEDIA PATH */}
                                            <td>
                                                {isEditing ? (
                                                    <input type="text" className="mt-cell-input" value={editForm["MEDIA PATH"]} onChange={(e) => handleChange(e, "MEDIA PATH")} placeholder="/vids/..." />
                                                ) : (
                                                    <span className="mt-truncate-text" title={item["MEDIA PATH"] || ""}>{item["MEDIA PATH"] || "-"}</span>
                                                )}
                                            </td>

                                            {/* NOTES */}
                                            <td>
                                                {isEditing ? (
                                                    <input type="text" className="mt-cell-input" value={editForm["NOTES"]} onChange={(e) => handleChange(e, "NOTES")} />
                                                ) : (
                                                    <span className="mt-truncate-text" title={item.NOTES || ""}>{item.NOTES || "-"}</span>
                                                )}
                                            </td>

                                            {/* ACTIONS */}
                                            <td style={{ textAlign: 'center' }}>
                                                {isEditing ? (
                                                    <button 
                                                        className={`mt-action-btn mt-save-btn ${saving ? 'mt-loading' : ''}`}
                                                        onClick={() => handleSave(item.ROW_ID)}
                                                        disabled={saving}
                                                        title="Save Changes"
                                                    >
                                                        <Save size={16} />
                                                    </button>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button 
                                                            className="mt-action-btn mt-edit-btn"
                                                            onClick={() => handleEdit(item)}
                                                            title="Edit Record"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="mt-pagination">
                        <button 
                            className="mt-page-btn" 
                            onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                            disabled={currentPage === 1}
                        >
                            PREV
                        </button>
                        <div className="mt-page-info">
                            PAGE {currentPage} OF {totalPages}
                        </div>
                        <button 
                            className="mt-page-btn" 
                            onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                            disabled={currentPage === totalPages}
                        >
                            NEXT
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
